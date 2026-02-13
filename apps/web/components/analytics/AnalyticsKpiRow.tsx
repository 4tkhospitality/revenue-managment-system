'use client';

import { useState } from 'react';
import { Info, TrendingUp, TrendingDown, BarChart3, BedDouble, DollarSign } from 'lucide-react';
import type { AnalyticsKpi, ViewMode } from './types';
import { KPI_TOOLTIPS, formatRevenue } from './types';

// ─── KPI Card ───────────────────────────────────────────────
function KpiCard({ label, value, color, icon: Icon }: {
    label: string;
    value: string;
    color: string;
    icon?: React.ElementType;
}) {
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipText = KPI_TOOLTIPS[label];

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm relative group hover:shadow-md transition-shadow">
            <div className="flex items-center gap-1.5 mb-1.5">
                {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
                <span className="text-xs text-slate-500 font-medium">{label}</span>
                {tooltipText && (
                    <button
                        onClick={() => setShowTooltip(!showTooltip)}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className="text-slate-300 hover:text-blue-500 transition-colors ml-auto"
                        aria-label={`Info about ${label}`}
                    >
                        <Info className="w-3 h-3" />
                    </button>
                )}
            </div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color }}>
                {value}
            </div>
            {showTooltip && tooltipText && (
                <div className="absolute z-50 bottom-full left-0 mb-2 w-64 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-pre-line pointer-events-none">
                    {tooltipText}
                    <div className="absolute top-full left-4 w-2 h-2 bg-slate-800 rotate-45 -mt-1" />
                </div>
            )}
        </div>
    );
}

// ─── Main KPI Row ───────────────────────────────────────────
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

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-3">
            <KpiCard
                label="Occ 7d"
                value={`${kpi.occ7}%`}
                color={occColor(kpi.occ7)}
                icon={BedDouble}
            />
            <KpiCard
                label="Occ 14d"
                value={`${kpi.occ14}%`}
                color={occColor(kpi.occ14)}
                icon={BedDouble}
            />
            <KpiCard
                label="Occ 30d"
                value={`${kpi.occ30}%`}
                color={occColor(kpi.occ30)}
                icon={BedDouble}
            />
            <KpiCard
                label="Pace 7d"
                value={formatPace(kpi.pace7)}
                color={paceColor(kpi.pace7)}
                icon={kpi.pace7 != null && kpi.pace7 >= 0 ? TrendingUp : TrendingDown}
            />
            <KpiCard
                label="Pace 30d"
                value={formatPace(kpi.pace30)}
                color={paceColor(kpi.pace30)}
                icon={kpi.pace30 != null && kpi.pace30 >= 0 ? TrendingUp : TrendingDown}
            />
            <KpiCard
                label="Pickup 7d"
                value={`${kpi.totalPickup7d > 0 ? '+' : ''}${kpi.totalPickup7d}`}
                color={kpi.totalPickup7d >= 0 ? '#10b981' : '#ef4444'}
                icon={BarChart3}
            />
            <KpiCard
                label="Avg ADR"
                value={avgAdr != null ? formatRevenue(avgAdr) : 'N/A'}
                color={avgAdr != null ? '#3b82f6' : '#94a3b8'}
                icon={DollarSign}
            />
        </div>
    );
}
