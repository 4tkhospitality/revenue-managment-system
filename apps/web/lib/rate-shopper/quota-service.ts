/**
 * Rate Shopper — Quota Service
 *
 * Dual quota enforcement:
 * - max_manual_scans_per_day: counts ALL RateShopRequests (spam prevention)
 * - quota_cap (monthly): counts only credit_consumed=true vendor calls
 *
 * Also handles system daily budget and safe mode.
 *
 * @see spec §4.C, §6.2, §8, Key Decision #7, #17
 */

import prisma from '@/lib/prisma';
import {
    SYSTEM_DAILY_BUDGET,
    TENANT_MONTHLY_QUOTA,
    MAX_MANUAL_SCANS_PER_DAY,
} from './constants';
import { getVNDate, getVNMonth } from './timezone';

// ──────────────────────────────────────────────────
// Manual Scan Quota (Spam Prevention)
// ──────────────────────────────────────────────────

/**
 * Check if hotel has exceeded daily manual scan limit.
 * Counts ALL RateShopRequests for today (including coalesced).
 *
 * @throws Error if daily limit exceeded
 */
export async function checkManualScanLimit(hotelId: string): Promise<void> {
    const today = getVNDate();

    const todayScans = await prisma.rateShopRequest.count({
        where: {
            hotel_id: hotelId,
            requested_date: new Date(today), // @db.Date
        },
    });

    if (todayScans >= MAX_MANUAL_SCANS_PER_DAY) {
        throw new Error(
            `Daily scan limit reached (${MAX_MANUAL_SCANS_PER_DAY}). Try again tomorrow.`,
        );
    }
}

// ──────────────────────────────────────────────────
// Tenant Monthly Quota
// ──────────────────────────────────────────────────

export interface TenantQuotaResult {
    allowed: boolean;
    searches_used: number;
    quota_cap: number;
    remaining: number;
}

/**
 * Check tenant's monthly search quota.
 * Only counts vendor calls (credit_consumed=true).
 */
export async function checkTenantQuota(hotelId: string): Promise<TenantQuotaResult> {
    const month = getVNMonth();

    const usage = await prisma.rateShopUsageTenantMonthly.findUnique({
        where: {
            hotel_id_billing_month: {
                hotel_id: hotelId,
                billing_month: month,
            },
        },
    });

    const searches_used = usage?.searches_used ?? 0;
    const quota_cap = usage?.quota_cap ?? TENANT_MONTHLY_QUOTA;
    const remaining = Math.max(0, quota_cap - searches_used);

    return {
        allowed: searches_used < quota_cap,
        searches_used,
        quota_cap,
        remaining,
    };
}

// ──────────────────────────────────────────────────
// System Daily Budget
// ──────────────────────────────────────────────────

export interface SystemBudgetResult {
    allowed: boolean;
    searches_used: number;
    budget_limit: number;
    safe_mode_on: boolean;
}

/**
 * Check system-wide daily budget.
 * Scheduler and manual scans both check this.
 */
export async function checkSystemBudget(): Promise<SystemBudgetResult> {
    const today = getVNDate();

    const usage = await prisma.rateShopUsageDaily.findUnique({
        where: { usage_date: today },
    });

    const searches_used = usage?.searches_used ?? 0;
    const budget_limit = usage?.budget_limit ?? SYSTEM_DAILY_BUDGET;
    const safe_mode_on = usage?.safe_mode_on ?? false;

    return {
        allowed: !safe_mode_on && searches_used < budget_limit,
        searches_used,
        budget_limit,
        safe_mode_on,
    };
}

// ──────────────────────────────────────────────────
// Record Usage (Atomic Increment)
// ──────────────────────────────────────────────────

/**
 * Record a vendor call usage.
 * Always increments system daily. Optionally increments tenant monthly.
 *
 * Uses upsert for both tables to auto-create rows.
 * Conservative billing: always credit unless confirmed cache hit.
 *
 * @param hotelId - Hotel ID (null for scheduler-only calls)
 * @param creditConsumed - Whether this counts as a tenant credit
 */
export async function recordUsage(
    hotelId: string | null,
    creditConsumed: boolean,
): Promise<void> {
    const today = getVNDate();
    const month = getVNMonth();

    // Always increment system daily (scheduler + manual)
    await prisma.rateShopUsageDaily.upsert({
        where: { usage_date: today },
        create: {
            usage_date: today,
            searches_used: 1,
            budget_limit: SYSTEM_DAILY_BUDGET,
        },
        update: {
            searches_used: { increment: 1 },
        },
    });

    // Increment tenant monthly only if credit consumed
    if (hotelId && creditConsumed) {
        await prisma.rateShopUsageTenantMonthly.upsert({
            where: {
                hotel_id_billing_month: {
                    hotel_id: hotelId,
                    billing_month: month,
                },
            },
            create: {
                hotel_id: hotelId,
                billing_month: month,
                searches_used: 1,
                quota_cap: TENANT_MONTHLY_QUOTA,
            },
            update: {
                searches_used: { increment: 1 },
            },
        });
    }
}

// ──────────────────────────────────────────────────
// Full Pre-Flight Check
// ──────────────────────────────────────────────────

/**
 * Run all quota checks before allowing a manual scan.
 * Checks: daily scan limit → tenant monthly → system daily.
 *
 * @throws Error with user-friendly message if any check fails
 */
export async function preFlightCheck(hotelId: string): Promise<void> {
    // 1. Daily scan limit (spam prevention)
    await checkManualScanLimit(hotelId);

    // 2. Tenant monthly quota
    const tenant = await checkTenantQuota(hotelId);
    if (!tenant.allowed) {
        throw new Error(
            `Monthly quota exhausted (${tenant.searches_used}/${tenant.quota_cap}). Contact admin to increase.`,
        );
    }

    // 3. System daily budget
    const system = await checkSystemBudget();
    if (!system.allowed) {
        if (system.safe_mode_on) {
            throw new Error('System is in safe mode. Rate shopping temporarily paused.');
        }
        throw new Error('System daily budget exhausted. Try again tomorrow.');
    }
}
