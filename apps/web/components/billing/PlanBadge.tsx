'use client';

import { PlanTier } from '@prisma/client';
import { Crown, Star, Gem, Shield } from 'lucide-react';
import { getPlanLabel, getPlanColor } from '@/lib/plg/plan-config';

interface PlanBadgeProps {
    plan: PlanTier;
    isTrialActive?: boolean;
    size?: 'sm' | 'md';
}

const ICON_MAP: Record<PlanTier, React.ElementType> = {
    STANDARD: Shield,
    SUPERIOR: Star,
    DELUXE: Gem,
    SUITE: Crown,
};

export function PlanBadge({ plan, isTrialActive, size = 'sm' }: PlanBadgeProps) {
    const label = getPlanLabel(plan);
    const color = getPlanColor(plan);
    const Icon = ICON_MAP[plan];
    const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass}`}
            style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
        >
            <Icon size={size === 'sm' ? 12 : 14} />
            {label}
            {isTrialActive && (
                <span className="ml-0.5 text-[10px] opacity-70">(Trial)</span>
            )}
        </span>
    );
}
