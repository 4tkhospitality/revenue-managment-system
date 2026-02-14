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
