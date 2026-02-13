'use client';

import { CalendarDays, ToggleLeft, ToggleRight, BedDouble, DollarSign } from 'lucide-react';
import type { ViewMode } from './types';
import { DataQualityBadge } from './DataQualityBadge';
import type { AnalyticsQuality } from './types';

interface AnalyticsControlsProps {
    selectedAsOf: string;
    asOfDates: string[];
    onAsOfChange: (asOf: string) => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    quality: AnalyticsQuality;
    loading?: boolean;
}

export function AnalyticsControls({
    selectedAsOf,
    asOfDates,
    onAsOfChange,
    viewMode,
    onViewModeChange,
    quality,
    loading,
}: AnalyticsControlsProps) {
    return (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* As-Of Selector */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500 font-medium">As-of:</span>
                <select
                    value={selectedAsOf}
                    onChange={(e) => onAsOfChange(e.target.value)}
                    className="text-xs font-medium text-slate-800 bg-transparent border-none outline-none cursor-pointer"
                >
                    {asOfDates.map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
            </div>

            {/* Rooms/Revenue Toggle */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                <button
                    onClick={() => onViewModeChange('rooms')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'rooms'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    <BedDouble className="w-3 h-3" />
                    Rooms
                </button>
                <button
                    onClick={() => onViewModeChange('revenue')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'revenue'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    <DollarSign className="w-3 h-3" />
                    Revenue
                </button>
            </div>

            {/* Data Quality Badge */}
            <DataQualityBadge quality={quality} />

            {/* Loading indicator */}
            {loading && (
                <span className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            )}
        </div>
    );
}
