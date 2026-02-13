// ════════════════════════════════════════════════════════════════════
// Shared — Custom Error Classes for PLG Gating
// ════════════════════════════════════════════════════════════════════

import { PlanTier } from '@prisma/client';
import type { FeatureKey, QuotaKey } from '@/lib/plg/types';

export class PaywallError extends Error {
    public readonly featureKey: FeatureKey;
    public readonly currentPlan: PlanTier;
    public readonly requiredPlan: PlanTier;
    public readonly reasonCodes: string[];

    constructor(opts: {
        featureKey: FeatureKey;
        currentPlan: PlanTier;
        requiredPlan: PlanTier;
        reasonCodes?: string[];
    }) {
        super(`Feature "${opts.featureKey}" requires plan ${opts.requiredPlan} (current: ${opts.currentPlan})`);
        this.name = 'PaywallError';
        this.featureKey = opts.featureKey;
        this.currentPlan = opts.currentPlan;
        this.requiredPlan = opts.requiredPlan;
        this.reasonCodes = opts.reasonCodes ?? ['feature_locked'];
    }
}

export class QuotaExceededError extends Error {
    public readonly quotaKey: QuotaKey;
    public readonly current: number;
    public readonly limit: number;
    public readonly reasonCodes: string[];

    constructor(opts: {
        quotaKey: QuotaKey;
        current: number;
        limit: number;
        reasonCodes?: string[];
    }) {
        super(`Quota "${opts.quotaKey}" exceeded: ${opts.current}/${opts.limit}`);
        this.name = 'QuotaExceededError';
        this.quotaKey = opts.quotaKey;
        this.current = opts.current;
        this.limit = opts.limit;
        this.reasonCodes = opts.reasonCodes ?? ['quota_exceeded'];
    }
}

export class AuthorizationError extends Error {
    constructor(message = 'Not authorized to access this resource') {
        super(message);
        this.name = 'AuthorizationError';
    }
}
