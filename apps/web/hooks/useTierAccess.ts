'use client';

import { useState, useEffect } from 'react';

const TIER_LEVELS: Record<string, number> = {
    STANDARD: 0,
    SUPERIOR: 1,
    DELUXE: 2,
    SUITE: 3,
};

interface TierAccessResult {
    /** User's current plan */
    currentPlan: string;
    /** Whether the hotel is a demo hotel */
    isDemo: boolean;
    /** Whether the user meets the required tier (or is demo) */
    hasAccess: boolean;
    /** Still loading */
    loading: boolean;
}

/**
 * Hook to check if the user has access to a feature based on their tier.
 * Demo hotel users always have access (for showcase).
 * Super admin always has access.
 */
export function useTierAccess(requiredTier: string): TierAccessResult {
    const [currentPlan, setCurrentPlan] = useState('STANDARD');
    const [isDemo, setIsDemo] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            fetch('/api/is-demo-hotel').then(r => r.json()).catch(() => ({ isDemo: false })),
            fetch('/api/subscription').then(r => r.ok ? r.json() : { plan: 'STANDARD' }).catch(() => ({ plan: 'STANDARD' })),
        ]).then(([demoData, subData]) => {
            if (cancelled) return;
            setIsDemo(demoData.isDemo || false);
            setCurrentPlan(subData.plan || 'STANDARD');
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, []);

    const userLevel = TIER_LEVELS[currentPlan] ?? 0;
    const requiredLevel = TIER_LEVELS[requiredTier] ?? 0;
    const hasAccess = isDemo || userLevel >= requiredLevel;

    return { currentPlan, isDemo, hasAccess, loading };
}
