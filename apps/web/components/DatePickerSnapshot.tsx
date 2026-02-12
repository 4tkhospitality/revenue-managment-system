'use client';

import { useState, useEffect } from 'react';

interface Snapshot {
    as_of_date: string;
    row_count: number;
}

interface DatePickerSnapshotProps {
    onDateChange: (date: string) => void;
    defaultDate?: string;
}

/**
 * Get relative label for a date (Hôm nay, Hôm qua, 3 ngày trước, 1 tuần trước...)
 */
function getRelativeLabel(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays <= 6) return `${diffDays} ngày trước`;
    if (diffDays <= 13) return '1 tuần trước';
    if (diffDays <= 20) return '2 tuần trước';
    if (diffDays <= 34) return '1 tháng trước';
    if (diffDays <= 64) return '2 tháng trước';
    return `${Math.round(diffDays / 30)} tháng trước`;
}

export function DatePickerSnapshot({ onDateChange, defaultDate }: DatePickerSnapshotProps) {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [selected, setSelected] = useState<string>(defaultDate || '');
    const [loading, setLoading] = useState(true);
    const [building, setBuilding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSnapshots() {
            try {
                setLoading(true);
                const res = await fetch('/api/otb/snapshots');
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setSnapshots(data);

                if (data.length > 0 && !selected) {
                    const latest = data[0].as_of_date;
                    setSelected(latest);
                    onDateChange(latest);
                }
            } catch {
                setError('Không thể tải danh sách snapshot');
            } finally {
                setLoading(false);
            }
        }
        fetchSnapshots();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const date = e.target.value;
        setSelected(date);
        onDateChange(date);
    };

    const handleBuildSnapshot = async () => {
        if (!selected) return;

        setBuilding(true);
        try {
            const res = await fetch('/api/otb/snapshots/build', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ as_of_date: selected, rebuild: true })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Build failed');
            }

            const refreshRes = await fetch('/api/otb/snapshots');
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                setSnapshots(data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Build failed');
        } finally {
            setBuilding(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getQuickDate = (days: number) => {
        if (snapshots.length === 0) return null;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - days);
        const targetStr = targetDate.toISOString().split('T')[0];
        const closest = snapshots.find(s => s.as_of_date <= targetStr);
        return closest?.as_of_date || null;
    };

    const hasSnapshot = snapshots.some(s => s.as_of_date === selected);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-gray-400 py-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm">Đang tải snapshot...</span>
            </div>
        );
    }

    // Single snapshot hint
    const isSingle = snapshots.length === 1;

    return (
        <div className="space-y-2">
            {/* Dropdown + Quick buttons in one row */}
            <div className="flex items-center gap-2 flex-wrap">
                <select
                    value={selected}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[260px]"
                >
                    {snapshots.map((s) => (
                        <option key={s.as_of_date} value={s.as_of_date}>
                            {formatDate(s.as_of_date)} — {getRelativeLabel(s.as_of_date)} ({s.row_count} ngày dữ liệu)
                        </option>
                    ))}
                </select>

                {/* Quick buttons — data-aware (disabled if no matching snapshot) */}
                <div className="flex gap-1">
                    {snapshots.length > 0 && (
                        <button
                            onClick={() => { setSelected(snapshots[0].as_of_date); onDateChange(snapshots[0].as_of_date); }}
                            disabled={isSingle}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${selected === snapshots[0].as_of_date
                                ? 'bg-blue-600 text-white'
                                : isSingle
                                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            title="Snapshot mới nhất"
                        >
                            Mới nhất
                        </button>
                    )}
                    {[
                        { days: 7, label: '-7d' },
                        { days: 30, label: '-30d' },
                    ].map(({ days, label }) => {
                        const target = getQuickDate(days);
                        const hasTarget = target !== null;
                        return (
                            <button
                                key={days}
                                onClick={() => {
                                    if (hasTarget) {
                                        setSelected(target);
                                        onDateChange(target);
                                    }
                                }}
                                disabled={!hasTarget}
                                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${hasTarget
                                    ? selected === target
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                    }`}
                                title={hasTarget ? `Gần ngày ${formatDate(target)}` : `Chưa có snapshot ${days} ngày trước`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Single snapshot hint */}
            {isSingle && (
                <p className="text-xs text-slate-400">
                    Chỉ có 1 snapshot. Upload thêm dữ liệu để có lịch sử so sánh.
                </p>
            )}

            {/* Missing snapshot warning */}
            {selected && !hasSnapshot && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-700 flex items-center gap-2">
                    Chưa có snapshot cho ngày này.
                    <button
                        onClick={handleBuildSnapshot}
                        disabled={building}
                        className="px-2 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                    >
                        {building ? 'Đang tạo...' : 'Tạo snapshot'}
                    </button>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                    ❌ {error}
                </div>
            )}
        </div>
    );
}
