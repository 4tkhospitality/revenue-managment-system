'use client';

import { useTranslations } from 'next-intl';

interface DataStatusBadgeProps {
    status: 'ok' | 'missing_cancel' | 'missing_stly' | 'missing_snapshots' | 'missing_booktime' | 'missing_roomcode';
    className?: string;
}

const STATUS_STYLE: Record<string, { color: string; icon: string }> = {
    ok: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '✓' },
    missing_cancel: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⚠' },
    missing_stly: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⚠' },
    missing_snapshots: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⚠' },
    missing_booktime: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⚠' },
    missing_roomcode: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⚠' },
};

const STATUS_KEYS: Record<string, string> = {
    ok: 'dataComplete',
    missing_cancel: 'missingCancel',
    missing_stly: 'missingStly',
    missing_snapshots: 'missingSnapshots',
    missing_booktime: 'missingBooktime',
    missing_roomcode: 'missingRoomcode',
};

export function DataStatusBadge({ status, className = '' }: DataStatusBadgeProps) {
    const t = useTranslations('dataStatus');
    const style = STATUS_STYLE[status] || STATUS_STYLE.ok;
    const labelKey = STATUS_KEYS[status] || 'dataComplete';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${style.color} ${className}`}>
            <span>{style.icon}</span>
            <span>{t(labelKey)}</span>
        </span>
    );
}
