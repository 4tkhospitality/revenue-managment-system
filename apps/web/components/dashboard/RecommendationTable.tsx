'use client';

import { useState, useMemo } from 'react';
import { Check, X, Calendar, ArrowUp, ArrowDown, Minus, Ban, Info, AlertTriangle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface Recommendation {
    id: string;
    stayDate: string;
    roomsOtb: number;
    remaining: number;
    forecast: number;
    currentPrice: number;   // anchor (Option E: last_accepted or rack_rate)
    adr?: number;           // ADR = Revenue/Rooms (reference only)
    recommendedPrice: number;
    isStopSell: boolean;
    action: 'INCREASE' | 'KEEP' | 'DECREASE' | 'STOP_SELL' | null;
    deltaPct: number | null;
    reasonTextVi: string | null;
    reasonCode: string | null;
    currentOcc: number | null;
    zone: string | null;
    source?: 'PIPELINE' | 'FALLBACK';
}

interface RecommendationTableProps {
    data: Recommendation[];
    onAccept: (id: string) => void;
    onOverride: (id: string) => void;
}

type QuickFilter = 'today' | '7days' | '14days' | '30days' | 'custom';

// ─── UUPM Surface ───────────────────────────────────────────────
const surface = "rounded-[var(--card-radius)] bg-white border border-slate-200/80 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200";

// ─── Helpers ────────────────────────────────────────────────────

function getActionBadge(action: string | null, t: (key: string) => string) {
    const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap";
    switch (action) {
        case 'INCREASE':
            return <span className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-200`}><ArrowUp className="w-3 h-3" /> {t('increase')}</span>;
        case 'DECREASE':
            return <span className={`${base} bg-amber-50 text-amber-700 border border-amber-200`}><ArrowDown className="w-3 h-3" /> {t('decrease')}</span>;
        case 'KEEP':
            return <span className={`${base} bg-slate-50 text-slate-600 border border-slate-200`}><Minus className="w-3 h-3" /> {t('hold')}</span>;
        case 'STOP_SELL':
            return <span className={`${base} bg-rose-50 text-rose-700 border border-rose-200`}><Ban className="w-3 h-3" /> {t('stopSelling')}</span>;
        default:
            return <span className={`${base} bg-slate-50 text-slate-400 border border-slate-200`}><Info className="w-3 h-3" /> —</span>;
    }
}

export function RecommendationTable({
    data,
    onAccept,
    onOverride,
}: RecommendationTableProps) {
    const t = useTranslations('dashboard');
    const locale = useLocale();
    const [quickFilter, setQuickFilter] = useState<QuickFilter>('14days');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');

    function getLocalizedReason(row: Recommendation): string {
        const code = row.reasonCode;
        if (!code) return row.reasonTextVi || '—';
        const otb = row.currentOcc != null ? `${(row.currentOcc * 100).toFixed(0)}%` : '—';
        const proj = row.forecast > 0 ? `${Math.round(row.forecast)}` : '—';
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

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'decimal',
            minimumFractionDigits: 0,
        }).format(value) + ' ₫';

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const dayOfWeek = date.toLocaleDateString(locale, { weekday: 'short' });
        const formatted = date.toLocaleDateString(locale, {
            day: '2-digit',
            month: '2-digit',
        });
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        return { formatted, dayOfWeek, isWeekend };
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
        { key: 'today', label: t('today') },
        { key: '7days', label: t('days7') },
        { key: '14days', label: t('days14') },
        { key: '30days', label: t('days30') },
        { key: 'custom', label: t('custom') },
    ];

    return (
        <div className={`${surface} overflow-hidden`}>
            {/* ⚠️ Fallback warning banner */}
            {filteredData.some(r => r.source === 'FALLBACK') && (
                <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="font-medium">{t('fallbackEstimate')}</span>
                        {t('fallbackDays', { n: filteredData.filter(r => r.source === 'FALLBACK').length })}
                    </div>
                </div>
            )}
            {/* ⚠️ ADR sanity divergence banner */}
            {(() => {
                const divergentRows = filteredData.filter(r => {
                    if (!r.adr || r.adr <= 0 || r.roomsOtb < 10) return false;
                    const divergence = Math.abs(r.adr - r.currentPrice) / r.currentPrice;
                    return divergence > 0.3;
                });
                if (divergentRows.length === 0) return null;
                return (
                    <div className="mx-5 mt-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <span className="font-medium">{t('adrDivergence')}</span>
                            {t('adrDivergenceDetail', { n: divergentRows.length })}
                        </div>
                    </div>
                );
            })()}
            {/* Header with Filters */}
            <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {t('perfAndSuggestions')}
                    </h2>

                    {/* Quick Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                            {quickFilterButtons.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setQuickFilter(key)}
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${quickFilter === key
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
                            <label className="text-xs text-gray-500">{t('fromLabel')}</label>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500">{t('toLabel')}</label>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <span className="text-xs text-gray-400">
                            {t('daysCount', { n: filteredData.length })}
                        </span>
                    </div>
                )}

                {/* Result count */}
                <div className="text-xs text-gray-400 mt-2">
                    {t('showingDays', { shown: filteredData.length, total: data.length })}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                        <tr style={{ backgroundColor: '#f8fafc' }} className="text-left">
                            <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider sticky left-0" style={{ backgroundColor: '#f8fafc' }}>
                                {t('colDate')}
                            </th>
                            <th className="px-3 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">
                                {t('colOtb')}
                            </th>
                            <th className="px-3 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">
                                {t('colRemaining')}
                            </th>
                            <th className="px-3 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">
                                {t('colForecast')}
                            </th>
                            <th className="px-3 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right" title={t('calcAnchor')}>
                                {t('colAnchor')}
                            </th>
                            <th className="px-3 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">
                                {t('colSuggested')}
                            </th>
                            <th className="px-3 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">
                                {t('colAction')}
                            </th>
                            <th className="px-3 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider text-left">
                                {t('colReason')}
                            </th>
                            <th className="px-3 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">
                                {t('colActions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                                    {t('noDataForRange')}
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((row) => {
                                const { formatted, dayOfWeek, isWeekend } = formatDate(row.stayDate);
                                return (
                                    <tr
                                        key={row.id}
                                        className={`transition-colors ${row.isStopSell
                                            ? 'bg-rose-50/50'
                                            : isWeekend
                                                ? 'bg-amber-50/50'
                                                : 'hover:bg-gray-50'
                                            }`}
                                        style={{
                                            borderTop: '1px solid #e2e8f0',
                                            ...(row.source === 'FALLBACK' ? { borderLeft: '3px dashed #f59e0b' } : {}),
                                        }}
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
                                        <td className="px-3 py-3 text-gray-900 text-right tabular-nums">
                                            {row.roomsOtb}
                                        </td>
                                        <td className="px-3 py-3 text-gray-900 text-right tabular-nums">
                                            {row.remaining}
                                        </td>
                                        <td className="px-3 py-3 text-gray-900 text-right tabular-nums">
                                            {row.forecast}
                                        </td>
                                        <td className="px-3 py-3 text-right font-[family-name:var(--font-mono)] tabular-nums">
                                            <div className="text-gray-700">{formatCurrency(row.currentPrice)}</div>
                                            {row.adr != null && row.adr > 0 && row.adr !== row.currentPrice && (
                                                <div className="text-[10px] text-gray-400" title="ADR = Revenue / Rooms (reference)">
                                                    ADR {formatCurrency(row.adr)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-right font-[family-name:var(--font-mono)] tabular-nums">
                                            {row.isStopSell ? (
                                                <span className="text-rose-600 font-semibold">
                                                    {t('stopSelling')}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#2D4A8C' }} className="font-semibold">
                                                    {formatCurrency(row.recommendedPrice)}
                                                </span>
                                            )}
                                        </td>
                                        {/* Action badge */}
                                        <td className="px-3 py-3 text-center">
                                            {getActionBadge(row.action, t)}
                                        </td>
                                        {/* Reason */}
                                        <td className="px-3 py-3 text-xs text-slate-500 max-w-[180px]">
                                            <span className="line-clamp-2" title={getLocalizedReason(row)}>
                                                {getLocalizedReason(row)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            {row.isStopSell ? (
                                                <span className="text-xs text-gray-400">N/A</span>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => onAccept(row.id)}
                                                        className="p-1.5 rounded bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors cursor-pointer"
                                                        title={t('accept')}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => onOverride(row.id)}
                                                        className="p-1.5 rounded bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors cursor-pointer"
                                                        title={t('dismiss')}
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
                <p className="text-[10px] text-gray-500 font-medium mb-2">{t('calcExplain')}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-[10px] font-mono text-gray-400">
                    <div>{t('calcDate')}</div>
                    <div>{t('calcOtb')}</div>
                    <div>{t('calcRemaining')}</div>
                    <div>{t('calcForecast')}</div>
                    <div>{t('calcAnchor')}</div>
                    <div>{t('calcSuggested')}</div>
                    <div>{t('calcReason')}</div>
                </div>
                <div className="text-[10px] text-gray-400 mt-2 pt-2 border-t" style={{ borderColor: '#e2e8f0' }}>
                    {t('weekendLegend')}
                </div>
            </div>
        </div>
    );
}
