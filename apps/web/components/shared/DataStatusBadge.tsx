'use client';

interface DataStatusBadgeProps {
    status: 'ok' | 'missing_cancel' | 'missing_stly' | 'missing_snapshots' | 'missing_booktime' | 'missing_roomcode';
    className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    ok: { label: 'Đủ dữ liệu', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '✓' },
    missing_cancel: { label: 'Thiếu dữ liệu hủy', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⚠' },
    missing_stly: { label: 'Thiếu STLY', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⚠' },
    missing_snapshots: { label: 'Thiếu snapshots', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⚠' },
    missing_booktime: { label: 'Thiếu book_time', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⚠' },
    missing_roomcode: { label: 'Thiếu room_code', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⚠' },
};

export function DataStatusBadge({ status, className = '' }: DataStatusBadgeProps) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.ok;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${config.color} ${className}`}>
            <span>{config.icon}</span>
            <span>{config.label}</span>
        </span>
    );
}
