'use client';

import { useState, useEffect } from 'react';
import { usePricingPreview } from '@/hooks/usePricingPreview';
import { Plus, Trash2, Loader2, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Tag, X, Search, Calculator, DollarSign, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AGODA_BOOSTERS, BOOKING_BOOSTERS, EXPEDIA_BOOSTERS, getCatalogItem } from '@/lib/pricing/catalog';
import type { CommissionBooster } from '@/lib/pricing/types';

// 4TK Brand-aligned color config
const GROUP_CONFIG = {
    SEASONAL: {
        dotColor: 'bg-orange-500',
        label: 'Seasonal',
    },
    ESSENTIAL: {
        dotColor: 'bg-[#204183]',
        label: 'Essential',
    },
    TARGETED: {
        dotColor: 'bg-emerald-500',
        label: 'Targeted',
    },
    GENIUS: {
        dotColor: 'bg-indigo-500',
        label: 'Genius (Loyalty)',
    },
    PORTFOLIO: {
        dotColor: 'bg-teal-500',
        label: 'Portfolio Deals',
    },
    CAMPAIGN: {
        dotColor: 'bg-rose-500',
        label: 'Campaign Deals',
    },
} as const;

// Unified group labels — same Vietnamese names across ALL vendors
const UNIFIED_GROUP_LABELS: Record<keyof typeof GROUP_CONFIG, string> = {
    SEASONAL: 'Seasonal',
    ESSENTIAL: 'Essential',
    TARGETED: 'Targeted',
    GENIUS: 'Genius',
    PORTFOLIO: 'Portfolio',
    CAMPAIGN: 'Campaign',
};

// Vendor-specific tab groups for PromotionPicker
const VENDOR_PICKER_TABS: Record<string, GroupType[]> = {
    agoda: ['SEASONAL', 'ESSENTIAL', 'TARGETED'],
    booking: ['TARGETED', 'GENIUS', 'PORTFOLIO', 'CAMPAIGN'],
    expedia: ['ESSENTIAL', 'TARGETED'],
};

// Get label (unified — no per-vendor differences)
function getGroupLabel(group: keyof typeof GROUP_CONFIG, _vendor: string): string {
    return UNIFIED_GROUP_LABELS[group] || GROUP_CONFIG[group].label;
}

type GroupType = keyof typeof GROUP_CONFIG;

interface OTAChannel {
    id: string;
    name: string;
    code: string;
    commission: number;  // % commission from OTA Channel tab
    calc_type?: string;  // 'PROGRESSIVE' | 'ADDITIVE'
}

interface RoomType {
    id: string;
    name: string;
    net_price: number;
}

interface Promo {
    id: string;
    name: string;
    description?: string;
    group_type: GroupType;
    sub_category: string | null;
    default_pct: number | null;
    allow_stack?: boolean; // Deep Deals set to false
}

