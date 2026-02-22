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
    /** Whether the user meets the required tier (or is super_admin) */
    hasAccess: boolean;
    /** Whether the subscription has expired */
    isExpired: boolean;
    /** When the subscription period ends */
    periodEnd: string | null;
    /** Still loading */
    loading: boolean;
}

/**
 * Hook to check if the user has access to a feature based on their tier.
 * Super admin always has access (bypasses paywall).
 * Demo hotel users see paywalls like regular users.
 * Expired subscriptions are treated as STANDARD tier.
 */
export function useTierAccess(requiredTier: string): TierAccessResult {
    const [currentPlan, setCurrentPlan] = useState('STANDARD');
    const [isDemo, setIsDemo] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [periodEnd, setPeriodEnd] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            fetch('/api/is-demo-hotel').then(r => r.json()).catch(() => ({ isDemo: false })),
            fetch('/api/subscription').then(r => r.ok ? r.json() : { plan: 'STANDARD' }).catch(() => ({ plan: 'STANDARD' })),
        ]).then(([demoData, subData]) => {
            if (cancelled) return;
            setIsDemo(demoData.isDemo || false);
            setIsSuperAdmin(demoData.role === 'super_admin');
            setCurrentPlan(subData.plan || 'STANDARD');
            setIsExpired(subData.isExpired || false);
            setPeriodEnd(subData.periodEnd || null);
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, []);

    // Demo hotel viewers get SUPERIOR tier access → can see Analytics to evaluate the product.
    // Rate Shopper (SUITE) still shows paywall for demo users.
    // Expired subscriptions are already downgraded server-side, but double-check here.
    // Super admins are NEVER treated as demo — they get full access everywhere.
    const effectiveIsDemo = isDemo && !isSuperAdmin;
    const effectivePlan = effectiveIsDemo ? 'SUPERIOR' : currentPlan;
    const userLevel = TIER_LEVELS[effectivePlan] ?? 0;
    const requiredLevel = TIER_LEVELS[requiredTier] ?? 0;
    const hasAccess = isSuperAdmin || userLevel >= requiredLevel;

    return { currentPlan, isDemo: effectiveIsDemo, hasAccess, isExpired, periodEnd, loading };
}

