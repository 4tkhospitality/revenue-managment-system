/**
 * Tier Configuration - Single source of truth for feature flags & limits
 * SMB60 V1.2 - "Daily Action Assistant" for VN hotels <60 rooms
 */

import { PlanTier } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════════
// Feature Flags
// ═══════════════════════════════════════════════════════════════════

export type FeatureKey =
    | 'pricing_calc'
    | 'promo_stacking'
    | 'daily_actions'
    | 'rate_calendar'
    | 'export_excel'
    | 'pickup_pace_simple'
    | 'guardrails'
    | 'decision_log'
    | 'basic_analytics'
    | 'advanced_analytics'
    | 'multi_property'
    | 'api_import'
    | 'rate_shopper_addon';

// ═══════════════════════════════════════════════════════════════════
// Tier Definitions
// ═══════════════════════════════════════════════════════════════════

export interface TierConfig {
    name: string;
    displayName: string;
    description: string;
    // Limits
    maxUsers: number;
    maxProperties: number;
    maxImportsMonth: number;
    maxExportsDay: number;
    maxExportRows: number;
    dataRetentionMonths: number;
    includedRateShopsMonth: number;
    // Features
    features: FeatureKey[];
}

export const TIER_CONFIGS: Record<PlanTier, TierConfig> = {
    STANDARD: {
        name: 'STANDARD',
        displayName: 'Calculator',
        description: 'Tính giá NET → BAR + promo stacking',
        maxUsers: 1,
        maxProperties: 1,
        maxImportsMonth: 3,
        maxExportsDay: 1,
        maxExportRows: 30, // Row cap for Free
        dataRetentionMonths: 6,
        includedRateShopsMonth: 0,
        features: ['pricing_calc', 'promo_stacking'],
    },
    SUPERIOR: {
        name: 'SUPERIOR',
        displayName: 'Assistant',
        description: 'Daily Action + Export cho khách sạn 10-30 phòng',
        maxUsers: 2,
        maxProperties: 1,
        maxImportsMonth: 60,
        maxExportsDay: 10,
        maxExportRows: 999,
        dataRetentionMonths: 12,
        includedRateShopsMonth: 0,
        features: [
            'pricing_calc',
            'promo_stacking',
            'daily_actions',
            'rate_calendar',
            'export_excel',
        ],
    },
    DELUXE: {
        name: 'DELUXE',
        displayName: 'RMS Lite',
        description: 'Guardrails + Analytics cho khách sạn 31-60 phòng',
        maxUsers: 5,
        maxProperties: 1,
        maxImportsMonth: 200,
        maxExportsDay: 30,
        maxExportRows: 999,
        dataRetentionMonths: 24,
        includedRateShopsMonth: 50,
        features: [
            'pricing_calc',
            'promo_stacking',
            'daily_actions',
            'rate_calendar',
            'export_excel',
            'pickup_pace_simple',
            'guardrails',
            'decision_log',
            'basic_analytics',
        ],
    },
    SUITE: {
        name: 'SUITE',
        displayName: 'Strategist',
        description: 'Multi-property + Advanced Analytics',
        maxUsers: 10,
        maxProperties: 5,
        maxImportsMonth: 999,
        maxExportsDay: 999,
        maxExportRows: 999,
        dataRetentionMonths: 60,
        includedRateShopsMonth: 300,
        features: [
            'pricing_calc',
            'promo_stacking',
            'daily_actions',
            'rate_calendar',
            'export_excel',
            'pickup_pace_simple',
            'guardrails',
            'decision_log',
            'basic_analytics',
            'advanced_analytics',
            'multi_property',
            'api_import',
            'rate_shopper_addon',
        ],
    },
};

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

/**
 * Get tier config by plan
 */
export function getTierConfig(plan: PlanTier): TierConfig {
    return TIER_CONFIGS[plan];
}

/**
 * Check if a tier has a specific feature
 */
export function tierHasFeature(plan: PlanTier, feature: FeatureKey): boolean {
    return TIER_CONFIGS[plan].features.includes(feature);
}

/**
 * Get the minimum tier required for a feature
 */
export function getMinimumTierForFeature(feature: FeatureKey): PlanTier | null {
    const tiers: PlanTier[] = ['STANDARD', 'SUPERIOR', 'DELUXE', 'SUITE'];
    for (const tier of tiers) {
        if (TIER_CONFIGS[tier].features.includes(feature)) {
            return tier;
        }
    }
    return null;
}

/**
 * Get display name for upgrade prompt
 */
export function getUpgradeTierName(feature: FeatureKey): string {
    const tier = getMinimumTierForFeature(feature);
    if (!tier) return 'Pro';
    return TIER_CONFIGS[tier].displayName;
}
