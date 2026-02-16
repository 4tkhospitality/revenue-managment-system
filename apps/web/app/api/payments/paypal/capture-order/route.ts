/**
 * PayPal Capture Order — API Route (One-Time Payment)
 *
 * POST /api/payments/paypal/capture-order
 * Body: { paypalOrderId }
 *
 * Called after user approves on PayPal.
 * Captures the payment and activates the subscription.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { capturePayPalOrder } from '@/lib/payments/paypal';
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
        const { paypalOrderId } = body as { paypalOrderId: string };

        if (!paypalOrderId) {
            return NextResponse.json({ error: 'Missing paypalOrderId' }, { status: 400 });
        }

        // 3. Find PENDING transaction by gateway_transaction_id
        const pendingTx = await prisma.paymentTransaction.findFirst({
            where: {
                gateway: 'PAYPAL',
                gateway_transaction_id: paypalOrderId,
                status: 'PENDING',
            },
        });

        if (!pendingTx) {
            return NextResponse.json(
                { error: 'Không tìm thấy giao dịch đang chờ. Có thể đã hết hạn.' },
                { status: 404 }
            );
        }

        // 4. Capture on PayPal (outside transaction — GLC-05)
        const capture = await capturePayPalOrder(paypalOrderId);

        if (capture.status !== 'COMPLETED') {
            await prisma.paymentTransaction.update({
                where: { id: pendingTx.id },
                data: {
                    status: 'FAILED',
                    failed_at: new Date(),
                    failed_reason: `PayPal capture status: ${capture.status}`,
                },
            });
            return NextResponse.json(
                { error: `PayPal capture failed: ${capture.status}` },
                { status: 400 }
            );
        }

        // 5. Calculate period based on term
        const termMonths = pendingTx.description?.includes('3 tháng') ? 3 : 1;
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + termMonths);

        // 6. DB Transaction: update tx + activate subscription
        await prisma.$transaction(async (tx) => {
            // Mark transaction as COMPLETED
            await tx.paymentTransaction.update({
                where: { id: pendingTx.id },
                data: {
                    status: 'COMPLETED',
                    completed_at: new Date(),
                    provider_customer_ref: capture.payerEmail,
                },
            });

            // Apply subscription change — only if hotel exists (pay-first flow: hotel_id is null)
            if (pendingTx.hotel_id) {
                await applySubscriptionChange(tx, pendingTx.hotel_id, userId, {
                    periodStart: new Date(),
                    periodEnd,
                    provider: 'PAYPAL',
                    plan: pendingTx.purchased_tier!,
                    roomBand: pendingTx.purchased_room_band!,
                });
            }
        });

        // 7. Track event
        trackEvent({
            event: 'payment_success',
            userId,
            hotelId: pendingTx.hotel_id || undefined,
            properties: {
                gateway: 'PAYPAL',
                mode: 'one-time',
                tier: pendingTx.purchased_tier,
                amount: capture.amount,
                currency: capture.currency,
                captureId: capture.captureId,
                payerEmail: capture.payerEmail,
            },
        });

        return NextResponse.json({
            ok: true,
            plan: pendingTx.purchased_tier,
            periodEnd: periodEnd.toISOString(),
            amount: capture.amount,
            currency: capture.currency,
        });
    } catch (err: unknown) {
        // Idempotency: P2002 = already captured
        if (
            err &&
            typeof err === 'object' &&
            'code' in err &&
            (err as { code: string }).code === 'P2002'
        ) {
            return NextResponse.json({ ok: true, status: 'already_captured' });
        }
        console.error('[PayPal Capture Order]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
