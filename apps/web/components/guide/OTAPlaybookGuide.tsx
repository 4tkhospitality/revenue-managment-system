'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, Crown, ArrowRight } from 'lucide-react';
import { BookingChecklist } from './BookingChecklist';
import { AgodaChecklist } from './AgodaChecklist';
import { OTAHealthScorecard } from './OTAHealthScorecard';
import { ROICalculator } from './ROICalculator';
import { ReviewCalculator } from './ReviewCalculator';
import { WhenToBoost } from './WhenToBoost';
import { useTranslations } from 'next-intl';

type OTATab = 'scorecard' | 'booking' | 'agoda' | 'roi' | 'review' | 'boost';

interface OTAPlaybookGuideProps {
    /** Whether the user has SUPERIOR tier access */
    hasAccess?: boolean;
}

export function OTAPlaybookGuide({ hasAccess = true }: OTAPlaybookGuideProps) {
    const t = useTranslations('guidePlaybook');
    const [activeOTA, setActiveOTA] = useState<OTATab>('scorecard');

    const tabs: { id: OTATab; label: string; desc: string }[] = [
        { id: 'scorecard', label: t('tabScorecard'), desc: t('tabScorecardDesc') },
        { id: 'booking', label: t('tabBooking'), desc: t('tabBookingDesc') },
        { id: 'agoda', label: t('tabAgoda'), desc: t('tabAgodaDesc') },
        { id: 'roi', label: t('tabROI'), desc: t('tabROIDesc') },
        { id: 'review', label: t('tabReview'), desc: t('tabReviewDesc') },
        { id: 'boost', label: t('tabBoost'), desc: t('tabBoostDesc') },
    ];

    return (
        <>
            {/* OTA Sub-tabs — always visible so users can see what's included */}
            <div className="bg-white border border-gray-200 rounded-xl p-1 flex gap-1 mb-6 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveOTA(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeOTA === tab.id
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab intro — always visible */}
            {tabs.map(tab => tab.id === activeOTA && (
                <div key={tab.id} className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">{tab.label}</span> — {tab.desc}
                    </p>
                </div>
            ))}

            {/* Content — gated for non-SUPERIOR users */}
            {!hasAccess ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                        style={{ background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)' }}>
                        <Lock className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t('paywallTitle')}
                    </h3>
                    <p className="text-gray-500 text-sm text-center max-w-md mb-6">
                        {t.rich('paywallDesc', { strong: (c) => <strong className="text-blue-600">{c}</strong> })}
                    </p>
                    <Link
                        href="/pricing-plans"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: '#fff' }}
                    >
                        <Crown className="w-4 h-4" />
                        {t('paywallButton')}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <p className="text-xs text-gray-400 mt-3">
                        {t('paywallContact')}
                    </p>
                </div>
            ) : (
                <>
                    {activeOTA === 'scorecard' && <OTAHealthScorecard />}
                    {activeOTA === 'booking' && <BookingChecklist />}
                    {activeOTA === 'agoda' && <AgodaChecklist />}
                    {activeOTA === 'roi' && <ROICalculator />}
                    {activeOTA === 'review' && <ReviewCalculator />}
                    {activeOTA === 'boost' && <WhenToBoost />}

                    {/* Phase B Note */}
                    <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-500">
                        <p className="font-medium text-gray-700 mb-1">{t('phaseBTitle')}</p>
                        <p>{t('phaseBDesc')}</p>
                    </div>
                </>
            )}
        </>
    );
}
