'use client';

import { AlertTriangle, ArrowUpCircle } from 'lucide-react';
import type { QuotaKey } from '@/lib/plg/types';

interface QuotaWarningProps {
    quotaKey: QuotaKey;
    used: number;
    limit: number;
    onUpgrade?: () => void;
}

const LABEL_MAP: Record<QuotaKey, string> = {
    imports: 'import',
    exports: 'export',
    users: 'người dùng',
};

export function QuotaWarning({ quotaKey, used, limit, onUpgrade }: QuotaWarningProps) {
    if (limit <= 0) return null; // unlimited
    const percentage = (used / limit) * 100;
    if (percentage < 80) return null; // not near limit

    const isExceeded = used >= limit;
    const label = LABEL_MAP[quotaKey] || quotaKey;

    return (
        <div
            className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm ${isExceeded
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
        >
            <div className="flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>
                    {isExceeded
                        ? `Đã dùng hết quota ${label} (${used}/${limit})`
                        : `Gần hết quota ${label}: ${used}/${limit} (${Math.round(percentage)}%)`}
                </span>
            </div>
            {onUpgrade && (
                <button
                    onClick={onUpgrade}
                    className="flex items-center gap-1 text-xs font-medium hover:underline"
                >
                    <ArrowUpCircle size={12} />
                    Nâng cấp
                </button>
            )}
        </div>
    );
}
