'use client';

import { useState, useMemo } from 'react';
import { Check, Ban, ArrowUp, ArrowDown, Minus, AlertTriangle } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────

export interface QuickModeRecommendation {
    stayDate: string;
    action: 'INCREASE' | 'KEEP' | 'DECREASE' | 'STOP_SELL' | null;
    currentPrice: number;
    recommendedPrice: number;
    deltaPct: number | null;
    reasonTextVi: string | null;
    reasonCode: string | null;
    projectedOcc: number | null;
    isAccepted: boolean;
    decisionId: string | null;
}

interface QuickModePanelProps {
    data: QuickModeRecommendation[];
    onAcceptAll: () => Promise<void>;
    onAcceptOne: (stayDate: string) => Promise<void>;
}

// ─── Helpers ────────────────────────────────────────────────────

function formatVND(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(Math.round(value));
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
    return `${weekday} ${day}/${month}`;
}

function getActionBadge(action: string | null) {
    switch (action) {
        case 'INCREASE':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    <ArrowUp className="w-3 h-3" /> Tăng
                </span>
            );
        case 'DECREASE':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    <ArrowDown className="w-3 h-3" /> Giảm
                </span>
            );
        case 'KEEP':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/15 text-gray-400 border border-gray-500/20">
                    <Minus className="w-3 h-3" /> Giữ
                </span>
            );
        case 'STOP_SELL':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20">
                    <Ban className="w-3 h-3" /> Ngừng bán
                </span>
            );
        default: // L9: legacy null action
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-500 border border-gray-500/15">
                    <Minus className="w-3 h-3" /> (legacy)
                </span>
            );
    }
}

// ─── Component ──────────────────────────────────────────────────

