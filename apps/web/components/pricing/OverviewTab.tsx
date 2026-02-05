'use client';

import { useState, useEffect } from 'react';
import { Loader2, Download, Info, ArrowRightLeft } from 'lucide-react';

interface RoomType {
    id: string;
    name: string;
    netPrice: number;
}

interface Channel {
    id: string;
    name: string;
    code: string;
    commission: number;
}

interface MatrixCell {
    bar: number;
    net: number;
    commission: number;
    totalDiscount: number;
    trace?: { step: string; description: string; priceAfter: number }[];
}

interface MatrixData {
    roomTypes: RoomType[];
    channels: Channel[];
    matrix: Record<string, MatrixCell>;
    calculatedAt: string;
}

type CalcMode = 'net_to_bar' | 'bar_to_net';

export default function OverviewTab() {
    const [data, setData] = useState<MatrixData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoverCell, setHoverCell] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    // New: Mode and display price
    const [mode, setMode] = useState<CalcMode>('net_to_bar');
    const [displayPrice, setDisplayPrice] = useState<string>('');
    const [displayPriceInput, setDisplayPriceInput] = useState<string>('');

    // Format VND
    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));

    // Parse VND input
    const parseVND = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;

    // Calculate matrix
    const fetchMatrix = async (calcMode: CalcMode = mode, price?: number) => {
        setLoading(true);
        setError(null);
        try {
            const body: { mode: CalcMode; displayPrice?: number } = { mode: calcMode };
            if (calcMode === 'bar_to_net' && price) {
                body.displayPrice = price;
            }

            const res = await fetch('/api/pricing/calc-matrix', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error('Failed to calculate');
            const result = await res.json();
            setData(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatrix();
    }, []);

    // Handle mode change
    const handleModeChange = (newMode: CalcMode) => {
        setMode(newMode);
        if (newMode === 'net_to_bar') {
            fetchMatrix(newMode);
        } else {
            // bar_to_net: Clear old data, wait for user to input price
            setData(null);
            setDisplayPrice('');
        }
    };

    // Handle display price submit
    const handleDisplayPriceSubmit = () => {
        const price = parseVND(displayPriceInput);
        if (price > 0) {
            setDisplayPrice(formatVND(price));
            fetchMatrix('bar_to_net', price);
        }
    };

    // Handle input with formatting
    const handlePriceInputChange = (value: string) => {
        const num = parseVND(value);
        if (num > 0) {
            setDisplayPriceInput(formatVND(num));
        } else {
            setDisplayPriceInput('');
        }
    };

    // Get color for cell (heatmap) - different logic per mode
    const getCellColor = (bar: number, net: number, isBarToNet: boolean): string => {
        if (isBarToNet) {
            // In bar_to_net mode, lower NET = worse (more commission+KM eaten)
            const ratio = net / bar;
            if (ratio > 0.75) return 'bg-emerald-50 text-emerald-700'; // High retention
            if (ratio > 0.60) return 'bg-slate-50 text-slate-700';
            if (ratio > 0.50) return 'bg-amber-50 text-amber-700';
            return 'bg-rose-50 text-rose-700'; // Low retention
        } else {
            const ratio = bar / net;
            if (ratio < 1.3) return 'bg-emerald-50 text-emerald-700';
            if (ratio < 1.5) return 'bg-slate-50 text-slate-700';
            if (ratio < 1.7) return 'bg-amber-50 text-amber-700';
            return 'bg-rose-50 text-rose-700';
        }
    };

    // Export CSV
    const handleExport = () => {
        if (!data) return;

        const isBarToNet = mode === 'bar_to_net';
        const headers = ['Hạng phòng', isBarToNet ? 'Giá hiển thị' : 'NET', ...data.channels.map(c => c.name)];
        const rows = data.roomTypes.map((rt) => {
            const firstCell = data.matrix[`${rt.id}:${data.channels[0]?.id}`];
            const cols = [rt.name, formatVND(isBarToNet ? (firstCell?.bar || 0) : rt.netPrice)];
            data.channels.forEach((ch) => {
                const key = `${rt.id}:${ch.id}`;
                const cell = data.matrix[key];
                cols.push(cell ? formatVND(isBarToNet ? cell.net : cell.bar) : '—');
            });
            return cols;
        });

        const csv = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pricing-matrix-${mode}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Show tooltip
    const handleMouseEnter = (key: string, e: React.MouseEvent) => {
        setHoverCell(key);
        setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">Đang tính toán...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
            </div>
        );
    }

    const isBarToNet = mode === 'bar_to_net';

    return (
        <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">Chế độ:</span>
                        <div className="flex rounded-lg bg-white border border-slate-200 p-1">
                            <button
                                onClick={() => handleModeChange('net_to_bar')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'net_to_bar'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                NET → Giá hiển thị
                            </button>
                            <button
                                onClick={() => handleModeChange('bar_to_net')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${mode === 'bar_to_net'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <ArrowRightLeft className="w-3 h-3" />
                                Giá hiển thị → Thu về
                            </button>
                        </div>
                    </div>

                    {/* Display Price Input (only for bar_to_net mode) */}
                    {mode === 'bar_to_net' && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Giá hiển thị đồng nhất:</span>
                            <input
                                type="text"
                                value={displayPriceInput}
                                onChange={(e) => handlePriceInputChange(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleDisplayPriceSubmit()}
                                placeholder="VD: 1.500.000"
                                className="w-36 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right font-mono"
                            />
                            <button
                                onClick={handleDisplayPriceSubmit}
                                disabled={!displayPriceInput}
                                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Tính
                            </button>
                        </div>
                    )}
                </div>

                {/* Mode Description */}
                <p className="mt-2 text-xs text-slate-500">
                    {mode === 'net_to_bar'
                        ? '💡 Nhập giá NET mong muốn thu về → Hệ thống tính giá hiển thị trên từng OTA'
                        : '💡 Nhập 1 giá hiển thị đồng nhất → Xem khách sạn thu về bao nhiêu từ mỗi kênh sau KM và hoa hồng'
                    }
                </p>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                        {isBarToNet ? 'Phân tích thu về từ giá đồng nhất' : 'Bảng giá tổng hợp'}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {isBarToNet && displayPrice ? `Giá hiển thị: ${displayPrice}` : `Cập nhật lúc: ${data ? new Date(data.calculatedAt).toLocaleString('vi-VN') : ''}`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchMatrix(mode, mode === 'bar_to_net' ? parseVND(displayPriceInput) : undefined)}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                    >
                        Tính lại
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Show message if bar_to_net but no price entered */}
            {isBarToNet && !data && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 text-center">
                    <div className="text-2xl mb-2">👆</div>
                    <div className="text-amber-800 font-medium">Nhập giá hiển thị đồng nhất ở trên</div>
                    <div className="text-amber-600 text-sm mt-1">Ví dụ: 1.500.000 → Xem khách sạn thu về bao nhiêu từ mỗi kênh OTA</div>
                </div>
            )}

            {/* Matrix Table */}
            {data && data.roomTypes.length > 0 && data.channels.length > 0 && (
                <>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-slate-600 font-medium whitespace-nowrap">
                                        {isBarToNet ? 'Hạng phòng' : 'Hạng phòng / Kênh OTA'}
                                    </th>
                                    <th className="px-4 py-3 text-right text-slate-600 font-medium whitespace-nowrap">
                                        {isBarToNet ? 'Giá hiển thị' : 'NET'}
                                    </th>
                                    {data.channels.map((ch) => (
                                        <th key={ch.id} className="px-4 py-3 text-right text-slate-600 font-medium whitespace-nowrap">
                                            {ch.name}
                                            <div className="text-xs font-normal text-slate-400">{ch.commission}%</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.roomTypes.map((rt) => {
                                    const firstCell = data.matrix[`${rt.id}:${data.channels[0]?.id}`];
                                    return (
                                        <tr key={rt.id} className="border-t border-slate-100">
                                            <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{rt.name}</td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-700 whitespace-nowrap">
                                                {formatVND(isBarToNet ? (firstCell?.bar || 0) : rt.netPrice)}
                                            </td>
                                            {data.channels.map((ch) => {
                                                const key = `${rt.id}:${ch.id}`;
                                                const cell = data.matrix[key];
                                                if (!cell) return <td key={ch.id} className="px-4 py-3 text-center">—</td>;

                                                const displayValue = isBarToNet ? cell.net : cell.bar;
                                                const retentionPct = isBarToNet ? ((cell.net / cell.bar) * 100).toFixed(0) : null;

                                                return (
                                                    <td
                                                        key={ch.id}
                                                        className={`px-4 py-3 text-right font-mono whitespace-nowrap cursor-help ${getCellColor(cell.bar, cell.net, isBarToNet)}`}
                                                        onMouseEnter={(e) => handleMouseEnter(key, e)}
                                                        onMouseLeave={() => setHoverCell(null)}
                                                    >
                                                        <div>{formatVND(displayValue)}</div>
                                                        {isBarToNet && (
                                                            <div className="text-xs text-slate-500">Thu về {retentionPct}%</div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-6 text-sm text-slate-600">
                        {isBarToNet ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded bg-emerald-200"></span>
                                    <span>Giữ lại cao (&gt;75%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded bg-amber-200"></span>
                                    <span>Trung bình (50-60%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded bg-rose-200"></span>
                                    <span>Giữ lại thấp (&lt;50%)</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded bg-emerald-200"></span>
                                    <span>Giá thấp (&lt;1.3x)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded bg-amber-200"></span>
                                    <span>Trung bình</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded bg-rose-200"></span>
                                    <span>Giá cao (&gt;1.7x)</span>
                                </div>
                            </>
                        )}
                        <div className="flex items-center gap-1 text-slate-400">
                            <Info className="w-4 h-4" />
                            <span>Hover để xem chi tiết</span>
                        </div>
                    </div>
                </>
            )}

            {/* Empty State */}
            {(!data || data.roomTypes.length === 0 || data.channels.length === 0) && !isBarToNet && (
                <div className="text-center py-12 text-slate-500 bg-white border border-slate-200 rounded-xl">
                    <p>Chưa có đủ dữ liệu để hiển thị.</p>
                    <p className="text-sm mt-2">Vui lòng thêm Hạng phòng và Kênh OTA trước.</p>
                </div>
            )}

            {/* Tooltip */}
            {hoverCell && data?.matrix[hoverCell] && (
                <div
                    className="fixed bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50 max-w-xs"
                    style={{ left: tooltipPos.x + 10, top: tooltipPos.y + 10 }}
                >
                    <div className="font-semibold mb-1">
                        {isBarToNet ? 'Chi tiết khấu trừ:' : 'Chi tiết tính giá:'}
                    </div>
                    {data.matrix[hoverCell].trace?.map((step, i) => (
                        <div key={i} className="text-slate-300">{step.description}</div>
                    )) || <div>Không có chi tiết</div>}
                    <div className="mt-1 pt-1 border-t border-slate-600">
                        {isBarToNet
                            ? `Còn lại: ${formatVND(data.matrix[hoverCell].net)} (${((data.matrix[hoverCell].net / data.matrix[hoverCell].bar) * 100).toFixed(1)}%)`
                            : `Giảm giá: ${data.matrix[hoverCell].totalDiscount.toFixed(1)}%`
                        }
                    </div>
                </div>
            )}
        </div>
    );
}
