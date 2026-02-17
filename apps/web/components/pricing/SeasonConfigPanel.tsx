'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, Plus, Trash2, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import SeasonRateEditor from './SeasonRateEditor';

interface Season {
    id: string;
    name: string;
    code: string;
    priority: number;
    multiplier: number;
    is_active: boolean;
    date_ranges: Array<{ start: string; end: string }>;
}

interface Props {
    onSeasonsChange?: () => void;
}

const SEASON_PRESETS = [
    { code: 'NORMAL', name: 'Normal Season', priority: 1, multiplier: 1.0 },
    { code: 'HIGH', name: 'High Season', priority: 2, multiplier: 1.2 },
    { code: 'HOLIDAY', name: 'Holiday / Peak', priority: 3, multiplier: 1.5 },
];

export default function SeasonConfigPanel({ onSeasonsChange }: Props) {
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch seasons
    const fetchSeasons = async () => {
        try {
            const res = await fetch('/api/pricing/seasons');
            if (res.ok) {
                setSeasons(await res.json());
            }
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchSeasons(); }, []);

    // Create season
    const handleCreate = async (preset: typeof SEASON_PRESETS[0]) => {
        if (seasons.some(s => s.code === preset.code)) return;
        setError(null);
        try {
            const res = await fetch('/api/pricing/seasons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: preset.name,
                    code: preset.code,
                    priority: preset.priority,
                    multiplier: preset.multiplier,
                    date_ranges: [],
                }),
            });
            if (!res.ok) throw new Error('Failed to create season');
            await fetchSeasons();
            onSeasonsChange?.();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Create failed');
        }
    };

    // Update season
    const handleUpdate = async (season: Season) => {
        setSaving(season.id);
        setError(null);
        try {
            const res = await fetch(`/api/pricing/seasons/${season.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: season.name,
                    code: season.code,
                    priority: season.priority,
                    multiplier: season.multiplier,
                    date_ranges: season.date_ranges,
                    is_active: season.is_active,
                }),
            });
            if (!res.ok) throw new Error('Failed to update');
            await fetchSeasons();
            onSeasonsChange?.();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Update failed');
        } finally {
            setSaving(null);
        }
    };

    // Delete season
    const handleDelete = async (id: string) => {
        if (!confirm('Xóa season này? Dữ liệu NET rate liên quan cũng sẽ bị xóa.')) return;
        setError(null);
        try {
            const res = await fetch(`/api/pricing/seasons/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            await fetchSeasons();
            onSeasonsChange?.();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Delete failed');
        }
    };

    // Add date range
    const addDateRange = (seasonId: string) => {
        setSeasons(prev => prev.map(s =>
            s.id === seasonId
                ? { ...s, date_ranges: [...s.date_ranges, { start: '', end: '' }] }
                : s
        ));
    };

    // Update date range
    const updateDateRange = (seasonId: string, idx: number, field: 'start' | 'end', value: string) => {
        setSeasons(prev => prev.map(s =>
            s.id === seasonId
                ? {
                    ...s,
                    date_ranges: s.date_ranges.map((r, i) =>
                        i === idx ? { ...r, [field]: value } : r
                    ),
                }
                : s
        ));
    };

    // Remove date range
    const removeDateRange = (seasonId: string, idx: number) => {
        setSeasons(prev => prev.map(s =>
            s.id === seasonId
                ? { ...s, date_ranges: s.date_ranges.filter((_, i) => i !== idx) }
                : s
        ));
    };

    const priorityBadge = (code: string) => {
        switch (code) {
            case 'HOLIDAY': return <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">P3</span>;
            case 'HIGH': return <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">P2</span>;
            default: return <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">P1</span>;
        }
    };

    if (loading) {
        return (
            <div className="p-4 bg-white border border-slate-200 rounded-xl">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto" />
            </div>
        );
    }

    const usedCodes = new Set(seasons.map(s => s.code));

    return (
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Mùa (Seasons)</h3>
                </div>
                <div className="flex gap-1">
                    {SEASON_PRESETS.filter(p => !usedCodes.has(p.code)).map(preset => (
                        <button
                            key={preset.code}
                            onClick={() => handleCreate(preset)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                            title={`Tạo ${preset.name}`}
                        >
                            <Plus className="w-3 h-3" />
                            {preset.code}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className="text-xs text-red-600 flex items-center gap-1"><span className="font-medium">Lỗi:</span> {error}</div>}

            {seasons.length === 0 && (
                <div className="text-center py-4 text-sm text-slate-400">
                    Chưa có season. Bấm nút trên để tạo.
                </div>
            )}

            {/* Season list */}
            <div className="space-y-2">
                {seasons.map(season => {
                    const isExpanded = expandedId === season.id;
                    return (
                        <div key={season.id} className="border border-slate-200 rounded-lg overflow-hidden">
                            {/* Header */}
                            <div
                                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => setExpandedId(isExpanded ? null : season.id)}
                            >
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                <span className="text-sm font-medium text-slate-700 flex-1">{season.name}</span>
                                {priorityBadge(season.code)}
                                <span className="text-xs font-mono text-slate-500">×{season.multiplier?.toFixed(1) ?? '1.0'}</span>
                                <span className="text-xs text-slate-400">{season.date_ranges.length} khoảng</span>
                            </div>

                            {/* Expanded content */}
                            {isExpanded && (
                                <div className="px-3 pb-3 space-y-3 border-t border-slate-100">
                                    {/* Multiplier input */}
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-xs text-slate-500 font-medium">Hệ số nhân (rack = base × hệ số):</span>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.5"
                                            max="3.0"
                                            value={season.multiplier ?? 1.0}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val)) {
                                                    setSeasons(prev => prev.map(s =>
                                                        s.id === season.id ? { ...s, multiplier: val } : s
                                                    ));
                                                }
                                            }}
                                            className="w-20 px-2 py-1 text-sm font-mono border border-slate-300 rounded text-center"
                                        />
                                    </div>
                                    {/* Date ranges */}
                                    <div className="mt-2 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 font-medium">Khoảng ngày:</span>
                                            <button
                                                onClick={() => addDateRange(season.id)}
                                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                                            >
                                                <Plus className="w-3 h-3" /> Thêm
                                            </button>
                                        </div>
                                        {season.date_ranges.map((range, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                <input
                                                    type="date"
                                                    value={range.start}
                                                    onChange={(e) => updateDateRange(season.id, idx, 'start', e.target.value)}
                                                    className="px-2 py-1 text-xs border border-slate-300 rounded"
                                                />
                                                <span className="text-xs text-slate-400">→</span>
                                                <input
                                                    type="date"
                                                    value={range.end}
                                                    onChange={(e) => updateDateRange(season.id, idx, 'end', e.target.value)}
                                                    className="px-2 py-1 text-xs border border-slate-300 rounded"
                                                />
                                                <button
                                                    onClick={() => removeDateRange(season.id, idx)}
                                                    className="p-1 text-red-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Season NET Rates */}
                                    <SeasonRateEditor seasonId={season.id} seasonName={season.name} />

                                    {/* Action buttons */}
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => handleUpdate(season)}
                                            disabled={saving === season.id}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs rounded-lg transition-colors"
                                        >
                                            {saving === season.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                            Lưu
                                        </button>
                                        <button
                                            onClick={() => handleDelete(season.id)}
                                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
