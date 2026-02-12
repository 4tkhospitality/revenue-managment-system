'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

    // Export PDF
    const handleExportPDF = async () => {
        const element = document.getElementById('pricing-matrix-table');
        if (!element) return;
        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`pricing-matrix-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error('PDF Export failed:', err);
        }
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

    // Retention badge color
    const getRetentionBadge = (bar: number, net: number) => {
        if (bar <= 0) return { color: 'bg-slate-100 text-slate-500', pct: '0' };
        const ratio = (net / bar) * 100;
        const pct = ratio.toFixed(0);
        if (ratio > 75) return { color: 'bg-emerald-50 text-emerald-700', pct };
        if (ratio > 50) return { color: 'bg-amber-50 text-amber-700', pct };
        return { color: 'bg-rose-50 text-rose-700', pct };
    };

    return (
        <div className="space-y-3">
            {/* ── Controls Bar ── */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-[13px] font-semibold text-slate-800">Chế độ:</span>
                    <div className="flex bg-slate-100 rounded-lg p-[3px]">
                        <button
                            onClick={() => handleModeChange('net_to_bar')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${!isBarToNet
                                ? 'bg-[#204184] text-white shadow-[0_2px_4px_rgba(32,65,132,0.3)]'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <span className={`w-[7px] h-[7px] rounded-full ${!isBarToNet ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                            Thu về → Hiển thị
                        </button>
                        <button
                            onClick={() => handleModeChange('bar_to_net')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${isBarToNet
                                ? 'bg-[#204184] text-white shadow-[0_2px_4px_rgba(32,65,132,0.3)]'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <span className={`w-[7px] h-[7px] rounded-full ${isBarToNet ? 'bg-amber-400' : 'bg-slate-400'}`} />
                            Hiển thị → Thu về
                        </button>
                    </div>
                    <span className="text-[11px] text-slate-400 italic border-l border-slate-200 pl-3">
                        {!isBarToNet
                            ? 'Nhập giá Net → Tính ra giá BAR & Giá khách thấy'
                            : 'Nhập giá khách thấy → Tính ra giá BAR & Thu về'
                        }
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    {isBarToNet && (
                        <button
                            onClick={handleCalculate}
                            disabled={!hasAnyPriceInput}
                            className="px-3 py-1.5 text-xs font-medium bg-[#1E3A8A] text-white rounded-lg hover:bg-[#204184] disabled:opacity-50"
                        >
                            Tính lại
                        </button>
                    )}
                    {!isBarToNet && (
                        <button
                            onClick={() => fetchMatrix(mode)}
                            className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                        >
                            Tính lại
                        </button>
                    )}
                    <button
                        onClick={handleExportPDF}
                        disabled={!data}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        PDF
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={!data}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1E3A8A] text-white rounded-lg hover:bg-[#204184] disabled:opacity-50"
                    >
                        <Download className="w-3.5 h-3.5" />
                        CSV
                    </button>
                </div>
            </div>

            {/* ── Legend ── */}
            <div className="flex flex-wrap items-center gap-4 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Mỗi ô hiển thị:</span>
                {!isBarToNet ? (
                    <>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'linear-gradient(135deg,#FFFBEB,#FCD34D)' }} />
                            Giá khách thấy (Display)
                        </span>
                    </>
                ) : (
                    <>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'linear-gradient(135deg,#ECFDF5,#A7F3D0)' }} />
                            Doanh thu thu về (Net)
                        </span>
                    </>
                )}
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
                    Giá BAR (nhập CM)
                </span>
                <span className="ml-auto flex items-center gap-1.5">
                    Tỷ lệ giữ lại:
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">&gt;75%</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700">50–75%</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700">&lt;50%</span>
                </span>
            </div>

            {/* ── Matrix Table ── */}
            {data && data.roomTypes.length > 0 && data.channels.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.06)]" id="pricing-matrix-table">
                    <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                        <colgroup>
                            <col style={{ width: '120px' }} />
                            <col style={{ width: '115px' }} />
                            {data.channels.map(ch => (
                                <col key={ch.id} />
                            ))}
                        </colgroup>
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                                    Hạng phòng
                                </th>
                                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">
                                    {isBarToNet ? (
                                        <span className="text-amber-600">Nhập giá hiển thị</span>
                                    ) : (
                                        <span className="text-emerald-600">Giá Net cơ sở</span>
                                    )}
                                </th>
                                {data.channels.map((ch) => (
                                    <th key={ch.id} className="px-2 py-2.5 text-center">
                                        <div className="text-[12px] font-semibold text-slate-800">{ch.name}</div>
                                        <span className="inline-block mt-1 text-[9px] font-normal text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full">
                                            HH {ch.commission}%
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.roomTypes.map((rt) => {
                                const hasPriceForRow = isBarToNet && parseVND(displayPrices[rt.id] || '') > 0;

                                return (
                                    <tr key={rt.id} className="border-t border-slate-100 hover:bg-[#FAFBFD] transition-colors">
                                        {/* Room name */}
                                        <td className="px-3 py-2">
                                            <div className="text-[13px] font-semibold text-slate-800">{rt.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{formatVND(rt.netPrice)}</div>
                                        </td>
                                        {/* Input column */}
                                        <td className="px-3 py-2 text-right">
                                            {isBarToNet ? (
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={displayPrices[rt.id] || ''}
                                                        onChange={(e) => handlePriceInput(rt.id, e.target.value)}
                                                        placeholder={formatVND(rt.netPrice)}
                                                        className="w-full text-right text-[13px] font-semibold font-mono text-amber-700 px-2 py-1 border border-amber-300 rounded-md bg-amber-50 placeholder:text-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 focus:outline-none"
                                                    />
                                                    <div className="text-[9px] text-amber-600 font-medium mt-0.5 text-right">Khách thấy</div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="text-[15px] font-bold font-mono text-emerald-600">{formatVND(rt.netPrice)}</div>
                                                    <div className="text-[9px] text-emerald-500 font-medium">Thu về (Net)</div>
                                                </div>
                                            )}
                                        </td>
                                        {/* Channel cells */}
                                        {data.channels.map((ch) => {
                                            const key = `${rt.id}:${ch.id}`;
                                            const cell = data.matrix[key];

                                            // Empty state for bar_to_net without input
                                            if (isBarToNet && !hasPriceForRow) {
                                                return (
                                                    <td key={ch.id} className="px-2 py-2">
                                                        <div className="h-[60px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-[10px] text-slate-400 italic">
                                                            Chưa nhập giá
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            if (!cell) return <td key={ch.id} className="px-2 py-2 text-center text-slate-300">—</td>;

                                            const badge = getRetentionBadge(cell.bar, cell.net);

                                            return (
                                                <td
                                                    key={ch.id}
                                                    className="px-2 py-2"
                                                    onMouseEnter={(e) => handleMouseEnter(key, e)}
                                                    onMouseLeave={() => setHoverCell(null)}
                                                >
                                                    <div className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md hover:border-slate-300 transition-all cursor-default">
                                                        {/* Main output value */}
                                                        {!isBarToNet ? (
                                                            /* Net→Display mode: show Display price (orange) */
                                                            <div className="px-2 py-1.5 text-center" style={{ background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)' }}>
                                                                <div className="text-[9px] font-bold uppercase tracking-wide text-amber-600">Khách thấy</div>
                                                                <div className="text-[14px] font-bold font-mono text-amber-700 leading-tight">{formatVND(cell.display)}</div>
                                                            </div>
                                                        ) : (
                                                            /* Display→Net mode: show Net revenue (green) */
                                                            <div className="px-2 py-1.5 text-center" style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' }}>
                                                                <div className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">Thu về</div>
                                                                <div className="text-[14px] font-bold font-mono text-emerald-700 leading-tight">{formatVND(cell.net)}</div>
                                                            </div>
                                                        )}
                                                        {/* BAR row */}
                                                        <div className="bg-slate-50 border-t border-slate-100 px-2 py-1 flex items-center justify-between">
                                                            <div>
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">BAR </span>
                                                                <span className="text-[11px] font-bold font-mono text-slate-600">{formatVND(cell.bar)}</span>
                                                            </div>
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badge.color}`}>
                                                                {badge.pct}%
                                                            </span>
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
