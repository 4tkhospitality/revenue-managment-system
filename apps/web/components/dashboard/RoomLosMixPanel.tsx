'use client';

import { useState, useEffect } from 'react';
import { BedDouble } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { DataStatusBadge } from '@/components/shared/DataStatusBadge';
import { useTranslations } from 'next-intl';

interface RoomMixItem {
    roomCode: string;
    roomNights: number;
    share: number;
    adr: number;
    revenue: number;
}

interface LosMixItem {
    bucket: string;
    count: number;
    share: number;
    roomNights: number;
}

interface RoomLosMixData {
    roomMix: RoomMixItem[];
    losMix: LosMixItem[];
    dataStatus: { hasRoomCode: boolean; hasNights: boolean };
}

interface RoomLosMixPanelProps {
    hotelId: string;
    asOfDate: string;
    days?: number;
    isPdfMode?: boolean;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const nf = new Intl.NumberFormat('vi-VN');

export function RoomLosMixPanel({ hotelId, asOfDate, days = 90, isPdfMode = false }: RoomLosMixPanelProps) {
    const t = useTranslations('roomLosMix');
    const [data, setData] = useState<RoomLosMixData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/analytics/room-los-mix?hotelId=${hotelId}&asOfDate=${asOfDate}&days=${days}`);
                if (!res.ok) throw new Error('Failed to fetch');
                setData(await res.json());
            } catch {
                setError(t('failedToLoad'));
            } finally {
                setLoading(false);
            }
        };
        if (asOfDate) fetchData();
    }, [hotelId, asOfDate, days]);

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-5 w-44 bg-gray-200 rounded mb-4" />
                <div className="grid grid-cols-2 gap-6">
                    <div className="h-48 bg-gray-100 rounded-lg" />
                    <div className="h-48 bg-gray-100 rounded-lg" />
                </div>
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

    const hasData = data.roomMix.length > 0 || data.losMix.length > 0;
    if (!hasData) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800"><BedDouble className="w-4 h-4 text-slate-500" aria-hidden="true" /> {t('title')}</h3>
                <p className="text-gray-500 text-sm mt-2">{t('noData')}</p>
            </div>
        );
    }

    const pieData = data.roomMix.map((r, i) => ({
        name: r.roomCode,
        value: r.roomNights,
        pct: (r.share * 100).toFixed(1),
        fill: COLORS[i % COLORS.length],
    }));

    const barData = data.losMix.map(l => ({
        bucket: l.bucket,
        count: l.count,
        pct: (l.share * 100).toFixed(1),
    }));

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800"><BedDouble className="w-4 h-4 text-slate-500" aria-hidden="true" /> {t('title')}</h3>
                <div className="flex gap-1.5">
                    {!data.dataStatus.hasRoomCode && <DataStatusBadge status="missing_roomcode" />}
                    {!data.dataStatus.hasNights && <DataStatusBadge status="missing_booktime" />}
                    {data.dataStatus.hasRoomCode && data.dataStatus.hasNights && <DataStatusBadge status="ok" />}
                </div>
            </div>

            {/* Charts */}
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Room Type Donut */}
                <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">{t('roomTypeShare')}</h4>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    dataKey="value"
                                    isAnimationActive={!isPdfMode}
                                >
                                    {pieData.map((entry, idx) => (
                                        <Cell key={entry.name} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [
                                        `${nf.format(Number(value))} RN (${pieData.find(p => p.name === name)?.pct}%)`,
                                        String(name),
                                    ]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        {pieData.map(p => (
                            <div key={p.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
                                <span>{p.name} {p.pct}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* LOS Bars */}
                <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">{t('lengthOfStay')}</h4>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="bucket" width={40} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value) => {
                                        const item = barData.find(b => b.count === Number(value));
                                        return [`${nf.format(Number(value))} bookings (${item?.pct}%)`, 'Count'];
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#3B82F6"
                                    radius={[0, 4, 4, 0]}
                                    isAnimationActive={!isPdfMode}
                                    label={{ position: 'right', fontSize: 11, formatter: (v: unknown) => `${barData.find(b => b.count === Number(v))?.pct || ''}%` }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
