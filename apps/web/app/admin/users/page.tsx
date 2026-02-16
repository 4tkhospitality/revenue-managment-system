'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// ── SVG Icon Components ────────────────────────────────────────────
const Icons = {
    users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
    ),
    hotel: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
    ),
    plus: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    ),
    search: (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
    ),
    edit: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
    ),
    link: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.25 8.497" />
        </svg>
    ),
    lock: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
    ),
    unlock: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
    ),
    trash: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
    ),
    check: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    ),
    clock: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    warning: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
    ),
    phone: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
    ),
    star: (
        <svg className="w-3 h-3 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    ),
    close: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
};

// ── Interfaces ─────────────────────────────────────────────────────

interface HotelAssignment {
    hotelId: string;
    hotelName: string;
    role: string;
    isPrimary: boolean;
}

interface PaymentInfo {
    status: string;
    tier: string | null;
    roomBand: string | null;
    amount: number;
    currency: string;
    gateway: string;
    completedAt: string | null;
    createdAt: string;
    hasHotel: boolean;
}

interface User {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    image: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
    hotels: HotelAssignment[];
    payment: PaymentInfo | null;
}

interface Hotel {
    id: string;
    name: string;
}

// ── Main Component ─────────────────────────────────────────────────

export default function AdminUsersPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<User[]>([]);
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        fetchUsers();
        fetchHotels();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`/api/admin/users?search=${search}`);
            const data = await res.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHotels = async () => {
        try {
            const res = await fetch('/api/admin/hotels');
            const data = await res.json();
            setHotels(data.hotels || []);
        } catch (error) {
            console.error('Error fetching hotels:', error);
        }
    };

    const toggleUserActive = async (user: User) => {
        if (!confirm(`${user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'} người dùng ${user.email}?`)) return;
        try {
            await fetch(`/api/admin/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !user.isActive })
            });
            fetchUsers();
        } catch (error) {
            console.error('Error toggling user:', error);
        }
    };

    const deleteUser = async (user: User) => {
        if (!confirm(`⚠️ XÓA VĨNH VIỄN người dùng ${user.email}?\n\nHành động này không thể hoàn tác!`)) return;
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
            if (res.ok) fetchUsers();
            else alert('Có lỗi xảy ra khi xóa');
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    // ── Badge & format helpers ────────────────────────────────────

    const getRoleBadge = (role: string) => {
        const config: Record<string, { bg: string; text: string; label: string }> = {
            super_admin: { bg: 'bg-red-50', text: 'text-red-700', label: 'Super Admin' },
            hotel_admin: { bg: 'bg-violet-50', text: 'text-violet-700', label: 'Hotel Admin' },
            manager: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Manager' },
            viewer: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Viewer' },
        };
        const c = config[role] || config.viewer;
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${c.bg} ${c.text}`}>
                {c.label}
            </span>
        );
    };

    const formatPayment = (payment: PaymentInfo | null) => {
        if (!payment) return <span className="text-slate-300 text-xs">—</span>;
        const amount = payment.currency === 'VND'
            ? `${payment.amount.toLocaleString('vi-VN')}₫`
            : `$${payment.amount.toFixed(2)}`;
        const isCompleted = payment.status === 'COMPLETED';
        const isPending = payment.status === 'PENDING';
        return (
            <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${isCompleted ? 'bg-emerald-50 text-emerald-700' :
                            isPending ? 'bg-amber-50 text-amber-700' :
                                'bg-slate-100 text-slate-500'
                        }`}>
                        {isCompleted ? Icons.check : isPending ? Icons.clock : Icons.warning}
                        {amount}
                    </span>
                </div>
                {payment.tier && (
                    <div className="text-[11px] text-slate-500">
                        Gói <span className="font-semibold text-slate-700">{payment.tier}</span>
                    </div>
                )}
                {isCompleted && !payment.hasHotel && (
                    <div className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                        {Icons.warning} Chờ onboarding
                    </div>
                )}
            </div>
        );
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // ── Auth guard ────────────────────────────────────────────────

    if (!session?.user?.isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 flex items-center justify-center">
                        {Icons.lock}
                    </div>
                    <h1 className="text-xl font-semibold text-slate-900">Không có quyền truy cập</h1>
                    <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                        ← Quay lại Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // ── Stats ─────────────────────────────────────────────────────

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const paidUsers = users.filter(u => u.payment?.status === 'COMPLETED').length;
    const pendingOnboarding = users.filter(u => u.payment?.status === 'COMPLETED' && !u.payment?.hasHotel).length;

    // ── Render ────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-6 space-y-5">
            {/* ── Header ───────────────────────────────────────────── */}
            <header className="rounded-2xl px-6 py-5 text-white"
                style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #2563EB 100%)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
                            {Icons.users}
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold tracking-tight">Quản lý người dùng</h1>
                            <p className="text-blue-200 text-sm">{totalUsers} người dùng · {activeUsers} hoạt động</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/admin/hotels"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200 text-sm cursor-pointer backdrop-blur-sm border border-white/10">
                            {Icons.hotel}
                            <span>Hotels</span>
                        </Link>
                        <button onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-900 font-medium rounded-lg hover:bg-blue-50 transition-colors duration-200 text-sm cursor-pointer">
                            {Icons.plus}
                            <span>Thêm user</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ── KPI Cards ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Tổng user', value: totalUsers, color: 'text-slate-900' },
                    { label: 'Hoạt động', value: activeUsers, color: 'text-emerald-600' },
                    { label: 'Đã thanh toán', value: paidUsers, color: 'text-blue-600' },
                    { label: 'Chờ onboarding', value: pendingOnboarding, color: pendingOnboarding > 0 ? 'text-amber-600' : 'text-slate-400' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl border border-slate-200/60 px-4 py-3
                        shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]
                        transition-shadow duration-200">
                        <div className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Search ───────────────────────────────────────────── */}
            <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    {Icons.search}
                </div>
                <input
                    type="text"
                    placeholder="Tìm theo email hoặc tên..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl
                        text-sm text-slate-800 placeholder:text-slate-400
                        focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                        transition-all duration-200 shadow-sm"
                />
            </div>

            {/* ── Mobile: Card Layout ──────────────────────────────── */}
            <div className="block sm:hidden space-y-3">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                        <p className="text-sm text-slate-400 mt-3">Đang tải...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">Không tìm thấy người dùng</div>
                ) : (
                    users.map((user) => (
                        <div key={user.id}
                            className={`bg-white rounded-xl border border-slate-200/60 p-4
                                shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200
                                ${!user.isActive ? 'opacity-50' : 'hover:shadow-md'}`}>
                            {/* User info row */}
                            <div className="flex items-center gap-3 mb-3">
                                {user.image ? (
                                    <img src={user.image} alt="" className="w-10 h-10 rounded-full ring-2 ring-slate-100" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
                                        flex items-center justify-center text-white text-sm font-semibold">
                                        {user.email[0].toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-slate-900 text-sm truncate">{user.name || 'Chưa đặt tên'}</div>
                                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                                </div>
                                <span className={`shrink-0 w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                            </div>
                            {/* Meta */}
                            <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
                                {user.hotels.length > 0 ? (
                                    <>
                                        {user.hotels.slice(0, 1).map((h, i) => (
                                            <span key={i}>{getRoleBadge(h.role)}</span>
                                        ))}
                                        {user.hotels.map((h, i) => (
                                            <span key={`h-${i}`} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs">
                                                {h.hotelName}
                                                {h.isPrimary && Icons.star}
                                            </span>
                                        ))}
                                    </>
                                ) : (
                                    <span className="text-slate-400 italic">Chưa gán hotel</span>
                                )}
                            </div>
                            {/* Payment */}
                            {user.payment && (
                                <div className="mb-3 p-2 bg-slate-50 rounded-lg">
                                    {formatPayment(user.payment)}
                                </div>
                            )}
                            {/* Actions */}
                            <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
                                <button onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                                    {Icons.edit} Sửa
                                </button>
                                <button onClick={() => { setSelectedUser(user); setShowAssignModal(true); }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer">
                                    {Icons.link} Gán hotel
                                </button>
                                <button onClick={() => toggleUserActive(user)}
                                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${user.isActive ? 'text-slate-600 hover:text-orange-700 hover:bg-orange-50' : 'text-slate-600 hover:text-green-700 hover:bg-green-50'}`}>
                                    {user.isActive ? Icons.lock : Icons.unlock} {user.isActive ? 'Khóa' : 'Mở'}
                                </button>
                                <button onClick={() => deleteUser(user)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer ml-auto">
                                    {Icons.trash}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── Desktop: Table ───────────────────────────────────── */}
            <div className="hidden sm:block bg-white rounded-xl border border-slate-200/60 overflow-hidden
                shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/60">
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Người dùng</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Liên hệ</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Thanh toán</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hotels</th>
                            <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-12 text-center">
                                    <div className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                                    <p className="text-sm text-slate-400 mt-3">Đang tải...</p>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                                    Không tìm thấy người dùng
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id}
                                    className={`group transition-colors duration-150
                                        ${!user.isActive ? 'opacity-40' : 'hover:bg-blue-50/30'}`}>
                                    {/* User */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            {user.image ? (
                                                <img src={user.image} alt="" className="w-9 h-9 rounded-full ring-2 ring-slate-100" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
                                                    flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                                    {user.email[0].toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="font-medium text-slate-900 text-sm truncate">{user.name || 'Chưa đặt tên'}</div>
                                                <div className="text-xs text-slate-500 truncate">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Phone */}
                                    <td className="px-5 py-3.5">
                                        {user.phone ? (
                                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                                                {Icons.phone} {user.phone}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300 text-xs italic">—</span>
                                        )}
                                    </td>
                                    {/* Payment */}
                                    <td className="px-5 py-3.5">
                                        {formatPayment(user.payment)}
                                    </td>
                                    {/* Role */}
                                    <td className="px-5 py-3.5">
                                        {user.hotels.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {user.hotels.slice(0, 1).map((h, i) => (
                                                    <span key={i}>{getRoleBadge(h.role)}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 text-xs italic">—</span>
                                        )}
                                    </td>
                                    {/* Hotels */}
                                    <td className="px-5 py-3.5">
                                        {user.hotels.length === 0 ? (
                                            <span className="text-slate-300 text-xs italic">Chưa gán</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {user.hotels.slice(0, 2).map((h, i) => (
                                                    <span key={i} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs">
                                                        {h.hotelName}
                                                        {h.isPrimary && Icons.star}
                                                    </span>
                                                ))}
                                                {user.hotels.length > 2 && (
                                                    <span className="text-slate-400 text-xs">+{user.hotels.length - 2}</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    {/* Status */}
                                    <td className="px-5 py-3.5 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${user.isActive
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-red-50 text-red-600'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                                            {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                                        </span>
                                    </td>
                                    {/* Actions */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <button onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                                                title="Sửa"
                                                className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                                                {Icons.edit}
                                            </button>
                                            <button onClick={() => { setSelectedUser(user); setShowAssignModal(true); }}
                                                title="Gán hotel"
                                                className="p-2 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer">
                                                {Icons.link}
                                            </button>
                                            <button onClick={() => toggleUserActive(user)}
                                                title={user.isActive ? 'Khóa' : 'Mở khóa'}
                                                className={`p-2 rounded-lg transition-colors cursor-pointer ${user.isActive ? 'text-slate-400 hover:text-orange-600 hover:bg-orange-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}>
                                                {user.isActive ? Icons.lock : Icons.unlock}
                                            </button>
                                            <button onClick={() => deleteUser(user)}
                                                title="Xóa vĩnh viễn"
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                                                {Icons.trash}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Modals ───────────────────────────────────────────── */}
            {showCreateModal && (
                <CreateUserModal
                    hotels={hotels}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => { setShowCreateModal(false); fetchUsers(); }}
                />
            )}
            {showEditModal && selectedUser && (
                <EditUserModal
                    user={selectedUser}
                    onClose={() => { setShowEditModal(false); setSelectedUser(null); }}
                    onSaved={() => { setShowEditModal(false); setSelectedUser(null); fetchUsers(); }}
                />
            )}
            {showAssignModal && selectedUser && (
                <AssignHotelsModal
                    user={selectedUser}
                    hotels={hotels}
                    onClose={() => { setShowAssignModal(false); setSelectedUser(null); }}
                    onSaved={() => { setShowAssignModal(false); setSelectedUser(null); fetchUsers(); }}
                />
            )}
        </div>
    );
}

