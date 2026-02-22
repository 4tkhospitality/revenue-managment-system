/**
 * PayPal Capture Order — API Route (One-Time Payment)
 *
 * POST /api/payments/paypal/capture-order
 * Body: { paypalOrderId }
 *
 * Called after user approves on PayPal.
 * Captures the payment and activates the subscription.
 * 
 * 🔧 VERBOSE LOGGING for live debugging — remove after stable
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { capturePayPalOrder } from '@/lib/payments/paypal';
import { applySubscriptionChange } from '@/lib/payments/activation';
import { trackEvent } from '@/lib/payments/trackEvent';
import { notifyPaymentConfirmed } from '@/lib/telegram';

const TAG = '[PayPal Capture Order]';

export async function POST(req: Request) {
    console.log(`${TAG} ━━━━━━━━━━ START ━━━━━━━━━━`);
    try {
        // 1. Auth check
        console.log(`${TAG} Step 1: Auth check...`);
        const session = await auth();
        if (!session?.user) {
            console.error(`${TAG} ❌ Unauthorized — no session`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = (session.user as { id: string }).id;
        console.log(`${TAG} ✅ Auth OK — userId: ${userId}`);

        // 2. Parse body
        console.log(`${TAG} Step 2: Parse body...`);
        const body = await req.json();
        const { paypalOrderId } = body as { paypalOrderId: string };
        console.log(`${TAG} paypalOrderId: ${paypalOrderId}`);

        if (!paypalOrderId) {
            console.error(`${TAG} ❌ Missing paypalOrderId`);
            return NextResponse.json({ error: 'Missing paypalOrderId' }, { status: 400 });
        }

        // 3. Find PENDING transaction by gateway_transaction_id
        console.log(`${TAG} Step 3: Finding PENDING transaction...`);
        const pendingTx = await prisma.paymentTransaction.findFirst({
            where: {
                gateway: 'PAYPAL',
                gateway_transaction_id: paypalOrderId,
                status: 'PENDING',
            },
        });

        if (!pendingTx) {
            console.error(`${TAG} ❌ No PENDING transaction found for paypalOrderId=${paypalOrderId}`);
            // Try finding ANY transaction for debugging
            const anyTx = await prisma.paymentTransaction.findFirst({
                where: { gateway: 'PAYPAL', gateway_transaction_id: paypalOrderId },
            });
            if (anyTx) {
                console.log(`${TAG} Found tx with status=${anyTx.status} (not PENDING)`);
                if (anyTx.status === 'COMPLETED') {
                    return NextResponse.json({ ok: true, plan: anyTx.purchased_tier, status: 'already_captured' });
                }
            }
            return NextResponse.json(
                { error: 'Pending transaction not found. It may have expired.' },
                { status: 404 }
            );
        }
        console.log(`${TAG} ✅ Found PENDING tx: id=${pendingTx.id}, hotel_id=${pendingTx.hotel_id}, tier=${pendingTx.purchased_tier}`);

        // 4. Capture on PayPal (outside transaction — GLC-05)
        console.log(`${TAG} Step 4: Capturing on PayPal...`);
        const capture = await capturePayPalOrder(paypalOrderId);
        console.log(`${TAG} Capture result:`, JSON.stringify(capture));

        if (capture.status !== 'COMPLETED') {
            console.error(`${TAG} ❌ Capture status is ${capture.status}, not COMPLETED`);
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
        console.log(`${TAG} Step 5: Calculating period...`);
        const termMonths = pendingTx.description?.includes('3 months') ? 3 : 1;
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + termMonths);
        console.log(`${TAG}   termMonths=${termMonths}, periodEnd=${periodEnd.toISOString()}`);

        // 6. DB Transaction: update tx + activate subscription
        console.log(`${TAG} Step 6: DB transaction — update tx + activate subscription...`);
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
            console.log(`${TAG}   ✅ Transaction marked COMPLETED`);

            // Apply subscription change — only if hotel exists (pay-first flow: hotel_id is null)
            if (pendingTx.hotel_id) {
                console.log(`${TAG}   Applying subscription change for hotel: ${pendingTx.hotel_id}`);
                await applySubscriptionChange(tx, pendingTx.hotel_id, userId, {
                    periodStart: new Date(),
                    periodEnd,
                    provider: 'PAYPAL',
                    plan: pendingTx.purchased_tier!,
                    roomBand: pendingTx.purchased_room_band!,
                });
                console.log(`${TAG}   ✅ Subscription activated`);
            } else {
                console.log(`${TAG}   ⚠️ No hotel_id — pay-first flow, skipping subscription activation`);
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

        // 8. Telegram notification (fire-and-forget)
        notifyPaymentConfirmed({
            email: session.user.email || undefined,
            orderId: pendingTx.order_id,
            amount: capture.amount || Number(pendingTx.amount),
            currency: capture.currency || 'USD',
            tier: pendingTx.purchased_tier || 'UNKNOWN',
            gateway: 'PAYPAL',
            confirmedVia: 'PayPal Capture',
        }).catch(e => console.error(`${TAG} Telegram notification failed:`, e));

        // Pay-first flow: no hotel_id means user needs onboarding
        const needsOnboarding = !pendingTx.hotel_id;
        console.log(`${TAG} ━━━━━━━━━━ SUCCESS ━━━━━━━━━━ (needsOnboarding=${needsOnboarding})`);
        return NextResponse.json({
            ok: true,
            plan: pendingTx.purchased_tier,
            periodEnd: periodEnd.toISOString(),
            amount: capture.amount,
            currency: capture.currency,
            needsOnboarding,
        });
    } catch (err: unknown) {
        // Idempotency: P2002 = already captured
        if (
            err &&
            typeof err === 'object' &&
            'code' in err &&
            (err as { code: string }).code === 'P2002'
        ) {
            console.log(`${TAG} ℹ️ Duplicate capture (P2002), returning success`);
            return NextResponse.json({ ok: true, status: 'already_captured' });
        }
        console.error(`${TAG} ━━━━━━━━━━ ERROR ━━━━━━━━━━`);
        console.error(`${TAG} Error type: ${(err as Error)?.constructor?.name}`);
        console.error(`${TAG} Error message: ${err instanceof Error ? err.message : String(err)}`);
        console.error(`${TAG} Full error:`, err);

        const errorMessage = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
