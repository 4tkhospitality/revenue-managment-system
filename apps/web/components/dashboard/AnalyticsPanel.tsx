'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, Users, DollarSign, AlertCircle } from 'lucide-react';

/**
 * Analytics Panel Component
 * 
 * Displays STLY comparison, Pace vs LY, Pickup metrics
 * Integrates with features_daily data from Analytics Layer
 */

interface AnalyticsData {
    stay_date: string;
    rooms_otb: number;
    revenue_otb: number;
    stly_rooms?: number;
    stly_revenue?: number;
    stly_is_approx?: boolean;
    pickup_t30?: number;
    pickup_t15?: number;
    pickup_t7?: number;
    pickup_t5?: number;
    pickup_t3?: number;
    pace_vs_ly?: number;
    remaining_supply?: number;
}

interface AnalyticsPanelProps {
    hotelId: string;
    asOfDate?: string;
}

export default function AnalyticsPanel({ hotelId, asOfDate }: AnalyticsPanelProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<AnalyticsData[]>([]);
    const [summary, setSummary] = useState<{
        totalRooms: number;
        stlyRooms: number;
        paceVsLy: number;
        avgPickup7: number;
        avgRemSupply: number;
    } | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, [hotelId, asOfDate]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const dateParam = asOfDate ? `&asOf=${asOfDate}` : '';
            const res = await fetch(`/api/analytics/features?hotelId=${hotelId}${dateParam}`);

            if (!res.ok) {
                // Fallback: API not yet implemented, show placeholder
                setData([]);
                setSummary(null);
                setLoading(false);
                return;
            }

            const json = await res.json();
            const rows = json.rows || [];

            // Map API response to component format
            setData(rows.map((r: any) => ({
                ...r,
                stly_rooms: r.stly_rooms_otb,
                stly_revenue: r.stly_revenue_otb
            })));

            // Calculate summary from rows
            if (rows.length > 0) {
                const totalRooms = rows.reduce((s: number, x: any) => s + x.rooms_otb, 0);
                const stlyRooms = rows.reduce((s: number, x: any) => s + (x.stly_rooms_otb || 0), 0);
                const paceItems = rows.filter((x: any) => x.pace_vs_ly != null);
                const paceVsLy = paceItems.length > 0
                    ? paceItems.reduce((s: number, x: any) => s + (x.pace_vs_ly || 0), 0) / paceItems.length
                    : 0;
                const pickup7Items = rows.filter((x: any) => x.pickup_t7 != null);
                const avgPickup7 = pickup7Items.length > 0
                    ? pickup7Items.reduce((s: number, x: any) => s + (x.pickup_t7 || 0), 0) / pickup7Items.length
                    : 0;
                const remSupplyItems = rows.filter((x: any) => x.remaining_supply != null);
                const avgRemSupply = remSupplyItems.length > 0
                    ? remSupplyItems.reduce((s: number, x: any) => s + (x.remaining_supply || 0), 0) / remSupplyItems.length
                    : 0;

                setSummary({ totalRooms, stlyRooms, paceVsLy, avgPickup7, avgRemSupply });
            }
        } catch (err) {
            setError('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const formatPercent = (value: number | undefined | null) => {
        if (value == null) return '—';
        const pct = value * 100;
        const sign = pct >= 0 ? '+' : '';
        return `${sign}${pct.toFixed(1)}%`;
    };

    const getTrendIcon = (value: number | undefined | null) => {
        if (value == null) return <Minus className="w-4 h-4 text-gray-400" />;
        if (value > 0.05) return <TrendingUp className="w-4 h-4 text-green-500" />;
        if (value < -0.05) return <TrendingDown className="w-4 h-4 text-red-500" />;
        return <Minus className="w-4 h-4 text-gray-400" />;
    };

    const getTrendColor = (value: number | undefined | null) => {
        if (value == null) return 'text-gray-500';
        if (value > 0.05) return 'text-green-600';
        if (value < -0.05) return 'text-red-600';
        return 'text-gray-600';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    // Placeholder when no data/API not ready
    if (!summary) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Analytics Insights</h3>
                    <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                        Coming Soon
                    </span>
                </div>
                <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Chạy <code className="bg-gray-100 px-2 py-1 rounded text-sm">buildFeaturesDaily</code> để xem analytics</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Analytics Insights</h3>
                {asOfDate && (
                    <span className="text-sm text-gray-500">
                        As-of: {asOfDate}
                    </span>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Pace vs LY */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Pace vs LY</span>
                        {getTrendIcon(summary.paceVsLy)}
                    </div>
                    <div className={`text-2xl font-bold ${getTrendColor(summary.paceVsLy)}`}>
                        {formatPercent(summary.paceVsLy)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {summary.totalRooms} vs {summary.stlyRooms} rooms
                    </div>
                </div>

                {/* Pickup T-7 */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Avg Pickup (7d)</span>
                        <Users className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {summary.avgPickup7 > 0 ? '+' : ''}{summary.avgPickup7.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        rooms/day
                    </div>
                </div>

                {/* Remaining Supply */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Avg Rem. Supply</span>
                        <DollarSign className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {Math.round(summary.avgRemSupply)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        rooms available
                    </div>
                </div>

                {/* STLY Match Quality */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">STLY Coverage</span>
                        <Calendar className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {data.length > 0
                            ? Math.round((data.filter(d => d.stly_rooms != null).length / data.length) * 100)
                            : 0}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {data.filter(d => d.stly_is_approx).length} approx matches
                    </div>
                </div>
            </div>

            {/* Pickup Trend Table (Top 7 days) */}
            {data.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Pickup Trend (Next 7 Days)</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 px-2 text-gray-600">Date</th>
                                    <th className="text-right py-2 px-2 text-gray-600">OTB</th>
                                    <th className="text-right py-2 px-2 text-gray-600">STLY</th>
                                    <th className="text-right py-2 px-2 text-gray-600">Pace</th>
                                    <th className="text-right py-2 px-2 text-gray-600">T-7</th>
                                    <th className="text-right py-2 px-2 text-gray-600">T-3</th>
                                    <th className="text-right py-2 px-2 text-gray-600">Rem.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(0, 7).map((row, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-2 px-2 font-medium">
                                            {new Date(row.stay_date).toLocaleDateString('vi-VN', {
                                                weekday: 'short',
                                                day: '2-digit',
                                                month: '2-digit'
                                            })}
                                        </td>
                                        <td className="text-right py-2 px-2">{row.rooms_otb}</td>
                                        <td className="text-right py-2 px-2 text-gray-500">
                                            {row.stly_rooms ?? '—'}
                                            {row.stly_is_approx && <span className="text-xs text-amber-500 ml-1">~</span>}
                                        </td>
                                        <td className={`text-right py-2 px-2 ${getTrendColor(row.pace_vs_ly)}`}>
                                            {formatPercent(row.pace_vs_ly)}
                                        </td>
                                        <td className="text-right py-2 px-2">
                                            {row.pickup_t7 != null ? (row.pickup_t7 > 0 ? `+${row.pickup_t7}` : row.pickup_t7) : '—'}
                                        </td>
                                        <td className="text-right py-2 px-2">
                                            {row.pickup_t3 != null ? (row.pickup_t3 > 0 ? `+${row.pickup_t3}` : row.pickup_t3) : '—'}
                                        </td>
                                        <td className="text-right py-2 px-2 text-gray-500">
                                            {row.remaining_supply ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
