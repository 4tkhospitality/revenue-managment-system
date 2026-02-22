'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, TrendingUp, TrendingDown, Minus, AlertCircle, Clock, Wifi, Plus, Building2, Zap } from 'lucide-react';
import Link from 'next/link';
import { RateShopperPaywall } from '@/components/paywall/RateShopperPaywall';
import { useTranslations } from 'next-intl';

// Types (inline to avoid server/client boundary issues)
interface IntradayRate {
    source: string;
    representative_price: number | null;
    total_rate_lowest: number | null;
    total_rate_before_tax: number | null;
    rate_per_night_lowest: number | null;
    rate_per_night_before_tax: number | null;
    price_source_level: number;
    data_confidence: string;
    availability_status: string;
    is_official: boolean;
    scraped_at: string;
}

interface IntradayCompetitor {
    competitor_id: string;
    name: string;
    representative_price: number | null;
    availability_status: string;
    data_confidence: string;
    source: string;
    scraped_at: string;
    rates: IntradayRate[];
}

interface IntradayViewModel {
    offset: number;
    check_in_date: string;
    my_rate: number | null;
    competitors: IntradayCompetitor[];
    cache_status: string;
    cache_fetched_at: string | null;
    tax_fee_mixed: boolean;
    before_tax_ratio: number;
}

// ──────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────

const OFFSETS = [7, 14, 30, 60, 90] as const;

const OFFSET_LABELS: Record<number, string> = {
    7: '+7 days',
    14: '+14 days',
    30: '+30 days',
    60: '+60 days',
    90: '+90 days',
};

type FetchStatus = 'idle' | 'scanning' | 'loading' | 'done' | 'error';

interface OffsetState {
    status: FetchStatus;
    data: IntradayViewModel | null;
    message: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    FRESH: { bg: '#F0FDF4', text: '#166534', label: 'Fresh' },
    STALE: { bg: '#FFFBEB', text: '#92400E', label: 'Stale' },
    EXPIRED: { bg: '#FEF2F2', text: '#991B1B', label: 'Expired' },
    REFRESHING: { bg: '#EFF6FF', text: '#1E40AF', label: 'Refreshing' },
    FAILED: { bg: '#FEF2F2', text: '#991B1B', label: 'Error' },
};

const CONFIDENCE_BADGES: Record<string, { color: string; label: string }> = {
    HIGH: { color: '#16A34A', label: 'High' },
    MED: { color: '#CA8A04', label: 'Medium' },
    LOW: { color: '#C62828', label: 'Low' },
};

// ──────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────

