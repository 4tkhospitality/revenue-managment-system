'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { TIER_CONFIGS } from '@/lib/tier/tierConfig';
import { COUNTRIES, getCountryDisplay } from '@/lib/constants/countries';
import { useTranslations } from 'next-intl';

interface Hotel {
    id: string;
    name: string;
    timezone: string;
    capacity: number;
    currency: string;
    country: string;
    userCount: number;
    pendingInvites: number;
    createdAt: string;
    // Subscription data
    plan: string | null;
    subscriptionStatus: string | null;
    periodEnd: string | null;
    maxUsers: number | null;
}

type StatusFilter = 'ALL' | 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED' | 'NO_SUB';
type SpecialFilter = 'OVER_LIMIT' | 'TRIAL_ENDING' | null;

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
    ACTIVE: { label: 'Active', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    TRIAL: { label: 'Trial', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
    PAST_DUE: { label: 'Past Due', dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
    CANCELLED: { label: 'Cancelled', dot: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-600' },
};

const PLAN_ORDER = ['STANDARD', 'SUPERIOR', 'DELUXE', 'SUITE'];

function getEffectiveMaxUsers(hotel: Hotel): number {
    if (hotel.maxUsers) return hotel.maxUsers;
    if (hotel.plan && hotel.plan in TIER_CONFIGS) {
        return TIER_CONFIGS[hotel.plan as keyof typeof TIER_CONFIGS].maxUsers;
    }
    return 0;
}

function getCurrentSeats(hotel: Hotel): number {
    return hotel.userCount + hotel.pendingInvites;
}

function isOverLimit(hotel: Hotel): boolean {
    const max = getEffectiveMaxUsers(hotel);
    return max > 0 && getCurrentSeats(hotel) > max;
}

function isTrialEnding(hotel: Hotel): boolean {
    if (hotel.subscriptionStatus !== 'TRIAL' || !hotel.periodEnd) return false;
    const daysLeft = Math.ceil((new Date(hotel.periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7 && daysLeft >= 0;
}

function hasActiveSub(hotel: Hotel): boolean {
    return !!hotel.subscriptionStatus && ['ACTIVE', 'TRIAL', 'PAST_DUE'].includes(hotel.subscriptionStatus);
}

export default function AdminHotelsPage() {
    const t = useTranslations('admin');
    const { data: session } = useSession();
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [planFilter, setPlanFilter] = useState<string>('ALL');
    const [specialFilter, setSpecialFilter] = useState<SpecialFilter>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);

    useEffect(() => {
        fetchHotels();
    }, []);

    const fetchHotels = async () => {
        try {
            const res = await fetch('/api/admin/hotels');
            const data = await res.json();
            setHotels(data.hotels || []);
        } catch (error) {
            console.error('Error fetching hotels:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteHotel = async (hotel: Hotel) => {
        if (hasActiveSub(hotel)) {
            alert(t('errorOccurred'));
            return;
        }
        if (!confirm(t('confirmDeleteHotel', { name: hotel.name }))) return;

        try {
            const res = await fetch(`/api/admin/hotels/${hotel.id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchHotels();
            } else {
                const data = await res.json();
                alert(data.error || t('errorDeleting'));
            }
        } catch (error) {
            console.error('Error deleting hotel:', error);
        }
    };

    const filteredHotels = useMemo(() => {
        return hotels.filter(hotel => {
            // Text search
            if (search) {
                const q = search.toLowerCase();
                if (!hotel.name.toLowerCase().includes(q) && !hotel.timezone.toLowerCase().includes(q)) {
                    return false;
                }
            }
            // Status filter
            if (statusFilter === 'NO_SUB') {
                if (hotel.subscriptionStatus) return false;
            } else if (statusFilter !== 'ALL') {
                if (hotel.subscriptionStatus !== statusFilter) return false;
            }
            // Plan filter
            if (planFilter !== 'ALL') {
                if (hotel.plan !== planFilter) return false;
            }
            // Special filters
            if (specialFilter === 'OVER_LIMIT' && !isOverLimit(hotel)) return false;
            if (specialFilter === 'TRIAL_ENDING' && !isTrialEnding(hotel)) return false;
            return true;
        });
    }, [hotels, search, statusFilter, planFilter, specialFilter]);

    // Stats
    const stats = useMemo(() => {
        const byStatus: Record<string, number> = { ACTIVE: 0, TRIAL: 0, PAST_DUE: 0, CANCELLED: 0, NO_SUB: 0 };
        let overLimit = 0;
        let trialEnding = 0;
        hotels.forEach(h => {
            if (h.subscriptionStatus) byStatus[h.subscriptionStatus] = (byStatus[h.subscriptionStatus] || 0) + 1;
            else byStatus.NO_SUB++;
            if (isOverLimit(h)) overLimit++;
            if (isTrialEnding(h)) trialEnding++;
        });
        return { byStatus, overLimit, trialEnding };
    }, [hotels]);

    const getCurrencyBadge = (currency: string) => {
        const badges: Record<string, string> = {
            VND: 'bg-amber-100 text-amber-700',
            USD: 'bg-green-100 text-green-700',
            THB: 'bg-purple-100 text-purple-700',
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${badges[currency] || 'bg-gray-100 text-gray-600'}`}>
                {currency}
            </span>
        );
    };

    if (!session?.user?.isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">{t('noAccess')}</h1>
                    <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 block">
                        {t('backToDashboard')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 space-y-6">
            {/* Header */}
            <header
                className="rounded-2xl px-6 py-4 text-white flex items-center justify-between shadow-sm"
                style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
            >
                <div>
                    <h1 className="text-lg font-semibold">{t('hotelsTitle')}</h1>
                    <p className="text-white/70 text-sm mt-1">
                        {t('hotelsCount', { total: hotels.length, active: hotels.filter(h => h.subscriptionStatus === 'ACTIVE').length })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/users"
                        className="px-4 py-2 bg-white/15 text-white rounded-lg hover:bg-white/25 transition-colors backdrop-blur-sm text-sm"
                    >
                        👥 User Management
                    </Link>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-white text-blue-900 font-medium rounded-lg hover:bg-blue-50 transition-colors text-sm"
                    >
                        + Add Hotel
                    </button>
                </div>
            </header>

            {/* Search + Filters */}
            <div className="space-y-3">
                <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                {/* Status Filter Chips */}
                <div className="flex flex-wrap gap-2">
                    {/* Status chips */}
                    {([
                        { key: 'ALL' as StatusFilter, label: 'All', count: hotels.length },
                        { key: 'ACTIVE' as StatusFilter, label: 'Active', count: stats.byStatus.ACTIVE },
                        { key: 'TRIAL' as StatusFilter, label: 'Trial', count: stats.byStatus.TRIAL },
                        { key: 'PAST_DUE' as StatusFilter, label: 'Past Due', count: stats.byStatus.PAST_DUE },
                        { key: 'CANCELLED' as StatusFilter, label: t('cancelled'), count: stats.byStatus.CANCELLED },
                        { key: 'NO_SUB' as StatusFilter, label: 'No plan', count: stats.byStatus.NO_SUB },
                    ]).map(f => (
                        <button
                            key={f.key}
                            onClick={() => { setStatusFilter(f.key); setSpecialFilter(null); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === f.key && !specialFilter
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {f.label} {f.count > 0 && <span className="ml-1 opacity-70">({f.count})</span>}
                        </button>
                    ))}

                    <span className="border-l border-gray-300 mx-1" />

                    {/* Plan filter */}
                    <select
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border-0 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">All plans</option>
                        {PLAN_ORDER.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>

                    <span className="border-l border-gray-300 mx-1" />

                    {/* Special filters */}
                    {stats.overLimit > 0 && (
                        <button
                            onClick={() => { setSpecialFilter(specialFilter === 'OVER_LIMIT' ? null : 'OVER_LIMIT'); setStatusFilter('ALL'); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${specialFilter === 'OVER_LIMIT'
                                ? 'bg-red-600 text-white'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                                }`}
                        >
                            {t('overSeatLimit')} ({stats.overLimit})
                        </button>
                    )}
                    {stats.trialEnding > 0 && (
                        <button
                            onClick={() => { setSpecialFilter(specialFilter === 'TRIAL_ENDING' ? null : 'TRIAL_ENDING'); setStatusFilter('ALL'); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${specialFilter === 'TRIAL_ENDING'
                                ? 'bg-amber-600 text-white'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                }`}
                        >
                            {t('trialEndingSoon')} ({stats.trialEnding})
                        </button>
                    )}
                </div>
            </div>

            {/* Hotels Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Hotel</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Plan & Billing</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Rooms</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Users</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">{t('currency')}</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">{t('country')}</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">{t('actionsCol')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredHotels.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                    {search || statusFilter !== 'ALL' || planFilter !== 'ALL' || specialFilter
                                        ? t('noHotels')
                                        : t('noHotels')}
                                </td>
                            </tr>
                        ) : (
                            filteredHotels.map((hotel) => {
                                const maxUsers = getEffectiveMaxUsers(hotel);
                                const currentSeats = getCurrentSeats(hotel);
                                const over = maxUsers > 0 && currentSeats > maxUsers;
                                const statusCfg = hotel.subscriptionStatus ? STATUS_CONFIG[hotel.subscriptionStatus] : null;
                                const canDelete = !hasActiveSub(hotel);

                                return (
                                    <tr key={hotel.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        {/* Hotel name */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                                                    {hotel.name[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{hotel.name}</div>
                                                    <div className="text-xs text-gray-400">{hotel.timezone}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Subscription & Billing */}
                                        <td className="px-4 py-3">
                                            {hotel.plan ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-700">
                                                            {hotel.plan}
                                                        </span>
                                                        {statusCfg && (
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                                                {statusCfg.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {hotel.periodEnd && (
                                                        <div className="text-xs text-gray-400">
                                                            → {new Date(hotel.periodEnd).toLocaleDateString('vi-VN')}
                                                        </div>
                                                    )}
                                                    {isTrialEnding(hotel) && (
                                                        <div className="text-xs text-amber-600 font-medium">
                                                            ⏰ Trial expiring
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No plan</span>
                                            )}
                                        </td>

                                        {/* Rooms (no limit enforced yet) */}
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                                                {hotel.capacity}
                                            </span>
                                        </td>

                                        {/* Users with limit */}
                                        <td className="px-4 py-3 text-center">
                                            {maxUsers > 0 ? (
                                                <div className="inline-flex flex-col items-center">
                                                    <span className={`px-2 py-1 rounded-lg text-sm font-medium ${over
                                                        ? 'bg-red-50 text-red-700'
                                                        : 'bg-emerald-50 text-emerald-700'
                                                        }`}>
                                                        {currentSeats}/{maxUsers >= 999 ? '∞' : maxUsers}
                                                    </span>
                                                    {over && (
                                                        <span className="text-xs text-red-600 font-medium mt-0.5">
                                                            ⚠️ Over
                                                        </span>
                                                    )}
                                                    {hotel.pendingInvites > 0 && (
                                                        <span className="text-xs text-gray-400 mt-0.5">
                                                            ({hotel.pendingInvites} pending)
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className={`px-2 py-1 rounded-lg text-sm font-medium ${hotel.userCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {hotel.userCount}
                                                </span>
                                            )}
                                        </td>

                                        {/* Currency */}
                                        <td className="px-4 py-3 text-center">
                                            {getCurrencyBadge(hotel.currency)}
                                        </td>

                                        {/* Country */}
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-sm" title={hotel.country}>
                                                {getCountryDisplay(hotel.country)}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => setEditingHotel(hotel)}
                                                className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteHotel(hotel)}
                                                disabled={!canDelete}
                                                className={`text-sm ${canDelete
                                                    ? 'text-red-600 hover:text-red-800'
                                                    : 'text-gray-300 cursor-not-allowed'
                                                    }`}
                                                title={!canDelete ? 'Cancel plan first' : t('deleteHotel')}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{hotels.length}</div>
                    <div className="text-sm text-gray-500">{t('totalHotels')}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-600">
                        {stats.byStatus.ACTIVE + stats.byStatus.TRIAL}
                    </div>
                    <div className="text-sm text-gray-500">Active / Trial</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600">
                        {hotels.reduce((sum, h) => sum + h.userCount, 0)}
                    </div>
                    <div className="text-sm text-gray-500">{t('users')}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <div className={`text-2xl font-bold ${stats.overLimit > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {stats.overLimit}
                    </div>
                    <div className="text-sm text-gray-500">{t('overLimit')}</div>
                </div>
            </div>

            {/* Create Hotel Modal */}
            {showCreateModal && (
                <HotelModal
                    onClose={() => setShowCreateModal(false)}
                    onSaved={() => { setShowCreateModal(false); fetchHotels(); }}
                />
            )}

            {/* Edit Hotel Modal */}
            {editingHotel && (
                <HotelModal
                    hotel={editingHotel}
                    onClose={() => setEditingHotel(null)}
                    onSaved={() => { setEditingHotel(null); fetchHotels(); }}
                />
            )}
        </div>
    );
}

function HotelModal({ hotel, onClose, onSaved }: {
    hotel?: Hotel;
    onClose: () => void;
    onSaved: () => void;
}) {
    const t = useTranslations('admin');
    const [name, setName] = useState(hotel?.name || '');
    const [timezone, setTimezone] = useState(hotel?.timezone || 'Asia/Ho_Chi_Minh');
    const [capacity, setCapacity] = useState(hotel?.capacity?.toString() || '100');
    const [currency, setCurrency] = useState(hotel?.currency || 'VND');
    const [country, setCountry] = useState(hotel?.country || 'VN');
    const [saving, setSaving] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Subscription fields
    const [subPlan, setSubPlan] = useState(hotel?.plan || '');
    const [subStatus, setSubStatus] = useState(hotel?.subscriptionStatus || '');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [maxUsers, setMaxUsers] = useState('1');

    // Base rate
    const [defaultBaseRate, setDefaultBaseRate] = useState('');

    // Fetch full hotel details when editing
    useEffect(() => {
        if (!hotel) return;
        setLoadingDetails(true);
        fetch(`/api/admin/hotels/${hotel.id}`)
            .then(res => res.json())
            .then(data => {
                const h = data.hotel;
                if (h.defaultBaseRate) setDefaultBaseRate(String(Number(h.defaultBaseRate)));
                if (h.subscription) {
                    setSubPlan(h.subscription.plan || '');
                    setSubStatus(h.subscription.status || '');
                    setMaxUsers(String(h.subscription.maxUsers ?? 1));
                    if (h.subscription.periodStart) {
                        setPeriodStart(new Date(h.subscription.periodStart).toISOString().slice(0, 10));
                    }
                    if (h.subscription.periodEnd) {
                        setPeriodEnd(new Date(h.subscription.periodEnd).toISOString().slice(0, 10));
                    }
                }
            })
            .catch(console.error)
            .finally(() => setLoadingDetails(false));
    }, [hotel]);

    const formatBaseRate = (val: string) => {
        const num = parseInt(val.replace(/\D/g, ''), 10);
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = hotel ? `/api/admin/hotels/${hotel.id}` : '/api/admin/hotels';
            const method = hotel ? 'PUT' : 'POST';

            const payload: Record<string, unknown> = {
                name,
                timezone,
                capacity: parseInt(capacity),
                currency,
                country,
            };

            // Include base rate if provided
            const rawRate = defaultBaseRate.replace(/\D/g, '');
            if (rawRate) {
                payload.defaultBaseRate = parseInt(rawRate, 10);
            }

            // Include subscription if editing and plan is selected
            if (hotel && subPlan) {
                payload.subscription = {
                    plan: subPlan,
                    status: subStatus || 'ACTIVE',
                    periodStart: periodStart || null,
                    periodEnd: periodEnd || null,
                    maxUsers: parseInt(maxUsers) || 1,
                };
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                onSaved();
            } else {
                const data = await res.json();
                alert(data.error || t('errorOccurred'));
            }
        } catch (error) {
            console.error('Error saving hotel:', error);
            alert(t('errorOccurred'));
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white px-6 pt-6 pb-3 border-b border-gray-100 rounded-t-xl">
                    <h2 className="text-xl font-bold">
                        {hotel ? t('editHotelTitle') : t('addHotelTitle')}
                    </h2>
                </div>

                {loadingDetails ? (
                    <div className="p-6 text-center text-gray-400">{t('loading')}</div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* === Hotel Info === */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Basic Info</h3>
                            <div>
                                <label className={labelClass}>{t('hotelName')} *</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Timezone</label>
                                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass}>
                                    <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (UTC+7)</option>
                                    <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                                    <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>{t('capacity')}</label>
                                    <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} min="1" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>{t('currency')}</label>
                                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                                        <option value="VND">VND</option>
                                        <option value="USD">USD</option>
                                        <option value="THB">THB</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>{t('country')}</label>
                                <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass}>
                                    {COUNTRIES.map(c => (
                                        <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* === Base Rate === */}
                        <div className="space-y-3 border-t border-gray-100 pt-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Base Rate</h3>
                            <div>
                                <label className={labelClass}>{t('baseRate')} ({currency})</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatBaseRate(defaultBaseRate)}
                                    onChange={(e) => setDefaultBaseRate(e.target.value.replace(/\D/g, ''))}
                                    placeholder="VD: 1.500.000"
                                    className={inputClass}
                                />
                                <p className="text-xs text-gray-400 mt-1">Used in Daily Actions for price recommendations</p>
                            </div>
                        </div>

                        {/* === Subscription (only when editing) === */}
                        {hotel && (
                            <div className="space-y-3 border-t border-gray-100 pt-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Subscription</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>{t('plan')}</label>
                                        <select value={subPlan} onChange={(e) => setSubPlan(e.target.value)} className={inputClass}>
                                            <option value="">— No plan —</option>
                                            <option value="STANDARD">STANDARD</option>
                                            <option value="SUPERIOR">SUPERIOR</option>
                                            <option value="DELUXE">DELUXE</option>
                                            <option value="SUITE">SUITE</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>{t('statusCol')}</label>
                                        <select value={subStatus} onChange={(e) => setSubStatus(e.target.value)} className={inputClass}>
                                            <option value="ACTIVE">Active</option>
                                            <option value="TRIAL">Trial</option>
                                            <option value="PAST_DUE">Past Due</option>
                                            <option value="CANCELLED">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>From</label>
                                        <input
                                            type="date"
                                            value={periodStart}
                                            onChange={(e) => setPeriodStart(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>To</label>
                                        <input
                                            type="date"
                                            value={periodEnd}
                                            onChange={(e) => setPeriodEnd(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>{t('maxUsers')}</label>
                                    <input
                                        type="number"
                                        value={maxUsers}
                                        onChange={(e) => setMaxUsers(e.target.value)}
                                        min="1"
                                        className={inputClass}
                                    />
                                </div>
                                {!subPlan && (
                                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                                        ⚠️ Select a plan to activate subscription for this hotel
                                    </p>
                                )}
                            </div>
                        )}

                        {/* === Actions === */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                {saving ? t('saving') : (hotel ? t('save') : t('createHotel'))}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
