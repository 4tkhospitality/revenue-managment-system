'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ArrowRight, Check, Lock } from 'lucide-react';
import { PlanTier } from '@prisma/client';
import { PlanBadge } from './PlanBadge';
import { getPlanLabel } from '@/lib/plg/plan-config';
import { useTranslations } from 'next-intl';

type UpgradeVariant = 'FEATURE_PAYWALL' | 'QUOTA_EXCEEDED' | 'SCENARIO_PERSIST_PAYWALL';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    variant: UpgradeVariant;
    currentPlan: PlanTier;
    recommendedPlan: PlanTier;
    reasonCodes?: string[];
}

const REASON_LABELS: Record<string, string> = {
    feature_hard: 'This feature requires a higher plan',
    feature_soft: 'View only — full access requires upgrade',
    feature_preview: 'Upgrade for full experience',
    quota_exceeded: 'Quota exhausted for this period',
    feature_locked: 'Feature locked at current plan',
};

const FEATURE_COMPARISON: Record<string, Record<PlanTier, string>> = {
    'Data import': { STANDARD: '3/month', SUPERIOR: '15/month', DELUXE: '50/month', SUITE: 'Unlimited' },
    'Price export': { STANDARD: '1/day', SUPERIOR: '10/day', DELUXE: 'Unlimited', SUITE: 'Unlimited' },
    'Bulk pricing': { STANDARD: '–', SUPERIOR: '✓', DELUXE: '✓', SUITE: '✓' },
    'Playbook': { STANDARD: 'Preview', SUPERIOR: 'Preview', DELUXE: '✓', SUITE: '✓' },
    'Analytics': { STANDARD: 'Preview', SUPERIOR: 'Preview', DELUXE: '✓', SUITE: '✓' },
    'Multi-hotel': { STANDARD: '–', SUPERIOR: '–', DELUXE: '–', SUITE: '✓' },
    'Users': { STANDARD: '1', SUPERIOR: '3', DELUXE: '10', SUITE: 'Unlimited' },
};

export function UpgradeModal({
    isOpen,
    onClose,
    variant,
    currentPlan,
    recommendedPlan,
    reasonCodes = [],
}: UpgradeModalProps) {
    const router = useRouter();
    if (!isOpen) return null;

    const reasonLabel = reasonCodes.map((c) => REASON_LABELS[c] || c).join('. ');
    const plans: PlanTier[] = ['STANDARD', 'SUPERIOR', 'DELUXE', 'SUITE'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl mx-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            {variant === 'QUOTA_EXCEEDED' ? 'Quota exhausted' : 'Upgrade to unlock'}
                        </h2>
                        {reasonLabel && (
                            <p className="text-sm text-slate-500 mt-1">{reasonLabel}</p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Current → Recommended */}
                <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-lg">
                    <PlanBadge plan={currentPlan} size="md" />
                    <ArrowRight size={16} className="text-slate-400" />
                    <PlanBadge plan={recommendedPlan} size="md" />
                    <span className="text-sm text-slate-500 ml-auto">
                        Recommended: <strong>{getPlanLabel(recommendedPlan)}</strong>
                    </span>
                </div>

                {/* Feature Comparison Table */}
                <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2 px-3 text-slate-500 font-medium">Feature</th>
                                {plans.map((p) => (
                                    <th
                                        key={p}
                                        className={`text-center py-2 px-3 font-medium ${p === recommendedPlan ? 'text-blue-600 bg-blue-50' : 'text-slate-600'
                                            } ${p === currentPlan ? 'bg-slate-50' : ''}`}
                                    >
                                        {getPlanLabel(p)}
                                        {p === currentPlan && <div className="text-[10px] text-slate-400">Current</div>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(FEATURE_COMPARISON).map(([feature, values]) => (
                                <tr key={feature} className="border-b border-slate-100">
                                    <td className="py-2 px-3 text-slate-700">{feature}</td>
                                    {plans.map((p) => (
                                        <td
                                            key={p}
                                            className={`py-2 px-3 text-center ${p === recommendedPlan ? 'bg-blue-50 font-medium' : ''
                                                }`}
                                        >
                                            {values[p] === '✓' ? (
                                                <Check size={14} className="inline text-emerald-500" />
                                            ) : values[p] === '–' ? (
                                                <Lock size={12} className="inline text-slate-300" />
                                            ) : (
                                                <span className="text-slate-600">{values[p]}</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* CTA */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                        Skip for now
                    </button>
                    <button
                        onClick={() => { onClose(); router.push('/pricing-plans'); }}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
                    >                        Upgrade to {getPlanLabel(recommendedPlan)}
                    </button>
                </div>
            </div>
        </div>
    );
}
