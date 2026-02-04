'use client'

import { signIn } from "next-auth/react"
import Image from "next/image"

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background with gradient layers */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
            radial-gradient(ellipse at 30% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            linear-gradient(180deg, 
              #0c1929 0%, 
              #1a365d 35%, 
              #1e4a8a 65%, 
              #3b82f6 90%,
              #7dd3fc 100%
            )
          `
                }}
            />

            {/* Radial glow behind card */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
                style={{
                    background: 'radial-gradient(circle, rgba(96, 165, 250, 0.4) 0%, transparent 70%)',
                }}
            />

            {/* Noise texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Glass Card - smaller & more transparent */}
            <div
                className="relative z-10 w-full max-w-[440px] mx-4 p-10 rounded-3xl"
                style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(32px)',
                    WebkitBackdropFilter: 'blur(32px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* Logo Badge - smaller, glass style */}
                <div className="flex justify-center mb-8">
                    <div
                        className="px-6 py-3 rounded-2xl"
                        style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                        }}
                    >
                        <Image
                            src="/logo.jpg"
                            alt="4TK Hospitality"
                            width={100}
                            height={35}
                            className="object-contain"
                        />
                    </div>
                </div>

                {/* Title */}
                <h1
                    className="text-[22px] font-semibold text-center text-white mb-2"
                    style={{ letterSpacing: '0.02em' }}
                >
                    Revenue Management System
                </h1>
                <p className="text-center text-white/60 mb-8 text-sm">
                    Đăng nhập để tiếp tục
                </p>

                {/* Google Login Button */}
                <button
                    onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                    className="w-full flex items-center justify-center gap-3 rounded-xl py-3.5 px-4 font-medium transition-all duration-200"
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        color: '#1e3a5f',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
                    }}
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
                    Đăng nhập bằng Google
                </button>

                {/* Helper text - more visible */}
                <p className="text-center text-white/70 text-xs mt-4">
                    Khuyến nghị dùng email công ty
                </p>

                {/* Footer - shorter */}
                <p className="text-center text-white/40 text-xs mt-10">
                    © 2026 4TK Hospitality
                </p>
            </div>
        </div>
    )
}
