'use client';

import { ArrowUpDown, Flame, AlertTriangle, BedDouble, TrendingUp, TrendingDown, BarChart3, DollarSign, Info } from 'lucide-react';
import type { AnalyticsKpi, ViewMode } from './types';
import { formatRevenue } from './types';

// ── Compact KPI Strip ────────────────────────────────
// One thin horizontal bar: metric chips + DOD inline
// ~48px total height instead of ~120px with cards

function KpiChip({ label, value, color, icon: Icon }: {
    label: string;
    value: string;
    color: string;
    icon?: React.ElementType;
}) {
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1">
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />}
            <span className="text-[11px] text-slate-400 whitespace-nowrap">{label}</span>
            <span className="text-sm font-bold tabular-nums whitespace-nowrap" style={{ color }}>
                {value}
            </span>
        </div>
    );
}

export function AnalyticsKpiRow({
    kpi,
    viewMode,
    avgAdr,
}: {
    kpi: AnalyticsKpi;
    viewMode: ViewMode;
    avgAdr: number | null;
}) {
    const occColor = (v: number) => v > 80 ? '#10b981' : v > 60 ? '#f59e0b' : '#ef4444';
    const paceColor = (v: number | null) => v != null ? (v >= 0 ? '#10b981' : '#ef4444') : '#94a3b8';

    const formatPace = (v: number | null) => {
        if (v == null) return '—';
        const prefix = v > 0 ? '+' : '';
        return viewMode === 'revenue' ? `${prefix}${formatRevenue(v)}` : `${prefix}${v}`;
    };

    // DOD data
    const hasDOD = kpi.netPickupDOD !== null;
    const dodVal = kpi.netPickupDOD ?? 0;
    const topDay = kpi.topChangeDay;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex flex-wrap items-center divide-x divide-slate-100">
                {/* Core KPIs */}
                <KpiChip label="Occ 7d" value={`${kpi.occ7}%`} color={occColor(kpi.occ7)} icon={BedDouble} />
                <KpiChip label="Occ 14d" value={`${kpi.occ14}%`} color={occColor(kpi.occ14)} icon={BedDouble} />
                <KpiChip label="Occ 30d" value={`${kpi.occ30}%`} color={occColor(kpi.occ30)} icon={BedDouble} />

                {/* Divider accent */}
                <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1" />

                <KpiChip
                    label="Pace 7d"
                    value={formatPace(kpi.pace7)}
                    color={paceColor(kpi.pace7)}
                    icon={kpi.pace7 != null && kpi.pace7 >= 0 ? TrendingUp : TrendingDown}
                />
                <KpiChip
                    label="Pace 30d"
                    value={formatPace(kpi.pace30)}
                    color={paceColor(kpi.pace30)}
                    icon={kpi.pace30 != null && kpi.pace30 >= 0 ? TrendingUp : TrendingDown}
                />
                <KpiChip
                    label="Pickup 7d"
                    value={`${kpi.totalPickup7d > 0 ? '+' : ''}${kpi.totalPickup7d}`}
                    color={kpi.totalPickup7d >= 0 ? '#10b981' : '#ef4444'}
                    icon={BarChart3}
                />
                <KpiChip
                    label="ADR"
                    value={avgAdr != null ? formatRevenue(avgAdr) : 'N/A'}
                    color={avgAdr != null ? '#3b82f6' : '#94a3b8'}
                    icon={DollarSign}
                />

                {/* ── DOD inline ── */}
                <div className="hidden lg:block w-px h-6 bg-slate-300 mx-1" />

                <div className={`flex items-center gap-1 px-2.5 py-1 text-xs ${!hasDOD
                    ? 'text-slate-400'
                    : dodVal > 0
                        ? 'text-emerald-600'
                        : dodVal < 0
                            ? 'text-rose-600'
                            : 'text-slate-500'
                    }`}>
                    <ArrowUpDown className="w-3 h-3 shrink-0" />
                    <span className="whitespace-nowrap">vs qua:</span>
                    {hasDOD ? (
                        <span className="font-bold tabular-nums whitespace-nowrap">
                            {dodVal > 0 ? '+' : ''}{viewMode === 'revenue' ? formatRevenue(dodVal) : dodVal}
                            {viewMode === 'rooms' ? ' rms' : ''}
                        </span>
                    ) : (
                        <span className="italic">—</span>
                    )}
                </div>

                {/* Top change day */}
                {topDay && topDay.delta !== 0 && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 text-xs ${topDay.delta > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                        {topDay.delta > 0
                            ? <Flame className="w-3 h-3 shrink-0" />
                            : <AlertTriangle className="w-3 h-3 shrink-0" />
                        }
                        <span className="font-bold tabular-nums whitespace-nowrap">
                            {topDay.stay_date.slice(5)} ({topDay.delta > 0 ? '+' : ''}{viewMode === 'revenue' ? formatRevenue(topDay.delta) : topDay.delta})
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
