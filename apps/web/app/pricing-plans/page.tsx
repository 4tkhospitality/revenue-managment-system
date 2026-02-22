'use client';

/**
 * /pricing-plans - Pricing Page
 * Shows with Sidebar when logged in, otherwise public layout
 * Implements 4-Tier x 4-Room-Band Matrix Strategy
 * CTA → PaymentMethodModal (SePay / PayPal / Zalo)
 */

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, X, HelpCircle, AlertCircle, Zap } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { getPrice, getBandLabel, BAND_MULTIPLIER, BASE_PRICE } from '@/lib/plg/plan-config';
import { PlanTier, RoomBand } from '@prisma/client';
import { PaymentMethodModal } from '@/components/payments/PaymentMethodModal';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════
// Data & Constants
// ═══════════════════════════════════════════════════════════════════

type BillingCycle = 'monthly' | '3-months';

const ROOM_BANDS_KEYS: Array<{ id: RoomBand; labelKey: string; max: number }> = [
    { id: 'R30', labelKey: 'band.r30', max: 30 },
    { id: 'R80', labelKey: 'band.r80', max: 80 },
    { id: 'R150', labelKey: 'band.r150', max: 150 },
    { id: 'R300P', labelKey: 'band.r300p', max: 300 },
];

const TIER_KEYS = [
    {
        id: 'STANDARD',
        nameKey: 'tier.standard.name',
        descKey: 'tier.standard.desc',
        features: [
            { textKey: 'feat.netToBar', included: true },
            { textKey: 'feat.otaChannels', included: true },
            { textKey: 'feat.singleUser', included: true },
            { textKey: 'feat.otaOptDemo', included: true, hintKey: 'feat.otaOptDemoHint' },
            { textKey: 'feat.dashAnalytics', included: false },
            { textKey: 'feat.multiHotel', included: false },
        ],
        ctaKey: 'cta.free',
        ctaLink: '/auth/login',
        highlight: false,
    },
    {
        id: 'SUPERIOR',
        nameKey: 'tier.superior.name',
        descKey: 'tier.superior.desc',
        features: [
            { textKey: 'feat.allFree', included: true },
            { textKey: 'feat.fullOta', included: true },
            { textKey: 'feat.promoStack', included: true },
            { textKey: 'feat.exportMatrix', included: true },
            { textKey: 'feat.threeUsers', included: true },
            { textKey: 'feat.dashAnalytics', included: false },
        ],
        ctaKey: 'cta.contactNow',
        ctaLink: 'https://zalo.me/0778602953',
        highlight: true,
        badgeKey: 'badge.bestSeller',
    },
    {
        id: 'DELUXE',
        nameKey: 'tier.deluxe.name',
        descKey: 'tier.deluxe.desc',
        features: [
            { textKey: 'feat.allSuperior', included: true },
            { textKey: 'feat.dashKpi', included: true },
            { textKey: 'feat.otbAnalytics', included: true },
            { textKey: 'feat.dailyActions', included: true },
            { textKey: 'feat.uploadCsv', included: true },
            { textKey: 'feat.tenUsers', included: true },
        ],
        ctaKey: 'cta.contactZalo',
        ctaLink: 'https://zalo.me/0778602953',
        highlight: false,
    },
    {
        id: 'SUITE',
        nameKey: 'tier.suite.name',
        descKey: 'tier.suite.desc',
        features: [
            { textKey: 'feat.allDeluxe', included: true },
            { textKey: 'feat.multiHotels', included: true },
            { textKey: 'feat.unlimitedUsers', included: true },
            { textKey: 'feat.rbac', included: true },
            { textKey: 'feat.prioritySupport', included: true },
            { textKey: 'feat.onsiteSetup', included: true },
        ],
        ctaKey: 'cta.contactZalo',
        ctaLink: 'https://zalo.me/0778602953',
        highlight: false,
    },
];

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════

