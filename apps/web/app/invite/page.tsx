'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

function InviteContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [inviteCode, setInviteCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [isRedeeming, setIsRedeeming] = useState(false)

    // Auto-redeem if token in URL
    useEffect(() => {
        const token = searchParams.get('token')
        if (token && !isRedeeming) {
            setIsRedeeming(true)
            handleRedeem(token, true)
        }
    }, [searchParams, isRedeeming])

    const handleRedeem = async (codeOrToken: string, isToken = false) => {
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/invite/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isToken ? { token: codeOrToken } : { code: codeOrToken }),
            })

            const data = await res.json()

            if (res.ok) {
                router.push('/dashboard')
                router.refresh()
            } else {
                setError(data.error || 'Mã mời không hợp lệ')
            }
        } catch (err) {
            setError('Có lỗi xảy ra, vui lòng thử lại')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteCode.trim()) return
        handleRedeem(inviteCode.trim())
    }

    return (
        <div
            className="rounded-2xl p-8 shadow-lg"
            style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)'
            }}
        >
            <div className="text-center mb-6">
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'var(--brand-primary)', color: '#fff' }}
                >
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h1
                    className="text-xl font-semibold mb-2"
                    style={{ color: 'var(--foreground)' }}
                >
                    Nhập mã mời
                </h1>
                <p style={{ color: 'var(--muted)' }} className="text-sm">
                    Nhập mã để tham gia khách sạn của đồng nghiệp
                </p>
            </div>

            {error && (
                <div
                    className="mb-4 p-3 rounded-lg text-sm text-center"
                    style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}
                >
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="VD: ABC12345"
                    maxLength={20}
                    className="w-full px-4 py-3 rounded-lg text-center text-lg font-mono tracking-wider focus:outline-none focus:ring-2"
                    style={{
                        background: 'var(--surface-alt)',
                        border: '1px solid var(--border)',
                        color: 'var(--foreground)'
                    }}
                    autoFocus
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !inviteCode.trim()}
                    className="w-full py-3 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{
                        background: 'var(--brand-primary)',
                        color: '#fff'
                    }}
                >
                    {loading ? (
                        <>
                            <div
                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                            />
                            Đang xử lý...
                        </>
                    ) : (
                        'Tham gia'
                    )}
                </button>
            </form>

            <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                    onClick={() => router.push('/welcome')}
                    className="w-full text-sm text-center"
                    style={{ color: 'var(--muted)' }}
                >
                    ← Quay lại trang chào mừng
                </button>
            </div>
        </div>
    )
}

export default function InvitePage() {
    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 py-12"
            style={{ background: 'var(--background)' }}
        >
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <img
                        src="/logo.png"
                        alt="4TK Hospitality"
                        className="h-16 object-contain"
                    />
                </div>

                <Suspense fallback={
                    <div
                        className="rounded-2xl p-8 text-center shadow-lg"
                        style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)'
                        }}
                    >
                        <div
                            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
                            style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}
                        />
                        <p className="mt-4" style={{ color: 'var(--muted)' }}>Đang tải...</p>
                    </div>
                }>
                    <InviteContent />
                </Suspense>

                {/* Footer */}
                <p
                    className="text-center text-sm mt-6"
                    style={{ color: 'var(--muted)' }}
                >
                    © 2026 4TK Hospitality
                </p>
            </div>
        </div>
    )
}