function formatVND(value: number | null): string {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function timeAgo(isoStr: string | null): string {
    if (!isoStr) return 'No data';
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
}

// ──────────────────────────────────────────────────
// Main Dashboard Component
// ──────────────────────────────────────────────────

export default function RateShopperPage() {
    const [tierStatus, setTierStatus] = useState<'loading' | 'allowed' | 'blocked'>('loading');

    useEffect(() => {
        async function checkAccess() {
            try {
                const [subRes, demoRes] = await Promise.all([
                    fetch('/api/subscription'),
                    fetch('/api/is-demo-hotel').then(r => r.json()).catch(() => ({ isDemo: false, role: undefined })),
                ]);
                // Super admin → always allowed
                if (demoRes.role === 'super_admin') {
                    setTierStatus('allowed');
                    return;
                }
                if (!subRes.ok) { setTierStatus('blocked'); return; }
                const subData = await subRes.json();
                const plan = subData.plan || 'STANDARD';
                setTierStatus(plan === 'SUITE' ? 'allowed' : 'blocked');
            } catch {
                setTierStatus('blocked');
            }
        }
        checkAccess();
    }, []);

    if (tierStatus === 'loading') {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (tierStatus === 'blocked') {
        return <RateShopperPaywall />;
    }

    return <RateShopperContent />;
}

function RateShopperContent() {
    const t = useTranslations('rateShopper');
    const [selectedOffset, setSelectedOffset] = useState<number>(7);
    const [offsetStates, setOffsetStates] = useState<Record<number, OffsetState>>(() => {
        const init: Record<number, OffsetState> = {};
        for (const o of OFFSETS) {
            init[o] = { status: 'idle', data: null, message: '' };
        }
        return init;
    });

    // Update a single offset's state
    const updateOffset = useCallback((offset: number, update: Partial<OffsetState>) => {
        setOffsetStates(prev => ({
            ...prev,
            [offset]: { ...prev[offset], ...update },
        }));
    }, []);

    // Load cached data for an offset (from DB, no SerpApi call)
    const loadCachedData = useCallback(async (offset: number) => {
        try {
            updateOffset(offset, { status: 'loading' });
            const res = await fetch(`/api/rate-shopper/intraday?offset=${offset}`);
            if (!res.ok) throw new Error('Failed to load');
            const json = await res.json();
            const viewData = (json.data ?? [])[0] ?? null;
            updateOffset(offset, {
                status: viewData ? 'done' : 'idle',
                data: viewData,
            });
        } catch {
            updateOffset(offset, { status: 'error', message: t('errorLoading') });
        }
    }, [updateOffset]);

    // Scan all competitors for an offset (calls SerpApi, costs credits)
    const handleScan = useCallback(async (offset: number) => {
        try {
            updateOffset(offset, { status: 'scanning', message: t('scanning') });

            const res = await fetch('/api/rate-shopper/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ offset }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || err.error || 'Scan failed');
            }

            const result = await res.json();

            // After scan, reload data from DB
            await loadCachedData(offset);

            updateOffset(offset, {
                status: 'done',
                message: result.message || t('completed'),
            });
        } catch (err) {
            updateOffset(offset, {
                status: 'error',
                message: err instanceof Error ? err.message : t('errorScanning'),
            });
        }
    }, [updateOffset, loadCachedData]);

    // On mount: Load cached data for ALL offsets (light DB query, no SerpApi)
    useEffect(() => {
        for (const offset of OFFSETS) {
            loadCachedData(offset);
        }
    }, [loadCachedData]);

    const currentState = offsetStates[selectedOffset];
    const selectedView = currentState?.data;

    return (
        <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-6">
            {/* Gradient Header — consistent with other pages */}
            <header
                className="rounded-2xl px-4 sm:px-6 py-4 text-white shadow-sm"
                style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
            >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">{t('pageTitle')}</h1>
                        <p className="text-white/70 text-sm">{t('pageSubtitle')}</p>
                    </div>
                </div>
            </header>

            {/* Sub Navigation */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-2">
                <div className="flex gap-1">
                    <Link
                        href="/rate-shopper"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                        style={{ backgroundColor: '#204184', color: '#fff' }}
                    >
                        <Search className="w-4 h-4" />
                        {t('navPriceComparison')}
                    </Link>
                    <Link
                        href="/rate-shopper/competitors"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
                    >
                        <Building2 className="w-4 h-4" />
                        {t('navManageCompetitors')}
                    </Link>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/rate-shopper/competitors"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm"
                        style={{ backgroundColor: '#10b981', color: '#fff' }}
                    >
                        <Plus className="w-4 h-4" />
                        {t('navAddCompetitor')}
                    </Link>
                </div>
            </div>

            {/* Offset Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {OFFSETS.map((offset) => {
                    const state = offsetStates[offset];
                    const isActive = offset === selectedOffset;
                    const hasData = state.status === 'done' && state.data;
                    const isScanning = state.status === 'scanning';
                    const isLoading = state.status === 'loading';

                    return (
                        <button
                            key={offset}
                            onClick={() => setSelectedOffset(offset)}
                            className="flex flex-col items-center px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-w-[110px] border relative"
                            style={{
                                backgroundColor: isActive ? '#204184' : '#fff',
                                color: isActive ? '#fff' : '#374151',
                                borderColor: isActive ? '#204184' : '#E5E7EB',
                                boxShadow: isActive ? '0 4px 12px rgba(32,65,132,0.3)' : 'none',
                            }}
                        >
                            <span className="font-semibold">{OFFSET_LABELS[offset]}</span>
                            <span className="text-xs mt-1 opacity-80">
                                {state.data ? formatDate(state.data.check_in_date) : '—'}
                            </span>
                            {/* Status badge */}
                            <span
                                className="text-[10px] mt-1 px-2 py-0.5 rounded-full font-medium"
                                style={{
                                    backgroundColor: isActive
                                        ? 'rgba(255,255,255,0.2)'
                                        : hasData
                                            ? '#F0FDF4'
                                            : isScanning || isLoading
                                                ? '#EFF6FF'
                                                : '#F3F4F6',
                                    color: isActive
                                        ? '#fff'
                                        : hasData
                                            ? '#166534'
                                            : isScanning || isLoading
                                                ? '#1E40AF'
                                                : '#6B7280',
                                }}
                            >
                                {isScanning ? t('scanningStatus')
                                    : isLoading ? t('loadingStatus')
                                        : hasData ? t('hasData')
                                            : t('notScanned')}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Main Content */}
            {currentState.status === 'scanning' ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center space-y-3">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                        <p className="text-sm text-gray-500">
                            {currentState.message || t('scanMessage')}
                        </p>
                        <p className="text-xs text-gray-400">{t('scanTime')}</p>
                    </div>
                </div>
            ) : currentState.status === 'loading' ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center space-y-3">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                        <p className="text-sm text-gray-500">{t('loadingData')}</p>
                    </div>
                </div>
            ) : selectedView ? (
                <div className="space-y-4">
                    {/* Scan button + Stats Bar */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleScan(selectedOffset)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                style={{ backgroundColor: '#204184', color: '#fff' }}
                            >
                                <Zap className="w-4 h-4" />
                                {t('rescanRates')}
                            </button>
                            {currentState.message && (
                                <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                    {currentState.message}
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-gray-400">
                            {t('updatedAt', { time: timeAgo(selectedView.cache_fetched_at) })}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            label={t('thCheckIn') || 'Check-in'}
                            value={formatDate(selectedView.check_in_date)}
                            icon={<Clock className="w-5 h-5" />}
                            color="#204184"
                        />
                        <StatCard
                            label={t('competitors')}
                            value={`${selectedView.competitors.length}`}
                            icon={<Search className="w-5 h-5" />}
                            color="#7C3AED"
                        />
                        <StatCard
                            label={t('updated')}
                            value={timeAgo(selectedView.cache_fetched_at)}
                            icon={<Wifi className="w-5 h-5" />}
                            color={STATUS_COLORS[selectedView.cache_status]?.text ?? '#666'}
                        />
                        <StatCard
                            label={t('thTaxFee') || 'Tax/Fee'}
                            value={selectedView.tax_fee_mixed ? t('taxMixed') : t('taxUniform')}
                            icon={<AlertCircle className="w-5 h-5" />}
                            color={selectedView.tax_fee_mixed ? '#E65100' : '#2E7D32'}
                        />
                    </div>

                    {/* Competitor Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold" style={{ color: '#1A1A2E' }}>
                                {t('competitorTable')}
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                                            {t('thCompetitors')}
                                        </th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                                            {t('thSource')}
                                        </th>
                                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                                            {t('thPrice')}
                                        </th>
                                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                                            {t('thStatus')}
                                        </th>
                                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                                            {t('thReliability')}
                                        </th>
                                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                                            {t('thUpdate')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedView.competitors.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                                                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                                <p className="text-sm font-medium text-gray-500">{t('noCompetitors')}</p>
                                                <p className="text-xs text-gray-400 mt-1 mb-4">
                                                    {t('addToStart')}
                                                </p>
                                                <Link
                                                    href="/rate-shopper/competitors"
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
                                                    style={{ backgroundColor: '#10b981', color: '#fff' }}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    {t('addCompetitorNow')}
                                                </Link>
                                            </td>
                                        </tr>
                                    ) : (
                                        selectedView.competitors.map((comp, idx) => (
                                            <CompetitorRow
                                                key={comp.competitor_id}
                                                comp={comp}
                                                myRate={selectedView.my_rate}
                                                isEven={idx % 2 === 0}
                                                t={t}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                /* No data yet — show scan prompt */
                <div className="flex items-center justify-center py-20">
                    <div className="text-center space-y-4">
                        <Search className="w-12 h-12 text-gray-300 mx-auto" />
                        <div>
                            <p className="text-base font-medium text-gray-600">
                                {t('noDataForOffset', { offset: OFFSET_LABELS[selectedOffset] })}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                {t('clickToScan')}
                            </p>
                        </div>
                        <button
                            onClick={() => handleScan(selectedOffset)}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                            style={{ backgroundColor: '#204184', color: '#fff' }}
                        >
                            <Zap className="w-4 h-4" />
                            {t('findRates', { offset: OFFSET_LABELS[selectedOffset] })}
                        </button>
                        <p className="text-xs text-gray-400">
                            {t('serpApiNote')}
                        </p>
                    </div>
                </div>
            )}

            {/* Error state */}
            {currentState.status === 'error' && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-red-700">{currentState.message}</span>
                    <button
                        onClick={() => handleScan(selectedOffset)}
                        className="ml-auto text-xs text-red-600 underline"
                    >
                        {t('retry')}
                    </button>
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────────
// Sub-Components
// ──────────────────────────────────────────────────

function StatCard({
    label,
    value,
    icon,
    color,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex items-center gap-4">
            <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: color + '15', color }}
            >
                {icon}
            </div>
            <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-base font-semibold" style={{ color: '#1A1A2E' }}>
                    {value}
                </p>
            </div>
        </div>
    );
}

function CompetitorRow({
    comp,
    myRate,
    isEven,
    t,
}: {
    comp: IntradayCompetitor;
    myRate: number | null;
    isEven: boolean;
    t: any;
}) {
    const rates = comp.rates ?? [];
    const hasAnyRate = rates.some((r) => r.representative_price !== null);
    const rowCount = Math.max(rates.length, 1);

    if (rates.length === 0) {
        // No rates at all — show placeholder row
        return (
            <tr
                style={{ backgroundColor: isEven ? '#FAFBFC' : '#fff' }}
                className="hover:bg-blue-50/50 transition-colors"
            >
                <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: 'linear-gradient(135deg, #204184 0%, #4F67A8 100%)' }}
                        >
                            {comp.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{comp.name}</span>
                    </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-400">—</td>
                <td className="px-5 py-4 text-right text-sm text-gray-400">—</td>
                <td className="px-5 py-4 text-center text-xs text-gray-400">{t('noPrice')}</td>
                <td className="px-5 py-4 text-center">
                    <span className="text-xs font-medium" style={{ color: '#C62828' }}>{t('lowConfidence')}</span>
                </td>
                <td className="px-5 py-4 text-right text-xs text-gray-400">{timeAgo(comp.scraped_at)}</td>
            </tr>
        );
    }

    // Multi-source: show each OTA source as a sub-row
    return (
        <>
            {rates.map((rate, rIdx) => {
                const price = rate.representative_price;
                const hasPrice = price !== null && price > 0;
                const confidence = CONFIDENCE_BADGES[rate.data_confidence] ?? CONFIDENCE_BADGES.LOW;
                const availLabel =
                    rate.availability_status === 'AVAILABLE'
                        ? t('available')
                        : rate.availability_status === 'SOLD_OUT'
                            ? t('soldOut')
                            : t('noPrice');
                const priceDiff = hasPrice && myRate ? ((price - myRate) / myRate) * 100 : null;

                return (
                    <tr
                        key={`${comp.competitor_id}-${rate.source}`}
                        style={{ backgroundColor: isEven ? '#FAFBFC' : '#fff' }}
                        className="hover:bg-blue-50/50 transition-colors"
                    >
                        {/* Hotel name — only on first row, with rowSpan */}
                        {rIdx === 0 && (
                            <td className="px-5 py-4 align-top" rowSpan={rowCount}>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                        style={{ background: 'linear-gradient(135deg, #204184 0%, #4F67A8 100%)' }}
                                    >
                                        {comp.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-800">{comp.name}</span>
                                        <span className="block text-[10px] text-gray-400 mt-0.5">
                                            {t('priceSources', { n: rates.length })}
                                        </span>
                                    </div>
                                </div>
                            </td>
                        )}

                        {/* Source OTA */}
                        <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-gray-700">{rate.source}</span>
                                {rate.is_official && (
                                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">{t('official')}</span>
                                )}
                            </div>
                        </td>

                        {/* Price */}
                        <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <span className={`text-sm font-semibold ${hasPrice ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {hasPrice ? formatVND(price) : '—'}
                                </span>
                                {priceDiff !== null && (
                                    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${priceDiff > 0 ? 'bg-red-50 text-red-600'
                                        : priceDiff < 0 ? 'bg-green-50 text-green-600'
                                            : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {priceDiff > 0 ? <TrendingUp className="w-3 h-3" /> : priceDiff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                        {priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        </td>

                        {/* Availability */}
                        <td className="px-5 py-3 text-center">
                            <span className="text-xs text-gray-500">{availLabel}</span>
                        </td>

                        {/* Confidence */}
                        <td className="px-5 py-3 text-center">
                            <span className="text-xs font-medium" style={{ color: confidence.color }}>{confidence.label}</span>
                        </td>

                        {/* Updated */}
                        <td className="px-5 py-3 text-right">
                            <span className="text-xs text-gray-400">{timeAgo(rate.scraped_at)}</span>
                        </td>
                    </tr>
                );
            })}
        </>
    );
}
