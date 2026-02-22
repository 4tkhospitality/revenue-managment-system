'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Image, DollarSign, Calendar, Star, Zap,
    ChevronDown, ChevronRight, ExternalLink, Info,
    CheckCircle2, Circle, AlertTriangle
} from 'lucide-react';
import { useTranslations } from 'next-intl';

type FunnelPosition = 'CTR' | 'GROSS' | 'NET';

interface ChecklistItem {
    id: string;
    title: string;
    description: string;
    howTo: string;
    kpiImpact: FunnelPosition[];
    source?: string;
    sourceUrl?: string;
    benchmark?: string;
    disclaimerKey?: 'personalization' | 'benchmark' | 'api_pending';
}

interface ChecklistCategory {
    id: string;
    title: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    items: ChecklistItem[];
}

const STORAGE_KEY = 'rms_booking_checklist';

export function BookingChecklist() {
    const t = useTranslations('otaGuide.booking');
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const DISCLAIMERS = useMemo(() => ({
        personalization: {
            icon: <Info className="w-3.5 h-3.5" />,
            text: t('disclaimerPersonalization'),
            color: 'text-blue-600 bg-blue-50 border-blue-200',
        },
        benchmark: {
            icon: <AlertTriangle className="w-3.5 h-3.5" />,
            text: t('disclaimerBenchmark'),
            color: 'text-amber-600 bg-amber-50 border-amber-200',
        },
        api_pending: {
            icon: <Info className="w-3.5 h-3.5" />,
            text: t('disclaimerApiPending'),
            color: 'text-gray-500 bg-gray-50 border-gray-200',
        },
    }), [t]);

    const CATEGORIES: ChecklistCategory[] = useMemo(() => [
        {
            id: 'content',
            title: t('catContent'),
            icon: <Image className="w-4 h-4" />,
            color: 'text-purple-700',
            bgColor: 'bg-purple-50 border-purple-200',
            items: [
                {
                    id: 'bk_photo_quality',
                    title: t('photoTitle'),
                    description: t('photoDesc'),
                    howTo: t('photoHow'),
                    kpiImpact: ['CTR'],
                    source: 'Booking.com Property Page Score',
                    benchmark: t('photoBenchmark'),
                    disclaimerKey: 'benchmark',
                },
                {
                    id: 'bk_description',
                    title: t('descTitle'),
                    description: t('descDesc'),
                    howTo: t('descHow'),
                    kpiImpact: ['CTR', 'GROSS'],
                },
                {
                    id: 'bk_facilities',
                    title: t('facilitiesTitle'),
                    description: t('facilitiesDesc'),
                    howTo: t('facilitiesHow'),
                    kpiImpact: ['CTR'],
                },
            ],
        },
        {
            id: 'pricing',
            title: t('catPricing'),
            icon: <DollarSign className="w-4 h-4" />,
            color: 'text-emerald-700',
            bgColor: 'bg-emerald-50 border-emerald-200',
            items: [
                {
                    id: 'bk_rate_parity',
                    title: t('rateParityTitle'),
                    description: t('rateParityDesc'),
                    howTo: t('rateParityHow'),
                    kpiImpact: ['CTR', 'GROSS'],
                    source: 'Booking.com How We Work',
                },
                {
                    id: 'bk_flexible_policy',
                    title: t('flexPolicyTitle'),
                    description: t('flexPolicyDesc'),
                    howTo: t('flexPolicyHow'),
                    kpiImpact: ['GROSS', 'NET'],
                    source: 'Booking.com How We Work §1C',
                },
                {
                    id: 'bk_competitive_pricing',
                    title: t('competitivePriceTitle'),
                    description: t('competitivePriceDesc'),
                    howTo: t('competitivePriceHow'),
                    kpiImpact: ['CTR', 'GROSS'],
                },
            ],
        },
        {
            id: 'availability',
            title: t('catAvailability'),
            icon: <Calendar className="w-4 h-4" />,
            color: 'text-blue-700',
            bgColor: 'bg-blue-50 border-blue-200',
            items: [
                {
                    id: 'bk_availability_window',
                    title: t('availWindowTitle'),
                    description: t('availWindowDesc'),
                    howTo: t('availWindowHow'),
                    kpiImpact: ['CTR'],
                    source: 'Booking.com How We Work §1B',
                },
                {
                    id: 'bk_last_minute',
                    title: t('lastMinuteTitle'),
                    description: t('lastMinuteDesc'),
                    howTo: t('lastMinuteHow'),
                    kpiImpact: ['GROSS'],
                },
            ],
        },
        {
            id: 'reputation',
            title: t('catReviews'),
            icon: <Star className="w-4 h-4" />,
            color: 'text-yellow-700',
            bgColor: 'bg-yellow-50 border-yellow-200',
            items: [
                {
                    id: 'bk_review_score',
                    title: t('reviewScoreTitle'),
                    description: t('reviewScoreDesc'),
                    howTo: t('reviewScoreHow'),
                    kpiImpact: ['CTR', 'GROSS'],
                    source: 'Booking.com How We Work',
                },
                {
                    id: 'bk_reply_reviews',
                    title: t('replyReviewsTitle'),
                    description: t('replyReviewsDesc'),
                    howTo: t('replyReviewsHow'),
                    kpiImpact: ['CTR', 'GROSS'],
                    source: 'Booking.com Property Scores API',
                },
            ],
        },
        {
            id: 'programs',
            title: t('catPrograms'),
            icon: <Zap className="w-4 h-4" />,
            color: 'text-indigo-700',
            bgColor: 'bg-indigo-50 border-indigo-200',
            items: [
                {
                    id: 'bk_genius',
                    title: t('geniusTitle'),
                    description: t('geniusDesc'),
                    howTo: t('geniusHow'),
                    kpiImpact: ['CTR', 'GROSS'],
                    source: 'Booking.com Partner Hub',
                    benchmark: t('geniusBenchmark'),
                    disclaimerKey: 'benchmark',
                },
                {
                    id: 'bk_preferred',
                    title: t('preferredTitle'),
                    description: t('preferredDesc'),
                    howTo: t('preferredHow'),
                    kpiImpact: ['CTR', 'GROSS'],
                    source: 'Booking.com How We Work',
                    benchmark: t('preferredBenchmark'),
                    disclaimerKey: 'benchmark',
                },
                {
                    id: 'bk_visibility_booster',
                    title: t('vbTitle'),
                    description: t('vbDesc'),
                    howTo: t('vbHow'),
                    kpiImpact: ['CTR', 'GROSS'],
                    source: 'Booking.com How We Work',
                },
                {
                    id: 'bk_mobile_rate',
                    title: t('mobileRateTitle'),
                    description: t('mobileRateDesc'),
                    howTo: t('mobileRateHow'),
                    kpiImpact: ['CTR', 'GROSS'],
                },
            ],
        },
    ], [t]);

    // Initialize expanded state after CATEGORIES is available
    useEffect(() => {
        setExpandedCategories(Object.fromEntries(CATEGORIES.map(c => [c.id, true])));
    }, []);

    // Load from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setCheckedItems(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedItems));
    }, [checkedItems]);

    const toggleCheck = (itemId: string) => {
        setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const toggleCategory = (catId: string) => {
        setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    // Calculate progress
    const totalItems = CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;
    const progressPct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

    return (
        <div className="space-y-4">
            {/* Personalization Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-blue-700">
                    <strong>{t('rankingNote')}</strong> {t('rankingNoteText')}
                    <span className="block mt-1 text-blue-500 text-xs">
                        {t('rankingNoteSource')}
                    </span>
                </div>
            </div>

            {/* Ranking Funnel */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('funnelTitle')}</h4>
                <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-medium">
                        {t('funnelSearchViews')} <strong>{t('funnelCTR')}</strong>
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="px-2.5 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-medium">
                        {t('funnelPageViews')} <strong>{t('funnelGross')}</strong>
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="px-2.5 py-1.5 bg-purple-100 text-purple-700 rounded-lg font-medium">
                        {t('funnelConfirmed')} <strong>{t('funnelNet')}</strong>
                    </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    {t('funnelDesc')}
                </p>
            </div>

            {/* Progress Bar */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{t('progress')}</span>
                    <span className="text-sm font-bold text-blue-600">{checkedCount}/{totalItems} ({progressPct}%)</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
            </div>

            {/* Categories */}
            {CATEGORIES.map(category => {
                const catChecked = category.items.filter(i => checkedItems[i.id]).length;
                const isExpanded = expandedCategories[category.id];

                return (
                    <div key={category.id} className={`border rounded-xl overflow-hidden ${category.bgColor}`}>
                        {/* Category Header */}
                        <button
                            onClick={() => toggleCategory(category.id)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                        >
                            <div className="flex items-center gap-2">
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                <span className={`font-semibold text-sm ${category.color}`}>{category.title}</span>
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catChecked === category.items.length ? 'bg-emerald-100 text-emerald-700' : 'bg-white/60 text-gray-600'}`}>
                                {catChecked}/{category.items.length}
                            </span>
                        </button>

                        {/* Items */}
                        {isExpanded && (
                            <div className="px-4 pb-3 space-y-2">
                                {category.items.map(item => (
                                    <div
                                        key={item.id}
                                        className={`bg-white rounded-lg border p-3 transition-all ${checkedItems[item.id] ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        {/* Item Header */}
                                        <div className="flex items-start gap-2.5">
                                            <button
                                                onClick={() => toggleCheck(item.id)}
                                                className="mt-0.5 shrink-0"
                                            >
                                                {checkedItems[item.id] ? (
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                                                )}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-sm font-medium ${checkedItems[item.id] ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                        {item.title}
                                                    </span>
                                                    {/* KPI Tags */}
                                                    {item.kpiImpact.map(kpi => (
                                                        <span key={kpi} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${kpi === 'CTR' ? 'bg-blue-100 text-blue-600' : kpi === 'GROSS' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'}`}>
                                                            {kpi}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Description */}
                                                <p className="text-xs text-gray-500 mt-1">{item.description}</p>

                                                {/* How To */}
                                                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                                    <strong>{t('howTo')}</strong> {item.howTo}
                                                </div>

                                                {/* Benchmark */}
                                                {item.benchmark && (
                                                    <div className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3 shrink-0" />
                                                        <span>{t('benchmark')} {item.benchmark}</span>
                                                    </div>
                                                )}

                                                {/* Source */}
                                                {item.source && (
                                                    <div className="mt-1 text-[10px] text-gray-400 flex items-center gap-1">
                                                        <ExternalLink className="w-3 h-3" />
                                                        <span>{t('source')} {item.source}</span>
                                                    </div>
                                                )}

                                                {/* Disclaimer */}
                                                {item.disclaimerKey && DISCLAIMERS[item.disclaimerKey] && (
                                                    <div className={`mt-2 flex items-start gap-1.5 p-2 rounded border text-[11px] ${DISCLAIMERS[item.disclaimerKey].color}`}>
                                                        {DISCLAIMERS[item.disclaimerKey].icon}
                                                        <span>{DISCLAIMERS[item.disclaimerKey].text}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Paid Placement Note */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm">
                <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div className="text-gray-600">
                    <strong>{t('adNote')}</strong> {t('adNoteText')}
                    <span className="block mt-1 text-gray-400 text-xs">
                        {t('adNoteSource')}
                    </span>
                </div>
            </div>
        </div>
    );
}
