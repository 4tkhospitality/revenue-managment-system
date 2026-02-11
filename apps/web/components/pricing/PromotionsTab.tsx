'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Tag, X, Search, Calculator, DollarSign, TrendingUp } from 'lucide-react';
import { AGODA_BOOSTERS } from '@/lib/pricing/catalog';
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
} as const;

// Vendor-specific group labels
const VENDOR_GROUP_LABELS: Record<string, Record<keyof typeof GROUP_CONFIG, string>> = {
    agoda: {
        SEASONAL: 'Seasonal (Theo mùa)',
        ESSENTIAL: 'Essential (Cơ bản)',
        TARGETED: 'Targeted (Mục tiêu)',
    },
    booking: {
        SEASONAL: 'Tactical (Thời điểm)',
        ESSENTIAL: 'Basic Deals',
        TARGETED: 'Genius & Visibility',
    },
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
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#DBE1EB] transition-colors"
            >
                <div className="flex items-center gap-3">
                    {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-[#204183]" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-[#204183]" />
                    )}
                    <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
                    <span className="font-medium text-slate-800">{label}</span>
                </div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">
                    {count} items
                </span>
            </button>

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
                            {campaigns.map((c) => (
                                <div
                                    key={c.id}
                                    className="flex items-center justify-between px-4 py-3 bg-white border border-[#DBE1EB] rounded-lg"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-800">{c.promo.name}</span>
                                        {c.promo.sub_category && (
                                            <span className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">
                                                {c.promo.sub_category}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {/* Editable discount percentage */}
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
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
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

                {/* Tabs */}
                <div className="flex border-b border-[#DBE1EB]">
                    {(['SEASONAL', 'ESSENTIAL', 'TARGETED'] as GroupType[]).map((group) => {
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

// Price Calculator Panel - Bidirectional (Net ↔ Display)
function PriceCalculator({
    roomTypes,
    selectedRoomId,
    onRoomSelect,
    totalDiscount,
    commissionPct,
    channelName,
}: {
    roomTypes: RoomType[];
    selectedRoomId: string;
    onRoomSelect: (id: string) => void;
    totalDiscount: number;
    commissionPct: number;
    channelName: string;
}) {
    const [calcMode, setCalcMode] = useState<'net_to_display' | 'display_to_net'>('net_to_display');
    const [customInput, setCustomInput] = useState<string>('');

    const selectedRoom = roomTypes.find((r) => r.id === selectedRoomId);
    const baseNetPrice = selectedRoom?.net_price || 0;

    // Multipliers
    const discountMultiplier = totalDiscount > 0 ? (1 - totalDiscount / 100) : 1;
    const commissionMultiplier = commissionPct > 0 ? (1 - commissionPct / 100) : 1;

    const formatNumber = (n: number) => {
        return new Intl.NumberFormat('vi-VN').format(Math.round(n));
    };

    const parseNumber = (s: string) => {
        return parseFloat(s.replace(/\./g, '').replace(/,/g, '')) || 0;
    };

    // Calculate based on mode
    let netPrice: number;
    let displayPrice: number;
    let netAfterDiscount: number;
    let netRevenue: number;

    const inputValue = customInput ? parseNumber(customInput) : 0;

    if (calcMode === 'net_to_display') {
        // Giá thu về → Giá hiển thị
        netPrice = customInput ? inputValue : baseNetPrice;
        // Display = Net / (1-discount) / (1-commission)
        displayPrice = netPrice / discountMultiplier / commissionMultiplier;
        netAfterDiscount = displayPrice * discountMultiplier;
        netRevenue = netAfterDiscount * commissionMultiplier;
    } else {
        // Giá hiển thị → Giá thu về
        displayPrice = customInput ? inputValue : baseNetPrice / discountMultiplier / commissionMultiplier;
        netAfterDiscount = displayPrice * discountMultiplier;
        netRevenue = netAfterDiscount * commissionMultiplier;
        netPrice = netRevenue;
    }

    // Reset input when room changes
    useEffect(() => {
        setCustomInput('');
    }, [selectedRoomId]);

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

    return (
        <div className="bg-[#F2F4F8] border border-[#DBE1EB] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#204183] mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Tính giá - {channelName} ({commissionPct}% hoa hồng)
            </h3>

            {/* Mode Toggle */}
            <div className="flex mb-4 bg-white rounded-lg border border-[#DBE1EB] overflow-hidden">
                <button
                    onClick={() => { setCalcMode('net_to_display'); setCustomInput(''); }}
                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${calcMode === 'net_to_display'
                        ? 'bg-[#204183] text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    Thu về → Hiển thị
                </button>
                <button
                    onClick={() => { setCalcMode('display_to_net'); setCustomInput(''); }}
                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${calcMode === 'display_to_net'
                        ? 'bg-[#204183] text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    Hiển thị → Thu về
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
                    {calcMode === 'net_to_display' ? 'Nhập giá thu về mong muốn:' : 'Nhập giá hiển thị:'}
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={customInput || formatNumber(calcMode === 'net_to_display' ? baseNetPrice : baseNetPrice / discountMultiplier / commissionMultiplier)}
                        onChange={(e) => {
                            const num = parseNumber(e.target.value);
                            setCustomInput(num > 0 ? formatNumber(num) : '');
                        }}
                        placeholder={calcMode === 'net_to_display' ? 'VD: 1.000.000' : 'VD: 1.500.000'}
                        className="w-full px-3 py-2 pr-8 bg-white border border-[#DBE1EB] rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#204183]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">đ</span>
                </div>
            </div>

            {/* Price breakdown */}
            <div className="space-y-3 text-sm bg-white rounded-lg border border-[#DBE1EB] p-3">
                {calcMode === 'net_to_display' ? (
                    <>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Giá thu về mong muốn:</span>
                            <span className="font-medium text-emerald-600">{formatNumber(netPrice)}đ</span>
                        </div>
                        <div className="border-t border-[#DBE1EB] pt-2">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">+ Hoa hồng OTA ({commissionPct}%):</span>
                                <span className="font-medium text-slate-800">+{formatNumber(netAfterDiscount - netRevenue)}đ</span>
                            </div>
                        </div>
                        {totalDiscount > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">+ Khuyến mãi ({totalDiscount}%):</span>
                                <span className="font-medium text-orange-600">+{formatNumber(displayPrice - netAfterDiscount)}đ</span>
                            </div>
                        )}
                        <div className="border-t border-[#DBE1EB] pt-2">
                            <div className="flex justify-between items-center text-[#204183]">
                                <span className="font-semibold">→ Giá hiển thị:</span>
                                <span className="font-bold text-lg">{formatNumber(displayPrice)}đ</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Giá hiển thị trên OTA:</span>
                            <span className="font-medium text-[#204183]">{formatNumber(displayPrice)}đ</span>
                        </div>
                        {totalDiscount > 0 && (
                            <div className="border-t border-[#DBE1EB] pt-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">- Khuyến mãi ({totalDiscount}%):</span>
                                    <span className="font-medium text-orange-600">-{formatNumber(displayPrice - netAfterDiscount)}đ</span>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">- Hoa hồng OTA ({commissionPct}%):</span>
                            <span className="font-medium text-slate-800">-{formatNumber(netAfterDiscount - netRevenue)}đ</span>
                        </div>
                        <div className="border-t border-[#DBE1EB] pt-2">
                            <div className="flex justify-between items-center text-emerald-600">
                                <span className="font-semibold">→ Tiền thu về:</span>
                                <span className="font-bold text-lg">{formatNumber(netRevenue)}đ</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Marketing Programs Panel (AGP/AGX/SL)
function MarketingPrograms({
    boosters,
    onUpdate,
    baseCommission,
}: {
    boosters: CommissionBooster[];
    onUpdate: (boosters: CommissionBooster[]) => void;
    baseCommission: number;
}) {
    const activeBoosters = boosters.filter(b => b.enabled);
    const totalBoost = activeBoosters.reduce((sum, b) => sum + b.boostPct, 0);
    const effectiveCommission = baseCommission + totalBoost;

    // AGP: only one tier at a time
    const agpBoosters = boosters.filter(b => b.program === 'AGP');
    const activeAGP = agpBoosters.find(b => b.enabled);
    const agx = boosters.find(b => b.program === 'AGX');
    const sl = boosters.find(b => b.program === 'SL');

    const handleAGPChange = (tierId: string) => {
        onUpdate(boosters.map(b => {
            if (b.program === 'AGP') {
                return { ...b, enabled: b.id === tierId };
            }
            return b;
        }));
    };

    const handleToggle = (id: string) => {
        onUpdate(boosters.map(b => {
            if (b.id === id) {
                if (b.program === 'AGP') {
                    // Toggling off AGP: disable all tiers
                    return { ...b, enabled: false };
                }
                return { ...b, enabled: !b.enabled };
            }
            // If enabling an AGP tier, disable other AGP tiers
            if (b.program === 'AGP' && boosters.find(x => x.id === id)?.program === 'AGP') {
                return { ...b, enabled: false };
            }
            return b;
        }));
    };

    const handlePctChange = (id: string, pct: number) => {
        onUpdate(boosters.map(b =>
            b.id === id ? { ...b, boostPct: Math.min(50, Math.max(0, pct)) } : b
        ));
    };

    return (
        <div className="bg-[#E9ECF3] border border-[#DBE1EB] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-[#204183]" />
                    <span className="font-medium text-slate-800">Marketing Programs</span>
                </div>
                {totalBoost > 0 && (
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                        +{totalBoost}% commission
                    </span>
                )}
            </div>

            <div className="px-4 pb-4 space-y-3">
                {/* AGP - Dropdown tier */}
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

                {/* AGX */}
                {agx && (
                    <div className="bg-white border border-[#DBE1EB] rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-medium text-slate-800 text-sm">AGX</span>
                                <span className="text-xs text-slate-500 ml-2">Growth Express</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={agx.boostPct}
                                        onChange={(e) => handlePctChange(agx.id, parseInt(e.target.value) || 0)}
                                        disabled={!agx.enabled}
                                        className="w-12 text-right text-sm font-semibold text-[#204183] bg-slate-50 border border-[#DBE1EB] rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#204183] disabled:opacity-40"
                                    />
                                    <span className="text-sm font-semibold text-[#204183] ml-0.5">%</span>
                                </div>
                                <button
                                    onClick={() => handleToggle(agx.id)}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${agx.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${agx.enabled ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* SL */}
                {sl && (
                    <div className="bg-white border border-[#DBE1EB] rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-medium text-slate-800 text-sm">SL</span>
                                <span className="text-xs text-slate-500 ml-2">Sponsored Listing</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={sl.boostPct}
                                        onChange={(e) => handlePctChange(sl.id, parseInt(e.target.value) || 0)}
                                        disabled={!sl.enabled}
                                        className="w-12 text-right text-sm font-semibold text-[#204183] bg-slate-50 border border-[#DBE1EB] rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#204183] disabled:opacity-40"
                                    />
                                    <span className="text-sm font-semibold text-[#204183] ml-0.5">%</span>
                                </div>
                                <button
                                    onClick={() => handleToggle(sl.id)}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${sl.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${sl.enabled ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                        {sl.enabled && (
                            <p className="text-xs text-slate-400 mt-2">💡 Variable rate — nhập % theo YCS campaign setup</p>
                        )}
                    </div>
                )}

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
}: {
    campaigns: Campaign[];
    totalDiscount: number;
    commissionPct: number;
    validation: ValidationResult;
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
                            <p className="font-medium text-slate-700 mb-1">📌 Bước 3: Cộng khuyến mãi ({totalDiscount}%)</p>
                            <p className="text-slate-500">Giá trước KM ÷ (1 - {totalDiscount}%) = Giá hiển thị</p>
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
    // V01.4: Marketing program boosters (client-side state)
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
    const totalDiscount = campaigns.filter((c) => c.is_active).reduce((sum, c) => sum + c.discount_pct, 0);
    const selectedChannelData = channels.find((c) => c.id === selectedChannel);
    const commissionPct = selectedChannelData?.commission || 0; // Lấy từ tab Kênh OTA
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
                        <h2 className="font-semibold">Cộng dồn khuyến mãi</h2>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-[#204183]" />
                        </div>
                    ) : (
                        <div className="space-y-3">
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
                        </div>
                    )}

                    {/* Marketing Programs (Agoda only) */}
                    {(selectedChannelData?.code === 'agoda') && (
                        <MarketingPrograms
                            boosters={boosters}
                            onUpdate={setBoosters}
                            baseCommission={commissionPct}
                        />
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
                                Tổng giảm giá: {totalDiscount}% (Agoda tối đa 80%)
                            </span>
                        </div>
                    )}
                    {selectedChannelData?.code !== 'agoda' && (
                        <div className="px-4 py-3 rounded-lg flex items-center gap-2 bg-[#F2F4F8] border border-[#DBE1EB]">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm font-medium text-slate-700">
                                Tổng giảm giá: {totalDiscount}%
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
                        commissionPct={effectiveCommissionPct}
                        channelName={selectedChannelData?.name || 'OTA'}
                    />

                    {/* Pricing Explanation */}
                    <PricingExplanation
                        campaigns={campaigns}
                        totalDiscount={totalDiscount}
                        commissionPct={effectiveCommissionPct}
                        validation={validation}
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
