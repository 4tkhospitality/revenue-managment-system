// ════════════════════════════════════════════════════════════════════
// React Hook — useEntitlements
// ════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Entitlements, QuotaInfo, FeatureKey, GateType } from '@/lib/plg/types';
import type { TrialProgress } from '@/lib/plg/trial';

interface EntitlementsData extends Entitlements {
    quotas: {
        imports: QuotaInfo;
        exports: QuotaInfo;
        users: QuotaInfo;
    };
    trialProgress: TrialProgress | null;
}

interface UseEntitlementsResult {
    data: EntitlementsData | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useEntitlements(hotelId: string | null): UseEntitlementsResult {
    const [data, setData] = useState<EntitlementsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEntitlements = useCallback(async () => {
        if (!hotelId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/entitlements?hotelId=${hotelId}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setData(json);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load entitlements');
        } finally {
            setLoading(false);
        }
    }, [hotelId]);

    useEffect(() => {
        fetchEntitlements();
    }, [fetchEntitlements]);

    return { data, loading, error, refetch: fetchEntitlements };
}

/**
 * Shorthand: check if a feature is available.
 */
export function useFeatureGate(
    hotelId: string | null,
    featureKey: FeatureKey,
): { allowed: boolean; gateType: GateType; loading: boolean } {
    const { data, loading } = useEntitlements(hotelId);

    if (!data) return { allowed: false, gateType: 'hard', loading };

    // Inline gate check using feature flags
    const featureMap: Record<FeatureKey, keyof typeof data.features> = {
        bulkPricing: 'canBulkPricing',
        playbook: 'canPlaybook',
        analytics: 'canAnalytics',
        multiHotel: 'canMultiHotel',
        rateShopper: 'canRateShopper',
        persistScenarios: 'canPersistScenarios',
    };

    const allowed = data.features[featureMap[featureKey]];
    const gateType: GateType = allowed ? 'free' : 'hard';

    return { allowed, gateType, loading };
}

/**
 * Shorthand: get quota info for a key.
 */
export function useQuota(
    hotelId: string | null,
    quotaKey: 'imports' | 'exports' | 'users',
) {
    const { data, loading } = useEntitlements(hotelId);

    if (!data) {
        return {
            used: 0,
            limit: 0,
            remaining: 0,
            isNearLimit: false,
            isExceeded: false,
            loading,
        };
    }

    return { ...data.quotas[quotaKey], loading };
}
