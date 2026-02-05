'use client';

import { useState } from 'react';
import { RoomTypesTab, OTAConfigTab, PromotionsTab, OverviewTab } from '@/components/pricing';

const TABS = [
    { id: 'room-types', label: 'Hạng phòng' },
    { id: 'ota-channels', label: 'Kênh OTA' },
    { id: 'promotions', label: 'Promotions' },
    { id: 'overview', label: 'Bảng giá' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function PricingPage() {
    const [activeTab, setActiveTab] = useState<TabId>('room-types');

    return (
        <div className="min-h-screen bg-[#F5F7FB]">
            <div className="mx-auto max-w-[1400px] px-6 py-6 space-y-6">
                {/* Header */}
                <header
                    className="rounded-2xl px-6 py-5 text-white shadow-sm"
                    style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
                >
                    <h1 className="text-xl font-semibold flex items-center gap-2">
                        💰 Tính giá OTA
                    </h1>
                    <p className="text-white/70 text-sm mt-1">
                        Quản lý giá hiển thị trên các kênh OTA
                    </p>
                </header>

                {/* Tab Navigation */}
                <div className="flex gap-1 border-b border-slate-200 bg-white rounded-t-xl px-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.id
                                    ? 'text-blue-600'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white border border-slate-200 rounded-b-xl rounded-tr-xl shadow-sm p-6">
                    {activeTab === 'room-types' && <RoomTypesTab />}
                    {activeTab === 'ota-channels' && <OTAConfigTab />}
                    {activeTab === 'promotions' && <PromotionsTab />}
                    {activeTab === 'overview' && <OverviewTab />}
                </div>
            </div>
        </div>
    );
}
