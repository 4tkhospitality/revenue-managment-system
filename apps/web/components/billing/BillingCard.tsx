'use client';

import { useEntitlements } from '@/hooks/useEntitlements';
import { PlanBadge } from './PlanBadge';
import { UsageMeter } from './UsageMeter';
import { useTranslations } from 'next-intl';

interface BillingCardProps {
    hotelId: string;
    onUpgrade?: () => void;
}

export function BillingCard({ hotelId, onUpgrade }: BillingCardProps) {
    const t = useTranslations('billing');
    const { data, loading } = useEntitlements(hotelId);

    if (loading || !data) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-6 animate-pulse">
                <div className="h-6 bg-slate-100 rounded w-32 mb-4" />
                <div className="space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-full" />
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold text-slate-900">{t('billingTitle')}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{t('billingSubtitle')}</p>
                </div>
                <PlanBadge
                    plan={data.plan}
                    isTrialActive={data.isTrialActive}
                    size="md"
                />
            </div>

            {/* Trial countdown */}
            {data.isTrialActive && (
                <div className="flex items-center gap-2 text-sm p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-600 font-medium">
                        {t('trialDaysLeft', { n: data.trialDaysRemaining })}
                    </span>
                    {data.trialBonusGranted && (
                        <span className="text-emerald-600 text-xs">(+7 bonus)</span>
                    )}
                </div>
            )}

            {/* Usage Meters */}
            <div className="space-y-3">
                <UsageMeter
                    label={t('importPerMonth')}
                    used={data.quotas.imports.used}
                    limit={data.quotas.imports.limit}
                    showUpgrade
                    onUpgrade={onUpgrade}
                />
                <UsageMeter
                    label={t('exportPerDay')}
                    used={data.quotas.exports.used}
                    limit={data.quotas.exports.limit}
                    showUpgrade
                    onUpgrade={onUpgrade}
                />
                <UsageMeter
                    label={t('usersLabel')}
                    used={data.quotas.users.used}
                    limit={data.quotas.users.limit}
                    showUpgrade
                    onUpgrade={onUpgrade}
                />
            </div>

            {/* Upgrade button */}
            {data.plan !== 'SUITE' && (
                <button
                    onClick={onUpgrade}
                    className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    {t('upgradePlan')}
                </button>
            )}
        </div>
    );
}
