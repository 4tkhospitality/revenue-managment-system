import { ReactNode } from 'react';

interface StatusBadge {
    label: string;
    value: string;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    badges?: StatusBadge[];
    rightContent?: ReactNode;
}

const variantStyles = {
    success: 'bg-emerald-500/20 text-emerald-200',
    warning: 'bg-amber-500/20 text-amber-200',
    danger: 'bg-rose-500/20 text-rose-200',
    info: 'bg-blue-500/20 text-blue-200',
    neutral: 'bg-white/10 text-white/80',
};

export function PageHeader({ title, subtitle, badges = [], rightContent }: PageHeaderProps) {
    return (
        <header
            className="rounded-2xl px-4 sm:px-6 py-4 text-white shadow-sm"
            style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
        >
            {/* Mobile: Stack layout */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: Title + Subtitle */}
                <div className="min-w-0">
                    <h1 className="text-lg font-semibold truncate">{title}</h1>
                    {subtitle && (
                        <p className="text-white/70 text-sm truncate">{subtitle}</p>
                    )}
                </div>

                {/* Right: Badges + Custom content */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    {/* Status Badges - scroll horizontally on mobile */}
                    {badges.length > 0 && (
                        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1">
                            {badges.map((badge, idx) => (
                                <div key={idx} className="flex-shrink-0 text-right">
                                    <div className="text-[10px] sm:text-xs text-white/60 mb-0.5">
                                        {badge.label}
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs sm:text-sm whitespace-nowrap ${variantStyles[badge.variant || 'neutral']}`}>
                                        {badge.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {rightContent}
                </div>
            </div>
        </header>
    );
}
