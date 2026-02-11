'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { RoomTypesTab, OTAConfigTab, PromotionsTab, OverviewTab } from '@/components/pricing';
import { OTAPlaybookGuide } from '@/components/guide/OTAPlaybookGuide';
import { PageHeader } from '@/components/shared/PageHeader';
import { useTierAccess } from '@/hooks/useTierAccess';

const TABS = [
    { id: 'room-types', label: 'Hạng phòng' },
    { id: 'ota-channels', label: 'Kênh OTA' },
    { id: 'promotions', label: 'Khuyến mãi' },
    { id: 'overview', label: 'Bảng giá' },
    { id: 'ota-growth', label: 'Tối ưu OTA' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function PricingPage() {
    const [activeTab, setActiveTab] = useState<TabId>('room-types');
    const { hasAccess: hasOtaAccess, loading: tierLoading } = useTierAccess('SUPERIOR');

    return (
        <div className="min-h-screen bg-[#F5F7FB]">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                {/* Header */}
                <PageHeader
                    title="Tính giá OTA"
                    subtitle="Quản lý giá hiển thị trên các kênh OTA"
                />

                {/* Tab Navigation - horizontal scroll on mobile */}
                <div className="flex gap-1 border-b border-slate-200 bg-white rounded-t-xl px-2 overflow-x-auto">
                    {TABS.map((tab) => {
                        const isGated = tab.id === 'ota-growth' && !tierLoading && !hasOtaAccess;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 sm:px-5 py-3 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.id
                                    ? 'text-blue-600'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab.label}
                                {isGated && <Lock className="w-3 h-3 text-amber-500" />}
                                {activeTab === tab.id && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="bg-white border border-slate-200 rounded-b-xl rounded-tr-xl shadow-sm p-4 sm:p-6">
                    {activeTab === 'room-types' && <RoomTypesTab />}
                    {activeTab === 'ota-channels' && <OTAConfigTab />}
                    {activeTab === 'promotions' && <PromotionsTab />}
                    {activeTab === 'overview' && <OverviewTab />}
                    {activeTab === 'ota-growth' && (
                        <OTAPlaybookGuide hasAccess={tierLoading || hasOtaAccess} />
                    )}
                </div>
            </div>
        </div>
    );
}

