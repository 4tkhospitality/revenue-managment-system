'use client';

import { Clock, Gift, Check, Circle, ArrowRight } from 'lucide-react';
import type { TrialProgress } from '@/lib/plg/trial';
import { useTranslations } from 'next-intl';

interface TrialBannerProps {
    daysRemaining: number;
    trialProgress: TrialProgress | null;
    onUpgrade?: () => void;
    onDismiss?: () => void;
}

export function TrialBanner({
    daysRemaining,
    trialProgress,
    onUpgrade,
    onDismiss,
}: TrialBannerProps) {
    const t = useTranslations('billing');
    const conditionsMet = trialProgress?.conditionsMet ?? 0;
    const bonusGranted = trialProgress?.bonusGranted ?? false;

    return (
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-sm">
                {/* Left: Timer */}
                <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span className="font-medium">
                        {t('trialRemaining', { n: daysRemaining })}
                    </span>
                </div>

                {/* Center: Bonus progress */}
                {trialProgress && !bonusGranted && (
                    <div className="flex items-center gap-2">
                        <Gift size={14} />
                        <span>{t('bonusDays')}</span>
                        <div className="flex items-center gap-1.5">
                            {trialProgress.conditions.map((c) => (
                                <span
                                    key={c.name}
                                    className={`flex items-center gap-0.5 ${c.met ? 'opacity-100' : 'opacity-50'}`}
                                    title={`${c.label}: ${c.current}/${c.target}`}
                                >
                                    {c.met ? <Check size={12} /> : <Circle size={12} />}
                                    <span className="text-xs">{c.current}/{c.target}</span>
                                </span>
                            ))}
                        </div>
                        <span className="text-blue-200 text-xs">{t('conditionsMet', { n: conditionsMet })}</span>
                    </div>
                )}

                {bonusGranted && (
                    <div className="flex items-center gap-1 text-emerald-200">
                        <Gift size={14} />
                        <span className="font-medium">{t('bonusApplied')}</span>
                    </div>
                )}

                {/* Right: CTA */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onUpgrade}
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-xs font-medium"
                    >
                        Upgrade <ArrowRight size={12} />
                    </button>
                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="text-white/50 hover:text-white/80 text-xs"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
