'use client';

import Link from 'next/link';
import { Lock, Crown, ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface TierPaywallProps {
    /** Page title shown in the header */
    title: string;
    /** Subtitle for the header */
    subtitle?: string;
    /** Name of the required tier to display */
    tierDisplayName: string;
    /** Color scheme: 'blue' for Superior, 'amber' for Suite */
    colorScheme?: 'blue' | 'amber';
    /** List of features included in the upgrade */
    features: { icon: ReactNode; label: string }[];
}

export function TierPaywall({
    title,
    subtitle,
    tierDisplayName,
    colorScheme = 'blue',
    features,
}: TierPaywallProps) {
    const gradients = {
        blue: {
            accent: 'linear-gradient(to right, #3B82F6, #1D4ED8, #6366F1)',
            icon: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
            iconColor: 'text-blue-600',
            btn: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            featureIcon: 'text-blue-500',
            tierColor: 'text-blue-600',
        },
        amber: {
            accent: 'linear-gradient(to right, #F59E0B, #EF4444, #8B5CF6)',
            icon: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            iconColor: 'text-amber-600',
            btn: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            featureIcon: 'text-amber-500',
            tierColor: 'text-amber-600',
        },
    };

    const c = gradients[colorScheme];

    return (
        <div className="px-4 sm:px-8 py-4 sm:py-6">
            {/* Header — visual consistency with real page */}
            <header
                className="rounded-2xl px-4 sm:px-6 py-4 text-white shadow-sm"
                style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
            >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">{title}</h1>
                        {subtitle && <p className="text-white/70 text-sm">{subtitle}</p>}
                    </div>
                </div>
            </header>

            {/* Paywall Card */}
            <div className="mt-8 max-w-lg mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Top accent */}
                    <div className="h-1.5" style={{ background: c.accent }} />

                    <div className="p-8 text-center">
                        {/* Lock icon */}
                        <div
                            className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                            style={{ background: c.icon }}
                        >
                            <Lock className={`w-8 h-8 ${c.iconColor}`} />
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Tính năng này yêu cầu gói{' '}
                            <strong className={c.tierColor}>{tierDisplayName}</strong> trở lên
                        </p>

                        {/* Features preview */}
                        <div className="text-left bg-gray-50 rounded-xl p-5 mb-6 space-y-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Gói {tierDisplayName} bao gồm
                            </p>
                            {features.map((f, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                    <span className={`${c.featureIcon} flex-shrink-0`}>{f.icon}</span>
                                    <span className="text-sm text-gray-700">{f.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <Link
                            href="/pricing-plans"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                            style={{ background: c.btn, color: '#fff' }}
                        >
                            <Crown className="w-4 h-4" />
                            Xem gói nâng cấp
                            <ArrowRight className="w-4 h-4" />
                        </Link>

                        <p className="text-xs text-gray-400 mt-4">
                            Liên hệ Zalo 0778602953 để được tư vấn
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
