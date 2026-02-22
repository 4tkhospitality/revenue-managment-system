'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

type CalcTypeValue = 'PROGRESSIVE' | 'ADDITIVE';

interface OTAChannel {
    id: string;
    name: string;
    code: string;
    calc_type: CalcTypeValue;
    commission: number;
    is_active: boolean;
}

export default function OTAConfigTab() {
    const t = useTranslations('otaConfigTab');
    const [channels, setChannels] = useState<OTAChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<OTAChannel | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        commission: '',
        calc_type: 'PROGRESSIVE' as CalcTypeValue,
        is_active: true,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch channels
    const fetchChannels = async () => {
        try {
            const res = await fetch('/api/pricing/ota-channels', { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setChannels(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChannels();
    }, []);

    // Handle form submit
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
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Toggle active status
    const handleToggle = async (ch: OTAChannel) => {
        try {
            const res = await fetch(`/api/pricing/ota-channels/${ch.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !ch.is_active }),
            });
            if (!res.ok) throw new Error('Failed to update');
            await fetchChannels();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // Handle delete
    const handleDelete = async (id: string) => {
        if (!confirm(t('confirmDelete'))) return;

        try {
            const res = await fetch(`/api/pricing/ota-channels/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            await fetchChannels();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // Open edit form
    const handleEdit = (ch: OTAChannel) => {
        setEditing(ch);
        setFormData({
            name: ch.name,
            code: ch.code,
            commission: ch.commission.toString(),
            calc_type: ch.calc_type,
            is_active: ch.is_active,
        });
        setShowForm(true);
    };

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
                <h2 className="text-lg font-semibold text-slate-800">{t('title')}</h2>
                <button
                    onClick={() => {
                        setEditing(null);
                        setFormData({ name: '', code: '', commission: '', calc_type: 'PROGRESSIVE', is_active: true });
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {t('addChannel')}
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
                            {editing ? t('editChannel') : t('addChannel')}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('channelName')}</label>
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('channelCode')}</label>
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('commission')}</label>
                                <input
                                    type="number"
                                    value={formData.commission}
                                    onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('calcMode')}</label>
                                <select
                                    value={formData.calc_type}
                                    onChange={(e) => setFormData({ ...formData, calc_type: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="PROGRESSIVE">{t('progressive')}</option>
                                    <option value="ADDITIVE">{t('additive')}</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="text-sm text-slate-700">{t('active')}</label>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditing(null); }}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editing ? t('update') : t('add')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Table */}
            {channels.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    {t('noChannels')}
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-slate-600 font-medium">{t('thOtaChannel')}</th>
                                <th className="px-4 py-3 text-left text-slate-600 font-medium">{t('thCode')}</th>
                                <th className="px-4 py-3 text-center text-slate-600 font-medium">{t('thCommission')}</th>
                                <th className="px-4 py-3 text-center text-slate-600 font-medium">{t('thCalcMode')}</th>
                                <th className="px-4 py-3 text-center text-slate-600 font-medium">{t('thStatus')}</th>
                                <th className="px-4 py-3 text-center text-slate-600 font-medium">{t('thActions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {channels.map((ch) => (
                                <tr key={ch.id} className="border-t border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900">{ch.name}</td>
                                    <td className="px-4 py-3 text-slate-500 font-mono">{ch.code}</td>
                                    <td className="px-4 py-3 text-center text-slate-900">{ch.commission}%</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 text-xs font-medium rounded ${ch.calc_type === 'PROGRESSIVE'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {ch.calc_type === 'PROGRESSIVE' ? t('progressiveLabel') : t('additiveLabel')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleToggle(ch)}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${ch.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                                                }`}
                                        >
                                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${ch.is_active ? 'left-6' : 'left-1'
                                                }`} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleEdit(ch)}
                                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ch.id)}
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
