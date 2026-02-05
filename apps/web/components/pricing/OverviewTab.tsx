'use client';

import { useState, useEffect } from 'react';
import { Loader2, Download, Info } from 'lucide-react';

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

export default function OverviewTab() {
    const [data, setData] = useState<MatrixData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoverCell, setHoverCell] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    // Calculate matrix
    const fetchMatrix = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/pricing/calc-matrix', { method: 'POST' });
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

    // Format VND
    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));

    // Get color for cell (heatmap)
    const getCellColor = (bar: number, net: number): string => {
        const ratio = bar / net;
        if (ratio < 1.3) return 'bg-emerald-50 text-emerald-700';
        if (ratio < 1.5) return 'bg-slate-50 text-slate-700';
        if (ratio < 1.7) return 'bg-amber-50 text-amber-700';
        return 'bg-rose-50 text-rose-700';
    };

    // Export CSV
    const handleExport = () => {
        if (!data) return;

        const headers = ['Hạng phòng', 'NET', ...data.channels.map(c => c.name)];
        const rows = data.roomTypes.map((rt) => {
            const cols = [rt.name, formatVND(rt.netPrice)];
            data.channels.forEach((ch) => {
                const key = `${rt.id}:${ch.id}`;
                const cell = data.matrix[key];
                cols.push(cell ? formatVND(cell.bar) : '—');
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
        a.download = `pricing-matrix-${new Date().toISOString().split('T')[0]}.csv`;
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

    if (!data || data.roomTypes.length === 0 || data.channels.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 bg-white border border-slate-200 rounded-xl">
                <p>Chưa có đủ dữ liệu để hiển thị.</p>
                <p className="text-sm mt-2">Vui lòng thêm Hạng phòng và Kênh OTA trước.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">Bảng giá tổng hợp</h2>
                    <p className="text-sm text-slate-500">
                        Cập nhật lúc: {new Date(data.calculatedAt).toLocaleString('vi-VN')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchMatrix}
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

            {/* Matrix Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-slate-600 font-medium whitespace-nowrap">
                                Hạng phòng / Kênh OTA
                            </th>
                            <th className="px-4 py-3 text-right text-slate-600 font-medium whitespace-nowrap">
                                NET
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
                        {data.roomTypes.map((rt) => (
                            <tr key={rt.id} className="border-t border-slate-100">
                                <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{rt.name}</td>
                                <td className="px-4 py-3 text-right font-mono text-slate-700 whitespace-nowrap">
                                    {formatVND(rt.netPrice)}
                                </td>
                                {data.channels.map((ch) => {
                                    const key = `${rt.id}:${ch.id}`;
                                    const cell = data.matrix[key];
                                    if (!cell) return <td key={ch.id} className="px-4 py-3 text-center">—</td>;

                                    return (
                                        <td
                                            key={ch.id}
                                            className={`px-4 py-3 text-right font-mono whitespace-nowrap cursor-help ${getCellColor(cell.bar, cell.net)}`}
                                            onMouseEnter={(e) => handleMouseEnter(key, e)}
                                            onMouseLeave={() => setHoverCell(null)}
                                        >
                                            {formatVND(cell.bar)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-sm text-slate-600">
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
                <div className="flex items-center gap-1 text-slate-400">
                    <Info className="w-4 h-4" />
                    <span>Hover để xem chi tiết</span>
                </div>
            </div>

            {/* Tooltip */}
            {hoverCell && data.matrix[hoverCell] && (
                <div
                    className="fixed bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50 max-w-xs"
                    style={{ left: tooltipPos.x + 10, top: tooltipPos.y + 10 }}
                >
                    <div className="font-semibold mb-1">Chi tiết tính giá:</div>
                    {data.matrix[hoverCell].trace?.map((step, i) => (
                        <div key={i} className="text-slate-300">{step.description}</div>
                    )) || <div>Không có chi tiết</div>}
                    <div className="mt-1 pt-1 border-t border-slate-600">
                        Giảm giá: {data.matrix[hoverCell].totalDiscount.toFixed(1)}%
                    </div>
                </div>
            )}
        </div>
    );
}
