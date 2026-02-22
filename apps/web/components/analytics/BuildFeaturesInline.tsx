'use client';

import { useState, useCallback, useRef } from 'react';
import { Zap, RefreshCw, MoreHorizontal, Square, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface BuildFeaturesInlineProps {
    asOfDate: string;
    hint?: string;
    latestAvailable?: string | null;
    hotelId: string;
    onBuildComplete: () => void; // refetch analytics after build
}

/**
 * Inline banner shown when features_daily is missing for the selected as_of_date.
 * Provides 3 actions:
 * - Build this date (single date)
 * - Build all (smart skip)
 * - Rebuild (force) in overflow menu
 */
export function BuildFeaturesInline({
    asOfDate,
    hint,
    hotelId,
    onBuildComplete,
}: BuildFeaturesInlineProps) {
    const t = useTranslations('analyticsTab');
    const [building, setBuilding] = useState(false);
    const [batchProgress, setBatchProgress] = useState<{ built: number; skipped: number; total: number } | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const abortRef = useRef(false);

    // Single date build via server action
    const buildSingleDate = useCallback(async () => {
        setBuilding(true);
        try {
            const { buildFeaturesDaily } = await import('@/app/actions/buildFeaturesDaily');
            await buildFeaturesDaily(hotelId, asOfDate, true);
            onBuildComplete();
        } catch (e) {
            console.error('Build single failed:', e);
        } finally {
            setBuilding(false);
        }
    }, [hotelId, asOfDate, onBuildComplete]);

    // Batch backfill with progress polling
    const buildAll = useCallback(async (mode: 'smart' | 'force') => {
        setBuilding(true);
        setBatchProgress({ built: 0, skipped: 0, total: 0 });
        abortRef.current = false;
        setShowMenu(false);

        let cursor: string | null = null;
        let totalBuilt = 0;
        let totalSkipped = 0;
        let total = 0;

        try {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                if (abortRef.current) break;

                const res: Response = await fetch('/api/analytics/backfill', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cursor, batchSize: 7, mode }),
                });

                if (!res.ok) break;

                const data: { built: number; skipped: number; total: number; nextCursor: string | null; done: boolean } = await res.json();
                totalBuilt += data.built;
                totalSkipped += data.skipped;
                if (total === 0) total = data.total;

                setBatchProgress({ built: totalBuilt, skipped: totalSkipped, total });

                if (data.done || !data.nextCursor) break;
                cursor = data.nextCursor;
            }

            onBuildComplete();
        } catch (e) {
            console.error('Backfill failed:', e);
        } finally {
            setBuilding(false);
            setBatchProgress(null);
        }
    }, [onBuildComplete]);

    const stop = useCallback(() => {
        abortRef.current = true;
    }, []);

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 relative">
            {/* Main message */}
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-amber-800">
                        {t('noPickupStly', { date: asOfDate })}
                    </div>
                    <div className="text-xs text-amber-600 mt-0.5">
                        {hint || t('buildHint')}
                    </div>

                    {/* Progress bar */}
                    {batchProgress && batchProgress.total > 0 && (
                        <div className="mt-2">
                            <div className="flex items-center gap-2 text-xs text-amber-700">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>{t('daysProgress', { done: batchProgress.built + batchProgress.skipped, total: batchProgress.total })}</span>
                                <span className="text-amber-500">{t('builtSkipped', { built: batchProgress.built, skipped: batchProgress.skipped })}</span>
                            </div>
                            <div className="mt-1 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.round(((batchProgress.built + batchProgress.skipped) / batchProgress.total) * 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {building && batchProgress ? (
                        <button
                            onClick={stop}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                        >
                            <Square className="w-3 h-3" />
                            {t('stop')}
                        </button>
                    ) : building ? (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t('building')}
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={buildSingleDate}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
                            >
                                <Zap className="w-3 h-3" />
                                {t('buildThisDate')}
                            </button>
                            <button
                                onClick={() => buildAll('smart')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
                            >
                                <RefreshCw className="w-3 h-3" />
                                {t('buildAll')}
                            </button>

                            {/* Overflow menu for force rebuild */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {showMenu && (
                                    <>
                                        {/* Backdrop */}
                                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[160px]">
                                            <button
                                                onClick={() => buildAll('force')}
                                                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                {t('rebuildForce')}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