// ── Modal Base Component ────────────────────────────────────────

function ModalShell({ title, subtitle, onClose, children }: {
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                <div className="sticky top-0 bg-white px-6 pt-5 pb-3 border-b border-slate-100 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                        {Icons.close}
                    </button>
                </div>
                <div className="px-6 py-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

const inputCls = "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm";
const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";
const btnPrimary = "px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer";
const btnSecondary = "px-5 py-2.5 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-100 transition-colors cursor-pointer";

// ── Create User Modal ───────────────────────────────────────────

function CreateUserModal({ hotels, onClose, onCreated }: {
    hotels: Hotel[];
    onClose: () => void;
    onCreated: () => void;
}) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('viewer');
    const [hotelId, setHotelId] = useState('');
    const [hotelRole, setHotelRole] = useState('viewer');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const hotelAssignments = hotelId ? [{ hotelId, role: hotelRole, isPrimary: true }] : [];
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, phone: phone || null, role, hotelAssignments })
            });
            if (res.ok) onCreated();
            else {
                const data = await res.json();
                alert(data.error || 'Có lỗi xảy ra');
            }
        } catch { alert('Có lỗi xảy ra'); }
        finally { setSaving(false); }
    };

    return (
        <ModalShell title="Thêm người dùng" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={labelCls}>Email *</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} placeholder="user@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelCls}>Họ tên</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Nguyễn Văn A" />
                    </div>
                    <div>
                        <label className={labelCls}>Số điện thoại</label>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="0901234567" />
                    </div>
                </div>
                <div>
                    <label className={labelCls}>Global Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
                        <option value="viewer">Viewer (default)</option>
                        <option value="super_admin">Super Admin</option>
                    </select>
                    <p className="text-xs text-slate-400 mt-1">Quyền thật nằm ở Hotel Role bên dưới.</p>
                </div>
                <div className="border-t border-slate-100 pt-4">
                    <label className={labelCls}>Gán vào Hotel</label>
                    <select value={hotelId} onChange={(e) => setHotelId(e.target.value)} className={inputCls}>
                        <option value="">— Không gán —</option>
                        {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                </div>
                {hotelId && (
                    <div>
                        <label className={labelCls}>Hotel Role</label>
                        <select value={hotelRole} onChange={(e) => setHotelRole(e.target.value)} className={inputCls}>
                            <option value="viewer">Viewer</option>
                            <option value="manager">Manager</option>
                            <option value="hotel_admin">Hotel Admin</option>
                        </select>
                    </div>
                )}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button type="button" onClick={onClose} className={btnSecondary}>Hủy</button>
                    <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Đang tạo...' : 'Tạo người dùng'}</button>
                </div>
            </form>
        </ModalShell>
    );
}

