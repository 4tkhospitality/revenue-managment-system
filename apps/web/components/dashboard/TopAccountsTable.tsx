'use client';

import { useState, useEffect } from 'react';
import { Building2, AlertTriangle } from 'lucide-react';
import { DataStatusBadge } from '@/components/shared/DataStatusBadge';
import { AccountDetailModal } from './AccountDetailModal';

interface AccountRow {
    account: string;
    segment: string;
    bookings: number;
    roomNights: number;
    revenue: number;
    adr: number;
    cancelRate: number | null;
    cancelDataStatus: string;
}

interface TopAccountsData {
    accounts: AccountRow[];
    dataStatus: {
        hasCancelData: boolean;
        totalAccounts: number;
    };
}

interface TopAccountsTableProps {
    hotelId: string;
    asOfDate: string;
    days?: number;
}

const nf = new Intl.NumberFormat('vi-VN');
const nfCurrency = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

export function TopAccountsTable({ hotelId, asOfDate, days = 90 }: TopAccountsTableProps) {
    const [data, setData] = useState<TopAccountsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/analytics/top-accounts?hotelId=${hotelId}&asOfDate=${asOfDate}&days=${days}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const json = await res.json();
                setData(json);
            } catch (e) {
                setError('Không tải được dữ liệu');
            } finally {
                setLoading(false);
            }
        };
        if (asOfDate) fetchData();
    }, [hotelId, asOfDate, days]);

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-10 bg-gray-100 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <p className="text-gray-500 text-sm">{error || 'Không có dữ liệu'}</p>
            </div>
        );
    }

    if (data.accounts.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 mb-2"><Building2 className="w-4 h-4 text-slate-500" aria-hidden="true" /> Top Accounts</h3>
                <p className="text-gray-500 text-sm">Chưa có dữ liệu booking trong {days} ngày tới.</p>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-500" aria-hidden="true" /> Top Accounts
                        <span className="text-xs font-normal text-gray-500">({days} ngày)</span>
                    </h3>
                    <DataStatusBadge status={data.dataStatus.hasCancelData ? 'ok' : 'missing_cancel'} />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-2.5 text-left font-medium">#</th>
                                <th className="px-4 py-2.5 text-left font-medium">Account</th>
                                <th className="px-4 py-2.5 text-left font-medium">Segment</th>
                                <th className="px-4 py-2.5 text-right font-medium">Room-nights</th>
                                <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
                                <th className="px-4 py-2.5 text-right font-medium">ADR</th>
                                <th className="px-4 py-2.5 text-right font-medium">Cancel</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.accounts.map((a, i) => (
                                <tr
                                    key={a.account}
                                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedAccount(a.account)}
                                >
                                    <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{i + 1}</td>
                                    <td className="px-4 py-2.5 font-medium text-gray-900">{a.account}</td>
                                    <td className="px-4 py-2.5">
                                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${a.segment === 'OTA' ? 'bg-blue-50 text-blue-700' :
                                            a.segment === 'AGENT' ? 'bg-purple-50 text-purple-700' :
                                                a.segment === 'DIRECT' ? 'bg-emerald-50 text-emerald-700' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            {a.segment}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono">{nf.format(a.roomNights)}</td>
                                    <td className="px-4 py-2.5 text-right font-mono">{nfCurrency.format(a.revenue / 1000000)}M</td>
                                    <td className="px-4 py-2.5 text-right font-mono">{nfCurrency.format(a.adr)}</td>
                                    <td className="px-4 py-2.5 text-right">
                                        {a.cancelRate != null ? (
                                            <span className={`font-mono ${a.cancelRate > 0.15 ? 'text-amber-600 font-semibold' : 'text-gray-600'}`}>
                                                {(a.cancelRate * 100).toFixed(1)}%
                                                {a.cancelRate > 0.15 && <AlertTriangle className="w-3 h-3 inline ml-1 text-amber-500" aria-hidden="true" />}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer — click hint */}
                <div className="px-5 py-2 border-t border-gray-100 text-xs text-gray-400">
                    Click hàng để xem chi tiết account
                </div>
            </div>

            {/* Drill-down Modal */}
            {selectedAccount && (
                <AccountDetailModal
                    account={selectedAccount}
                    hotelId={hotelId}
                    asOfDate={asOfDate}
                    days={days}
                    onClose={() => setSelectedAccount(null)}
                />
            )}
        </>
    );
}
