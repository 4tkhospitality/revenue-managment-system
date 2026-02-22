'use client';

import { useState, useEffect } from 'react';
import { Receipt, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface PaymentRecord {
    id: string;
    orderId: string;
    gateway: string;
    amount: number;
    currency: string;
    status: string;
    purchasedTier: string | null;
    purchasedRoomBand: string | null;
    billingCycle: string | null;
    termMonths: number | null;
    description: string | null;
    createdAt: string;
    completedAt: string | null;
    failedAt: string | null;
    failedReason: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
    COMPLETED: { label: 'Completed', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle },
    PENDING: { label: 'Processing', color: 'text-amber-600 bg-amber-50', icon: Clock },
    FAILED: { label: 'Failed', color: 'text-red-600 bg-red-50', icon: XCircle },
    EXPIRED: { label: 'Expired', color: 'text-gray-600 bg-gray-50', icon: AlertTriangle },
    REFUNDED: { label: 'Refunded', color: 'text-blue-600 bg-blue-50', icon: Receipt },
};

const TIER_LABELS: Record<string, string> = {
    STANDARD: 'Standard',
    SUPERIOR: 'Superior',
    DELUXE: 'Deluxe',
    SUITE: 'Suite',
};

const GATEWAY_LABELS: Record<string, string> = {
    SEPAY: 'SePay',
    PAYPAL: 'PayPal',
    ZALO_MANUAL: 'Zalo (Manual)',
    ADMIN_MANUAL: 'Admin',
};

function formatAmount(amount: number, currency: string): string {
    if (currency === 'VND') {
        return amount.toLocaleString('vi-VN') + '₫';
    }
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2 });
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function PaymentHistoryPanel() {
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/payments/history')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load');
                return res.json();
            })
            .then(data => {
                setPayments(data.payments || []);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 text-gray-400">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-2" />
                Loading payment history...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-gray-400">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                <p className="text-sm">Cannot load payment history</p>
            </div>
        );
    }

    if (payments.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No payment transactions yet</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs uppercase">Date</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs uppercase">Order ID</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs uppercase">Plan</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs uppercase">Method</th>
                        <th className="text-right py-3 px-3 font-medium text-gray-500 text-xs uppercase">Amount</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-500 text-xs uppercase">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {payments.map((p) => {
                        const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING;
                        const StatusIcon = statusCfg.icon;
                        return (
                            <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                                    {formatDate(p.createdAt)}
                                </td>
                                <td className="py-3 px-3 font-mono text-xs text-gray-500" title={p.orderId}>
                                    {p.orderId.length > 20 ? p.orderId.slice(0, 20) + '…' : p.orderId}
                                </td>
                                <td className="py-3 px-3">
                                    <div className="text-gray-900 font-medium">
                                        {p.purchasedTier ? TIER_LABELS[p.purchasedTier] || p.purchasedTier : '—'}
                                    </div>
                                    {p.termMonths && (
                                        <div className="text-xs text-gray-400">
                                            {p.termMonths === 1 ? '1 month' : `${p.termMonths} months`}
                                        </div>
                                    )}
                                </td>
                                <td className="py-3 px-3 text-gray-600">
                                    {GATEWAY_LABELS[p.gateway] || p.gateway}
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-medium text-gray-900">
                                    {formatAmount(p.amount, p.currency)}
                                </td>
                                <td className="py-3 px-3">
                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {statusCfg.label}
                                    </div>
                                    {p.failedReason && (
                                        <div className="text-xs text-red-400 mt-0.5">{p.failedReason}</div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
