'use client';

import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KpiData {
    roomsOtb: number;
    remainingSupply: number;
    avgPickupT7: number;
    forecastDemand: number;
}

interface KpiCardProps {
    title: string;
    value: string | number;
    trend?: number; // positive = up, negative = down, 0 = neutral
    trendLabel?: string;
    formula?: string; // Formula explanation for debugging
}

function KpiCard({ title, value, trend, trendLabel, formula }: KpiCardProps) {
    const TrendIcon = trend === undefined || trend === 0
        ? Minus
        : trend > 0
            ? ArrowUpRight
            : ArrowDownRight;

    const trendColor = trend === undefined || trend === 0
        ? 'text-slate-400'
        : trend > 0
            ? 'text-emerald-500'
            : 'text-rose-500';

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col gap-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                {title}
            </p>
            <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-slate-50">{value}</p>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                        <TrendIcon className="w-4 h-4" />
                        <span>{trendLabel || (trend > 0 ? `+${trend}` : trend)}</span>
                    </div>
                )}
            </div>
            {/* Formula explanation - for debugging, remove later */}
            {formula && (
                <p className="text-[10px] text-slate-500 font-mono mt-1 border-t border-slate-800 pt-2">
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
                title="Rooms OTB"
                value={data.roomsOtb}
                trend={5}
                trendLabel="+5% MoM"
                formula={`SUM(rooms_otb) trong ${days} ngày tới`}
            />
            <KpiCard
                title="Remaining Supply"
                value={data.remainingSupply}
                trend={data.remainingSupply < 20 ? -1 : 0}
                trendLabel={data.remainingSupply < 20 ? 'Low' : ''}
                formula={`(${hotelCapacity} phòng × ${days} ngày) − ${data.roomsOtb} OTB = ${hotelCapacity * days} − ${data.roomsOtb}`}
            />
            <KpiCard
                title="Avg Pickup T7"
                value={`+${data.avgPickupT7.toFixed(1)}`}
                trend={data.avgPickupT7}
                formula="AVG(pickup_t7) từ features_daily (30 ngày gần nhất)"
            />
            <KpiCard
                title="Forecast Demand"
                value={`+${data.forecastDemand}`}
                trend={data.forecastDemand}
                trendLabel="rooms"
                formula={`SUM(remaining_demand) từ demand_forecast`}
            />
        </div>
    );
}
