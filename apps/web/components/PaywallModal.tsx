'use client'

import { useState } from 'react'
import { BarChart3, Users, Search, Star } from 'lucide-react'

interface PaywallModalProps {
    isOpen: boolean
    onClose: () => void
    feature: 'export' | 'team' | 'audit' | 'generic'
    currentTier: string
    message?: string
}

const FEATURE_INFO = {
    export: {
        icon: <BarChart3 className="w-10 h-10 text-blue-400" />,
        title: 'Upgrade to export more data',
        description: 'Free plan allows only 3 exports per week.',
        cta: 'Upgrade for unlimited exports',
    },
    team: {
        icon: <Users className="w-10 h-10 text-blue-400" />,
        title: 'Invite more team members',
        description: 'Free plan allows only 1 member.',
        cta: 'Upgrade to expand your team',
    },
    audit: {
        icon: <Search className="w-10 h-10 text-blue-400" />,
        title: 'Detailed data audit reports',
        description: 'Deep data quality analysis available on Pro plan.',
        cta: 'Upgrade for full reports',
    },
    generic: {
        icon: <Star className="w-10 h-10 text-amber-400" />,
        title: 'Premium feature',
        description: 'This feature requires a plan upgrade.',
        cta: 'View upgrade plans',
    },
}

const TIER_BADGES = {
    FREE: { label: 'Free', color: 'bg-slate-500' },
    STARTER: { label: 'Starter', color: 'bg-blue-500' },
    PRO: { label: 'Pro', color: 'bg-purple-500' },
    ENTERPRISE: { label: 'Enterprise', color: 'bg-amber-500' },
}

export default function PaywallModal({
    isOpen,
    onClose,
    feature,
    currentTier,
    message,
}: PaywallModalProps) {
    const [loading, setLoading] = useState(false)
    const info = FEATURE_INFO[feature]
    const tierBadge = TIER_BADGES[currentTier as keyof typeof TIER_BADGES] || TIER_BADGES.FREE

    if (!isOpen) return null

    const handleUpgrade = () => {
        setLoading(true)
        // Navigate to pricing page or open Stripe checkout
        window.open('/pricing', '_blank')
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-md rounded-3xl p-6 animate-in fade-in zoom-in-95 duration-200"
                style={{
                    background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                }}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition"
                >
                    ✕
                </button>

                {/* Content */}
                <div className="text-center">
                    <div className="mb-4">{info.icon}</div>

                    {/* Current tier badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-white/60 mb-4">
                        Current plan:
                        <span className={`px-2 py-0.5 rounded-full ${tierBadge.color} text-white`}>
                            {tierBadge.label}
                        </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-semibold text-white mb-2">{info.title}</h2>

                    {/* Description */}
                    <p className="text-white/60 mb-6">
                        {message || info.description}
                    </p>

                    {/* Benefits */}
                    <div className="p-4 bg-white/5 rounded-xl mb-6 text-left">
                        <p className="text-sm text-white/80 font-medium mb-2">Pro plan includes:</p>
                        <ul className="space-y-2 text-sm text-white/60">
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span> Unlimited data exports
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span> Up to 10 team members
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span> Detailed data audit reports
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span> Rate Shopper competitor tracking
                            </li>
                        </ul>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleUpgrade}
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold disabled:opacity-50 hover:opacity-90 transition"
                        >
                            {loading ? 'Redirecting...' : info.cta}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-xl text-white/60 hover:text-white/80 transition"
                        >
                            Maybe later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
