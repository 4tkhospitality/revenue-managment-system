'use client';

import { Hotel } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import type { AnalyticsRow } from './types';

// ─── D8: Supply chart color thresholds ──────────────────────
// Green  <70%  "Còn nhiều"
// Yellow 70-89% "Cần theo dõi"
// Red    ≥90%  "Compression"
// Black  100%  "Sold out"
function getOccColor(occPct: number): string {
    if (occPct >= 100) return '#1e293b';   // slate-800 — Sold out
    if (occPct >= 90) return '#f43f5e';    // rose-500 — Compression
    if (occPct >= 70) return '#f59e0b';    // amber-500 — Cần theo dõi
    return '#10b981';                       // emerald-500 — Còn nhiều
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
    const chartData = rows.slice(0, 30).map(r => {
        const occ = capacity > 0 ? Math.round((r.rooms_otb / capacity) * 100) : 0;
        return {
            date: r.stay_date.slice(5),
            otb: r.rooms_otb,
            remaining: r.remaining_supply ?? Math.max(0, capacity - r.rooms_otb),
            occ,
        };
    });

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <Hotel className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700">
                    Remaining Supply ({capacity} rooms)
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
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-800" /> Sold out
                </span>
            </div>

            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
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
                    />
                    <Bar dataKey="otb" stackId="a" name="Rooms OTB">
                        {chartData.map((entry, i) => (
                            <Cell key={i} fill={getOccColor(entry.occ)} />
                        ))}
                    </Bar>
                    <Bar dataKey="remaining" stackId="a" name="Còn trống">
                        {chartData.map((entry, i) => (
                            <Cell key={i} fill={getRemainingColor(entry.occ)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
