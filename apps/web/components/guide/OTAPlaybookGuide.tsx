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

type OTATab = 'scorecard' | 'booking' | 'agoda' | 'roi' | 'review' | 'boost';

interface OTAPlaybookGuideProps {
    /** Whether the user has SUPERIOR tier access */
    hasAccess?: boolean;
}

export function OTAPlaybookGuide({ hasAccess = true }: OTAPlaybookGuideProps) {
    const [activeOTA, setActiveOTA] = useState<OTATab>('scorecard');

    const tabs: { id: OTATab; label: string; desc: string }[] = [
        { id: 'scorecard', label: 'Kiểm tra sức khỏe toàn diện', desc: 'Kiểm tra các chỉ số trên kênh OTA của khách sạn để biết tình trạng đang tốt hay xấu' },
        { id: 'booking', label: 'Booking.com', desc: 'Các đầu mục công việc Checklist nhằm tối ưu ranking trên Booking.com' },
        { id: 'agoda', label: 'Agoda', desc: 'Các đầu mục công việc Checklist nhằm tối ưu ranking trên Agoda' },
        { id: 'roi', label: 'Nên tham gia Campaign?', desc: 'Tham gia Promotion hay Campaign như Genius, Preferred, AGP, v.v thì hiệu quả lời lỗ ra sao?' },
        { id: 'review', label: 'Điểm Review', desc: 'Cách tính điểm số review và mô phỏng tác động của Review tới điểm số' },
        { id: 'boost', label: 'Cách tăng Ranking', desc: 'Hướng dẫn cách tăng thứ hạng ranking và gợi ý khi nào nên đẩy ranking trên OTA' },
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
                        Nội dung chi tiết cần nâng cấp
                    </h3>
                    <p className="text-gray-500 text-sm text-center max-w-md mb-6">
                        Nâng cấp lên gói <strong className="text-blue-600">Superior</strong> để xem phân tích chi tiết, checklist tối ưu, và công cụ tính toán cho từng hạng mục.
                    </p>
                    <Link
                        href="/pricing-plans"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: '#fff' }}
                    >
                        <Crown className="w-4 h-4" />
                        Nâng cấp lên Superior
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <p className="text-xs text-gray-400 mt-3">
                        Hoặc liên hệ Zalo để được tư vấn
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
                        <p className="font-medium text-gray-700 mb-1">Tự động hóa (Phase B — Sắp ra mắt)</p>
                        <p>
                            Trong tương lai, RMS sẽ kết nối trực tiếp với Booking.com Property Scores API và Opportunities API
                            để tự động đánh giá và đề xuất hành động. Hiện tại Booking.com đang tạm dừng integrations mới —
                            fallback: nhập thủ công hoặc import báo cáo từ Extranet/YCS.
                        </p>
                    </div>
                </>
            )}
        </>
    );
}
