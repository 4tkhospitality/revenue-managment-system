/**
 * SePay Webhook Handler — API Route
 *
 * POST /api/payments/sepay/webhook?secret=xxx
 *
 * 3-step validation: Match → Validate → Dedup
 * GLC-02: Verify via URL query param secret (SePay does not support HMAC signing)
 * GLC-03: Dedup by sepayPayload.id
 * GLC-04: Catches P2002 unique violation → return 200
 * GLC-06: Amount compare in minor units (VND integer)
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extractOrderId } from '@/lib/payments/sepay';
import type { SepayWebhookPayload } from '@/lib/payments/sepay';
import { compareAmount } from '@/lib/payments/constants';
import { applySubscriptionChange } from '@/lib/payments/activation';
import { trackEvent } from '@/lib/payments/trackEvent';

export async function POST(req: Request) {
    try {
        // 1. Verify secret from URL query param (GLC-02)
        const url = new URL(req.url);
        const secret = url.searchParams.get('secret');
        const expectedSecret = process.env.SEPAY_WEBHOOK_SECRET;

        if (!expectedSecret || secret !== expectedSecret) {
            console.warn('[SePay Webhook] Invalid or missing secret');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse body
        const rawBody = await req.text();
        const payload: SepayWebhookPayload = JSON.parse(rawBody);

        // Only process incoming transfers
        if (payload.transferType !== 'in') {
            return NextResponse.json({ ok: true });
        }

        // 3. Step 1 — MATCH: Extract order_id from content
        const orderId = extractOrderId(payload.content);
        if (!orderId) {
            console.warn('[SePay Webhook] No order_id in content:', payload.content);
            return NextResponse.json({ ok: true }); // Not our transaction
        }

        // Find the PENDING transaction
        const pendingTx = await prisma.paymentTransaction.findFirst({
            where: {
                order_id: orderId,
                gateway: 'SEPAY',
                status: 'PENDING',
            },
        });

        if (!pendingTx) {
            console.warn('[SePay Webhook] No PENDING tx for order:', orderId);
            return NextResponse.json({ ok: true }); // Already processed or not found
        }

        // 4. Step 2 — VALIDATE: 3-way check (amount + tier + currency)
        const amountMatch = compareAmount(
            Number(pendingTx.amount),
            payload.transferAmount,
            'VND'
        );

        if (!amountMatch) {
            // Amount mismatch — mark as FAILED
            await prisma.paymentTransaction.update({
                where: { id: pendingTx.id },
                data: {
                    status: 'FAILED',
                    failed_at: new Date(),
                    failed_reason: `amount_mismatch: expected ${pendingTx.amount}, got ${payload.transferAmount}`,
                    raw_payload: payload as any,
                },
            });

            trackEvent({
                event: 'payment_failed',
                userId: pendingTx.user_id,
                hotelId: pendingTx.hotel_id || undefined,
                properties: { gateway: 'SEPAY', reason: 'amount_mismatch', orderId },
            });

            return NextResponse.json({ ok: true, status: 'amount_mismatch' });
        }

        if (pendingTx.currency !== 'VND') {
            await prisma.paymentTransaction.update({
                where: { id: pendingTx.id },
                data: {
                    status: 'FAILED',
                    failed_at: new Date(),
                    failed_reason: 'currency_mismatch',
                    raw_payload: payload as any,
                },
            });
            return NextResponse.json({ ok: true, status: 'currency_mismatch' });
        }

        // 5. Step 3 — DEDUP: Set gateway_transaction_id (GLC-03/04)
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

        try {
            await prisma.$transaction(async (tx) => {
                // Update PaymentTransaction → COMPLETED
                await tx.paymentTransaction.update({
                    where: { id: pendingTx.id },
                    data: {
                        status: 'COMPLETED',
                        completed_at: now,
                        gateway_transaction_id: String(payload.id), // GLC-03: SePay unique id
                        raw_payload: payload as any,
                    },
                });

                // Apply subscription change — only if hotel exists (pay-first flow: hotel_id is null)
                if (pendingTx.hotel_id) {
                    await applySubscriptionChange(tx, pendingTx.hotel_id, pendingTx.user_id, {
                        periodStart: now,
                        periodEnd,
                        provider: 'SEPAY',
                        plan: pendingTx.purchased_tier!,
                        roomBand: pendingTx.purchased_room_band!,
                    });
                }
                // If hotel_id is null → user will complete onboarding later and activate there
            });

            trackEvent({
                event: 'payment_success',
                userId: pendingTx.user_id,
                hotelId: pendingTx.hotel_id || undefined,
                properties: {
                    gateway: 'SEPAY',
                    tier: pendingTx.purchased_tier,
                    amount: Number(pendingTx.amount),
                    currency: 'VND',
                    orderId,
                    pendingActivation: !pendingTx.hotel_id, // Flag: needs onboarding
                },
            });

            return NextResponse.json({
                ok: true,
                status: pendingTx.hotel_id ? 'activated' : 'pending_activation',
            });
        } catch (err: unknown) {
            // GLC-04: Catch P2002 unique violation (duplicate webhook)
            if (
                err &&
                typeof err === 'object' &&
                'code' in err &&
                (err as { code: string }).code === 'P2002'
            ) {
                console.log('[SePay Webhook] Duplicate webhook detected, returning 200');
                return NextResponse.json({ ok: true, status: 'duplicate' });
            }
            throw err;
        }
    } catch (err) {
        console.error('[SePay Webhook] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
