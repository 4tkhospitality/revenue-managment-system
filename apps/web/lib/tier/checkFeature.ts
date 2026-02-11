/**
 * Server-side Feature Gating Utilities
 * IMPORTANT: ALL Server Actions & API Routes must call requireFeature() to prevent bypass
 * NOTE: Super Admins bypass all feature gates
 */

import prisma from '@/lib/prisma';
import { PlanTier } from '@prisma/client';
import { TIER_CONFIGS, FeatureKey, tierHasFeature, getUpgradeTierName } from './tierConfig';
import { auth } from '@/lib/auth';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface SubscriptionInfo {
    plan: PlanTier;
    status: string;
    periodEnd: Date | null;
    isExpired: boolean;
    maxUsers: number;
    maxProperties: number;
    maxImportsMonth: number;
    maxExportsDay: number;
    maxExportRows: number;
    includedRateShopsMonth: number;
    dataRetentionMonths: number;
}

export interface LimitCheckResult {
    allowed: boolean;
    limit: number;
    current: number;
    remaining: number;
}

export class FeatureGateError extends Error {
    constructor(
        public feature: FeatureKey,
        public requiredTier: string,
        public currentTier: PlanTier
    ) {
        super(`Feature "${feature}" requires ${requiredTier} tier or higher`);
        this.name = 'FeatureGateError';
    }
}

// ═══════════════════════════════════════════════════════════════════
// Core Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Get hotel subscription, returns FREE defaults if no subscription exists
 */
export async function getHotelSubscription(hotelId: string): Promise<SubscriptionInfo> {
    const subscription = await prisma.subscription.findUnique({
        where: { hotel_id: hotelId },
    });

    if (!subscription) {
        // Return STANDARD tier defaults
        const standardConfig = TIER_CONFIGS.STANDARD;
        return {
            plan: 'STANDARD',
            status: 'ACTIVE',
            periodEnd: null,
            isExpired: false,
            maxUsers: standardConfig.maxUsers,
            maxProperties: standardConfig.maxProperties,
            maxImportsMonth: standardConfig.maxImportsMonth,
            maxExportsDay: standardConfig.maxExportsDay,
            maxExportRows: standardConfig.maxExportRows,
            includedRateShopsMonth: standardConfig.includedRateShopsMonth,
            dataRetentionMonths: standardConfig.dataRetentionMonths,
        };
    }

    // Check if subscription has expired
    const now = new Date();
    const periodEnd = subscription.current_period_end;
    const isExpired = !!(periodEnd && periodEnd < now && ['ACTIVE', 'TRIAL'].includes(subscription.status));

    // If expired, downgrade to STANDARD defaults
    const effectivePlan = isExpired ? 'STANDARD' : subscription.plan;
    const effectiveStatus = isExpired ? 'EXPIRED' : subscription.status;

    // Return subscription with possible admin overrides
    return {
        plan: effectivePlan as PlanTier,
        status: effectiveStatus,
        periodEnd: periodEnd,
        isExpired,
        maxUsers: subscription.max_users,
        maxProperties: subscription.max_properties,
        maxImportsMonth: isExpired ? TIER_CONFIGS.STANDARD.maxImportsMonth : subscription.max_imports_month,
        maxExportsDay: isExpired ? TIER_CONFIGS.STANDARD.maxExportsDay : subscription.max_exports_day,
        maxExportRows: isExpired ? TIER_CONFIGS.STANDARD.maxExportRows : subscription.max_export_rows,
        includedRateShopsMonth: isExpired ? TIER_CONFIGS.STANDARD.includedRateShopsMonth : subscription.included_rate_shops_month,
        dataRetentionMonths: isExpired ? TIER_CONFIGS.STANDARD.dataRetentionMonths : subscription.data_retention_months,
    };
}

/**
 * Check if hotel has a specific feature
 */
export async function hasFeature(hotelId: string, feature: FeatureKey): Promise<boolean> {
    const sub = await getHotelSubscription(hotelId);
    return tierHasFeature(sub.plan, feature);
}

/**
 * Require a feature or throw FeatureGateError (use in Server Actions/APIs)
 * NOTE: Super Admins bypass all feature gates
 */
export async function requireFeature(hotelId: string, feature: FeatureKey): Promise<void> {
    // Super Admin bypass - they get all features
    const session = await auth();
    if (session?.user?.role === 'super_admin') {
        return; // Super Admin has access to everything
    }

    const sub = await getHotelSubscription(hotelId);
    if (!tierHasFeature(sub.plan, feature)) {
        throw new FeatureGateError(feature, getUpgradeTierName(feature), sub.plan);
    }
}

/**
 * Check if a limit allows more usage
 */
export async function checkLimit(
    hotelId: string,
    resource: 'imports_month' | 'exports_day' | 'rate_shops_month',
    currentCount: number
): Promise<LimitCheckResult> {
    const sub = await getHotelSubscription(hotelId);

    let limit: number;
    switch (resource) {
        case 'imports_month':
            limit = sub.maxImportsMonth;
            break;
        case 'exports_day':
            limit = sub.maxExportsDay;
            break;
        case 'rate_shops_month':
            limit = sub.includedRateShopsMonth;
            break;
    }

    return {
        allowed: currentCount < limit,
        limit,
        current: currentCount,
        remaining: Math.max(0, limit - currentCount),
    };
}

/**
 * Get max export rows for hotel (for Free tier row cap)
 */
export async function getMaxExportRows(hotelId: string): Promise<number> {
    const sub = await getHotelSubscription(hotelId);
    return sub.maxExportRows;
}