export default function PricingPlansPage() {
    const t = useTranslations('pricingPlans');
    const { data: session, status } = useSession();
    const [currentTier, setCurrentTier] = useState<string | null>(null);

    // State for pricing calculator
    const [roomBand, setRoomBand] = useState<RoomBand>('R30');
    const [cycle, setCycle] = useState<BillingCycle>('3-months');
    const [currentBand, setCurrentBand] = useState<RoomBand | null>(null);
    const [hotelId, setHotelId] = useState<string>('');

    // Dynamic pricing from DB
    const [dynamicPrices, setDynamicPrices] = useState<Record<string, { monthly: number; quarterly: number; discountPercent: number }> | null>(null);

    // PaymentMethodModal state
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedTier, setSelectedTier] = useState<PlanTier>('SUPERIOR');

    // Fetch dynamic prices from DB whenever roomBand changes
    const fetchDynamicPrices = useCallback(async (band: RoomBand) => {
        try {
            const res = await fetch(`/api/pricing/plans?band=${band}`);
            if (res.ok) {
                const data = await res.json();
                setDynamicPrices(data);
            }
        } catch {
            // Fallback: keep using hardcoded prices (dynamicPrices stays null)
        }
    }, []);

    useEffect(() => {
        fetchDynamicPrices(roomBand);
    }, [roomBand, fetchDynamicPrices]);

    useEffect(() => {
        if (status === 'authenticated') {
            // Fetch subscription info
            fetch('/api/subscription')
                .then((res) => res.json())
                .then((data) => {
                    if (data.roomBand) setCurrentBand(data.roomBand);
                    if (data.hotelId) setHotelId(data.hotelId);
                    // Check if the hotel is demo — don't show "current plan" for demo
                    return fetch('/api/is-demo-hotel').then(r => r.json()).then(demoData => {
                        if (demoData.isDemo) {
                            setCurrentTier(null); // Demo hotel — no "current plan" highlight
                            setHotelId(''); // Pay-first flow: don't tie payment to Demo Hotel
                        } else {
                            setCurrentTier(data.plan || 'STANDARD');
                        }
                    });
                })
                .catch(() => setCurrentTier('STANDARD'));
        }
    }, [status]);

    const isLoggedIn = status === 'authenticated';

    const handleUpgradeClick = (tierId: string) => {
        if (tierId === 'STANDARD') return; // Free tier, no payment needed
        setSelectedTier(tierId as PlanTier);
        setPaymentModalOpen(true);
    };

    // Use dynamic prices from DB, fallback to hardcoded
    const calcPrice = (tierId: string) => {
        if (dynamicPrices && dynamicPrices[tierId]) {
            return cycle === '3-months'
                ? dynamicPrices[tierId].quarterly  // already per-month discounted price
                : dynamicPrices[tierId].monthly;
        }
        // Fallback to hardcoded
        const basePrice = getPrice(tierId as any, roomBand);
        return cycle === '3-months' ? basePrice * 0.5 : basePrice;
    };

    // Original (undiscounted) monthly price for strikethrough display
    const getOriginalPrice = (tierId: string) => {
        if (dynamicPrices && dynamicPrices[tierId]) {
            return dynamicPrices[tierId].monthly;
        }
        return getPrice(tierId as any, roomBand);
    };

    // ═══════════════════════════════════════════════════════════════════
    // Render Content
    // ═══════════════════════════════════════════════════════════════════
    const PricingContent = () => (
        <div className="w-full max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-12">
                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                    {t('title')}
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    {t('subtitle')}<br />
                    <span className="text-blue-600 font-semibold">{t('save50')}</span> {t('subtitle2')}
                </p>
            </div>

            {/* Controls Section */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 md:p-8 mb-12 border border-gray-100">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* 1. Room Band Slider / Selector */}
                    <div>
                        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 block">
                            {t('yourHotelHas')}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {ROOM_BANDS_KEYS.map((band) => (
                                <button
                                    key={band.id}
                                    onClick={() => setRoomBand(band.id)}
                                    className={`py-3 px-2 rounded-xl text-sm font-medium transition-all border-2 ${roomBand === band.id
                                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                                        : 'border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {t(band.labelKey)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Billing Cycle Toggle */}
                    <div className="flex flex-col items-center md:items-start">
                        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 block">
                            {t('billingCycle')}
                        </label>
                        <div className="flex items-center bg-gray-100 p-1 rounded-xl relative">
                            <button
                                onClick={() => setCycle('monthly')}
                                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${cycle === 'monthly'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {t('monthly')}
                            </button>
                            <button
                                onClick={() => setCycle('3-months')}
                                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${cycle === '3-months'
                                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-100'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {t('quarterly')}
                                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    -50%
                                </span>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            {cycle === '3-months'
                                ? t('quarterlyRec')
                                : t('monthlyNote')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
                {TIER_KEYS.map((tier) => {
                    const monthlyPrice = calcPrice(tier.id);
                    const isCurrentTier = currentTier === tier.id;

                    return (
                        <div
                            key={tier.id}
                            className={`relative flex flex-col p-6 rounded-2xl bg-white border-2 transition-all duration-300 hover:-translate-y-1 ${isCurrentTier
                                ? 'border-green-500 shadow-2xl shadow-green-100 ring-4 ring-green-50 z-20 scale-105'
                                : tier.highlight
                                    ? 'border-blue-500 shadow-2xl shadow-blue-100 z-10'
                                    : 'border-gray-100 hover:border-blue-200 shadow-lg shadow-gray-100'
                                }`}
                        >
                            {/* Badge */}
                            {isCurrentTier && (
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                                    <Check className="w-3 h-3" /> {t('currentPlan')}
                                </div>
                            )}
                            {!isCurrentTier && tier.badgeKey && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                                    {t(tier.badgeKey)}
                                </div>
                            )}

                            {/* Header */}
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900">{t(tier.nameKey)}</h3>
                                <p className="text-sm text-gray-500 mt-2 min-h-[40px]">{t(tier.descKey)}</p>
                            </div>

                            {/* Price */}
                            <div className="mb-6">
                                {tier.id === 'STANDARD' ? (
                                    <div className="text-4xl font-bold text-gray-900">0₫</div>
                                ) : (
                                    <>
                                        <div className="flex items-end gap-2 mb-1">
                                            <span className="text-4xl font-bold text-gray-900">
                                                {formatVND(monthlyPrice)}₫
                                            </span>
                                            <span className="text-gray-500 text-sm mb-1">/{t('month')}</span>
                                        </div>
                                        {cycle === '3-months' && (
                                            <div className="text-xs text-gray-400 line-through">
                                                {formatVND(getOriginalPrice(tier.id))}₫/{t('month')}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Features */}
                            <div className="flex-1 space-y-4 mb-8">
                                {tier.features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm">
                                        {feature.included ? (
                                            <Check className={`w-5 h-5 shrink-0 ${tier.highlight ? 'text-blue-600' : 'text-gray-600'}`} />
                                        ) : (
                                            <X className="w-5 h-5 shrink-0 text-gray-300" />
                                        )}
                                        <div className="flex items-center">
                                            <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                                                {t(feature.textKey)}
                                            </span>
                                            {'hintKey' in feature && feature.hintKey && (
                                                <div title={t(feature.hintKey)} className="ml-1 inline-flex cursor-help text-gray-400 hover:text-gray-600">
                                                    <HelpCircle className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            {isLoggedIn && tier.id !== 'STANDARD' ? (
                                <button
                                    onClick={() => handleUpgradeClick(tier.id)}
                                    disabled={isCurrentTier}
                                    className={`w-full py-3 px-4 rounded-xl font-medium text-center transition-colors ${isCurrentTier
                                        ? 'bg-green-50 text-green-700 border-2 border-green-200 cursor-default'
                                        : tier.highlight
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                                            : 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                >
                                    {isCurrentTier ? t('currentPlanBtn') : t('upgradeTo', { name: t(tier.nameKey) })}
                                </button>
                            ) : (
                                <a
                                    href={tier.ctaLink}
                                    className={`w-full py-3 px-4 rounded-xl font-medium text-center transition-colors block ${tier.highlight
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                                        : 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                >
                                    {t(tier.ctaKey)}
                                </a>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* FAQ / Trust Section */}
            <div className="grid md:grid-cols-2 gap-8 border-t border-gray-200 pt-12 max-w-2xl mx-auto">
                <div className="text-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t('trust.setup')}</h4>
                    <p className="text-sm text-gray-600">{t('trust.setupDesc')}</p>
                </div>
                <div className="text-center">
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                        <Check className="w-6 h-6" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t('trust.support')}</h4>
                    <p className="text-sm text-gray-600">{t('trust.supportDesc')}</p>
                </div>
            </div>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════
    // Layout Handling (LoggedIn vs Public)
    // ═══════════════════════════════════════════════════════════════════

    if (isLoggedIn) {
        return (
            <div className="min-h-screen flex">
                <Sidebar />
                <main className="lg:ml-64 flex-1 min-h-screen pt-14 lg:pt-0" style={{ backgroundColor: 'var(--background)' }}>
                    <div className="p-4 sm:p-8">
                        <PricingContent />
                    </div>
                </main>

                {/* Payment Method Modal */}
                <PaymentMethodModal
                    isOpen={paymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    hotelId={hotelId}
                    tier={selectedTier}
                    roomBand={roomBand}
                    currentTier={(currentTier as PlanTier) || 'STANDARD'}
                    billingCycle={cycle}
                />
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // Public Layout (no Sidebar)
    // ═══════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Simple Public Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-900">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">4</div>
                        TK Hospitality
                    </Link>
                    <Link
                        href="/auth/login"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                        Sign In
                    </Link>
                </div>
            </header>

            <section className="py-16 px-4">
                <PricingContent />
            </section>

            <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-400 text-sm">© 2026 4TK Hospitality. All rights reserved.</p>
                    <p className="text-gray-500 text-xs mt-2">
                        {t('contactZalo')}: <a href="https://zalo.me/0778602953" className="text-blue-400 hover:underline">0778602953</a>
                    </p>
                </div>
            </footer>
        </div>
    );
}
