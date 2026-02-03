'use client';

import { useState, useMemo } from 'react';
import { Check, X, Calendar } from 'lucide-react';

interface Recommendation {
    id: string;
    stayDate: string;
    roomsOtb: number;
    remaining: number;
    forecast: number;
    currentPrice: number;
    recommendedPrice: number;
    isStopSell: boolean;
}

interface RecommendationTableProps {
    data: Recommendation[];
    onAccept: (id: string) => void;
    onOverride: (id: string) => void;
}

type QuickFilter = 'today' | '7days' | '14days' | '30days' | 'custom';

export function RecommendationTable({
    data,
    onAccept,
    onOverride,
}: RecommendationTableProps) {
    const [quickFilter, setQuickFilter] = useState<QuickFilter>('14days');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'decimal',
            minimumFractionDigits: 0,
        }).format(value) + ' đ';

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
        const formatted = date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
        });
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        return { formatted, dayOfWeek, isWeekend };
    };

    const formatInputDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    // Calculate date range based on filter
    const filteredData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startDate: Date;
        let endDate: Date;

        switch (quickFilter) {
            case 'today':
                startDate = today;
                endDate = new Date(today);
                endDate.setDate(endDate.getDate() + 1);
                break;
            case '7days':
                startDate = today;
                endDate = new Date(today);
                endDate.setDate(endDate.getDate() + 7);
                break;
            case '14days':
                startDate = today;
                endDate = new Date(today);
                endDate.setDate(endDate.getDate() + 14);
                break;
            case '30days':
                startDate = today;
                endDate = new Date(today);
                endDate.setDate(endDate.getDate() + 30);
                break;
            case 'custom':
                startDate = customStartDate ? new Date(customStartDate) : today;
                endDate = customEndDate ? new Date(customEndDate) : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = today;
                endDate = new Date(today);
                endDate.setDate(endDate.getDate() + 14);
        }

        return data.filter(row => {
            const stayDate = new Date(row.stayDate);
            return stayDate >= startDate && stayDate < endDate;
        });
    }, [data, quickFilter, customStartDate, customEndDate]);

    const quickFilterButtons: { key: QuickFilter; label: string }[] = [
        { key: 'today', label: 'Today' },
        { key: '7days', label: '7 Days' },
        { key: '14days', label: '14 Days' },
        { key: '30days', label: '30 Days' },
        { key: 'custom', label: 'Custom' },
    ];

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            {/* Header with Filters */}
            <div className="px-4 py-3 border-b border-slate-800">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <h2 className="text-lg font-semibold text-slate-50">
                        Daily Performance & Price Recommendations
                    </h2>

                    {/* Quick Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex rounded-lg overflow-hidden border border-slate-700">
                            {quickFilterButtons.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setQuickFilter(key)}
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${quickFilter === key
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Custom Date Range Picker */}
                {quickFilter === 'custom' && (
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-800">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-400">From:</label>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-50 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-400">To:</label>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-50 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <span className="text-xs text-slate-500">
                            ({filteredData.length} days)
                        </span>
                    </div>
                )}

                {/* Result count */}
                <div className="text-xs text-slate-500 mt-2">
                    Showing {filteredData.length} of {data.length} days
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-800/90 text-left backdrop-blur-sm">
                            <th className="px-4 py-3 font-medium text-slate-400 sticky left-0 bg-slate-800/90">
                                Date
                            </th>
                            <th className="px-4 py-3 font-medium text-slate-400 text-right">
                                OTB
                            </th>
                            <th className="px-4 py-3 font-medium text-slate-400 text-right">
                                Rem.
                            </th>
                            <th className="px-4 py-3 font-medium text-slate-400 text-right">
                                Fcst
                            </th>
                            <th className="px-4 py-3 font-medium text-slate-400 text-right">
                                Current
                            </th>
                            <th className="px-4 py-3 font-medium text-slate-400 text-right">
                                Rec.
                            </th>
                            <th className="px-4 py-3 font-medium text-slate-400 text-center">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                    No data for the selected date range
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((row) => {
                                const { formatted, dayOfWeek, isWeekend } = formatDate(row.stayDate);
                                return (
                                    <tr
                                        key={row.id}
                                        className={`border-t border-slate-800 transition-colors ${row.isStopSell
                                            ? 'bg-rose-900/20'
                                            : isWeekend
                                                ? 'bg-amber-900/10'
                                                : 'hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <td className="px-4 py-3 sticky left-0 bg-inherit">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-medium w-8 ${isWeekend ? 'text-amber-400' : 'text-slate-500'
                                                    }`}>
                                                    {dayOfWeek}
                                                </span>
                                                <span className="text-slate-50">{formatted}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-50 text-right">
                                            {row.roomsOtb}
                                        </td>
                                        <td className="px-4 py-3 text-slate-50 text-right">
                                            {row.remaining}
                                        </td>
                                        <td className="px-4 py-3 text-slate-50 text-right">
                                            {row.forecast}
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 text-right">
                                            {formatCurrency(row.currentPrice)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {row.isStopSell ? (
                                                <span className="text-rose-500 font-semibold">
                                                    STOP SELL
                                                </span>
                                            ) : (
                                                <span className="text-blue-400 font-semibold">
                                                    {formatCurrency(row.recommendedPrice)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {row.isStopSell ? (
                                                <span className="text-xs text-slate-500">N/A</span>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => onAccept(row.id)}
                                                        className="p-1.5 rounded bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 transition-colors"
                                                        title="Accept"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => onOverride(row.id)}
                                                        className="p-1.5 rounded bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 transition-colors"
                                                        title="Override"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer with formula explanations */}
            <div className="px-4 py-3 border-t border-slate-800 bg-slate-800/30 space-y-1">
                <p className="text-[10px] text-slate-400 font-medium mb-2">📐 Cách tính các cột:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-[10px] font-mono text-slate-500">
                    <div><span className="text-slate-400">Date:</span> Ngày ở (stay_date)</div>
                    <div><span className="text-slate-400">OTB:</span> SUM(rooms) từ reservations cho ngày đó</div>
                    <div><span className="text-slate-400">Rem:</span> Capacity (240) − OTB</div>
                    <div><span className="text-slate-400">Fcst:</span> remaining_demand từ ML forecast</div>
                    <div><span className="text-slate-400">Current:</span> ADR = Revenue ÷ Rooms</div>
                    <div><span className="text-slate-400">Rec:</span> Current × 1.1 (mock +10%)</div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-800">
                    🟡 Weekend (Sat/Sun) | 🔴 Stop Sell (Remaining ≤ 0)
                </div>
            </div>
        </div>
    );
}
