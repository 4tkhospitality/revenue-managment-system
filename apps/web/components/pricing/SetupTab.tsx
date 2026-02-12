'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, BedDouble, Globe } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────

interface RoomType {
    id: string;
    name: string;
    description: string | null;
    net_price: number;
}

type CalcTypeValue = 'PROGRESSIVE' | 'ADDITIVE';

interface OTAChannel {
    id: string;
    name: string;
    code: string;
    calc_type: CalcTypeValue;
    commission: number;
    is_active: boolean;
}

// ─── VND Formatting Helpers ──────────────────────────────────

const formatInputVND = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    return parseInt(digits, 10).toLocaleString('de-DE');
};

const parseInputVND = (formatted: string): string => {
    return formatted.replace(/\./g, '');
};

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

// ─── Sub-section: "Hạng phòng" ──────────────────────────────

function RoomTypesSection() {
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<RoomType | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', net_price: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRoomTypes = async () => {
        try {
            const res = await fetch('/api/pricing/room-types', { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setRoomTypes(data);
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRoomTypes(); }, []);

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
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xác nhận xóa hạng phòng này?')) return;
        try {
            const res = await fetch(`/api/pricing/room-types/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            await fetchRoomTypes();
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message);
        }
    };

    const handleEdit = (rt: RoomType) => {
        setEditing(rt);
        setFormData({
            name: rt.name,
            description: rt.description || '',
            net_price: formatInputVND(rt.net_price.toString()),
        });
        setShowForm(true);
    };

    return (
        <div className="space-y-3">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BedDouble className="w-5 h-5 text-[#204183]" />
                    <h3 className="text-base font-bold text-slate-800">Hạng phòng</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EFF1F8] text-[#204183]">{roomTypes.length}</span>
                </div>
                <button
                    onClick={() => {
                        setEditing(null);
                        setFormData({ name: '', description: '', net_price: '' });
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#204183] hover:bg-[#1a3469] text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Thêm
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-[#204183]" />
                </div>
            ) : roomTypes.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                    Chưa có hạng phòng nào. Nhấn &quot;Thêm&quot; để bắt đầu.
                </div>
            ) : (
                <div className="bg-white border border-[#DBE1EB] rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#F2F4F8]">
                                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hạng phòng</th>
                                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mô tả</th>
                                <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Giá thu về</th>
                                <th className="text-center px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roomTypes.map((rt) => (
                                <tr key={rt.id} className="border-t border-[#F2F4F8] hover:bg-[#FAFBFD] transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-800">{rt.name}</td>
                                    <td className="px-4 py-3 text-slate-500">{rt.description || '—'}</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-[#204183]">{formatVND(rt.net_price)} ₫</td>
                                    <td className="px-3 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleEdit(rt)}
                                                className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(rt.id)}
                                                className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                            {editing ? 'Sửa hạng phòng' : 'Thêm hạng phòng'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên hạng phòng *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Giá thu về (VND) *</label>
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
                                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Hủy</button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 px-4 py-2 bg-[#204183] hover:bg-[#1a3469] text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editing ? 'Cập nhật' : 'Thêm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Sub-section: "Kênh OTA" ─────────────────────────────────

function OTAChannelsSection() {
    const [channels, setChannels] = useState<OTAChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<OTAChannel | null>(null);
    const [formData, setFormData] = useState({
        name: '', code: '', commission: '', calc_type: 'PROGRESSIVE' as CalcTypeValue, is_active: true,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const channelDotColors: Record<string, string> = {
        agoda: 'bg-orange-500',
        booking: 'bg-[#003580]',
        expedia: 'bg-yellow-400',
        traveloka: 'bg-green-500',
        ctrip: 'bg-red-500',
    };

    const fetchChannels = async () => {
        try {
            const res = await fetch('/api/pricing/ota-channels', { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setChannels(data);
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchChannels(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const url = editing
                ? `/api/pricing/ota-channels/${editing.id}`
                : '/api/pricing/ota-channels';
            const res = await fetch(url, {
                method: editing ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    code: formData.code,
                    commission: parseFloat(formData.commission),
                    calc_type: formData.calc_type,
                    is_active: formData.is_active,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save');
            }
            await fetchChannels();
            setShowForm(false);
            setEditing(null);
            setFormData({ name: '', code: '', commission: '', calc_type: 'PROGRESSIVE', is_active: true });
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (ch: OTAChannel) => {
        try {
            const res = await fetch(`/api/pricing/ota-channels/${ch.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !ch.is_active }),
            });
            if (!res.ok) throw new Error('Failed to update');
            await fetchChannels();
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xác nhận xóa kênh OTA này?')) return;
        try {
            const res = await fetch(`/api/pricing/ota-channels/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            await fetchChannels();
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message);
        }
    };

    const handleEdit = (ch: OTAChannel) => {
        setEditing(ch);
        setFormData({
            name: ch.name, code: ch.code, commission: ch.commission.toString(),
            calc_type: ch.calc_type, is_active: ch.is_active,
        });
        setShowForm(true);
    };

    return (
        <div className="space-y-3">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#204183]" />
                    <h3 className="text-base font-bold text-slate-800">Kênh OTA</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EFF1F8] text-[#204183]">{channels.length}</span>
                </div>
                <button
                    onClick={() => {
                        setEditing(null);
                        setFormData({ name: '', code: '', commission: '', calc_type: 'PROGRESSIVE', is_active: true });
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#204183] hover:bg-[#1a3469] text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Thêm
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-[#204183]" />
                </div>
            ) : channels.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                    Chưa có kênh OTA nào. Nhấn &quot;Thêm&quot; để bắt đầu.
                </div>
            ) : (
                <div className="bg-white border border-[#DBE1EB] rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#F2F4F8]">
                                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kênh OTA</th>
                                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mã</th>
                                <th className="text-center px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hoa hồng</th>
                                <th className="text-center px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Chế độ</th>
                                <th className="text-center px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                                <th className="text-center px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {channels.map((ch) => {
                                const dotColor = channelDotColors[ch.code] || 'bg-slate-400';
                                return (
                                    <tr key={ch.id} className="border-t border-[#F2F4F8] hover:bg-[#FAFBFD] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                                                <span className="font-semibold text-slate-800">{ch.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-slate-400 font-mono text-xs">{ch.code}</td>
                                        <td className="px-3 py-3 text-center font-bold text-[#204183]">{ch.commission}%</td>
                                        <td className="px-3 py-3 text-center">
                                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ch.calc_type === 'PROGRESSIVE'
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'bg-purple-50 text-purple-700'
                                                }`}>
                                                {ch.calc_type === 'PROGRESSIVE' ? 'Lũy tiến' : 'Cộng dồn'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <button
                                                onClick={() => handleToggle(ch)}
                                                className={`relative w-11 h-6 rounded-full transition-colors mx-auto block ${ch.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                            >
                                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${ch.is_active ? 'left-6' : 'left-1'}`} />
                                            </button>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(ch)}
                                                    className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(ch.id)}
                                                    className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                            {editing ? 'Sửa kênh OTA' : 'Thêm kênh OTA'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên kênh *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Agoda"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mã kênh *</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="agoda"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Hoa hồng (%) *</label>
                                <input
                                    type="number"
                                    value={formData.commission}
                                    onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    min="0" max="100" step="0.1"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Chế độ tính</label>
                                <select
                                    value={formData.calc_type}
                                    onChange={(e) => setFormData({ ...formData, calc_type: e.target.value as CalcTypeValue })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="PROGRESSIVE">Lũy tiến — Progressive</option>
                                    <option value="ADDITIVE">Cộng dồn — Additive</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="ota_is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="ota_is_active" className="text-sm text-slate-700">Đang hoạt động</label>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Hủy</button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 px-4 py-2 bg-[#204183] hover:bg-[#1a3469] text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editing ? 'Cập nhật' : 'Thêm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main: Combined SetupTab ─────────────────────────────────

export default function SetupTab() {
    return (
        <div className="space-y-8">
            <RoomTypesSection />
            <div className="border-t border-[#DBE1EB]" />
            <OTAChannelsSection />
        </div>
    );
}
