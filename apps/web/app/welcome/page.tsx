'use client'

import { useState, useEffect } from 'react'

export default function WelcomePage() {
    const [loading, setLoading] = useState<string | null>(null)
    const [showInviteInput, setShowInviteInput] = useState(false)
    const [inviteCode, setInviteCode] = useState('')
    const [error, setError] = useState('')
    const [checkingPayment, setCheckingPayment] = useState(true)

    // On mount: check if user has a completed payment without hotel (pay-first flow)
    useEffect(() => {
        async function checkPendingActivation() {
            try {
                console.log('[Welcome] 🔍 Checking pending activation...')
                const res = await fetch('/api/payments/pending-activation')
                console.log(`[Welcome] 📡 API response: status=${res.status}, ok=${res.ok}, url=${res.url}`)
                if (res.ok) {
                    const data = await res.json()
                    console.log('[Welcome] 📦 API data:', JSON.stringify(data))
                    if (data.hasPendingActivation) {
                        console.log('[Welcome] ✅ Has pending activation → redirecting to /onboarding')
                        window.location.href = '/onboarding'
                        return
                    } else {
                        console.log('[Welcome] ⚠️ No pending activation → showing welcome page')
                    }
                } else {
                    const text = await res.text()
                    console.log(`[Welcome] ❌ API error: status=${res.status}, body=${text.substring(0, 200)}`)
                }
            } catch (err) {
                console.error('[Welcome] ❌ Failed to check pending activation:', err)
            }
            setCheckingPayment(false)
        }
        checkPendingActivation()
    }, [])

    const handleTryDemo = async () => {
        setLoading('demo')
        setError('')

        try {
            const res = await fetch('/api/onboarding/demo', { method: 'POST' })
            const data = await res.json()

            if (res.ok) {
                window.location.href = '/dashboard'
                return
            } else {
                setError(data.error || 'Có lỗi xảy ra')
            }
        } catch (err) {
            setError('Không thể kết nối server')
        } finally {
            setLoading(null)
        }
    }

    const handleInviteSubmit = async () => {
        if (!inviteCode.trim()) return
        setLoading('invite')
        setError('')

        try {
            const res = await fetch('/api/invite/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: inviteCode.trim() }),
            })
            const data = await res.json()

            if (res.ok) {
                window.location.href = '/dashboard'
                return
            } else if (data.error?.includes('thành viên')) {
                window.location.href = '/dashboard'
                return
            } else {
                setError(data.error || 'Mã mời không hợp lệ')
            }
        } catch (err) {
            setError('Không thể kết nối server')
        } finally {
            setLoading(null)
        }
    }

    // Show loading while checking payment status
    if (checkingPayment) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--brand-primary)' }} />
            </div>
        )
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 py-12"
            style={{ background: 'var(--background)' }}
        >
            <div className="w-full max-w-lg">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <img
                        src="/logo.jpg"
                        alt="4TK Hospitality"
                        className="h-16 object-contain"
                    />
                </div>
                {/* Welcome Card */}
                <div
                    className="rounded-2xl p-8 shadow-lg"
                    style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)'
                    }}
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1
                            className="text-2xl font-semibold mb-2"
                            style={{ color: 'var(--foreground)' }}
                        >
                            Chào mừng đến với RMS
                        </h1>
                        <p style={{ color: 'var(--muted)' }}>
                            Hệ thống quản lý doanh thu khách sạn
                        </p>
                    </div>

                    {error && (
                        <div
                            className="mb-6 p-3 rounded-lg text-sm text-center"
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: 'var(--danger)',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {/* Options */}
                    <div className="space-y-3">
                        {/* Try Demo */}
                        <button
                            onClick={handleTryDemo}
                            disabled={loading !== null}
                            className="w-full p-4 rounded-xl text-left transition-all hover:shadow-md disabled:opacity-50 group"
                            style={{
                                background: 'var(--surface-alt)',
                                border: '1px solid var(--border)'
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ background: 'var(--brand-primary)', color: '#fff' }}
                                >
                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium" style={{ color: 'var(--foreground)' }}>
                                        {loading === 'demo' ? 'Đang tải...' : 'Xem Demo'}
                                    </div>
                                    <div className="text-sm" style={{ color: 'var(--muted)' }}>
                                        Dành cho người muốn tìm hiểu hệ thống trước
                                    </div>
                                </div>
                                <svg
                                    width="20" height="20" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor" strokeWidth="2"
                                    style={{ color: 'var(--muted)' }}
                                    className="group-hover:translate-x-1 transition-transform"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>

                        {/* Invite Code */}
                        {!showInviteInput ? (
                            <button
                                onClick={() => setShowInviteInput(true)}
                                disabled={loading !== null}
                                className="w-full p-4 rounded-xl text-left transition-all hover:shadow-md disabled:opacity-50 group"
                                style={{
                                    background: 'var(--surface-alt)',
                                    border: '1px solid var(--border)'
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                        style={{ background: 'var(--success)', color: '#fff' }}
                                    >
                                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            Nhập mã mời
                                        </div>
                                        <div className="text-sm" style={{ color: 'var(--muted)' }}>
                                            Dành cho nhân viên được mời tham gia
                                        </div>
                                    </div>
                                    <svg
                                        width="20" height="20" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor" strokeWidth="2"
                                        style={{ color: 'var(--muted)' }}
                                        className="group-hover:translate-x-1 transition-transform"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>
                        ) : (
                            <div
                                className="p-4 rounded-xl"
                                style={{
                                    background: 'var(--surface-alt)',
                                    border: '1px solid var(--border)'
                                }}
                            >
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                        placeholder="VD: ABC12345"
                                        maxLength={20}
                                        className="flex-1 px-4 py-2 rounded-lg text-center font-mono tracking-wider focus:outline-none focus:ring-2"
                                        style={{
                                            background: 'var(--surface)',
                                            border: '1px solid var(--border)',
                                            color: 'var(--foreground)'
                                        }}
                                        autoFocus
                                        disabled={loading !== null}
                                    />
                                    <button
                                        onClick={handleInviteSubmit}
                                        disabled={loading !== null || !inviteCode.trim()}
                                        className="px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                                        style={{
                                            background: 'var(--success)',
                                            color: '#fff'
                                        }}
                                    >
                                        {loading === 'invite' ? '...' : 'Tham gia'}
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowInviteInput(false)
                                        setInviteCode('')
                                    }}
                                    className="w-full mt-2 text-sm text-center"
                                    style={{ color: 'var(--muted)' }}
                                >
                                    Hủy
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p
                    className="text-center text-sm mt-6"
                    style={{ color: 'var(--muted)' }}
                >
                    © 2026 4TK Hospitality.
                </p>
            </div>
        </div>
    )
}
