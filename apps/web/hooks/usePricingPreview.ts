'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface PricingPreviewResult {
    net: number;
    bar: number;
    display: number;
    totalDiscountEffective: number;
    trace: { step: string; description: string; priceAfter: number }[];
    validation: { isValid: boolean; errors: string[]; warnings: string[] };
}

interface UsePricingPreviewInput {
    channelId: string | undefined;
    roomTypeId?: string;
    mode: 'NET' | 'BAR' | 'DISPLAY';
    value: number;
    selectedCampaignInstanceIds?: string[];
    seasonId?: string;
    occPct?: number;
    debounceMs?: number;
}

/**
 * Hook to call /api/pricing/calc-preview with debounce.
 * Returns server-computed pricing preview values.
 * This is the ONLY way frontend should get pricing calculations.
 */
export function usePricingPreview(input: UsePricingPreviewInput) {
    const [result, setResult] = useState<PricingPreviewResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchPreview = useCallback(async () => {
        if (!input.channelId || !input.value) {
            setResult(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/pricing/calc-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: input.channelId,
                    roomTypeId: input.roomTypeId,
                    mode: input.mode,
                    value: input.value,
                    selectedCampaignInstanceIds: input.selectedCampaignInstanceIds,
                    seasonId: input.seasonId,
                    occPct: input.occPct,
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to calculate preview');
            }

            const data: PricingPreviewResult = await res.json();
            setResult(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Preview failed');
        } finally {
            setLoading(false);
        }
    }, [
        input.channelId,
        input.roomTypeId,
        input.mode,
        input.value,
        JSON.stringify(input.selectedCampaignInstanceIds),
        input.seasonId,
        input.occPct,
    ]);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(fetchPreview, input.debounceMs ?? 300);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [fetchPreview, input.debounceMs]);

    return { result, loading, error };
}
