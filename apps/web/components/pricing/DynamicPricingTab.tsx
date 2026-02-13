'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Download, Settings, AlertTriangle, TrendingUp, Calendar, X, ChevronRight } from 'lucide-react';
import OccTierEditor from './OccTierEditor';
import SeasonConfigPanel from './SeasonConfigPanel';

// ── Types (mirrored from service.ts — cannot import due to 'server-only') ──

type ViewMode = 'net' | 'bar' | 'display';

interface DynamicCell {
    net: number;
    bar: number;
    display: number;
    effectiveDiscount: number;
    validation?: { isValid: boolean; errors: string[]; warnings: string[] };
    trace?: { step: string; description: string; priceAfter: number }[];
}

interface Violation {
    roomTypeId: string;
    tierIndex: number;
    field: 'net' | 'bar' | 'display';
    value: number;
    min?: number;
    max?: number;
    message: string;
}

interface DynamicMatrixResponse {
    tiers: { tierIndex: number; occMin: number; occMax: number; multiplier: number; adjustmentType: string; fixedAmount: number; label: string }[];
    matrix: Record<string, DynamicCell>;
    roomTypes: { id: string; name: string; netBase: number }[];
    season: { id: string; name: string; type: string; autoDetected: boolean };
    channel: { id: string; name: string; code: string; commission: number };
    occPct: number | null;
    occSource: 'otb' | 'override' | 'unavailable';
    activeTierIndex: number | null;
    guardrails: { minRate: number; maxRate: number };
    violations: Violation[];
}

interface Channel {
    id: string;
    name: string;
    code: string;
}

interface Season {
    id: string;
    name: string;
    code: string;
}

// ── Helpers ────────────────────────────────────────────────────────

function formatVND(n: number): string {
    if (!n || n === 0) return '0';
    return Math.round(n).toLocaleString('vi-VN');
}

function todayISO(): string {
    const d = new Date();
    return d.toISOString().split('T')[0];
}

const VIEW_LABELS: Record<ViewMode, string> = {
    net: 'Thu về',
    bar: 'BAR',
    display: 'Hiển thị',
};

// ── Main Component ─────────────────────────────────────────────────

