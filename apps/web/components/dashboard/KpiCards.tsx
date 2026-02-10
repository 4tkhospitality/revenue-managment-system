'use client';

import { ArrowUpRight, ArrowDownRight, Minus, Lightbulb, TrendingUp, TrendingDown, AlertTriangle, XCircle } from 'lucide-react';

// Number formatters for Vietnamese style
const nf0 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
const nfCurrency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

// Surface styling - consistent across all cards
const surface = "rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.06)]";

interface KpiData {
    roomsOtb: number;
    remainingSupply: number;
    avgPickupT7: number | null;  // null = insufficient history
    forecastDemand: number;
    pickupHistoryCount: number;  // need >= 2 for "computed"
    forecastSource: string;      // 'computed' | 'single' | 'fallback' | 'no_supply' | 'none'
    // V01.1: Cancellation stats
    cancelledRooms?: number;
    lostRevenue?: number;
}

interface KpiCardProps {
    title: string;
    value: string | number;
    trend?: number;
    trendLabel?: string;
    formula?: string;
}

function KpiCard({ title, value, trend, trendLabel, formula }: KpiCardProps) {
    const TrendIcon = trend === undefined || trend === 0
        ? Minus
        : trend > 0
            ? ArrowUpRight
            : ArrowDownRight;

    const trendColor = trend === undefined || trend === 0
        ? 'text-gray-400'
        : trend > 0
            ? 'text-emerald-600'
            : 'text-rose-600';

    return (
        <div className={`${surface} p-5 flex flex-col gap-2 hover:shadow-md transition-shadow`}>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {title}
            </p>
            <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                        <TrendIcon className="w-4 h-4" />
                        <span>{trendLabel || (trend > 0 ? `+${nf1.format(trend)}` : nf1.format(trend))}</span>
                    </div>
                )}
            </div>
            {/* Formula explanation */}
            {formula && (
                <p className="text-[10px] font-mono mt-1 pt-2 text-gray-400 border-t border-slate-100">
                    📐 {formula}
                </p>
            )}
        </div>
    );
}

// Insight generation based on KPI data
interface Insight {
    icon: typeof TrendingUp;
    iconColor: string;
    bgColor: string;
    borderColor: string;
    title: string;
    description: string;
    action: string;
}

function generateInsights(data: KpiData, hotelCapacity: number): Insight[] {
    const insights: Insight[] = [];
    const totalSupply = hotelCapacity * 30;
    const occupancyRate = (data.roomsOtb / totalSupply) * 100;

    // Insight 1: Pickup Analysis — distinguish "insufficient data" from "low pickup"
    if (data.pickupHistoryCount < 2) {
        // Not enough history — DON'T say "pickup low"
        insights.push({
            icon: AlertTriangle,
            iconColor: 'text-gray-500',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200',
            title: '📊 Chưa đủ dữ liệu Pickup',
            description: 'Cần ít nhất 2 lần upload dữ liệu cách nhau ≥3 ngày để tính pickup chính xác.',
            action: '💡 Upload dữ liệu thường xuyên hơn để hệ thống phân tích tốt hơn'
        });
    } else if (data.avgPickupT7 != null && data.avgPickupT7 > 5) {
        insights.push({
            icon: TrendingUp,
            iconColor: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
            title: '📈 Pickup cao = Nhu cầu đang tăng',
            description: `Trung bình +${nf1.format(data.avgPickupT7)} phòng/ngày trong 7 ngày qua. Khách đang đặt phòng nhiều.`,
            action: '💡 Gợi ý: Có thể TĂNG GIÁ để tối ưu doanh thu'
        });
    } else if (data.avgPickupT7 != null && data.avgPickupT7 < 2) {
        insights.push({
            icon: TrendingDown,
            iconColor: 'text-amber-600',
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-200',
            title: '📉 Pickup thấp = Nhu cầu đang chậm',
            description: `Chỉ +${nf1.format(data.avgPickupT7)} phòng/ngày trong 7 ngày qua. Khách đặt ít hơn bình thường.`,
            action: '💡 Gợi ý: Cân nhắc GIẢM GIÁ hoặc chạy khuyến mãi'
        });
    } else if (data.avgPickupT7 != null) {
        insights.push({
            icon: Minus,
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            title: '➡️ Pickup ổn định',
            description: `+${nf1.format(data.avgPickupT7)} phòng/ngày - mức bình thường.`,
            action: '💡 Gợi ý: Giữ nguyên giá, theo dõi thêm'
        });
    }

    // Insight 2: Supply/Demand Balance
    if (data.remainingSupply < hotelCapacity * 3) {
        insights.push({
            icon: AlertTriangle,
            iconColor: 'text-rose-600',
            bgColor: 'bg-rose-50',
            borderColor: 'border-rose-200',
            title: '🔥 Sắp hết phòng!',
            description: `Chỉ còn ${nf0.format(data.remainingSupply)} phòng trống trong 30 ngày tới (< 10% tổng cung).`,
            action: '💡 Gợi ý: TĂNG GIÁ MẠNH - cầu vượt cung'
        });
    } else if (occupancyRate > 70) {
        insights.push({
            icon: TrendingUp,
            iconColor: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
            title: '✅ Occupancy tốt',
            description: `Đã đặt ${nf1.format(occupancyRate)}% công suất 30 ngày tới.`,
            action: '💡 Gợi ý: Tối ưu giá những ngày còn trống'
        });
    } else if (occupancyRate < 40) {
        insights.push({
            icon: TrendingDown,
            iconColor: 'text-amber-600',
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-200',
            title: '⚠️ Occupancy thấp',
            description: `Mới đặt ${nf1.format(occupancyRate)}% công suất 30 ngày tới.`,
            action: '💡 Gợi ý: Cần chiến lược giá cạnh tranh hoặc marketing'
        });
    }

    // Insight 3: Forecast Analysis
    if (data.forecastDemand > data.remainingSupply * 0.8) {
        insights.push({
            icon: TrendingUp,
            iconColor: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            title: '🎯 Dự báo nhu cầu cao',
            description: `Dự kiến thêm +${nf0.format(data.forecastDemand)} phòng sẽ được đặt (≈${nf0.format(data.forecastDemand / data.remainingSupply * 100)}% phòng còn).`,
            action: '💡 Gợi ý: Thị trường đang HOT - tự tin tăng giá'
        });
    }

    return insights;
}

