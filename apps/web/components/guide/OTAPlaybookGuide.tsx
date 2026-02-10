'use client';

import { useState } from 'react';
import { BookingChecklist } from './BookingChecklist';
import { AgodaChecklist } from './AgodaChecklist';
import { OTAHealthScorecard } from './OTAHealthScorecard';
import { ROICalculator } from './ROICalculator';
import { ReviewCalculator } from './ReviewCalculator';
import { WhenToBoost } from './WhenToBoost';

type OTATab = 'scorecard' | 'booking' | 'agoda' | 'roi' | 'review' | 'boost';

export function OTAPlaybookGuide() {
    const [activeOTA, setActiveOTA] = useState<OTATab>('scorecard');

    const tabs: { id: OTATab; label: string; desc: string }[] = [
        { id: 'scorecard', label: 'Bảng điểm', desc: 'Chấm điểm sức khỏe kênh OTA của khách sạn' },
        { id: 'booking', label: 'Booking.com', desc: 'Checklist tối ưu ranking trên Booking.com' },
        { id: 'agoda', label: 'Agoda', desc: 'Checklist tối ưu ranking trên Agoda' },
        { id: 'roi', label: 'Hiệu quả KM', desc: 'Tính lời/lỗ khi tham gia chương trình khuyến mãi OTA' },
        { id: 'review', label: 'Đánh giá', desc: 'Mô phỏng tác động của review đến điểm số' },
        { id: 'boost', label: 'Khi nào Boost', desc: 'Hướng dẫn khi nào nên đẩy ranking trên OTA' },
    ];

    return (
        <>
            {/* OTA Sub-tabs */}
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

            {/* Tab intro */}
            {tabs.map(tab => tab.id === activeOTA && (
                <div key={tab.id} className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">{tab.label}</span> — {tab.desc}
                    </p>
                </div>
            ))}

            {/* Content */}
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
    );
}
