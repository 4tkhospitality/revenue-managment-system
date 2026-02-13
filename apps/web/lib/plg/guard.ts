// ════════════════════════════════════════════════════════════════════
// PLG — Feature & Quota Guard
// requireFeature() → throws PaywallError if not entitled
// requireQuota() → throws QuotaExceededError if over limit
// ════════════════════════════════════════════════════════════════════

import prisma from '@/lib/prisma';
import { getEntitlements } from './entitlements';
import { getGateType, getMinimumPlan, isUnlimited } from './plan-config';
import { PaywallError, QuotaExceededError } from '@/lib/shared/errors';
import type { FeatureKey, QuotaKey, GateType, QuotaInfo } from './types';

// ── Feature Guard ───────────────────────────────────────────────────

/**
 * Throws PaywallError if the hotel's effective plan doesn't include the feature.
 * Use in API routes to block access.
 */
export async function requireFeature(
    hotelId: string,
    featureKey: FeatureKey,
): Promise<void> {
    const ent = await getEntitlements(hotelId);
    const gate = getGateType(ent.effectivePlan, featureKey);

    if (gate !== 'free') {
        throw new PaywallError({
            featureKey,
            currentPlan: ent.plan,
            requiredPlan: getMinimumPlan(featureKey),
            reasonCodes: [`feature_${gate}`],
        });
    }
}

/**
 * Non-throwing version: returns boolean.
 */
export async function checkFeature(
    hotelId: string,
    featureKey: FeatureKey,
): Promise<boolean> {
    const ent = await getEntitlements(hotelId);
    return getGateType(ent.effectivePlan, featureKey) === 'free';
}

/**
 * Returns the gate type for display purposes (UI can show preview/soft/hard).
 */
export async function getFeatureGate(
    hotelId: string,
    featureKey: FeatureKey,
): Promise<GateType> {
    const ent = await getEntitlements(hotelId);
    return getGateType(ent.effectivePlan, featureKey);
}

// ── Quota Guard ─────────────────────────────────────────────────────

/**
 * Throws QuotaExceededError if the hotel has used up their quota.
 * Supports monthly (imports) and daily (exports) quotas, plus real-time user count.
 */
export async function requireQuota(
    hotelId: string,
    quotaKey: QuotaKey,
): Promise<void> {
    const info = await getQuotaInfo(hotelId, quotaKey);
    if (info.isExceeded) {
        throw new QuotaExceededError({
            quotaKey,
            current: info.used,
            limit: info.limit,
            reasonCodes: ['quota_exceeded'],
        });
    }
}

/**
 * Get full quota info for display (UsageMeter component).
 */
export async function getQuotaInfo(
    hotelId: string,
    quotaKey: QuotaKey,
): Promise<QuotaInfo> {
    const ent = await getEntitlements(hotelId);

    let used = 0;
    let limit = 0;

    switch (quotaKey) {
        case 'imports': {
            limit = ent.limits.maxImportsMonth;
            if (isUnlimited(limit)) {
                return { key: quotaKey, used: 0, limit: 0, remaining: Infinity, isNearLimit: false, isExceeded: false };
            }
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const usage = await prisma.usageMonthly.findUnique({
                where: { hotel_id_month: { hotel_id: hotelId, month: monthStart } },
                select: { imports: true },
            });
            used = usage?.imports ?? 0;
            break;
        }

        case 'exports': {
            limit = ent.limits.maxExportsDay;
            if (isUnlimited(limit)) {
                return { key: quotaKey, used: 0, limit: 0, remaining: Infinity, isNearLimit: false, isExceeded: false };
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const usage = await prisma.usageDaily.findUnique({
                where: { hotel_id_date: { hotel_id: hotelId, date: today } },
                select: { exports: true },
            });
            used = usage?.exports ?? 0;
            break;
        }

        case 'users': {
            limit = ent.limits.maxUsers;
            if (isUnlimited(limit)) {
                return { key: quotaKey, used: 0, limit: 0, remaining: Infinity, isNearLimit: false, isExceeded: false };
            }
            // Real-time COUNT — not a counter
            used = await prisma.hotelUser.count({
                where: { hotel_id: hotelId, is_active: true },
            });
            break;
        }
    }

    const remaining = Math.max(0, limit - used);
    const isNearLimit = limit > 0 && used / limit >= 0.8;
    const isExceeded = limit > 0 && used >= limit;

    return { key: quotaKey, used, limit, remaining, isNearLimit, isExceeded };
}
