'use client';

import Link from 'next/link';
import { TrendingDown, Flame, Eye, Target } from 'lucide-react';
import type { DateToWatch, ViewMode } from './types';

const categoryStyles = {
    under_pace: { bg: 'bg-rose-50 border-rose-200 text-rose-700', icon: TrendingDown },
    tight_supply: { bg: 'bg-amber-50 border-amber-200 text-amber-700', icon: Flame },
    mixed: { bg: 'bg-blue-50 border-blue-200 text-blue-700', icon: Eye },
} as const;

export function DatesToWatchPanel({
    dates,
    viewMode,
    maxItems = 5,
}: {
    dates: DateToWatch[];
    viewMode: ViewMode;
    maxItems?: number;
}) {
    if (dates.length === 0) return null;

    const visibleDates = dates.slice(0, maxItems);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header inline */}
            <div className="px-4 py-2 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-600 shrink-0">Dates to Watch</span>

                {/* Horizontal scrollable chip strip */}
                <div className="flex-1 overflow-x-auto scrollbar-thin">
                    <div className="flex items-center gap-1.5 py-0.5">
                        {visibleDates.map((d) => {
                            const cat = categoryStyles[d.category];
                            const Icon = cat.icon;

                            return (
                                <Link
                                    key={d.stay_date}
                                    href={`/daily-actions?date=${d.stay_date}`}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 
                                        rounded-full border text-xs font-medium whitespace-nowrap
                                        hover:shadow-sm transition-all cursor-pointer shrink-0
                                        ${cat.bg}`}
                                >
                                    <Icon className="w-3 h-3 shrink-0" />
                                    <span className="font-mono font-bold">{d.stay_date.slice(5)}</span>
                                    <span className="opacity-70">({d.dow})</span>
                                    <span className="font-bold">OTB:{d.rooms_otb}</span>
                                    {d.vs_ly !== null && (
                                        <span className={`font-bold ${d.vs_ly >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            {d.vs_ly > 0 ? '↑' : '↓'}{Math.abs(d.vs_ly)}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
