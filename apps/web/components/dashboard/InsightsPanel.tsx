'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    Lightbulb,
    ChevronDown,
    ChevronUp,
    Flame,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    DollarSign,
    XCircle,
    Building2,
    Rocket,
    Shield,
    Target,
} from 'lucide-react';
import type { InsightCard, ConfidenceLevel } from '@/lib/insights/insightsV2Engine';

// ── Surface ───────────────────────────────────────────────────────
const surface =
    'rounded-[var(--card-radius)] bg-white border border-slate-200/80 shadow-[var(--shadow-card)]';

// ── Confidence dot ────────────────────────────────────────────────
const confDotColor: Record<ConfidenceLevel, string> = {
    HIGH: 'bg-emerald-500',
    MEDIUM: 'bg-amber-400',
    LOW: 'bg-slate-300',
};

function ConfidenceDot({ level }: { level: ConfidenceLevel }) {
    return (
        <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${confDotColor[level]} shrink-0`}
            title={level}
        />
    );
}

// ── Severity → visual config ──────────────────────────────────────
function getConfig(card: InsightCard) {
    switch (card.severity) {
        case 'danger':
            return {
                border: 'border-l-rose-500',
                bg: 'bg-rose-50/60',
                icon: AlertTriangle,
                iconColor: 'text-rose-500',
            };
        case 'hot':
            return {
                border: 'border-l-orange-400',
                bg: 'bg-orange-50/60',
                icon: Flame,
                iconColor: 'text-orange-500',
            };
        case 'warning':
            return {
                border: 'border-l-amber-400',
                bg: 'bg-amber-50/40',
                icon: AlertTriangle,
                iconColor: 'text-amber-500',
            };
        case 'success':
            return {
                border: 'border-l-emerald-400',
                bg: 'bg-emerald-50/40',
                icon: TrendingUp,
                iconColor: 'text-emerald-500',
            };
        case 'info':
        default:
            return {
                border: 'border-l-blue-400',
                bg: 'bg-blue-50/30',
                icon: Lightbulb,
                iconColor: 'text-blue-500',
            };
    }
}

// ── Insight icon by type ──────────────────────────────────────────
function getTypeIcon(type: InsightCard['type']) {
    switch (type) {
        case 'compression_hot':
        case 'top3':
            return Flame;
        case 'compression_danger':
            return AlertTriangle;
        case 'revenue_opportunity':
            return DollarSign;
        case 'pace_stly':
            return TrendingUp;
        case 'pickup_acceleration':
            return Rocket;
        case 'cancel_tier1':
        case 'cancel_tier2':
            return XCircle;
        case 'segment_mix':
            return Building2;
        default:
            return Lightbulb;
    }
}

// ── Single Card ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CardItem({ card, t }: { card: InsightCard; t: any }) {
    const [open, setOpen] = useState(false);
    const cfg = getConfig(card);
    const Icon = card.type === 'top3' ? getTypeIcon(card.severity === 'danger' ? 'compression_danger' : 'compression_hot') : getTypeIcon(card.type);

    return (
        <div
            className={`rounded-md border border-slate-100 border-l-[3px] ${cfg.border} transition-colors duration-200 cursor-pointer hover:bg-slate-50/80`}
            onClick={() => setOpen(!open)}
        >
            {/* Collapsed row */}
            <div className="flex items-center gap-2 px-3 py-2.5">
                <Icon className={`w-3.5 h-3.5 shrink-0 ${cfg.iconColor}`} />
                <span className="text-[13px] font-medium text-slate-800 flex-1 truncate leading-tight">
                    {card.title}
                </span>
                <ConfidenceDot level={card.confidence} />
                <ChevronDown
                    className={`w-3 h-3 text-slate-300 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </div>

            {/* Action preview — always visible */}
            {!open && (
                <div className="px-3 pb-2 -mt-0.5">
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-1 pl-[22px]">
                        {card.doThis}
                    </p>
                </div>
            )}

            {/* Expanded */}
            {open && (
                <div className="px-3 pb-3 space-y-2 border-t border-slate-100/80 mx-2 pt-2">
                    {/* What — Situation */}
                    <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{t('situation')}</p>
                        <p className="text-[11px] text-slate-600 leading-snug">{card.what}</p>
                    </div>
                    {/* So What — So What */}
                    <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{t('soWhat')}</p>
                        <p className="text-[11px] text-slate-700 leading-snug font-medium">{card.soWhat}</p>
                    </div>
                    {/* Do This — Do This */}
                    <div className="bg-slate-50 rounded px-2.5 py-2">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-blue-500 mb-0.5">{t('doThis')}</p>
                        <p className="text-[11px] text-slate-700 font-medium leading-snug">{card.doThis}</p>
                    </div>
                    {/* Impact — Impact */}
                    <div className="flex items-start gap-1.5">
                        <TrendingUp className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{t('estimatedImpact')}</p>
                            <p className="text-[10px] text-slate-500 leading-snug">{card.impact}</p>
                        </div>
                    </div>
                    {/* Pricing hint */}
                    {card.pricingHint && (
                        <p className="text-[10px] text-indigo-500 pl-[18px]">
                            {card.pricingHint}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main Panel ────────────────────────────────────────────────────
export interface InsightsPanelV2Props {
    top3: InsightCard[];
    compression: InsightCard[];
    otherInsights: InsightCard[];
}

export function InsightsPanel({ top3, compression, otherInsights }: InsightsPanelV2Props) {
    const t = useTranslations('insights');
    const [activeTab, setActiveTab] = useState<'actions' | 'dates'>('actions');
    const [showMore, setShowMore] = useState(false);

    // Compression dates NOT already in top3
    const compressionExtra = compression.filter(
        (c) => !top3.some((t) => t.stayDates?.[0] === c.stayDates?.[0] && t.title === c.title),
    );

    const actionsCount = top3.length + otherInsights.length;
    const datesCount = compressionExtra.length;
    const total = actionsCount + datesCount;

    if (total === 0) {
        return (
            <div className={`${surface} p-4 h-full`}>
                <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-slate-700">{t('title')}</h3>
                </div>
                <p className="text-xs text-slate-400 text-center py-8">
                    {t('notEnoughData')}
                </p>
            </div>
        );
    }

    // Other insights: show first 2, rest behind toggle
    const visibleOther = showMore ? otherInsights : otherInsights.slice(0, 2);
    const hiddenOtherCount = Math.max(0, otherInsights.length - 2);

    return (
        <div className={`${surface} p-4 h-full flex flex-col`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">{t('title')}</h3>
                </div>
                <span className="text-[10px] text-slate-400">{total}</span>
            </div>

            {/* Tab pills — only show if there are compression extras */}
            {datesCount > 0 && (
                <div className="flex gap-1 mb-3">
                    <button
                        type="button"
                        onClick={() => setActiveTab('actions')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors duration-200 ${activeTab === 'actions'
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                    >
                        {t('topActions')}
                        <span className={`text-[9px] px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none ${activeTab === 'actions' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                            {actionsCount}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('dates')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors duration-200 ${activeTab === 'dates'
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                    >
                        {t('otherDays')}
                        <span className={`text-[9px] px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none ${activeTab === 'dates' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                            {datesCount}
                        </span>
                    </button>
                </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 -mr-0.5">

                {/* ── TAB 1: Top Actions ── */}
                {activeTab === 'actions' && (
                    <>
                        {/* Top 3 */}
                        {top3.length > 0 && (
                            <>
                                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-1">
                                    {t('topActionsNext7')}
                                </p>
                                {top3.map((card, i) => (
                                    <CardItem key={`t-${i}`} card={card} t={t} />
                                ))}
                                {otherInsights.length > 0 && (
                                    <div className="border-t border-dashed border-slate-100 my-2" />
                                )}
                            </>
                        )}

                        {/* Other insights */}
                        {visibleOther.map((card, i) => (
                            <CardItem key={`o-${i}`} card={card} t={t} />
                        ))}

                        {/* Show more toggle for other insights */}
                        {hiddenOtherCount > 0 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMore(!showMore);
                                }}
                                className="w-full text-center text-[11px] text-blue-500 hover:text-blue-700 py-1 rounded hover:bg-blue-50/50 transition-colors duration-200"
                            >
                                {showMore ? t('collapse') : t('moreInsights', { count: hiddenOtherCount })}
                            </button>
                        )}
                    </>
                )}

                {/* ── TAB 2: Other days to watch ── */}
                {activeTab === 'dates' && (
                    <>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-1">
                            {t('daysToWatch')}
                        </p>
                        {compressionExtra.map((card, i) => (
                            <CardItem key={`c-${i}`} card={card} t={t} />
                        ))}
                        {compressionExtra.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-4">
                                {t('noNotableDays')}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
