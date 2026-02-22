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
                        <h1 className="text-lg font-semibold">Competitor Price Comparison</h1>
                        <p className="text-white/70 text-sm">Rate Shopper • Track competitor prices in real-time</p>
                    </div>
                </div>
            </header>

            {/* Paywall Card */}
            <div className="mt-8 max-w-lg mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Top accent */}
                    <div className="h-1.5" style={{ background: 'linear-gradient(to right, #3B82F6, #1D4ED8, #6366F1)' }} />

                    <div className="p-8 text-center">
                        {/* Lock icon */}
                        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                            style={{ background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)' }}>
                            <Lock className="w-8 h-8 text-blue-600" />
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Feature Rate Shopper
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">
                            This feature is only for <strong className="text-blue-600">Suite</strong>
                        </p>

                        {/* Features preview */}
                        <div className="text-left bg-gray-50 rounded-xl p-5 mb-6 space-y-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Suite plan includes
                            </p>
                            {[
                                'Price Comparison with 10+ competitors',
                                'Automatic daily price scanning',
                                'Market price analysis reports',
                                'Alerts when competitors drop prices',
                                'Multi-property management',
                            ].map((feature) => (
                                <div key={feature} className="flex items-center gap-2.5">
                                    <BarChart3 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <Link
                            href="/pricing-plans"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: '#fff' }}
                        >
                            <Crown className="w-4 h-4" />
                            Upgrade to Suite
                            <ArrowRight className="w-4 h-4" />
                        </Link>

                        <p className="text-xs text-gray-400 mt-4">
                            Or contact via Zalo for consultation
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
