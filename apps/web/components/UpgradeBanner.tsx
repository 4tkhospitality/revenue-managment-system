'use client';

/**
 * UpgradeBanner - Shown when a feature is gated
 * SMB-friendly messaging: "Daily recommendations + Excel export"
 */

import { FeatureKey, getUpgradeTierName, TIER_CONFIGS } from '@/lib/tier/tierConfig';
import { PlanTier } from '@prisma/client';

interface UpgradeBannerProps {
    feature: FeatureKey;
    currentTier?: PlanTier;
    className?: string;
}

const FEATURE_DESCRIPTIONS: Record<FeatureKey, string> = {
    pricing_calc: 'Tính giá NET → BAR',
    promo_stacking: 'Ghép nhiều khuyến mãi',
    daily_actions: 'Gợi ý giá hàng ngày + 1 click Accept',
    rate_calendar: 'Lịch giá 30 ngày',
    export_excel: 'Xuất Excel để upload OTA',
    pickup_pace_simple: 'Xem tốc độ bán phòng',
    guardrails: 'Cảnh báo giá quá cao/thấp',
    decision_log: 'Lịch sử quyết định giá',
    basic_analytics: 'Báo cáo doanh thu cơ bản',
    advanced_analytics: 'Phân tích nâng cao',
    multi_property: 'Quản lý nhiều khách sạn',
    api_import: 'Nhập dữ liệu tự động qua API',
    rate_shopper_addon: 'Theo dõi giá đối thủ',
};

export function UpgradeBanner({ feature, currentTier = 'STANDARD', className = '' }: UpgradeBannerProps) {
    const requiredTier = getUpgradeTierName(feature);
    const featureDesc = FEATURE_DESCRIPTIONS[feature] || feature;

    return (
        <div
            className={`
        bg-gradient-to-r from-amber-50 to-orange-50 
        border border-amber-200 rounded-xl p-6 
        shadow-sm ${className}
      `}
        >
            <div className="flex items-start gap-4">
                {/* Lock Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg
                        className="w-6 h-6 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                    </svg>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        🔒 Tính năng dành cho {requiredTier}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        <strong>{featureDesc}</strong> — Nâng cấp để mở khóa tính năng này và tiết kiệm thời gian mỗi ngày.
                    </p>

                    {/* Benefits */}
                    <div className="bg-white/60 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700 font-medium mb-2">
                            Với gói {requiredTier}, bạn sẽ có:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                            {requiredTier === 'Assistant' && (
                                <>
                                    <li>✅ Gợi ý giá hàng ngày (Daily Actions)</li>
                                    <li>✅ Xuất Excel để upload OTA</li>
                                    <li>✅ Lịch giá 30 ngày</li>
                                </>
                            )}
                            {requiredTier === 'RMS Lite' && (
                                <>
                                    <li>✅ Tất cả tính năng Assistant</li>
                                    <li>✅ Cảnh báo giá (Guardrails)</li>
                                    <li>✅ Báo cáo phân tích</li>
                                </>
                            )}
                            {requiredTier === 'Professional' && (
                                <>
                                    <li>✅ Tất cả tính năng RMS Lite</li>
                                    <li>✅ Quản lý nhiều khách sạn</li>
                                    <li>✅ Theo dõi giá đối thủ</li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* CTA */}
                    <div className="flex gap-3">
                        <a
                            href="/pricing-plans"
                            className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors"
                        >
                            Xem bảng giá
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                        <a
                            href="https://zalo.me/your-zalo-id"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
                        >
                            Liên hệ Zalo
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Compact version for inline use (e.g., disabled buttons)
 */
export function UpgradeTooltip({ feature }: { feature: FeatureKey }) {
    const requiredTier = getUpgradeTierName(feature);
    return (
        <span className="text-xs text-amber-600 font-medium">
            🔒 Cần gói {requiredTier}
        </span>
    );
}
