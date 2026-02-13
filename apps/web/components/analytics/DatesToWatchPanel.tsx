'use client';

import Link from 'next/link';
import { TrendingDown, Flame, Eye, Target } from 'lucide-react';
import type { DateToWatch, ViewMode } from './types';

const categoryStyles = {
    under_pace: { border: 'border-l-rose-500 bg-rose-50/50', icon: TrendingDown },
    tight_supply: { border: 'border-l-amber-500 bg-amber-50/50', icon: Flame },
    mixed: { border: 'border-l-blue-500 bg-blue-50/50', icon: Eye },
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
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">Dates to Watch</span>
                <span className="text-xs text-slate-400">Top {visibleDates.length} ngày cần ưu tiên</span>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100">
                {visibleDates.map((d) => {
                    const cat = categoryStyles[d.category];
                    const Icon = cat.icon;

                    return (
                        <div
                            key={d.stay_date}
                            className={`flex items-center gap-3 px-4 py-2.5 border-l-4 ${cat.border} hover:bg-slate-50/50 transition-colors`}
                        >
                            <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-800 font-mono">{d.stay_date}</span>
                                    <span className="text-xs text-slate-400">({d.dow})</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${d.score > 50
                                            ? 'bg-rose-100 text-rose-700'
                                            : d.score > 20
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        Score: {d.score}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5 truncate">
                                    {d.impact}
                                </div>
                            </div>

                            {/* Right stats */}
                            <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                                <span>OTB: <strong className="text-slate-700">{d.rooms_otb}</strong></span>
                                {d.vs_ly !== null && (
                                    <span className={d.vs_ly >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                        vs LY: {d.vs_ly > 0 ? '+' : ''}{d.vs_ly}
                                    </span>
                                )}
                                <span>Avail: <strong>{d.remaining_supply}</strong></span>
                            </div>

                            <Link
                                href={`/daily-actions?date=${d.stay_date}`}
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline shrink-0 font-medium"
                            >
                                Actions →
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
