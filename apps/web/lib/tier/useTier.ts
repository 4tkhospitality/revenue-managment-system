'use client';

/**
 * Client-side hook for tier-based feature gating
 */

import { useEffect, useState } from 'react';
import { PlanTier } from '@prisma/client';
import { TIER_CONFIGS, FeatureKey, TierConfig, tierHasFeature } from './tierConfig';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface TierInfo {
    plan: PlanTier;
    config: TierConfig;
    features: FeatureKey[];
    limits: {
        maxUsers: number;
        maxImportsMonth: number;
        maxExportsDay: number;
        maxExportRows: number;
    };
    usage: {
        importsThisMonth: number;
        exportsToday: number;
    };
    loading: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════

/**
 * Get current hotel tier info for UI gating
 */
export function useTier(hotelId: string | null): TierInfo {
    const [tierInfo, setTierInfo] = useState<TierInfo>({
        plan: 'STANDARD',
        config: TIER_CONFIGS.STANDARD,
        features: TIER_CONFIGS.STANDARD.features,
        limits: {
            maxUsers: TIER_CONFIGS.STANDARD.maxUsers,
            maxImportsMonth: TIER_CONFIGS.STANDARD.maxImportsMonth,
            maxExportsDay: TIER_CONFIGS.STANDARD.maxExportsDay,
            maxExportRows: TIER_CONFIGS.STANDARD.maxExportRows,
        },
        usage: {
            importsThisMonth: 0,
            exportsToday: 0,
        },
        loading: true,
    });

    useEffect(() => {
        if (!hotelId) {
            setTierInfo((prev) => ({ ...prev, loading: false }));
            return;
        }

        const fetchTier = async () => {
            try {
                const res = await fetch(`/api/subscription?hotelId=${hotelId}`);
                if (res.ok) {
                    const data = await res.json();
                    const config = TIER_CONFIGS[data.plan as PlanTier] || TIER_CONFIGS.STANDARD;
                    setTierInfo({
                        plan: data.plan,
                        config,
                        features: config.features,
                        limits: {
                            maxUsers: data.maxUsers ?? config.maxUsers,
                            maxImportsMonth: data.maxImportsMonth ?? config.maxImportsMonth,
                            maxExportsDay: data.maxExportsDay ?? config.maxExportsDay,
                            maxExportRows: data.maxExportRows ?? config.maxExportRows,
                        },
                        usage: {
                            importsThisMonth: data.usage?.importsThisMonth ?? 0,
                            exportsToday: data.usage?.exportsToday ?? 0,
                        },
                        loading: false,
                    });
                } else {
                    setTierInfo((prev) => ({ ...prev, loading: false }));
                }
            } catch {
                setTierInfo((prev) => ({ ...prev, loading: false }));
            }
        };

        fetchTier();
    }, [hotelId]);

    return tierInfo;
}

/**
 * Check if current tier has a feature (client-side)
 */
export function useHasFeature(hotelId: string | null, feature: FeatureKey): boolean {
    const { plan, loading } = useTier(hotelId);
    if (loading) return false;
    return tierHasFeature(plan, feature);
}

/**
 * Check if limit allows more usage (client-side)
 */
export function useCanUse(
    hotelId: string | null,
    resource: 'imports' | 'exports'
): { allowed: boolean; remaining: number } {
    const { limits, usage, loading } = useTier(hotelId);

    if (loading) return { allowed: false, remaining: 0 };

    if (resource === 'imports') {
        const remaining = limits.maxImportsMonth - usage.importsThisMonth;
        return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
    }

    const remaining = limits.maxExportsDay - usage.exportsToday;
    return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}
