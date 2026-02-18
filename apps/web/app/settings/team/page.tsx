'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Users, Ticket, AlertTriangle, Trash2, Clock, XCircle, ChevronDown, Shield, ShieldCheck, Eye } from 'lucide-react'

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

interface ActiveInvite {
    invite_id: string
    short_code: string
    role: string
    max_uses: number
    used_count: number
    expires_at: string
    created_at: string
    status: string
    isExpired: boolean
    isUsedUp: boolean
}

const ROLE_LABELS: Record<string, string> = {
    hotel_admin: 'Admin',
    manager: 'Manager',
    viewer: 'Viewer',
}

export default function TeamSettingsPage() {
    const { data: session } = useSession()
    const [members, setMembers] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [inviteLoading, setInviteLoading] = useState(false)
    const [invite, setInvite] = useState<InviteData | null>(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [copied, setCopied] = useState(false)
    const [seats, setSeats] = useState<{ current: number; max: number; available: boolean; plan: string | null; activeMembers: number; pendingInvites: number } | null>(null)
    const [orgInfo, setOrgInfo] = useState<{ orgName: string; roomBand: string } | null>(null)
    const [activeInvites, setActiveInvites] = useState<ActiveInvite[]>([])
    const [revoking, setRevoking] = useState<string | null>(null)
    const [inviteRole, setInviteRole] = useState<'viewer' | 'manager'>('viewer')
    const [changingRole, setChangingRole] = useState<string | null>(null)
    const [removing, setRemoving] = useState<string | null>(null)
    const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
    const [fetchedRole, setFetchedRole] = useState<string | null>(null)

    // Fetch real role from DB (JWT may be stale)
    useEffect(() => {
        fetch('/api/user/switch-hotel')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.activeHotelRole) {
                    setFetchedRole(data.activeHotelRole)
                }
            })
            .catch(() => { })
    }, [])

    const jwtRole = session?.user?.accessibleHotels?.find(
        (h) => h.role === 'hotel_admin'
    )?.role
    const effectiveRole = fetchedRole || jwtRole || session?.user?.role || 'viewer'
    const isAdmin = effectiveRole === 'hotel_admin' || session?.user?.isAdmin

    // Determine if current user is Owner (is_primary=true for this hotel)
    const currentUserMembership = members.find(m => m.user.id === session?.user?.id)
    const isOwner = currentUserMembership?.is_primary === true || session?.user?.isAdmin === true

    const atLimit = seats ? !seats.available : false

    // Count active hotel_admins for "last admin" guard
    const adminCount = members.filter(m => m.role === 'hotel_admin').length

    useEffect(() => {
        loadMembers()
        loadInvites()
    }, [])

    // Auto-clear success message
    useEffect(() => {
        if (success) {
            const t = setTimeout(() => setSuccess(''), 3000)
            return () => clearTimeout(t)
        }
    }, [success])

    const loadMembers = async () => {
        try {
            const [membersRes, orgRes] = await Promise.all([
                fetch('/api/team/members'),
                fetch('/api/organization').catch(() => null),
            ])
            if (membersRes.ok) {
                const data = await membersRes.json()
                setMembers(data.members || [])
                if (data.seats) setSeats({
                    ...data.seats,
                    activeMembers: data.seats.activeMembers ?? data.seats.current,
                    pendingInvites: data.seats.pendingInvites ?? 0,
                })
            }
            if (orgRes?.ok) {
                const orgData = await orgRes.json()
                if (orgData?.org) {
                    setOrgInfo({
                        orgName: orgData.org.name,
                        roomBand: orgData.subscription?.roomBand ?? 'R30',
                    })
                }
            }
        } catch (err) {
            console.error('Failed to load members:', err)
        } finally {
            setLoading(false)
        }
    }

    const loadInvites = async () => {
        try {
            const res = await fetch('/api/invite/list')
            if (res.ok) {
                const data = await res.json()
                setActiveInvites(data.invites || [])
            }
        } catch (err) {
            console.error('Failed to load invites:', err)
        }
    }

    const revokeInvite = async (inviteId: string) => {
        setRevoking(inviteId)
        try {
            const res = await fetch('/api/invite/list', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteId }),
            })
            if (res.ok) {
                setActiveInvites(prev => prev.filter(i => i.invite_id !== inviteId))
                loadMembers() // Refresh seats
            }
        } catch (err) {
            console.error('Failed to revoke invite:', err)
        } finally {
            setRevoking(null)
        }
    }

    const createInvite = async () => {
        setInviteLoading(true)
        setError('')

        try {
            const res = await fetch('/api/invite/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: inviteRole, maxUses: 5, expiryDays: 7 }),
            })

            const data = await res.json()

            if (res.ok) {
                setInvite({
                    inviteId: data.inviteId,
                    shortCode: data.shortCode,
                    inviteUrl: data.inviteUrl,
                    expiresAt: data.expiresAt,
                    role: inviteRole,
                })
                loadInvites()
            } else {
                if (data.error === 'TIER_LIMIT_REACHED') {
                    setError(data.message || 'Đã đạt giới hạn thành viên cho gói hiện tại.')
                } else {
                    setError(data.error || 'Không thể tạo mã mời')
                }
            }
        } catch (err) {
            setError('Có lỗi xảy ra')
        } finally {
            setInviteLoading(false)
        }
    }

    const changeRole = async (memberId: string, newRole: string) => {
        setChangingRole(memberId)
        setError('')
        try {
            const res = await fetch('/api/team/members', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId, newRole }),
            })
            const data = await res.json()
            if (res.ok) {
                setSuccess(`Đã đổi vai trò thành ${ROLE_LABELS[newRole] || newRole}`)
                loadMembers()
            } else {
                setError(data.error || 'Không thể đổi vai trò')
            }
        } catch (err) {
            setError('Có lỗi xảy ra')
        } finally {
            setChangingRole(null)
        }
    }

    const removeMember = async (memberId: string) => {
        setRemoving(memberId)
        setConfirmRemove(null)
        setError('')
        try {
            const res = await fetch('/api/team/members', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId }),
            })
            const data = await res.json()
            if (res.ok) {
                setSuccess('Đã xóa thành viên')
                loadMembers()
                loadInvites()
            } else {
                setError(data.error || 'Không thể xóa thành viên')
            }
        } catch (err) {
            setError('Có lỗi xảy ra')
        } finally {
            setRemoving(null)
        }
    }

    const copyInvite = async () => {
        if (!invite) return
        await navigator.clipboard.writeText(invite.inviteUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // ── Permission helpers for each member row ──────────────────────

    const canChangeRole = (member: TeamMember): boolean => {
        if (!isAdmin) return false
        if (member.is_primary) return false // Cannot change Owner
        if (member.user.id === session?.user?.id) return false // Cannot change self
        if (!isOwner && member.role === 'hotel_admin') return false // Non-owner cannot touch admin
        return true
    }

    const canRemove = (member: TeamMember): boolean => {
        if (!isAdmin) return false
        if (member.is_primary) return false // Cannot remove Owner
        if (member.user.id === session?.user?.id) return false // Cannot remove self
        if (!isOwner && member.role === 'hotel_admin') return false // Non-owner cannot remove admin
        if (member.role === 'hotel_admin' && adminCount <= 1) return false // Cannot remove last admin
        return true
    }

    const canDemoteAdmin = (member: TeamMember): boolean => {
        if (member.role !== 'hotel_admin') return true
        return adminCount > 1 // Cannot demote if last admin
    }

    const getAvailableRoles = (member: TeamMember): string[] => {
        const roles: string[] = []
        if (member.role !== 'viewer') roles.push('viewer')
        if (member.role !== 'manager') roles.push('manager')
        if (isOwner && member.role !== 'hotel_admin') roles.push('hotel_admin')
        // Filter: if demoting an admin, check last-admin guard
        return roles.filter(r => {
            if (member.role === 'hotel_admin' && r !== 'hotel_admin') return canDemoteAdmin(member)
            return true
        })
    }

    const getRoleBadge = (role: string, isPrimary: boolean) => {
        if (isPrimary) {
            return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">Owner</span>
        }
        const badges: Record<string, { bg: string; text: string; icon: any }> = {
            hotel_admin: { bg: 'bg-purple-100', text: 'text-purple-700', icon: ShieldCheck },
            manager: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Shield },
            viewer: { bg: 'bg-gray-100', text: 'text-gray-600', icon: Eye },
        }
        const badge = badges[role] || badges.viewer
        const Icon = badge.icon
        return (
            <span className={`px-2 py-1 text-xs rounded-full ${badge.bg} ${badge.text} font-medium inline-flex items-center gap-1`}>
                <Icon className="w-3 h-3" />
                {ROLE_LABELS[role] || role}
            </span>
        )
    }

    const getRoleIcon = (role: string) => {
        if (role === 'hotel_admin') return <ShieldCheck className="w-3.5 h-3.5" />
        if (role === 'manager') return <Shield className="w-3.5 h-3.5" />
        return <Eye className="w-3.5 h-3.5" />
    }

    const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

    return (
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <header
                className="rounded-2xl px-4 sm:px-6 py-4 text-white shadow-sm"
                style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
            >
                <h1 className="text-lg font-semibold">
                    <Users className="w-5 h-5 inline mr-1" />
                    {orgInfo ? `Thành viên • ${orgInfo.orgName}` : 'Quản lý Team'}
                    {seats?.plan && <span className="ml-2 text-white/60 text-sm">({seats.plan})</span>}
                </h1>
                <p className="text-white/70 text-sm mt-1">Mời thành viên và quản lý quyền truy cập</p>
            </header>

            {/* Success Toast */}
            {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
                    ✓ {success}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Invite Section */}
            {isAdmin && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-900"><Ticket className="w-4 h-4 inline mr-1" /> Mời thành viên</h2>
                        {seats && seats.max > 0 && (
                            <span className={`text-sm font-medium px-3 py-1 rounded-full ${atLimit ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                {seats.activeMembers ?? seats.current}/{seats.max >= 999 ? '∞' : seats.max} thành viên
                                {(seats.pendingInvites ?? 0) > 0 && (
                                    <span className="text-xs ml-1 opacity-70">(+{seats.pendingInvites} invite)</span>
                                )}
                            </span>
                        )}
                    </div>

                    {atLimit && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                            <AlertTriangle className="w-4 h-4 inline mr-1" /> Đã đạt giới hạn thành viên cho gói <strong>{seats?.plan}</strong>.
                            <p className="mt-1 text-xs text-amber-600">Quota Users giới hạn theo gói (tier), không theo số phòng (band).</p>
                            <a href="/pricing-plans" className="mt-1 inline-block text-blue-600 hover:underline font-medium">Nâng cấp gói để thêm thành viên →</a>
                        </div>
                    )}

                    {invite ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-500 mb-2">Mã mời (vai trò: {ROLE_LABELS[invite.role] || invite.role}):</p>
                                <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">{invite.shortCode}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-500 mb-2">Hoặc gửi link:</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={invite.inviteUrl}
                                        readOnly
                                        className="flex-1 min-w-0 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-mono truncate"
                                    />
                                    <button
                                        onClick={copyInvite}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 shrink-0"
                                    >
                                        {copied ? '✓ Đã copy' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-400">
                                    Hết hạn: {formatDate(invite.expiresAt)}
                                </p>
                                <button
                                    onClick={() => setInvite(null)}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    Tạo mã mời khác
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            {/* Role picker */}
                            <div className="relative">
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as 'viewer' | 'manager')}
                                    className="appearance-none pl-3 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    disabled={atLimit}
                                >
                                    <option value="viewer">👁 Viewer</option>
                                    <option value="manager">🔧 Manager</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            <button
                                onClick={createInvite}
                                disabled={inviteLoading || atLimit}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title={atLimit ? 'Đã đạt giới hạn thành viên' : ''}
                            >
                                {inviteLoading ? 'Đang tạo...' : atLimit ? 'Đã đạt giới hạn' : '+ Tạo mã mời mới'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Active Invites Management */}
            {isAdmin && activeInvites.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">
                            <Ticket className="w-4 h-4 inline mr-1" /> Mã mời đang hoạt động ({activeInvites.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {activeInvites.map((inv) => (
                            <div key={inv.invite_id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                                        <Ticket className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-mono font-bold text-gray-900">{inv.short_code}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                            <span className="px-1.5 py-0.5 bg-gray-100 rounded">{ROLE_LABELS[inv.role] || inv.role}</span>
                                            <span>Dùng: {inv.used_count}/{inv.max_uses}</span>
                                            <span className="flex items-center gap-0.5">
                                                <Clock className="w-3 h-3" />
                                                {inv.isExpired ? (
                                                    <span className="text-red-500">Hết hạn</span>
                                                ) : (
                                                    formatDate(inv.expires_at)
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => revokeInvite(inv.invite_id)}
                                    disabled={revoking === inv.invite_id}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Thu hồi mã mời"
                                >
                                    {revoking === inv.invite_id ? (
                                        <XCircle className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Members List */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900"><Users className="w-4 h-4 inline mr-1" /> Thành viên ({members.length})</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400">Đang tải...</div>
                ) : members.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">Chưa có thành viên nào</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {members.map((member) => {
                            const availableRoles = getAvailableRoles(member)
                            const showActions = isAdmin && canChangeRole(member)
                            const showRemove = canRemove(member)

                            return (
                                <div key={member.id} className="p-4 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold shrink-0">
                                            {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-gray-900 font-medium truncate">
                                                {member.user.name || 'Unnamed'}
                                                {member.user.id === session?.user?.id && (
                                                    <span className="ml-1.5 text-xs text-gray-400">(bạn)</span>
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">{member.user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* Role badge or change dropdown */}
                                        {showActions && availableRoles.length > 0 ? (
                                            <div className="relative">
                                                <select
                                                    value={member.role}
                                                    onChange={(e) => changeRole(member.id, e.target.value)}
                                                    disabled={changingRole === member.id}
                                                    className="appearance-none pl-2 pr-7 py-1 text-xs font-medium rounded-full border border-gray-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                                                >
                                                    <option value={member.role}>{ROLE_LABELS[member.role] || member.role}</option>
                                                    {availableRoles.map(r => (
                                                        <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            </div>
                                        ) : (
                                            getRoleBadge(member.role, member.is_primary)
                                        )}

                                        {/* Remove button */}
                                        {showRemove && (
                                            <>
                                                {confirmRemove === member.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => removeMember(member.id)}
                                                            disabled={removing === member.id}
                                                            className="px-2 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                                                        >
                                                            {removing === member.id ? '...' : 'Xác nhận'}
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmRemove(null)}
                                                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                                                        >
                                                            Hủy
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmRemove(member.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Xóa thành viên"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}


