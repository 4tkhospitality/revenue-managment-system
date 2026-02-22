'use client'

import { signIn } from "next-auth/react"
import Image from "next/image"
import { useTranslations } from 'next-intl'

// 4TK Brand Colors (from logo)
const BRAND = {
    primary: '#204183',      // Brand Primary
    dark: '#0B1E3A',         // Brand Dark (deep background)
    mid: '#16325F',          // Brand Mid (gradient trung gian)
    light: '#AABAD1',        // Brand Light (border/hover light)
}

export default function LoginPage() {
    const t = useTranslations();
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background - Brand Gradient + Radial glow */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
                        radial-gradient(900px circle at 20% 20%, rgba(80, 153, 255, 0.25), transparent 55%),
                        linear-gradient(135deg, ${BRAND.dark} 0%, ${BRAND.mid} 40%, ${BRAND.primary} 100%)
                    `
                }}
            />

            {/* Subtle noise texture for premium feel */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Glass Card - brand continuation */}
            <div
                className="relative z-10 w-full max-w-md mx-4 rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl"
                style={{
                    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
                }}
            >
                <div className="p-10">
                    {/* Logo - with brand blue bg to match JPG logo color */}
                    <div className="flex justify-center mb-6">
                        <div
                            className="rounded-2xl p-0.5"
                            style={{ backgroundColor: BRAND.primary }}
                        >
                            <Image
                                src="/logo.jpg"
                                alt="4TK Hospitality"
                                width={100}
                                height={100}
                                className="rounded-2xl object-contain"
                            />
                        </div>
                    </div>

                    {/* Title - text-white for main title */}
                    <h1
                        className="text-2xl font-semibold text-center text-white mb-2"
                        style={{ fontStyle: 'italic', letterSpacing: '0.01em' }}
                    >
                        Revenue Management System
                    </h1>

                    {/* Subtitle - uses text-white/70 (not gray) */}
                    <p className="text-center text-white/70 mb-8 text-sm">
                        {t('auth.loginSubtitle')}
                    </p>

                    {/* Google Login Button - standard white, prominent */}
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                        className="w-full flex items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 text-slate-900 font-medium shadow-sm ring-1 ring-white/60 transition-all duration-200 hover:bg-white/95 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white/80"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        {t('auth.signInWith', { provider: 'Google' })}
                    </button>

                    {/* Helper text - text-white/55 */}
                    <p className="text-center text-white/55 text-xs mt-5">
                        {t('auth.useCompanyEmail')}
                    </p>

                    {/* Footer */}
                    <p className="text-center text-white/40 text-xs mt-10">
                        © 2026 4TK Hospitality
                    </p>
                </div>
            </div>
        </div>
    )
}
