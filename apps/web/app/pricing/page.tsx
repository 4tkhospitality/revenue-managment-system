'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, TrendingUp, BarChart3, Star, Zap, Calculator } from 'lucide-react';
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
                        (!tierLoading && !hasOtaAccess) ? (
                            <OTAGrowthPaywall />
                        ) : (
                            <OTAPlaybookGuide />
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

function OTAGrowthPaywall() {
    const features = [
        { icon: <BarChart3 className="w-4 h-4" />, label: 'Kiểm tra chỉ số OTA — Tình trạng thứ hạng tốt/xấu trên kênh OTA' },
        { icon: <Calculator className="w-4 h-4" />, label: 'Hiệu quả chương trình — Lời hay lỗ khi tham gia chương trình khuyến mãi OTA' },
        { icon: <Star className="w-4 h-4" />, label: 'Điểm Review — Cách tính điểm đánh giá & mục tiêu cải thiện' },
        { icon: <Zap className="w-4 h-4" />, label: 'Cách tăng Ranking — Hướng dẫn khi nào nên đẩy ranking trên OTA' },
        { icon: <TrendingUp className="w-4 h-4" />, label: 'Checklist Booking.com & Agoda — Tối ưu hóa chi tiết' },
    ];

    return (
        <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Tối ưu OTA</h3>
            <p className="text-gray-500 text-center max-w-md mb-8">
                Bộ công cụ tối ưu hóa ranking & conversion trên OTA dành cho khách hàng trả phí.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 w-full max-w-md mb-8">
                <p className="text-sm font-medium text-gray-700 mb-4">Bao gồm:</p>
                <div className="space-y-3">
                    {features.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="text-blue-600">{f.icon}</span>
                            <span>{f.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <Link
                href="/pricing-plans"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
                Xem gói nâng cấp →
            </Link>
            <p className="text-xs text-gray-400 mt-3">
                Liên hệ Zalo 0778602953 để được tư vấn
            </p>
        </div>
    );
}