interface KpiCardsProps {
    data: KpiData;
    hotelCapacity: number;
}

export function KpiCards({ data, hotelCapacity }: KpiCardsProps) {
    const days = 30;
    const insights = generateInsights(data, hotelCapacity);

    return (
        <div className="space-y-4">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-4 gap-4">
                <KpiCard
                    title="Phòng đã đặt (OTB)"
                    value={nf0.format(data.roomsOtb)}
                    trend={5}
                    trendLabel="+5% MoM"
                    formula={`SUM(rooms_otb) trong ${days} ngày tới`}
                />
                <KpiCard
                    title="Còn trống"
                    value={nf0.format(data.remainingSupply)}
                    trend={data.remainingSupply < 20 ? -1 : 0}
                    trendLabel={data.remainingSupply < 20 ? 'Thấp' : ''}
                    formula={`(${hotelCapacity} × ${days}) − ${nf0.format(data.roomsOtb)} = ${nf0.format(data.remainingSupply)}`}
                />
                <KpiCard
                    title="Pickup TB (7 ngày)"
                    value={data.pickupHistoryCount >= 2 && data.avgPickupT7 != null
                        ? `+${nf1.format(data.avgPickupT7)}`
                        : 'N/A'}
                    trend={data.avgPickupT7 ?? undefined}
                    trendLabel={data.pickupHistoryCount >= 2 && data.avgPickupT7 != null && data.roomsOtb > 0
                        ? `+${nf1.format((data.avgPickupT7 / data.roomsOtb) * 100)}%`
                        : 'Chưa đủ dữ liệu'}
                    formula={data.pickupHistoryCount < 2
                        ? 'Cần ≥2 snapshots để tính'
                        : 'AVG pickup 30 ngày gần nhất'}
                />
                <KpiCard
                    title="Dự báo nhu cầu"
                    value={data.forecastSource === 'no_supply' || data.forecastSource === 'none'
                        ? '—'
                        : `+${nf0.format(data.forecastDemand)}`}
                    trend={data.forecastDemand > 0 ? data.forecastDemand : undefined}
                    trendLabel={data.forecastSource === 'fallback'
                        ? '⚠️ Ước lượng'
                        : data.forecastSource === 'single'
                            ? '⚠️ 1 điểm'
                            : 'phòng'}
                    formula={`SUM(remaining_demand) — ${data.forecastSource}`}
                />
            </div>

            {/* Cancellation Stats Row - V01.1 */}
            {(data.cancelledRooms !== undefined || data.lostRevenue !== undefined) && (
                <div className="grid grid-cols-2 gap-4">
                    <div className={`${surface} p-5 flex flex-col gap-2 hover:shadow-md transition-shadow border-l-4 border-l-red-400`}>
                        <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Phòng đã hủy (30 ngày)
                            </p>
                        </div>
                        <div className="flex items-end justify-between">
                            <p className="text-3xl font-bold text-red-600">
                                {nf0.format(data.cancelledRooms || 0)}
                            </p>
                            <span className="text-xs text-gray-400">room-nights</span>
                        </div>
                        <p className="text-[10px] font-mono mt-1 pt-2 text-gray-400 border-t border-slate-100">
                            📐 Tổng phòng bị hủy trong 30 ngày tới
                        </p>
                    </div>
                    <div className={`${surface} p-5 flex flex-col gap-2 hover:shadow-md transition-shadow border-l-4 border-l-amber-400`}>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Doanh thu mất (30 ngày)
                            </p>
                        </div>
                        <div className="flex items-end justify-between">
                            <p className="text-3xl font-bold text-amber-600">
                                {nfCurrency.format(data.lostRevenue || 0)}
                            </p>
                        </div>
                        <p className="text-[10px] font-mono mt-1 pt-2 text-gray-400 border-t border-slate-100">
                            📐 Tổng doanh thu từ booking đã hủy
                        </p>
                    </div>
                </div>
            )}

            {/* Insights Panel */}
            {insights.length > 0 && (
                <div className={`${surface} p-4`}>
                    <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        <h3 className="text-sm font-semibold text-gray-700">Phân tích & Gợi ý cho GM</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {insights.map((insight, idx) => (
                            <div
                                key={idx}
                                className={`rounded-xl p-3 ${insight.bgColor} border ${insight.borderColor}`}
                            >
                                <div className="flex items-start gap-2">
                                    <insight.icon className={`w-4 h-4 mt-0.5 ${insight.iconColor}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800">{insight.title}</p>
                                        <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                                        <p className="text-xs font-medium text-gray-700 mt-2 pt-2 border-t border-gray-200/50">
                                            {insight.action}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
