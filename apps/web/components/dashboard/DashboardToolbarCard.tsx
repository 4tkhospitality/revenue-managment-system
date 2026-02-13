'use client';

/**
 * DashboardToolbarCard — Data Status + Time-Travel controls
 * Redesigned per BA review:
 * - Left: Data status (color-coded, clickable → /data)
 * - Right: OTB time-travel picker
 */

import Link from 'next/link';
import { BarChart3, CalendarDays } from 'lucide-react';
import { DatePickerSnapshot } from '@/components/DatePickerSnapshot';

interface DataStatusItem {
    label: string;
    date: string | null;
    variant: 'fresh' | 'stale' | 'missing';
    href: string;
}

interface DashboardToolbarCardProps {
    latestReservationDate: string | null;
    latestCancellationDate: string | null;
    otbAsOfDate: string | null;
    currentAsOfDate?: string;
}

const today = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

function getVariant(dateStr: string | null): 'fresh' | 'stale' | 'missing' {
    if (!dateStr) return 'missing';
    // Parse dd/MM/yyyy format (used by DateUtils.format)
    const parts = dateStr.split('/');
    const d = parts.length === 3
        ? new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
        : new Date(dateStr);
    if (isNaN(d.getTime())) return 'missing';
    const diff = Math.floor((today().getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) return 'fresh';
    if (diff <= 7) return 'stale';
    return 'missing';
}

const variantConfig = {
    fresh: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', label: '' },
    stale: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', label: 'Cũ' },
    missing: { dot: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', label: 'Thiếu' },
};

function StatusRow({ item }: { item: DataStatusItem }) {
    const cfg = variantConfig[item.variant];
    return (
        <Link
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors hover:${cfg.bg} group`}
        >
            <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
            <span className="text-sm text-slate-600 group-hover:text-slate-800">{item.label}</span>
            <span className="text-sm font-medium text-slate-800 ml-auto">
                {item.date || 'Chưa có'}
            </span>
            {item.variant !== 'fresh' && (
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                </span>
            )}
            <span className="text-slate-300 group-hover:text-slate-500 transition-colors">↗</span>
        </Link>
    );
}

export function DashboardToolbarCard({
    latestReservationDate,
    latestCancellationDate,
    otbAsOfDate,
    currentAsOfDate,
}: DashboardToolbarCardProps) {

    const statusItems: DataStatusItem[] = [
        {
            label: 'Đặt phòng',
            date: latestReservationDate,
            variant: getVariant(latestReservationDate),
            href: '/data?tab=reservations',
        },
        {
            label: 'Hủy phòng',
            date: latestCancellationDate,
            variant: getVariant(latestCancellationDate),
            href: '/data?tab=cancellations',
        },
        {
            label: 'OTB',
            date: otbAsOfDate,
            variant: getVariant(otbAsOfDate),
            href: '/data?tab=otb',
        },
    ];

    const handleDateChange = (date: string) => {
        // Navigate with URL param for time-travel
        const params = new URLSearchParams(window.location.search);
        params.set('as_of_date', date);
        window.location.href = `/dashboard?${params.toString()}`;
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm pdf-hide">
            <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                {/* Left: Data Status */}
                <div className="flex-1 p-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
                        Trạng thái dữ liệu
                    </h3>
                    <div className="space-y-0.5">
                        {statusItems.map((item) => (
                            <StatusRow key={item.label} item={item} />
                        ))}
                    </div>
                </div>

                {/* Right: Time-Travel OTB Picker */}
                <div className="flex-1 p-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                        Xem OTB tại
                    </h3>
                    <DatePickerSnapshot
                        onDateChange={handleDateChange}
                        defaultDate={currentAsOfDate}
                    />
                </div>
            </div>
        </div>
    );
}
