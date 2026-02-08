'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface InviteData {
    inviteId: string
    shortCode: string
    inviteUrl: string
    expiresAt: string
    role: string
}

interface TeamMember {
    id: string
    user: {
        id: string
        name: string | null
        email: string
    }
    role: string
    is_primary: boolean
    created_at: string
}

export default function TeamSettingsPage() {
    const { data: session } = useSession()
    const [members, setMembers] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [inviteLoading, setInviteLoading] = useState(false)
    const [invite, setInvite] = useState<InviteData | null>(null)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)

    const isAdmin = session?.user?.accessibleHotels?.some(
        (h) => h.role === 'hotel_admin'
    ) || session?.user?.isAdmin

    useEffect(() => {
        loadMembers()
    }, [])

    const loadMembers = async () => {
        try {
            const res = await fetch('/api/team/members')
            if (res.ok) {
                const data = await res.json()
                setMembers(data.members || [])
            }
        } catch (err) {
            console.error('Failed to load members:', err)
        } finally {
            setLoading(false)
        }
    }

    const createInvite = async () => {
        setInviteLoading(true)
        setError('')

        try {
            const res = await fetch('/api/invite/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'viewer', maxUses: 5, expiryDays: 7 }),
            })

            const data = await res.json()

            if (res.ok) {
                setInvite({
                    inviteId: data.inviteId,
                    shortCode: data.shortCode,
                    inviteUrl: data.inviteUrl,
                    expiresAt: data.expiresAt,
                    role: 'viewer',
                })
            } else {
                setError(data.error || 'Không thể tạo mã mời')
            }
        } catch (err) {
            setError('Có lỗi xảy ra')
        } finally {
            setInviteLoading(false)
        }
    }

    const copyInvite = async () => {
        if (!invite) return
        await navigator.clipboard.writeText(invite.inviteUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const getRoleBadge = (role: string, isPrimary: boolean) => {
        if (isPrimary) {
            return <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-400">Owner</span>
        }
        const badges: Record<string, { bg: string; text: string }> = {
            hotel_admin: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
            manager: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
            viewer: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
        }
        const badge = badges[role] || badges.viewer
        return <span className={`px-2 py-1 text-xs rounded-full ${badge.bg} ${badge.text}`}>{role}</span>
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-2">Quản lý Team</h1>
            <p className="text-white/60 mb-8">Mời thành viên và quản lý quyền truy cập</p>

            {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200">
                    {error}
                </div>
            )}

            {/* Invite Section */}
            {isAdmin && (
                <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <h2 className="font-semibold text-white mb-4">🎟️ Mời thành viên</h2>

                    {invite ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-xl">
                                <p className="text-sm text-white/60 mb-2">Mã mời:</p>
                                <p className="text-2xl font-mono font-bold text-white tracking-wider">{invite.shortCode}</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl">
                                <p className="text-sm text-white/60 mb-2">Hoặc gửi link:</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={invite.inviteUrl}
                                        readOnly
                                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 font-mono"
                                    />
                                    <button
                                        onClick={copyInvite}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                                    >
                                        {copied ? '✓ Đã copy' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-white/40">
                                Hết hạn: {new Date(invite.expiresAt).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={createInvite}
                            disabled={inviteLoading}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl disabled:opacity-50"
                        >
                            {inviteLoading ? 'Đang tạo...' : '+ Tạo mã mời mới'}
                        </button>
                    )}
                </div>
            )}

            {/* Members List */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <h2 className="font-semibold text-white">👥 Thành viên ({members.length})</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-white/40">Đang tải...</div>
                ) : members.length === 0 ? (
                    <div className="p-8 text-center text-white/40">Chưa có thành viên nào</div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {members.map((member) => (
                            <div key={member.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold">
                                        {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{member.user.name || 'Unnamed'}</p>
                                        <p className="text-sm text-white/50">{member.user.email}</p>
                                    </div>
                                </div>
                                {getRoleBadge(member.role, member.is_primary)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
