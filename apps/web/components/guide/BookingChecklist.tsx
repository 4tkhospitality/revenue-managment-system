'use client';

import { useState, useEffect } from 'react';
import {
    Image, DollarSign, Calendar, Star, Zap,
    ChevronDown, ChevronRight, ExternalLink, Info,
    CheckCircle2, Circle, AlertTriangle
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Booking.com Ranking Optimization Checklist
// Source: booking.com/partner-hub + "How we work" page
// Verified: Plan v5 final (5 BA review rounds)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

const DISCLAIMERS: Record<string, { icon: React.ReactNode; text: string; color: string }> = {
    personalization: {
        icon: <Info className="w-3.5 h-3.5" />,
        text: 'Kết quả tìm kiếm Booking.com được cá nhân hóa theo lịch sử người dùng. Thứ hạng hiển thị khác nhau cho mỗi khách.',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    benchmark: {
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        text: 'Con số này là benchmark trung bình từ Booking.com Partner Hub — ước tính, không đảm bảo kết quả cho từng khách sạn.',
        color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    api_pending: {
        icon: <Info className="w-3.5 h-3.5" />,
        text: 'Booking.com hiện tạm dừng integrations mới. Tính năng API sẽ khả dụng khi có quyền truy cập.',
        color: 'text-gray-500 bg-gray-50 border-gray-200',
    },
};

const CATEGORIES: ChecklistCategory[] = [
    {
        id: 'content',
        title: '📸 Nội dung & Hình ảnh',
        icon: <Image className="w-4 h-4" />,
        color: 'text-purple-700',
        bgColor: 'bg-purple-50 border-purple-200',
        items: [
            {
                id: 'bk_photo_quality',
                title: 'Ảnh chất lượng cao (≥24 ảnh, ≥2048px)',
                description: 'Booking.com ưu tiên property có nhiều ảnh HD. Property Page Score phần "Photos" ảnh hưởng trực tiếp CTR.',
                howTo: 'Extranet → Property → Photos → Upload ảnh ≥2048px chiều rộng. Cover tất cả room types, facilities, lobby, view.',
                kpiImpact: ['CTR'],
                source: 'Booking.com Property Page Score',
                benchmark: 'Page Score 100% → tăng đến 18% bookings',
                disclaimerKey: 'benchmark',
            },
            {
                id: 'bk_description',
                title: 'Mô tả property đầy đủ & hấp dẫn',
                description: 'Mô tả chi tiết giúp khách hiểu rõ hơn → tăng conversion. Bao gồm USP, vị trí, tiện nghi nổi bật.',
                howTo: 'Extranet → Property → General Info → Cập nhật description tiếng Anh + Tiếng Việt. Nhấn mạnh điểm khác biệt.',
                kpiImpact: ['CTR', 'GROSS'],
            },
            {
                id: 'bk_facilities',
                title: 'Cập nhật đầy đủ tiện nghi (Facilities)',
                description: 'Khách filter theo tiện nghi (WiFi, Pool, Parking...). Thiếu = mất lượt hiển thị trong search results.',
                howTo: 'Extranet → Property → Facilities & Services → Tick tất cả tiện nghi có sẵn. Đặc biệt: WiFi, Parking, Pool, Breakfast.',
                kpiImpact: ['CTR'],
            },
        ],
    },
    {
        id: 'pricing',
        title: '💰 Giá & Chính sách',
        icon: <DollarSign className="w-4 h-4" />,
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50 border-emerald-200',
        items: [
            {
                id: 'bk_rate_parity',
                title: 'Đảm bảo rate parity (giá đồng nhất)',
                description: 'Booking.com penalize property có giá cao hơn các OTA khác hoặc website trực tiếp. Rate parity ảnh hưởng ranking.',
                howTo: 'So sánh giá trên Booking vs Agoda vs website. Dùng RMS Rate Shopper để monitor. Đảm bảo giá Booking ≤ giá kênh khác.',
                kpiImpact: ['CTR', 'GROSS'],
                source: 'Booking.com How We Work',
            },
            {
                id: 'bk_flexible_policy',
                title: 'Chính sách hủy linh hoạt',
                description: 'Booking.com confirmed: cancellation policy ảnh hưởng ranking. Free cancellation option tăng conversion đáng kể.',
                howTo: 'Extranet → Rates & Availability → Rate Plans → Thêm rate plan "Free Cancellation" (hủy miễn phí trước X ngày).',
                kpiImpact: ['GROSS', 'NET'],
                source: 'Booking.com How We Work §1C',
            },
            {
                id: 'bk_competitive_pricing',
                title: 'Giá cạnh tranh trong thị trường',
                description: 'Pricing là driver chính của conversion. Khách so sánh giá với các property tương tự trong khu vực.',
                howTo: 'Dùng RMS So sánh giá để xem vị trí giá. Điều chỉnh giá theo demand (RMS Dashboard khuyến nghị).',
                kpiImpact: ['CTR', 'GROSS'],
            },
        ],
    },
    {
        id: 'availability',
        title: '📅 Tính khả dụng',
        icon: <Calendar className="w-4 h-4" />,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50 border-blue-200',
        items: [
            {
                id: 'bk_availability_window',
                title: 'Mở bán ≥12 tháng tới',
                description: 'Booking.com ưu tiên property có availability dài hạn. Khách book sớm sẽ thấy property của bạn trong kết quả.',
                howTo: 'Extranet → Rates & Availability → Calendar → Mở availability ít nhất 12 tháng tới. Close dates chỉ khi thật sự full.',
                kpiImpact: ['CTR'],
                source: 'Booking.com How We Work §1B',
            },
            {
                id: 'bk_last_minute',
                title: 'Giữ phòng cho last-minute bookings',
                description: 'Đừng close hết inventory khi còn 1-2 ngày. Last-minute travelers là phân khúc có sẵn demand.',
                howTo: 'Giữ tối thiểu 1-2 room types mở cho booking trong 48h tới nếu còn phòng trống.',
                kpiImpact: ['GROSS'],
            },
        ],
    },
    {
        id: 'reputation',
        title: '⭐ Đánh giá & Uy tín',
        icon: <Star className="w-4 h-4" />,
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50 border-yellow-200',
        items: [
            {
                id: 'bk_review_score',
                title: 'Duy trì Review Score ≥8.0',
                description: 'Review score là driver mạnh cho cả CTR và conversion. Booking.com dùng hệ thống tính điểm có trọng số — đánh giá mới ảnh hưởng nhiều hơn.',
                howTo: 'Extranet → Guest Reviews → Trả lời 100% reviews. Cải thiện dịch vụ dựa trên feedback. Dùng RMS Review Calculator để mô phỏng.',
                kpiImpact: ['CTR', 'GROSS'],
                source: 'Booking.com How We Work',
            },
            {
                id: 'bk_reply_reviews',
                title: 'Trả lời 100% đánh giá (đặc biệt negative)',
                description: 'Reply Score là thành phần của Property Page Score. Trả lời chuyên nghiệp cho đánh giá tiêu cực tăng uy tín.',
                howTo: 'Extranet → Guest Reviews → Reply to ALL reviews trong 24-48h. Negative reviews: cảm ơn + giải pháp cụ thể.',
                kpiImpact: ['CTR', 'GROSS'],
                source: 'Booking.com Property Scores API',
            },
        ],
    },
    {
        id: 'programs',
        title: '🚀 Chương trình Booking.com',
        icon: <Zap className="w-4 h-4" />,
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-50 border-indigo-200',
        items: [
            {
                id: 'bk_genius',
                title: 'Tham gia Genius Program',
                description: 'Genius giúp property hiện lên cho nhóm khách "Genius travelers" — chiếm phần lớn bookings trên Booking.com.',
                howTo: 'Extranet → Opportunities → Genius → Đăng ký. Level 1: Giảm ≥10% cho Genius members. Level 2-3: thêm perks (breakfast, upgrade).',
                kpiImpact: ['CTR', 'GROSS'],
                source: 'Booking.com Partner Hub',
                benchmark: '~70% search result views on average (Genius travelers)',
                disclaimerKey: 'benchmark',
            },
            {
                id: 'bk_preferred',
                title: 'Đạt trạng thái Preferred Partner',
                description: 'Preferred Partner được hiển thị badge thumbs-up và ưu tiên trong ranking. Yêu cầu: performance tốt + thêm commission.',
                howTo: 'Extranet → Opportunities → Preferred Partner Programme → Đăng ký nếu đủ điều kiện (review score, conversion rate...).',
                kpiImpact: ['CTR', 'GROSS'],
                source: 'Booking.com How We Work',
                benchmark: '~65% search views, ~20% more bookings on average',
                disclaimerKey: 'benchmark',
            },
            {
                id: 'bk_visibility_booster',
                title: 'Sử dụng Visibility Booster (lúc low demand)',
                description: 'Visibility Booster tăng commission tạm thời để đổi lấy thứ hạng cao hơn. Hiển thị là "Ad" (quảng cáo trả phí).',
                howTo: 'Extranet → Opportunities → Visibility Booster → Bật cho các ngày cần đẩy (low season, gap dates). Set commission boost %.',
                kpiImpact: ['CTR', 'GROSS'],
                source: 'Booking.com How We Work',
            },
            {
                id: 'bk_mobile_rate',
                title: 'Offer Mobile Rate',
                description: 'Giảm giá riêng cho khách book qua app Booking.com. Mobile bookings chiếm phần lớn traffic.',
                howTo: 'Extranet → Rates & Availability → Mobile Rates → Bật giảm giá ≥10% cho mobile users.',
                kpiImpact: ['CTR', 'GROSS'],
            },
        ],
    },
];

export function BookingChecklist() {
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
            {/* Personalization Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-blue-700">
                    <strong>Lưu ý về Ranking:</strong> Kết quả tìm kiếm Booking.com được <strong>cá nhân hóa</strong> theo lịch sử mỗi khách.
                    Không có thứ hạng cố định — hãy theo dõi <strong>outcome metrics</strong> (Search Views, CTR, Conversion, Net Bookings) thay vì position.
                    <span className="block mt-1 text-blue-500 text-xs">
                        Nguồn: Booking.com &quot;How we work&quot; §1E
                    </span>
                </div>
            </div>

            {/* Ranking Funnel */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Ranking Funnel (Booking.com)</h4>
                <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-medium">
                        Search Views → <strong>CTR</strong>
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="px-2.5 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-medium">
                        Page Views → <strong>Gross Bookings</strong>
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="px-2.5 py-1.5 bg-purple-100 text-purple-700 rounded-lg font-medium">
                        Confirmed → <strong>Net Bookings</strong>
                    </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Booking.com xếp hạng dựa trên 3 trụ cột: CTR, Gross Bookings, và Net Bookings.
                    Mỗi item trong checklist cho biết nó ảnh hưởng phần nào của funnel.
                </p>
            </div>

            {/* Progress Bar */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Tiến độ thực hiện</span>
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
                                                    <strong>📌 Cách làm:</strong> {item.howTo}
                                                </div>

                                                {/* Benchmark */}
                                                {item.benchmark && (
                                                    <div className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3 shrink-0" />
                                                        <span>Benchmark: {item.benchmark}</span>
                                                    </div>
                                                )}

                                                {/* Source */}
                                                {item.source && (
                                                    <div className="mt-1 text-[10px] text-gray-400 flex items-center gap-1">
                                                        <ExternalLink className="w-3 h-3" />
                                                        <span>Nguồn: {item.source}</span>
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
                    <strong>Về &quot;Ad&quot; label:</strong> Một số kết quả tìm kiếm trên Booking.com có gắn nhãn &quot;Ad&quot; — đây là <strong>quảng cáo trả phí</strong> (Visibility Booster).
                    Nếu thấy đối thủ nổi bất thường, có thể họ đang dùng paid placement.
                    <span className="block mt-1 text-gray-400 text-xs">
                        Nguồn: Booking.com &quot;How we work&quot; — Paid placements are labeled.
                    </span>
                </div>
            </div>
        </div>
    );
}
