'use client';

/**
 * /daily - Daily Action Assistant Page
 * "5 phút/ngày để ra quyết định giá"
 */

import { useEffect, useState } from 'react';
import { CalendarCheck, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import { PageHeader } from '@/components/shared/PageHeader';
import { ExportPdfButton } from '@/components/shared/ExportPdfButton';
import { TierPaywall } from '@/components/paywall/TierPaywall';
import { useTierAccess } from '@/hooks/useTierAccess';

interface DailyAction {
    stay_date: string;
    action: 'INCREASE' | 'KEEP' | 'DECREASE';
    delta_pct: number;
    recommended_rate: number;
    current_rate: number;
    reason_key: string;
    reason_text: string;
    confidence: 'high' | 'medium' | 'low';
    inputs: {
        occ_today: number;
        pickup_7d: number | null;
        baseline_pickup: number;
        pickup_index: number;
        remaining_supply: number;
    };
    accepted?: boolean;
}

interface DailyResult {
    hotel_id: string;
    generated_at: string;
    base_rate: number;
    base_rate_source: string;
    actions: DailyAction[];
    summary: {
        total: number;
        increases: number;
        keeps: number;
        decreases: number;
    };
}

export default function DailyPage() {
    const { hasAccess, loading: tierLoading } = useTierAccess('SUPERIOR');
    const [data, setData] = useState<DailyResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [upgradeRequired, setUpgradeRequired] = useState(false);
    const [acceptedDates, setAcceptedDates] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!hasAccess || tierLoading) return; // Don't fetch if no access
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/daily/recommendations?days=30`);
                if (res.status === 403) {
                    setUpgradeRequired(true);
                    setLoading(false);
                    return;
                }
                if (!res.ok) throw new Error('Failed to fetch');
                const json = await res.json();
                setData(json);
                setError(null);
            } catch {
                setError('Không thể tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [hasAccess, tierLoading]);

    // Tier gate: show paywall for non-SUPERIOR users
    // MUST be after all hooks to avoid React hooks order violation
    if (!tierLoading && !hasAccess) {
        return (
            <TierPaywall
                title="Daily Actions"
                subtitle="Gợi ý giá hàng ngày • 5 phút/ngày để ra quyết định"
                tierDisplayName="Superior"
                colorScheme="blue"
                features={[
                    { icon: <CalendarCheck className="w-4 h-4" />, label: 'Gợi ý tăng/giữ/giảm giá cho 30 ngày tới' },
                    { icon: <TrendingUp className="w-4 h-4" />, label: 'Phân tích OCC, Pickup, Supply tự động' },
                    { icon: <DollarSign className="w-4 h-4" />, label: 'Mức giá đề xuất dựa trên thuật toán AI' },
                    { icon: <BarChart3 className="w-4 h-4" />, label: 'Accept/Override — ra quyết định nhanh' },
                ]}
            />
        );
    }

    const handleAccept = (dateStr: string) => {
        setAcceptedDates((prev) => new Set([...prev, dateStr]));
    };

    const handleAcceptAll = () => {
        if (!data) return;
        const allDates = data.actions.map((a) => a.stay_date.split('T')[0]);
        setAcceptedDates(new Set(allDates));
    };

    const formatVND = (n: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

    const formatDate = (d: string) => {
        const date = new Date(d);
        return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'INCREASE':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'DECREASE':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'INCREASE':
                return '↑';
            case 'DECREASE':
                return '↓';
            default:
                return '→';
        }
    };

    if (upgradeRequired) {
        return (
            <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                <PageHeader
                    title="Daily Actions"
                    subtitle="Gợi ý giá hàng ngày"
                />
                <UpgradeBanner feature="daily_actions" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Header - Matching Dashboard style */}
            <PageHeader
                title="Daily Actions"
                subtitle="Gợi ý giá cho 30 ngày tới • 5 phút/ngày"
                rightContent={
                    <div className="flex items-center gap-3">
                        {data && (
                            <button
                                onClick={handleAcceptAll}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors text-sm whitespace-nowrap pdf-hide"
                            >
                                ✅ Accept All ({data.summary.total - acceptedDates.size} còn lại)
                            </button>
                        )}
                        <ExportPdfButton
                            targetId="daily-pdf-content"
                            filename={`daily-actions-${new Date().toISOString().split('T')[0]}`}
                            pageType="daily"
                        />
                    </div>
                }
            />

            {/* PDF Content Container */}
            <div id="daily-pdf-content" className="space-y-4 sm:space-y-6">
                {data && (
                    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.06)] px-5 py-3">
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500">Base Rate:</span>
                            <span className="font-semibold" style={{ color: '#2D4A8C' }}>{formatVND(data.base_rate)}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-gray-500">Nguồn:</span>
                            <span className="text-gray-700">
                                {data.base_rate_source === 'hotel_setting' && '⚙️ Cài đặt khách sạn'}
                                {data.base_rate_source === 'last_decision' && '📝 Quyết định gần nhất'}
                                {data.base_rate_source === 'otb_derived' && '📊 Tính từ dữ liệu OTB'}
                                {data.base_rate_source === 'user_input' && '⚠️ Chưa có - cần nhập'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Summary Cards - Matching Dashboard KPI style */}
                {data && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.06)] p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900">{data.summary.total}</div>
                            <div className="text-sm text-gray-500">Tổng ngày</div>
                        </div>
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 shadow-[0_1px_2px_rgba(16,185,129,0.1)] p-4 text-center">
                            <div className="text-2xl font-bold text-emerald-600">{data.summary.increases}</div>
                            <div className="text-sm text-emerald-600">Tăng giá</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4 text-center">
                            <div className="text-2xl font-bold text-slate-600">{data.summary.keeps}</div>
                            <div className="text-sm text-slate-500">Giữ giá</div>
                        </div>
                        <div className="rounded-2xl bg-rose-50 border border-rose-200 shadow-[0_1px_2px_rgba(244,63,94,0.1)] p-4 text-center">
                            <div className="text-2xl font-bold text-rose-600">{data.summary.decreases}</div>
                            <div className="text-sm text-rose-600">Giảm giá</div>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-500">Đang tính toán...</span>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                        {error}
                    </div>
                )}

                {/* Actions Table - Matching Dashboard Style */}
                {data && !loading && (
                    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.06)] overflow-hidden">
                        {/* Table Header */}
                        <div className="px-5 py-4 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Gợi ý điều chỉnh giá
                                </h2>
                                <div className="text-xs text-gray-400">
                                    {data.actions.length} ngày
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto max-h-[500px]">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10">
                                    <tr style={{ backgroundColor: '#f8fafc' }} className="text-left">
                                        <th className="px-4 py-3 font-medium text-gray-500 sticky left-0" style={{ backgroundColor: '#f8fafc' }}>
                                            Ngày
                                        </th>
                                        <th className="px-4 py-3 font-medium text-gray-500 text-center">
                                            Action
                                        </th>
                                        <th className="px-4 py-3 font-medium text-gray-500 text-right">
                                            Giá đề xuất
                                        </th>
                                        <th className="px-4 py-3 font-medium text-gray-500 text-center">
                                            Delta
                                        </th>
                                        <th className="px-4 py-3 font-medium text-gray-500">
                                            Lý do
                                        </th>
                                        <th className="px-4 py-3 font-medium text-gray-500 text-center">
                                            OCC
                                        </th>
                                        <th className="px-4 py-3 font-medium text-gray-500 text-center">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.actions.map((action) => {
                                        const dateKey = action.stay_date.split('T')[0];
                                        const isAccepted = acceptedDates.has(dateKey);
                                        const date = new Date(action.stay_date);
                                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
                                        const formattedDate = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

                                        return (
                                            <tr
                                                key={dateKey}
                                                className={`transition-colors ${isAccepted
                                                    ? 'bg-emerald-50'
                                                    : isWeekend
                                                        ? 'bg-amber-50'
                                                        : 'hover:bg-gray-50'
                                                    }`}
                                                style={{ borderTop: '1px solid #e2e8f0' }}
                                            >
                                                <td className="px-4 py-3 sticky left-0 bg-inherit">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-medium w-8 ${isWeekend ? 'text-amber-600' : 'text-gray-400'}`}>
                                                            {dayOfWeek}
                                                        </span>
                                                        <span className="text-gray-900 font-medium">{formattedDate}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getActionColor(action.action)}`}
                                                    >
                                                        {getActionIcon(action.action)} {action.action}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span style={{ color: '#2D4A8C' }} className="font-semibold">
                                                        {formatVND(action.recommended_rate)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={`font-medium ${action.delta_pct > 0
                                                            ? 'text-emerald-600'
                                                            : action.delta_pct < 0
                                                                ? 'text-rose-600'
                                                                : 'text-gray-500'
                                                            }`}
                                                    >
                                                        {action.delta_pct > 0 ? '+' : ''}
                                                        {action.delta_pct}%
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 max-w-xs truncate text-sm">
                                                    {action.reason_text}
                                                </td>
                                                <td className="px-4 py-3 text-center text-gray-600">
                                                    {(action.inputs.occ_today * 100).toFixed(0)}%
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {isAccepted ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs">
                                                            <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">✓</span>
                                                            Done
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleAccept(dateKey)}
                                                            className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-xs font-medium transition-colors"
                                                        >
                                                            Accept
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Legend */}
                        <div className="px-4 py-3 border-t bg-gray-50 space-y-1" style={{ borderColor: '#e2e8f0' }}>
                            <div className="text-[10px] text-gray-400">
                                🟡 Cuối tuần (T7/CN) | 🟢 Đã chấp nhận | 📈 Tăng giá | 📉 Giảm giá | ➡️ Giữ nguyên
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
