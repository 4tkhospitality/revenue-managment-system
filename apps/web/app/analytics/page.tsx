'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, BarChart3, CalendarDays, Database as DbIcon, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { ExportPdfButton } from '@/components/shared/ExportPdfButton';
import { TierPaywall } from '@/components/paywall/TierPaywall';
import { useTierAccess } from '@/hooks/useTierAccess';

// ─── Types ──────────────────────────────────────────────────
interface AnalyticsRow {
    stay_date: string;
    dow: number | null;
    is_weekend: boolean | null;
    rooms_otb: number;
    revenue_otb: number;
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
    dod_delta: number | null;
    dod_delta_rev: number | null;
}

interface DateToWatch {
    stay_date: string;
    dow: string;
    score: number;
    category: 'under_pace' | 'tight_supply' | 'mixed';
    impact: string;
    rooms_otb: number;
    revenue_otb: number;
    vs_ly: number | null;
    remaining_supply: number;
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
        netPickupDOD: number | null;
        topChangeDay: { stay_date: string; delta: number } | null;
    };
    quality: {
        totalRows: number;
        withT7: number;
        withSTLY: number;
        approxSTLY: number;
        completeness: number;
        stlyCoverage: number;
        columnAvailability: {
            hasT30: boolean;
            hasT15: boolean;
            hasT7: boolean;
            hasT5: boolean;
            hasT3: boolean;
        };
    };
    datesToWatch: DateToWatch[];
}

const DOW_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// ─── KPI Metric Definitions (Area 1) ────────────────────────
const KPI_TOOLTIPS: Record<string, string> = {
    'Occ 7d': 'Occupancy trung bình cho 7 ngày lưu trú tiếp theo\n= Σ(rooms_otb) / (7 × capacity) × 100',
    'Occ 14d': 'Occupancy trung bình cho 14 ngày lưu trú tiếp theo\n= Σ(rooms_otb) / (14 × capacity) × 100',
    'Occ 30d': 'Occupancy trung bình cho 30 ngày lưu trú tiếp theo\n= Σ(rooms_otb) / (30 × capacity) × 100',
    'Pace 7d vs LY': 'So sánh tổng OTB hiện tại vs cùng thời điểm năm trước\ncho 7 ngày lưu trú tiếp. Dương = đang ahead.',
    'Pace 30d vs LY': 'So sánh tổng OTB hiện tại vs cùng thời điểm năm trước\ncho 30 ngày lưu trú tiếp. Dương = đang ahead.',
    'Rev Pace 7d': 'So sánh tổng Revenue hiện tại vs cùng thời điểm năm trước\ncho 7 ngày lưu trú tiếp.',
    'Rev Pace 30d': 'So sánh tổng Revenue hiện tại vs cùng thời điểm năm trước\ncho 30 ngày lưu trú tiếp.',
    'Pickup 7d': 'Tổng rooms đặt thêm (net) trong 7 ngày qua (booking window).\nBao gồm bookings mới − cancellations.',
    'Net DOD': 'Thay đổi OTB từ hôm qua đến hôm nay\ncho toàn bộ horizon đang hiển thị.',
};

