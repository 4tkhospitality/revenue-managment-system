'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface RoomType {
    id: string;
    name: string;
    net_price: number;
}

interface SeasonRate {
    id?: string;
    room_type_id: string;
    net_rate: number;
}

interface Props {
    seasonId: string;
    seasonName: string;
}

export default function SeasonRateEditor({ seasonId, seasonName }: Props) {
    const t = useTranslations('seasonRateEditor');
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [rates, setRates] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch room types + existing rates
    useEffect(() => {
        (async () => {
            try {
                const [rtRes, rateRes] = await Promise.all([
                    fetch('/api/pricing/room-types'),
                    fetch(`/api/pricing/season-rates?seasonId=${seasonId}`),
                ]);
                if (rtRes.ok) {
                    setRoomTypes(await rtRes.json());
                }
                if (rateRes.ok) {
                    const existingRates: SeasonRate[] = await rateRes.json();
                    const map = new Map<string, number>();
                    existingRates.forEach(r => map.set(r.room_type_id, r.net_rate));
                    setRates(map);
                }
            } catch { /* ignore */ }
            finally { setLoading(false); }
        })();
    }, [seasonId]);

    const updateRate = (roomTypeId: string, value: string) => {
        setRates(prev => {
            const next = new Map(prev);
            next.set(roomTypeId, Number(value) || 0);
            return next;
        });
        setSuccess(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const payload = roomTypes
                .filter(rt => rates.has(rt.id) && rates.get(rt.id)! > 0)
                .map(rt => ({
                    season_id: seasonId,
                    room_type_id: rt.id,
                    net_rate: rates.get(rt.id)!,
                }));

            const res = await fetch('/api/pricing/season-rates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seasonId, rates: payload }),
            });
            if (!res.ok) throw new Error(t('failedToSaveRates'));
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (e) {
            setError(e instanceof Error ? e.message : t('saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500 mx-auto my-2" />;
    }

    return (
        <div className="space-y-2">
            <div className="text-xs font-medium text-slate-500">{t('netRatesFor', { seasonName })}</div>
            <div className="space-y-1">
                {roomTypes.map(rt => (
                    <div key={rt.id} className="flex items-center gap-2 text-xs">
                        <span className="flex-1 text-slate-600 truncate" title={rt.name}>{rt.name}</span>
                        <span className="text-slate-400 w-20 text-right">
                            ({rt.net_price.toLocaleString('vi-VN')})
                        </span>
                        <input
                            type="number"
                            value={rates.get(rt.id) ?? rt.net_price}
                            onChange={(e) => updateRate(rt.id, e.target.value)}
                            className="w-28 px-2 py-1 border border-slate-300 rounded text-right text-sm font-mono"
                            min={0}
                        />
                    </div>
                ))}
            </div>

            {error && <div className="text-xs text-red-600">❌ {error}</div>}
            {success && <div className="text-xs text-emerald-600">✅ {t('ratesSaved')}</div>}

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white text-xs rounded-lg transition-colors"
            >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {t('saveNetRates')}
            </button>
        </div>
    );
}
