/**
 * Subscription Expiry Cron Job
 *
 * GET /api/cron/check-subscription
 * Schedule: Daily at 19:00 UTC = 02:00 VN (P1)
 *
 * Logic:
 * 1. Find ACTIVE subscriptions with current_period_end < now
 * 2. For PAYPAL: re-fetch from PayPal API before downgrade
 * 3. For SEPAY: grace 3 days → PAST_DUE → after 3d → CANCELLED → STANDARD
 * 4. Auto-expire PENDING transactions older than 30min
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSubscriptionDetails } from '@/lib/payments/paypal';
import { downgradeToStandard } from '@/lib/payments/activation';

// Vercel Cron auth check
function verifyCronAuth(req: Request): boolean {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return true; // No secret = dev mode
    return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(req: Request) {
    if (!verifyCronAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const gracePeriodMs = 3 * 24 * 60 * 60 * 1000; // 3 days
    const results = { checked: 0, downgraded: 0, pastDue: 0, paypalSynced: 0, pendingExpired: 0 };

    try {
        // ── 1. Find expired subscriptions ──────────────────────────────
        const expiredSubs = await prisma.subscription.findMany({
            where: {
                status: { in: ['ACTIVE', 'PAST_DUE'] },
                current_period_end: { lt: now },
                plan: { not: 'STANDARD' },
            },
        });

        results.checked = expiredSubs.length;

        for (const sub of expiredSubs) {
            if (!sub.hotel_id) continue;
            const periodEnd = sub.current_period_end!;

            // ── PAYPAL: Re-fetch before downgrade (P1 sync) ─────────────
            if (sub.external_provider === 'PAYPAL' && sub.external_subscription_id) {
                try {
                    const paypalSub = await getSubscriptionDetails(sub.external_subscription_id);

                    if (paypalSub.status === 'ACTIVE' && paypalSub.billing_info.next_billing_time) {
                        const nextBilling = new Date(paypalSub.billing_info.next_billing_time);
                        if (nextBilling > now) {
                            // PayPal says still active → update period_end, skip downgrade
                            await prisma.subscription.update({
                                where: { id: sub.id },
                                data: {
                                    current_period_end: nextBilling,
                                    status: 'ACTIVE',
                                },
                            });
                            results.paypalSynced++;
                            continue;
                        }
                    }

                    // PayPal says cancelled/suspended → proceed with downgrade
                    if (['CANCELLED', 'EXPIRED'].includes(paypalSub.status)) {
                        await prisma.$transaction(async (tx) => {
                            await downgradeToStandard(tx, sub.hotel_id!, `Cron: PayPal ${paypalSub.status}`);
                        });
                        results.downgraded++;
                        continue;
                    }
                } catch (err) {
                    console.error(`[Cron] PayPal sync failed for ${sub.hotel_id}:`, err);
                    // On PayPal API error, fall through to grace period logic
                }
            }

            // ── SEPAY / ZALO_MANUAL: Grace period logic ─────────────────
            const timeSinceExpiry = now.getTime() - periodEnd.getTime();

            if (timeSinceExpiry < gracePeriodMs) {
                // Within grace period → PAST_DUE (keep plan)
                if (sub.status !== 'PAST_DUE') {
                    await prisma.subscription.update({
                        where: { id: sub.id },
                        data: { status: 'PAST_DUE' },
                    });
                    results.pastDue++;
                }
            } else {
                // Past grace period → downgrade to STANDARD
                await prisma.$transaction(async (tx) => {
                    await downgradeToStandard(tx, sub.hotel_id!, 'Cron: grace period expired');
                });
                results.downgraded++;
            }
        }

        // ── 2. Auto-expire old PENDING transactions ───────────────────
        const expiredPending = await prisma.paymentTransaction.updateMany({
            where: {
                status: 'PENDING',
                expires_at: { lt: now },
            },
            data: {
                status: 'FAILED',
                failed_at: now,
                failed_reason: 'auto_expired_by_cron',
            },
        });
        results.pendingExpired = expiredPending.count;

        console.log('[Cron] check-subscription results:', results);
        return NextResponse.json({ ok: true, ...results });
    } catch (err) {
        console.error('[Cron] check-subscription error:', err);
        return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
    }
}
