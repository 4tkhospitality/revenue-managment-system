'use client';

import { useState, useEffect } from 'react';

interface AccountDetailData {
    account: string;
    byDate: Array<{ stayDate: string; roomNights: number; revenue: number }>;
    byRoomType: Array<{ roomCode: string; roomNights: number; share: number; revenue: number }>;
}

interface AccountDetailModalProps {
    account: string;
    hotelId: string;
    asOfDate: string;
    days: number;
    onClose: () => void;
}

const nf = new Intl.NumberFormat('vi-VN');
const nfCurrency = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

export function AccountDetailModal({ account, hotelId, asOfDate, days, onClose }: AccountDetailModalProps) {
    const [data, setData] = useState<AccountDetailData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/analytics/account-detail?hotelId=${hotelId}&account=${encodeURIComponent(account)}&asOfDate=${asOfDate}&days=${days}`);
                if (res.ok) setData(await res.json());
            } catch { /* ignore */ }
            setLoading(false);
        };
        fetchData();
    }, [account, hotelId, asOfDate, days]);

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const totalRN = data?.byRoomType.reduce((s, r) => s + r.roomNights, 0) || 0;
    const totalRev = data?.byRoomType.reduce((s, r) => s + r.revenue, 0) || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">📋 {account}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Chi tiết booking • {days} ngày</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-6 space-y-6">
                    {loading ? (
                        <div className="space-y-3 animate-pulse">
                            <div className="h-8 bg-gray-100 rounded" />
                            <div className="h-32 bg-gray-100 rounded" />
                        </div>
                    ) : !data ? (
                        <p className="text-gray-500 text-sm">Không có dữ liệu</p>
                    ) : (
                        <>
                            {/* Summary pills */}
                            <div className="flex gap-3 flex-wrap">
                                <div className="px-4 py-2 bg-blue-50 rounded-xl">
                                    <span className="text-xs text-blue-600">Room-nights</span>
                                    <p className="text-lg font-bold text-blue-900">{nf.format(totalRN)}</p>
                                </div>
                                <div className="px-4 py-2 bg-emerald-50 rounded-xl">
                                    <span className="text-xs text-emerald-600">Revenue</span>
                                    <p className="text-lg font-bold text-emerald-900">{nfCurrency.format(totalRev / 1000000)}M</p>
                                </div>
                            </div>

                            {/* By Room Type */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Phân bổ theo Room Type</h4>
                                <div className="space-y-2">
                                    {data.byRoomType.map(r => (
                                        <div key={r.roomCode} className="flex items-center gap-3">
                                            <span className="w-16 text-xs font-mono text-gray-600">{r.roomCode}</span>
                                            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full flex items-center justify-end px-2"
                                                    style={{ width: `${Math.max(r.share * 100, 5)}%` }}
                                                >
                                                    <span className="text-[10px] text-white font-medium">
                                                        {(r.share * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="w-12 text-xs text-right text-gray-500">{r.roomNights} RN</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* By Stay Date (condensed table) */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                    Timeline ({data.byDate.length} ngày có booking)
                                </h4>
                                <div className="max-h-48 overflow-y-auto">
                                    <table className="w-full text-xs">
                                        <thead className="sticky top-0 bg-white">
                                            <tr className="text-gray-400 border-b">
                                                <th className="py-1.5 text-left font-medium">Ngày</th>
                                                <th className="py-1.5 text-right font-medium">RN</th>
                                                <th className="py-1.5 text-right font-medium">Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {data.byDate.map(d => (
                                                <tr key={d.stayDate} className="hover:bg-gray-50">
                                                    <td className="py-1.5 font-mono">{new Date(d.stayDate).toLocaleDateString('vi-VN')}</td>
                                                    <td className="py-1.5 text-right">{d.roomNights}</td>
                                                    <td className="py-1.5 text-right">{nfCurrency.format(d.revenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
