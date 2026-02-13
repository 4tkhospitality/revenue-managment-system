'use client';

import { ArrowUpDown, Flame, AlertTriangle } from 'lucide-react';
import type { AnalyticsKpi, ViewMode } from './types';
import { formatRevenue } from './types';

export function DodChips({
    kpi,
    viewMode,
}: {
    kpi: AnalyticsKpi;
    viewMode: ViewMode;
}) {
    const hasDOD = kpi.netPickupDOD !== null;
    const dodVal = kpi.netPickupDOD ?? 0;
    const topDay = kpi.topChangeDay;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Net DOD chip */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!hasDOD
                    ? 'bg-slate-50 border-slate-200 text-slate-400'
                    : dodVal > 0
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : dodVal < 0
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                <ArrowUpDown className="w-3 h-3" />
                <span>So với hôm qua:</span>
                {hasDOD ? (
                    <span className="font-bold">
                        {dodVal > 0 ? '+' : ''}{viewMode === 'revenue' ? formatRevenue(dodVal) : dodVal}
                        {viewMode === 'rooms' ? ' rooms' : ''}
                    </span>
                ) : (
                    <span className="italic" title="Chưa có snapshot hôm qua">—</span>
                )}
            </div>

            {/* Top change day chip */}
            {topDay && topDay.delta !== 0 && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${topDay.delta > 0
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}>
                    {topDay.delta > 0
                        ? <Flame className="w-3 h-3" />
                        : <AlertTriangle className="w-3 h-3" />
                    }
                    <span>Top change:</span>
                    <span className="font-bold">{topDay.stay_date.slice(5)}</span>
                    <span className="font-bold">
                        ({topDay.delta > 0 ? '+' : ''}{viewMode === 'revenue' ? formatRevenue(topDay.delta) : topDay.delta})
                    </span>
                </div>
            )}
        </div>
    );
}
