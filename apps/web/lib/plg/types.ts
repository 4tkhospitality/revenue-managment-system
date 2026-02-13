// ════════════════════════════════════════════════════════════════════
// PLG — Type Definitions
// ════════════════════════════════════════════════════════════════════

import { PlanTier, SubscriptionStatus } from '@prisma/client';

export type FeatureKey =
    | 'bulkPricing'
    | 'playbook'
    | 'analytics'
    | 'multiHotel'
    | 'rateShopper'
    | 'persistScenarios';

export type QuotaKey = 'imports' | 'exports' | 'users';

export type GateType = 'free' | 'soft' | 'hard' | 'preview' | 'quota';

export interface FeatureFlags {
    canBulkPricing: boolean;
    canPlaybook: boolean;
    canAnalytics: boolean;
    canMultiHotel: boolean;
    canRateShopper: boolean;
    canPersistScenarios: boolean;
}

export interface PlanLimits {
    maxUsers: number;
    maxProperties: number;
    maxImportsMonth: number;
    maxExportsDay: number;
    maxExportRows: number;
    maxScenarios: number;         // 0 = unlimited
    includedRateShopsMonth: number;
    dataRetentionMonths: number;
}

export interface Entitlements {
    plan: PlanTier;
    effectivePlan: PlanTier;       // DELUXE during trial, else actual plan
    status: SubscriptionStatus;
    limits: PlanLimits;
    features: FeatureFlags;
    isTrialActive: boolean;
    isTrialExpired: boolean;
    trialEndsAt: Date | null;
    trialBonusGranted: boolean;
    trialDaysRemaining: number;
}

export interface QuotaInfo {
    key: QuotaKey;
    used: number;
    limit: number;
    remaining: number;
    isNearLimit: boolean;     // >= 80%
    isExceeded: boolean;
}

export interface UpgradeInfo {
    currentPlan: PlanTier;
    requiredPlan: PlanTier;
    featureKey?: FeatureKey;
    quotaKey?: QuotaKey;
    reasonCodes: string[];
}
