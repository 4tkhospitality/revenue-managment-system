'use client';

/**
 * /pricing-plans - Pricing Page
 * Shows with Sidebar when logged in, otherwise public layout
 * Displays current tier when logged in
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Sidebar } from '@/components/dashboard/Sidebar';

// ═══════════════════════════════════════════════════════════════════
// Tier Data
// ═══════════════════════════════════════════════════════════════════

const tiers = [
    {
        name: 'Tiêu chuẩn',
        tier: 'FREE',
        price: 0,
        description: 'Tính giá NET → BAR nhanh chóng',
        features: [
            '✅ Tính giá OTA với commission',
            '✅ Ghép khuyến mãi (Stacking)',
            '✅ 3 lần import/tháng',
            '✅ 1 lần export/ngày (30 dòng)',
            '❌ Daily Actions',
            '❌ Guardrails',
            '❌ Analytics',
        ],
        cta: 'Bắt đầu miễn phí',
        ctaLink: '/auth/login',
        highlight: false,
        badge: null,
    },
    {
        name: 'Superior',
        tier: 'STARTER',
        price: 990000,
        description: 'Gợi ý giá hàng ngày + Export Excel',
        features: [
            '✅ Tất cả tính năng Tiêu chuẩn',
            '✅ Daily Actions (Gợi ý giá)',
            '✅ Lịch giá 30 ngày',
            '✅ Export Excel không giới hạn',
            '✅ 60 lần import/tháng',
            '✅ 2 người dùng',
            '❌ Guardrails',
            '❌ Analytics',
        ],
        cta: 'Liên hệ Zalo',
        ctaLink: 'https://zalo.me/0778602953',
        highlight: true,
        badge: '🔥 PHỔ BIẾN',
    },
    {
        name: 'Deluxe',
        tier: 'GROWTH',
        price: 2490000,
        description: 'Guardrails + Analytics cho khách sạn 31-60 phòng',
        features: [
            '✅ Tất cả tính năng Superior',
            '✅ Guardrails (Cảnh báo giá)',
            '✅ Lịch sử quyết định',
            '✅ Analytics cơ bản',
            '✅ 50 rate shops/tháng',
            '✅ 200 imports/tháng',
            '✅ 5 người dùng',
            '✅ Lưu dữ liệu 24 tháng',
        ],
        cta: 'Liên hệ Zalo',
        ctaLink: 'https://zalo.me/0778602953',
        highlight: false,
        badge: null,
    },
    {
        name: 'Suite',
        tier: 'PRO',
        price: 4990000,
        description: 'Multi-property + Advanced Analytics',
        features: [
            '✅ Tất cả tính năng Deluxe',
            '✅ Quản lý nhiều khách sạn (5)',
            '✅ Advanced Analytics',
            '✅ API Import tự động',
            '✅ 300 rate shops/tháng',
            '✅ 10 người dùng',
            '✅ Lưu dữ liệu 5 năm',
            '✅ Hỗ trợ ưu tiên',
        ],
        cta: 'Liên hệ Zalo',
        ctaLink: 'https://zalo.me/0778602953',
        highlight: false,
        badge: null,
    },
];

const formatVND = (n: number) =>
    n === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN').format(n) + 'đ/tháng';

const tierColors: Record<string, string> = {
    FREE: 'bg-gray-100 text-gray-700',
    STARTER: 'bg-blue-100 text-blue-700',
    GROWTH: 'bg-purple-100 text-purple-700',
    PRO: 'bg-amber-100 text-amber-700',
};

const tierLabels: Record<string, string> = {
    FREE: 'Tiêu chuẩn',
    STARTER: 'Superior',
    GROWTH: 'Deluxe',
    PRO: 'Suite',
};

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export default function PricingPlansPage() {
    const { data: session, status } = useSession();
    const [currentTier, setCurrentTier] = useState<string | null>(null);

    // Fetch current tier if logged in
    useEffect(() => {
        if (status === 'authenticated') {
            fetch('/api/subscription')
                .then((res) => res.json())
                .then((data) => setCurrentTier(data.plan || 'FREE'))
                .catch(() => setCurrentTier('FREE'));
        }
    }, [status]);

    const isLoggedIn = status === 'authenticated';

    // ═══════════════════════════════════════════════════════════════════
    // Pricing Content (shared between layouts)
    // ═══════════════════════════════════════════════════════════════════
    const PricingContent = () => (
        <>
            {/* Current Tier Banner */}
            {isLoggedIn && currentTier && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-blue-600 text-lg">📋</span>
                        <div>
                            <span className="text-gray-600">Gói hiện tại của bạn:</span>
                            <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${tierColors[currentTier]}`}>
                                {tierLabels[currentTier] || currentTier}
                            </span>
                        </div>
                    </div>
                    <a
                        href="https://zalo.me/0778602953"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Nâng cấp qua Zalo
                    </a>
                </div>
            )}

            {/* Hero */}
            <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {isLoggedIn ? 'Nâng cấp gói dịch vụ' : (
                        <>Revenue Management cho <span className="text-blue-600">Khách sạn SMB</span></>
                    )}
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    5 phút mỗi ngày. Không cần Revenue Manager.<br />
                    Gợi ý giá tự động dựa trên dữ liệu thực tế của bạn.
                </p>
                {!isLoggedIn && (
                    <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 mt-6">
                        <span className="flex items-center gap-1">✓ Không cần card</span>
                        <span className="flex items-center gap-1">✓ Hủy bất kỳ lúc nào</span>
                        <span className="flex items-center gap-1">✓ Hỗ trợ qua Zalo</span>
                    </div>
                )}
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {tiers.map((tier) => {
                    const isCurrentTier = currentTier === tier.tier;
                    return (
                        <div
                            key={tier.tier}
                            className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col ${isCurrentTier
                                ? 'border-green-500 shadow-xl shadow-green-100'
                                : tier.highlight
                                    ? 'border-blue-500 shadow-xl shadow-blue-100'
                                    : 'border-gray-200'
                                }`}
                        >
                            {/* Current Tier Badge */}
                            {isCurrentTier && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    ✓ GÓI HIỆN TẠI
                                </div>
                            )}
                            {/* Highlight Badge */}
                            {tier.badge && !isCurrentTier && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    {tier.badge}
                                </div>
                            )}

                            {/* Header */}
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">{tier.description}</p>
                            </div>

                            {/* Price */}
                            <div className="mb-6">
                                <span className="text-3xl font-bold text-gray-900">{formatVND(tier.price)}</span>
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-8 flex-1">
                                {tier.features.map((feature, i) => (
                                    <li key={i} className="text-sm text-gray-600">
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            {isCurrentTier ? (
                                <div className="block w-full text-center py-3 rounded-xl font-medium bg-green-100 text-green-700">
                                    Đang sử dụng
                                </div>
                            ) : (
                                <a
                                    href={tier.ctaLink}
                                    target={tier.ctaLink.startsWith('http') ? '_blank' : undefined}
                                    rel={tier.ctaLink.startsWith('http') ? 'noopener noreferrer' : undefined}
                                    className={`block w-full text-center py-3 rounded-xl font-medium transition-colors ${tier.highlight
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                        }`}
                                >
                                    {tier.cta}
                                </a>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* FAQ */}
            <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Câu hỏi thường gặp</h2>
                <div className="space-y-4">
                    <details className="bg-white border rounded-xl p-4 group">
                        <summary className="font-medium text-gray-900 cursor-pointer">
                            Daily Actions là gì?
                        </summary>
                        <p className="mt-3 text-gray-600 text-sm">
                            Daily Actions là hệ thống gợi ý giá hàng ngày dựa trên dữ liệu OTB (On-The-Book) thực tế của bạn.
                            Mỗi sáng, bạn chỉ cần mở app, xem gợi ý, và nhấn &quot;Accept&quot; - mất khoảng 5 phút.
                        </p>
                    </details>
                    <details className="bg-white border rounded-xl p-4 group">
                        <summary className="font-medium text-gray-900 cursor-pointer">
                            Thanh toán như thế nào?
                        </summary>
                        <p className="mt-3 text-gray-600 text-sm">
                            Hiện tại chúng tôi hỗ trợ thanh toán chuyển khoản ngân hàng.
                            Liên hệ Zalo để được hướng dẫn chi tiết và kích hoạt gói.
                        </p>
                    </details>
                    <details className="bg-white border rounded-xl p-4 group">
                        <summary className="font-medium text-gray-900 cursor-pointer">
                            Có thể nâng/hạ gói không?
                        </summary>
                        <p className="mt-3 text-gray-600 text-sm">
                            Có. Bạn có thể nâng hoặc hạ gói bất kỳ lúc nào. Chúng tôi sẽ tính theo ngày sử dụng thực tế.
                        </p>
                    </details>
                    <details className="bg-white border rounded-xl p-4 group">
                        <summary className="font-medium text-gray-900 cursor-pointer">
                            Dữ liệu có an toàn không?
                        </summary>
                        <p className="mt-3 text-gray-600 text-sm">
                            Dữ liệu được mã hóa và lưu trữ trên Supabase (PostgreSQL).
                            Mỗi khách sạn chỉ có thể truy cập dữ liệu của chính mình.
                        </p>
                    </details>
                </div>
            </div>
        </>
    );

    // ═══════════════════════════════════════════════════════════════════
    // Logged-in Layout (with Sidebar)
    // ═══════════════════════════════════════════════════════════════════
    if (isLoggedIn) {
        return (
            <div className="min-h-screen flex">
                <Sidebar />
                <main
                    className="lg:ml-64 flex-1 min-h-screen pt-14 lg:pt-0"
                    style={{ backgroundColor: '#F5F7FB' }}
                >
                    <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6">
                        <PricingContent />
                    </div>
                </main>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // Public Layout (no Sidebar)
    // ═══════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src="/logo.jpg"
                            alt="4TK Hospitality"
                            width={150}
                            height={40}
                            className="h-10 w-auto"
                            unoptimized
                            priority
                        />
                    </Link>
                    <Link
                        href="/auth/login"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Đăng nhập
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <section className="max-w-7xl mx-auto px-4 py-16">
                <PricingContent />
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <Image
                        src="/logo.jpg"
                        alt="4TK Hospitality"
                        width={120}
                        height={32}
                        className="h-8 w-auto mx-auto mb-4 brightness-200"
                        unoptimized
                    />
                    <p className="text-gray-400 text-sm">© 2026 4TK Hospitality. All rights reserved.</p>
                    <p className="text-gray-500 text-xs mt-2">
                        Liên hệ: <a href="https://zalo.me/0778602953" className="text-blue-400 hover:underline">Zalo 0778602953</a>
                    </p>
                </div>
            </footer>
        </div>
    );
}
