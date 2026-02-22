'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Image, DollarSign, Star, Zap,
    ChevronDown, ChevronRight, ExternalLink, Info,
    CheckCircle2, Circle, AlertTriangle
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ChecklistItem {
    id: string;
    title: string;
    description: string;
    howTo: string;
    kpiImpact: string[];
    source?: string;
    benchmark?: string;
    disclaimerKey?: 'partner_hub' | 'benchmark' | 'agp_commitment';
}

interface ChecklistCategory {
    id: string;
    title: string;
    color: string;
    bgColor: string;
    items: ChecklistItem[];
}

const STORAGE_KEY = 'rms_agoda_checklist';

export function AgodaChecklist() {
    const t = useTranslations('otaGuide.agoda');
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const DISCLAIMERS = useMemo(() => ({
        partner_hub: {
            icon: <Info className="w-3.5 h-3.5" />,
            text: t('disclaimerPartnerHub'),
            color: 'text-amber-600 bg-amber-50 border-amber-200',
        },
        benchmark: {
            icon: <AlertTriangle className="w-3.5 h-3.5" />,
            text: t('disclaimerBenchmark'),
            color: 'text-amber-600 bg-amber-50 border-amber-200',
        },
        agp_commitment: {
            icon: <AlertTriangle className="w-3.5 h-3.5" />,
            text: t('disclaimerAgpCommitment'),
            color: 'text-red-600 bg-red-50 border-red-200',
        },
    }), [t]);

    const CATEGORIES: ChecklistCategory[] = useMemo(() => [
        {
            id: 'content_score',
            title: t('catContentScore'),
            color: 'text-purple-700',
            bgColor: 'bg-purple-50 border-purple-200',
            items: [
                {
                    id: 'ag_property_photos',
                    title: t('propPhotosTitle'),
                    description: t('propPhotosDesc'),
                    howTo: t('propPhotosHow'),
                    kpiImpact: ['Content Score', 'CTR'],
                    source: 'Agoda Partner Hub',
                    benchmark: t('propPhotosBenchmark'),
                    disclaimerKey: 'partner_hub',
                },
                {
                    id: 'ag_room_photos',
                    title: t('roomPhotosTitle'),
                    description: t('roomPhotosDesc'),
                    howTo: t('roomPhotosHow'),
                    kpiImpact: ['Content Score', 'Conversion'],
                    source: 'Agoda Partner Hub',
                    disclaimerKey: 'partner_hub',
                },
                {
                    id: 'ag_description_translation',
                    title: t('descTransTitle'),
                    description: t('descTransDesc'),
                    howTo: t('descTransHow'),
                    kpiImpact: ['Content Score'],
                    source: 'Agoda Partner Hub',
                    disclaimerKey: 'partner_hub',
                },
                {
                    id: 'ag_facilities_amenities',
                    title: t('amenitiesTitle'),
                    description: t('amenitiesDesc'),
                    howTo: t('amenitiesHow'),
                    kpiImpact: ['Content Score'],
                    source: 'Agoda Partner Hub',
                    disclaimerKey: 'partner_hub',
                },
            ],
        },
        {
            id: 'reviews',
            title: t('catReviews'),
            color: 'text-yellow-700',
            bgColor: 'bg-yellow-50 border-yellow-200',
            items: [
                {
                    id: 'ag_review_score',
                    title: t('reviewScoreTitle'),
                    description: t('reviewScoreDesc'),
                    howTo: t('reviewScoreHow'),
                    kpiImpact: ['Conversion', 'CTR'],
                    source: 'Agoda Partner Hub',
                },
                {
                    id: 'ag_reply_rate',
                    title: t('replyRateTitle'),
                    description: t('replyRateDesc'),
                    howTo: t('replyRateHow'),
                    kpiImpact: ['Conversion'],
                },
            ],
        },
        {
            id: 'rates',
            title: t('catRates'),
            color: 'text-emerald-700',
            bgColor: 'bg-emerald-50 border-emerald-200',
            items: [
                {
                    id: 'ag_rate_competitiveness',
                    title: t('rateCompTitle'),
                    description: t('rateCompDesc'),
                    howTo: t('rateCompHow'),
                    kpiImpact: ['Conversion', 'CTR'],
                },
                {
                    id: 'ag_availability',
                    title: t('availTitle'),
                    description: t('availDesc'),
                    howTo: t('availHow'),
                    kpiImpact: ['CTR'],
                },
            ],
        },
        {
            id: 'programs',
            title: t('catPrograms'),
            color: 'text-indigo-700',
            bgColor: 'bg-indigo-50 border-indigo-200',
            items: [
                {
                    id: 'ag_agp',
                    title: t('agpTitle'),
                    description: t('agpDesc'),
                    howTo: t('agpHow'),
                    kpiImpact: ['CTR', 'Conversion'],
                    source: 'Agoda Partner Hub',
                    benchmark: t('agpBenchmark'),
                    disclaimerKey: 'agp_commitment',
                },
                {
                    id: 'ag_sponsored',
                    title: t('sponsoredTitle'),
                    description: t('sponsoredDesc'),
                    howTo: t('sponsoredHow'),
                    kpiImpact: ['CTR'],
                    source: 'Agoda Partner Hub',
                    disclaimerKey: 'benchmark',
                },
            ],
        },
    ], [t]);

    // Initialize expanded state
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
            {/* Content Score Breakdown */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('contentScoreTitle')}</h4>
                <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="text-lg font-bold text-purple-600">45%</div>
                        <div className="text-purple-700 font-medium">{t('propertyPhotos')}</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="text-lg font-bold text-blue-600">25%</div>
                        <div className="text-blue-700 font-medium">{t('roomPhotos')}</div>
                    </div>
                    <div className="text-center p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                        <div className="text-lg font-bold text-emerald-600">20%</div>
                        <div className="text-emerald-700 font-medium">{t('description')}</div>
                    </div>
                    <div className="text-center p-2 bg-amber-50 rounded-lg border border-amber-100">
                        <div className="text-lg font-bold text-amber-600">10%</div>
                        <div className="text-amber-700 font-medium">{t('amenities')}</div>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {t('contentScoreNote')}
                </p>
            </div>

            {/* Progress Bar */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{t('progress')}</span>
                    <span className="text-sm font-bold text-orange-600">{checkedCount}/{totalItems} ({progressPct}%)</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
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

                        {isExpanded && (
                            <div className="px-4 pb-3 space-y-2">
                                {category.items.map(item => (
                                    <div
                                        key={item.id}
                                        className={`bg-white rounded-lg border p-3 transition-all ${checkedItems[item.id] ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
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
                                                    {item.kpiImpact.map(kpi => (
                                                        <span key={kpi} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-600">
                                                            {kpi}
                                                        </span>
                                                    ))}
                                                </div>

                                                <p className="text-xs text-gray-500 mt-1">{item.description}</p>

                                                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                                    <strong>{t('howTo')}</strong> {item.howTo}
                                                </div>

                                                {item.benchmark && (
                                                    <div className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3 shrink-0" />
                                                        <span>{item.benchmark}</span>
                                                    </div>
                                                )}

                                                {item.source && (
                                                    <div className="mt-1 text-[10px] text-gray-400 flex items-center gap-1">
                                                        <ExternalLink className="w-3 h-3" />
                                                        <span>{t('source')} {item.source}</span>
                                                    </div>
                                                )}

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
        </div>
    );
}
