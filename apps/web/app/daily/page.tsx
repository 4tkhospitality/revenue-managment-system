'use client';

/**
 * /daily - Daily Action Assistant Page
 * "5 phút/ngày để ra quyết định giá"
 */

import { useEffect, useState } from 'react';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import { PageHeader } from '@/components/shared/PageHeader';

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
    const [data, setData] = useState<DailyResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [upgradeRequired, setUpgradeRequired] = useState(false);
    const [acceptedDates, setAcceptedDates] = useState<Set<string>>(new Set());

    useEffect(() => {
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
    }, []);

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
        <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Daily Actions"
                    subtitle="Gợi ý giá cho 30 ngày tới • 5 phút/ngày"
                />
                {data && (
                    <button
                        onClick={handleAcceptAll}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        ✅ Accept All ({data.summary.total - acceptedDates.size} còn lại)
                    </button>
                )}
            </div>

            {/* Base Rate Info */}
            {data && (
                <div className="bg-white rounded-xl border p-4 mb-6">
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">Base Rate:</span>
                        <span className="font-semibold text-gray-900">{formatVND(data.base_rate)}</span>
                        <span className="text-gray-400">|</span>
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

            {/* Summary Cards */}
            {data && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl border p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{data.summary.total}</div>
                        <div className="text-sm text-gray-500">Tổng ngày</div>
                    </div>
                    <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{data.summary.increases}</div>
                        <div className="text-sm text-green-600">Tăng giá</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl border p-4 text-center">
                        <div className="text-2xl font-bold text-gray-600">{data.summary.keeps}</div>
                        <div className="text-sm text-gray-500">Giữ giá</div>
                    </div>
                    <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{data.summary.decreases}</div>
                        <div className="text-sm text-red-600">Giảm giá</div>
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

            {/* Actions List */}
            {data && !loading && (
                <div className="bg-white rounded-xl border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Ngày</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-600">Action</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-600">Giá đề xuất</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-600">Delta</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Lý do</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-600">OCC</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-600"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.actions.map((action) => {
                                const dateKey = action.stay_date.split('T')[0];
                                const isAccepted = acceptedDates.has(dateKey);

                                return (
                                    <tr
                                        key={dateKey}
                                        className={`border-b hover:bg-gray-50 transition-colors ${isAccepted ? 'bg-green-50/50' : ''
                                            }`}
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {formatDate(action.stay_date)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getActionColor(
                                                    action.action
                                                )}`}
                                            >
                                                {getActionIcon(action.action)} {action.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                            {formatVND(action.recommended_rate)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`font-medium ${action.delta_pct > 0
                                                    ? 'text-green-600'
                                                    : action.delta_pct < 0
                                                        ? 'text-red-600'
                                                        : 'text-gray-500'
                                                    }`}
                                            >
                                                {action.delta_pct > 0 ? '+' : ''}
                                                {action.delta_pct}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                                            {action.reason_text}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-600">
                                            {(action.inputs.occ_today * 100).toFixed(0)}%
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {isAccepted ? (
                                                <span className="text-green-600 font-medium">✓ Accepted</span>
                                            ) : (
                                                <button
                                                    onClick={() => handleAccept(dateKey)}
                                                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium transition-colors"
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
            )}
        </div>
    );
}
