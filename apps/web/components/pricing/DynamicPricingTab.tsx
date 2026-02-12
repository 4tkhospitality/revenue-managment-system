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
    tiers: { tierIndex: number; occMin: number; occMax: number; multiplier: number; label: string }[];
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
            `# OCC: ${data.occPct !== null ? `${(data.occPct * 100).toFixed(0)}%` : 'N/A'} (${data.occSource}) | Active Tier: ${activeTier ? `${activeTier.label} (×${activeTier.multiplier.toFixed(2)})` : 'N/A'}`,
            `# Generated: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
            `# Currency: VND | Rounding: 1000`,
            `# View: ${VIEW_LABELS[viewMode]}`,
            '',
        ];

        // Column headers depend on view mode
        const headers = ['Hạng phòng', 'NET cơ sở', ...data.tiers.map(t => `${VIEW_LABELS[viewMode]} ${t.label}`)];
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

    return (
        <div className="space-y-4">
            {/* ── Controls Row ────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Stay Date */}
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <input
                        type="date"
                        value={stayDate}
                        onChange={(e) => setStayDate(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>

                {/* Season */}
                <select
                    value={seasonOverride || ''}
                    onChange={(e) => setSeasonOverride(e.target.value || null)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                    <option value="">🗓️ Season (auto)</option>
                    {seasons.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>

                {/* Channel */}
                <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="px-3 py-2 bg-[#204183] border border-[#204183] rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                    {channels.map(ch => (
                        <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                </select>

                {/* View Toggle */}
                <div className="flex rounded-lg border border-slate-300 overflow-hidden text-sm">
                    {(['net', 'bar', 'display'] as ViewMode[]).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-3 py-2 transition-colors ${viewMode === mode
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {VIEW_LABELS[mode]}
                        </button>
                    ))}
                </div>

                {/* Config toggle */}
                <button
                    onClick={() => setShowConfig(!showConfig)}
                    className={`p-2 rounded-lg transition-colors ${showConfig ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    title="Cấu hình Season & OCC"
                >
                    <Settings className="w-4 h-4" />
                </button>

                {/* Export */}
                <button
                    onClick={handleExport}
                    disabled={!data}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white text-sm rounded-lg transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Export
                </button>
            </div>

            {/* ── Context Bar Chips (P0) ──────────────────────── */}
            {data && (
                <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    {/* OCC Chip */}
                    {data.occSource === 'unavailable' ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                            <TrendingUp className="w-3.5 h-3.5" />
                            OCC: N/A
                            <input
                                type="number"
                                placeholder="%"
                                value={occOverride}
                                onChange={(e) => setOccOverride(e.target.value)}
                                className="w-14 px-1.5 py-0.5 border border-amber-300 rounded text-xs text-center bg-white"
                                min={0}
                                max={100}
                            />
                        </span>
                    ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${occOverride !== '' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            <TrendingUp className="w-3.5 h-3.5" />
                            OCC: {data.occPct !== null ? `${(data.occPct * 100).toFixed(0)}%` : '—'}
                            <span className="text-xs font-normal opacity-70">
                                ({data.occSource === 'otb' ? 'OTB' : 'Override'})
                            </span>
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
                                    className="text-xs underline opacity-60 hover:opacity-100"
                                >
                                    {occOverride !== '' ? '✕ Reset' : 'Override'}
                                </button>
                            )}
                        </span>
                    )}
                    {occOverride !== '' && data.occSource !== 'unavailable' && (
                        <input
                            type="number"
                            value={occOverride}
                            onChange={(e) => setOccOverride(e.target.value)}
                            className="w-16 px-2 py-1 border border-purple-300 rounded text-sm text-center bg-white"
                            min={0}
                            max={100}
                            placeholder="%"
                        />
                    )}

                    {/* Season Chip */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${seasonOverride ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                        🗓️ {data.season.name}
                        {data.season.autoDetected && !seasonOverride && (
                            <span className="text-xs font-normal opacity-70">(auto)</span>
                        )}
                        {seasonOverride && (
                            <button
                                onClick={() => setSeasonOverride(null)}
                                className="text-xs underline opacity-60 hover:opacity-100"
                            >
                                ✕ Reset
                            </button>
                        )}
                    </span>

                    {/* Active Tier Chip */}
                    {data.activeTierIndex !== null && data.tiers[data.activeTierIndex] && (
                        <span
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium cursor-help"
                            title={`Bậc [${data.tiers[data.activeTierIndex].occMin}%, ${data.tiers[data.activeTierIndex].occMax}%) — biên trái đóng, biên phải mở`}
                        >
                            ★ Tier: {data.tiers[data.activeTierIndex].label} (×{data.tiers[data.activeTierIndex].multiplier.toFixed(2)})
                        </span>
                    )}

                    {/* Effective Discount (P0 #3) */}
                    {viewMode === 'display' && (
                        <span className="ml-auto text-xs text-slate-400">
                            {(() => {
                                // Show average effective discount across active tier
                                if (data.activeTierIndex === null) return null;
                                const discounts = data.roomTypes
                                    .map(rt => data.matrix[`${rt.id}:${data.activeTierIndex}`]?.effectiveDiscount)
                                    .filter((d): d is number => d !== undefined);
                                if (discounts.length === 0) return null;
                                const avg = discounts.reduce((a, b) => a + b, 0) / discounts.length;
                                return `Effective discount: ${(avg * 100).toFixed(0)}%`;
                            })()}
                        </span>
                    )}
                </div>
            )}

            {/* ── Guardrail Warnings ──────────────────────────── */}
            {data && data.violations.length > 0 && (
                <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-800">
                            ⚠️ {data.violations.length} vi phạm guardrail
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

            {/* ── Config Panels (collapsible) ───────────────────── */}
            {showConfig && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <SeasonConfigPanel onSeasonsChange={() => {
                        fetch('/api/pricing/seasons').then(r => r.json()).then(setSeasons).catch(() => { });
                        fetchMatrix();
                    }} />
                    <OccTierEditor onTiersChange={fetchMatrix} />
                </div>
            )}

            {/* ── Loading / Error ────────────────────────────────── */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-slate-500">Đang tính giá...</span>
                </div>
            )}

            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    ❌ {error}
                </div>
            )}

            {/* ── Matrix Table + Drill-down Panel ────────────────── */}
            {data && !loading && data.tiers.length > 0 && (
                <div className="flex gap-4">
                    {/* Table */}
                    <div className={`overflow-x-auto ${selectedCell ? 'flex-1 min-w-0' : 'w-full'}`}>
                        <table className="w-full border-collapse text-sm">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-50">
                                    <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700 border border-slate-200 min-w-[160px]">
                                        Hạng phòng
                                    </th>
                                    <th className="px-3 py-3 text-right font-medium text-slate-500 border border-slate-200 min-w-[100px]">
                                        NET cơ sở
                                    </th>
                                    {data.tiers.map(tier => (
                                        <th
                                            key={tier.tierIndex}
                                            className={`px-3 py-3 text-center border border-slate-200 min-w-[110px] ${tier.tierIndex === data.activeTierIndex
                                                ? 'bg-blue-100 text-blue-800 font-bold'
                                                : 'bg-slate-50 text-slate-600 font-medium'
                                                }`}
                                        >
                                            <div>{tier.label}</div>
                                            <div className={`text-xs ${tier.tierIndex === data.activeTierIndex ? 'text-blue-600' : 'text-slate-400'}`}>
                                                ×{tier.multiplier.toFixed(2)}
                                                {tier.tierIndex === data.activeTierIndex && ' ★'}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.roomTypes.map((rt, idx) => (
                                    <tr key={rt.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                        <td className="sticky left-0 z-10 bg-inherit px-4 py-3 font-medium text-slate-700 border border-slate-200">
                                            {rt.name}
                                        </td>
                                        <td className="px-3 py-3 text-right text-slate-500 border border-slate-200 font-mono text-xs">
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
                                                    className={`px-3 py-3 text-right border font-mono text-sm transition-colors cursor-pointer hover:bg-blue-50/50 ${violation
                                                        ? 'bg-red-50 text-red-700 border-l-[3px] border-l-red-500 border-t-slate-200 border-r-slate-200 border-b-slate-200'
                                                        : isSelected
                                                            ? 'bg-blue-100 text-blue-900 font-semibold border-blue-300 ring-2 ring-blue-400 ring-inset'
                                                            : isActive
                                                                ? 'bg-blue-50 text-blue-900 font-semibold border-slate-200'
                                                                : 'text-slate-700 border-slate-200'
                                                        }`}
                                                    title={violation
                                                        ? `⚠️ ${violation.message}${violation.min !== undefined ? ` (min: ${formatVND(violation.min)})` : ''}${violation.max !== undefined ? ` (max: ${formatVND(violation.max)})` : ''}`
                                                        : `Click để xem chi tiết`}
                                                >
                                                    {cellValue(cell)}
                                                    {violation && <span className="ml-1 text-red-500">⚠️</span>}
                                                    {isActive && !violation && <span className="ml-1">★</span>}
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

                    {/* ── Cell Drill-Down Panel (P1) ────────────────── */}
                    {selectedCell && drilldownCell && drilldownTier && drilldownRoomType && (
                        <div className="w-[320px] shrink-0 border border-slate-200 rounded-xl bg-white shadow-lg overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                                <div>
                                    <div className="font-semibold text-slate-800 text-sm">{selectedCell.roomTypeName}</div>
                                    <div className="text-xs text-slate-500">Tier: {drilldownTier.label} (×{drilldownTier.multiplier.toFixed(2)})</div>
                                </div>
                                <button onClick={() => setSelectedCell(null)} className="p-1 hover:bg-slate-200 rounded">
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>

                            {/* Trace (read-only from API) */}
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
                                            <span className="text-slate-600">× Multiplier (×{drilldownTier.multiplier.toFixed(2)})</span>
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
                                        <span className="text-emerald-600 text-sm">✅</span>
                                        <span className="text-xs text-emerald-700">
                                            OK — min {formatVND(data.guardrails.minRate)} / max {formatVND(data.guardrails.maxRate)}
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
            )}

            {/* Empty state */}
            {data && data.tiers.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-500">
                    <Settings className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="font-medium">Chưa cấu hình OCC Tiers</p>
                    <p className="text-sm mt-1">Bấm ⚙️ Config để thiết lập bậc giá theo OCC%</p>
                </div>
            )}
        </div>
    );
}
