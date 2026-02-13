'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Types matching service.ts PreviewResult ──────────────────────────

interface BreakdownItem {
    group: string;
    chosenPromotionId: string;
    chosenName: string;
    chosenPercent: number;
    amountDelta: number;
    stackRule: string;
}

interface ResolvedPromotions {
    applied: string[];
    ignored: { id: string; name: string; reason: string }[];
}

export interface PricingPreviewResult {
    net: number;
    bar: number;
    display: number;
    totalDiscountEffective: number;
    calc_version: string;
    breakdown: BreakdownItem[];
    resolvedPromotions: ResolvedPromotions;
    trace: { step: string; description: string; priceAfter: number }[];
    validation: { isValid: boolean; errors: string[]; warnings: string[] };
}

export interface UsePricingPreviewInput {
    channelId: string | undefined;
    roomTypeId?: string;
    mode: 'NET' | 'BAR' | 'DISPLAY';
    value: number;
    selectedCampaignInstanceIds?: string[];
    seasonId?: string;
    occPct?: number;
    debounceMs?: number;
    /** Fingerprint that changes when discount % values change — triggers re-fetch */
    discountFingerprint?: string;
}

export interface UsePricingPreviewReturn {
    result: PricingPreviewResult | null;
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
}

/**
 * Hook to call /api/pricing/calc-preview with debounce + AbortController.
 * Returns server-computed pricing preview values.
 * This is the ONLY way frontend should get pricing calculations.
 *
 * Features:
 * - Debounce (default 300ms) to avoid flooding API on rapid toggle
 * - AbortController cancels stale requests when new ones are issued
 * - isLoading = true on first load (no previous result)
 * - isRefreshing = true on subsequent updates (previous result still shown)
 * - Dev-only console log for calc_version + payload hash tracing
 */
export function usePricingPreview(input: UsePricingPreviewInput): UsePricingPreviewReturn {
    const [result, setResult] = useState<PricingPreviewResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const hasResultRef = useRef(false);

    const fetchPreview = useCallback(async () => {
        if (!input.channelId || !input.value) {
            setResult(null);
            hasResultRef.current = false;
            return;
        }

        // Abort any in-flight request
        if (abortRef.current) {
            abortRef.current.abort();
        }
        const controller = new AbortController();
        abortRef.current = controller;

        // First load vs refresh
        if (hasResultRef.current) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        setError(null);

        const payload = {
            channelId: input.channelId,
            roomTypeId: input.roomTypeId,
            mode: input.mode,
            value: input.value,
            selectedCampaignInstanceIds: input.selectedCampaignInstanceIds,
            seasonId: input.seasonId,
            occPct: input.occPct,
        };

        try {
            const res = await fetch('/api/pricing/calc-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to calculate preview');
            }

            const data: PricingPreviewResult = await res.json();

            // Dev-only tracing
            if (process.env.NODE_ENV === 'development') {
                console.log(`[PricingPreview] ${data.calc_version} | mode=${input.mode} | bar=${data.bar} | display=${data.display} | net=${data.net} | effective=${data.totalDiscountEffective}%`);
            }

            setResult(data);
            hasResultRef.current = true;
        } catch (e) {
            // Don't update state if request was aborted (superseded by newer request)
            if (e instanceof DOMException && e.name === 'AbortError') return;
            setError(e instanceof Error ? e.message : 'Preview failed');
        } finally {
            if (!controller.signal.aborted) {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        }
    }, [
        input.channelId,
        input.roomTypeId,
        input.mode,
        input.value,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        JSON.stringify(input.selectedCampaignInstanceIds),
        input.seasonId,
        input.occPct,
        input.discountFingerprint,
    ]);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(fetchPreview, input.debounceMs ?? 300);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            // Abort on unmount
            if (abortRef.current) abortRef.current.abort();
        };
    }, [fetchPreview, input.debounceMs]);

    return { result, isLoading, isRefreshing, error };
}
