// ════════════════════════════════════════════════════════════════════
// PLG — Entitlements Service
// Central function: getEntitlements(hotelId) → plan, features, limits
// ════════════════════════════════════════════════════════════════════

import { PlanTier, SubscriptionStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getFeatureFlags, getDefaultLimits } from './plan-config';
import type { Entitlements, PlanLimits } from './types';

// ── In-Memory Cache (60s TTL per hotel) ────────────────────────────

interface CacheEntry {
    data: Entitlements;
    expiresAt: number;
}

const CACHE_TTL_MS = 60_000; // 60 seconds
const cache = new Map<string, CacheEntry>();

export function invalidateEntitlementsCache(hotelId: string): void {
    cache.delete(hotelId);
}

// ── Core Entitlements Function ──────────────────────────────────────

export async function getEntitlements(hotelId: string): Promise<Entitlements> {
    // Check cache first
    const cached = cache.get(hotelId);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    const subscription = await prisma.subscription.findUnique({
        where: { hotel_id: hotelId },
    });

    // No subscription → default STANDARD
    if (!subscription) {
        const defaults = buildEntitlements('STANDARD', 'ACTIVE', null);
        cacheResult(hotelId, defaults);
        return defaults;
    }

    const now = new Date();
    const isTrial = subscription.status === 'TRIAL';
    const trialEndsAt = subscription.trial_ends_at;
    const trialActive = isTrial && trialEndsAt !== null && trialEndsAt > now;
    const trialExpired = isTrial && trialEndsAt !== null && trialEndsAt <= now;

    // effectivePlan: DELUXE during active trial, else actual plan
    const effectivePlan: PlanTier = trialActive ? 'DELUXE' : subscription.plan;

    // Build limits: use subscription overrides if admin set custom values
    const defaultLimits = getDefaultLimits(effectivePlan);
    const limits: PlanLimits = {
        maxUsers: subscription.max_users ?? defaultLimits.maxUsers,
        maxProperties: subscription.max_properties ?? defaultLimits.maxProperties,
        maxImportsMonth: subscription.max_imports_month ?? defaultLimits.maxImportsMonth,
        maxExportsDay: subscription.max_exports_day ?? defaultLimits.maxExportsDay,
        maxExportRows: subscription.max_export_rows ?? defaultLimits.maxExportRows,
        maxScenarios: defaultLimits.maxScenarios,
        includedRateShopsMonth: subscription.included_rate_shops_month ?? defaultLimits.includedRateShopsMonth,
        dataRetentionMonths: subscription.data_retention_months ?? defaultLimits.dataRetentionMonths,
    };

    const trialDaysRemaining = trialActive && trialEndsAt
        ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    const entitlements: Entitlements = {
        plan: subscription.plan,
        effectivePlan,
        status: subscription.status,
        limits,
        features: getFeatureFlags(effectivePlan),
        isTrialActive: trialActive,
        isTrialExpired: trialExpired,
        trialEndsAt: trialEndsAt,
        trialBonusGranted: subscription.trial_bonus_granted,
        trialDaysRemaining,
    };

    cacheResult(hotelId, entitlements);
    return entitlements;
}

// ── Helper: Build Default Entitlements ──────────────────────────────

function buildEntitlements(
    plan: PlanTier,
    status: SubscriptionStatus,
    trialEndsAt: Date | null,
): Entitlements {
    const defaultLimits = getDefaultLimits(plan);
    return {
        plan,
        effectivePlan: plan,
        status,
        limits: defaultLimits,
        features: getFeatureFlags(plan),
        isTrialActive: false,
        isTrialExpired: false,
        trialEndsAt,
        trialBonusGranted: false,
        trialDaysRemaining: 0,
    };
}

// ── Cache Helpers ───────────────────────────────────────────────────

function cacheResult(hotelId: string, data: Entitlements): void {
    cache.set(hotelId, {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS,
    });
}
