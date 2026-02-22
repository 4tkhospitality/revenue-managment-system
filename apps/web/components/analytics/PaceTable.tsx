'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, TableProperties } from 'lucide-react';
import type { EnrichedRow, AnalyticsKpi, AnalyticsQuality, ViewMode } from './types';
import { DOW_LABELS, formatRevenue, formatCurrency } from './types';
import { useTranslations } from 'next-intl';

// ─── PaceTable: GM-scan friendly column order (D7) ──────────
// Default:  Date | DOW | OTB | Occ% | Supply | T-3 | T-7 | T-15 | T-30 | vs STLY | DOD
// Revenue:  + ADR | RevPAR columns

interface PaceTableProps {
    rows: EnrichedRow[];
    expanded: boolean;
    onToggle: () => void;
    columnAvailability: AnalyticsQuality['columnAvailability'];
    viewMode: ViewMode;
    capacity: number;
    kpi: AnalyticsKpi;
    maxRows?: number;
}

export function PaceTable({
    rows,
    expanded,
    onToggle,
    columnAvailability,
    viewMode,
    capacity,
    kpi,
    maxRows = 60,
}: PaceTableProps) {
    const t = useTranslations('analyticsTab');
    const tableRows = rows.slice(0, maxRows);
    const [showExtraCols, setShowExtraCols] = useState(false);

    // ─── Pickup columns (auto-hide when 100% null) ──────────
    const pickupCols = useMemo(() => {
        type PickupKey = 'pickup_t3' | 'pickup_t5' | 'pickup_t7' | 'pickup_t15' | 'pickup_t30';
        const allCols: { key: PickupKey; label: string; available: boolean; default: boolean }[] = [
            { key: 'pickup_t3', label: 'T-3', available: columnAvailability.hasT3, default: true },
            { key: 'pickup_t7', label: 'T-7', available: columnAvailability.hasT7, default: true },
            { key: 'pickup_t15', label: 'T-15', available: columnAvailability.hasT15, default: false },
            { key: 'pickup_t30', label: 'T-30', available: columnAvailability.hasT30, default: false },
        ];
        const defaultCols = allCols.filter(c => c.default && c.available);
        const extraCols = allCols.filter(c => !c.default && c.available);
        return {
            visible: [...defaultCols, ...(showExtraCols ? extraCols : [])],
            hasExtra: extraCols.length > 0,
        };
    }, [columnAvailability, showExtraCols]);

    // ─── Summary KPIs (header row) ──────────────────────────
    const summaryAvgAdr = useMemo(() => {
        const withRooms = tableRows.filter(r => r.rooms_otb > 0);
        if (withRooms.length === 0) return null;
        const totalRev = withRooms.reduce((s, r) => s + r.revenue_otb, 0);
        const totalRooms = withRooms.reduce((s, r) => s + r.rooms_otb, 0);
        return totalRooms > 0 ? totalRev / totalRooms : null;
    }, [tableRows]);

    // ─── Format helpers ─────────────────────────────────────
    const fmtPickup = (val: number | null, isApprox?: boolean | null) => {
        if (val == null) return { text: '—', cls: 'text-slate-300' };
        const prefix = isApprox ? '~' : '';
        const cls = val > 0 ? 'text-emerald-600' : val < 0 ? 'text-rose-600' : 'text-slate-400';
        return { text: `${prefix}${val > 0 ? '+' : ''}${val}`, cls };
    };

    const fmtDod = (r: EnrichedRow) => {
        const val = viewMode === 'revenue' ? r.dod_delta_rev : r.dod_delta;
        if (val == null) return { text: '—', cls: 'text-slate-300' };
        const cls = val > 0 ? 'text-emerald-600 font-semibold' : val < 0 ? 'text-rose-600 font-semibold' : 'text-slate-400';
        const display = viewMode === 'revenue' ? formatRevenue(val) : String(val);
        return { text: `${val > 0 ? '+' : ''}${display}`, cls };
    };

    const fmtOcc = (pct: number) => {
        const cls = pct >= 90 ? 'text-rose-600 font-semibold' : pct >= 70 ? 'text-amber-600' : 'text-slate-600';
        return { text: `${Math.round(pct)}%`, cls };
    };

    const fmtOtb = (r: EnrichedRow) => {
        if (viewMode === 'revenue') return formatCurrency(r.revenue_otb);
        return String(r.rooms_otb);
    };

    const fmtVsStly = (r: EnrichedRow) => {
        if (viewMode === 'revenue') {
            if (r.stly_revenue_otb == null) return { text: '—', cls: 'text-slate-300' };
            const delta = r.revenue_otb - r.stly_revenue_otb;
            const cls = delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-400';
            return { text: `${delta > 0 ? '+' : ''}${formatRevenue(delta)}`, cls };
        }
        return fmtPickup(r.pace_vs_ly, r.stly_is_approx);
    };

    const fmtAdr = (r: EnrichedRow) => {
        if (r.adr == null) return 'N/A';
        return formatCurrency(r.adr);
    };

    const fmtRevPar = (r: EnrichedRow) => {
        return formatCurrency(r.rev_par);
    };

    // ─── Totals ─────────────────────────────────────────────
    const totals = useMemo(() => {
        const vsLY = tableRows
            .filter(r => r.pace_vs_ly !== null)
            .reduce((s, r) => s + (r.pace_vs_ly ?? 0), 0);
        const dodTotal = tableRows
            .filter(r => (viewMode === 'revenue' ? r.dod_delta_rev : r.dod_delta) !== null)
            .reduce((s, r) => s + (viewMode === 'revenue' ? (r.dod_delta_rev ?? 0) : (r.dod_delta ?? 0)), 0);
        const pickups: Record<string, number> = {};
        for (const c of pickupCols.visible) {
            pickups[c.key] = tableRows.reduce((s, r) => s + ((r[c.key] as number | null) ?? 0), 0);
        }
        return { vsLY, dodTotal, pickups };
    }, [tableRows, viewMode, pickupCols.visible]);

    const fmtTotal = (val: number) => {
        const cls = val > 0 ? 'text-emerald-600' : val < 0 ? 'text-rose-600' : 'text-slate-500';
        return { text: `${val > 0 ? '+' : ''}${Math.round(val)}`, cls };
    };

    // Column count for colspan
    const totalCols = 6 + pickupCols.visible.length + (viewMode === 'revenue' ? 2 : 0);

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {/* ─── Collapsible header ───────────────────────── */}
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center gap-2 hover:bg-slate-100 transition-colors text-left"
            >
                {expanded
                    ? <ChevronDown className="w-4 h-4 text-slate-500" />
                    : <ChevronRight className="w-4 h-4 text-slate-500" />
                }
                <TableProperties className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700">{t('bookingPace')}</h3>
                <span className="text-xs text-slate-400">
                    {expanded ? t('clickCollapse') : t('clickExpand')}
                </span>
                {!expanded && tableRows.length > 0 && (
                    <span className="ml-auto text-xs text-slate-400">{t('stayDates', { count: tableRows.length })}</span>
                )}
            </button>

            {expanded && (
                <>
                    {/* ─── Summary Row (KPI snapshot) ─────────── */}
                    <div className="px-4 py-2.5 bg-blue-50/60 border-b border-blue-100 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
                        <div>
                            <span className="text-slate-500">{t('avgOcc7d')}</span>
                            <span className="ml-1.5 font-bold text-slate-700">{kpi.occ7}%</span>
                        </div>
                        <div>
                            <span className="text-slate-500">{t('avgOcc30d')}</span>
                            <span className="ml-1.5 font-bold text-slate-700">{kpi.occ30}%</span>
                        </div>
                        <div>
                            <span className="text-slate-500">{t('pickup7d')}</span>
                            <span className={`ml-1.5 font-bold ${kpi.totalPickup7d >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {kpi.totalPickup7d > 0 ? '+' : ''}{kpi.totalPickup7d}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500">{t('paceVsLy')}</span>
                            <span className={`ml-1.5 font-bold ${(kpi.pace7 ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {kpi.pace7 != null ? `${kpi.pace7 > 0 ? '+' : ''}${kpi.pace7}` : '—'}
                            </span>
                        </div>
                        {summaryAvgAdr != null && (
                            <div>
                                <span className="text-slate-500">{t('avgAdr')}</span>
                                <span className="ml-1.5 font-bold text-blue-600">
                                    {formatCurrency(summaryAvgAdr)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ─── Column controls ────────────────────── */}
                    {pickupCols.hasExtra && (
                        <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                            <span className="text-xs text-slate-400">{t('pickupWindows')}</span>
                            <span className="text-xs text-slate-500 font-medium">
                                {pickupCols.visible.map(c => c.label).join(' • ')}
                            </span>
                            <button
                                onClick={() => setShowExtraCols(!showExtraCols)}
                                className="ml-auto text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                {showExtraCols ? t('hideT15T30') : t('addT15T30')}
                            </button>
                        </div>
                    )}

                    {/* ─── Table ──────────────────────────────── */}
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs text-slate-600 font-medium">{t('dateCol')}</th>
                                    <th className="px-2 py-2 text-center text-xs text-slate-600 font-medium">{t('dowCol')}</th>
                                    <th className="px-3 py-2 text-right text-xs text-slate-600 font-medium">{t('otbCol')}</th>
                                    <th className="px-2 py-2 text-right text-xs text-slate-600 font-medium">{t('occCol')}</th>
                                    <th className="px-3 py-2 text-right text-xs text-slate-600 font-medium">{t('supplyCol')}</th>
                                    {pickupCols.visible.map(c => (
                                        <th key={c.key} className="px-2 py-2 text-right text-xs text-slate-600 font-medium">{c.label}</th>
                                    ))}
                                    <th className="px-3 py-2 text-right text-xs text-slate-600 font-medium">{t('vsStlyCol')}</th>
                                    {viewMode === 'revenue' && (
                                        <>
                                            <th className="px-3 py-2 text-right text-xs text-slate-600 font-medium">{t('adrCol')}</th>
                                            <th className="px-3 py-2 text-right text-xs text-slate-600 font-medium">{t('revparCol')}</th>
                                        </>
                                    )}
                                    <th className="px-2 py-2 text-right text-xs text-slate-600 font-medium">{t('dodCol')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.map((r, i) => {
                                    const occ = fmtOcc(r.occ_pct);
                                    const vsStly = fmtVsStly(r);
                                    const dod = fmtDod(r);
                                    return (
                                        <tr
                                            key={i}
                                            className={`border-t border-slate-100 hover:bg-slate-50 transition-colors ${r.is_weekend ? 'bg-blue-50/30' : ''}`}
                                        >
                                            <td className="px-3 py-1.5 text-xs text-slate-800 font-mono">{r.stay_date}</td>
                                            <td className="px-2 py-1.5 text-xs text-center text-slate-500">
                                                {r.dow != null ? DOW_LABELS[r.dow] : '—'}
                                            </td>
                                            <td className="px-3 py-1.5 text-xs text-right font-semibold text-slate-800">
                                                {fmtOtb(r)}
                                            </td>
                                            <td className={`px-2 py-1.5 text-xs text-right ${occ.cls}`}>{occ.text}</td>
                                            <td className="px-3 py-1.5 text-xs text-right text-slate-600">
                                                {r.remaining_supply ?? '—'}
                                            </td>
                                            {pickupCols.visible.map(c => {
                                                const v = fmtPickup(r[c.key] as number | null);
                                                return (
                                                    <td key={c.key} className={`px-2 py-1.5 text-xs text-right font-mono ${v.cls}`}>
                                                        {v.text}
                                                    </td>
                                                );
                                            })}
                                            <td className={`px-3 py-1.5 text-xs text-right font-mono ${vsStly.cls}`}>
                                                {vsStly.text}
                                            </td>
                                            {viewMode === 'revenue' && (
                                                <>
                                                    <td className="px-3 py-1.5 text-xs text-right text-slate-600 font-mono">
                                                        {fmtAdr(r)}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-xs text-right text-slate-600 font-mono">
                                                        {fmtRevPar(r)}
                                                    </td>
                                                </>
                                            )}
                                            <td className={`px-2 py-1.5 text-xs text-right font-mono ${dod.cls}`}>
                                                {dod.text}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {tableRows.length === 0 && (
                                    <tr>
                                        <td colSpan={totalCols} className="px-4 py-8 text-center text-slate-400">
                                            {t('noFeaturesData')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {tableRows.length > 0 && (
                                <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                                    <tr>
                                        <td colSpan={5} className="px-3 py-2 text-xs font-semibold text-slate-700">
                                            {t('totalDays', { count: tableRows.length })}
                                        </td>
                                        {pickupCols.visible.map(c => {
                                            const t2 = fmtTotal(totals.pickups[c.key] ?? 0);
                                            return (
                                                <td key={c.key} className={`px-2 py-2 text-xs text-right font-mono font-semibold ${t2.cls}`}>
                                                    {t2.text}
                                                </td>
                                            );
                                        })}
                                        {(() => {
                                            const t2 = fmtTotal(Math.round(totals.vsLY));
                                            return <td className={`px-3 py-2 text-xs text-right font-mono font-semibold ${t2.cls}`}>{t2.text}</td>;
                                        })()}
                                        {viewMode === 'revenue' && (
                                            <>
                                                <td className="px-3 py-2 text-xs text-right text-slate-400">—</td>
                                                <td className="px-3 py-2 text-xs text-right text-slate-400">—</td>
                                            </>
                                        )}
                                        {(() => {
                                            const t2 = fmtTotal(Math.round(totals.dodTotal));
                                            return <td className={`px-2 py-2 text-xs text-right font-mono font-semibold ${t2.cls}`}>{t2.text}</td>;
                                        })()}
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
