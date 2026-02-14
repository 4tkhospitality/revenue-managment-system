'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Suspense } from 'react';
import {
    AnalyticsKpiRow,
    DatesToWatchPanel,
    StlyComparisonChart,
    SupplyChart,
    PaceTable,
    AnalyticsControls,
    enrichRows,
} from '@/components/analytics';
import type { AnalyticsData, ViewMode, AnalyticsRow } from '@/components/analytics';
import { TierPaywall } from '@/components/paywall/TierPaywall';
import { useTierAccess } from '@/hooks/useTierAccess';
import { TrendingUp, BarChart3, CalendarDays, Database } from 'lucide-react';

// ── Lazy Imports for mix widgets (unchanged from old Tab 2) ──
import { TopAccountsTable } from '@/components/dashboard/TopAccountsTable';
import { RoomLosMixPanel } from '@/components/dashboard/RoomLosMixPanel';
import { LeadTimeBuckets } from '@/components/dashboard/LeadTimeBuckets';

interface AnalyticsTabContentProps {
    hotelId: string;
    asOfDate?: string;
}

export function AnalyticsTabContent({ hotelId, asOfDate: initialAsOf }: AnalyticsTabContentProps) {
    const { hasAccess, loading: tierLoading } = useTierAccess('SUPERIOR');
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAsOf, setSelectedAsOf] = useState<string>(initialAsOf || '');
    const [viewMode, setViewMode] = useState<ViewMode>('rooms');
    const [tableExpanded, setTableExpanded] = useState(false);

    // ── Fetch analytics data ────────────────────────────────
    const fetchData = useCallback(async (asOf?: string, mode?: ViewMode) => {
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
        fetchData(initialAsOf);
    }, [fetchData, hasAccess, tierLoading, initialAsOf]);

    // ── Enriched rows (P0: ADR, Occ%, RevPAR) ──────────────
    const enrichedRows = useMemo(() => {
        if (!data) return [];
        return enrichRows(data.rows, data.capacity);
    }, [data]);

    // ── Avg ADR for KPI card ────────────────────────────────
    const avgAdr = useMemo(() => {
        if (!data) return null;
        const next7 = data.rows.slice(0, 7);
        const withRooms = next7.filter(r => r.rooms_otb > 0);
        if (withRooms.length === 0) return null;
        const totalRev = withRooms.reduce((s, r) => s + r.revenue_otb, 0);
        const totalRooms = withRooms.reduce((s, r) => s + r.rooms_otb, 0);
        return totalRooms > 0 ? totalRev / totalRooms : null;
    }, [data]);

    // ── Tier gate ───────────────────────────────────────────
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
                    { icon: <Database className="w-4 h-4" />, label: 'Remaining Supply — phòng còn trống' },
                ]}
            />
        );
    }

    // ── Loading state ───────────────────────────────────────
    if (loading && !data) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                    <div className="text-slate-500 text-sm">Đang tải Analytics...</div>
                </div>
            </div>
        );
    }

    // ── Error state ─────────────────────────────────────────
    if (error && !data) {
        return (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
                <div className="text-lg font-semibold text-rose-700 mb-1">Chưa có dữ liệu Analytics</div>
                <div className="text-sm text-rose-500 mb-4">{error}</div>
                <div className="text-sm text-slate-600">
                    Bước 1: Upload reservations → Bước 2: Build OTB → Bước 3: Build Features
                </div>
            </div>
        );
    }

    if (!data) return null;

    const handleAsOfChange = (asOf: string) => {
        setSelectedAsOf(asOf);
        fetchData(asOf);
    };

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);
        fetchData(selectedAsOf, mode);
    };

    return (
        <div className="space-y-3 sm:space-y-4">
            {/* ── Controls ────────────────────────────────── */}
            <AnalyticsControls
                selectedAsOf={selectedAsOf}
                asOfDates={data.asOfDates || []}
                onAsOfChange={handleAsOfChange}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                quality={data.quality}
                loading={loading}
            />

            {/* ── KPI Strip (compact, DOD merged inline) ── */}
            <AnalyticsKpiRow
                kpi={data.kpi}
                viewMode={viewMode}
                avgAdr={avgAdr}
            />

            {/* ── Charts Row 1: STLY + Supply (above fold!) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <StlyComparisonChart
                    rows={data.rows}
                    capacity={data.capacity}
                    viewMode={viewMode}
                />
                <SupplyChart
                    rows={data.rows}
                    capacity={data.capacity}
                />
            </div>

            {/* ── Charts Row 2: Room Mix + Lead-time ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <Suspense fallback={<div className="h-64 bg-white rounded-xl animate-pulse" />}>
                    <RoomLosMixPanel
                        hotelId={hotelId}
                        asOfDate={selectedAsOf || ''}
                    />
                </Suspense>
                <Suspense fallback={<div className="h-64 bg-white rounded-xl animate-pulse" />}>
                    <LeadTimeBuckets
                        hotelId={hotelId}
                        asOfDate={selectedAsOf || ''}
                    />
                </Suspense>
            </div>

            {/* ── Dates to Watch (horizontal chip strip) ── */}
            <DatesToWatchPanel
                dates={data.datesToWatch}
                viewMode={viewMode}
            />

            {/* ── Pace Table (collapsed by default) ─────── */}
            <PaceTable
                rows={enrichedRows}
                expanded={tableExpanded}
                onToggle={() => setTableExpanded(!tableExpanded)}
                columnAvailability={data.quality.columnAvailability}
                viewMode={viewMode}
                capacity={data.capacity}
                kpi={data.kpi}
            />

            {/* ── Top Accounts ────────────────────────────── */}
            <Suspense fallback={<div className="h-48 bg-white rounded-xl animate-pulse" />}>
                <TopAccountsTable
                    hotelId={hotelId}
                    asOfDate={selectedAsOf || ''}
                />
            </Suspense>
        </div>
    );
}
