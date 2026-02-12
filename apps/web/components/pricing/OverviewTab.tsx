'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
    display: number;
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

    const [mode, setMode] = useState<CalcMode>('net_to_bar');

    // Per-room-type display prices (for bar_to_net mode)
    const [displayPrices, setDisplayPrices] = useState<Record<string, string>>({});
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
    const parseVND = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;

    // Fetch matrix
    const fetchMatrix = useCallback(async (
        calcMode: CalcMode = mode,
        prices?: Record<string, number>
    ) => {
        setLoading(true);
        setError(null);
        try {
            const body: { mode: CalcMode; displayPrices?: Record<string, number> } = { mode: calcMode };
            if (calcMode === 'bar_to_net' && prices) {
                body.displayPrices = prices;
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
    }, [mode]);

    useEffect(() => { fetchMatrix(); }, []);

    // Handle mode switch
    const handleModeChange = (newMode: CalcMode) => {
        setMode(newMode);
        if (newMode === 'net_to_bar') {
            setDisplayPrices({});
            fetchMatrix(newMode);
        }
        // For bar_to_net, wait for user to input prices
    };

    // Handle per-room price input change with debounce
    const handlePriceInput = (roomTypeId: string, value: string) => {
        const num = parseVND(value);
        const formatted = num > 0 ? formatVND(num) : '';

        setDisplayPrices(prev => ({ ...prev, [roomTypeId]: formatted }));

        // Debounce API call
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            // Collect all prices that have values
            const allPrices: Record<string, number> = {};
            const updated = { ...displayPrices, [roomTypeId]: formatted };
            for (const [id, val] of Object.entries(updated)) {
                const p = parseVND(val);
                if (p > 0) allPrices[id] = p;
            }
            if (Object.keys(allPrices).length > 0) {
                fetchMatrix('bar_to_net', allPrices);
            }
        }, 600);
    };

    // Manual calculate button
    const handleCalculate = () => {
        const prices: Record<string, number> = {};
        for (const [id, val] of Object.entries(displayPrices)) {
            const p = parseVND(val);
            if (p > 0) prices[id] = p;
        }
        if (Object.keys(prices).length > 0) {
            fetchMatrix('bar_to_net', prices);
        }
    };

    // Heatmap color
    const getCellColor = (bar: number, net: number): string => {
        if (bar <= 0) return 'bg-slate-50';
        const ratio = net / bar;
        if (ratio > 0.75) return 'bg-emerald-50';
        if (ratio > 0.60) return 'bg-slate-50';
        if (ratio > 0.50) return 'bg-amber-50';
        return 'bg-rose-50';
    };

    // Export CSV
    const handleExport = () => {
        if (!data) return;
        const headers = ['Hạng phòng', mode === 'bar_to_net' ? 'Giá hiển thị (nhập)' : 'Giá thu về (NET)'];
        data.channels.forEach(ch => {
            headers.push(`${ch.name} - Thu về`, `${ch.name} - BAR`, `${ch.name} - Hiển thị`);
        });

        const rows = data.roomTypes.map((rt) => {
            const secondCol = mode === 'bar_to_net'
                ? (displayPrices[rt.id] || '—')
                : formatVND(rt.netPrice);
            const cols: string[] = [rt.name, secondCol];
            data.channels.forEach((ch) => {
                const key = `${rt.id}:${ch.id}`;
                const cell = data.matrix[key];
                if (cell) {
                    cols.push(formatVND(cell.net), formatVND(cell.bar), formatVND(cell.display));
                } else {
                    cols.push('—', '—', '—');
                }
            });
            return cols;
        });

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pricing-matrix-${mode}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleMouseEnter = (key: string, e: React.MouseEvent) => {
        setHoverCell(key);
        setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">Đang tính toán...</span>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
            </div>
        );
    }

    const isBarToNet = mode === 'bar_to_net';
    const hasAnyPriceInput = Object.values(displayPrices).some(v => parseVND(v) > 0);

    return (
        <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium text-slate-700">Chế độ:</span>
                    <div className="flex rounded-lg bg-white border border-slate-200 p-1">
                        <button
                            onClick={() => handleModeChange('net_to_bar')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'net_to_bar'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            Thu về → Hiển thị
                        </button>
                        <button
                            onClick={() => handleModeChange('bar_to_net')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${mode === 'bar_to_net'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <ArrowRightLeft className="w-3 h-3" />
                            Hiển thị → Thu về
                        </button>
                    </div>

                    {isBarToNet && (
                        <button
                            onClick={handleCalculate}
                            disabled={!hasAnyPriceInput}
                            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Tính lại
                        </button>
                    )}
                </div>

                <p className="mt-2 text-xs text-slate-500">
                    {!isBarToNet
                        ? '💡 Từ giá thu về NET của từng hạng phòng → Tính giá BAR và giá khách thấy trên từng OTA'
                        : '💡 Nhập giá khách thấy trên OTA cho từng hạng phòng → Xem KS thu về bao nhiêu từ mỗi kênh'
                    }
                </p>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                        {isBarToNet ? 'Phân tích thu về từ giá hiển thị' : 'Bảng giá tổng hợp'}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {data ? `Cập nhật lúc: ${new Date(data.calculatedAt).toLocaleString('vi-VN')}` : ''}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    <button
                        onClick={() => {
                            if (isBarToNet) handleCalculate();
                            else fetchMatrix(mode);
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm"
                    >
                        Tính lại
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={!data}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Matrix Table */}
            {data && data.roomTypes.length > 0 && data.channels.length > 0 && (
                <>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-slate-600 font-medium whitespace-nowrap">
                                        Hạng phòng
                                    </th>
                                    <th className="px-4 py-3 text-right text-slate-600 font-medium whitespace-nowrap">
                                        {isBarToNet ? (
                                            <div>
                                                <div>Giá hiển thị</div>
                                                <div className="text-xs font-normal text-orange-500">Nhập giá khách thấy</div>
                                            </div>
                                        ) : (
                                            'Giá thu về (NET)'
                                        )}
                                    </th>
                                    {data.channels.map((ch) => (
                                        <th key={ch.id} className="px-4 py-3 text-center text-slate-600 font-medium whitespace-nowrap">
                                            {ch.name}
                                            <div className="text-xs font-normal text-slate-400">Hoa hồng {ch.commission}%</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.roomTypes.map((rt) => {
                                    const hasPriceForRow = isBarToNet && parseVND(displayPrices[rt.id] || '') > 0;

                                    return (
                                        <tr key={rt.id} className="border-t border-slate-100">
                                            <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                                                {rt.name}
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                {isBarToNet ? (
                                                    <input
                                                        type="text"
                                                        value={displayPrices[rt.id] || ''}
                                                        onChange={(e) => handlePriceInput(rt.id, e.target.value)}
                                                        placeholder={formatVND(rt.netPrice)}
                                                        className="w-32 px-2 py-1.5 text-right text-sm font-mono border border-orange-300 rounded-lg bg-orange-50 text-orange-700 placeholder:text-orange-300 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 focus:outline-none"
                                                    />
                                                ) : (
                                                    <span className="font-mono text-slate-700">{formatVND(rt.netPrice)}</span>
                                                )}
                                            </td>
                                            {data.channels.map((ch) => {
                                                const key = `${rt.id}:${ch.id}`;
                                                const cell = data.matrix[key];

                                                // In bar_to_net mode, show placeholder if no price entered
                                                if (isBarToNet && !hasPriceForRow) {
                                                    return (
                                                        <td key={ch.id} className="px-4 py-3 text-center text-slate-300 text-xs">
                                                            ← Nhập giá
                                                        </td>
                                                    );
                                                }

                                                if (!cell) return <td key={ch.id} className="px-4 py-3 text-center">—</td>;

                                                const retentionPct = cell.bar > 0 ? ((cell.net / cell.bar) * 100).toFixed(0) : '0';

                                                return (
                                                    <td
                                                        key={ch.id}
                                                        className={`px-4 py-2 whitespace-nowrap cursor-help ${getCellColor(cell.bar, cell.net)}`}
                                                        onMouseEnter={(e) => handleMouseEnter(key, e)}
                                                        onMouseLeave={() => setHoverCell(null)}
                                                    >
                                                        <div className="space-y-0.5">
                                                            {/* Thu về (NET) — primary */}
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-[10px] text-emerald-600 font-medium">Thu về</span>
                                                                <span className="font-bold text-emerald-700 font-mono">{formatVND(cell.net)}</span>
                                                            </div>
                                                            {/* BAR */}
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-[10px] text-slate-400">BAR</span>
                                                                <span className="text-xs text-slate-500 font-mono">{formatVND(cell.bar)}</span>
                                                            </div>
                                                            {/* Hiển thị */}
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-[10px] text-orange-500">Hiển thị</span>
                                                                <span className="text-xs text-orange-600 font-mono">{formatVND(cell.display)}</span>
                                                            </div>
                                                            {/* Retention */}
                                                            <div className="text-[10px] text-right text-slate-400">
                                                                Giữ lại {retentionPct}%
                                                            </div>
                                                        </div>
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
                    <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
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
                        <div className="flex items-center gap-1 text-slate-400">
                            <Info className="w-4 h-4" />
                            <span>Hover để xem chi tiết</span>
                        </div>
                    </div>

                    {/* Price type legend */}
                    <div className="flex items-center gap-6 text-xs text-slate-500 bg-slate-50 rounded-lg px-4 py-2">
                        <span className="font-medium text-slate-600">Mỗi ô hiển thị:</span>
                        <span><span className="text-emerald-600 font-medium">Thu về</span> = tiền KS nhận</span>
                        <span><span className="text-slate-500 font-medium">BAR</span> = giá nhập Channel Manager</span>
                        <span><span className="text-orange-600 font-medium">Hiển thị</span> = giá khách thấy trên OTA</span>
                    </div>
                </>
            )}

            {/* Empty State */}
            {data && (data.roomTypes.length === 0 || data.channels.length === 0) && (
                <div className="text-center py-12 text-slate-500 bg-white border border-slate-200 rounded-xl">
                    <p>Chưa có đủ dữ liệu để hiển thị.</p>
                    <p className="text-sm mt-2">Vui lòng thêm Hạng phòng và Kênh OTA trước.</p>
                </div>
            )}

            {/* Tooltip */}
            {hoverCell && data?.matrix[hoverCell] && (
                <div
                    className="fixed bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50 max-w-xs pointer-events-none"
                    style={{ left: tooltipPos.x + 10, top: tooltipPos.y + 10 }}
                >
                    <div className="font-semibold mb-1">Chi tiết tính giá:</div>
                    {data.matrix[hoverCell].trace?.map((step, i) => (
                        <div key={i} className="text-slate-300">{step.description}</div>
                    )) || <div>Không có chi tiết</div>}
                    <div className="mt-1 pt-1 border-t border-slate-600 space-y-0.5">
                        <div>BAR: {formatVND(data.matrix[hoverCell].bar)}đ</div>
                        <div>Hiển thị: {formatVND(data.matrix[hoverCell].display)}đ (KM: -{data.matrix[hoverCell].totalDiscount.toFixed(1)}%)</div>
                        <div className="text-emerald-300 font-medium">
                            Thu về: {formatVND(data.matrix[hoverCell].net)}đ
                            ({data.matrix[hoverCell].bar > 0
                                ? ((data.matrix[hoverCell].net / data.matrix[hoverCell].bar) * 100).toFixed(1)
                                : '0'}%)
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
