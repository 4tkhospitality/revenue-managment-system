'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, Calendar, Users, DollarSign, AlertCircle, ArrowRight, Info, ChevronRight } from 'lucide-react';

// Metric tooltips for non-Revenue users (GM/Owner)
const METRIC_TIPS: Record<string, { label: string; tip: string; good: string }> = {
    pace: {
        label: 'Pace vs LY',
        tip: 'So sánh số phòng đã bán năm nay với cùng kỳ năm ngoái (Same Time Last Year). Ví dụ: +50% nghĩa là năm nay bán nhiều gấp rưỡi.',
        good: '🟢 Dương = bán tốt hơn năm ngoái. 🔴 Âm = bán ít hơn → cần tăng marketing/giảm giá.',
    },
    pickup: {
        label: 'Avg Pickup (7 ngày)',
        tip: 'Trung bình số phòng được đặt thêm mỗi ngày trong 7 ngày qua. Ví dụ: +3.5 nghĩa là mỗi ngày có thêm 3-4 booking mới.',
        good: '🟢 Càng cao càng tốt, nghĩa là demand đang mạnh. Số 0 = chưa đủ dữ liệu lịch sử (cần ít nhất 2 OTB snapshots cách nhau 7 ngày).',
    },
    supply: {
        label: 'Avg Rem. Supply',
        tip: 'Trung bình số phòng CÒN TRỐNG chưa bán. Đây là inventory còn lại.',
        good: '🟢 Thấp = gần full → có thể tăng giá. 🟡 Quá cao = nhiều phòng trống → cần đẩy bán.',
    },
    stly: {
        label: 'STLY Coverage',
        tip: 'Phần trăm ngày có dữ liệu để so sánh với cùng kỳ năm ngoái. 100% = tất cả ngày đều có data năm ngoái để so.',
        good: '🟢 ≥80% là tốt, đủ để phân tích. 🟡 <50% = thiếu data năm ngoái → kết quả so sánh chưa chính xác.',
    },
    t7: {
        label: 'T-7',
        tip: 'Số phòng được đặt THÊM trong 7 ngày qua (cho ngày lưu trú đó). Ví dụ: +5 nghĩa là so với 7 ngày trước, ngày này có thêm 5 booking.',
        good: '🟢 Dương = có thêm đặt phòng. Dấu — nghĩa là chưa đủ data lịch sử (cần OTB snapshot 7 ngày trước).',
    },
    t3: {
        label: 'T-3',
        tip: 'Số phòng được đặt THÊM trong 3 ngày gần nhất. Giống T-7 nhưng ngắn hạn hơn, cho thấy xu hướng gần đây.',
        good: '🟢 Dương = demand đang tăng gần. Dấu — = chưa đủ data (cần OTB snapshot 3 ngày trước).',
    },
    otb: {
        label: 'OTB (On The Books)',
        tip: 'Tổng số phòng ĐÃ ĐẶT cho ngày lưu trú đó (trừ phòng đã hủy).',
        good: 'Đây là số phòng chắc chắn đã có. Càng gần capacity = càng tốt.',
    },
    stlyCol: {
        label: 'STLY',
        tip: 'Cùng kỳ năm ngoái (Same Time Last Year) — số phòng đã bán cho ngày tương ứng năm trước.',
        good: 'Dùng để so sánh: Năm nay bán tốt hơn hay kém hơn năm ngoái?',
    },
    paceCol: {
        label: 'Pace',
        tip: 'Tỷ lệ % chênh lệch giữa năm nay và cùng kỳ năm ngoái. +200% = bán gấp 3. -50% = bán ít hơn nửa.',
        good: '🟢 Dương xanh = tốt hơn năm ngoái. 🔴 Âm đỏ = kém hơn → cần hành động.',
    },
    rem: {
        label: 'Rem. (Remaining)',
        tip: 'Số phòng còn trống cho ngày đó = Tổng phòng − OTB.',
        good: '🟢 Thấp = gần full, cân nhắc tăng giá. 🟡 Cao = nhiều phòng trống.',
    },
};

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
    /** Limit displayed table rows (e.g., 7 for Tab 1 preview) */
    maxDays?: number;
}