export function QuickModePanel({ data, onAcceptAll, onAcceptOne }: QuickModePanelProps) {
    const [acceptingAll, setAcceptingAll] = useState(false);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);

    // Summary counts
    const summary = useMemo(() => {
        const counts = { total: data.length, increase: 0, keep: 0, decrease: 0, stopSell: 0 };
        for (const d of data) {
            if (d.action === 'INCREASE') counts.increase++;
            else if (d.action === 'DECREASE') counts.decrease++;
            else if (d.action === 'STOP_SELL') counts.stopSell++;
            else counts.keep++; // KEEP + null (legacy)
        }
        return counts;
    }, [data]);

    const handleAcceptAll = async () => {
        setAcceptingAll(true);
        try {
            await onAcceptAll();
        } finally {
            setAcceptingAll(false);
        }
    };

    const handleAcceptOne = async (stayDate: string) => {
        setAcceptingId(stayDate);
        try {
            await onAcceptOne(stayDate);
        } finally {
            setAcceptingId(null);
        }
    };

    const pendingCount = data.filter(d => !d.isAccepted && d.action !== 'STOP_SELL' && d.action !== null).length;

    return (
        <div className="space-y-4">
            {/* ── Summary Cards (5) ─────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <SummaryCard label="Tổng" value={summary.total} color="text-white" bg="bg-gray-800/50" />
                <SummaryCard label="↑ Tăng" value={summary.increase} color="text-emerald-400" bg="bg-emerald-500/10" />
                <SummaryCard label="→ Giữ" value={summary.keep} color="text-gray-400" bg="bg-gray-500/10" />
                <SummaryCard label="↓ Giảm" value={summary.decrease} color="text-amber-400" bg="bg-amber-500/10" />
                <SummaryCard label="⛔ Ngừng bán" value={summary.stopSell} color="text-red-400" bg="bg-red-500/10" />
            </div>

            {/* ── Accept All Button ──────────────────────────────── */}
            {pendingCount > 0 && (
                <div className="flex items-center justify-between bg-gray-800/30 rounded-lg px-4 py-3 border border-gray-700/50">
                    <span className="text-sm text-gray-400">
                        {pendingCount} ngày chưa duyệt (bỏ qua NGỪNG BÁN)
                    </span>
                    <button
                        onClick={handleAcceptAll}
                        disabled={acceptingAll}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        {acceptingAll ? 'Đang duyệt...' : `Duyệt tất cả (${pendingCount})`}
                    </button>
                </div>
            )}

            {/* ── Table ──────────────────────────────────────────── */}
            <div className="overflow-x-auto rounded-lg border border-gray-700/50">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="text-left px-4 py-3">Ngày</th>
                            <th className="text-center px-3 py-3">Hành động</th>
                            <th className="text-right px-3 py-3">Giá hiện tại</th>
                            <th className="text-right px-3 py-3">Giá đề xuất</th>
                            <th className="text-right px-3 py-3">Delta</th>
                            <th className="text-left px-3 py-3">Lý do</th>
                            <th className="text-center px-3 py-3">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/30">
                        {data.map((row) => {
                            const isStopSell = row.action === 'STOP_SELL';
                            const isLegacy = row.action === null;
                            const isDisabled = isStopSell;

                            return (
                                <tr
                                    key={row.stayDate}
                                    className={`
                                        transition-colors
                                        ${isStopSell ? 'bg-red-950/20' : 'hover:bg-gray-800/30'}
                                        ${row.isAccepted ? 'opacity-60' : ''}
                                    `}
                                >
                                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                                        {formatDate(row.stayDate)}
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        {getActionBadge(row.action)}
                                    </td>
                                    <td className="px-3 py-3 text-right text-gray-300 font-mono tabular-nums">
                                        {formatVND(row.currentPrice)}
                                    </td>
                                    <td className={`px-3 py-3 text-right font-mono tabular-nums font-medium ${isStopSell ? 'text-red-400' :
                                            row.action === 'INCREASE' ? 'text-emerald-400' :
                                                row.action === 'DECREASE' ? 'text-amber-400' :
                                                    'text-gray-300'
                                        }`}>
                                        {isStopSell ? '—' : formatVND(row.recommendedPrice)}
                                    </td>
                                    <td className={`px-3 py-3 text-right font-mono tabular-nums text-xs ${row.deltaPct != null && row.deltaPct > 0 ? 'text-emerald-400' :
                                            row.deltaPct != null && row.deltaPct < 0 ? 'text-amber-400' :
                                                'text-gray-500'
                                        }`}>
                                        {row.deltaPct != null
                                            ? `${row.deltaPct > 0 ? '+' : ''}${Number(row.deltaPct).toFixed(2)}%`
                                            : '—'
                                        }
                                    </td>
                                    <td className="px-3 py-3 text-gray-400 text-xs max-w-[200px] truncate">
                                        {isStopSell && (
                                            <span className="inline-flex items-center gap-1 text-red-400">
                                                <AlertTriangle className="w-3 h-3" />
                                                System forced
                                            </span>
                                        )}
                                        {!isStopSell && (row.reasonTextVi || (isLegacy ? 'Dữ liệu cũ' : '—'))}
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        {row.isAccepted ? (
                                            <span className="text-xs text-emerald-400">✓ Đã duyệt</span>
                                        ) : isDisabled ? (
                                            <button disabled className="px-3 py-1.5 text-xs bg-gray-700/50 text-gray-500 rounded cursor-not-allowed">
                                                <Ban className="w-3 h-3 inline" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAcceptOne(row.stayDate)}
                                                disabled={acceptingId === row.stayDate}
                                                className="px-3 py-1.5 text-xs bg-blue-600/80 hover:bg-blue-600 text-white rounded transition-colors disabled:opacity-50"
                                            >
                                                {acceptingId === row.stayDate ? '...' : 'Duyệt'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Summary Card Sub-component ─────────────────────────────────

function SummaryCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
    return (
        <div className={`${bg} border border-gray-700/30 rounded-lg px-4 py-3 text-center`}>
            <div className={`text-2xl font-bold ${color} tabular-nums`}>{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
        </div>
    );
}
