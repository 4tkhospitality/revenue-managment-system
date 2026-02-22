/**
 * PayPal Activate Subscription — API Route
 *
 * POST /api/payments/paypal/activate
 * Body: { hotelId, tier, roomBand, paypalSubscriptionId }
 *
 * Called after user approves PayPal subscription.
 * P1: Re-fetches subscription details from PayPal API (not trusted from client).
 * GLC-05: PayPal API call outside transaction, DB update inside.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PlanTier, RoomBand } from '@prisma/client';
import { generateOrderId, getPriceUSD, PENDING_EXPIRY_MS } from '@/lib/payments/constants';
import { getSubscriptionDetails } from '@/lib/payments/paypal';
import { applySubscriptionChange } from '@/lib/payments/activation';
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
        const { hotelId, tier, roomBand, paypalSubscriptionId } = body as {
            hotelId: string;
            tier: PlanTier;
            roomBand: RoomBand;
            paypalSubscriptionId: string;
        };

        if (!hotelId || !tier || !roomBand || !paypalSubscriptionId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (tier === 'STANDARD') {
            return NextResponse.json({ error: 'Cannot purchase STANDARD tier' }, { status: 400 });
        }

        // 3. GLC-07: Provider switching block
        const currentSub = await prisma.subscription.findUnique({
            where: { hotel_id: hotelId },
        });
        if (
            currentSub?.status === 'ACTIVE' &&
            currentSub.external_provider &&
            currentSub.external_provider !== 'PAYPAL'
        ) {
            return NextResponse.json(
                {
                    error: `You have an active subscription via ${currentSub.external_provider}. Please cancel first or manage at /settings/billing.`,
                },
                { status: 409 }
            );
        }

        // 4. P1: Re-fetch subscription from PayPal API (GLC-05: outside transaction)
        const paypalSub = await getSubscriptionDetails(paypalSubscriptionId);

        if (paypalSub.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: `PayPal subscription status: ${paypalSub.status}. Expected ACTIVE.` },
                { status: 400 }
            );
        }

        // Period end from PayPal (NEVER hardcode +30d)
        const periodEnd = paypalSub.billing_info.next_billing_time
            ? new Date(paypalSub.billing_info.next_billing_time)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Fallback only

        const now = new Date();
        const amount = getPriceUSD(tier, roomBand);
        const orderId = generateOrderId(hotelId);

        // 5. DB Transaction: create COMPLETED tx + activate subscription
        await prisma.$transaction(async (tx) => {
            // Create PaymentTransaction as COMPLETED
            await tx.paymentTransaction.create({
                data: {
                    hotel_id: hotelId,
                    user_id: userId,
                    gateway: 'PAYPAL',
                    order_id: orderId,
                    gateway_transaction_id: paypalSubscriptionId,
                    amount,
                    currency: 'USD',
                    status: 'COMPLETED',
                    completed_at: now,
                    purchased_tier: tier,
                    purchased_room_band: roomBand,
                    provider_customer_ref: paypalSub.subscriber?.email_address || null,
                    description: `PayPal subscription ${tier} - Band ${roomBand}`,
                },
            });

            // Apply subscription change
            await applySubscriptionChange(tx, hotelId, userId, {
                periodStart: now,
                periodEnd,
                provider: 'PAYPAL',
                plan: tier,
                roomBand,
                externalSubscriptionId: paypalSubscriptionId,
            });
        });

        // 6. Track PLG event
        trackEvent({
            event: 'payment_success',
            userId,
            hotelId,
            properties: {
                gateway: 'PAYPAL',
                tier,
                amount,
                currency: 'USD',
                orderId,
                paypalSubscriptionId,
            },
        });

        return NextResponse.json({
            ok: true,
            plan: tier,
            periodEnd: periodEnd.toISOString(),
        });
    } catch (err: unknown) {
        // GLC-04: Catch unique violation (duplicate activation)
        if (
            err &&
            typeof err === 'object' &&
            'code' in err &&
            (err as { code: string }).code === 'P2002'
        ) {
            return NextResponse.json({ ok: true, status: 'already_activated' });
        }
        console.error('[PayPal Activate]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
