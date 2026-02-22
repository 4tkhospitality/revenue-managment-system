'use client';

import { Hotel } from 'lucide-react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { AnalyticsRow } from './types';
import { useTranslations } from 'next-intl';

// ─── D8: Supply chart color thresholds ──────────────────────
// Green  <70%  "Available"
// Yellow 70-89% "Watch"
// Red    ≥90%  "Compression"
// Black  100%  "Sold out"
function getOccColor(occPct: number): string {
    if (occPct >= 100) return '#1e293b';   // slate-800 — Sold out
    if (occPct >= 90) return '#f43f5e';    // rose-500 — Compression
    if (occPct >= 70) return '#f59e0b';    // amber-500 — Watch
    return '#10b981';                       // emerald-500 — Available
}

function getRemainingColor(occPct: number): string {
    if (occPct >= 100) return '#475569';   // slate-600 — no remaining
    return '#e2e8f0';                       // slate-200 — available
}

export function SupplyChart({
    rows,
    capacity,
}: {
    rows: AnalyticsRow[];
    capacity: number;
}) {
    const t = useTranslations('analyticsTab');
    const chartData = rows.slice(0, 30).map(r => {
        const occ = capacity > 0 ? Math.round((r.rooms_otb / capacity) * 100) : 0;
        return {
            date: r.stay_date.slice(5),
            otb: r.rooms_otb,
            remaining: r.remaining_supply ?? Math.max(0, capacity - r.rooms_otb),
            net_remaining: r.net_remaining ?? null,
            expected_cxl: r.expected_cxl ?? null,
            occ,
        };
    });

    const hasCancelData = chartData.some(d => d.net_remaining != null);

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <Hotel className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700">
                    {t('supplyTitle', { capacity })}
                </h3>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mb-3 text-[10px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> &lt;70%
                </span>
                <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> 70-89%
                </span>
                <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> ≥90%
                </span>
                <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-800" /> {t('soldOut')}
                </span>
                {hasCancelData && (
                    <span className="inline-flex items-center gap-1">
                        <span className="w-4 h-0.5 bg-violet-500 rounded" style={{ borderTop: '2px dashed #8b5cf6' }} /> {t('actualEmpty')}
                    </span>
                )}
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
                            fontSize: 12,
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                        formatter={((value: any, name: any, props: any) => {
                            const tNetAvailable = t('netAvailable');
                            if (name === tNetAvailable && props.payload?.expected_cxl) {
                                return [`${value} ${t('cxlExpected', { cxl: props.payload.expected_cxl })}`, name];
                            }
                            return [value, name];
                        }) as any}
                    />
                    <Bar dataKey="otb" stackId="a" name={t('roomsOtb')}>
                        {chartData.map((entry, i) => (
                            <Cell key={i} fill={getOccColor(entry.occ)} />
                        ))}
                    </Bar>
                    <Bar dataKey="remaining" stackId="a" name={t('available')}>
                        {chartData.map((entry, i) => (
                            <Cell key={i} fill={getRemainingColor(entry.occ)} />
                        ))}
                    </Bar>
                    {hasCancelData && (
                        <Line
                            type="monotone"
                            dataKey="net_remaining"
                            name={t('netAvailable')}
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            connectNulls
                        />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
