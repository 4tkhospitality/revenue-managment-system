'use client';

import { useState, useEffect } from 'react';

/**
 * Shows a banner when the current hotel's subscription has expired.
 * Appears at the bottom of the sidebar.
 */
export function SubscriptionBanner() {
    const [isExpired, setIsExpired] = useState(false);
    const [periodEnd, setPeriodEnd] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/subscription')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data) {
                    setIsExpired(data.isExpired || false);
                    setPeriodEnd(data.periodEnd || null);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading || !isExpired) return null;

    const expiredDate = periodEnd
        ? new Date(periodEnd).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '';

    return (
        <div className="mx-3 mb-3 p-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/30 rounded-xl">
            <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">⚠️</span>
                <div className="min-w-0">
                    <p className="text-white text-sm font-semibold">Gói đã hết hạn</p>
                    {expiredDate && (
                        <p className="text-white/60 text-xs mt-0.5">
                            Hết hạn: {expiredDate}
                        </p>
                    )}
                    <p className="text-white/70 text-xs mt-1">
                        Các tính năng nâng cao đã bị khóa. Liên hệ admin để gia hạn.
                    </p>
                </div>
            </div>
        </div>
    );
}