export default function AnalyticsPanel({ hotelId, asOfDate, maxDays }: AnalyticsPanelProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<AnalyticsData[]>([]);
    const [emptyReason, setEmptyReason] = useState<'api_error' | 'no_features' | 'no_features_for_date' | null>(null);
    const [emptyHint, setEmptyHint] = useState<string | null>(null);
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
        setEmptyReason(null);
        setEmptyHint(null);
        try {
            const dateParam = asOfDate ? `&asOf=${asOfDate}` : '';
            const res = await fetch(`/api/analytics/features?hotelId=${hotelId}${dateParam}`);

            if (!res.ok) {
                // API returned error — distinguish no-features vs server error
                try {
                    const errJson = await res.json();
                    if (errJson.error?.includes('No features data')) {
                        setEmptyReason('no_features');
                    } else {
                        setEmptyReason('api_error');
                    }
                    setEmptyHint(errJson.hint || null);
                } catch {
                    setEmptyReason('api_error');
                }
                setData([]);
                setSummary(null);
                setLoading(false);
                return;
            }

            const json = await res.json();
            const rows = json.rows || [];

            // Check for API warning (features empty for explicit date)
            if (json.warning === 'NO_FEATURES_FOR_DATE') {
                setEmptyReason('no_features_for_date');
                setEmptyHint(json.latestAvailable
                    ? `Ngày gần nhất có sẵn: ${json.latestAvailable}`
                    : null);
                setData([]);
                setSummary(null);
                setLoading(false);
                return;
            }

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
                // paceVsLy as decimal ratio: (total - stly) / stly
                const paceVsLy = stlyRooms > 0
                    ? (totalRooms - stlyRooms) / stlyRooms
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
            } else {
                // API returned 200 but 0 rows (shouldn't happen now, but safety)
                setEmptyReason('no_features_for_date');
            }
        } catch (err) {
            setError('Lỗi tải dữ liệu phân tích');
            setEmptyReason('api_error');
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

    // Placeholder when no data — show reason-specific Vietnamese message
    if (!summary) {
        let message: string;
        let showDataLink = false;

        switch (emptyReason) {
            case 'api_error':
                message = 'Lỗi tải dữ liệu phân tích. Vui lòng thử lại sau.';
                break;
            case 'no_features':
                message = 'Chưa có dữ liệu phân tích.';
                showDataLink = true;
                break;
            case 'no_features_for_date':
                message = `Chưa có dữ liệu phân tích cho ngày ${asOfDate || 'hiện tại'}.`;
                showDataLink = true;
                break;
            default:
                message = 'Chưa có dữ liệu phân tích.';
                showDataLink = true;
        }

        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Analytics Insights</h3>
                </div>
                <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="mb-1">{message}</p>
                    {emptyHint && (
                        <p className="text-xs text-gray-400 mb-3">{emptyHint}</p>
                    )}
                    {showDataLink && (
                        <Link
                            href="/data"
                            className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Vào Quản lý dữ liệu → Build Features
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}
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
                <div className="bg-gray-50 rounded-lg p-4 group relative">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                            Pace vs LY
                            <span className="cursor-help" title={`${METRIC_TIPS.pace.tip}\n\n${METRIC_TIPS.pace.good}`}>
                                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500" />
                            </span>
                        </span>
                        {getTrendIcon(summary.paceVsLy)}
                    </div>
                    <div className={`text-2xl font-bold ${getTrendColor(summary.paceVsLy)}`}>
                        {formatPercent(summary.paceVsLy)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {summary.totalRooms} vs {summary.stlyRooms} phòng
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                        {summary.paceVsLy > 0.05 ? '↑ Tốt hơn năm ngoái' : summary.paceVsLy < -0.05 ? '↓ Kém hơn năm ngoái' : '≈ Ngang năm ngoái'}
                    </div>
                </div>

                {/* Pickup T-7 */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                            Avg Pickup (7 ngày)
                            <span className="cursor-help" title={`${METRIC_TIPS.pickup.tip}\n\n${METRIC_TIPS.pickup.good}`}>
                                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500" />
                            </span>
                        </span>
                        <Users className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {summary.avgPickup7 > 0 ? '+' : ''}{summary.avgPickup7.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        phòng/ngày
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                        {summary.avgPickup7 > 0 ? '↑ Đang có thêm booking' : summary.avgPickup7 === 0 ? 'Chưa đủ dữ liệu lịch sử' : '↓ Booking giảm'}
                    </div>
                </div>

                {/* Remaining Supply */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                            TB Phòng Trống
                            <span className="cursor-help" title={`${METRIC_TIPS.supply.tip}\n\n${METRIC_TIPS.supply.good}`}>
                                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500" />
                            </span>
                        </span>
                        <DollarSign className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {Math.round(summary.avgRemSupply)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        phòng còn trống
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                        {summary.avgRemSupply <= 10 ? '🔥 Gần full — cân nhắc tăng giá' : summary.avgRemSupply <= 30 ? '👍 Ổn — đang bán tốt' : '⚡ Nhiều phòng trống — cần đẩy bán'}
                    </div>
                </div>

                {/* STLY Match Quality */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                            So sánh năm ngoái
                            <span className="cursor-help" title={`${METRIC_TIPS.stly.tip}\n\n${METRIC_TIPS.stly.good}`}>
                                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500" />
                            </span>
                        </span>
                        <Calendar className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {data.length > 0
                            ? Math.round((data.filter(d => d.stly_rooms != null).length / data.length) * 100)
                            : 0}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {data.filter(d => d.stly_is_approx).length} ngày dùng xấp xỉ
                    </div>
                    {(() => {
                        const cov = data.length > 0 ? Math.round((data.filter(d => d.stly_rooms != null).length / data.length) * 100) : 0;
                        return <div className="text-[10px] text-gray-400 mt-0.5">
                            {cov >= 80 ? '✅ Đủ data so sánh' : cov >= 50 ? '⚠️ Thiếu một ít data năm ngoái' : '❌ Thiếu nhiều — kết quả chưa chính xác'}
                        </div>;
                    })()}
                </div>
            </div>

            {/* Pickup Trend Table (Top 7 days) */}
            {data.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Xu hướng đặt phòng (7 ngày tới)</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 px-2 text-gray-600">Ngày</th>
                                    <th className="text-right py-2 px-2 text-gray-600 cursor-help" title={METRIC_TIPS.otb.tip}>Đã đặt</th>
                                    <th className="text-right py-2 px-2 text-gray-600 cursor-help" title={METRIC_TIPS.stlyCol.tip}>Năm trước</th>
                                    <th className="text-right py-2 px-2 text-gray-600 cursor-help" title={`${METRIC_TIPS.paceCol.tip}\n${METRIC_TIPS.paceCol.good}`}>So sánh</th>
                                    <th className="text-right py-2 px-2 text-gray-600 cursor-help" title={`${METRIC_TIPS.t7.tip}\n${METRIC_TIPS.t7.good}`}>+7 ngày</th>
                                    <th className="text-right py-2 px-2 text-gray-600 cursor-help" title={`${METRIC_TIPS.t3.tip}\n${METRIC_TIPS.t3.good}`}>+3 ngày</th>
                                    <th className="text-right py-2 px-2 text-gray-600 cursor-help" title={METRIC_TIPS.rem.tip}>Trống</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(0, maxDays || 7).map((row, idx) => (
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
                                        <td className={`text-right py-2 px-2 ${getTrendColor(row.stly_rooms != null && row.stly_rooms > 0 ? (row.rooms_otb - row.stly_rooms) / row.stly_rooms : row.pace_vs_ly)}`}>
                                            {row.stly_rooms != null && row.stly_rooms > 0
                                                ? formatPercent((row.rooms_otb - row.stly_rooms) / row.stly_rooms)
                                                : formatPercent(row.pace_vs_ly)}
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

            {/* "Xem thêm" link — only shown when maxDays limits the view */}
            {maxDays && data.length > maxDays && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-center">
                    <Link
                        href="?tab=pricing"
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
                    >
                        Xem thêm {data.length - maxDays} ngày
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            )}
        </div>
    );
}