interface Campaign {
    id: string;
    discount_pct: number;
    is_active: boolean;
    promo: Promo;
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

// Collapsible Group Component - Clickable empty state
function PromotionGroup({
    group,
    campaigns,
    onToggle,
    onDelete,
    onAddClick,
    onUpdateDiscount,
    vendor,
}: {
    group: GroupType;
    campaigns: Campaign[];
    onToggle: (c: Campaign) => void;
    onDelete: (id: string) => void;
    onAddClick: (group: GroupType) => void;
    onUpdateDiscount: (campaignId: string, newPct: number) => void;
    vendor: string;
}) {
    const t = useTranslations('promotionsTab');
    const [isOpen, setIsOpen] = useState(true);
    const config = GROUP_CONFIG[group];
    const count = campaigns.length;
    const label = getGroupLabel(group, vendor);

    return (
        <div className="bg-[#E9ECF3] border border-[#DBE1EB] rounded-xl overflow-hidden">
            {/* Group Header */}
            <div className="flex items-center justify-between px-4 py-3 hover:bg-[#DBE1EB] transition-colors">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 flex-1"
                >
                    {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-[#204183]" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-[#204183]" />
                    )}
                    <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
                    <span className="font-medium text-slate-800">{label}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">
                        {t('items', { count })}
                    </span>
                </button>
                {/* Quick Add (+) button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onAddClick(group); }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#204183] hover:bg-[#204183] hover:text-white rounded-lg border border-[#204183]/30 hover:border-[#204183] transition-colors"
                    title={`Add promotion ${label}`}
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('add')}</span>
                </button>
            </div>

            {/* Group Content */}
            {isOpen && (
                <div className="px-4 pb-4">
                    {count === 0 ? (
                        <button
                            onClick={() => onAddClick(group)}
                            className="w-full flex flex-col items-center justify-center py-8 text-slate-400 hover:text-[#204183] hover:bg-white/50 rounded-lg transition-colors cursor-pointer border-2 border-dashed border-transparent hover:border-[#204183]"
                        >
                            <Plus className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-sm font-medium">{t('clickToAdd')}</span>
                        </button>
                    ) : (
                        <div className="space-y-2">
                            {/* Guide header row */}
                            <div className="grid grid-cols-[1fr_80px_52px_36px] items-center px-4 py-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider gap-3">
                                <span>{t('promotionName')}</span>
                                <span className="text-right">{t('discount')}</span>
                                <span className="text-center">{t('status')}</span>
                                <span className="text-center">{t('delete')}</span>
                            </div>
                            {campaigns.map((c) => {
                                // Check if this is a Free Nights deal
                                const isFreeNights = c.promo.name.toLowerCase().includes('free night');
                                // Derive stackBehavior from promo properties
                                // Self-healing: prefer static catalog groupType over DB group_type
                                const catalogGroupType = getCatalogItem(c.promo.id)?.groupType || c.promo.group_type;
                                const isTripCampaign = vendor === 'ctrip' && catalogGroupType === 'CAMPAIGN';
                                const stackBehavior = isTripCampaign ? 'EXCLUSIVE' : (!c.promo.allow_stack ? 'EXCLUSIVE' : (catalogGroupType === 'PORTFOLIO' ? 'HIGHEST_WINS' : 'STACKABLE'));
                                const badgeConfig = {
                                    STACKABLE: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: t('stackable') },
                                    HIGHEST_WINS: { bg: 'bg-blue-100', text: 'text-blue-700', label: t('highestWins') },
                                    EXCLUSIVE: { bg: 'bg-red-100', text: 'text-red-700', label: t('exclusive') },
                                    ONLY_WITH_GENIUS: { bg: 'bg-purple-100', text: 'text-purple-700', label: t('onlyWithGenius') },
                                }[stackBehavior];

                                return (
                                    <div
                                        key={c.id}
                                        className="grid grid-cols-[1fr_80px_52px_36px] items-center px-4 py-3 bg-white border border-[#DBE1EB] rounded-lg gap-3"
                                    >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="font-medium text-slate-800 text-sm truncate">{c.promo.name}</span>
                                            {/* Stack behavior badge */}
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${badgeConfig.bg} ${badgeConfig.text}`}>
                                                {badgeConfig.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            {/* Free Nights: Stay X / Pay Y input */}
                                            {isFreeNights ? (
                                                <div className="flex items-center gap-1 text-xs">
                                                    <span className="text-slate-500">S</span>
                                                    <input
                                                        type="number"
                                                        min="2"
                                                        max="14"
                                                        value={Math.round(100 / (100 - c.discount_pct)) || 4}
                                                        onChange={(e) => {
                                                            const x = Math.max(2, parseInt(e.target.value) || 2);
                                                            const y = x - 1;
                                                            const pct = Math.round((1 - y / x) * 100);
                                                            onUpdateDiscount(c.id, pct);
                                                        }}
                                                        className="w-8 text-center text-xs font-semibold text-[#204183] bg-slate-50 border border-[#DBE1EB] rounded px-0.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#204183]"
                                                    />
                                                    <span className="text-slate-500">P</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="13"
                                                        value={Math.round(100 / (100 - c.discount_pct)) - 1 || 3}
                                                        onChange={(e) => {
                                                            const y = Math.max(1, parseInt(e.target.value) || 1);
                                                            const x = y + 1;
                                                            const pct = Math.round((1 - y / x) * 100);
                                                            onUpdateDiscount(c.id, pct);
                                                        }}
                                                        className="w-8 text-center text-xs font-semibold text-[#204183] bg-slate-50 border border-[#DBE1EB] rounded px-0.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#204183]"
                                                    />
                                                    <span className="text-[10px] text-slate-400">→{c.discount_pct}%</span>
                                                </div>
                                            ) : (
                                                /* Regular discount percentage input */
                                                <div className="flex items-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.1"
                                                        value={c.discount_pct}
                                                        onChange={(e) => {
                                                            const val = Math.min(100, Math.max(0, Math.round((parseFloat(e.target.value) || 0) * 10) / 10));
                                                            onUpdateDiscount(c.id, val);
                                                        }}
                                                        className="w-14 text-right text-sm font-semibold text-[#204183] bg-slate-50 border border-[#DBE1EB] rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#204183]"
                                                    />
                                                    <span className="text-sm font-semibold text-[#204183] ml-0.5">%</span>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => onToggle(c)}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${c.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${c.is_active ? 'left-6' : 'left-1'
                                                    }`}
                                            />
                                        </button>
                                        <button
                                            onClick={() => onDelete(c.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Modal Picker Component
function PromotionPicker({
    availablePromos,
    onAdd,
    onClose,
    saving,
    channelName,
    initialTab,
    vendor,
}: {
    availablePromos: Promo[];
    onAdd: (promo: Promo) => void;
    onClose: () => void;
    saving: boolean;
    channelName: string;
    initialTab: GroupType;
    vendor: string;
}) {
    const t = useTranslations('promotionsTab');
    const [activeTab, setActiveTab] = useState<GroupType>(initialTab);
    const [search, setSearch] = useState('');

    const filteredPromos = availablePromos.filter((p) => {
        const matchesGroup = p.group_type === activeTab;
        const matchesSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase());
        return matchesGroup && matchesSearch;
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-[#DBE1EB]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#DBE1EB] bg-white">
                    <div>
                        <h3 className="text-xl font-bold text-[#204183] flex items-center gap-2">
                            <Plus className="w-6 h-6 text-orange-500" />
                            {t('addPromotionChannel', { channel: channelName })}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">{t('selectFromCatalog')}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs — Navy Pill Design */}
                <div className="bg-[#F8FAFC] px-6 py-4 border-b border-[#DBE1EB]">
                    <div className="flex p-1 bg-white rounded-lg border border-[#DBE1EB] shadow-sm">
                        {(VENDOR_PICKER_TABS[vendor] || ['SEASONAL', 'ESSENTIAL', 'TARGETED']).map((group) => {
                            const isActive = activeTab === group;
                            return (
                                <button
                                    key={group}
                                    onClick={() => setActiveTab(group)}
                                    className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${isActive
                                        ? 'bg-[#204183] text-white shadow-md'
                                        : 'text-slate-500 hover:text-[#204183] hover:bg-slate-50'
                                        }`}
                                >
                                    {getGroupLabel(group, vendor)}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Search */}
                <div className="px-6 py-4 bg-white border-b border-[#DBE1EB]">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#204183] transition-colors" />
                        <input
                            type="text"
                            placeholder={t('searchPromotions')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-[#DBE1EB] rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#204183]/20 focus:border-[#204183] transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Promo List */}
                <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6">
                    {filteredPromos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Tag className="w-8 h-8 opacity-50" />
                            </div>
                            <span className="text-base font-medium">{t('noPromosFound')}</span>
                            <p className="text-sm mt-1">{t('tryDiffKeywords')}</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {filteredPromos.map((promo) => (
                                <div
                                    key={promo.id}
                                    className="group flex items-center justify-between p-4 bg-white rounded-xl border border-[#DBE1EB] hover:border-[#204183] hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-base font-bold text-[#204183] truncate">
                                                {promo.name}
                                            </span>
                                            {promo.sub_category && (
                                                <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#E0E7FF] text-[#3730A3] rounded-full uppercase tracking-wide">
                                                    {promo.sub_category}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                            {promo.default_pct && (
                                                <div className="flex items-center gap-1.5 text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                                                    <TrendingUp className="w-3.5 h-3.5" />
                                                    {t('discount')} {promo.default_pct}%
                                                </div>
                                            )}
                                            {promo.description && (
                                                <span className="truncate max-w-[300px]" title={promo.description}>
                                                    {promo.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => onAdd(promo)}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#204183] text-[#204183] hover:bg-[#204183] hover:text-white font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group-hover:bg-[#204183] group-hover:text-white"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {t('add')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Price Calculator Panel - 3-Price Display (BUG-1 fix)
// Shows: ① BAR (Channel Manager input) → ② Guest Display Price (after discounts) → ③ Net Revenue
function PriceCalculator({
    roomTypes,
    selectedRoomId,
    onRoomSelect,
    totalDiscount,
    discountMultiplier,
    commissionPct,
    channelName,
    calcType,
    vendor,
    b2bBoostPct,
}: {
    roomTypes: RoomType[];
    selectedRoomId: string;
    onRoomSelect: (id: string) => void;
    totalDiscount: number;
    discountMultiplier: number;
    commissionPct: number;
    channelName: string;
    calcType: 'PROGRESSIVE' | 'ADDITIVE' | 'SINGLE_DISCOUNT';
    vendor?: string;
    b2bBoostPct?: number;
}) {
    const t = useTranslations('promotionsTab');
    const [calcMode, setCalcMode] = useState<'net_to_display' | 'display_to_net' | 'guest_price'>('net_to_display');
    const [customInput, setCustomInput] = useState<string>('');

    const selectedRoom = roomTypes.find((r) => r.id === selectedRoomId);
    const baseNetPrice = selectedRoom?.net_price || 0;

    // Multipliers - discountMultiplier already calculated correctly by parent
    const commissionMultiplier = commissionPct > 0 ? (1 - commissionPct / 100) : 1;

    const formatNumber = (n: number) => {
        return new Intl.NumberFormat('vi-VN').format(Math.round(n));
    };

    const parseNumber = (s: string) => {
        return parseFloat(s.replace(/\./g, '').replace(/,/g, '')) || 0;
    };

    // Default value based on mode
    const getDefaultForMode = (m: typeof calcMode) => {
        if (m === 'net_to_display') return formatNumber(baseNetPrice);
        if (m === 'display_to_net') return formatNumber(baseNetPrice / discountMultiplier / commissionMultiplier);
        return formatNumber(baseNetPrice / commissionMultiplier);
    };

    // Initialize input with default when mode or room changes
    useEffect(() => {
        setCustomInput(getDefaultForMode(calcMode));
    }, [selectedRoomId, calcMode, baseNetPrice]);

    // Calculate 3 prices from the current input
    const inputValue = parseNumber(customInput);
    let barPrice: number;
    let guestPrice: number;
    let netRevenue: number;

    if (calcMode === 'net_to_display') {
        // Net Revenue → Reverse calc to BAR + Display
        netRevenue = inputValue || baseNetPrice;
        guestPrice = commissionMultiplier > 0 ? netRevenue / commissionMultiplier : netRevenue;
        barPrice = discountMultiplier > 0 ? guestPrice / discountMultiplier : guestPrice;
    } else if (calcMode === 'display_to_net') {
        // BAR Price (Channel Manager) → Calc down to Display + NET
        barPrice = inputValue || (baseNetPrice / discountMultiplier / commissionMultiplier);
        guestPrice = barPrice * discountMultiplier;
        netRevenue = guestPrice * commissionMultiplier;
    } else {
        // Display Price (guest sees) → Reverse to BAR + calc down to NET
        guestPrice = inputValue || (baseNetPrice / commissionMultiplier);
        barPrice = discountMultiplier > 0 ? guestPrice / discountMultiplier : guestPrice;
        netRevenue = guestPrice * commissionMultiplier;
    }

    if (roomTypes.length === 0) {
        return (
            <div className="bg-[#F2F4F8] border border-[#DBE1EB] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-[#204183] mb-3 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    {t('calcPriceChannel', { channel: channelName })}
                </h3>
                <p className="text-sm text-slate-500">{t('noRoomTypesYet')}</p>
            </div>
        );
    }

    const calcLabel = calcType === 'PROGRESSIVE' ? 'progressive' : calcType === 'SINGLE_DISCOUNT' ? 'highest deal' : 'additive';

    return (
        <div className="bg-[#F2F4F8] border border-[#DBE1EB] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#204183] mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                {t('calcPriceChannelComm', { channel: channelName, commission: commissionPct })}
            </h3>

            {/* Mode Toggle — 3 tabs */}
            <div className="flex mb-4 bg-white rounded-lg border border-[#DBE1EB] overflow-hidden">
                <button
                    onClick={() => setCalcMode('net_to_display')}
                    className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${calcMode === 'net_to_display'
                        ? 'bg-[#204183] text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    {t('netRevenue')}
                </button>
                <button
                    onClick={() => setCalcMode('display_to_net')}
                    className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${calcMode === 'display_to_net'
                        ? 'bg-[#204183] text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    {t('barPrice')}
                </button>
                <button
                    onClick={() => setCalcMode('guest_price')}
                    className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${calcMode === 'guest_price'
                        ? 'bg-[#204183] text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    {t('displayPrice')}
                </button>
            </div>

            {/* Room selector */}
            <select
                value={selectedRoomId}
                onChange={(e) => onRoomSelect(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DBE1EB] rounded-lg text-slate-800 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#204183]"
            >
                {roomTypes.map((room) => (
                    <option key={room.id} value={room.id}>
                        {room.name} - {formatNumber(room.net_price)}₫ (Net)
                    </option>
                ))}
            </select>

            {/* Input field */}
            <div className="mb-4">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                    {calcMode === 'net_to_display'
                        ? t('enterNetRevenue')
                        : calcMode === 'display_to_net'
                            ? t('enterBarPrice')
                            : t('enterGuestPrice')
                    }
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={customInput}
                        onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, '');
                            if (raw === '') {
                                setCustomInput('');
                            } else {
                                const num = parseInt(raw, 10);
                                setCustomInput(formatNumber(num));
                            }
                        }}
                        placeholder={calcMode === 'net_to_display' ? 'VD: 1.000.000' : calcMode === 'display_to_net' ? 'VD: 1.500.000' : 'VD: 1.200.000'}
                        className="w-full px-3 py-2 pr-8 bg-white border border-[#DBE1EB] rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#204183]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₫</span>
                </div>
            </div>

            {/* 3-Price breakdown: BAR → Guest Price → Net Revenue */}
            <div className="space-y-2 text-sm">
                {/* ① BAR — Channel Manager price */}
                <div className="bg-white rounded-lg border border-[#DBE1EB] p-3">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">{t('channelManagerBar')}</span>
                        <span className="font-bold text-[#204183] text-lg">{formatNumber(barPrice)}₫</span>
                    </div>
                </div>

                {/* Arrow + Discount info */}
                {totalDiscount > 0 && (
                    <div className="flex items-center gap-2 px-3 text-xs text-orange-600">
                        <span>↓</span>
                        <span>{t('promotion')} −{totalDiscount.toFixed(1)}% ({calcLabel})</span>
                        <span className="ml-auto">−{formatNumber(barPrice - guestPrice)}₫</span>
                    </div>
                )}

                {/* ② Guest Display Price */}
                <div className="bg-white rounded-lg border border-orange-200 p-3">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">{t('priceGuestSees')}</span>
                        <span className="font-bold text-orange-600 text-lg">{formatNumber(guestPrice)}₫</span>
                    </div>
                </div>

                {/* Arrow + Commission + Net Revenue — split when B2B is active */}
                {(() => {
                    const showB2B = vendor === 'expedia' && b2bBoostPct && b2bBoostPct > 0;
                    // When B2B is ON, commissionPct already includes B2B boost (e.g. 22% = 17% + 5%)
                    // baseCommission = just the OTA base (17%), b2bBoostPct = additional B2B (5%)
                    const baseCommission = showB2B ? commissionPct - b2bBoostPct : commissionPct;
                    const b2cNet = showB2B ? guestPrice * (1 - baseCommission / 100) : netRevenue;

                    return (
                        <>
                            {/* Commission line — show base commission */}
                            <div className="flex items-center gap-2 px-3 text-xs text-slate-500">
                                <span>↓</span>
                                <span>{t('commissionOta')} −{baseCommission}%</span>
                                <span className="ml-auto">−{formatNumber(guestPrice - b2cNet)}₫</span>
                            </div>

                            {/* ③ Net Revenue — B2C */}
                            <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-emerald-700 text-xs font-medium">
                                        {showB2B ? t('netRevenueB2C') : t('netRevenueLabel')}
                                    </span>
                                    <span className="font-bold text-emerald-700 text-lg">{formatNumber(b2cNet)}₫</span>
                                </div>
                            </div>

                            {/* ④ B2B additional deduction + Net (Expedia only) */}
                            {showB2B && (
                                <>
                                    <div className="flex items-center gap-2 px-3 text-xs text-orange-500">
                                        <span>↓</span>
                                        <span>{t('b2bCommissionExtra', { base: baseCommission, boost: b2bBoostPct, total: commissionPct })}</span>
                                        <span className="ml-auto">−{formatNumber(b2cNet - netRevenue)}₫</span>
                                    </div>
                                    <div className="bg-amber-50 rounded-lg border border-amber-200 p-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-amber-700 text-xs font-medium">{t('netRevenueB2B')}</span>
                                            <span className="font-bold text-amber-700 text-lg">{formatNumber(netRevenue)}₫</span>
                                        </div>
                                        <div className="text-[10px] text-amber-500 mt-1">
                                            {t('b2bExplanation')}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    );
                })()}
            </div>
        </div>
    );
}

// Marketing Programs Panel — Vendor-aware (BUG-3 fix)
// Agoda: AGP/AGX/SL | Booking: Preferred Partner | Expedia: Accelerator + B2B
function MarketingPrograms({
    boosters,
    onUpdate,
    baseCommission,
    vendor,
}: {
    boosters: CommissionBooster[];
    onUpdate: (boosters: CommissionBooster[]) => void;
    baseCommission: number;
    vendor: string;
}) {
    const t = useTranslations('promotionsTab');
    const activeBoosters = boosters.filter(b => b.enabled);
    const totalBoost = activeBoosters.reduce((sum, b) => sum + b.boostPct, 0);
    const effectiveCommission = baseCommission + totalBoost;

    const handleToggle = (id: string) => {
        onUpdate(boosters.map(b => {
            if (b.id === id) {
                if (b.program === 'AGP') {
                    return { ...b, enabled: false };
                }
                return { ...b, enabled: !b.enabled };
            }
            if (b.program === 'AGP' && boosters.find(x => x.id === id)?.program === 'AGP') {
                return { ...b, enabled: false };
            }
            return b;
        }));
    };

    const handleAGPChange = (tierId: string) => {
        onUpdate(boosters.map(b => {
            if (b.program === 'AGP') {
                return { ...b, enabled: b.id === tierId };
            }
            return b;
        }));
    };

    const handlePctChange = (id: string, pct: number) => {
        onUpdate(boosters.map(b =>
            b.id === id ? { ...b, boostPct: Math.min(50, Math.max(0, pct)) } : b
        ));
    };

    // AGP tiers (Agoda only)
    const agpBoosters = boosters.filter(b => b.program === 'AGP');
    const activeAGP = agpBoosters.find(b => b.enabled);

    // Generic variable-rate boosters (for AGX, SL, Preferred, Accelerator, B2B)
    const genericBoosters = boosters.filter(b => b.program !== 'AGP');

    // Vendor-specific title
    const vendorTitles: Record<string, string> = {
        agoda: `${t('marketingPrograms')} (Agoda)`,
        booking: `${t('marketingPrograms')} (Booking.com)`,
        expedia: `${t('marketingPrograms')} (Expedia)`,
    };

    return (
        <div className="bg-[#E9ECF3] border border-[#DBE1EB] rounded-xl overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#204183]" />
                    <span className="font-semibold text-sm text-slate-800">{vendorTitles[vendor] || t('marketingPrograms')}</span>
                </div>
                {totalBoost > 0 && (
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                        +{totalBoost}% {t('commission')}
                    </span>
                )}
            </div>

            <div className="px-4 pb-4 space-y-3">
                {/* Horizontal card grid — matching prototype B */}
                <div className="flex gap-2.5">
                    {/* AGP card — Agoda only */}
                    {vendor === 'agoda' && agpBoosters.length > 0 && (
                        <div className="flex-1 bg-white border border-[#DBE1EB] rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm text-slate-800">AGP</span>
                                <button
                                    onClick={() => activeAGP ? handleToggle(activeAGP.id) : handleAGPChange(agpBoosters[0]?.id)}
                                    className={`relative w-9 h-5 rounded-full transition-colors ${activeAGP ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <span className={`absolute top-[3px] w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${activeAGP ? 'left-[18px]' : 'left-[3px]'}`} />
                                </button>
                            </div>
                            <div className="text-[11px] text-slate-400 mb-2">{t('agodaGrowthProgram')}</div>
                            {activeAGP && (
                                <div className="flex gap-1">
                                    {agpBoosters.map(tier => (
                                        <button
                                            key={tier.id}
                                            onClick={() => handleAGPChange(tier.id)}
                                            className={`flex-1 px-1 py-1.5 text-[10px] font-semibold rounded-md transition-colors ${tier.enabled
                                                ? 'bg-[#204183] text-white border border-[#204183]'
                                                : 'bg-[#F2F4F8] text-slate-500 border border-[#DBE1EB] hover:bg-[#E9ECF3]'
                                                }`}
                                        >
                                            {tier.tier?.charAt(0).toUpperCase()}{tier.tier?.slice(1)} ({tier.boostPct}%)
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Generic booster cards (AGX, Spotlight, Preferred, etc.) */}
                    {genericBoosters.map(booster => (
                        <div key={booster.id} className="flex-1 bg-white border border-[#DBE1EB] rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm text-slate-800">{booster.name.split(' ')[0]}</span>
                                <button
                                    onClick={() => handleToggle(booster.id)}
                                    className={`relative w-9 h-5 rounded-full transition-colors ${booster.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <span className={`absolute top-[3px] w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${booster.enabled ? 'left-[18px]' : 'left-[3px]'}`} />
                                </button>
                            </div>
                            <div className="text-[11px] text-slate-400 mb-2">{booster.name}</div>
                            {booster.isVariable ? (
                                <div className="flex items-center gap-0.5">
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={booster.boostPct}
                                        onChange={(e) => handlePctChange(booster.id, parseInt(e.target.value) || 0)}
                                        disabled={!booster.enabled}
                                        className="w-11 text-right text-sm font-semibold text-[#204183] bg-[#F8FAFC] border border-[#DBE1EB] rounded-md px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-[#204183] disabled:opacity-40"
                                    />
                                    <span className={`text-sm font-semibold text-[#204183] ${!booster.enabled ? 'opacity-40' : ''}`}>%</span>
                                </div>
                            ) : (
                                <div className={`text-sm font-semibold text-[#204183] ${!booster.enabled ? 'opacity-40' : ''}`}>
                                    {booster.boostPct}%
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Commission formula bar */}
                {totalBoost > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg px-3.5 py-2.5">
                        <p className="text-xs font-medium text-orange-800">
                            {t('commissionBase', { base: baseCommission })}
                            {activeBoosters.map(b => ` + ${b.name} ${b.boostPct}%`).join('')}
                            {' '}= <strong>{effectiveCommission}%</strong>
                        </p>
                        {effectiveCommission > 40 && (
                            <p className="text-xs text-red-600 mt-1">
                                {t('commissionHighWarning', { pct: effectiveCommission })}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

}

// Step-by-step Explanation Panel — uses server-computed trace (single source of truth)
interface PreviewDataForExplanation {
    bar: number;
    display: number;
    net: number;
    totalDiscountEffective: number;
    trace: { step: string; description: string; priceAfter: number }[];
    resolvedPromotions: {
        applied: string[];
        ignored: { id: string; name: string; reason: string }[];
    };
    validation: { isValid: boolean; errors: string[]; warnings: string[] };
}

function PricingExplanation({
    previewData,
    commissionPct,
    calcType,
    netPrice,
}: {
    previewData: PreviewDataForExplanation | null;
    commissionPct: number;
    calcType: 'PROGRESSIVE' | 'ADDITIVE' | 'SINGLE_DISCOUNT';
    netPrice: number;
}) {
    const t = useTranslations('promotionsTab');
    const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));

    const validation = previewData?.validation ?? { isValid: true, errors: [], warnings: [] };
    const trace = previewData?.trace ?? [];
    const ignored = previewData?.resolvedPromotions?.ignored ?? [];
    const bar = previewData?.bar ?? 0;
    const display = previewData?.display ?? 0;
    const net = previewData?.net ?? netPrice;
    const totalDiscount = previewData?.totalDiscountEffective ?? 0;

    // Extract promo trace steps (skip Commission and warning steps)
    const promoSteps = trace.filter(t => t.step !== 'Commission' && !t.step.startsWith('⚠️') && !t.step.startsWith('📊'));
    // Find commission step
    const commissionStep = trace.find(t => t.step === 'Commission');

    return (
        <div className="bg-[#F2F4F8] border border-[#DBE1EB] rounded-xl p-4 space-y-4">
            {/* Validation */}
            <div>
                <h3 className="text-sm font-semibold text-[#204183] mb-2">{t('validation')}</h3>
                <div className="space-y-1">
                    {validation.errors.length === 0 && validation.warnings.length === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-emerald-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>{t('allRulesPassed')}</span>
                        </div>
                    ) : (
                        <>
                            {validation.errors.map((err, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-red-600">
                                    <span className="mt-0.5">❌</span>
                                    <span>{err}</span>
                                </div>
                            ))}
                            {validation.warnings.map((warn, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-amber-600">
                                    <span className="mt-0.5">⚠️</span>
                                    <span>{warn}</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Step-by-step breakdown from server trace */}
            <div className="border-t border-[#DBE1EB] pt-4">
                <h3 className="text-sm font-semibold text-[#204183] mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {t('pricingExplained')}
                </h3>

                <div className="space-y-3 text-sm">
                    {/* Step 1: Net Price */}
                    <div className="bg-white rounded-lg p-3 border border-[#DBE1EB]">
                        <p className="font-medium text-slate-700 mb-1">{t('step1BasePrice')}</p>
                        <p className="text-slate-500">{t('step1Desc')}</p>
                        {netPrice > 0 && (
                            <p className="mt-1.5 font-bold text-[#204183] text-base tabular-nums">{fmt(netPrice)}₫</p>
                        )}
                    </div>

                    {/* Step 2: Commission markup */}
                    <div className="bg-white rounded-lg p-3 border border-[#DBE1EB]">
                        <p className="font-medium text-slate-700 mb-1">{t('step2Commission', { pct: commissionPct })}</p>
                        {commissionStep ? (
                            <>
                                <p className="text-slate-500">{commissionStep.description}</p>
                                <p className="mt-1.5 font-bold text-[#204183] text-base tabular-nums">{fmt(commissionStep.priceAfter)}₫</p>
                            </>
                        ) : (
                            <p className="text-slate-500">{fmt(netPrice)}₫ ÷ (1 − {commissionPct}%) = Price before promotions</p>
                        )}
                    </div>

                    {/* Step 3: Promotions from server trace */}
                    {totalDiscount > 0 && promoSteps.length > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-[#DBE1EB]">
                            <p className="font-medium text-slate-700 mb-1">
                                📌 Step 3: {calcType === 'PROGRESSIVE' ? 'Multiply progressive' : calcType === 'SINGLE_DISCOUNT' ? 'Highest Deal' : 'Additive'} promotions ({totalDiscount.toFixed(1)}%)
                            </p>

                            <div className="mt-2 space-y-1.5">
                                {promoSteps.map((step, i) => {
                                    const prevPrice = i === 0
                                        ? (commissionStep?.priceAfter ?? netPrice)
                                        : promoSteps[i - 1].priceAfter;
                                    return (
                                        <div key={i} className="flex items-center gap-2 text-xs">
                                            <span className="text-orange-500 font-bold w-4 text-center">{i + 1}</span>
                                            <span className="text-slate-600 flex-1 truncate">
                                                {step.step}
                                            </span>
                                            <span className="text-slate-400 tabular-nums">{fmt(prevPrice)}₫</span>
                                            <span className="text-slate-300">→</span>
                                            <span className="font-semibold text-[#204183] tabular-nums">{fmt(step.priceAfter)}₫</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {bar > 0 && (
                                <p className="mt-2 font-bold text-[#204183] text-base tabular-nums">
                                    BAR = {fmt(bar)}₫
                                </p>
                            )}
                        </div>
                    )}

                    {/* Ignored promos (dropped by stacking rules) */}
                    {ignored.length > 0 && (
                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                            <p className="font-medium text-amber-700 mb-1.5 text-xs">{t('promsExcluded')}</p>
                            <div className="space-y-1">
                                {ignored.map((ig, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                        <span className="text-amber-400">✘</span>
                                        <span className="text-amber-700 line-through">{ig.name}</span>
                                        <span className="text-amber-500 text-[10px]">— {ig.reason}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Result */}
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                        <p className="font-medium text-emerald-700 mb-1">{t('result')}</p>
                        {bar > 0 ? (
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">{t('channelManagerPriceBar')}</span>
                                    <span className="font-bold text-[#204183] tabular-nums">{fmt(bar)}₫</span>
                                </div>
                                {totalDiscount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">{t('guestSeesOnOta')}</span>
                                        <span className="font-bold text-orange-600 tabular-nums">{fmt(display)}₫</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm border-t border-emerald-200 pt-1 mt-1">
                                    <span className="text-emerald-700 font-medium">{t('hotelReceivesNet')}</span>
                                    <span className="font-bold text-emerald-700 tabular-nums">{fmt(net)}₫</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-emerald-600">
                                {t('selectRoomForPricing')}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PromotionsTab() {
    const t = useTranslations('promotionsTab');
    const [channels, setChannels] = useState<OTAChannel[]>([]);
    const [catalog, setCatalog] = useState<Promo[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<string>('');
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [showPicker, setShowPicker] = useState(false);
    const [pickerInitialTab, setPickerInitialTab] = useState<GroupType>('SEASONAL');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // V01.4: Marketing program boosters (dynamic per channel)
    const [boosters, setBoosters] = useState<CommissionBooster[]>(() =>
        AGODA_BOOSTERS.map(b => ({ ...b }))
    );

    // ── Parallel initial load: channels + room types ──────────────
    useEffect(() => {
        const loadInitial = async () => {
            try {
                const [channelsRes, roomsRes] = await Promise.all([
                    fetch('/api/pricing/ota-channels', { credentials: 'include' }),
                    fetch('/api/pricing/room-types', { credentials: 'include' }),
                ]);

                if (!channelsRes.ok) throw new Error('Failed to fetch channels');
                if (!roomsRes.ok) throw new Error('Failed to fetch room types');

                const [channelsData, roomsData] = await Promise.all([
                    channelsRes.json(),
                    roomsRes.json(),
                ]);

                setChannels(channelsData);
                setRoomTypes(roomsData);

                if (channelsData.length > 0) {
                    setSelectedChannel(channelsData[0].id);
                }
                if (roomsData.length > 0) {
                    setSelectedRoomId(roomsData[0].id);
                }
            } catch (err: unknown) {
                const error = err as Error;
                setError(error.message);
            }
        };
        loadInitial();
    }, []);

    // ── Parallel channel-dependent load: catalog + campaigns ─────
    useEffect(() => {
        if (!selectedChannel || channels.length === 0) return;

        let cancelled = false;
        const loadChannelData = async () => {
            setLoading(true);
            const channel = channels.find((c) => c.id === selectedChannel);
            const vendor = channel?.code || 'agoda';

            try {
                const [catalogRes, campaignsRes] = await Promise.all([
                    fetch(`/api/pricing/catalog?vendor=${vendor}`),
                    fetch(`/api/pricing/campaigns?channel_id=${selectedChannel}`),
                ]);

                if (cancelled) return;

                if (!catalogRes.ok) throw new Error('Failed to fetch catalog');
                if (!campaignsRes.ok) throw new Error('Failed to fetch campaigns');

                const [catalogData, campaignsData] = await Promise.all([
                    catalogRes.json(),
                    campaignsRes.json(),
                ]);

                if (cancelled) return;

                setCatalog(catalogData);
                setCampaigns(campaignsData);
            } catch (err: unknown) {
                if (cancelled) return;
                const error = err as Error;
                setError(error.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        loadChannelData();

        return () => { cancelled = true; };
    }, [selectedChannel, channels]);

    // Phase 03: Validation comes from server via usePricingPreview hook
    // No client-side validate() — engine.ts is the single source of truth

    // Open picker for specific group
    const handleOpenPicker = (group: GroupType) => {
        setPickerInitialTab(group);
        setShowPicker(true);
    };

    // Add promotion with auto-replace logic
    const handleAddPromo = async (promo: Promo) => {
        setSaving(true);
        setError(null);
        try {
            const conflictingCampaigns: Campaign[] = [];

            if (promo.group_type === 'SEASONAL') {
                conflictingCampaigns.push(...campaigns.filter((c) => c.promo.group_type === 'SEASONAL'));
            } else if (promo.group_type === 'TARGETED' && promo.sub_category) {
                conflictingCampaigns.push(
                    ...campaigns.filter(
                        (c) => c.promo.group_type === 'TARGETED' && c.promo.sub_category === promo.sub_category
                    )
                );
            }

            for (const conflict of conflictingCampaigns) {
                await fetch(`/api/pricing/campaigns/${conflict.id}`, { method: 'DELETE' });
            }

            const res = await fetch('/api/pricing/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ota_channel_id: selectedChannel,
                    promo_id: promo.id,
                    discount_pct: promo.default_pct || 10,
                    is_active: true,
                }),
            });
            if (!res.ok) throw new Error('Failed to add');
            const newCampaign = await res.json();

            const conflictIds = new Set(conflictingCampaigns.map((c) => c.id));
            setCampaigns([...campaigns.filter((c) => !conflictIds.has(c.id)), newCampaign]);
            setShowPicker(false);
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    // Toggle campaign
    const handleToggle = async (campaign: Campaign) => {
        try {
            const res = await fetch(`/api/pricing/campaigns/${campaign.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !campaign.is_active }),
            });
            if (!res.ok) throw new Error('Failed to update');
            setCampaigns(campaigns.map((c) => (c.id === campaign.id ? { ...c, is_active: !c.is_active } : c)));
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message);
        }
    };

    // Delete campaign
    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return;
        try {
            const res = await fetch(`/api/pricing/campaigns/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            setCampaigns(campaigns.filter((c) => c.id !== id));
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message);
        }
    };

    // Update campaign discount percentage
    const handleUpdateDiscount = async (campaignId: string, newPct: number) => {
        // Optimistic update
        setCampaigns(campaigns.map((c) =>
            c.id === campaignId ? { ...c, discount_pct: newPct } : c
        ));

        try {
            const res = await fetch(`/api/pricing/campaigns/${campaignId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discount_pct: newPct }),
            });
            if (!res.ok) throw new Error('Failed to update discount');
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message);
            // Revert on error - refetch campaigns
            const res = await fetch(`/api/pricing/campaigns?channel_id=${selectedChannel}`);
            if (res.ok) {
                const data = await res.json();
                setCampaigns(data);
            }
        }
    };

    const selectedChannelData = channels.find((c) => c.id === selectedChannel);
    const commissionPct = selectedChannelData?.commission || 0;
    const calcType = (selectedChannelData?.calc_type as 'PROGRESSIVE' | 'ADDITIVE' | 'SINGLE_DISCOUNT') || 'PROGRESSIVE';

    // Phase 03: usePricingPreview — single source of truth for pricing math
    // Build payload: only active campaign instance IDs
    const activeCampaignIds = campaigns.filter(c => c.is_active).map(c => c.id);
    const selectedRoom = roomTypes.find(r => r.id === selectedRoomId);

    // Fingerprint: changes when discount % values change → triggers re-fetch
    const discountFingerprint = campaigns
        .filter(c => c.is_active)
        .map(c => `${c.id}:${c.discount_pct}`)
        .sort()
        .join('|');

    const { result: previewData, isLoading: previewLoading, isRefreshing: previewRefreshing } = usePricingPreview({
        channelId: selectedChannel || undefined,
        roomTypeId: selectedRoomId || undefined,
        mode: 'NET',
        value: selectedRoom?.net_price || 0,
        selectedCampaignInstanceIds: activeCampaignIds,
        debounceMs: 250,
        discountFingerprint,
    });

    // Derive display values from API response (no client-side math)
    const totalDiscount = previewData?.totalDiscountEffective ?? 0;
    const discountMultiplier = totalDiscount > 0 ? (1 - totalDiscount / 100) : 1;
    const validation: ValidationResult = previewData?.validation ?? { isValid: true, errors: [], warnings: [] };

    // Timing conflict warnings are now inside validation.warnings from the server
    const timingConflictWarning = validation.warnings.find(w => w.includes('Early Bird') && w.includes('Last-Minute')) || null;

    // V01.4: Effective commission with marketing programs
    const activeBoosters = boosters.filter(b => b.enabled);
    const totalBoost = activeBoosters.reduce((sum, b) => sum + b.boostPct, 0);
    const effectiveCommissionPct = commissionPct + totalBoost;

    // Get available promos (not already added)
    const usedPromoIds = new Set(campaigns.map((c) => c.promo.id));
    const availablePromos = catalog.filter((p) => !usedPromoIds.has(p.id));

    // Group campaigns by type
    const seasonalCampaigns = campaigns.filter((c) => c.promo.group_type === 'SEASONAL');
    const essentialCampaigns = campaigns.filter((c) => c.promo.group_type === 'ESSENTIAL');
    const targetedCampaigns = campaigns.filter((c) => c.promo.group_type === 'TARGETED');
    const geniusCampaigns = campaigns.filter((c) => c.promo.group_type === 'GENIUS');
    const portfolioCampaigns = campaigns.filter((c) => c.promo.group_type === 'PORTFOLIO');
    const campaignCampaigns = campaigns.filter((c) => c.promo.group_type === 'CAMPAIGN');

    // Dynamic boosters: switch per vendor (Agoda / Booking.com / Expedia)
    const isBooking = selectedChannelData?.code === 'booking';
    const isAgoda = selectedChannelData?.code === 'agoda';
    const isExpedia = selectedChannelData?.code === 'expedia';
    const channelBoosters = isBooking ? BOOKING_BOOSTERS
        : isExpedia ? EXPEDIA_BOOSTERS
            : AGODA_BOOSTERS;

    // Reset boosters when channel changes
    useEffect(() => {
        setBoosters(channelBoosters.map(b => ({ ...b })));
    }, [selectedChannel]);

    // Channel dot colors for pill tabs
    const channelDotColors: Record<string, string> = {
        agoda: 'bg-orange-500',
        booking: 'bg-[#003580]',
        expedia: 'bg-yellow-400',
        traveloka: 'bg-green-500',
        ctrip: 'bg-red-500',
    };

    // Group pill config for table — short labels match UNIFIED_GROUP_LABELS
    const groupPillConfig: Record<string, { bg: string; text: string; dot: string; short: string }> = {
        SEASONAL: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', short: 'Seasonal' },
        ESSENTIAL: { bg: 'bg-[#EFF1F8]', text: 'text-[#204183]', dot: 'bg-[#204183]', short: 'Essential' },
        TARGETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', short: 'Targeted' },
        GENIUS: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500', short: 'Genius' },
        PORTFOLIO: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500', short: 'Portfolio' },
        CAMPAIGN: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', short: 'Campaign' },
    };

    // Active campaign count for badge
    const activeCampaignCount = campaigns.filter(c => c.is_active).length;

    return (
        <div className="space-y-5">
            {/* ── Channel Pill Tabs ── */}
            <div className="flex flex-wrap gap-1 bg-[#E9ECF3] rounded-xl p-1 w-fit">
                {channels.map((ch) => {
                    const isActive = ch.id === selectedChannel;
                    const dotColor = channelDotColors[ch.code] || 'bg-slate-400';
                    return (
                        <button
                            key={ch.id}
                            onClick={() => setSelectedChannel(ch.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${isActive
                                ? 'bg-[#204183] text-white shadow-md'
                                : 'text-slate-500 hover:text-[#204183] hover:bg-white/50'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${dotColor} ${isActive ? 'ring-2 ring-white/40' : ''}`} />
                            {ch.name}
                            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-[#DBE1EB] text-slate-500'
                                }`}>
                                {ch.id === selectedChannel ? activeCampaignCount : '–'}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Error message */}
            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* ── Two Panel Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
                {/* ── LEFT: Table + Marketing ── */}
                <div className="space-y-4 min-w-0">
                    {/* Panel Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-800">
                            {selectedChannelData?.name || 'OTA'}
                            <span className="text-sm font-normal text-slate-400 ml-2">
                                · {campaigns.length} {t('promotions')} · {t('commissionLabel')} {commissionPct}%
                                {calcType === 'PROGRESSIVE' ? ` · ${t('progressive')}`
                                    : calcType === 'SINGLE_DISCOUNT' ? ` · ${t('highestDeal')}`
                                        : ` · ${t('additive')}`}
                            </span>
                        </h2>
                        <button
                            onClick={() => handleOpenPicker(VENDOR_PICKER_TABS[selectedChannelData?.code || 'agoda']?.[0] || 'SEASONAL')}
                            className="flex items-center gap-2 px-4 py-2 bg-[#204183] hover:bg-[#1a3469] text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            {t('addPromotion')}
                        </button>
                    </div>

                    {/* ── Promotions Data Table ── */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-[#204183]" />
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="bg-white border border-[#DBE1EB] rounded-xl">
                            <button
                                onClick={() => handleOpenPicker(VENDOR_PICKER_TABS[selectedChannelData?.code || 'agoda']?.[0] || 'SEASONAL')}
                                className="w-full flex flex-col items-center justify-center py-16 text-slate-400 hover:text-[#204183] transition-colors cursor-pointer"
                            >
                                <Plus className="w-10 h-10 mb-3 opacity-40" />
                                <span className="text-sm font-medium">{t('noPromosYet')}</span>
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white border border-[#DBE1EB] rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#F2F4F8]">
                                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('promotionName')}</th>
                                        <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('group')}</th>
                                        <th className="text-right px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('discount')}</th>
                                        <th className="text-center px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('status')}</th>
                                        <th className="text-center px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map((c) => {
                                        const isFreeNights = c.promo.name.toLowerCase().includes('free night');
                                        // Self-healing: prefer static catalog groupType over DB group_type
                                        const catalogGroupType = getCatalogItem(c.promo.id)?.groupType || c.promo.group_type;
                                        const isTripCampaign = (selectedChannelData?.code === 'ctrip') && catalogGroupType === 'CAMPAIGN';
                                        const stackBehavior = isTripCampaign ? 'EXCLUSIVE' : (!c.promo.allow_stack ? 'EXCLUSIVE' : (catalogGroupType === 'PORTFOLIO' ? 'HIGHEST_WINS' : 'STACKABLE'));
                                        const badgeCfg = {
                                            STACKABLE: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: t('stackable') },
                                            HIGHEST_WINS: { bg: 'bg-blue-100', text: 'text-blue-700', label: t('highestWins') },
                                            EXCLUSIVE: { bg: 'bg-red-100', text: 'text-red-700', label: t('exclusive') },
                                        }[stackBehavior]!;
                                        const pill = groupPillConfig[catalogGroupType] || groupPillConfig.ESSENTIAL;
                                        const vendorCode = selectedChannelData?.code || 'agoda';
                                        const groupLabel = UNIFIED_GROUP_LABELS[catalogGroupType as keyof typeof GROUP_CONFIG] || pill.short;

                                        return (
                                            <tr key={c.id} className="border-t border-[#F2F4F8] hover:bg-[#FAFBFD] transition-colors">
                                                {/* Name + Badge */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="font-semibold text-slate-800 truncate">{c.promo.name}</span>
                                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${badgeCfg.bg} ${badgeCfg.text}`}>
                                                            {badgeCfg.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                {/* Group pill */}
                                                <td className="px-3 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${pill.bg} ${pill.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${pill.dot}`} />
                                                        {groupLabel}
                                                    </span>
                                                </td>
                                                {/* Discount */}
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center justify-end">
                                                        {isFreeNights ? (
                                                            <div className="flex items-center gap-1 text-xs">
                                                                <span className="text-slate-500">S</span>
                                                                <input
                                                                    type="number"
                                                                    min="2"
                                                                    max="14"
                                                                    value={Math.round(100 / (100 - c.discount_pct)) || 4}
                                                                    onChange={(e) => {
                                                                        const x = Math.max(2, parseInt(e.target.value) || 2);
                                                                        const y = x - 1;
                                                                        const pct = Math.round((1 - y / x) * 100);
                                                                        handleUpdateDiscount(c.id, pct);
                                                                    }}
                                                                    className="w-8 text-center text-xs font-semibold text-[#204183] bg-slate-50 border border-[#DBE1EB] rounded px-0.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#204183]"
                                                                />
                                                                <span className="text-slate-500">P</span>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max="13"
                                                                    value={Math.round(100 / (100 - c.discount_pct)) - 1 || 3}
                                                                    onChange={(e) => {
                                                                        const y = Math.max(1, parseInt(e.target.value) || 1);
                                                                        const x = y + 1;
                                                                        const pct = Math.round((1 - y / x) * 100);
                                                                        handleUpdateDiscount(c.id, pct);
                                                                    }}
                                                                    className="w-8 text-center text-xs font-semibold text-[#204183] bg-slate-50 border border-[#DBE1EB] rounded px-0.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#204183]"
                                                                />
                                                                <span className="text-[10px] text-slate-400">→{c.discount_pct}%</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    step="0.1"
                                                                    value={c.discount_pct}
                                                                    onChange={(e) => {
                                                                        const val = Math.min(100, Math.max(0, Math.round((parseFloat(e.target.value) || 0) * 10) / 10));
                                                                        handleUpdateDiscount(c.id, val);
                                                                    }}
                                                                    className="w-14 text-right text-sm font-bold text-[#204183] bg-slate-50 border border-[#DBE1EB] rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#204183]"
                                                                />
                                                                <span className="text-sm font-bold text-[#204183] ml-0.5">%</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                {/* Toggle */}
                                                <td className="px-3 py-3">
                                                    <button
                                                        onClick={() => handleToggle(c)}
                                                        className={`relative w-11 h-6 rounded-full transition-colors mx-auto block ${c.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                    >
                                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${c.is_active ? 'left-6' : 'left-1'}`} />
                                                    </button>
                                                </td>
                                                {/* Actions */}
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleDelete(c.id)}
                                                            className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {/* Add row */}
                                    <tr>
                                        <td colSpan={5} className="p-0">
                                            <button
                                                onClick={() => handleOpenPicker(VENDOR_PICKER_TABS[selectedChannelData?.code || 'agoda']?.[0] || 'SEASONAL')}
                                                className="w-full flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-[#204183] hover:bg-[#F8FAFC] text-sm font-semibold border-t-2 border-dashed border-[#E9ECF3] hover:border-[#204183] transition-all"
                                            >
                                                <Plus className="w-4 h-4" />
                                                {t('addFromCatalog')}
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ── Agoda Stacking Warning ── */}
                    {isAgoda && essentialCampaigns.filter(c => c.is_active).length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800 space-y-1">
                                <p className="font-semibold">{t('agodaStackingWarning')}</p>
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    {t('agodaStackingDesc')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Trip.com Campaign Exclusive Warning ── */}
                    {selectedChannelData?.code === 'ctrip' && campaignCampaigns.filter(c => c.is_active).length > 0 && campaigns.filter(c => c.is_active && c.promo.group_type !== 'CAMPAIGN').length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800 space-y-1">
                                <p className="font-semibold">{t('tripCampaignWarning')}</p>
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    {t('tripCampaignDesc')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Marketing Programs ── */}
                    {(isAgoda || isBooking || isExpedia) && (
                        <MarketingPrograms
                            boosters={boosters}
                            onUpdate={setBoosters}
                            baseCommission={commissionPct}
                            vendor={selectedChannelData?.code || 'agoda'}
                        />
                    )}

                    {/* Timing conflict warning */}
                    {timingConflictWarning && (
                        <div className="px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {timingConflictWarning}
                        </div>
                    )}

                    {/* Total Discount Summary */}
                    {selectedChannelData?.code === 'agoda' ? (
                        <div
                            className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-opacity ${previewRefreshing ? 'opacity-60' : ''} ${totalDiscount > 80
                                ? 'bg-red-50 border border-red-200'
                                : totalDiscount > 70
                                    ? 'bg-amber-50 border border-amber-200'
                                    : 'bg-[#F2F4F8] border border-[#DBE1EB]'
                                }`}
                        >
                            {previewRefreshing ? (
                                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                            ) : (
                                <AlertTriangle
                                    className={`w-5 h-5 ${totalDiscount > 80
                                        ? 'text-red-600'
                                        : totalDiscount > 70
                                            ? 'text-amber-600'
                                            : 'text-[#204183]'
                                        }`}
                                />
                            )}
                            <span className="text-sm font-medium text-slate-700">
                                {t('totalDiscountAgoda', { pct: totalDiscount.toFixed(1) })}
                            </span>
                        </div>
                    ) : (
                        <div className={`px-4 py-3 rounded-lg flex items-center gap-2 bg-[#F2F4F8] border border-[#DBE1EB] transition-opacity ${previewRefreshing ? 'opacity-60' : ''}`}>
                            {previewRefreshing ? (
                                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                            ) : (
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                            )}
                            <span className="text-sm font-medium text-slate-700">
                                {t('totalDiscount', { pct: totalDiscount.toFixed(1) })}
                                {calcType === 'PROGRESSIVE' ? ` (${t('progressive')})`
                                    : calcType === 'SINGLE_DISCOUNT' ? ` (${t('highestDeal')})`
                                        : ` (${t('additive')})`}
                            </span>
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Sticky Price Calculator ── */}
                <div className={`space-y-4 lg:sticky lg:top-6 transition-opacity duration-200 ${previewRefreshing ? 'opacity-70' : ''}`}>
                    {/* Price Calculator */}
                    <PriceCalculator
                        roomTypes={roomTypes}
                        selectedRoomId={selectedRoomId}
                        onRoomSelect={setSelectedRoomId}
                        totalDiscount={totalDiscount}
                        discountMultiplier={discountMultiplier}
                        commissionPct={effectiveCommissionPct}
                        channelName={selectedChannelData?.name || 'OTA'}
                        calcType={calcType}
                        vendor={selectedChannelData?.code}
                        b2bBoostPct={isExpedia ? (() => { const b = boosters.find(b => b.id === 'expedia-b2b-uplift'); return b?.enabled ? b.boostPct : undefined; })() : undefined}
                    />

                    {/* ── Expedia Public vs Member Comparison ── */}
                    {previewData?.publicScenario && (
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                            <h4 className="text-xs font-semibold text-indigo-700 mb-3 flex items-center gap-1.5">
                                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                </svg>
                                {t('publicVsMember')}
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {/* Public column */}
                                <div className="bg-white/80 rounded-lg p-3 border border-slate-200">
                                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                                        {t('public')}
                                    </div>
                                    <div className="font-bold text-slate-800 text-lg tabular-nums">
                                        {new Intl.NumberFormat('vi-VN').format(previewData.publicScenario.display)}₫
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                        −{previewData.publicScenario.totalDiscountEffective.toFixed(1)}%
                                        {previewData.publicScenario.appliedDeals.length > 0
                                            ? ` (${previewData.publicScenario.appliedDeals.join(', ')})`
                                            : ` ${t('noPromos')}`}
                                    </div>
                                    <div className="text-xs text-emerald-600 mt-1 font-medium">
                                        Net: {new Intl.NumberFormat('vi-VN').format(previewData.publicScenario.net)}₫
                                    </div>
                                </div>
                                {/* Member column */}
                                <div className="bg-white/80 rounded-lg p-3 border border-indigo-300 ring-1 ring-indigo-200">
                                    <div className="text-[10px] font-medium text-indigo-600 uppercase tracking-wider mb-1">
                                        {t('member')}
                                    </div>
                                    <div className="font-bold text-indigo-700 text-lg tabular-nums">
                                        {new Intl.NumberFormat('vi-VN').format(previewData.display)}₫
                                    </div>
                                    <div className="text-[10px] text-indigo-400 mt-0.5">
                                        −{previewData.totalDiscountEffective.toFixed(1)}% (Member + deal)
                                    </div>
                                    <div className="text-xs text-emerald-600 mt-1 font-medium">
                                        Net: {new Intl.NumberFormat('vi-VN').format(previewData.net)}₫
                                    </div>
                                </div>
                            </div>
                            {/* Savings badge */}
                            {previewData.publicScenario.display > previewData.display && (
                                <div className="mt-2 text-center">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                                        💰 Member saves {new Intl.NumberFormat('vi-VN').format(previewData.publicScenario.display - previewData.display)}₫
                                        ({((1 - previewData.display / previewData.publicScenario.display) * 100).toFixed(1)}% cheaper)
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pricing Explanation — uses server previewData for correct stacking */}
                    <PricingExplanation
                        previewData={previewData as PreviewDataForExplanation | null}
                        commissionPct={effectiveCommissionPct}
                        calcType={calcType}
                        netPrice={selectedRoom?.net_price || 0}
                    />
                </div>
            </div>

            {/* Picker Modal */}
            {showPicker && (
                <PromotionPicker
                    availablePromos={availablePromos}
                    onAdd={handleAddPromo}
                    onClose={() => setShowPicker(false)}
                    saving={saving}
                    channelName={selectedChannelData?.name || 'OTA'}
                    initialTab={pickerInitialTab}
                    vendor={selectedChannelData?.code || 'agoda'}
                />
            )}
        </div>
    );
}
