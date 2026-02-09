'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Hotel {
    id: string;
    name: string;
    timezone: string;
    capacity: number;
    currency: string;
    userCount: number;
    createdAt: string;
}

export default function AdminHotelsPage() {
    const { data: session } = useSession();
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
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
        if (!confirm(`⚠️ XÓA VĨNH VIỄN hotel "${hotel.name}"?\n\nHành động này không thể hoàn tác!`)) return;

        try {
            const res = await fetch(`/api/admin/hotels/${hotel.id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchHotels();
            } else {
                const data = await res.json();
                alert(data.error || 'Có lỗi xảy ra khi xóa');
            }
        } catch (error) {
            console.error('Error deleting hotel:', error);
        }
    };

    const filteredHotels = hotels.filter(hotel =>
        hotel.name.toLowerCase().includes(search.toLowerCase()) ||
        hotel.timezone.toLowerCase().includes(search.toLowerCase())
    );

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
                    <h1 className="text-2xl font-bold text-gray-900">Không có quyền truy cập</h1>
                    <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 block">
                        Quay lại Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 space-y-6">
            {/* Header - consistent with Users page */}
            <header
                className="rounded-2xl px-6 py-4 text-white flex items-center justify-between shadow-sm"
                style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
            >
                <div>
                    <h1 className="text-lg font-semibold">🏨 Quản lý Hotels</h1>
                    <p className="text-white/70 text-sm mt-1">
                        Danh sách khách sạn trong hệ thống
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/users"
                        className="px-4 py-2 bg-white/15 text-white rounded-lg hover:bg-white/25 transition-colors backdrop-blur-sm text-sm"
                    >
                        👥 Quản lý Users
                    </Link>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-white text-blue-900 font-medium rounded-lg hover:bg-blue-50 transition-colors text-sm"
                    >
                        + Thêm Hotel
                    </button>
                </div>
            </header>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Tìm theo tên hotel hoặc timezone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Hotels Table - matching Users page style */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Hotel</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Timezone</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Số phòng</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Users</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Tiền tệ</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ngày tạo</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                    Đang tải...
                                </td>
                            </tr>
                        ) : filteredHotels.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                    {search ? 'Không tìm thấy hotel phù hợp' : 'Chưa có hotel nào'}
                                </td>
                            </tr>
                        ) : (
                            filteredHotels.map((hotel) => (
                                <tr key={hotel.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                {hotel.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{hotel.name}</div>
                                                <div className="text-xs text-gray-400">ID: {hotel.id.slice(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-gray-700 text-sm">{hotel.timezone}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                                            {hotel.capacity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-sm font-medium ${hotel.userCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {hotel.userCount}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {getCurrencyBadge(hotel.currency)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-gray-500 text-sm">
                                            {new Date(hotel.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => setEditingHotel(hotel)}
                                            className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => deleteHotel(hotel)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{hotels.length}</div>
                    <div className="text-sm text-gray-500">Tổng Hotels</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-600">
                        {hotels.reduce((sum, h) => sum + h.capacity, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Tổng số phòng</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600">
                        {hotels.reduce((sum, h) => sum + h.userCount, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Tổng Users được gán</div>
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
    const [name, setName] = useState(hotel?.name || '');
    const [timezone, setTimezone] = useState(hotel?.timezone || 'Asia/Ho_Chi_Minh');
    const [capacity, setCapacity] = useState(hotel?.capacity?.toString() || '100');
    const [currency, setCurrency] = useState(hotel?.currency || 'VND');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = hotel ? `/api/admin/hotels/${hotel.id}` : '/api/admin/hotels';
            const method = hotel ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    timezone,
                    capacity: parseInt(capacity),
                    currency,
                })
            });

            if (res.ok) {
                onSaved();
            } else {
                const data = await res.json();
                alert(data.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error saving hotel:', error);
            alert('Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">
                    {hotel ? 'Chỉnh sửa Hotel' : 'Thêm Hotel mới'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên Hotel *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (UTC+7)</option>
                            <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                            <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Số phòng</label>
                            <input
                                type="number"
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value)}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tiền tệ</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="VND">VND</option>
                                <option value="USD">USD</option>
                                <option value="THB">THB</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            Hủy
                        </button>
                        <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {saving ? 'Đang lưu...' : (hotel ? 'Lưu' : 'Tạo Hotel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
