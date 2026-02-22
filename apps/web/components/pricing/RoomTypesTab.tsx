'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface RoomType {
    id: string;
    name: string;
    description: string | null;
    net_price: number;
}

// Format number with dots as thousands separator (VND style)
const formatInputVND = (value: string): string => {
    // Remove non-digit characters
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    return parseInt(digits, 10).toLocaleString('de-DE'); // de-DE uses dots as separator
};

// Parse formatted string back to number string
const parseInputVND = (formatted: string): string => {
    return formatted.replace(/\./g, '');
};

export default function RoomTypesTab() {
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<RoomType | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', net_price: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch room types
    const fetchRoomTypes = async () => {
        try {
            const res = await fetch('/api/pricing/room-types', { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setRoomTypes(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoomTypes();
    }, []);

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const url = editing
                ? `/api/pricing/room-types/${editing.id}`
                : '/api/pricing/room-types';

            const res = await fetch(url, {
                method: editing ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description || null,
                    net_price: parseFloat(parseInputVND(formData.net_price)),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save');
            }

            await fetchRoomTypes();
            setShowForm(false);
            setEditing(null);
            setFormData({ name: '', description: '', net_price: '' });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Handle delete
    const handleDelete = async (id: string) => {
        if (!confirm('Confirm delete this room type?')) return;

        try {
            const res = await fetch(`/api/pricing/room-types/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            await fetchRoomTypes();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // Open edit form
    const handleEdit = (rt: RoomType) => {
        setEditing(rt);
        setFormData({
            name: rt.name,
            description: rt.description || '',
            net_price: formatInputVND(rt.net_price.toString()),
        });
        setShowForm(true);
    };

    // Format VND
    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Room Type</h2>
                <button
                    onClick={() => {
                        setEditing(null);
                        setFormData({ name: '', description: '', net_price: '' });
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add room type
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                            {editing ? 'Edit Room Type' : 'Add Room Type'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Room Type Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Net Revenue (VND) *</label>
                                <input
                                    type="text"
                                    value={formData.net_price}
                                    onChange={(e) => setFormData({ ...formData, net_price: formatInputVND(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="1.000.000"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditing(null); }}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editing ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Table */}
            {roomTypes.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    No room types yet. Click &quot;Add Room Type&quot; to get started.
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-slate-600 font-medium">Room Type</th>
                                <th className="px-4 py-3 text-left text-slate-600 font-medium">Description</th>
                                <th className="px-4 py-3 text-right text-slate-600 font-medium">Net Revenue</th>
                                <th className="px-4 py-3 text-center text-slate-600 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roomTypes.map((rt) => (
                                <tr key={rt.id} className="border-t border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900">{rt.name}</td>
                                    <td className="px-4 py-3 text-slate-500">{rt.description || '—'}</td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-900">{formatVND(rt.net_price)} ₫</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleEdit(rt)}
                                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(rt.id)}
                                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
