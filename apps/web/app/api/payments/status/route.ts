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
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { compareAmount } from '@/lib/payments/constants';
import { applySubscriptionChange } from '@/lib/payments/activation';
import { extractOrderId } from '@/lib/payments/sepay';

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

            if (sepayApiKey && sepayAccount) {
                try {
                    const sepayRes = await fetch(
                        `https://my.sepay.vn/userapi/transactions/list?` +
                        `account_number=${sepayAccount}&limit=10`,
                        {
                            headers: {
                                'Authorization': `Bearer ${sepayApiKey}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );

                    if (sepayRes.ok) {
                        const sepayData = await sepayRes.json();
                        const transactions = sepayData.transactions || [];

                        // Find matching transaction by order_id in content
                        for (const sepayTx of transactions) {
                            // Only incoming transfers
                            if (sepayTx.transferType !== 'in' && sepayTx.transaction_type !== 'in') continue;

                            const content = sepayTx.transaction_content || sepayTx.content || '';
                            const matchedOrderId = extractOrderId(content);

                            if (matchedOrderId === orderId) {
                                // Found matching SePay transaction!
                                const transferAmount = sepayTx.amount_in || sepayTx.transferAmount || 0;
                                const amountMatch = compareAmount(
                                    Number(tx.amount),
                                    transferAmount,
                                    'VND'
                                );

                                if (!amountMatch) {
                                    // Amount mismatch
                                    await prisma.paymentTransaction.update({
                                        where: { id: tx.id },
                                        data: {
                                            status: 'FAILED',
                                            failed_at: new Date(),
                                            failed_reason: `amount_mismatch: expected ${tx.amount}, got ${transferAmount}`,
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

                                console.log(`[Payment Status] SePay API confirmed payment for ${orderId} (sepay tx ${sepayTx.id})`);

                                return NextResponse.json({
                                    status: 'COMPLETED',
                                    completedAt: now.toISOString(),
                                    tier: tx.purchased_tier,
                                    confirmedVia: 'sepay_api_poll',
                                });
                            }
                        }
                    } else {
                        console.warn('[Payment Status] SePay API error:', sepayRes.status);
                    }
                } catch (sepayErr) {
                    console.warn('[Payment Status] SePay API poll failed:', sepayErr);
                    // Don't fail the whole request, just return PENDING
                }
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
