'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { PageHeader } from '@/components/shared/PageHeader';

// ─── Types ──────────────────────────────────────────────────
interface AnalyticsRow {
    stay_date: string;
    dow: number | null;
    is_weekend: boolean | null;
    rooms_otb: number;
    revenue_otb: number;
    // D16: STLY fields
    stly_rooms_otb: number | null;
    stly_revenue_otb: number | null;
    pickup_t30: number | null;
    pickup_t15: number | null;
    pickup_t7: number | null;
    pickup_t5: number | null;
    pickup_t3: number | null;
    pace_vs_ly: number | null;
    remaining_supply: number | null;
    stly_is_approx: boolean | null;
}

interface AnalyticsData {
    hotelName: string;
    capacity: number;
    asOfDate: string;
    asOfDates: string[];
    rows: AnalyticsRow[];
    kpi: {
        occ7: number;
        occ14: number;
        occ30: number;
        pace7: number | null;
        pace30: number | null;
        totalPickup7d: number;
        totalPickup1d: number;
    };
    quality: {
        totalRows: number;
        withT7: number;
        withSTLY: number;
        approxSTLY: number;
        completeness: number;
        stlyCoverage: number;
    };
}


const DOW_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// ─── Main Page ──────────────────────────────────────────────
export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAsOf, setSelectedAsOf] = useState<string>('');
    const [viewMode, setViewMode] = useState<'rooms' | 'revenue'>('rooms');

    const fetchData = useCallback(async (asOf?: string) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (asOf) params.set('asOf', asOf);
            const res = await fetch(`/api/analytics/features?${params}`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to fetch');
            }
            const json: AnalyticsData = await res.json();
            setData(json);
            if (!asOf) setSelectedAsOf(json.asOfDate);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAsOfChange = (asOf: string) => {
        setSelectedAsOf(asOf);
        fetchData(asOf);
    };

    if (loading && !data) {
        return (
            <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <div className="text-slate-500">Đang tải Analytics...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6">
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <div className="text-lg font-semibold text-rose-700 mb-1">Chưa có dữ liệu Analytics</div>
                    <div className="text-sm text-rose-500 mb-4">{error}</div>
                    <div className="text-sm text-slate-600">
                        Bước 1: Upload reservations → Bước 2: Build OTB → Bước 3: Build Features
                    </div>
                    <Link href="/data" className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm">
                        → Go to Data Inspector
                    </Link>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { rows, kpi, quality, capacity } = data;

    return (
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <PageHeader
                title="Analytics Dashboard"
                subtitle="STLY • Booking Pace • Remaining Supply • KPIs"
                rightContent={
                    loading ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : null
                }
            />

            {/* As-Of Date Selector - responsive */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                    <span className="text-sm text-slate-500">📅 As-of:</span>
                    <select
                        value={selectedAsOf}
                        onChange={(e) => handleAsOfChange(e.target.value)}
                        className="text-sm font-medium text-slate-800 bg-transparent border-none outline-none cursor-pointer"
                    >
                        {data.asOfDates.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                    <button
                        onClick={() => setViewMode('rooms')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === 'rooms' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        🛏️ Rooms
                    </button>
                    <button
                        onClick={() => setViewMode('revenue')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === 'revenue' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        💰 Revenue
                    </button>
                </div>

                {/* Data Quality Badge */}
                <DataQualityMini quality={quality} />
            </div>

            {/* KPI Cards - responsive */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                <KPICard label="Occ 7d" value={`${kpi.occ7}%`} color={kpi.occ7 > 80 ? '#10b981' : kpi.occ7 > 60 ? '#f59e0b' : '#ef4444'} />
                <KPICard label="Occ 14d" value={`${kpi.occ14}%`} color={kpi.occ14 > 80 ? '#10b981' : kpi.occ14 > 60 ? '#f59e0b' : '#ef4444'} />
                <KPICard label="Occ 30d" value={`${kpi.occ30}%`} color={kpi.occ30 > 80 ? '#10b981' : kpi.occ30 > 60 ? '#f59e0b' : '#ef4444'} />
                <KPICard label="Pace 7d vs LY" value={kpi.pace7 != null ? `${kpi.pace7 > 0 ? '+' : ''}${kpi.pace7}` : '—'} color={kpi.pace7 != null ? (kpi.pace7 >= 0 ? '#10b981' : '#ef4444') : '#94a3b8'} />
                <KPICard label="Pace 30d vs LY" value={kpi.pace30 != null ? `${kpi.pace30 > 0 ? '+' : ''}${kpi.pace30}` : '—'} color={kpi.pace30 != null ? (kpi.pace30 >= 0 ? '#10b981' : '#ef4444') : '#94a3b8'} />
                <KPICard label="Pickup 7d" value={`${kpi.totalPickup7d > 0 ? '+' : ''}${kpi.totalPickup7d}`} color={kpi.totalPickup7d >= 0 ? '#10b981' : '#ef4444'} />
            </div>

            {/* Charts Row - stack on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* OTB vs STLY Chart */}
                <STLYChart rows={rows} capacity={capacity} viewMode={viewMode} />

                {/* Remaining Supply Chart */}
                <SupplyChart rows={rows} capacity={capacity} />
            </div>

            {/* Pace Table */}
            <PaceTable rows={rows} />
        </div>
    );
}

// ─── KPI Card ────────────────────────────────────────────────
function KPICard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-slate-500 mb-1">{label}</div>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
        </div>
    );
}

// ─── Data Quality Mini Badge ─────────────────────────────────
function DataQualityMini({ quality }: { quality: AnalyticsData['quality'] }) {
    const color = quality.completeness >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
        : quality.completeness >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200'
            : 'text-rose-600 bg-rose-50 border-rose-200';

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${color}`}>
            <span>{quality.completeness >= 80 ? '✅' : quality.completeness >= 50 ? '⚠️' : '❌'}</span>
            <span>{quality.completeness}% complete</span>
            <span className="text-slate-400">|</span>
            <span>{quality.totalRows} rows</span>
            {quality.approxSTLY > 0 && (
                <span className="text-slate-400">| ~{quality.approxSTLY} approx</span>
            )}
        </div>
    );
}

// ─── STLY Chart ──────────────────────────────────────────────
function STLYChart({ rows, capacity, viewMode }: { rows: AnalyticsRow[]; capacity: number; viewMode: 'rooms' | 'revenue' }) {
    // Show max 60 days for readability
    const chartData = rows.slice(0, 60).map(r => {
        // D16: Use actual STLY values from features_daily
        const currentVal = viewMode === 'rooms'
            ? r.rooms_otb
            : Math.round(r.revenue_otb / 1000000);

        const stlyVal = viewMode === 'rooms'
            ? r.stly_rooms_otb
            : (r.stly_revenue_otb ? Math.round(r.stly_revenue_otb / 1000000) : null);

        return {
            date: r.stay_date.slice(5), // MM-DD
            current: currentVal,
            stly: stlyVal,
            isWeekend: r.is_weekend,
            isApprox: r.stly_is_approx,
        };
    });


    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
                📈 OTB vs STLY ({viewMode === 'rooms' ? 'Rooms' : 'Revenue (M)'})
            </h3>
            <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
                    <Line
                        type="monotone"
                        dataKey="current"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        name="This Year"
                    />
                    <Line
                        type="monotone"
                        dataKey="stly"
                        stroke="#94a3b8"
                        strokeWidth={1.5}
                        strokeDasharray="5 3"
                        dot={false}
                        name="Last Year"
                        connectNulls={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Supply Chart ────────────────────────────────────────────
function SupplyChart({ rows, capacity }: { rows: AnalyticsRow[]; capacity: number }) {
    const chartData = rows.slice(0, 30).map(r => {
        const occ = capacity > 0 ? Math.round((r.rooms_otb / capacity) * 100) : 0;
        return {
            date: r.stay_date.slice(5),
            otb: r.rooms_otb,
            remaining: r.remaining_supply ?? (capacity - r.rooms_otb),
            occ,
        };
    });

    const getBarColor = (occ: number) => {
        if (occ >= 80) return '#10b981';
        if (occ >= 60) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
                🏨 Remaining Supply ({capacity} rooms capacity)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, capacity]} />
                    <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="otb" stackId="a" name="Rooms OTB">
                        {chartData.map((entry, i) => (
                            <Cell key={i} fill={getBarColor(entry.occ)} />
                        ))}
                    </Bar>
                    <Bar dataKey="remaining" stackId="a" fill="#e2e8f0" name="Còn trống" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Pace Table ──────────────────────────────────────────────
function PaceTable({ rows }: { rows: AnalyticsRow[] }) {
    // D24: Limit to 60 for table performance
    const tableRows = rows.slice(0, 60);

    // D23: Grand Total calculation (sum in visible range)
    const totals = {
        t30: tableRows.reduce((s, r) => s + (r.pickup_t30 ?? 0), 0),
        t15: tableRows.reduce((s, r) => s + (r.pickup_t15 ?? 0), 0),
        t7: tableRows.reduce((s, r) => s + (r.pickup_t7 ?? 0), 0),
        t5: tableRows.reduce((s, r) => s + (r.pickup_t5 ?? 0), 0),
        t3: tableRows.reduce((s, r) => s + (r.pickup_t3 ?? 0), 0),
        vsLY: tableRows.filter(r => r.pace_vs_ly !== null).reduce((s, r) => s + (r.pace_vs_ly ?? 0), 0),
    };

    const formatPickup = (val: number | null, isApprox?: boolean | null) => {
        if (val === null || val === undefined) return { text: '—', color: 'text-slate-300' };
        const prefix = isApprox ? '~' : '';
        const color = val > 0 ? 'text-emerald-600' : val < 0 ? 'text-rose-600' : 'text-slate-400';
        return { text: `${prefix}${val > 0 ? '+' : ''}${val}`, color };
    };


    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-slate-700">📋 Booking Pace (Pickup)</h3>
                <span className="text-xs text-slate-400">NULL = "—" (no snapshot), negative = cancellations</span>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs text-slate-600 font-medium">Stay Date</th>
                            <th className="px-3 py-2 text-center text-xs text-slate-600 font-medium">DOW</th>
                            <th className="px-3 py-2 text-right text-xs text-slate-600 font-medium">OTB</th>
                            <th className="px-3 py-2 text-right text-xs text-slate-600 font-medium">T-30</th>
                            <th className="px-3 py-2 text-right text-xs text-slate-600 font-medium">T-15</th>
                            <th className="px-3 py-2 text-right text-xs text-slate-600 font-medium">T-7</th>
                            <th className="px-3 py-2 text-right text-xs text-slate-600 font-medium">T-5</th>
                            <th className="px-3 py-2 text-right text-xs text-slate-600 font-medium">T-3</th>
                            <th className="px-3 py-2 text-right text-xs text-slate-600 font-medium">vs LY</th>
                            <th className="px-3 py-2 text-right text-xs text-slate-600 font-medium">Supply</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableRows.map((r, i) => {
                            const t30 = formatPickup(r.pickup_t30);
                            const t15 = formatPickup(r.pickup_t15);
                            const t7 = formatPickup(r.pickup_t7);
                            const t5 = formatPickup(r.pickup_t5);
                            const t3 = formatPickup(r.pickup_t3);
                            const vsLY = formatPickup(r.pace_vs_ly, r.stly_is_approx);

                            return (
                                <tr key={i} className={`border-t border-gray-100 hover:bg-gray-50 ${r.is_weekend ? 'bg-blue-50/30' : ''}`}>
                                    <td className="px-3 py-1.5 text-xs text-slate-800 font-mono">{r.stay_date}</td>
                                    <td className="px-3 py-1.5 text-xs text-center text-slate-500">
                                        {r.dow != null ? DOW_LABELS[r.dow] : '—'}
                                    </td>
                                    <td className="px-3 py-1.5 text-xs text-right font-semibold text-slate-800">{r.rooms_otb}</td>
                                    <td className={`px-3 py-1.5 text-xs text-right font-mono ${t30.color}`}>{t30.text}</td>
                                    <td className={`px-3 py-1.5 text-xs text-right font-mono ${t15.color}`}>{t15.text}</td>
                                    <td className={`px-3 py-1.5 text-xs text-right font-mono ${t7.color}`}>{t7.text}</td>
                                    <td className={`px-3 py-1.5 text-xs text-right font-mono ${t5.color}`}>{t5.text}</td>
                                    <td className={`px-3 py-1.5 text-xs text-right font-mono ${t3.color}`}>{t3.text}</td>
                                    <td className={`px-3 py-1.5 text-xs text-right font-mono ${vsLY.color}`}>{vsLY.text}</td>
                                    <td className="px-3 py-1.5 text-xs text-right text-slate-600">
                                        {r.remaining_supply ?? '—'}
                                    </td>
                                </tr>
                            );
                        })}
                        {tableRows.length === 0 && (
                            <tr>
                                <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                                    Chưa có features data. Chạy Build Features trước.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {/* D23: Grand Total row */}
                    {tableRows.length > 0 && (
                        <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                            <tr>
                                <td colSpan={3} className="px-3 py-2 text-xs font-semibold text-slate-700">
                                    📊 Total ({tableRows.length} ngày)
                                </td>
                                <td className={`px-3 py-2 text-xs text-right font-mono font-semibold ${totals.t30 > 0 ? 'text-emerald-600' : totals.t30 < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                    {totals.t30 > 0 ? '+' : ''}{totals.t30}
                                </td>
                                <td className={`px-3 py-2 text-xs text-right font-mono font-semibold ${totals.t15 > 0 ? 'text-emerald-600' : totals.t15 < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                    {totals.t15 > 0 ? '+' : ''}{totals.t15}
                                </td>
                                <td className={`px-3 py-2 text-xs text-right font-mono font-semibold ${totals.t7 > 0 ? 'text-emerald-600' : totals.t7 < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                    {totals.t7 > 0 ? '+' : ''}{totals.t7}
                                </td>
                                <td className={`px-3 py-2 text-xs text-right font-mono font-semibold ${totals.t5 > 0 ? 'text-emerald-600' : totals.t5 < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                    {totals.t5 > 0 ? '+' : ''}{totals.t5}
                                </td>
                                <td className={`px-3 py-2 text-xs text-right font-mono font-semibold ${totals.t3 > 0 ? 'text-emerald-600' : totals.t3 < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                    {totals.t3 > 0 ? '+' : ''}{totals.t3}
                                </td>
                                <td className={`px-3 py-2 text-xs text-right font-mono font-semibold ${totals.vsLY > 0 ? 'text-emerald-600' : totals.vsLY < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                    {totals.vsLY > 0 ? '+' : ''}{Math.round(totals.vsLY)}
                                </td>
                                <td className="px-3 py-2 text-xs text-right text-slate-500">—</td>
                            </tr>
                        </tfoot>
                    )}
                </table>

            </div>
        </div>
    );
}
