'use client';

import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ─── ForecastAccuracyChart ──────────────────────────────────
// Compares remaining_demand (forecast) vs actual arriving rooms
// Renders Bar for actual, Line for forecast, and MAPE KPI badge

interface ForecastRow {
    stay_date: string;
    remaining_demand: number | null;
    confidence: string | null;
    zone: string | null;
    recommended_price: number | null;
}

interface ForecastAccuracyChartProps {
    forecastRows: ForecastRow[];
    actualOtbMap?: Map<string, number>; // stay_date → actual rooms on arrival day
}

function getZoneColor(zone: string | null): string {
    switch (zone) {
        case 'SURGE': return '#ef4444';
        case 'STRONG': return '#f97316';
        case 'NORMAL': return '#3b82f6';
        case 'SOFT': return '#f59e0b';
        case 'DISTRESS': return '#94a3b8';
        default: return '#64748b';
    }
}

export function ForecastAccuracyChart({ forecastRows, actualOtbMap }: ForecastAccuracyChartProps) {
    const chartData = useMemo(() =>
        forecastRows.slice(0, 30).map(r => {
            const actualRooms = actualOtbMap?.get(r.stay_date) ?? null;
            return {
                date: r.stay_date.slice(5),
                forecast_demand: r.remaining_demand ?? 0,
                actual_rooms: actualRooms,
                confidence: r.confidence,
                zone: r.zone,
                recommended_price: r.recommended_price,
            };
        }), [forecastRows, actualOtbMap]);

    // MAPE calculation
    const { mape, comparisons } = useMemo(() => {
        const pairs = chartData.filter(d => d.actual_rooms != null && d.forecast_demand > 0);
        if (pairs.length === 0) return { mape: null, comparisons: 0 };
        const sumAbsPctError = pairs.reduce((s, d) => {
            const err = Math.abs(d.forecast_demand - (d.actual_rooms ?? 0)) / Math.max(1, d.actual_rooms ?? 1);
            return s + err;
        }, 0);
        return {
            mape: (sumAbsPctError / pairs.length * 100).toFixed(1),
            comparisons: pairs.length,
        };
    }, [chartData]);

    const hasAnyActual = chartData.some(d => d.actual_rooms != null);

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-semibold text-slate-700">
                        Dự báo Demand (30 ngày)
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    {mape != null && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${Number(mape) < 15 ? 'bg-emerald-50 text-emerald-700' :
                                Number(mape) < 30 ? 'bg-amber-50 text-amber-700' :
                                    'bg-red-50 text-red-700'
                            }`}>
                            MAPE: {mape}% ({comparisons} ngày)
                        </span>
                    )}
                </div>
            </div>

            {/* Zone distribution chips */}
            <div className="flex gap-1.5 mb-3 flex-wrap">
                {['SURGE', 'STRONG', 'NORMAL', 'SOFT', 'DISTRESS'].map(zone => {
                    const count = chartData.filter(d => d.zone === zone).length;
                    if (count === 0) return null;
                    return (
                        <span
                            key={zone}
                            className="px-2 py-0.5 rounded text-[10px] font-medium"
                            style={{
                                backgroundColor: getZoneColor(zone) + '15',
                                color: getZoneColor(zone),
                            }}
                        >
                            {zone} ({count})
                        </span>
                    );
                })}
            </div>

            <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        interval="preserveStartEnd"
                        axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip
                        contentStyle={{
                            fontSize: 11,
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: 10 }}
                        iconSize={8}
                    />
                    {hasAnyActual && (
                        <Bar
                            dataKey="actual_rooms"
                            name="Thực tế"
                            fill="#6366f1"
                            opacity={0.4}
                            barSize={16}
                        />
                    )}
                    <Line
                        type="monotone"
                        dataKey="forecast_demand"
                        name="Dự báo demand"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
