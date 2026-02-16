// ════════════════════════════════════════════════════════════════════
// PLG — Static Plan Configuration (no DB dependency)
// ════════════════════════════════════════════════════════════════════

import { PlanTier, RoomBand } from '@prisma/client';
import type { FeatureFlags, PlanLimits, FeatureKey, GateType } from './types';

// ── Plan → Feature Mapping ──────────────────────────────────────────

const FEATURE_MAP: Record<PlanTier, FeatureFlags> = {
    STANDARD: {
        canBulkPricing: false,
        canPlaybook: false,
        canAnalytics: false,
        canMultiHotel: false,
        canRateShopper: false,
        canPersistScenarios: false,
    },
    SUPERIOR: {
        canBulkPricing: true,
        canPlaybook: false,
        canAnalytics: false,
        canMultiHotel: false,
        canRateShopper: false,
        canPersistScenarios: true,
    },
    DELUXE: {
        canBulkPricing: true,
        canPlaybook: true,
        canAnalytics: true,
        canMultiHotel: false,
        canRateShopper: false,
        canPersistScenarios: true,
    },
    SUITE: {
        canBulkPricing: true,
        canPlaybook: true,
        canAnalytics: true,
        canMultiHotel: true,
        canRateShopper: true,
        canPersistScenarios: true,
    },
};

// ── Plan → Default Limits ───────────────────────────────────────────

const LIMIT_MAP: Record<PlanTier, PlanLimits> = {
    STANDARD: {
        maxUsers: 1,
        maxProperties: 1,
        maxImportsMonth: 3,
        maxExportsDay: 1,
        maxExportRows: 30,
        maxScenarios: 3,
        includedRateShopsMonth: 0,
        dataRetentionMonths: 6,
    },
    SUPERIOR: {
        maxUsers: 3,
        maxProperties: 1,
        maxImportsMonth: 15,
        maxExportsDay: 10,
        maxExportRows: 90,
        maxScenarios: 0, // unlimited
        includedRateShopsMonth: 0,
        dataRetentionMonths: 12,
    },
    DELUXE: {
        maxUsers: 10,
        maxProperties: 1,
        maxImportsMonth: 50,
        maxExportsDay: 0, // unlimited
        maxExportRows: 0, // unlimited
        maxScenarios: 0,
        includedRateShopsMonth: 5,
        dataRetentionMonths: 24,
    },
    SUITE: {
        maxUsers: 0, // unlimited
        maxProperties: 0, // unlimited
        maxImportsMonth: 0,
        maxExportsDay: 0,
        maxExportRows: 0,
        maxScenarios: 0,
        includedRateShopsMonth: 50,
        dataRetentionMonths: 0, // unlimited
    },
};

// ── Plan → UI Label ─────────────────────────────────────────────────

const LABEL_MAP: Record<PlanTier, string> = {
    STANDARD: 'Starter',
    SUPERIOR: 'Superior',
    DELUXE: 'Deluxe',
    SUITE: 'Suite',
};

const COLOR_MAP: Record<PlanTier, string> = {
    STANDARD: '#22c55e', // green
    SUPERIOR: '#3b82f6', // blue
    DELUXE: '#a855f7',   // purple
    SUITE: '#eab308',    // gold
};

// ── Feature → Gate Type ─────────────────────────────────────────────

const GATE_MAP: Record<FeatureKey, Record<PlanTier, GateType>> = {
    bulkPricing: {
        STANDARD: 'hard',
        SUPERIOR: 'free',
        DELUXE: 'free',
        SUITE: 'free',
    },
    playbook: {
        STANDARD: 'preview',
        SUPERIOR: 'preview',
        DELUXE: 'free',
        SUITE: 'free',
    },
    analytics: {
        STANDARD: 'preview',
        SUPERIOR: 'preview',
        DELUXE: 'free',
        SUITE: 'free',
    },
    multiHotel: {
        STANDARD: 'hard',
        SUPERIOR: 'hard',
        DELUXE: 'hard',
        SUITE: 'free',
    },
    rateShopper: {
        STANDARD: 'hard',
        SUPERIOR: 'hard',
        DELUXE: 'hard',
        SUITE: 'free',
    },
    persistScenarios: {
        STANDARD: 'soft',
        SUPERIOR: 'free',
        DELUXE: 'free',
        SUITE: 'free',
    },
};

