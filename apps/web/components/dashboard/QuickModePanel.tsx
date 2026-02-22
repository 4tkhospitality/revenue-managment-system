'use client';

import { useState, useMemo } from 'react';
import { Check, Ban, ArrowUp, ArrowDown, Minus, AlertTriangle, Info } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

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
    currentOcc: number | null;
    zone: string | null;
    isAccepted: boolean;
    decisionId: string | null;
}

interface QuickModePanelProps {
    data: QuickModeRecommendation[];
    onAcceptAll: () => Promise<void>;
    onAcceptOne: (stayDate: string) => Promise<void>;
}

// ─── UUPM Surface ───────────────────────────────────────────────

const surface = "rounded-[var(--card-radius)] bg-white border border-slate-200/80 shadow-[var(--shadow-card)]";

// ─── Helpers ────────────────────────────────────────────────────

function formatVND(value: number): string {
    return new Intl.NumberFormat('en-US').format(Math.round(value)) + ' ₫';
}

function formatDateLocale(dateStr: string, locale: string): string {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const weekday = d.toLocaleDateString(locale, { weekday: 'short' });
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    return `${weekday} ${day}/${month}${isWeekend ? ' 🟡' : ''}`;
}

// ─── Component ──────────────────────────────────────────────────

export function QuickModePanel({ data, onAcceptAll, onAcceptOne }: QuickModePanelProps) {
    const t = useTranslations('quickMode');
    const locale = useLocale();
    const [acceptingAll, setAcceptingAll] = useState(false);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);

    function getLocalizedReason(row: QuickModeRecommendation): string {
        const code = row.reasonCode;
        const otb = row.currentOcc != null ? `${(row.currentOcc * 100).toFixed(0)}%` : '—';
        const proj = row.projectedOcc != null ? `${(row.projectedOcc * 100).toFixed(0)}%` : '—';
        const sign = (row.deltaPct ?? 0) > 0 ? '+' : '';
        const delta = row.deltaPct != null ? `${sign}${row.deltaPct.toFixed(1)}%` : '—';
        const zone = row.zone ?? '';

        switch (code) {
            case 'HIGH_OCC':
                return t('reasonHighOcc', { otb, proj, delta });
            case 'STRONG_DEMAND':
                return t('reasonStrongDemand', { zone, otb, delta });
            case 'LOW_PICKUP':
                return t('reasonLowPickup', { otb, proj, delta });
            case 'LOW_SUPPLY':
                return t('reasonLowSupply', { otb, delta });
            case 'STABLE':
                return t('reasonStable');
            case 'STOP_SELL':
                return t('reasonStopSell');
            case 'MISSING_PRICE':
                return t('reasonMissingPrice');
            default:
                return row.reasonTextVi || '—';
        }
    }

    function getActionBadge(action: string | null) {
        const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium";
        switch (action) {
            case 'INCREASE':
                return (<span className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-200`}><ArrowUp className="w-3 h-3" /> {t('increase')}</span>);
            case 'DECREASE':
                return (<span className={`${base} bg-amber-50 text-amber-700 border border-amber-200`}><ArrowDown className="w-3 h-3" /> {t('decrease')}</span>);
            case 'KEEP':
                return (<span className={`${base} bg-slate-50 text-slate-600 border border-slate-200`}><Minus className="w-3 h-3" /> {t('keep')}</span>);
            case 'STOP_SELL':
                return (<span className={`${base} bg-rose-50 text-rose-700 border border-rose-200`}><Ban className="w-3 h-3" /> {t('stopSell')}</span>);
            default:
                return (<span className={`${base} bg-slate-50 text-slate-400 border border-slate-200`}><Info className="w-3 h-3" /> {t('notAnalyzed')}</span>);
        }
    }

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
        try { await onAcceptAll(); } finally { setAcceptingAll(false); }
    };

    const handleAcceptOne = async (stayDate: string) => {
        setAcceptingId(stayDate);
        try { await onAcceptOne(stayDate); } finally { setAcceptingId(null); }
    };

    const pendingCount = data.filter(d => !d.isAccepted && d.action !== 'STOP_SELL' && d.action !== null).length;

    return (
        <div className="space-y-4">
            {/* ── Summary Cards ─────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <SummaryCard label={t('totalDays')} value={summary.total} color="text-slate-900" />
                <SummaryCard label={t('priceUp')} value={summary.increase} color="text-emerald-600" accent="border-l-emerald-500" />
                <SummaryCard label={t('holdPrice')} value={summary.keep} color="text-slate-500" accent="border-l-slate-400" />
                <SummaryCard label={t('priceDown')} value={summary.decrease} color="text-amber-600" accent="border-l-amber-500" />
                <SummaryCard label={t('stopSell')} value={summary.stopSell} color="text-rose-600" accent="border-l-rose-500" />
            </div>

            {/* ── Accept All Bar ─────────────────────────────────── */}
            {pendingCount > 0 && (
                <div className={`${surface} px-5 py-3 flex items-center justify-between`}>
                    <div className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">{pendingCount}</span> {t('pendingDays', { count: '' })}
                        <span className="text-xs text-slate-400 ml-2">{t('skipStopSell')}</span>
                    </div>
                    <button
                        onClick={handleAcceptAll}
                        disabled={acceptingAll}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer
                            text-white disabled:opacity-50"
                        style={{ backgroundColor: acceptingAll ? '#94A3B8' : '#1E3A8A' }}
                    >
                        <Check className="w-4 h-4" />
                        {acceptingAll ? t('approving') : t('approveAll', { count: pendingCount })}
                    </button>
                </div>
            )}

            {/* ── Table ──────────────────────────────────────────── */}
            <div className={`${surface} overflow-hidden`}>
                <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10">
                            <tr style={{ backgroundColor: '#f8fafc' }} className="text-left">
                                <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider sticky left-0" style={{ backgroundColor: '#f8fafc' }}>
                                    {t('colDate')}
                                </th>
                                <th className="px-3 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">
                                    {t('colAction')}
                                </th>
                                <th className="px-3 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">
                                    {t('colCurrent')}
                                </th>
                                <th className="px-3 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">
                                    {t('colSuggested')}
                                </th>
                                <th className="px-3 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">
                                    {t('colChange')}
                                </th>
                                <th className="px-3 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider text-left">
                                    {t('colReason')}
                                </th>
                                <th className="px-3 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">
                                    {t('colApprove')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                                        {t('noData')}
                                    </td>
                                </tr>
                            ) : data.map((row) => {
                                const isStopSell = row.action === 'STOP_SELL';
                                const isLegacy = row.action === null;

                                return (
                                    <tr
                                        key={row.stayDate}
                                        className={`transition-colors border-t border-slate-100
                                            ${isStopSell ? 'bg-rose-50/50' : 'hover:bg-slate-50'}
                                            ${row.isAccepted ? 'opacity-50' : ''}
                                        `}
                                    >
                                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap sticky left-0 bg-inherit">
                                            {formatDateLocale(row.stayDate, locale)}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            {getActionBadge(row.action)}
                                        </td>
                                        <td className="px-3 py-3 text-right text-slate-600 font-[family-name:var(--font-mono)] tabular-nums">
                                            {formatVND(row.currentPrice)}
                                        </td>
                                        <td className={`px-3 py-3 text-right font-[family-name:var(--font-mono)] tabular-nums font-semibold ${isStopSell ? 'text-rose-600' :
                                            row.action === 'INCREASE' ? 'text-emerald-700' :
                                                row.action === 'DECREASE' ? 'text-amber-700' :
                                                    'text-slate-600'
                                            }`}>
                                            {isStopSell ? '—' : formatVND(row.recommendedPrice)}
                                        </td>
                                        <td className={`px-3 py-3 text-right font-[family-name:var(--font-mono)] tabular-nums text-xs ${row.deltaPct != null && row.deltaPct > 0 ? 'text-emerald-600' :
                                            row.deltaPct != null && row.deltaPct < 0 ? 'text-amber-600' :
                                                'text-slate-400'
                                            }`}>
                                            {row.deltaPct != null
                                                ? `${row.deltaPct > 0 ? '+' : ''}${Number(row.deltaPct).toFixed(2)}%`
                                                : '—'
                                            }
                                        </td>
                                        <td className="px-3 py-3 text-slate-500 text-xs max-w-[200px] truncate">
                                            {isStopSell && (
                                                <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {t('stopSellReason')}
                                                </span>
                                            )}
                                            {!isStopSell && (row.reasonCode ? getLocalizedReason(row) : (isLegacy ? t('legacyReason') : '—'))}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            {row.isAccepted ? (
                                                <span className="text-xs text-emerald-600 font-medium">{t('approved')}</span>
                                            ) : isStopSell ? (
                                                <span className="text-xs text-slate-400" title={t('stopSell')}>
                                                    <Ban className="w-4 h-4 inline text-slate-300" />
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleAcceptOne(row.stayDate)}
                                                    disabled={acceptingId === row.stayDate}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                                                        text-white cursor-pointer disabled:opacity-50"
                                                    style={{ backgroundColor: '#1E3A8A' }}
                                                >
                                                    {acceptingId === row.stayDate ? '...' : t('approve')}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer — legend */}
                <div className="px-4 py-3 border-t bg-slate-50/50 border-slate-100">
                    <div className="flex items-center gap-4 text-[10px] text-slate-400">
                        <span>{t('legendWeekend')}</span>
                        <span>{t('legendStopSell')}</span>
                        <span>{t('legendSource')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Summary Card ────────────────────────────────────────────────

function SummaryCard({ label, value, color, accent }: {
    label: string; value: number; color: string; accent?: string;
}) {
    return (
        <div className={`${surface} px-4 py-3 ${accent ? `border-l-4 ${accent}` : ''}`}>
            <div className={`text-2xl font-bold ${color} tabular-nums`}>{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
        </div>
    );
}
