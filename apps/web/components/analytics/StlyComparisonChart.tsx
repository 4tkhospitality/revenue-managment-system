'use client';

import { TrendingUp } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { AnalyticsRow, ViewMode } from './types';

export function StlyComparisonChart({
    rows,
    capacity,
    viewMode,
}: {
    rows: AnalyticsRow[];
    capacity: number;
    viewMode: ViewMode;
}) {
    const chartData = rows.slice(0, 60).map(r => {
        const currentVal = viewMode === 'rooms'
            ? r.rooms_otb
            : Math.round(r.revenue_otb / 1_000_000);

        const stlyVal = viewMode === 'rooms'
            ? r.stly_rooms_otb
            : (r.stly_revenue_otb ? Math.round(r.stly_revenue_otb / 1_000_000) : null);

        return {
            date: r.stay_date.slice(5),
            current: currentVal,
            stly: stlyVal,
            isWeekend: r.is_weekend,
            isApprox: r.stly_is_approx,
        };
    });

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700">
                    OTB vs STLY (60d) — {viewMode === 'rooms' ? 'Rooms' : 'Revenue (M)'}
                </h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
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
                            fontSize: 12,
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                    />
                    <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
                    <Line
                        type="monotone"
                        dataKey="current"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        name="This Year"
                        activeDot={{ r: 4, fill: '#3b82f6' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="stly"
                        stroke="#94a3b8"
                        strokeWidth={1.5}
                        strokeDasharray="5 3"
                        dot={false}
                        name="Last Year"
                        connectNulls={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
