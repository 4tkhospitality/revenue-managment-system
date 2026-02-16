// ════════════════════════════════════════════════════════════════════
// PLG — Entitlements Service
// Central function: getEntitlements(hotelId) → plan, features, limits
// Resolves subscription via Organization (Cách 2)
// ════════════════════════════════════════════════════════════════════

import { PlanTier, SubscriptionStatus, RoomBand } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getFeatureFlags, getScaledLimits } from './plan-config';
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

    // Step 1: Find hotel's org
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { org_id: true },
    });

    // Step 2: Load subscription via org_id (or fallback to hotel_id for migration)
    let subscription;
    if (hotel?.org_id) {
        subscription = await prisma.subscription.findUnique({
            where: { org_id: hotel.org_id },
        });
    }
    if (!subscription) {
        // Fallback for hotels not yet migrated to org
        subscription = await prisma.subscription.findFirst({
            where: { hotel_id: hotelId },
        });
    }

    // No subscription → default STANDARD
    if (!subscription) {
        const defaults = buildEntitlements('STANDARD', 'ACTIVE', null, 'R30', hotel?.org_id ?? null);
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
    const roomBand: RoomBand = subscription.room_band ?? 'R30';

    // Build limits: use subscription overrides if admin set custom values
    // Base from getScaledLimits() (band-aware) instead of getDefaultLimits()
    const defaultLimits = getScaledLimits(effectivePlan, roomBand);
    const limits: PlanLimits = {
        // maxUsers always from plan-config (source of truth), DB override removed to prevent stale values
        maxUsers: defaultLimits.maxUsers,
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
        roomBand,
        orgId: hotel?.org_id ?? null,
    };

    cacheResult(hotelId, entitlements);
    return entitlements;
}

// ── Suite Hotel Access Guard ────────────────────────────────────────

/** Check if a user can access a hotel via HotelUser OR OrgMember+Suite */
export async function canAccessHotel(userId: string, hotelId: string): Promise<boolean> {
    // Rule 1: Direct HotelUser record exists (existing behavior)
    const hotelUser = await prisma.hotelUser.findUnique({
        where: { user_id_hotel_id: { user_id: userId, hotel_id: hotelId } },
    });
    if (hotelUser?.is_active) return true;

    // Rule 2: OrgMember of org that owns this hotel + org has Suite plan
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { org_id: true },
    });
    if (!hotel?.org_id) return false;

    const orgMember = await prisma.orgMember.findUnique({
        where: { org_id_user_id: { org_id: hotel.org_id, user_id: userId } },
    });
    if (!orgMember) return false;

    // Check org subscription is Suite
    const subscription = await prisma.subscription.findUnique({
        where: { org_id: hotel.org_id },
        select: { plan: true },
    });

    return subscription?.plan === 'SUITE';
}

// ── Helper: Build Default Entitlements ──────────────────────────────

function buildEntitlements(
    plan: PlanTier,
    status: SubscriptionStatus,
    trialEndsAt: Date | null,
    roomBand: RoomBand = 'R30',
    orgId: string | null = null,
): Entitlements {
    const defaultLimits = getScaledLimits(plan, roomBand);
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
        roomBand,
        orgId,
    };
}

// ── Cache Helpers ───────────────────────────────────────────────────

function cacheResult(hotelId: string, data: Entitlements): void {
    cache.set(hotelId, {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS,
    });
}