// ── Feature → Minimum Required Plan ─────────────────────────────────

const MIN_PLAN_MAP: Record<FeatureKey, PlanTier> = {
    bulkPricing: 'SUPERIOR',
    playbook: 'DELUXE',
    analytics: 'DELUXE',
    multiHotel: 'SUITE',
    rateShopper: 'SUITE',
    persistScenarios: 'SUPERIOR',
};

// ── Exports ─────────────────────────────────────────────────────────

export function getFeatureFlags(plan: PlanTier): FeatureFlags {
    return FEATURE_MAP[plan];
}

export function getDefaultLimits(plan: PlanTier): PlanLimits {
    return LIMIT_MAP[plan];
}

export function getPlanLabel(plan: PlanTier): string {
    return LABEL_MAP[plan];
}

export function getPlanColor(plan: PlanTier): string {
    return COLOR_MAP[plan];
}

export function getGateType(plan: PlanTier, featureKey: FeatureKey): GateType {
    return GATE_MAP[featureKey][plan];
}

export function getMinimumPlan(featureKey: FeatureKey): PlanTier {
    return MIN_PLAN_MAP[featureKey];
}

/** 0 = unlimited in our system */
export function isUnlimited(value: number): boolean {
    return value === 0;
}

export { FEATURE_MAP, LIMIT_MAP, LABEL_MAP, COLOR_MAP };

// ── Room Band Pricing ───────────────────────────────────────────────

const BAND_MULTIPLIER: Record<RoomBand, number> = {
    R30: 1.0,
    R80: 1.3,
    R150: 1.6,
    R300P: 2.0,
};

const BASE_PRICE: Record<PlanTier, number> = {
    STANDARD: 0,
    SUPERIOR: 990_000,
    DELUXE: 1_990_000,
    SUITE: 3_490_000,
};

const BAND_LABEL: Record<RoomBand, string> = {
    R30: '≤ 30 phòng',
    R80: '31–80 phòng',
    R150: '81–150 phòng',
    R300P: '151–300+ phòng',
};

/** Scale quota limits by room band multiplier. Non-scalable limits (maxUsers, maxProperties, maxScenarios) stay unchanged. */
export function getScaledLimits(plan: PlanTier, band: RoomBand): PlanLimits {
    const base = LIMIT_MAP[plan];
    const mult = BAND_MULTIPLIER[band];
    return {
        ...base,
        maxImportsMonth: base.maxImportsMonth === 0 ? 0 : Math.ceil(base.maxImportsMonth * mult),
        maxExportsDay: base.maxExportsDay === 0 ? 0 : Math.ceil(base.maxExportsDay * mult),
        maxExportRows: base.maxExportRows === 0 ? 0 : Math.ceil(base.maxExportRows * mult),
        includedRateShopsMonth: base.includedRateShopsMonth === 0 ? 0 : Math.ceil(base.includedRateShopsMonth * mult),
        dataRetentionMonths: base.dataRetentionMonths === 0 ? 0 : Math.ceil(base.dataRetentionMonths * mult),
        // NOT scaled: maxUsers, maxProperties, maxScenarios
    };
}

/** Derive the room band from hotel capacity */
export function deriveBand(capacity: number): RoomBand {
    if (capacity <= 30) return 'R30';
    if (capacity <= 80) return 'R80';
    if (capacity <= 150) return 'R150';
    return 'R300P';
}

/** Calculate price for a plan+band combination (rounded to 10k VND) */
export function getPrice(plan: PlanTier, band: RoomBand): number {
    const raw = BASE_PRICE[plan] * BAND_MULTIPLIER[band];
    return Math.round(raw / 10_000) * 10_000;
}

export function getBandMultiplier(band: RoomBand): number {
    return BAND_MULTIPLIER[band];
}

export function getBandLabel(band: RoomBand): string {
    return BAND_LABEL[band];
}

export { BAND_MULTIPLIER, BASE_PRICE, BAND_LABEL };

// ════════════════════════════════════════════════════════════════════
// Dynamic Pricing — DB-backed with fallback
// ════════════════════════════════════════════════════════════════════
import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

/**
 * Resolve the "winning" config for a given type + lookup key.
 * Conflict resolution:
 *   1. scope=HOTEL (for matching hotel) > scope=GLOBAL
 *   2. Higher priority wins
 *   3. Most recent updated_at wins
 */
