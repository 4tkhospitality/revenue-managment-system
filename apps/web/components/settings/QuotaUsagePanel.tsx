'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';

interface QuotaData {
    limits: {
        maxImportsMonth: number;
        maxExportsDay: number;
        includedRateShopsMonth: number;
        maxUsers: number;
        dataRetentionMonths: number;
    };
    usage: {
        importsThisMonth: number;
        exportsToday: number;
    };
}

function ProgressBar({ label, used, limit, unit }: { label: string; used: number; limit: number; unit?: string }) {
    const isUnlimited = limit === 0;
    const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
    const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500';
    const textColor = pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-gray-600';

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className={`font-medium ${textColor}`}>
                    {used}/{isUnlimited ? '∞' : limit}
                    {unit ? ` ${unit}` : ''}
                </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${isUnlimited ? 5 : pct}%` }} />
            </div>
        </div>
    );
}

export function QuotaUsagePanel({ hotelId }: { hotelId?: string }) {
    const [data, setData] = useState<QuotaData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const url = hotelId ? `/api/subscription?hotelId=${hotelId}` : '/api/subscription';
        fetch(url)
            .then((r) => r.json())
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [hotelId]);

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                <span className="text-sm text-gray-400">Loading quotas...</span>
            </div>
        );
    }

    if (!data?.limits) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Usage Quotas</h3>
            </div>
            <div className="space-y-3">
                <ProgressBar
                    label="Imports (monthly)"
                    used={data.usage.importsThisMonth}
                    limit={data.limits.maxImportsMonth}
                />
                <ProgressBar
                    label="Exports (daily)"
                    used={data.usage.exportsToday}
                    limit={data.limits.maxExportsDay}
                    unit="per day"
                />
                <ProgressBar
                    label="Rate Shops (monthly)"
                    used={0}
                    limit={data.limits.includedRateShopsMonth}
                />
                <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-500">Data Retention</span>
                    <span className="font-medium text-gray-700">
                        {data.limits.dataRetentionMonths === 0 ? '∞' : `${data.limits.dataRetentionMonths} months`}
                    </span>
                </div>
            </div>
        </div>
    );
}
