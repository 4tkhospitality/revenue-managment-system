/**
 * Payment Status Check — API Route (with SePay API fallback)
 *
 * GET /api/payments/status?orderId=RMS-XXXXXXXX-TIMESTAMP
 *
 * 1. Check local DB for transaction status
 * 2. If PENDING + gateway=SEPAY → poll SePay API directly for matching payment
 * 3. If SePay confirms payment → process it (same logic as webhook)
 *
 * This bypasses the need for SePay webhook configuration.
 *
 * SePay API response format (GET /userapi/transactions/list):
 * {
 *   "transactions": [
 *     {
 *       "id": "42672446",
 *       "transaction_content": "MBVCB...RMS4dafcc39...CT tu...",
 *       "amount_in": 10000,
 *       "amount_out": 0,
 *       "transaction_date": "2026-02-16 20:42:00",
 *       "account_number": "113456788888",
 *       "reference_number": "FT26049...",
 *       ...
 *     }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { compareAmount } from '@/lib/payments/constants';
import { applySubscriptionChange } from '@/lib/payments/activation';
import { extractOrderId, matchesOrderId } from '@/lib/payments/sepay';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orderId = req.nextUrl.searchParams.get('orderId');
        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        // 1. Check local DB
        const tx = await prisma.paymentTransaction.findFirst({
            where: {
                order_id: orderId,
                user_id: session.user.id,
            },
            orderBy: { created_at: 'desc' },
        });

        if (!tx) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        // 2. If already completed/failed, return immediately
        if (tx.status !== 'PENDING') {
            return NextResponse.json({
                status: tx.status,
                completedAt: tx.completed_at,
                failedAt: tx.failed_at,
                failedReason: tx.failed_reason,
                tier: tx.purchased_tier,
            });
        }

        // 3. Still PENDING + SEPAY → poll SePay API directly
        if (tx.gateway === 'SEPAY') {
            const sepayApiKey = process.env.SEPAY_API_KEY;
            const sepayAccount = process.env.SEPAY_BANK_ACCOUNT;

            console.log('[Payment Status] Polling SePay API for order:', orderId, 'apiKey:', sepayApiKey ? 'SET' : 'MISSING', 'account:', sepayAccount);

            if (sepayApiKey && sepayAccount) {
                try {
                    const apiUrl = `https://my.sepay.vn/userapi/transactions/list?account_number=${sepayAccount}&limit=20`;
                    console.log('[Payment Status] Fetching:', apiUrl);

                    const sepayRes = await fetch(apiUrl, {
                        headers: {
                            'Authorization': `Bearer ${sepayApiKey}`,
                        },
                        cache: 'no-store',
                    });

                    console.log('[Payment Status] SePay API status:', sepayRes.status);

                    if (sepayRes.ok) {
                        const sepayData = await sepayRes.json();
                        const transactions = sepayData.transactions || sepayData.data || [];

                        console.log('[Payment Status] SePay returned', transactions.length, 'transactions');

                        // Find matching transaction by order_id in content
                        for (const sepayTx of transactions) {
                            // SePay API uses amount_in/amount_out (not transferType)
                            const amountIn = Number(sepayTx.amount_in || 0);
                            if (amountIn <= 0) continue; // Skip outgoing transfers

                            // SePay API uses transaction_content (not content)
                            const content = sepayTx.transaction_content || sepayTx.content || '';
                            console.log('[Payment Status] Checking tx:', sepayTx.id, 'content:', content.substring(0, 80));

                            const matchedOrderId = extractOrderId(content);
                            console.log('[Payment Status] Extracted orderId:', matchedOrderId, 'looking for:', orderId);

                            if (matchedOrderId && matchesOrderId(matchedOrderId, orderId)) {
                                // Found matching SePay transaction!
                                console.log('[Payment Status] MATCH FOUND! SePay tx:', sepayTx.id, 'amount:', amountIn);

                                const amountMatch = compareAmount(
                                    Number(tx.amount),
                                    amountIn,
                                    'VND'
                                );

                                if (!amountMatch) {
                                    console.warn('[Payment Status] Amount mismatch:', tx.amount, 'vs', amountIn);
                                    await prisma.paymentTransaction.update({
                                        where: { id: tx.id },
                                        data: {
                                            status: 'FAILED',
                                            failed_at: new Date(),
                                            failed_reason: `amount_mismatch: expected ${tx.amount}, got ${amountIn}`,
                                        },
                                    });
                                    return NextResponse.json({
                                        status: 'FAILED',
                                        failedReason: 'amount_mismatch',
                                    });
                                }

                                // Amount matches → confirm payment!
                                const now = new Date();
                                const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

                                await prisma.$transaction(async (ptx) => {
                                    await ptx.paymentTransaction.update({
                                        where: { id: tx.id },
                                        data: {
                                            status: 'COMPLETED',
                                            completed_at: now,
                                            gateway_transaction_id: String(sepayTx.id),
                                        },
                                    });

                                    if (tx.hotel_id) {
                                        await applySubscriptionChange(ptx, tx.hotel_id, tx.user_id, {
                                            periodStart: now,
                                            periodEnd,
                                            provider: 'SEPAY',
                                            plan: tx.purchased_tier!,
                                            roomBand: tx.purchased_room_band!,
                                        });
                                    }
                                });

                                console.log(`[Payment Status] ✅ SePay API confirmed payment for ${orderId} (sepay tx ${sepayTx.id})`);

                                return NextResponse.json({
                                    status: 'COMPLETED',
                                    completedAt: now.toISOString(),
                                    tier: tx.purchased_tier,
                                    confirmedVia: 'sepay_api_poll',
                                });
                            }
                        }

                        console.log('[Payment Status] No matching transaction found in SePay for:', orderId);
                    } else {
                        const errBody = await sepayRes.text();
                        console.warn('[Payment Status] SePay API error:', sepayRes.status, errBody);
                    }
                } catch (sepayErr) {
                    console.error('[Payment Status] SePay API poll failed:', sepayErr);
                }
            } else {
                console.warn('[Payment Status] Missing SEPAY_API_KEY or SEPAY_BANK_ACCOUNT env vars');
            }
        }

        // Still PENDING
        return NextResponse.json({
            status: 'PENDING',
            tier: tx.purchased_tier,
        });
    } catch (err) {
        console.error('[Payment Status] Error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
