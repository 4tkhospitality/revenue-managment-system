'use client';

import { TrendingDown, Shield } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, Line, ComposedChart,
} from 'recharts';
import type { AnalyticsRow } from './types';
import { useTranslations } from 'next-intl';

// ─── Cancel Forecast Chart ──────────────────────────────────
// Shows rooms_otb, expected_cxl (stacked), and net_remaining line

function getConfidenceColor(confidence: string | null): string {
    switch (confidence) {
        case 'high': return '#10b981';    // emerald
        case 'medium': return '#f59e0b';  // amber
        case 'low': return '#ef4444';     // red
        default: return '#94a3b8';        // slate-400
    }
}

interface CancelForecastChartProps {
    rows: AnalyticsRow[];
    capacity: number;
}

export function CancelForecastChart({ rows, capacity }: CancelForecastChartProps) {
    const t = useTranslations('analyticsTab');
    const hasCancelData = rows.some(r => r.expected_cxl != null);

    if (!hasCancelData) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-4 h-4 text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-500">
                        {t('cancelTitleEmpty')}
                    </h3>
                </div>
                <div className="flex items-center justify-center h-40 text-sm text-slate-400">
                    {t('noCancelData')}
                </div>
            </div>
        );
    }

    const chartData = rows.slice(0, 30).map(r => {
        const cxl = r.expected_cxl ?? 0;
        const stay = Math.max(0, r.rooms_otb - cxl); // rooms expected to stay
        const netRem = r.net_remaining ?? (r.remaining_supply ?? Math.max(0, capacity - r.rooms_otb));
        return {
            date: r.stay_date.slice(5),
            stay_rooms: stay,
            expected_cxl: cxl,
            net_remaining: netRem,
            raw_remaining: r.remaining_supply ?? Math.max(0, capacity - r.rooms_otb),
            confidence: r.cxl_confidence,
            rate: r.cxl_rate_used,
        };
    });

    // Summary KPIs
    const totalCxl = chartData.reduce((s, d) => s + d.expected_cxl, 0);
    const avgRate = rows.filter(r => r.cxl_rate_used != null).reduce((s, r) => s + (r.cxl_rate_used ?? 0), 0) /
        Math.max(1, rows.filter(r => r.cxl_rate_used != null).length);

    const roomsHeldLabel = t('roomsHeld');
    const expectedCxlLabel = t('expectedCxl');
    const actualEmptyLabel = t('actualEmpty');

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-slate-700">
                        {t('cancelTitle')}
                    </h3>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> {roomsHeldLabel}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> {expectedCxlLabel}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-1 bg-emerald-500 rounded" /> {actualEmptyLabel}
                    </span>
                </div>
            </div>

            {/* KPI chips */}
            <div className="flex gap-3 mb-3 text-xs">
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium">
                    {t('totalExpectedCxl', { count: totalCxl })}
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                    {t('avgRate', { rate: (avgRate * 100).toFixed(1) })}
                </span>
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
                        domain={[0, capacity]}
                        axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip
                        contentStyle={{
                            fontSize: 11,
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                        formatter={((value: any, name: any, props: any) => {
                            if (name === roomsHeldLabel) return [value, name];
                            if (name === expectedCxlLabel) {
                                const rate = props.payload?.rate;
                                return [`${value} (${rate ? (rate * 100).toFixed(1) + '%' : '—'})`, name];
                            }
                            return [value, name];
                        }) as any}
                    />
                    <Bar dataKey="stay_rooms" stackId="otb" name={roomsHeldLabel} fill="#3b82f6" />
                    <Bar dataKey="expected_cxl" stackId="otb" name={expectedCxlLabel}>
                        {chartData.map((entry, i) => (
                            <Cell key={i} fill={getConfidenceColor(entry.confidence)} opacity={0.6} />
                        ))}
                    </Bar>
                    <Line
                        type="monotone"
                        dataKey="net_remaining"
                        name={actualEmptyLabel}
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
