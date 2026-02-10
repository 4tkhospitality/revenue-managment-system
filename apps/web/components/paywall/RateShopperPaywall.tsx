'use client';

import Link from 'next/link';
import { Lock, BarChart3, Crown, ArrowRight } from 'lucide-react';

export function RateShopperPaywall() {
    return (
        <div className="px-4 sm:px-8 py-4 sm:py-6">
            {/* Header — same as real page for visual consistency */}
            <header
                className="rounded-2xl px-4 sm:px-6 py-4 text-white shadow-sm"
                style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
            >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">So sánh giá đối thủ</h1>
                        <p className="text-white/70 text-sm">Rate Shopper • Theo dõi giá đối thủ theo thời gian thực</p>
                    </div>
                </div>
            </header>

            {/* Paywall Card */}
            <div className="mt-8 max-w-lg mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Top accent */}
                    <div className="h-1.5" style={{ background: 'linear-gradient(to right, #F59E0B, #EF4444, #8B5CF6)' }} />

                    <div className="p-8 text-center">
                        {/* Lock icon */}
                        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                            style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' }}>
                            <Lock className="w-8 h-8 text-amber-600" />
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Tính năng Rate Shopper
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Tính năng này chỉ dành cho gói <strong className="text-amber-600">Suite</strong>
                        </p>

                        {/* Features preview */}
                        <div className="text-left bg-gray-50 rounded-xl p-5 mb-6 space-y-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Gói Suite bao gồm
                            </p>
                            {[
                                'So sánh giá với 10+ đối thủ',
                                'Quét giá tự động hàng ngày',
                                'Báo cáo phân tích giá thị trường',
                                'Cảnh báo khi đối thủ giảm giá',
                                'Multi-property management',
                            ].map((feature) => (
                                <div key={feature} className="flex items-center gap-2.5">
                                    <BarChart3 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <Link
                            href="/pricing-plans"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#fff' }}
                        >
                            <Crown className="w-4 h-4" />
                            Nâng cấp lên Suite
                            <ArrowRight className="w-4 h-4" />
                        </Link>

                        <p className="text-xs text-gray-400 mt-4">
                            Hoặc liên hệ Zalo để được tư vấn
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
