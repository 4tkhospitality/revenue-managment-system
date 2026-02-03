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
        { key: 'today', label: 'Hôm nay' },
        { key: '7days', label: '7 ngày' },
        { key: '14days', label: '14 ngày' },
        { key: '30days', label: '30 ngày' },
        { key: 'custom', label: 'Tuỳ chọn' },
    ];

    // Surface styling - consistent with other components
    const surface = "rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.06)]";

    return (
        <div className={`${surface} overflow-hidden`}>
            {/* Header with Filters */}
            <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Hiệu suất & Đề xuất giá
                    </h2>

                    {/* Quick Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                            {quickFilterButtons.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setQuickFilter(key)}
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${quickFilter === key
                                        ? 'text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    style={{
                                        backgroundColor: quickFilter === key ? '#2D4A8C' : '#f8fafc'
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Custom Date Range Picker */}
                {quickFilter === 'custom' && (
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t" style={{ borderColor: '#e2e8f0' }}>
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500">Từ:</label>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500">Đến:</label>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <span className="text-xs text-gray-400">
                            ({filteredData.length} ngày)
                        </span>
                    </div>
                )}

                {/* Result count */}
                <div className="text-xs text-gray-400 mt-2">
                    Hiển thị {filteredData.length} / {data.length} ngày
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                        <tr style={{ backgroundColor: '#f8fafc' }} className="text-left">
                            <th className="px-4 py-3 font-medium text-gray-500 sticky left-0" style={{ backgroundColor: '#f8fafc' }}>
                                Ngày
                            </th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-right">
                                OTB
                            </th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-right">
                                Còn
                            </th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-right">
                                D.Báo
                            </th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-right">
                                Hiện tại
                            </th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-right">
                                Đề xuất
                            </th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-center">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                    Không có dữ liệu cho khoảng thời gian đã chọn
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((row) => {
                                const { formatted, dayOfWeek, isWeekend } = formatDate(row.stayDate);
                                return (
                                    <tr
                                        key={row.id}
                                        className={`transition-colors ${row.isStopSell
                                            ? 'bg-rose-50'
                                            : isWeekend
                                                ? 'bg-amber-50'
                                                : 'hover:bg-gray-50'
                                            }`}
                                        style={{ borderTop: '1px solid #e2e8f0' }}
                                    >
                                        <td className="px-4 py-3 sticky left-0 bg-inherit">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-medium w-8 ${isWeekend ? 'text-amber-600' : 'text-gray-400'
                                                    }`}>
                                                    {dayOfWeek}
                                                </span>
                                                <span className="text-gray-900">{formatted}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 text-right">
                                            {row.roomsOtb}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 text-right">
                                            {row.remaining}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 text-right">
                                            {row.forecast}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-right">
                                            {formatCurrency(row.currentPrice)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {row.isStopSell ? (
                                                <span className="text-rose-600 font-semibold">
                                                    NGỪNG BÁN
                                                </span>
                                            ) : (
                                                <span style={{ color: '#2D4A8C' }} className="font-semibold">
                                                    {formatCurrency(row.recommendedPrice)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {row.isStopSell ? (
                                                <span className="text-xs text-gray-400">N/A</span>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => onAccept(row.id)}
                                                        className="p-1.5 rounded bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
                                                        title="Chấp nhận"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => onOverride(row.id)}
                                                        className="p-1.5 rounded bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors"
                                                        title="Bỏ qua"
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
            <div className="px-4 py-3 border-t bg-gray-50 space-y-1" style={{ borderColor: '#e2e8f0' }}>
                <p className="text-[10px] text-gray-500 font-medium mb-2">📐 Cách tính các cột:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-[10px] font-mono text-gray-400">
                    <div><span className="text-gray-500">Ngày:</span> Ngày ở (stay_date)</div>
                    <div><span className="text-gray-500">OTB:</span> SUM(rooms) từ reservations</div>
                    <div><span className="text-gray-500">Còn:</span> Capacity (240) − OTB</div>
                    <div><span className="text-gray-500">D.Báo:</span> remaining_demand từ ML</div>
                    <div><span className="text-gray-500">Hiện tại:</span> ADR = Revenue ÷ Rooms</div>
                    <div><span className="text-gray-500">Đề xuất:</span> Hiện tại × 1.1 (+10%)</div>
                </div>
                <div className="text-[10px] text-gray-400 mt-2 pt-2 border-t" style={{ borderColor: '#e2e8f0' }}>
                    🟡 Cuối tuần (T7/CN) | 🔴 Ngừng bán (Còn ≤ 0)
                </div>
            </div>
        </div>
    );
}
