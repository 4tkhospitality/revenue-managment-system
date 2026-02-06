'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface HotelAssignment {
    hotelId: string;
    hotelName: string;
    role: string;
    isPrimary: boolean;
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
}

interface Hotel {
    id: string;
    name: string;
}

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
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchUsers();
            } else {
                alert('Có lỗi xảy ra khi xóa');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const getRoleBadge = (role: string) => {
        const badges: Record<string, string> = {
            super_admin: 'bg-red-100 text-red-700',
            hotel_admin: 'bg-purple-100 text-purple-700',
            manager: 'bg-blue-100 text-blue-700',
            viewer: 'bg-gray-100 text-gray-600',
        };
        const labels: Record<string, string> = {
            super_admin: 'Super Admin',
            hotel_admin: 'Hotel Admin',
            manager: 'Manager',
            viewer: 'Viewer',
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${badges[role] || badges.viewer}`}>
                {labels[role] || role}
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
        <div className="mx-auto max-w-[1400px] px-8 py-6 space-y-6">
            {/* Header - consistent with other pages */}
            <header
                className="rounded-2xl px-6 py-4 text-white flex items-center justify-between shadow-sm"
                style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
            >
                <div>
                    <h1 className="text-lg font-semibold">👥 Quản lý người dùng</h1>
                    <p className="text-white/70 text-sm mt-1">
                        Quản lý tài khoản và phân quyền
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/hotels"
                        className="px-4 py-2 bg-white/15 text-white rounded-lg hover:bg-white/25 transition-colors backdrop-blur-sm text-sm"
                    >
                        🏨 Quản lý Hotels
                    </Link>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-white text-blue-900 font-medium rounded-lg hover:bg-blue-50 transition-colors text-sm"
                    >
                        + Thêm người dùng
                    </button>
                </div>
            </header>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Tìm theo email hoặc tên..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Người dùng</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Số điện thoại</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Global Role</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Hotels</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Trạng thái</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                    Đang tải...
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                    Không tìm thấy người dùng
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {user.image ? (
                                                <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                                                    {user.email[0].toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-900">{user.name || 'Chưa đặt tên'}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.phone ? (
                                            <span className="text-gray-700">{user.phone}</span>
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">Chưa có</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {getRoleBadge(user.role)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.hotels.length === 0 ? (
                                            <span className="text-gray-400 text-sm">Chưa gán hotel</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {user.hotels.slice(0, 2).map((h, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs">
                                                        {h.hotelName}
                                                        {h.isPrimary && ' ★'}
                                                    </span>
                                                ))}
                                                {user.hotels.length > 2 && (
                                                    <span className="text-gray-400 text-xs">+{user.hotels.length - 2}</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                                            className="text-emerald-600 hover:text-emerald-800 text-sm mr-3"
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => { setSelectedUser(user); setShowAssignModal(true); }}
                                            className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                                        >
                                            Gán hotel
                                        </button>
                                        <button
                                            onClick={() => toggleUserActive(user)}
                                            className={`text-sm mr-3 ${user.isActive ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                                        >
                                            {user.isActive ? 'Khóa' : 'Mở khóa'}
                                        </button>
                                        <button
                                            onClick={() => deleteUser(user)}
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

            {/* Create User Modal */}
            {showCreateModal && (
                <CreateUserModal
                    hotels={hotels}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => { setShowCreateModal(false); fetchUsers(); }}
                />
            )}

            {/* Assign Hotels Modal */}
            {/* Edit User Modal */}
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

// Create User Modal Component
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

            if (res.ok) {
                onCreated();
            } else {
                const data = await res.json();
                alert(data.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Thêm người dùng mới</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="VD: 0901234567"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Global Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="viewer">Viewer (default)</option>
                            <option value="super_admin">Super Admin</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Global role chỉ cho super_admin. Quyền thật nằm ở Hotel Role.</p>
                    </div>
                    <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gán vào Hotel</label>
                        <select
                            value={hotelId}
                            onChange={(e) => setHotelId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Không gán --</option>
                            {hotels.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                    </div>
                    {hotelId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Role</label>
                            <select
                                value={hotelRole}
                                onChange={(e) => setHotelRole(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="viewer">Viewer</option>
                                <option value="manager">Manager</option>
                                <option value="hotel_admin">Hotel Admin</option>
                            </select>
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            Hủy
                        </button>
                        <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {saving ? 'Đang tạo...' : 'Tạo người dùng'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Assign Hotels Modal Component
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
        const availableHotels = hotels.filter(h => !assignments.some(a => a.hotelId === h.id));
        if (availableHotels.length > 0) {
            setAssignments([...assignments, { hotelId: availableHotels[0].id, role: 'viewer', isPrimary: assignments.length === 0 }]);
        }
    };

    const removeAssignment = (index: number) => {
        setAssignments(assignments.filter((_, i) => i !== index));
    };

    const updateAssignment = (index: number, field: string, value: string | boolean) => {
        const updated = [...assignments];
        updated[index] = { ...updated[index], [field]: value };
        if (field === 'isPrimary' && value === true) {
            // Only one can be primary
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

            if (res.ok) {
                onSaved();
            } else {
                alert('Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error saving assignments:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold mb-1">Gán Hotels</h2>
                <p className="text-gray-500 text-sm mb-4">{user.email}</p>

                <div className="space-y-3 mb-4">
                    {assignments.map((a, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <select
                                value={a.hotelId}
                                onChange={(e) => updateAssignment(index, 'hotelId', e.target.value)}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                                {hotels.map(h => (
                                    <option key={h.id} value={h.id} disabled={assignments.some((x, i) => i !== index && x.hotelId === h.id)}>
                                        {h.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={a.role}
                                onChange={(e) => updateAssignment(index, 'role', e.target.value)}
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                                <option value="viewer">Viewer</option>
                                <option value="manager">Manager</option>
                                <option value="hotel_admin">Admin</option>
                            </select>
                            <label className="flex items-center gap-1 text-xs text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={a.isPrimary}
                                    onChange={(e) => updateAssignment(index, 'isPrimary', e.target.checked)}
                                />
                                Primary
                            </label>
                            <button
                                onClick={() => removeAssignment(index)}
                                className="text-red-500 hover:text-red-700 text-lg"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    {assignments.length === 0 && (
                        <p className="text-gray-400 text-center py-4">Chưa có hotel nào được gán</p>
                    )}
                </div>

                <button
                    onClick={addAssignment}
                    disabled={assignments.length >= hotels.length}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50"
                >
                    + Thêm hotel
                </button>

                <div className="flex justify-end gap-3 pt-6">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        Hủy
                    </button>
                    <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Edit User Modal Component
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
                body: JSON.stringify({ 
                    name: name || null, 
                    phone: phone || null,
                    role 
                })
            });

            if (res.ok) {
                onSaved();
            } else {
                const data = await res.json();
                alert(data.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-1">Chỉnh sửa người dùng</h2>
                <p className="text-gray-500 text-sm mb-4">{user.email}</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nhập họ tên đầy đủ"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="VD: 0901234567"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Global Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="viewer">Viewer (default)</option>
                            <option value="super_admin">Super Admin</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Global role chỉ cho super_admin. Quyền thật nằm ở Hotel Role (trong Gán hotel).</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            Hủy
                        </button>
                        <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
