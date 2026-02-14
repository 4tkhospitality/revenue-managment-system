'use client';

import { useState, useEffect, useCallback } from 'react';

interface ComplianceResult {
    isCompliant: boolean;
    hotelCapacity: number;
    derivedBand: string;
    subscriptionBand: string;
    plan: string;
    message: string | null;
    isStandardViolation: boolean;
}

/**
 * Hook to check compliance between hotel capacity and subscription band.
 * Used in Dashboard and Settings pages to show warning banners.
 */
export function useComplianceCheck(hotelId?: string) {
    const [compliance, setCompliance] = useState<ComplianceResult | null>(null);
    const [loading, setLoading] = useState(true);

    const check = useCallback(async () => {
        try {
            const url = hotelId
                ? `/api/subscription/compliance?hotelId=${hotelId}`
                : '/api/subscription/compliance';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setCompliance(data);
            }
        } catch {
            // Silently fail — no compliance data means no banner
        } finally {
            setLoading(false);
        }
    }, [hotelId]);

    useEffect(() => {
        check();
    }, [check]);

    return { compliance, loading, recheck: check };
}
