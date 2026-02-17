'use client';

import { ArrowUpRight, ArrowDownRight, Minus, XCircle } from 'lucide-react';

// Number formatters for Vietnamese style
const nf0 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
const nfCurrency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

// Surface styling - consistent across all cards
const surface = "rounded-[var(--card-radius)] bg-white border border-slate-200/80 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200";

export interface KpiData {
    roomsOtb: number;
    remainingSupply: number;
    avgPickupT7: number | null;
    forecastDemand: number;
    pickupHistoryCount: number;
    forecastSource: string;
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
        <div className={`${surface} p-5 flex flex-col gap-2`}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {title}
            </p>
            <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-slate-900">{value}</p>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                        <TrendIcon className="w-4 h-4" aria-hidden="true" />
                        <span>{trendLabel || (trend > 0 ? `+${nf1.format(trend)}` : nf1.format(trend))}</span>
                    </div>
                )}
            </div>
            {formula && (
                <p className="text-[10px] font-[family-name:var(--font-mono)] mt-1 pt-2 text-slate-400 border-t border-slate-100">
                    {formula}
                </p>
            )}
        </div>
    );
}

interface KpiCardsProps {
    data: KpiData;
    hotelCapacity: number;
}

export function KpiCards({ data, hotelCapacity }: KpiCardsProps) {
    const days = 30;
    const hasCancellation = data.cancelledRooms !== undefined || data.lostRevenue !== undefined;
    const totalCapacity = hotelCapacity * days;
    const soldPct = totalCapacity > 0 ? (data.roomsOtb / totalCapacity) * 100 : 0;

    return (
        <div className={`grid gap-4 ${hasCancellation ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-2 lg:grid-cols-4'}`}>
            <KpiCard
                title="Phòng đã đặt (OTB)"
                value={nf0.format(data.roomsOtb)}
                trend={5}
                trendLabel="+5% MoM"
                formula={`SUM(rooms_otb) trong ${days} ngày tới`}
            />
            <KpiCard
                title="Còn trống"
                value={nf0.format(Math.max(0, data.remainingSupply))}
                trend={data.remainingSupply <= 0 ? -1 : soldPct > 80 ? 1 : 0}
                trendLabel={data.remainingSupply <= 0 ? 'Full / Vượt' : `${nf1.format(soldPct)}% đã bán`}
                formula={data.remainingSupply < 0
                    ? `⚠️ OTB vượt capacity (${hotelCapacity} × ${days} = ${nf0.format(totalCapacity)})`
                    : `(${hotelCapacity} × ${days}) − ${nf0.format(data.roomsOtb)}`}
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
                    ? 'Ước lượng'
                    : data.forecastSource === 'single'
                        ? '1 điểm'
                        : 'phòng'}
                formula={`SUM(remaining_demand) — ${data.forecastSource}`}
            />

            {/* Card 5: Cancellation dual-stat — merged from separate row */}
            {hasCancellation && (
                <div className={`${surface} p-5 flex flex-col gap-2 col-span-2 lg:col-span-1 overflow-hidden`}>
                    <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" aria-hidden="true" />
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Hủy / Mất (30d)
                        </p>
                    </div>
                    <div className="flex items-end gap-3 min-w-0">
                        <div className="flex-shrink-0">
                            <p className="text-2xl font-bold text-rose-600">
                                {nf0.format(data.cancelledRooms || 0)}
                            </p>
                            <p className="text-[10px] text-slate-400">RN hủy</p>
                        </div>
                        <div className="border-l border-slate-200 pl-3 min-w-0">
                            <p className="text-sm font-bold text-slate-700 truncate" title={nfCurrency.format(data.lostRevenue || 0)}>
                                {nfCurrency.format(data.lostRevenue || 0)}
                            </p>
                            <p className="text-[10px] text-slate-400">doanh thu mất</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
