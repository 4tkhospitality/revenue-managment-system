'use client';

import { useState, useEffect } from 'react';
import {
    Image, DollarSign, Star, Zap,
    ChevronDown, ChevronRight, ExternalLink, Info,
    CheckCircle2, Circle, AlertTriangle
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Agoda Ranking Optimization Checklist
// Source: Agoda Partner Hub (YCS)
// Note: Partner Hub returned 403 — data from BA review
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

const DISCLAIMERS: Record<string, { icon: React.ReactNode; text: string; color: string }> = {
    partner_hub: {
        icon: <Info className="w-3.5 h-3.5" />,
        text: 'Dữ liệu từ Agoda Partner Hub (YCS). Trang gốc trả về 403 — thông tin do BA cung cấp và cross-check với nội dung public.',
        color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    benchmark: {
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        text: 'Con số này là benchmark trung bình — ước tính, không đảm bảo kết quả cho từng khách sạn.',
        color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    agp_commitment: {
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        text: 'AGP yêu cầu tham gia tối thiểu 90 ngày (mandatory). Cân nhắc kỹ trước khi đăng ký.',
        color: 'text-red-600 bg-red-50 border-red-200',
    },
};

const CATEGORIES: ChecklistCategory[] = [
    {
        id: 'content_score',
        title: '📸 Content Score (Điểm nội dung)',
        color: 'text-purple-700',
        bgColor: 'bg-purple-50 border-purple-200',
        items: [
            {
                id: 'ag_property_photos',
                title: 'Ảnh property chất lượng cao (45% trọng số)',
                description: 'Property Photos chiếm 45% Content Score. Upload ảnh HD cho lobby, facilities, exterior, pool, restaurant.',
                howTo: 'YCS → Property → Photos → Upload ≥20 ảnh property (không phải room). Đảm bảo cover: lobby, pool, restaurant, exterior, amenities.',
                kpiImpact: ['Content Score', 'CTR'],
                source: 'Agoda Partner Hub',
                benchmark: 'Content Score ↑ → visibility tăng tương ứng',
                disclaimerKey: 'partner_hub',
            },
            {
                id: 'ag_room_photos',
                title: 'Ảnh phòng cho mỗi room type (25% trọng số)',
                description: 'Room Photos chiếm 25% Content Score. Mỗi room type cần ≥5 ảnh riêng (giường, phòng tắm, view, tiện nghi).',
                howTo: 'YCS → Rooms → Từng room type → Photos → Upload ≥5 ảnh/room type. Chụp góc rộng, ánh sáng tự nhiên.',
                kpiImpact: ['Content Score', 'Conversion'],
                source: 'Agoda Partner Hub',
                disclaimerKey: 'partner_hub',
            },
            {
                id: 'ag_description_translation',
                title: 'Mô tả & Translation (20% trọng số)',
                description: 'Description chiếm 20% Content Score. Mô tả chi tiết bằng tiếng Anh — Agoda tự dịch sang các ngôn ngữ khác.',
                howTo: 'YCS → Property → Description → Viết mô tả ≥200 từ tiếng Anh. Nhấn mạnh USP, vị trí, trải nghiệm đặc biệt.',
                kpiImpact: ['Content Score'],
                source: 'Agoda Partner Hub',
                disclaimerKey: 'partner_hub',
            },
            {
                id: 'ag_facilities_amenities',
                title: 'Tiện nghi đầy đủ (10% trọng số)',
                description: 'Facilities/Amenities chiếm 10% Content Score. Tick đầy đủ tất cả tiện nghi có sẵn trong property.',
                howTo: 'YCS → Property → Facilities → Tick tất cả. Đặc biệt: WiFi, Parking, Pool, Gym, Spa, Airport Transfer.',
                kpiImpact: ['Content Score'],
                source: 'Agoda Partner Hub',
                disclaimerKey: 'partner_hub',
            },
        ],
    },
    {
        id: 'reviews',
        title: '⭐ Đánh giá khách hàng',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50 border-yellow-200',
        items: [
            {
                id: 'ag_review_score',
                title: 'Duy trì Review Score ≥8.0',
                description: 'Agoda review score = trung bình cộng × 2 (thang 10). Mỗi review có trọng số như nhau (khác Booking.com).',
                howTo: 'YCS → Reviews → Trả lời tất cả reviews. Focus cải thiện: Cleanliness, Location, Staff, Value for Money.',
                kpiImpact: ['Conversion', 'CTR'],
                source: 'Agoda Partner Hub',
            },
            {
                id: 'ag_reply_rate',
                title: 'Trả lời ≥80% đánh giá',
                description: 'Tỷ lệ trả lời review ảnh hưởng ranking. Trả lời nhanh (24-48h) và chuyên nghiệp.',
                howTo: 'YCS → Reviews → Reply ALL. Negative: cảm ơn + xin lỗi + action plan cụ thể. Positive: cảm ơn + mời quay lại.',
                kpiImpact: ['Conversion'],
            },
        ],
    },
    {
        id: 'rates',
        title: '💰 Giá & Tính khả dụng',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50 border-emerald-200',
        items: [
            {
                id: 'ag_rate_competitiveness',
                title: 'Giá cạnh tranh (Rate Intelligence)',
                description: 'Agoda so sánh giá với các OTA khác. Rate parity violation = ranking bị penalize.',
                howTo: 'YCS → Rate Intelligence → Kiểm tra daily. Đảm bảo giá Agoda ≤ giá kênh khác. Dùng RMS So sánh giá.',
                kpiImpact: ['Conversion', 'CTR'],
            },
            {
                id: 'ag_availability',
                title: 'Mở bán ≥12 tháng & đủ room types',
                description: 'Availability window dài + đủ room types = hiển thị trong nhiều search results hơn.',
                howTo: 'YCS → Rates & Availability → Calendar → Mở ít nhất 12 tháng. Đảm bảo tất cả room types đều có rate plan active.',
                kpiImpact: ['CTR'],
            },
        ],
    },
    {
        id: 'programs',
        title: '🚀 Chương trình Agoda',
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-50 border-indigo-200',
        items: [
            {
                id: 'ag_agp',
                title: 'Agoda Growth Program (AGP)',
                description: 'AGP tăng commission để đổi lấy visibility cao hơn. ROI = revenue from departed bookings / program cost.',
                howTo: 'YCS → Programs → AGP → Đăng ký. Set mức commission boost. Monitor ROI qua YCS dashboard hoặc RMS ROI Engine.',
                kpiImpact: ['CTR', 'Conversion'],
                source: 'Agoda Partner Hub',
                benchmark: 'ROI tính trên departed bookings / departed room nights',
                disclaimerKey: 'agp_commitment',
            },
            {
                id: 'ag_sponsored',
                title: 'Sponsored Listing',
                description: 'Quảng cáo trả phí trên kết quả tìm kiếm Agoda. Pay-per-click model.',
                howTo: 'YCS → Programs → Sponsored Listing → Set budget hàng ngày + bid. Bắt đầu nhỏ, monitor ROI.',
                kpiImpact: ['CTR'],
                source: 'Agoda Partner Hub',
                disclaimerKey: 'benchmark',
            },
        ],
    },
];

export function AgodaChecklist() {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
        Object.fromEntries(CATEGORIES.map(c => [c.id, true]))
    );

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
                <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Content Score Breakdown (Agoda)</h4>
                <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="text-lg font-bold text-purple-600">45%</div>
                        <div className="text-purple-700 font-medium">Ảnh Property</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="text-lg font-bold text-blue-600">25%</div>
                        <div className="text-blue-700 font-medium">Ảnh Room</div>
                    </div>
                    <div className="text-center p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                        <div className="text-lg font-bold text-emerald-600">20%</div>
                        <div className="text-emerald-700 font-medium">Mô tả</div>
                    </div>
                    <div className="text-center p-2 bg-amber-50 rounded-lg border border-amber-100">
                        <div className="text-lg font-bold text-amber-600">10%</div>
                        <div className="text-amber-700 font-medium">Tiện nghi</div>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Dữ liệu từ Agoda Partner Hub (BA-verified). Trang gốc trả về 403.
                </p>
            </div>

            {/* Progress Bar */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Tiến độ thực hiện</span>
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
                                                    <strong>📌 Cách làm:</strong> {item.howTo}
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
                                                        <span>Nguồn: {item.source}</span>
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
