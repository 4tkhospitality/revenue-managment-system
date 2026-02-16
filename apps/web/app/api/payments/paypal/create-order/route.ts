/**
 * PayPal Create Order — API Route (One-Time Payment)
 *
 * POST /api/payments/paypal/create-order
 * Body: { hotelId, tier, roomBand, billingCycle? }
 *
 * Creates a PayPal order with dynamic USD pricing.
 * User approves on PayPal → return to capture endpoint.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PlanTier, RoomBand } from '@prisma/client';
import { generateOrderId, getPriceUSD, PENDING_EXPIRY_MS } from '@/lib/payments/constants';
import { createPayPalOrder } from '@/lib/payments/paypal';
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
        const { hotelId, tier, roomBand, billingCycle = 'monthly' } = body as {
            hotelId: string;
            tier: PlanTier;
            roomBand: RoomBand;
            billingCycle?: 'monthly' | '3-months';
        };

        if (!hotelId || !tier || !roomBand) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (tier === 'STANDARD') {
            return NextResponse.json({ error: 'Cannot purchase STANDARD tier' }, { status: 400 });
        }

        // 3. Provider switching block
        const currentSub = await prisma.subscription.findUnique({
            where: { hotel_id: hotelId },
        });
        if (
            currentSub?.status === 'ACTIVE' &&
            currentSub.external_provider &&
            currentSub.external_provider !== 'PAYPAL'
        ) {
            return NextResponse.json(
                { error: `Bạn đang có subscription qua ${currentSub.external_provider}. Vui lòng hủy trước.` },
                { status: 409 }
            );
        }

        // 4. Calculate USD price with billing cycle
        const monthlyPriceUSD = getPriceUSD(tier, roomBand);
        const amount = billingCycle === '3-months'
            ? Math.round(monthlyPriceUSD * 0.5 * 3 * 100) / 100   // 50% discount × 3 months
            : monthlyPriceUSD;
        const termMonths = billingCycle === '3-months' ? 3 : 1;
        const orderId = generateOrderId(hotelId);
        const expiresAt = new Date(Date.now() + PENDING_EXPIRY_MS);

        // 5. Auto-cancel existing PENDING PayPal orders
        const existingPending = await prisma.paymentTransaction.findFirst({
            where: { hotel_id: hotelId, status: 'PENDING', gateway: 'PAYPAL' },
        });
        if (existingPending) {
            await prisma.paymentTransaction.update({
                where: { id: existingPending.id },
                data: {
                    status: 'FAILED',
                    failed_at: new Date(),
                    failed_reason: existingPending.expires_at && existingPending.expires_at < new Date()
                        ? 'auto_expired'
                        : 'superseded_by_new_order',
                },
            });
        }

        // 6. Create PayPal order via API
        const { paypalOrderId, approvalUrl } = await createPayPalOrder({
            orderId,
            amount,
            description: `4TK Hospitality - ${tier} Plan (${termMonths} month${termMonths > 1 ? 's' : ''})`,
            hotelId,
        });

        // 7. Save PENDING transaction
        await prisma.paymentTransaction.create({
            data: {
                hotel_id: hotelId,
                user_id: userId,
                gateway: 'PAYPAL',
                order_id: orderId,
                gateway_transaction_id: paypalOrderId,
                amount,
                currency: 'USD',
                status: 'PENDING',
                purchased_tier: tier,
                purchased_room_band: roomBand,
                expires_at: expiresAt,
                description: `PayPal one-time ${tier} - Band ${roomBand} - ${termMonths} tháng`,
            },
        });

        // 8. Track event
        trackEvent({
            event: 'payment_method_selected',
            userId,
            hotelId,
            properties: { method: 'PAYPAL', mode: 'one-time', tier, roomBand, amount, currency: 'USD', billingCycle },
        });

        return NextResponse.json({
            orderId,
            paypalOrderId,
            approvalUrl,
            amount,
            currency: 'USD',
            expiresAt: expiresAt.toISOString(),
        });
    } catch (err) {
        console.error('[PayPal Create Order]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