export default function DynamicPricingTab() {
    // State
    const [stayDate, setStayDate] = useState(todayISO());
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState('');
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [seasonOverride, setSeasonOverride] = useState<string | null>(null);
    const [occOverride, setOccOverride] = useState<string>('');
    const [viewMode, setViewMode] = useState<ViewMode>('net');
    const [showConfig, setShowConfig] = useState(false);

    // Data
    const [data, setData] = useState<DynamicMatrixResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cell drill-down
    const [selectedCell, setSelectedCell] = useState<{ roomTypeId: string; roomTypeName: string; tierIndex: number } | null>(null);

    // ── Fetch channels & seasons on mount
    useEffect(() => {
        (async () => {
            try {
                const [chRes, sRes] = await Promise.all([
                    fetch('/api/pricing/ota-channels'),
                    fetch('/api/pricing/seasons'),
                ]);
                if (chRes.ok) {
                    const chs = await chRes.json();
                    setChannels(chs);
                    if (chs.length > 0 && !selectedChannel) setSelectedChannel(chs[0].id);
                }
                if (sRes.ok) {
                    const ss = await sRes.json();
                    setSeasons(ss);
                }
            } catch { /* ignore */ }
        })();
    }, []);

    // ── Fetch dynamic matrix
    const fetchMatrix = useCallback(async () => {
        if (!selectedChannel) return;
        setLoading(true);
        setError(null);
        try {
            const body: Record<string, unknown> = {
                stayDate,
                channelId: selectedChannel,
            };
            if (seasonOverride) body.seasonIdOverride = seasonOverride;
            if (occOverride !== '') body.occOverride = parseFloat(occOverride) / 100;

            const res = await fetch('/api/pricing/dynamic-matrix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to load');
            }
            const result: DynamicMatrixResponse = await res.json();
            setData(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [stayDate, selectedChannel, seasonOverride, occOverride]);

    // Auto-fetch on param change
    useEffect(() => {
        fetchMatrix();
    }, [fetchMatrix]);

    // ── Enriched CSV Export (P1)
    const handleExport = () => {
        if (!data) return;
        const channelObj = channels.find(c => c.id === selectedChannel);
        const activeTier = data.activeTierIndex !== null ? data.tiers[data.activeTierIndex] : null;

        // Metadata header
        const meta = [
            `# Hotel: ${channelObj?.name || 'N/A'}`,
            `# OTA: ${data.channel.name} (${(data.channel.commission * 100).toFixed(0)}% commission)`,
            `# Stay Date: ${stayDate}`,
            `# Season: ${data.season.name}${data.season.autoDetected ? ' (auto)' : ''}`,
            `# OCC: ${data.occPct !== null ? `${(data.occPct * 100).toFixed(0)}%` : 'N/A'} (${data.occSource}) | Active Tier: ${activeTier ? `${activeTier.label} (${activeTier.adjustmentType === 'FIXED' ? `+${formatVND(activeTier.fixedAmount)}` : `×${activeTier.multiplier.toFixed(2)}`})` : 'N/A'}`,
            `# Generated: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
            `# Currency: VND | Rounding: 1000`,
            `# View: ${VIEW_LABELS[viewMode]}`,
            '',
        ];

        // Column headers depend on view mode
        const headers = ['Hạng phòng', 'Giá thu về thấp nhất', ...data.tiers.map(t => `${VIEW_LABELS[viewMode]} ${t.label}`)];
        const rows = data.roomTypes.map(rt => {
            const vals = data.tiers.map(t => {
                const cell = data.matrix[`${rt.id}:${t.tierIndex}`];
                if (!cell) return '';
                return viewMode === 'net' ? cell.net : viewMode === 'bar' ? cell.bar : cell.display;
            });
            return [rt.name, rt.netBase, ...vals].join(',');
        });
        const csv = [...meta, headers.join(','), ...rows].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dynamic-pricing-${stayDate}-${viewMode}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Violation check helper
    const hasViolation = (roomTypeId: string, tierIndex: number): Violation | undefined => {
        return data?.violations.find(v => v.roomTypeId === roomTypeId && v.tierIndex === tierIndex);
    };

    // ── Cell value for current view mode
    const cellValue = (cell: DynamicCell | undefined): string => {
        if (!cell) return '—';
        const v = viewMode === 'net' ? cell.net : viewMode === 'bar' ? cell.bar : cell.display;
        return formatVND(v);
    };

    // ── Drill-down cell data (read-only from API response)
    const drilldownCell = selectedCell
        ? data?.matrix[`${selectedCell.roomTypeId}:${selectedCell.tierIndex}`]
        : null;
    const drilldownTier = selectedCell && data
        ? data.tiers.find(t => t.tierIndex === selectedCell.tierIndex)
        : null;
    const drilldownViolation = selectedCell
        ? hasViolation(selectedCell.roomTypeId, selectedCell.tierIndex)
        : null;
    const drilldownRoomType = selectedCell && data
        ? data.roomTypes.find(rt => rt.id === selectedCell.roomTypeId)
        : null;

    // ── Active tier helpers
    const activeTier = data && data.activeTierIndex !== null ? data.tiers[data.activeTierIndex] : null;
    const occPctDisplay = data?.occPct !== null && data?.occPct !== undefined
        ? (data.occPct * 100).toFixed(0)
        : null;

    return (
        <div className="space-y-4">
            {/* ── Toolbar ────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Stay Date */}
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input
                        type="date"
                        value={stayDate}
                        onChange={(e) => setStayDate(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                    />
                </div>

                {/* Season */}
                <select
                    value={seasonOverride || ''}
                    onChange={(e) => setSeasonOverride(e.target.value || null)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                    <option value="">Season (auto)</option>
                    {seasons.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>

                {/* Channel */}
                <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="px-3 py-2 bg-[#204183] border border-[#204183] rounded-lg text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                    {channels.map(ch => (
                        <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                </select>

                {/* View Toggle */}
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
                    {(['net', 'bar', 'display'] as ViewMode[]).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-3 py-2 font-medium transition-colors ${viewMode === mode
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            {VIEW_LABELS[mode]}
                        </button>
                    ))}
                </div>

                {/* Export */}
                <button
                    onClick={handleExport}
                    disabled={!data}
                    className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Export
                </button>
            </div>

            {/* ── Guardrail Warnings ──────────────────────────── */}
            {data && data.violations.length > 0 && (
                <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-800">
                            {data.violations.length} vi phạm guardrail
                        </span>
                    </div>
                    <ul className="text-xs text-amber-700 space-y-0.5 ml-6">
                        {data.violations.slice(0, 5).map((v, i) => (
                            <li key={i}>• {v.message}</li>
                        ))}
                        {data.violations.length > 5 && (
                            <li className="text-amber-500">... và {data.violations.length - 5} vi phạm khác</li>
                        )}
                    </ul>
                </div>
            )}

            {/* ── Loading / Error ────────────────────────────────── */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    <span className="ml-2 text-sm text-slate-500">Đang tính giá...</span>
                </div>
            )}

            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertTriangle className="w-4 h-4 inline mr-1" /> {error}
                </div>
            )}

            {/* ── PROTOTYPE A: Card + Table Layout ────────────────── */}
            {data && !loading && data.tiers.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">

                    {/* ━━ Left: Context Card ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Card Header */}
                        <div className="px-5 py-3.5 border-b border-slate-100">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Tổng quan hiện tại
                            </h3>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* ── OCC Section ── */}
                            <div>
                                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Công suất phòng
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-bold text-slate-800">
                                        {occPctDisplay ? `${occPctDisplay}%` : 'N/A'}
                                    </span>
                                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                                            style={{ width: `${occPctDisplay || 0}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-1.5">
                                    Nguồn: {data.occSource === 'otb' ? 'OTB (tự động)' : data.occSource === 'override' ? 'Override' : 'Không có dữ liệu'}
                                </div>
                                {/* OCC Override inline */}
                                {data.occSource === 'unavailable' && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <input
                                            type="number"
                                            placeholder="Nhập OCC %"
                                            value={occOverride}
                                            onChange={(e) => setOccOverride(e.target.value)}
                                            className="w-24 px-2 py-1.5 border border-amber-300 rounded-lg text-xs text-center bg-white"
                                            min={0}
                                            max={100}
                                        />
                                    </div>
                                )}
                                {data.occSource === 'otb' && (
                                    <button
                                        onClick={() => {
                                            if (occOverride !== '') {
                                                setOccOverride('');
                                            } else {
                                                const current = data.occPct !== null ? (data.occPct * 100).toFixed(0) : '';
                                                setOccOverride(current);
                                            }
                                        }}
                                        className="text-[11px] text-indigo-500 hover:text-indigo-700 underline mt-1"
                                    >
                                        {occOverride !== '' ? 'Reset OCC' : 'Override OCC'}
                                    </button>
                                )}
                                {occOverride !== '' && data.occSource !== 'unavailable' && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={occOverride}
                                            onChange={(e) => setOccOverride(e.target.value)}
                                            className="w-20 px-2 py-1.5 border border-purple-300 rounded-lg text-xs text-center bg-white"
                                            min={0}
                                            max={100}
                                            placeholder="%"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-dashed border-slate-200" />

                            {/* ── Season Section ── */}
                            <div>
                                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Mùa vụ
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    <div>
                                        <div className="text-sm font-semibold text-slate-700">{data.season.name}</div>
                                        <div className="text-[11px] text-slate-400">
                                            {data.season.autoDetected && !seasonOverride ? 'Tự động theo cấu hình' : seasonOverride ? 'Override thủ công' : ''}
                                        </div>
                                    </div>
                                </div>
                                {seasonOverride && (
                                    <button
                                        onClick={() => setSeasonOverride(null)}
                                        className="text-[11px] text-indigo-500 hover:text-indigo-700 underline mt-1"
                                    >
                                        Reset về auto
                                    </button>
                                )}
                            </div>

                            <div className="border-t border-dashed border-slate-200" />

                            {/* ── Tier Section ── */}
                            <div>
                                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Bậc giá hiện tại
                                </div>
                                {activeTier ? (
                                    <>
                                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                                            <span className="text-sm font-semibold text-indigo-700">
                                                {activeTier.label}: {activeTier.occMin}–{activeTier.occMax}%
                                            </span>
                                        </div>
                                        <div className="text-xs text-indigo-500 font-medium mt-2">
                                            {activeTier.adjustmentType === 'FIXED'
                                                ? `Điều chỉnh: +${formatVND(activeTier.fixedAmount)}`
                                                : `Hệ số nhân: ×${activeTier.multiplier.toFixed(2)}`
                                            }
                                            {activeTier.adjustmentType === 'MULTIPLY' && activeTier.multiplier === 1 && ' (giữ nguyên)'}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-sm text-slate-400">Không xác định</div>
                                )}
                            </div>

                            <div className="border-t border-dashed border-slate-200" />

                            {/* ── Channel Section ── */}
                            <div>
                                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Kênh OTA
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-700">{data.channel.name}</span>
                                    <span className="text-xs font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
                                        HH {data.channel.commission}%
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-slate-200" />

                            {/* ── Effective Discount (display mode only) ── */}
                            {viewMode === 'display' && (
                                <>
                                    <div>
                                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                            Giảm giá hiệu lực
                                        </div>
                                        {(() => {
                                            if (data.activeTierIndex === null) return <span className="text-sm text-slate-400">N/A</span>;
                                            const discounts = data.roomTypes
                                                .map(rt => data.matrix[`${rt.id}:${data.activeTierIndex}`]?.effectiveDiscount)
                                                .filter((d): d is number => d !== undefined);
                                            if (discounts.length === 0) return null;
                                            const avg = discounts.reduce((a, b) => a + b, 0) / discounts.length;
                                            return (
                                                <span className="text-sm font-semibold text-emerald-600">
                                                    Trung bình: {(avg * 100).toFixed(0)}%
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    <div className="border-t border-dashed border-slate-200" />
                                </>
                            )}

                            {/* ── Config Button ── */}
                            <button
                                onClick={() => setShowConfig(!showConfig)}
                                className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${showConfig
                                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                                    : 'bg-slate-50 text-slate-500 border border-dashed border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                                    }`}
                            >
                                <Settings className="w-3.5 h-3.5" />
                                Cấu hình Mùa & Bậc giá
                            </button>
                        </div>
                    </div>

                    {/* ━━ Right: Table + Drill-down ━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    <div className="flex gap-4">
                        {/* Price Table */}
                        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${selectedCell ? 'flex-1 min-w-0' : 'w-full'}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead className="sticky top-0 z-10">
                                        <tr>
                                            <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3.5 text-left font-semibold text-slate-600 border-b-2 border-slate-200 min-w-[150px]">
                                                Hạng phòng
                                            </th>
                                            <th className="px-3 py-3.5 text-right font-medium text-slate-400 border-b-2 border-slate-200 bg-slate-50 min-w-[120px]">
                                                Giá thu về thấp nhất
                                            </th>
                                            {data.tiers.map(tier => {
                                                const isActive = tier.tierIndex === data.activeTierIndex;
                                                return (
                                                    <th
                                                        key={tier.tierIndex}
                                                        className={`px-3 py-3.5 text-center border-b-2 min-w-[110px] ${isActive
                                                            ? 'bg-indigo-50 border-b-indigo-200 border-t-[3px] border-t-indigo-500'
                                                            : 'bg-slate-50 border-b-slate-200'
                                                            }`}
                                                    >
                                                        <div className={`text-[13px] ${isActive ? 'font-bold text-indigo-700' : 'font-semibold text-slate-500'}`}>
                                                            {tier.label}
                                                        </div>
                                                        <div className={`text-[11px] mt-0.5 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>
                                                            {tier.adjustmentType === 'FIXED'
                                                                ? `+${formatVND(tier.fixedAmount)}`
                                                                : `×${tier.multiplier.toFixed(2)}`
                                                            }
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.roomTypes.map((rt, idx) => (
                                            <tr key={rt.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                                                <td className="sticky left-0 z-10 bg-inherit px-4 py-3.5 font-semibold text-slate-700 border-b border-slate-100">
                                                    {rt.name}
                                                </td>
                                                <td className="px-3 py-3.5 text-right text-slate-400 border-b border-slate-100 font-mono text-xs">
                                                    {formatVND(rt.netBase)}
                                                </td>
                                                {data.tiers.map(tier => {
                                                    const cell = data.matrix[`${rt.id}:${tier.tierIndex}`];
                                                    const violation = hasViolation(rt.id, tier.tierIndex);
                                                    const isActive = tier.tierIndex === data.activeTierIndex;
                                                    const isSelected = selectedCell?.roomTypeId === rt.id && selectedCell?.tierIndex === tier.tierIndex;

                                                    return (
                                                        <td
                                                            key={tier.tierIndex}
                                                            onClick={() => setSelectedCell(
                                                                isSelected ? null : { roomTypeId: rt.id, roomTypeName: rt.name, tierIndex: tier.tierIndex }
                                                            )}
                                                            className={`px-3 py-3.5 text-center border-b font-mono text-sm transition-all cursor-pointer ${violation
                                                                ? 'bg-red-50 text-red-700 border-l-[3px] border-l-red-500 border-b-slate-100'
                                                                : isSelected
                                                                    ? 'bg-indigo-100 text-indigo-900 font-bold border-b-indigo-200 ring-2 ring-indigo-400 ring-inset'
                                                                    : isActive
                                                                        ? 'bg-indigo-50/80 text-indigo-900 font-semibold border-b-indigo-100 border-l border-r border-l-indigo-100 border-r-indigo-100'
                                                                        : 'text-slate-300 border-b-slate-100 hover:bg-slate-50 hover:text-slate-500'
                                                                }`}
                                                            title={violation
                                                                ? `${violation.message}${violation.min !== undefined ? ` (min: ${formatVND(violation.min)})` : ''}${violation.max !== undefined ? ` (max: ${formatVND(violation.max)})` : ''}`
                                                                : 'Click để xem chi tiết'}
                                                        >
                                                            {cellValue(cell)}
                                                            {violation && <AlertTriangle className="w-3 h-3 text-red-500 inline ml-1" />}
                                                            {cell && viewMode === 'display' && cell.effectiveDiscount > 0 && (
                                                                <div className="text-[10px] text-slate-400 font-normal font-sans">
                                                                    -{(cell.effectiveDiscount * 100).toFixed(0)}%
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ── Cell Drill-Down Panel ────────────────── */}
                        {selectedCell && drilldownCell && drilldownTier && drilldownRoomType && (
                            <div className="w-[320px] shrink-0 border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                                    <div>
                                        <div className="font-semibold text-slate-800 text-sm">{selectedCell.roomTypeName}</div>
                                        <div className="text-xs text-slate-500">Tier: {drilldownTier.label} ({drilldownTier.adjustmentType === 'FIXED' ? `+${formatVND(drilldownTier.fixedAmount)}` : `×${drilldownTier.multiplier.toFixed(2)}`})</div>
                                    </div>
                                    <button onClick={() => setSelectedCell(null)} className="p-1 hover:bg-slate-200 rounded">
                                        <X className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>

                                {/* Trace */}
                                <div className="px-4 py-3 space-y-2">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phân tích giá</h4>
                                    {drilldownCell.trace && drilldownCell.trace.length > 0 ? (
                                        <div className="space-y-1.5">
                                            {drilldownCell.trace.map((t, i) => (
                                                <div key={i} className="flex items-start gap-2">
                                                    <ChevronRight className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-slate-600">{t.description}</div>
                                                        <div className="text-sm font-mono font-medium text-slate-800">
                                                            {formatVND(t.priceAfter)} đ
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600">NET base ({data.season.name})</span>
                                                <span className="font-mono">{formatVND(drilldownRoomType.netBase)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600">{drilldownTier.adjustmentType === 'FIXED' ? `+ Cộng thêm (+${formatVND(drilldownTier.fixedAmount)})` : `× Multiplier (×${drilldownTier.multiplier.toFixed(2)})`}</span>
                                                <span className="font-mono">{formatVND(drilldownCell.net)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600">BAR ({data.channel.name} {(data.channel.commission * 100).toFixed(0)}%)</span>
                                                <span className="font-mono">{formatVND(drilldownCell.bar)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600">Display (KM -{(drilldownCell.effectiveDiscount * 100).toFixed(0)}%)</span>
                                                <span className="font-mono">{formatVND(drilldownCell.display)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Guardrail Status */}
                                <div className="px-4 py-3 border-t border-slate-100">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Guardrail</h4>
                                    {drilldownViolation ? (
                                        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                            <div className="text-xs text-red-700">
                                                {drilldownViolation.message}
                                                {drilldownViolation.min !== undefined && (
                                                    <div className="mt-1 text-red-500">Min: {formatVND(drilldownViolation.min)} đ</div>
                                                )}
                                                {drilldownViolation.max !== undefined && (
                                                    <div className="mt-0.5 text-red-500">Max: {formatVND(drilldownViolation.max)} đ</div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                                            <span className="text-emerald-600 text-sm font-medium">OK</span>
                                            <span className="text-xs text-emerald-700">
                                                min {formatVND(data.guardrails.minRate)} / max {formatVND(data.guardrails.maxRate)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Effective Discount */}
                                <div className="px-4 py-3 border-t border-slate-100">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Effective Discount</span>
                                        <span className={`font-medium ${drilldownCell.effectiveDiscount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {(drilldownCell.effectiveDiscount * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    {drilldownCell.effectiveDiscount === 0 && (
                                        <p className="text-[10px] text-slate-400 mt-1">BAR = Display (không có khuyến mãi)</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Config Modal ───────────────────────────────────── */}
            {showConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowConfig(false)}
                    />
                    {/* Modal */}
                    <div className="relative w-full max-w-4xl mx-4 max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                    <Settings className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-slate-800">Cấu hình Mùa & Bậc giá</h2>
                                    <p className="text-xs text-slate-400">Thiết lập season và occupancy tiers cho khách sạn</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowConfig(false)}
                                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <SeasonConfigPanel onSeasonsChange={() => {
                                    fetch('/api/pricing/seasons').then(r => r.json()).then(setSeasons).catch(() => { });
                                    fetchMatrix();
                                }} />
                                <OccTierEditor onTiersChange={fetchMatrix} />
                            </div>
                        </div>
                        {/* Modal Footer */}
                        <div className="flex justify-end px-6 py-3 border-t border-slate-200 bg-slate-50/80 shrink-0">
                            <button
                                onClick={() => setShowConfig(false)}
                                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {data && data.tiers.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-500">
                    <Settings className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="font-medium">Chưa cấu hình OCC Tiers</p>
                    <p className="text-sm mt-1">Bấm nút Cấu hình ở card bên trái để thiết lập bậc giá theo OCC%</p>
                </div>
            )}
        </div>
    );
}
