'use client';

import { ReactNode, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QuickModePanel, type QuickModeRecommendation } from './QuickModePanel';
import { Zap, Table2, ChevronDown, ChevronUp, DollarSign, TrendingUp, BarChart3, ShieldCheck } from 'lucide-react';
import { TierPaywall } from '@/components/paywall/TierPaywall';
import { useTierAccess } from '@/hooks/useTierAccess';
import { useTranslations } from 'next-intl';

// ─── UUPM Surface ───────────────────────────────────────────────
const surface = "rounded-[var(--card-radius)] bg-white border border-slate-200/80 shadow-[var(--shadow-card)]";

interface QuickModePricingWrapperProps {
    isQuickMode: boolean;
    quickModeData: QuickModeRecommendation[];
    onAcceptAll: () => Promise<void>;
    onAcceptOne: (stayDate: string) => Promise<void>;
    detailedContent: ReactNode;
}

export function QuickModePricingWrapper({
    isQuickMode,
    quickModeData,
    onAcceptAll,
    onAcceptOne,
    detailedContent,
}: QuickModePricingWrapperProps) {
    const t = useTranslations('quickMode');
    const { hasAccess, isDemo, loading: tierLoading } = useTierAccess('SUPERIOR');
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showGuide, setShowGuide] = useState(false);

    const toggleMode = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', 'pricing');
        if (isQuickMode) {
            params.delete('mode');
        } else {
            params.set('mode', 'quick');
        }
        router.push(`/dashboard?${params.toString()}`);
    }, [isQuickMode, router, searchParams]);

    // ── Tier gate: SUPERIOR required + Demo users always see paywall ──
    if (tierLoading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!hasAccess || isDemo) {
        return (
            <TierPaywall
                title={t('paywallTitle')}
                subtitle={t('paywallSubtitle')}
                tierDisplayName="Superior"
                colorScheme="blue"
                features={[
                    { icon: <DollarSign className="w-4 h-4" />, label: t('paywallFeature1') },
                    { icon: <TrendingUp className="w-4 h-4" />, label: t('paywallFeature2') },
                    { icon: <Zap className="w-4 h-4" />, label: t('paywallFeature3') },
                    { icon: <ShieldCheck className="w-4 h-4" />, label: t('paywallFeature4') },
                ]}
            />
        );
    }

    return (
        <div className="space-y-4">
            {/* ── Mode Selector + Explainer ─────────────────────── */}
            <div className={`${surface} overflow-hidden`}>
                {/* Toggle Bar */}
                <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        {/* Mode Toggle — tab-style */}
                        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                            <button
                                onClick={isQuickMode ? undefined : toggleMode}
                                className={`px-4 py-2 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${isQuickMode
                                    ? 'text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                style={{ backgroundColor: isQuickMode ? '#1E3A8A' : '#f8fafc' }}
                            >
                                <Zap className="w-3.5 h-3.5" /> {t('quickReview')}
                            </button>
                            <button
                                onClick={!isQuickMode ? undefined : toggleMode}
                                className={`px-4 py-2 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${!isQuickMode
                                    ? 'text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                style={{ backgroundColor: !isQuickMode ? '#1E3A8A' : '#f8fafc' }}
                            >
                                <Table2 className="w-3.5 h-3.5" /> {t('detailedAnalysis')}
                            </button>
                        </div>

                        {/* Current mode label */}
                        <span className="text-xs text-slate-400 hidden sm:inline">
                            {isQuickMode ? t('quickDesc') : t('detailedDesc')}
                        </span>
                    </div>

                    {/* Help toggle */}
                    <button
                        onClick={() => setShowGuide(!showGuide)}
                        className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                        {t('guide')} {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                </div>

                {/* ── Expandable Guide ────────────────────────────── */}
                {showGuide && (
                    <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Quick Mode */}
                            <div className={`${isQuickMode ? 'ring-2 ring-blue-200' : ''} bg-white rounded-xl p-4 border border-slate-200`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    <h4 className="text-sm font-semibold text-slate-900">{t('quickReview')}</h4>
                                    {isQuickMode && (
                                        <span className="text-[10px] px-2 py-0.5 rounded text-white font-medium" style={{ backgroundColor: '#1E3A8A' }}>
                                            {t('currentlyUsing')}
                                        </span>
                                    )}
                                </div>
                                <ul className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
                                    <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">●</span><span><b>{t('guideQuickWhen')}</b></span></li>
                                    <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">●</span><span><b>{t('guideQuickWhat')}</b></span></li>
                                    <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">●</span><span><b>{t('guideQuickDecision')}</b></span></li>
                                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">●</span><span><b>{t('guideQuickSource')}</b></span></li>
                                </ul>
                            </div>

                            {/* Detailed Mode */}
                            <div className={`${!isQuickMode ? 'ring-2 ring-blue-200' : ''} bg-white rounded-xl p-4 border border-slate-200`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Table2 className="w-4 h-4 text-blue-500" />
                                    <h4 className="text-sm font-semibold text-slate-900">{t('detailedAnalysis')}</h4>
                                    {!isQuickMode && (
                                        <span className="text-[10px] px-2 py-0.5 rounded text-white font-medium" style={{ backgroundColor: '#1E3A8A' }}>
                                            {t('currentlyUsing')}
                                        </span>
                                    )}
                                </div>
                                <ul className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
                                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">●</span><span><b>{t('guideDetailedWhen')}</b></span></li>
                                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">●</span><span><b>{t('guideDetailedWhat')}</b></span></li>
                                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">●</span><span><b>{t('guideDetailedDecision')}</b></span></li>
                                    <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">●</span><span><b>{t('guideDetailedSource')}</b></span></li>
                                </ul>
                            </div>
                        </div>

                        {/* Source of Truth */}
                        <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                            <b className="text-slate-700">Source of Truth:</b> {t('sourceOfTruth')}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Content ────────────────────────────────────────── */}
            {isQuickMode ? (
                <QuickModePanel
                    data={quickModeData}
                    onAcceptAll={onAcceptAll}
                    onAcceptOne={onAcceptOne}
                />
            ) : (
                detailedContent
            )}
        </div>
    );
}
