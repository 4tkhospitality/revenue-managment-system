'use client';

interface UsageMeterProps {
    label: string;
    used: number;
    limit: number; // 0 = unlimited
    showUpgrade?: boolean;
    onUpgrade?: () => void;
}

export function UsageMeter({ label, used, limit, showUpgrade, onUpgrade }: UsageMeterProps) {
    const isUnlimited = limit === 0;
    const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
    const isNearLimit = !isUnlimited && percentage >= 80;
    const isExceeded = !isUnlimited && used >= limit;

    const barColor = isExceeded
        ? 'bg-red-500'
        : isNearLimit
            ? 'bg-amber-500'
            : 'bg-emerald-500';

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{label}</span>
                <span className={`font-medium ${isExceeded ? 'text-red-600' : 'text-slate-700'}`}>
                    {isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}
                </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: isUnlimited ? '0%' : `${percentage}%` }}
                />
            </div>
            {isExceeded && showUpgrade && (
                <button
                    onClick={onUpgrade}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                    Nâng cấp để mở giới hạn →
                </button>
            )}
        </div>
    );
}
