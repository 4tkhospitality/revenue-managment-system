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
        return closest?.as_of_date;
    };

    const hasSnapshot = snapshots.some(s => s.as_of_date === selected);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-gray-500">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Đang tải...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">📅 Xem OTB tại:</span>

                <select
                    value={selected}
                    onChange={handleChange}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    {snapshots.map((s) => (
                        <option key={s.as_of_date} value={s.as_of_date}>
                            {formatDate(s.as_of_date)} ({s.row_count} ngày)
                        </option>
                    ))}
                </select>

                <div className="flex gap-1">
                    {snapshots.length > 0 && (
                        <button
                            onClick={() => { setSelected(snapshots[0].as_of_date); onDateChange(snapshots[0].as_of_date); }}
                            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                        >
                            Mới nhất
                        </button>
                    )}
                    {getQuickDate(7) && (
                        <button
                            onClick={() => { const d = getQuickDate(7)!; setSelected(d); onDateChange(d); }}
                            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                        >
                            -7 ngày
                        </button>
                    )}
                    {getQuickDate(30) && (
                        <button
                            onClick={() => { const d = getQuickDate(30)!; setSelected(d); onDateChange(d); }}
                            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                        >
                            -30 ngày
                        </button>
                    )}
                </div>
            </div>

            {selected && !hasSnapshot && (
                <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2 text-sm text-amber-700 flex items-center gap-2">
                    ⚠️ Chưa có snapshot cho ngày này.
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
                <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-700">
                    ❌ {error}
                </div>
            )}
        </div>
    );
}
