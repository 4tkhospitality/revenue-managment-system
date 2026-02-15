/**
 * SePay Create Checkout — API Route
 *
 * POST /api/payments/sepay/create-checkout
 * Body: { hotelId, tier, roomBand }
 *
 * GLC-05: DB transaction is SHORT (no external API calls inside)
 * GLC-04: Catches P2002 unique violation for idempotency
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PlanTier, RoomBand } from '@prisma/client';
import { generateOrderId, PENDING_EXPIRY_MS } from '@/lib/payments/constants';
import { getPrice } from '@/lib/plg/plan-config';
import { buildSepayCheckoutUrl } from '@/lib/payments/sepay';
import { trackEvent } from '@/lib/payments/trackEvent';

export async function POST(req: Request) {
    try {
        // 1. Auth check
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = (session.user as { id: string }).id;

        // 2. Parse body
        const body = await req.json();
        const { hotelId, tier, roomBand } = body as {
            hotelId: string;
            tier: PlanTier;
            roomBand: RoomBand;
        };

        if (!hotelId || !tier || !roomBand) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate tier is upgradable (not STANDARD)
        if (tier === 'STANDARD') {
            return NextResponse.json({ error: 'Cannot purchase STANDARD tier' }, { status: 400 });
        }

        // 3. GLC-07: Check provider switching — block if active via different provider
        const currentSub = await prisma.subscription.findUnique({
            where: { hotel_id: hotelId },
        });
        if (
            currentSub?.status === 'ACTIVE' &&
            currentSub.external_provider &&
            currentSub.external_provider !== 'SEPAY'
        ) {
            return NextResponse.json(
                {
                    error: `Bạn đang có subscription qua ${currentSub.external_provider}. Vui lòng hủy trước hoặc quản lý tại /settings/billing.`,
                },
                { status: 409 }
            );
        }

        // 4. DB Transaction: concurrent lock + create PENDING (GLC-05: short tx)
        const amount = getPrice(tier, roomBand);
        const orderId = generateOrderId(hotelId);
        const expiresAt = new Date(Date.now() + PENDING_EXPIRY_MS);

        const pendingTx = await prisma.$transaction(async (tx) => {
            // Check existing PENDING for this hotel (concurrent lock)
            const existingPending = await tx.paymentTransaction.findFirst({
                where: {
                    hotel_id: hotelId,
                    status: 'PENDING',
                    gateway: 'SEPAY',
                },
            });

            if (existingPending) {
                // Auto-expire if past expires_at
                if (existingPending.expires_at && existingPending.expires_at < new Date()) {
                    await tx.paymentTransaction.update({
                        where: { id: existingPending.id },
                        data: {
                            status: 'FAILED',
                            failed_at: new Date(),
                            failed_reason: 'auto_expired',
                        },
                    });
                } else {
                    // Active PENDING exists — reject
                    throw new Error('PENDING_EXISTS');
                }
            }

            // Create new PENDING transaction
            return tx.paymentTransaction.create({
                data: {
                    hotel_id: hotelId,
                    user_id: userId,
                    gateway: 'SEPAY',
                    order_id: orderId,
                    amount,
                    currency: 'VND',
                    status: 'PENDING',
                    purchased_tier: tier,
                    purchased_room_band: roomBand,
                    expires_at: expiresAt,
                    description: `Nâng cấp gói ${tier} - Band ${roomBand}`,
                },
            });
        });

        // 5. Build checkout URL (OUTSIDE transaction — GLC-05)
        const checkoutUrl = buildSepayCheckoutUrl({
            orderId,
            amount,
            description: orderId,
        });

        // 6. Track PLG event
        trackEvent({
            event: 'payment_method_selected',
            userId,
            hotelId,
            properties: { method: 'SEPAY', tier, roomBand, amount, currency: 'VND' },
        });

        return NextResponse.json({
            orderId,
            amount,
            checkoutUrl,
            expiresAt: expiresAt.toISOString(),
            transactionId: pendingTx.id,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        if (message === 'PENDING_EXISTS') {
            return NextResponse.json(
                { error: 'Bạn đã có giao dịch đang chờ xử lý. Vui lòng hoàn tất hoặc chờ hết hạn.' },
                { status: 409 }
            );
        }
        console.error('[SePay Create Checkout]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
