'use client';

import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SetupTab, PromotionsTab, OverviewTab, DynamicPricingTab } from '@/components/pricing';
import { OTAPlaybookGuide } from '@/components/guide/OTAPlaybookGuide';
import { PageHeader } from '@/components/shared/PageHeader';
import { useTierAccess } from '@/hooks/useTierAccess';

const TAB_IDS = ['setup', 'promotions', 'overview', 'dynamic-pricing', 'ota-growth'] as const;
type TabId = typeof TAB_IDS[number];

export default function PricingPage() {
    const t = useTranslations('pricing');
    const [activeTab, setActiveTab] = useState<TabId>('setup');
    const { hasAccess: hasOtaAccess, loading: tierLoading } = useTierAccess('SUPERIOR');
    const [isDemo, setIsDemo] = useState(false);

    useEffect(() => {
        fetch('/api/is-demo-hotel').then(r => r.json()).then(d => {
            // Super admin is NEVER treated as demo — bypass paywall
            const isSuperAdmin = d.role === 'super_admin';
            setIsDemo(isSuperAdmin ? false : (d.isDemo || false));
        }).catch(() => { });
    }, []);

    const isGated = (tabId: string) => {
        if (tabId === 'ota-growth') return !tierLoading && (!hasOtaAccess || isDemo);
        return false;
    };
    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
            <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                {/* Header */}
                <PageHeader
                    title={t('pageTitle')}
                    subtitle={t('pageSubtitle')}
                />

                {/* Tab Navigation - horizontal scroll on mobile */}
                <div className="flex gap-1 border-b border-slate-200 bg-white rounded-t-xl px-2 overflow-x-auto">
                    {TAB_IDS.map((tabId) => {
                        const gated = isGated(tabId);
                        return (
                            <button
                                key={tabId}
                                onClick={() => setActiveTab(tabId)}
                                className={`px-4 sm:px-5 py-3 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-1.5 ${activeTab === tabId
                                    ? 'text-blue-600'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {t(`tab_${tabId}`)}
                                {gated && <Lock className="w-3 h-3 text-amber-500" />}
                                {activeTab === tabId && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="bg-white border border-slate-200 rounded-b-xl rounded-tr-xl shadow-sm p-4 sm:p-6">
                    {activeTab === 'setup' && <SetupTab />}
                    {activeTab === 'promotions' && <PromotionsTab />}
                    {activeTab === 'overview' && <OverviewTab />}
                    {activeTab === 'dynamic-pricing' && <DynamicPricingTab />}
                    {activeTab === 'ota-growth' && (
                        <OTAPlaybookGuide hasAccess={!isDemo && (tierLoading || hasOtaAccess)} />
                    )}
                </div>
            </div>
        </div>
    );
}
