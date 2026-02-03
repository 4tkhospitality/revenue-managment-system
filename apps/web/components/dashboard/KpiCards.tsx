'use client';

import { ArrowUpRight, ArrowDownRight, Minus, Lightbulb, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

// Number formatters for Vietnamese style
const nf0 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

// Surface styling - consistent across all cards
const surface = "rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.06)]";

interface KpiData {
    roomsOtb: number;
    remainingSupply: number;
    avgPickupT7: number;
    forecastDemand: number;
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

    // Insight 1: Pickup Analysis
    if (data.avgPickupT7 > 5) {
        insights.push({
            icon: TrendingUp,
            iconColor: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
            title: '📈 Pickup cao = Nhu cầu đang tăng',
            description: `Trung bình +${nf1.format(data.avgPickupT7)} phòng/ngày trong 7 ngày qua. Khách đang đặt phòng nhiều.`,
            action: '💡 Gợi ý: Có thể TĂNG GIÁ để tối ưu doanh thu'
        });
    } else if (data.avgPickupT7 < 2) {
        insights.push({
            icon: TrendingDown,
            iconColor: 'text-amber-600',
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-200',
            title: '📉 Pickup thấp = Nhu cầu đang chậm',
            description: `Chỉ +${nf1.format(data.avgPickupT7)} phòng/ngày trong 7 ngày qua. Khách đặt ít hơn bình thường.`,
            action: '💡 Gợi ý: Cân nhắc GIẢM GIÁ hoặc chạy khuyến mãi'
        });
    } else {
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
                    value={`+${nf1.format(data.avgPickupT7)}`}
                    trend={data.avgPickupT7}
                    trendLabel={`+${nf1.format((data.avgPickupT7 / data.roomsOtb) * 100)}%`}
                    formula="AVG pickup 30 ngày gần nhất"
                />
                <KpiCard
                    title="Dự báo nhu cầu"
                    value={`+${nf0.format(data.forecastDemand)}`}
                    trend={data.forecastDemand}
                    trendLabel="phòng"
                    formula="SUM(remaining_demand)"
                />
            </div>

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
