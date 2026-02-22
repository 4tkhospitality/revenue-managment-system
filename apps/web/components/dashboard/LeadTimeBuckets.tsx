'use client';

import { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DataStatusBadge } from '@/components/shared/DataStatusBadge';
import { useTranslations } from 'next-intl';

interface BucketItem {
    bucket: string;
    count: number;
    share: number;
    roomNights: number;
}

interface LeadTimeData {
    buckets: BucketItem[];
    avgLeadTime: number | null;
    dataStatus: { hasBookTime: boolean };
}

interface LeadTimeBucketsProps {
    hotelId: string;
    asOfDate: string;
    days?: number;
    isPdfMode?: boolean;
}

const nf = new Intl.NumberFormat('vi-VN');

const BUCKET_COLORS: Record<string, string> = {
    '0-3d': '#EF4444',
    '4-7d': '#F59E0B',
    '8-14d': '#3B82F6',
    '15-30d': '#10B981',
    '31d+': '#8B5CF6',
};

export function LeadTimeBuckets({ hotelId, asOfDate, days = 90, isPdfMode = false }: LeadTimeBucketsProps) {
    const t = useTranslations('analytics');
    const [data, setData] = useState<LeadTimeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/analytics/lead-time?hotelId=${hotelId}&asOfDate=${asOfDate}&days=${days}`);
                if (!res.ok) throw new Error('Failed to fetch');
                setData(await res.json());
            } catch {
                setError(t('errorLoadingData'));
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
                <div className="h-48 bg-gray-100 rounded-lg" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <p className="text-gray-500 text-sm">{error || t('noData')}</p>
            </div>
        );
    }

    if (!data.dataStatus.hasBookTime || data.buckets.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-800"><CalendarDays className="w-4 h-4 inline text-slate-500" aria-hidden="true" /> {t('leadTimeTitle')}</h3>
                    <DataStatusBadge status="missing_booktime" />
                </div>
                <p className="text-gray-500 text-sm">{t('missingBookTime')}</p>
            </div>
        );
    }

    const barData = data.buckets.map(b => ({
        bucket: b.bucket,
        count: b.count,
        pct: (b.share * 100).toFixed(1),
        rn: b.roomNights,
        fill: BUCKET_COLORS[b.bucket] || '#3B82F6',
    }));

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 inline text-slate-500" aria-hidden="true" /> {t('leadTimeTitle')}
                </h3>
                <DataStatusBadge status="ok" />
            </div>

            {/* Chart */}
            <div className="p-5">
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="bucket" width={45} tick={{ fontSize: 12 }} />
                            <Tooltip
                                formatter={(value) => [
                                    `${nf.format(Number(value))} bookings`,
                                    'Count',
                                ]}
                                labelFormatter={(label) => `${t('leadTimeTooltip', { label })}`}
                            />
                            <Bar
                                dataKey="count"
                                radius={[0, 4, 4, 0]}
                                isAnimationActive={!isPdfMode}
                                label={{
                                    position: 'right',
                                    fontSize: 11,
                                    formatter: (v: unknown) => `${barData.find(b => b.count === Number(v))?.pct || ''}%`,
                                }}
                            >
                                {barData.map((entry) => (
                                    <Cell key={entry.bucket} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Avg lead time pill */}
                {data.avgLeadTime != null && (
                    <div className="mt-3 flex items-center gap-2">
                        <div className="px-3 py-1.5 bg-blue-50 rounded-lg inline-flex items-center gap-1.5">
                            <span className="text-xs text-blue-600">{t('avgLeadTimeLabel')}</span>
                            <span className="text-sm font-bold text-blue-900">{t('daysUnit', { n: data.avgLeadTime })}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