async function resolveActiveConfig(
    configType: 'BASE_PRICE' | 'BAND_MULTIPLIER' | 'TERM_DISCOUNT',
    where: Record<string, unknown>,
    hotelId?: string,
) {
    const now = new Date();
    const configs = await prisma.pricingConfig.findMany({
        where: {
            config_type: configType,
            effective_from: { lte: now },
            OR: [
                { effective_to: null },
                { effective_to: { gt: now } },
            ],
            ...where,
        },
        orderBy: [
            { scope: 'desc' },      // HOTEL > GLOBAL
            { priority: 'desc' },
            { updated_at: 'desc' },
        ],
    });

    if (!configs.length) return null;

    // If hotelId, prefer HOTEL-scoped config for that hotel
    if (hotelId) {
        const hotelConfig = configs.find(c => c.scope === 'HOTEL' && c.hotel_id === hotelId);
        if (hotelConfig) return hotelConfig;
    }

    // Otherwise, GLOBAL with highest priority + most recent
    return configs[0];
}

/** Get dynamic base price for a plan tier (VND). Falls back to hardcoded. */
const _getDynamicBasePrice = unstable_cache(
    async (tier: PlanTier, hotelId?: string): Promise<number> => {
        const config = await resolveActiveConfig('BASE_PRICE', { tier }, hotelId);
        return config?.amount_vnd ?? BASE_PRICE[tier];
    },
    ['dynamic-base-price'],
    { tags: ['pricing-config'], revalidate: 300 }
);

/** Get dynamic band multiplier. Falls back to hardcoded. */
const _getDynamicBandMultiplier = unstable_cache(
    async (band: RoomBand, hotelId?: string): Promise<number> => {
        const config = await resolveActiveConfig('BAND_MULTIPLIER', { room_band: band }, hotelId);
        return config?.multiplier ? Number(config.multiplier) : BAND_MULTIPLIER[band];
    },
    ['dynamic-band-multiplier'],
    { tags: ['pricing-config'], revalidate: 300 }
);

/** Get dynamic term discount %. Falls back to hardcoded default (50% for 3m, 0% otherwise). */
const TERM_DISCOUNT_DEFAULTS: Record<number, number> = { 1: 0, 3: 50 };

const _getDynamicTermDiscount = unstable_cache(
    async (termMonths: number, hotelId?: string): Promise<number> => {
        const config = await resolveActiveConfig('TERM_DISCOUNT', { term_months: termMonths }, hotelId);
        return config?.percent ?? TERM_DISCOUNT_DEFAULTS[termMonths] ?? 0;
    },
    ['dynamic-term-discount'],
    { tags: ['pricing-config'], revalidate: 300 }
);

/**
 * Calculate the dynamic price for a plan+band+term combination.
 * Returns { price, basePrice, multiplier, discountPercent, configIds }
 */
export async function getDynamicPrice(
    plan: PlanTier,
    band: RoomBand,
    termMonths: number = 1,
    hotelId?: string,
) {
    const [basePrice, multiplier, discountPercent] = await Promise.all([
        _getDynamicBasePrice(plan, hotelId),
        _getDynamicBandMultiplier(band, hotelId),
        _getDynamicTermDiscount(termMonths, hotelId),
    ]);

    const rawPrice = basePrice * multiplier;
    const roundedPrice = Math.round(rawPrice / 10_000) * 10_000;
    const finalPrice = Math.round(roundedPrice * (1 - discountPercent / 100));

    return {
        price: finalPrice,
        basePrice,
        multiplier,
        discountPercent,
        termMonths,
    };
}

/** Convenience: get all tier prices for a given band (for pricing page display). */
export async function getAllDynamicPrices(band: RoomBand, hotelId?: string) {
    const tiers: PlanTier[] = ['STANDARD', 'SUPERIOR', 'DELUXE', 'SUITE'];
    const results: Record<string, { monthly: number; quarterly: number; discountPercent: number }> = {};

    await Promise.all(
        tiers.map(async (tier) => {
            const [monthly, quarterly] = await Promise.all([
                getDynamicPrice(tier, band, 1, hotelId),
                getDynamicPrice(tier, band, 3, hotelId),
            ]);
            results[tier] = {
                monthly: monthly.price,
                quarterly: quarterly.price,
                discountPercent: quarterly.discountPercent,
            };
        })
    );

    return results;
}