// ─── Main Page ──────────────────────────────────────────────
export default function AnalyticsPage() {
    const { hasAccess, loading: tierLoading } = useTierAccess('SUPERIOR');
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAsOf, setSelectedAsOf] = useState<string>('');
    const [viewMode, setViewMode] = useState<'rooms' | 'revenue'>('rooms');
    const [tableExpanded, setTableExpanded] = useState(false); // D44: collapsed by default

    const fetchData = useCallback(async (asOf?: string, mode?: 'rooms' | 'revenue') => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (asOf) params.set('asOf', asOf);
            params.set('mode', mode || viewMode);
            const res = await fetch(`/api/analytics/features?${params}`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to fetch');
            }
            const json: AnalyticsData = await res.json();
            setData(json);
            if (!asOf) setSelectedAsOf(json.asOfDate);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [viewMode]);

    useEffect(() => {
        if (!hasAccess || tierLoading) return;
        fetchData();
    }, [fetchData, hasAccess, tierLoading]);

    // Tier gate
    if (!tierLoading && !hasAccess) {
        return (
            <TierPaywall
                title="Pace & Pickup Analytics"
                subtitle="Phân tích STLY, Booking Pace, Remaining Supply"
                tierDisplayName="Superior"
                colorScheme="blue"
                features={[
                    { icon: <TrendingUp className="w-4 h-4" />, label: 'So sánh cùng kỳ năm trước (STLY)' },
                    { icon: <BarChart3 className="w-4 h-4" />, label: 'Booking Pace — theo dõi tốc độ đặt phòng' },
                    { icon: <CalendarDays className="w-4 h-4" />, label: 'Pickup T-3/T-7/T-15/T-30 chi tiết' },
                    { icon: <DbIcon className="w-4 h-4" />, label: 'Remaining Supply — phòng còn trống' },
                ]}
            />
        );
    }

    const handleAsOfChange = (asOf: string) => {
        setSelectedAsOf(asOf);
        fetchData(asOf);
    };

    const handleModeChange = (mode: 'rooms' | 'revenue') => {
        setViewMode(mode);
        fetchData(selectedAsOf, mode);
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
                    <div className="flex items-center gap-3">
                        {loading && (
                            <span className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></span>
                        )}
                        <ExportPdfButton
                            targetId="analytics-pdf-content"
                            filename={`analytics-${selectedAsOf || 'latest'}`}
                            pageType="analytics"
                            hotelName={data?.hotelName}
                            asOfDate={selectedAsOf}
                        />
                    </div>
                }
            />

            {/* Controls Row - pdf-hide */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 pdf-hide">
                {/* As-Of Selector */}
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                    <span className="text-sm text-slate-500">📅 As-of:</span>
                    <select
                        value={selectedAsOf}
                        onChange={(e) => handleAsOfChange(e.target.value)}
                        className="text-sm font-medium text-slate-800 bg-transparent border-none outline-none cursor-pointer"
                    >
                        {(data.asOfDates || []).map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                {/* Rooms/Revenue Toggle (Area 6) */}
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                    <button
                        onClick={() => handleModeChange('rooms')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === 'rooms' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        🛏️ Rooms
                    </button>
                    <button
                        onClick={() => handleModeChange('revenue')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === 'revenue' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        💰 Revenue
                    </button>
                </div>

                {/* Data Quality Badge (Area 4) */}
                <DataQualityMini quality={quality} />
            </div>

            {/* PDF Content Container */}
            <div id="analytics-pdf-content" className="space-y-4 sm:space-y-6">

                {/* ─── KPI Cards with Tooltips (Area 1) ─── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                    <KPICard label="Occ 7d" value={`${kpi.occ7}%`} color={kpi.occ7 > 80 ? '#10b981' : kpi.occ7 > 60 ? '#f59e0b' : '#ef4444'} />
                    <KPICard label="Occ 14d" value={`${kpi.occ14}%`} color={kpi.occ14 > 80 ? '#10b981' : kpi.occ14 > 60 ? '#f59e0b' : '#ef4444'} />
                    <KPICard label="Occ 30d" value={`${kpi.occ30}%`} color={kpi.occ30 > 80 ? '#10b981' : kpi.occ30 > 60 ? '#f59e0b' : '#ef4444'} />
                    <KPICard
                        label={viewMode === 'revenue' ? 'Rev Pace 7d' : 'Pace 7d vs LY'}
                        value={kpi.pace7 != null ? `${kpi.pace7 > 0 ? '+' : ''}${viewMode === 'revenue' ? formatRevenue(kpi.pace7) : kpi.pace7}` : '—'}
                        color={kpi.pace7 != null ? (kpi.pace7 >= 0 ? '#10b981' : '#ef4444') : '#94a3b8'}
                    />
                    <KPICard
                        label={viewMode === 'revenue' ? 'Rev Pace 30d' : 'Pace 30d vs LY'}
                        value={kpi.pace30 != null ? `${kpi.pace30 > 0 ? '+' : ''}${viewMode === 'revenue' ? formatRevenue(kpi.pace30) : kpi.pace30}` : '—'}
                        color={kpi.pace30 != null ? (kpi.pace30 >= 0 ? '#10b981' : '#ef4444') : '#94a3b8'}
                    />
                    <KPICard
                        label="Pickup 7d"
                        value={`${kpi.totalPickup7d > 0 ? '+' : ''}${kpi.totalPickup7d}`}
                        color={kpi.totalPickup7d >= 0 ? '#10b981' : '#ef4444'}
                    />
                </div>

                {/* ─── DOD Chips (Area 2) ─── */}
                <DODSection kpi={kpi} viewMode={viewMode} />

                {/* ─── Dates to Watch (Area 3) ─── */}
                {data.datesToWatch.length > 0 && (
                    <DatesToWatch dates={data.datesToWatch} viewMode={viewMode} />
                )}

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <STLYChart rows={rows} capacity={capacity} viewMode={viewMode} />
                    <SupplyChart rows={rows} capacity={capacity} />
                </div>

                {/* ─── Pace Table — Collapsed by Default (Area 5) ─── */}
                <PaceTable
                    rows={rows}
                    expanded={tableExpanded}
                    onToggle={() => setTableExpanded(!tableExpanded)}
                    columnAvailability={quality.columnAvailability}
                />
            </div>
        </div>
    );
}

// ─── Helpers ─────────────────────────────────────────────────
function formatRevenue(val: number): string {
    if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `${Math.round(val / 1_000)}k`;
    return String(Math.round(val));
}

// ─── KPI Card with Tooltip (Area 1) ─────────────────────────
function KPICard({ label, value, color }: { label: string; value: string; color: string }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipText = KPI_TOOLTIPS[label];

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative">
            <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-slate-500">{label}</span>
                {tooltipText && (
                    <button
                        onClick={() => setShowTooltip(!showTooltip)}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className="text-slate-400 hover:text-blue-500 transition-colors"
                        aria-label={`Info about ${label}`}
                    >
                        <Info className="w-3 h-3" />
                    </button>
                )}
            </div>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            {/* Tooltip popover */}
            {showTooltip && tooltipText && (
                <div className="absolute z-50 bottom-full left-0 mb-2 w-64 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-pre-line">
                    {tooltipText}
                    <div className="absolute top-full left-4 w-2 h-2 bg-slate-800 rotate-45 -mt-1"></div>
                </div>
            )}
        </div>
    );
}

// ─── DOD Section (Area 2) ────────────────────────────────────
function DODSection({ kpi, viewMode }: { kpi: AnalyticsData['kpi']; viewMode: 'rooms' | 'revenue' }) {
    const hasDOD = kpi.netPickupDOD !== null;
    const dodVal = kpi.netPickupDOD ?? 0;
    const topDay = kpi.topChangeDay;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Net DOD chip */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${!hasDOD ? 'bg-slate-50 border-slate-200 text-slate-400' :
                    dodVal > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        dodVal < 0 ? 'bg-rose-50 border-rose-200 text-rose-700' :
                            'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                <span>↕</span>
                <span>So với hôm qua:</span>
                {hasDOD ? (
                    <span className="font-bold">
                        {dodVal > 0 ? '+' : ''}{viewMode === 'revenue' ? formatRevenue(dodVal) : dodVal}
                        {viewMode === 'rooms' ? ' rooms' : ''}
                    </span>
                ) : (
                    <span className="italic" title="Chưa có snapshot hôm qua">—</span>
                )}
            </div>

            {/* Top change day chip */}
            {topDay && topDay.delta !== 0 && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${topDay.delta > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        'bg-rose-50 border-rose-200 text-rose-700'
                    }`}>
                    <span>{topDay.delta > 0 ? '🔥' : '⚠️'}</span>
                    <span>Top change:</span>
                    <span className="font-bold">{topDay.stay_date.slice(5)}</span>
                    <span className="font-bold">
                        ({topDay.delta > 0 ? '+' : ''}{viewMode === 'revenue' ? formatRevenue(topDay.delta) : topDay.delta})
                    </span>
                </div>
            )}
        </div>
    );
}

// ─── Dates to Watch (Area 3) ────────────────────────────────
function DatesToWatch({ dates, viewMode }: { dates: DateToWatch[]; viewMode: 'rooms' | 'revenue' }) {
    const categoryColors = {
        under_pace: 'border-l-rose-500 bg-rose-50/50',
        tight_supply: 'border-l-amber-500 bg-amber-50/50',
        mixed: 'border-l-blue-500 bg-blue-50/50',
    };
    const categoryIcons = {
        under_pace: '📉',
        tight_supply: '🔥',
        mixed: '👀',
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">🎯 Dates to Watch</span>
                <span className="text-xs text-slate-400">Top {dates.length} ngày cần ưu tiên</span>
            </div>
            <div className="divide-y divide-gray-100">
                {dates.map((d, i) => (
                    <div key={d.stay_date} className={`flex items-center gap-3 px-4 py-2.5 border-l-4 ${categoryColors[d.category]} hover:bg-gray-50/50 transition-colors`}>
                        <span className="text-sm">{categoryIcons[d.category]}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-800 font-mono">{d.stay_date}</span>
                                <span className="text-xs text-slate-400">({d.dow})</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${d.score > 50 ? 'bg-rose-100 text-rose-700' :
                                        d.score > 20 ? 'bg-amber-100 text-amber-700' :
                                            'bg-blue-100 text-blue-700'
                                    }`}>
                                    Score: {d.score}
                                </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 truncate">
                                {d.impact}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                            <span>OTB: <strong className="text-slate-700">{d.rooms_otb}</strong></span>
                            {d.vs_ly !== null && (
                                <span className={d.vs_ly >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                    vs LY: {d.vs_ly > 0 ? '+' : ''}{d.vs_ly}
                                </span>
                            )}
                            <span>Avail: <strong>{d.remaining_supply}</strong></span>
                        </div>
                        <Link
                            href={`/daily-actions?date=${d.stay_date}`}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline shrink-0"
                        >
                            Actions →
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Data Quality Mini Badge (Area 4) ────────────────────────
function DataQualityMini({ quality }: { quality: AnalyticsData['quality'] }) {
    const level = quality.completeness >= 80 ? 'high' :
        quality.completeness >= 50 ? 'medium' : 'low';

    const styles = {
        high: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        medium: 'text-amber-600 bg-amber-50 border-amber-200',
        low: 'text-rose-600 bg-rose-50 border-rose-200',
    };
    const icons = { high: '✅', medium: '⚠️', low: '❌' };
    const labels: Record<string, string> = {
        high: `${quality.completeness}% complete`,
        medium: `${quality.completeness}% — Partial data`,
        low: `Low confidence (${quality.completeness}%)`,
    };

    return (
        <div className="relative group">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-help ${styles[level]}`}>
                <span>{icons[level]}</span>
                <span>{labels[level]}</span>
                <span className="text-slate-400">|</span>
                <span>{quality.totalRows} rows</span>
                {quality.approxSTLY > 0 && (
                    <span className="text-slate-400">| ~{quality.approxSTLY} approx</span>
                )}
            </div>
            {/* Tooltip on hover */}
            <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl hidden group-hover:block">
                <div className="space-y-1">
                    <div>📊 Pickup data (T-7): {quality.withT7}/{quality.totalRows} rows</div>
                    <div>📈 STLY coverage: {quality.stlyCoverage}%</div>
                    {quality.approxSTLY > 0 && <div>~{quality.approxSTLY} STLY dùng nearest DOW</div>}
                    {level === 'low' && (
                        <div className="text-amber-300 mt-1">⚠️ Thiếu snapshot nên pace/pickup chưa đầy đủ. Kết quả chỉ mang tính tham khảo.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── STLY Chart ──────────────────────────────────────────────
function STLYChart({ rows, capacity, viewMode }: { rows: AnalyticsRow[]; capacity: number; viewMode: 'rooms' | 'revenue' }) {
    const chartData = rows.slice(0, 60).map(r => {
        const currentVal = viewMode === 'rooms'
            ? r.rooms_otb
            : Math.round(r.revenue_otb / 1000000);

        const stlyVal = viewMode === 'rooms'
            ? r.stly_rooms_otb
            : (r.stly_revenue_otb ? Math.round(r.stly_revenue_otb / 1000000) : null);

        return {
            date: r.stay_date.slice(5),
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
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="current" stroke="#3b82f6" strokeWidth={2} dot={false} name="This Year" />
                    <Line type="monotone" dataKey="stly" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="Last Year" connectNulls={false} />
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
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
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

// ─── Pace Table — Collapsed by Default (Area 5) ─────────────
function PaceTable({
    rows,
    expanded,
    onToggle,
    columnAvailability,
}: {
    rows: AnalyticsRow[];
    expanded: boolean;
    onToggle: () => void;
    columnAvailability: AnalyticsData['quality']['columnAvailability'];
}) {
    const tableRows = rows.slice(0, 60);
    const [showExtraCols, setShowExtraCols] = useState(false);

    // D41: Default columns = Stay Date | DOW | OTB | vs LY | Supply
    // Extra columns T-xx shown selectively based on data + user choice
    const defaultTCols: { key: 'pickup_t15' | 'pickup_t7'; label: string; available: boolean }[] = [
        { key: 'pickup_t15', label: 'T-15', available: columnAvailability.hasT15 },
        { key: 'pickup_t7', label: 'T-7', available: columnAvailability.hasT7 },
    ];
    const extraTCols: { key: 'pickup_t30' | 'pickup_t5' | 'pickup_t3'; label: string; available: boolean }[] = [
        { key: 'pickup_t30', label: 'T-30', available: columnAvailability.hasT30 },
        { key: 'pickup_t5', label: 'T-5', available: columnAvailability.hasT5 },
        { key: 'pickup_t3', label: 'T-3', available: columnAvailability.hasT3 },
    ];

    const visibleTCols = [
        ...defaultTCols.filter(c => c.available),
        ...(showExtraCols ? extraTCols.filter(c => c.available) : []),
    ];

    // Grand totals
    const totals = {
        vsLY: tableRows.filter(r => r.pace_vs_ly !== null).reduce((s, r) => s + (r.pace_vs_ly ?? 0), 0),
        ...Object.fromEntries(
            [...defaultTCols, ...extraTCols].map(c => [
                c.key,
                tableRows.reduce((s, r) => s + ((r[c.key] as number | null) ?? 0), 0),
            ])
        ),
    };

    const formatPickup = (val: number | null, isApprox?: boolean | null) => {
        if (val === null || val === undefined) return { text: '—', color: 'text-slate-300' };
        const prefix = isApprox ? '~' : '';
        const color = val > 0 ? 'text-emerald-600' : val < 0 ? 'text-rose-600' : 'text-slate-400';
        return { text: `${prefix}${val > 0 ? '+' : ''}${val}`, color };
    };

    const formatTotal = (val: number) => ({
        text: `${val > 0 ? '+' : ''}${val}`,
        color: val > 0 ? 'text-emerald-600' : val < 0 ? 'text-rose-600' : 'text-slate-500',
    });

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Collapsible header */}
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2 hover:bg-gray-100 transition-colors text-left"
            >
                {expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                <h3 className="text-sm font-semibold text-slate-700">📋 Booking Pace (Pickup)</h3>
                <span className="text-xs text-slate-400">
                    {expanded ? 'Click để thu gọn' : 'Click để mở bảng chi tiết'}
                </span>
                {!expanded && tableRows.length > 0 && (
                    <span className="ml-auto text-xs text-slate-400">{tableRows.length} stay dates</span>
                )}
            </button>

            {/* Table body — only visible when expanded */}
            {expanded && (
                <>
                    {/* Column controls */}
                    <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
                        <span className="text-xs text-slate-400">Cột hiện:</span>
                        <span className="text-xs text-slate-500 font-medium">Stay Date • DOW • OTB • {visibleTCols.map(c => c.label).join(' • ')} • vs LY • Supply</span>
                        {extraTCols.some(c => c.available) && (
                            <button
                                onClick={() => setShowExtraCols(!showExtraCols)}
                                className="ml-auto text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                {showExtraCols ? '− Ẩn cột phụ' : '+ Thêm cột (T-30, T-5, T-3)'}
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs text-slate-600 font-medium">Stay Date</th>
                                    <th className="px-3 py-2 text-center text-xs text-slate-600 font-medium">DOW</th>
                                    <th className="px-3 py-2 text-right text-xs text-slate-600 font-medium">OTB</th>
                                    {visibleTCols.map(c => (
                                        <th key={c.key} className="px-3 py-2 text-right text-xs text-slate-600 font-medium">{c.label}</th>
                                    ))}
                                    <th className="px-3 py-2 text-right text-xs text-slate-600 font-medium">vs LY</th>
                                    <th className="px-3 py-2 text-right text-xs text-slate-600 font-medium">Supply</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.map((r, i) => {
                                    const vsLY = formatPickup(r.pace_vs_ly, r.stly_is_approx);
                                    return (
                                        <tr key={i} className={`border-t border-gray-100 hover:bg-gray-50 ${r.is_weekend ? 'bg-blue-50/30' : ''}`}>
                                            <td className="px-3 py-1.5 text-xs text-slate-800 font-mono">{r.stay_date}</td>
                                            <td className="px-3 py-1.5 text-xs text-center text-slate-500">
                                                {r.dow != null ? DOW_LABELS[r.dow] : '—'}
                                            </td>
                                            <td className="px-3 py-1.5 text-xs text-right font-semibold text-slate-800">{r.rooms_otb}</td>
                                            {visibleTCols.map(c => {
                                                const val = formatPickup(r[c.key] as number | null);
                                                return (
                                                    <td key={c.key} className={`px-3 py-1.5 text-xs text-right font-mono ${val.color}`}>{val.text}</td>
                                                );
                                            })}
                                            <td className={`px-3 py-1.5 text-xs text-right font-mono ${vsLY.color}`}>{vsLY.text}</td>
                                            <td className="px-3 py-1.5 text-xs text-right text-slate-600">
                                                {r.remaining_supply ?? '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {tableRows.length === 0 && (
                                    <tr>
                                        <td colSpan={4 + visibleTCols.length} className="px-4 py-8 text-center text-slate-400">
                                            Chưa có features data. Chạy Build Features trước.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {tableRows.length > 0 && (
                                <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                                    <tr>
                                        <td colSpan={3} className="px-3 py-2 text-xs font-semibold text-slate-700">
                                            📊 Total ({tableRows.length} ngày)
                                        </td>
                                        {visibleTCols.map(c => {
                                            const t = formatTotal((totals as Record<string, number>)[c.key] ?? 0);
                                            return (
                                                <td key={c.key} className={`px-3 py-2 text-xs text-right font-mono font-semibold ${t.color}`}>{t.text}</td>
                                            );
                                        })}
                                        {(() => {
                                            const t = formatTotal(Math.round(totals.vsLY));
                                            return <td className={`px-3 py-2 text-xs text-right font-mono font-semibold ${t.color}`}>{t.text}</td>;
                                        })()}
                                        <td className="px-3 py-2 text-xs text-right text-slate-500">—</td>
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
