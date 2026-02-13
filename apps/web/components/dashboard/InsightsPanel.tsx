'use client';

import { Lightbulb, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

// Number formatters
const nf0 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

// Surface styling
const surface = "rounded-[var(--card-radius)] bg-white border border-slate-200/80 shadow-[var(--shadow-card)]";

// ── Types ──────────────────────────────────────────────────────────
interface KpiData {
    roomsOtb: number;
    remainingSupply: number;
    avgPickupT7: number | null;
    forecastDemand: number;
    pickupHistoryCount: number;
    forecastSource: string;
    cancelledRooms?: number;
    lostRevenue?: number;
}

interface Insight {
    icon: typeof TrendingUp;
    iconColor: string;
    borderColor: string;
    title: string;
    description: string;
    action: string;
}

// ── Insight Generator ──────────────────────────────────────────────
function generateInsights(data: KpiData, hotelCapacity: number): Insight[] {
    const insights: Insight[] = [];
    const totalSupply = hotelCapacity * 30;
    const occupancyRate = (data.roomsOtb / totalSupply) * 100;

    // Insight 1: Pickup Analysis
    if (data.pickupHistoryCount < 2) {
        insights.push({
            icon: AlertTriangle,
            iconColor: 'text-slate-500',
            borderColor: 'border-l-slate-300',
            title: 'Chưa đủ dữ liệu Pickup',
            description: 'Cần ≥2 lần upload cách nhau ≥3 ngày.',
            action: 'Upload dữ liệu thường xuyên hơn'
        });
    } else if (data.avgPickupT7 != null && data.avgPickupT7 > 5) {
        insights.push({
            icon: TrendingUp,
            iconColor: 'text-emerald-600',
            borderColor: 'border-l-emerald-500',
            title: 'Pickup cao — Nhu cầu tăng',
            description: `+${nf1.format(data.avgPickupT7)} phòng/ngày trong 7 ngày qua.`,
            action: 'Cân nhắc tăng giá để tối ưu doanh thu'
        });
    } else if (data.avgPickupT7 != null && data.avgPickupT7 < 2) {
        insights.push({
            icon: TrendingDown,
            iconColor: 'text-amber-600',
            borderColor: 'border-l-amber-500',
            title: 'Pickup thấp — Nhu cầu chậm',
            description: `Chỉ +${nf1.format(data.avgPickupT7)} phòng/ngày.`,
            action: 'Cân nhắc giảm giá hoặc khuyến mãi'
        });
    } else if (data.avgPickupT7 != null) {
        insights.push({
            icon: Minus,
            iconColor: 'text-blue-600',
            borderColor: 'border-l-blue-500',
            title: 'Pickup ổn định',
            description: `+${nf1.format(data.avgPickupT7)} phòng/ngày — mức bình thường.`,
            action: 'Giữ nguyên giá, theo dõi thêm'
        });
    }

    // Insight 2: Supply/Demand Balance
    if (data.remainingSupply < hotelCapacity * 3) {
        insights.push({
            icon: AlertTriangle,
            iconColor: 'text-rose-600',
            borderColor: 'border-l-rose-500',
            title: 'Sắp hết phòng!',
            description: `Còn ${nf0.format(data.remainingSupply)} phòng trống (<10% tổng cung).`,
            action: 'Tăng giá mạnh — cầu vượt cung'
        });
    } else if (occupancyRate > 70) {
        insights.push({
            icon: TrendingUp,
            iconColor: 'text-emerald-600',
            borderColor: 'border-l-emerald-500',
            title: `Occupancy ${nf1.format(occupancyRate)}%`,
            description: `Đã đặt ${nf1.format(occupancyRate)}% công suất 30 ngày tới.`,
            action: 'Tối ưu giá những ngày còn trống'
        });
    } else if (occupancyRate < 40) {
        insights.push({
            icon: TrendingDown,
            iconColor: 'text-amber-600',
            borderColor: 'border-l-amber-500',
            title: 'Occupancy thấp',
            description: `Mới đặt ${nf1.format(occupancyRate)}% công suất 30 ngày tới.`,
            action: 'Cần chiến lược giá cạnh tranh'
        });
    }

    // Insight 3: Forecast Analysis
    if (data.forecastDemand > data.remainingSupply * 0.8) {
        insights.push({
            icon: TrendingUp,
            iconColor: 'text-blue-600',
            borderColor: 'border-l-blue-500',
            title: 'Dự báo nhu cầu cao',
            description: `Dự kiến thêm +${nf0.format(data.forecastDemand)} phòng sẽ được đặt.`,
            action: 'Thị trường đang HOT — tự tin tăng giá'
        });
    }

    return insights;
}

// ── Component ──────────────────────────────────────────────────────
interface InsightsPanelProps {
    data: KpiData;
    hotelCapacity: number;
}

export function InsightsPanel({ data, hotelCapacity }: InsightsPanelProps) {
    const insights = generateInsights(data, hotelCapacity);

    if (insights.length === 0) return null;

    return (
        <div className={`${surface} p-4 h-full`}>
            <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-500" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-slate-700">Phân tích & Gợi ý</h3>
            </div>
            <div className="space-y-3">
                {insights.map((insight, idx) => (
                    <div
                        key={idx}
                        className={`rounded-lg p-3 bg-white border border-slate-200/80 border-l-4 ${insight.borderColor}`}
                    >
                        <div className="flex items-start gap-2">
                            <insight.icon className={`w-4 h-4 mt-0.5 shrink-0 ${insight.iconColor}`} aria-hidden="true" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800">{insight.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{insight.description}</p>
                                <p className="text-xs font-medium text-slate-600 mt-1.5 pt-1.5 border-t border-slate-100">
                                    {insight.action}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
