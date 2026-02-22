'use client';

import { useState, useRef, useCallback } from 'react';
import { getOTBBuildPlan, buildOTBBatch } from '../actions/buildOTBBatched';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const BATCH_SIZE = 5; // dates per batch

interface BuildProgress {
    current: number;
    total: number;
    built: number;
    skipped: number;
    phase: 'planning' | 'building' | 'done' | 'error';
}

export function BuildOtbButton() {
    const t = useTranslations('dataPage');
    const [progress, setProgress] = useState<BuildProgress | null>(null);
    const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
    const abortRef = useRef(false);
    const router = useRouter();

    const isBuilding = progress !== null && progress.phase !== 'done' && progress.phase !== 'error';

    const handleBuildOTB = useCallback(async () => {
        setResult(null);
        abortRef.current = false;
        setProgress({ current: 0, total: 0, built: 0, skipped: 0, phase: 'planning' });

        try {
            // Phase 1: Get build plan (fast)
            const plan = await getOTBBuildPlan();
            if ('error' in plan) {
                setProgress(null);
                setResult({ success: false, error: plan.error as string });
                return;
            }

            const { hotelId, dates, total, existing, stayDateFrom, stayDateTo, tiers } = plan;

            if (total === 0) {
                setProgress(null);
                setResult({ success: true, message: t('allExist', { n: existing }) });
                return;
            }

            setProgress({ current: 0, total, built: 0, skipped: 0, phase: 'building' });

            // Phase 2: Build in batches
            let totalBuilt = 0;
            let totalSkipped = 0;
            let nextIndex = 0;

            while (nextIndex < dates.length) {
                if (abortRef.current) break;

                const batchResult = await buildOTBBatch(
                    hotelId,
                    dates,
                    nextIndex,
                    BATCH_SIZE,
                    stayDateFrom,
                    stayDateTo,
                );

                totalBuilt += batchResult.built;
                totalSkipped += batchResult.skipped;
                nextIndex = batchResult.nextIndex;

                setProgress({
                    current: nextIndex,
                    total,
                    built: totalBuilt,
                    skipped: totalSkipped,
                    phase: batchResult.done ? 'done' : 'building',
                });

                if (batchResult.done) break;
            }

            const stoppedEarly = abortRef.current;
            setProgress(prev => prev ? { ...prev, phase: 'done' } : null);
            setResult({
                success: totalBuilt > 0,
                message: stoppedEarly
                    ? t('stoppedEarly', { built: totalBuilt, total, skipped: totalSkipped })
                    : t('buildDone', { built: totalBuilt, daily: tiers.daily, weekly: tiers.weekly, monthly: tiers.monthly, skipped: totalSkipped, existing }),
            });

            router.refresh();
        } catch (err) {
            setProgress(prev => prev ? { ...prev, phase: 'error' } : null);
            setResult({ success: false, error: String(err) });
        }
    }, [router]);

    const handleStop = useCallback(() => {
        abortRef.current = true;
    }, []);

    const percent = progress && progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0;

    return (
        <div className="flex items-center gap-3">
            {/* Build button */}
            <button
                onClick={handleBuildOTB}
                disabled={isBuilding}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${isBuilding
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm'
                    }`}
            >
                {isBuilding ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {progress?.phase === 'planning' ? t('planning') : `${percent}%`}
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Build OTB
                    </>
                )}
            </button>

            {/* Stop button */}
            {isBuilding && progress?.phase === 'building' && (
                <button
                    onClick={handleStop}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all"
                >
                    {t('stop')}
                </button>
            )}

            {/* Progress bar inline */}
            {isBuilding && progress && progress.total > 0 && (
                <div className="flex items-center gap-2 min-w-[200px]">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                        {progress.current}/{progress.total}
                    </span>
                </div>
            )}

            {/* Result message */}
            {!isBuilding && result && (
                <span className={`text-sm font-medium ${result.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {result.success ? result.message : `✗ ${result.error}`}
                </span>
            )}
        </div>
    );
}
