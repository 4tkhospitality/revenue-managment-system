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
        <div className="mx-auto max-w-[1400px] px-8 py-6 space-y-6">
            {/* Header - consistent with other pages */}
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

            {/* Hotels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-3 text-center py-12 text-gray-400">Đang tải...</div>
                ) : hotels.length === 0 ? (
                    <div className="col-span-3 text-center py-12 text-gray-400">Chưa có hotel nào</div>
                ) : (
                    hotels.map((hotel) => (
                        <div
                            key={hotel.id}
                            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900">{hotel.name}</h3>
                                    <p className="text-sm text-gray-500">{hotel.timezone}</p>
                                </div>
                                <button
                                    onClick={() => setEditingHotel(hotel)}
                                    className="text-gray-400 hover:text-blue-600"
                                >
                                    ✏️
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mt-4">
                                <div className="text-center p-2 bg-gray-50 rounded">
                                    <div className="text-lg font-bold text-blue-600">{hotel.capacity}</div>
                                    <div className="text-xs text-gray-500">Phòng</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 rounded">
                                    <div className="text-lg font-bold text-emerald-600">{hotel.userCount}</div>
                                    <div className="text-xs text-gray-500">Users</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 rounded">
                                    <div className="text-lg font-bold text-amber-600">{hotel.currency}</div>
                                    <div className="text-xs text-gray-500">Tiền tệ</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
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