// ── Assign Hotels Modal ─────────────────────────────────────────

function AssignHotelsModal({ user, hotels, onClose, onSaved }: {
    user: User;
    hotels: Hotel[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const [assignments, setAssignments] = useState<Array<{ hotelId: string; role: string; isPrimary: boolean }>>(
        user.hotels.map(h => ({ hotelId: h.hotelId, role: h.role, isPrimary: h.isPrimary }))
    );
    const [saving, setSaving] = useState(false);

    const addAssignment = () => {
        const available = hotels.filter(h => !assignments.some(a => a.hotelId === h.id));
        if (available.length > 0) {
            setAssignments([...assignments, { hotelId: available[0].id, role: 'viewer', isPrimary: assignments.length === 0 }]);
        }
    };

    const removeAssignment = (index: number) => setAssignments(assignments.filter((_, i) => i !== index));

    const updateAssignment = (index: number, field: string, value: string | boolean) => {
        const updated = [...assignments];
        updated[index] = { ...updated[index], [field]: value };
        if (field === 'isPrimary' && value === true) {
            updated.forEach((a, i) => { if (i !== index) a.isPrimary = false; });
        }
        setAssignments(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${user.id}/hotels`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignments })
            });
            if (res.ok) onSaved();
            else alert('Có lỗi xảy ra');
        } catch { console.error('Error saving assignments'); }
        finally { setSaving(false); }
    };

    return (
        <ModalShell title="Gán Hotels" subtitle={user.email} onClose={onClose}>
            <div className="space-y-2.5 mb-4">
                {assignments.map((a, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <select value={a.hotelId} onChange={(e) => updateAssignment(index, 'hotelId', e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm">
                            {hotels.map(h => (
                                <option key={h.id} value={h.id} disabled={assignments.some((x, i) => i !== index && x.hotelId === h.id)}>
                                    {h.name}
                                </option>
                            ))}
                        </select>
                        <select value={a.role} onChange={(e) => updateAssignment(index, 'role', e.target.value)}
                            className="w-28 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm">
                            <option value="viewer">Viewer</option>
                            <option value="manager">Manager</option>
                            <option value="hotel_admin">Admin</option>
                        </select>
                        <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
                            <input type="checkbox" checked={a.isPrimary}
                                onChange={(e) => updateAssignment(index, 'isPrimary', e.target.checked)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                            Primary
                        </label>
                        <button onClick={() => removeAssignment(index)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                            {Icons.close}
                        </button>
                    </div>
                ))}
                {assignments.length === 0 && (
                    <p className="text-slate-400 text-sm text-center py-6">Chưa có hotel nào được gán</p>
                )}
            </div>

            <button onClick={addAssignment} disabled={assignments.length >= hotels.length}
                className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500
                    hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition-colors cursor-pointer">
                + Thêm hotel
            </button>

            <div className="flex justify-end gap-2 pt-5 mt-4 border-t border-slate-100">
                <button onClick={onClose} className={btnSecondary}>Hủy</button>
                <button onClick={handleSave} disabled={saving} className={btnPrimary}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            </div>
        </ModalShell>
    );
}

// ── Edit User Modal ─────────────────────────────────────────────

function EditUserModal({ user, onClose, onSaved }: {
    user: User;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState(user.name || '');
    const [phone, setPhone] = useState(user.phone || '');
    const [role, setRole] = useState(user.role);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name || null, phone: phone || null, role })
            });
            if (res.ok) onSaved();
            else {
                const data = await res.json();
                alert(data.error || 'Có lỗi xảy ra');
            }
        } catch { alert('Có lỗi xảy ra'); }
        finally { setSaving(false); }
    };

    return (
        <ModalShell title="Chỉnh sửa" subtitle={user.email} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={labelCls}>Họ tên</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Nhập họ tên" />
                </div>
                <div>
                    <label className={labelCls}>Số điện thoại</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="0901234567" />
                </div>
                <div>
                    <label className={labelCls}>Global Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
                        <option value="viewer">Viewer (default)</option>
                        <option value="super_admin">Super Admin</option>
                    </select>
                    <p className="text-xs text-slate-400 mt-1">Quyền thật nằm ở Hotel Role (trong Gán hotel).</p>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button type="button" onClick={onClose} className={btnSecondary}>Hủy</button>
                    <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
                </div>
            </form>
        </ModalShell>
    );
}
