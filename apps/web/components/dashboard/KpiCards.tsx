'use client';

import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

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

interface KpiCardsProps {
    data: KpiData;
    hotelCapacity: number;
}

export function KpiCards({ data, hotelCapacity }: KpiCardsProps) {
    const days = 30;

    return (
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
    );
}
