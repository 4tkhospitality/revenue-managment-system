'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Tag, X, Search, Calculator, DollarSign, TrendingUp } from 'lucide-react';
import { AGODA_BOOSTERS, BOOKING_BOOSTERS, EXPEDIA_BOOSTERS } from '@/lib/pricing/catalog';
import type { CommissionBooster } from '@/lib/pricing/types';

// 4TK Brand-aligned color config
const GROUP_CONFIG = {
    SEASONAL: {
        dotColor: 'bg-orange-500',
        label: 'Seasonal (Theo mùa)',
    },
    ESSENTIAL: {
        dotColor: 'bg-[#204183]',
        label: 'Essential (Cơ bản)',
    },
    TARGETED: {
        dotColor: 'bg-emerald-500',
        label: 'Targeted (Mục tiêu)',
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

// Vendor-specific group labels (UI Layer — display only)
const VENDOR_GROUP_LABELS: Record<string, Partial<Record<keyof typeof GROUP_CONFIG, string>>> = {
    agoda: {
        SEASONAL: 'Theo mùa',
        ESSENTIAL: 'Cơ bản',
        TARGETED: 'Mục tiêu',
    },
    booking: {
        TARGETED: 'Nhắm mục tiêu',
        GENIUS: 'Genius',
        PORTFOLIO: 'Cơ bản',
        CAMPAIGN: 'Campaign',
    },
    expedia: {
        ESSENTIAL: 'Khuyến mãi',
        TARGETED: 'Audience',
    },
};

// Vendor-specific tab groups for PromotionPicker
const VENDOR_PICKER_TABS: Record<string, GroupType[]> = {
    agoda: ['SEASONAL', 'ESSENTIAL', 'TARGETED'],
    booking: ['TARGETED', 'GENIUS', 'PORTFOLIO', 'CAMPAIGN'],
    expedia: ['ESSENTIAL', 'TARGETED'],
};

// Get label by vendor
function getGroupLabel(group: keyof typeof GROUP_CONFIG, vendor: string): string {
    return VENDOR_GROUP_LABELS[vendor]?.[group] || GROUP_CONFIG[group].label;
}

type GroupType = keyof typeof GROUP_CONFIG;

interface OTAChannel {
    id: string;
    name: string;
    code: string;
    commission: number;  // % hoa hồng từ tab Kênh OTA
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
                        {count} items
                    </span>
                </button>
                {/* Quick Add (+) button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onAddClick(group); }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#204183] hover:bg-[#204183] hover:text-white rounded-lg border border-[#204183]/30 hover:border-[#204183] transition-colors"
                    title={`Thêm khuyến mãi ${label}`}
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm</span>
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
                            <span className="text-sm font-medium">Nhấn để thêm khuyến mãi</span>
                        </button>
                    ) : (
                        <div className="space-y-2">
                            {/* Guide header row */}
                            <div className="grid grid-cols-[1fr_80px_52px_36px] items-center px-4 py-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider gap-3">
                                <span>Tên khuyến mãi</span>
                                <span className="text-right">Giảm giá</span>
                                <span className="text-center">Trạng thái</span>
                                <span className="text-center">Xóa</span>
                            </div>
                            {campaigns.map((c) => {
                                // Check if this is a Free Nights deal
                                const isFreeNights = c.promo.name.toLowerCase().includes('free night');
                                // Derive stackBehavior from promo properties
                                const stackBehavior = !c.promo.allow_stack ? 'EXCLUSIVE' : (c.promo.group_type === 'PORTFOLIO' ? 'HIGHEST_WINS' : 'STACKABLE');
                                const badgeConfig = {
                                    STACKABLE: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Stackable' },
                                    HIGHEST_WINS: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Highest Wins' },
                                    EXCLUSIVE: { bg: 'bg-red-100', text: 'text-red-700', label: 'Exclusive' },
                                    ONLY_WITH_GENIUS: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Only w/ Genius' },
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
                                                        value={c.discount_pct}
                                                        onChange={(e) => {
                                                            const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                            onUpdateDiscount(c.id, val);
                                                        }}
                                                        className="w-12 text-right text-sm font-semibold text-[#204183] bg-slate-50 border border-[#DBE1EB] rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#204183]"
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
    const [activeTab, setActiveTab] = useState<GroupType>(initialTab);
    const [search, setSearch] = useState('');

    const filteredPromos = availablePromos.filter((p) => {
        const matchesGroup = p.group_type === activeTab;
        const matchesSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase());
        return matchesGroup && matchesSearch;
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col border border-[#DBE1EB]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#DBE1EB]">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-orange-500" />
                        Thêm Khuyến mãi {channelName}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs — dynamic per vendor */}
                <div className="flex border-b border-[#DBE1EB]">
                    {(VENDOR_PICKER_TABS[vendor] || ['SEASONAL', 'ESSENTIAL', 'TARGETED']).map((group) => {
                        const isActive = activeTab === group;
                        return (
                            <button
                                key={group}
                                onClick={() => setActiveTab(group)}
                                className={`flex-1 py-3 text-sm font-medium transition-colors ${isActive
                                    ? 'bg-orange-500 text-white'
                                    : 'text-slate-500 hover:text-[#204183] hover:bg-[#F2F4F8]'
                                    }`}
                            >
                                {getGroupLabel(group, vendor)}
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="px-4 py-3 border-b border-[#DBE1EB] bg-[#F2F4F8]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm chương trình..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-[#DBE1EB] rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#204183]"
                        />
                    </div>
                </div>

                {/* Promo List */}
                <div className="flex-1 overflow-y-auto px-4 py-2 bg-[#F2F4F8]">
                    {filteredPromos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Tag className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-sm">Không có chương trình nào</span>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredPromos.map((promo) => (
                                <div
                                    key={promo.id}
                                    className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-[#DBE1EB] hover:border-[#204183] transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-800">{promo.name}</span>
                                            {promo.sub_category && (
                                                <span className="px-2 py-0.5 text-xs font-medium bg-[#E9ECF3] text-[#204183] rounded uppercase">
                                                    {promo.sub_category}
                                                </span>
                                            )}
                                        </div>
                                        {promo.description && (
                                            <p className="text-sm text-slate-500 mt-0.5">{promo.description}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => onAdd(promo)}
                                        disabled={saving}
                                        className="ml-4 px-4 py-2 bg-[#204183] hover:bg-[#1a3469] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        + Thêm
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
}: {
    roomTypes: RoomType[];
    selectedRoomId: string;
    onRoomSelect: (id: string) => void;
    totalDiscount: number;
    discountMultiplier: number;
    commissionPct: number;
    channelName: string;
    calcType: 'PROGRESSIVE' | 'ADDITIVE' | 'SINGLE_DISCOUNT';
}) {
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
        // Giá thu về → Tính ngược lên BAR + Display
        netRevenue = inputValue || baseNetPrice;
        guestPrice = commissionMultiplier > 0 ? netRevenue / commissionMultiplier : netRevenue;
        barPrice = discountMultiplier > 0 ? guestPrice / discountMultiplier : guestPrice;
    } else if (calcMode === 'display_to_net') {
        // Giá BAR (Channel Manager) → Tính xuống Display + NET
        barPrice = inputValue || (baseNetPrice / discountMultiplier / commissionMultiplier);
        guestPrice = barPrice * discountMultiplier;
        netRevenue = guestPrice * commissionMultiplier;
    } else {
        // Giá hiển thị (khách thấy) → Tính ngược BAR + tính xuống NET
        guestPrice = inputValue || (baseNetPrice / commissionMultiplier);
        barPrice = discountMultiplier > 0 ? guestPrice / discountMultiplier : guestPrice;
        netRevenue = guestPrice * commissionMultiplier;
    }

    if (roomTypes.length === 0) {
        return (
            <div className="bg-[#F2F4F8] border border-[#DBE1EB] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-[#204183] mb-3 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Tính giá - {channelName}
                </h3>
                <p className="text-sm text-slate-500">Chưa có hạng phòng. Vui lòng thêm ở tab &quot;Hạng phòng&quot;.</p>
            </div>
        );
    }

    const calcLabel = calcType === 'PROGRESSIVE' ? 'lũy tiến' : calcType === 'SINGLE_DISCOUNT' ? 'deal cao nhất' : 'cộng dồn';

    return (
        <div className="bg-[#F2F4F8] border border-[#DBE1EB] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#204183] mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Tính giá - {channelName} ({commissionPct}% hoa hồng)
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
                    Giá Thu về
                </button>
                <button
                    onClick={() => setCalcMode('display_to_net')}
                    className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${calcMode === 'display_to_net'
                        ? 'bg-[#204183] text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    Giá BAR
                </button>
                <button
                    onClick={() => setCalcMode('guest_price')}
                    className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${calcMode === 'guest_price'
                        ? 'bg-[#204183] text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    Giá Hiển thị
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
                        {room.name} - {formatNumber(room.net_price)}đ (Net)
                    </option>
                ))}
            </select>

            {/* Input field */}
            <div className="mb-4">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                    {calcMode === 'net_to_display'
                        ? 'Nhập giá thu về mong muốn:'
                        : calcMode === 'display_to_net'
                            ? 'Nhập giá BAR (Channel Manager):'
                            : 'Nhập giá khách thấy trên OTA:'
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
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">đ</span>
                </div>
            </div>

            {/* 3-Price breakdown: BAR → Guest Price → Net Revenue */}
            <div className="space-y-2 text-sm">
                {/* ① BAR — Channel Manager price */}
                <div className="bg-white rounded-lg border border-[#DBE1EB] p-3">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">① Giá Channel Manager (BAR)</span>
                        <span className="font-bold text-[#204183] text-lg">{formatNumber(barPrice)}đ</span>
                    </div>
                </div>

                {/* Arrow + Discount info */}
                {totalDiscount > 0 && (
                    <div className="flex items-center gap-2 px-3 text-xs text-orange-600">
                        <span>↓</span>
                        <span>Khuyến mãi −{totalDiscount.toFixed(1)}% ({calcLabel})</span>
                        <span className="ml-auto">−{formatNumber(barPrice - guestPrice)}đ</span>
                    </div>
                )}

                {/* ② Guest Display Price */}
                <div className="bg-white rounded-lg border border-orange-200 p-3">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">② Giá khách thấy trên OTA</span>
                        <span className="font-bold text-orange-600 text-lg">{formatNumber(guestPrice)}đ</span>
                    </div>
                </div>

                {/* Arrow + Commission info */}
                <div className="flex items-center gap-2 px-3 text-xs text-slate-500">
                    <span>↓</span>
                    <span>Hoa hồng OTA −{commissionPct}%</span>
                    <span className="ml-auto">−{formatNumber(guestPrice - netRevenue)}đ</span>
                </div>

                {/* ③ Net Revenue */}
                <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-3">
                    <div className="flex justify-between items-center">
                        <span className="text-emerald-700 text-xs font-medium">③ Tiền thu về (Net Revenue)</span>
                        <span className="font-bold text-emerald-700 text-lg">{formatNumber(netRevenue)}đ</span>
                    </div>
                </div>
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
        agoda: 'Marketing Programs (Agoda)',
        booking: 'Marketing Programs (Booking.com)',
        expedia: 'Marketing Programs (Expedia)',
    };

    return (
        <div className="bg-[#E9ECF3] border border-[#DBE1EB] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-[#204183]" />
                    <span className="font-medium text-slate-800">{vendorTitles[vendor] || 'Marketing Programs'}</span>
                </div>
                {totalBoost > 0 && (
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                        +{totalBoost}% commission
                    </span>
                )}
            </div>

            <div className="px-4 pb-4 space-y-3">
                {/* AGP tiers — Agoda only */}
                {vendor === 'agoda' && agpBoosters.length > 0 && (
                    <div className="bg-white border border-[#DBE1EB] rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <span className="font-medium text-slate-800 text-sm">AGP</span>
                                <span className="text-xs text-slate-500 ml-2">Agoda Growth Program</span>
                            </div>
                            <button
                                onClick={() => activeAGP ? handleToggle(activeAGP.id) : handleAGPChange(agpBoosters[0]?.id)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${activeAGP ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${activeAGP ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                        {activeAGP && (
                            <div className="flex gap-2">
                                {agpBoosters.map(tier => (
                                    <button
                                        key={tier.id}
                                        onClick={() => handleAGPChange(tier.id)}
                                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${tier.enabled
                                            ? 'bg-[#204183] text-white'
                                            : 'bg-[#F2F4F8] text-slate-600 hover:bg-[#DBE1EB]'
                                            }`}
                                    >
                                        {tier.tier?.charAt(0).toUpperCase()}{tier.tier?.slice(1)} ({tier.boostPct}%)
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Generic boosters: AGX/SL (Agoda), Preferred (Booking), Accelerator/B2B (Expedia) */}
                {genericBoosters.map(booster => (
                    <div key={booster.id} className="bg-white border border-[#DBE1EB] rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-medium text-slate-800 text-sm">{booster.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {booster.isVariable && (
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={booster.boostPct}
                                            onChange={(e) => handlePctChange(booster.id, parseInt(e.target.value) || 0)}
                                            disabled={!booster.enabled}
                                            className="w-12 text-right text-sm font-semibold text-[#204183] bg-slate-50 border border-[#DBE1EB] rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#204183] disabled:opacity-40"
                                        />
                                        <span className="text-sm font-semibold text-[#204183] ml-0.5">%</span>
                                    </div>
                                )}
                                {!booster.isVariable && (
                                    <span className="text-sm font-semibold text-[#204183]">{booster.boostPct}%</span>
                                )}
                                <button
                                    onClick={() => handleToggle(booster.id)}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${booster.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${booster.enabled ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Commission breakdown */}
                {totalBoost > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-orange-700">
                            📊 Commission: Base {baseCommission}%
                            {activeBoosters.map(b => ` + ${b.name} ${b.boostPct}%`).join('')}
                            {' '}= <strong>{effectiveCommission}%</strong>
                        </p>
                        {effectiveCommission > 40 && (
                            <p className="text-xs text-red-600 mt-1">
                                ⚠️ Commission rất cao ({effectiveCommission}%) — kiểm tra lại
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Step-by-step Explanation Panel
function PricingExplanation({
    campaigns,
    totalDiscount,
    commissionPct,
    validation,
    calcType,
}: {
    campaigns: Campaign[];
    totalDiscount: number;
    commissionPct: number;
    validation: ValidationResult;
    calcType: 'PROGRESSIVE' | 'ADDITIVE' | 'SINGLE_DISCOUNT';
}) {
    const activeCampaigns = campaigns.filter((c) => c.is_active);

    return (
        <div className="bg-[#F2F4F8] border border-[#DBE1EB] rounded-xl p-4 space-y-4">
            {/* Validation */}
            <div>
                <h3 className="text-sm font-semibold text-[#204183] mb-2">Validation</h3>
                <div className="space-y-1">
                    {validation.errors.length === 0 && validation.warnings.length === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-emerald-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Tất cả quy tắc đều đạt</span>
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

            {/* Step-by-step breakdown */}
            <div className="border-t border-[#DBE1EB] pt-4">
                <h3 className="text-sm font-semibold text-[#204183] mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Giải thích cách tính
                </h3>

                <div className="space-y-3 text-sm">
                    <div className="bg-white rounded-lg p-3 border border-[#DBE1EB]">
                        <p className="font-medium text-slate-700 mb-1">📌 Bước 1: Giá gốc</p>
                        <p className="text-slate-500">Giá phòng mà khách sạn muốn thu về (Net price)</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-[#DBE1EB]">
                        <p className="font-medium text-slate-700 mb-1">📌 Bước 2: Cộng hoa hồng OTA ({commissionPct}%)</p>
                        <p className="text-slate-500">Giá gốc ÷ (1 - {commissionPct}%) = Giá trước khuyến mãi</p>
                    </div>

                    {totalDiscount > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-[#DBE1EB]">
                            <p className="font-medium text-slate-700 mb-1">📌 Bước 3: {calcType === 'PROGRESSIVE' ? 'Nhân lũy tiến' : 'Cộng dồn'} khuyến mãi ({totalDiscount.toFixed(1)}%)</p>
                            <p className="text-slate-500">{calcType === 'PROGRESSIVE'
                                ? 'Giá trước KM × Π(1 - dᵢ) = Giá hiển thị (mỗi KM nhân trên giá đã giảm)'
                                : `Giá trước KM ÷ (1 - ${totalDiscount}%) = Giá hiển thị`
                            }</p>
                            {activeCampaigns.length > 0 && (
                                <div className="mt-2 text-xs text-slate-400">
                                    Gồm: {activeCampaigns.map((c) => `${c.promo.name} (${c.discount_pct}%)`).join(' + ')}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                        <p className="font-medium text-emerald-700 mb-1">✅ Kết quả</p>
                        <p className="text-emerald-600">
                            Khách trả <strong>Giá hiển thị</strong> → OTA giữ {commissionPct}% →
                            Khách sạn nhận <strong>Tiền thu về</strong>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PromotionsTab() {
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

    // Fetch channels
    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const res = await fetch('/api/pricing/ota-channels', { credentials: 'include' });
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setChannels(data);
                if (data.length > 0) {
                    setSelectedChannel(data[0].id);
                }
            } catch (err: unknown) {
                const error = err as Error;
                setError(error.message);
            }
        };
        fetchChannels();
    }, []);

    // Fetch room types
    useEffect(() => {
        const fetchRoomTypes = async () => {
            try {
                const res = await fetch('/api/pricing/room-types', { credentials: 'include' });
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setRoomTypes(data);
                if (data.length > 0) {
                    setSelectedRoomId(data[0].id);
                }
            } catch (err: unknown) {
                const error = err as Error;
                setError(error.message);
            }
        };
        fetchRoomTypes();
    }, []);

    // Fetch catalog based on selected channel's vendor
    useEffect(() => {
        const fetchCatalog = async () => {
            // Get vendor from selected channel's code
            const channel = channels.find((c) => c.id === selectedChannel);
            const vendor = channel?.code || 'agoda';
            try {
                const res = await fetch(`/api/pricing/catalog?vendor=${vendor}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setCatalog(data);
            } catch (err: unknown) {
                const error = err as Error;
                setError(error.message);
            }
        };
        if (selectedChannel && channels.length > 0) {
            fetchCatalog();
        }
    }, [selectedChannel, channels]);

    // Fetch campaigns for selected channel
    useEffect(() => {
        const fetchCampaigns = async () => {
            if (!selectedChannel) return;
            setLoading(true);
            try {
                const res = await fetch(`/api/pricing/campaigns?channel_id=${selectedChannel}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setCampaigns(data);
            } catch (err: unknown) {
                const error = err as Error;
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCampaigns();
    }, [selectedChannel]);

    // Validate current selection
    const validate = (): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];
        const active = campaigns.filter((c) => c.is_active);
        const vendorCode = channels.find((c) => c.id === selectedChannel)?.code || 'agoda';

        // =========================================================================
        // EXPEDIA: ISOLATED Mode - Each promotion is standalone, no real stacking
        // =========================================================================
        if (vendorCode === 'expedia') {
            if (active.length > 1) {
                warnings.push(`Expedia: Mỗi promotion tạo rate plan riêng, không cộng dồn. Khách chỉ nhận 1 discount.`);
            }
            return { isValid: errors.length === 0, errors, warnings };
        }

        // =========================================================================
        // TRIP.COM/CTRIP: ADDITIVE Mode - Same "box" = pick 1, different boxes = additive stack
        // =========================================================================
        if (vendorCode === 'ctrip') {
            // Check same-box conflicts (REGULAR, TARGETING, CAMPAIGN, PACKAGE)
            const boxGroups: Record<string, Campaign[]> = {};
            active.forEach((c) => {
                const box = c.promo.sub_category || 'OTHER';
                if (!boxGroups[box]) boxGroups[box] = [];
                boxGroups[box].push(c);
            });
            Object.entries(boxGroups).forEach(([box, items]) => {
                if (items.length > 1) {
                    errors.push(`Trip.com: Cùng nhóm "${box}" chỉ chọn được 1 (đang chọn ${items.length})`);
                }
            });
            // Trip.com uses ADDITIVE calculation
            const totalAdditive = active.reduce((sum, c) => sum + c.discount_pct, 0);
            if (totalAdditive > 50) {
                warnings.push(`Trip.com: Tổng discount CỘNG DỒN ${totalAdditive}% - khá cao`);
            }
            return { isValid: errors.length === 0, errors, warnings };
        }

        // =========================================================================
        // BOOKING.COM: Progressive + Max 3 + Deep Deals no-stack
        // =========================================================================
        if (vendorCode === 'booking') {
            // Deep Deals cannot stack
            const deepDeals = active.filter((c) => c.promo.allow_stack === false);
            if (deepDeals.length > 0 && active.length > 1) {
                errors.push(`Deep Deal "${deepDeals[0].promo.name}" không thể kết hợp với promotions khác`);
            }
            // Max 3 stacking
            if (active.length > 3) {
                errors.push(`Booking.com chỉ cho phép tối đa 3 promotions cùng lúc (đang chọn ${active.length})`);
            }
            // Same subcategory = pick highest only
            const subcatGroups: Record<string, Campaign[]> = {};
            active.forEach((c) => {
                if (c.promo.sub_category) {
                    const key = c.promo.sub_category;
                    if (!subcatGroups[key]) subcatGroups[key] = [];
                    subcatGroups[key].push(c);
                }
            });
            Object.entries(subcatGroups).forEach(([subcat, items]) => {
                if (items.length > 1) {
                    warnings.push(`Booking.com: Cùng nhóm "${subcat}" sẽ chỉ áp dụng discount cao nhất`);
                }
            });
            return { isValid: errors.length === 0, errors, warnings };
        }

        // =========================================================================
        // AGODA & TRAVELOKA: Progressive stacking with category rules
        // =========================================================================
        // Max 1 SEASONAL
        const seasonals = active.filter((c) => c.promo.group_type === 'SEASONAL');
        if (seasonals.length > 1) {
            errors.push(`Chỉ được chọn 1 Seasonal (đang chọn ${seasonals.length})`);
        }

        // Max 1 TARGETED per subcategory
        const targeteds = active.filter((c) => c.promo.group_type === 'TARGETED');
        const subcatGroups: Record<string, Campaign[]> = {};
        targeteds.forEach((c) => {
            const key = c.promo.sub_category || 'UNKNOWN';
            if (!subcatGroups[key]) subcatGroups[key] = [];
            subcatGroups[key].push(c);
        });
        Object.entries(subcatGroups).forEach(([subcat, items]) => {
            if (items.length > 1) {
                errors.push(`Chỉ được chọn 1 Targeted trong nhóm ${subcat} (đang chọn ${items.length})`);
            }
        });

        // Total discount - only check for Agoda (80% max)
        const total = active.reduce((sum, c) => sum + c.discount_pct, 0);
        if (vendorCode === 'agoda') {
            if (total > 80) {
                errors.push(`Tổng giảm giá vượt quá 80% (hiện tại: ${total}%)`);
            } else if (total > 70) {
                warnings.push(`Tổng giảm giá gần đạt giới hạn (${total}% / 80%)`);
            }
        }

        return { isValid: errors.length === 0, errors, warnings };
    };

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
        if (!confirm('Xóa promotion này?')) return;
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

    const validation = validate();
    const selectedChannelData = channels.find((c) => c.id === selectedChannel);
    const commissionPct = selectedChannelData?.commission || 0; // Lấy từ tab Kênh OTA

    // V01.4: Calculate totalDiscount based on calcType
    const activeDiscounts = campaigns.filter((c) => c.is_active);
    const calcType = (selectedChannelData?.calc_type as 'PROGRESSIVE' | 'ADDITIVE' | 'SINGLE_DISCOUNT') || 'PROGRESSIVE';

    // Channel-specific discount selection rules (ENGINE LAYER — source of truth)
    let appliedDiscounts = activeDiscounts;

    // Helper: within a group sharing the same subcategory, keep only the highest discount
    const dedupeBySubcategory = (deals: Campaign[]): Campaign[] => {
        const subcatMap = new Map<string, Campaign>();
        const noSubcat: Campaign[] = [];
        for (const c of deals) {
            const key = c.promo.sub_category || '';
            if (!key) { noSubcat.push(c); continue; }
            const existing = subcatMap.get(key);
            if (!existing || c.discount_pct > existing.discount_pct) {
                subcatMap.set(key, c);
            }
        }
        return [...noSubcat, ...subcatMap.values()];
    };

    // Helper: pick only the highest Genius level (L1/L2/L3 — only 1 applies per booking)
    const pickBestGenius = (deals: Campaign[]): Campaign[] => {
        const genius = deals.filter(c => c.promo.group_type === 'GENIUS');
        const nonGenius = deals.filter(c => c.promo.group_type !== 'GENIUS');
        if (genius.length <= 1) return deals;
        const best = genius.reduce((b, c) => c.discount_pct > b.discount_pct ? c : b);
        return [...nonGenius, best];
    };

    // Booking.com: 3-tier exclusion engine
    if (selectedChannelData?.code === 'booking' && activeDiscounts.length > 0) {
        // 1) Check for EXCLUSIVE deals (Campaign: Getaway, Black Friday, Deal of Day, etc.)
        const exclusiveDeals = activeDiscounts.filter(c =>
            !c.promo.allow_stack && c.promo.group_type === 'CAMPAIGN'
        );
        if (exclusiveDeals.length > 0) {
            // EXCLUSIVE deal blocks everything EXCEPT Genius (highest level only)
            const geniusDeals = activeDiscounts.filter(c => c.promo.group_type === 'GENIUS');
            const bestExclusive = exclusiveDeals.reduce((best, c) =>
                c.discount_pct > best.discount_pct ? c : best
            );
            appliedDiscounts = pickBestGenius([...geniusDeals, bestExclusive]);
        } else {
            // 2) Check for Business Bookers (blocks ALL, no Genius)
            const businessBookers = activeDiscounts.filter(c =>
                c.promo.sub_category === 'BUSINESS_BOOKERS'
            );
            if (businessBookers.length > 0) {
                appliedDiscounts = [businessBookers[0]]; // Only the exclusive rate
            } else {
                // 3) Normal stacking: Portfolio highest-wins + Targeted subcategory highest-wins + Genius highest-only
                const portfolioActive = activeDiscounts.filter(c => c.promo.group_type === 'PORTFOLIO');
                const targetedActive = activeDiscounts.filter(c => c.promo.group_type === 'TARGETED');
                const geniusActive = activeDiscounts.filter(c => c.promo.group_type === 'GENIUS');
                const otherActive = activeDiscounts.filter(c =>
                    c.promo.group_type !== 'PORTFOLIO' &&
                    c.promo.group_type !== 'TARGETED' &&
                    c.promo.group_type !== 'GENIUS'
                );

                // Portfolio: pick highest deal only
                const bestPortfolio = portfolioActive.length > 0
                    ? [portfolioActive.reduce((best, c) => c.discount_pct > best.discount_pct ? c : best)]
                    : [];

                // Targeted: same subcategory picks highest only (Mobile vs Country = same sub)
                const bestTargeted = dedupeBySubcategory(targetedActive);

                // Genius: pick highest level only (L1/L2/L3)
                const bestGenius = geniusActive.length > 0
                    ? [geniusActive.reduce((best, c) => c.discount_pct > best.discount_pct ? c : best)]
                    : [];

                appliedDiscounts = [...bestGenius, ...bestTargeted, ...bestPortfolio, ...otherActive];
            }
        }
    }

    // Expedia: SINGLE_DISCOUNT — only highest deal applies
    if (selectedChannelData?.code === 'expedia' && activeDiscounts.length > 1) {
        const best = activeDiscounts.reduce((best, c) =>
            c.discount_pct > best.discount_pct ? c : best
        );
        appliedDiscounts = [best];
    }

    // ── Timing conflict resolution (Early Bird + Last-Minute are mutually exclusive) ──
    // A guest cannot book both "early" AND "last-minute". When both are active,
    // only the LARGER discount applies. This matches the engine's resolveTimingConflicts().
    const EARLY_BIRD_RE = /early\s*bird/i;
    const LAST_MINUTE_RE = /last[\s-]*minute/i;
    const earlyBirdCamp = appliedDiscounts.find(c => EARLY_BIRD_RE.test(c.promo.name));
    const lastMinuteCamp = appliedDiscounts.find(c => LAST_MINUTE_RE.test(c.promo.name));
    let timingConflictWarning: string | null = null;

    if (earlyBirdCamp && lastMinuteCamp) {
        // Both exist → keep the larger discount, remove the smaller
        const toRemove = earlyBirdCamp.discount_pct >= lastMinuteCamp.discount_pct
            ? lastMinuteCamp : earlyBirdCamp;
        appliedDiscounts = appliedDiscounts.filter(c => c.id !== toRemove.id);
        timingConflictWarning = `⚠️ Early Bird + Last-Minute không cộng dồn → Bỏ "${toRemove.promo.name}" (${toRemove.discount_pct}%)`;
    }

    let totalDiscount: number;
    let discountMultiplier: number;
    if (calcType === 'SINGLE_DISCOUNT' && appliedDiscounts.length > 0) {
        // Single discount: only highest deal
        totalDiscount = appliedDiscounts[0].discount_pct;
        discountMultiplier = 1 - totalDiscount / 100;
    } else if (calcType === 'PROGRESSIVE' && appliedDiscounts.length > 0) {
        // Progressive: effective = 1 - Π(1 - dᵢ/100)
        discountMultiplier = appliedDiscounts.reduce((mult, c) => mult * (1 - c.discount_pct / 100), 1);
        totalDiscount = (1 - discountMultiplier) * 100;
    } else {
        // Additive: sum
        totalDiscount = appliedDiscounts.reduce((sum, c) => sum + c.discount_pct, 0);
        discountMultiplier = totalDiscount > 0 ? (1 - totalDiscount / 100) : 1;
    }

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

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <select
                        value={selectedChannel}
                        onChange={(e) => setSelectedChannel(e.target.value)}
                        className="px-3 py-2 bg-[#204183] border border-[#204183] rounded-lg text-white focus:ring-2 focus:ring-[#204183] focus:outline-none"
                    >
                        {channels.map((ch) => (
                            <option key={ch.id} value={ch.id}>
                                {ch.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={() => handleOpenPicker('SEASONAL')}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Thêm Khuyến Mãi
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Promotion Groups */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Title */}
                    <div className="flex items-center gap-2 text-slate-700">
                        <CheckCircle className="w-5 h-5 text-[#204183]" />
                        <h2 className="font-semibold">{isBooking ? 'Kết hợp giảm giá (lũy tiến theo Booking rules)' : 'Cộng dồn khuyến mãi'}</h2>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-[#204183]" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Agoda: Seasonal + Essential + Targeted */}
                            {!isBooking && (
                                <>
                                    <PromotionGroup
                                        group="SEASONAL"
                                        campaigns={seasonalCampaigns}
                                        onToggle={handleToggle}
                                        onDelete={handleDelete}
                                        onAddClick={handleOpenPicker}
                                        onUpdateDiscount={handleUpdateDiscount}
                                        vendor={selectedChannelData?.code || 'agoda'}
                                    />
                                    <PromotionGroup
                                        group="ESSENTIAL"
                                        campaigns={essentialCampaigns}
                                        onToggle={handleToggle}
                                        onDelete={handleDelete}
                                        onAddClick={handleOpenPicker}
                                        onUpdateDiscount={handleUpdateDiscount}
                                        vendor={selectedChannelData?.code || 'agoda'}
                                    />
                                    <PromotionGroup
                                        group="TARGETED"
                                        campaigns={targetedCampaigns}
                                        onToggle={handleToggle}
                                        onDelete={handleDelete}
                                        onAddClick={handleOpenPicker}
                                        onUpdateDiscount={handleUpdateDiscount}
                                        vendor={selectedChannelData?.code || 'agoda'}
                                    />
                                </>
                            )}
                            {/* Booking.com: Targeted → Genius → Portfolio → Campaign */}
                            {isBooking && (
                                <>
                                    <PromotionGroup
                                        group="TARGETED"
                                        campaigns={targetedCampaigns}
                                        onToggle={handleToggle}
                                        onDelete={handleDelete}
                                        onAddClick={handleOpenPicker}
                                        onUpdateDiscount={handleUpdateDiscount}
                                        vendor="booking"
                                    />
                                    <PromotionGroup
                                        group="GENIUS"
                                        campaigns={geniusCampaigns}
                                        onToggle={handleToggle}
                                        onDelete={handleDelete}
                                        onAddClick={handleOpenPicker}
                                        onUpdateDiscount={handleUpdateDiscount}
                                        vendor="booking"
                                    />
                                    <PromotionGroup
                                        group="PORTFOLIO"
                                        campaigns={portfolioCampaigns}
                                        onToggle={handleToggle}
                                        onDelete={handleDelete}
                                        onAddClick={handleOpenPicker}
                                        onUpdateDiscount={handleUpdateDiscount}
                                        vendor="booking"
                                    />
                                    {/* Portfolio note */}
                                    <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs flex items-center gap-2">
                                        <span>📌</span>
                                        <span>Trong nhóm Portfolio Deals, Booking chỉ áp dụng deal tốt nhất (highest wins).</span>
                                    </div>
                                    <PromotionGroup
                                        group="CAMPAIGN"
                                        campaigns={campaignCampaigns}
                                        onToggle={handleToggle}
                                        onDelete={handleDelete}
                                        onAddClick={handleOpenPicker}
                                        onUpdateDiscount={handleUpdateDiscount}
                                        vendor="booking"
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {/* Marketing Programs (all vendors with boosters) */}
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

                    {/* Total Discount - Only show 80% limit for Agoda */}
                    {selectedChannelData?.code === 'agoda' && (
                        <div
                            className={`px-4 py-3 rounded-lg flex items-center gap-2 ${totalDiscount > 80
                                ? 'bg-red-50 border border-red-200'
                                : totalDiscount > 70
                                    ? 'bg-amber-50 border border-amber-200'
                                    : 'bg-[#F2F4F8] border border-[#DBE1EB]'
                                }`}
                        >
                            <AlertTriangle
                                className={`w-5 h-5 ${totalDiscount > 80
                                    ? 'text-red-600'
                                    : totalDiscount > 70
                                        ? 'text-amber-600'
                                        : 'text-[#204183]'
                                    }`}
                            />
                            <span className="text-sm font-medium text-slate-700">
                                Tổng giảm giá: {totalDiscount.toFixed(1)}% (Agoda tối đa 80%)
                            </span>
                        </div>
                    )}
                    {selectedChannelData?.code !== 'agoda' && (
                        <div className="px-4 py-3 rounded-lg flex items-center gap-2 bg-[#F2F4F8] border border-[#DBE1EB]">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm font-medium text-slate-700">
                                Tổng giảm giá: {totalDiscount.toFixed(1)}%
                                {calcType === 'PROGRESSIVE' ? ' (lũy tiến)'
                                    : calcType === 'SINGLE_DISCOUNT' ? ' (deal cao nhất)'
                                        : ' (cộng dồn)'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right Panel */}
                <div className="space-y-4">
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
                    />

                    {/* Pricing Explanation */}
                    <PricingExplanation
                        campaigns={campaigns}
                        totalDiscount={totalDiscount}
                        commissionPct={effectiveCommissionPct}
                        validation={validation}
                        calcType={calcType}
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
