'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Save, Plus, Trash2, AlertTriangle } from 'lucide-react';

interface OccTier {
    id?: string;
    tier_index: number;
    label: string;
    occ_min: number;  // 0–1
    occ_max: number;  // 0–1
    multiplier: number;
}

interface Props {
    onTiersChange?: () => void;
}

export default function OccTierEditor({ onTiersChange }: Props) {
    const [tiers, setTiers] = useState<OccTier[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // P2: Dirty-state tracking
    const savedTiersRef = useRef<string>('');
    const [isDirty, setIsDirty] = useState(false);

    // Fetch tiers
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/pricing/occ-tiers');
                if (res.ok) {
                    const data = await res.json();
                    const tierList = data.tiers ?? data;
                    const parsed = Array.isArray(tierList) && tierList.length > 0 ? tierList : getDefaultTiers();
                    setTiers(parsed);
                    savedTiersRef.current = JSON.stringify(parsed.map(normTier));
                } else {
                    const defaults = getDefaultTiers();
                    setTiers(defaults);
                    savedTiersRef.current = JSON.stringify(defaults.map(normTier));
                }
            } catch {
                const defaults = getDefaultTiers();
                setTiers(defaults);
                savedTiersRef.current = JSON.stringify(defaults.map(normTier));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Normalize tier for comparison
    function normTier(t: OccTier) {
        return { occ_min: t.occ_min, occ_max: t.occ_max, multiplier: t.multiplier };
    }

    // Check dirty on every tiers change
    useEffect(() => {
        if (loading) return;
        const current = JSON.stringify(tiers.map(normTier));
        setIsDirty(current !== savedTiersRef.current);
    }, [tiers, loading]);

    // P2: Warn on navigate away if dirty
    const beforeUnloadHandler = useCallback((e: BeforeUnloadEvent) => {
        e.preventDefault();
    }, []);

    useEffect(() => {
        if (isDirty) {
            window.addEventListener('beforeunload', beforeUnloadHandler);
        } else {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
        }
        return () => window.removeEventListener('beforeunload', beforeUnloadHandler);
    }, [isDirty, beforeUnloadHandler]);

    function getDefaultTiers(): OccTier[] {
        return [
            { tier_index: 0, label: '0-35%', occ_min: 0, occ_max: 0.35, multiplier: 1.0 },
            { tier_index: 1, label: '35-65%', occ_min: 0.35, occ_max: 0.65, multiplier: 1.10 },
            { tier_index: 2, label: '65-85%', occ_min: 0.65, occ_max: 0.85, multiplier: 1.20 },
            { tier_index: 3, label: '>85%', occ_min: 0.85, occ_max: 1.0, multiplier: 1.30 },
        ];
    }

    // P2: Per-row validation errors
    function getRowErrors(idx: number): string[] {
        const t = tiers[idx];
        const errors: string[] = [];
        if (t.occ_min >= t.occ_max) errors.push('min ≥ max');
        if (t.multiplier < 0.5 || t.multiplier > 3.0) errors.push('multiplier ngoài 0.5–3.0');
        if (idx > 0 && tiers[idx - 1].occ_max !== t.occ_min) {
            errors.push(`không liền mạch — bậc trước kết thúc ${Math.round(tiers[idx - 1].occ_max * 100)}%`);
        }
        if (idx === 0 && t.occ_min !== 0) errors.push('phải bắt đầu từ 0%');
        if (idx === tiers.length - 1 && t.occ_max !== 1.0) errors.push('phải kết thúc ở 100%');
        return errors;
    }

    // Global validation
    function validate(): string[] {
        const errors: string[] = [];
        if (tiers.length < 3) errors.push('Cần ít nhất 3 bậc');
        if (tiers.length > 6) errors.push('Tối đa 6 bậc');

        for (let i = 0; i < tiers.length; i++) {
            const t = tiers[i];
            if (t.occ_min >= t.occ_max) errors.push(`Bậc ${i}: min ≥ max`);
            if (t.multiplier < 0.5 || t.multiplier > 3.0) errors.push(`Bậc ${i}: multiplier ngoài 0.5–3.0`);
            if (i > 0 && tiers[i - 1].occ_max !== t.occ_min) {
                errors.push(`Bậc ${i}: không liền mạch với bậc ${i - 1}`);
            }
        }
        if (tiers.length > 0 && tiers[0].occ_min !== 0) errors.push('Bậc đầu phải bắt đầu từ 0%');
        if (tiers.length > 0 && tiers[tiers.length - 1].occ_max !== 1.0) errors.push('Bậc cuối phải kết thúc ở 100%');
        return errors;
    }

    const validationErrors = validate();
    const hasRowErrors = tiers.some((_, i) => getRowErrors(i).length > 0);

    // Update tier field
    const updateTier = (idx: number, field: keyof OccTier, value: number | string) => {
        setTiers(prev => {
            const updated = [...prev];
            if (field === 'occ_min' || field === 'occ_max') {
                updated[idx] = { ...updated[idx], [field]: Number(value) / 100 };
            } else if (field === 'multiplier') {
                updated[idx] = { ...updated[idx], multiplier: Number(value) };
            } else if (field === 'label') {
                updated[idx] = { ...updated[idx], label: String(value) };
            }
            // Auto-update labels
            updated.forEach((t, i) => {
                const minPct = Math.round(t.occ_min * 100);
                const maxPct = Math.round(t.occ_max * 100);
                if (maxPct >= 100) {
                    updated[i] = { ...updated[i], label: `>${minPct}%` };
                } else {
                    updated[i] = { ...updated[i], label: `${minPct}-${maxPct}%` };
                }
            });
            return updated;
        });
        setSuccess(false);
    };

    // Add tier (split last tier)
    const addTier = () => {
        if (tiers.length >= 6) return;
        const last = tiers[tiers.length - 1];
        const splitPoint = (last.occ_min + last.occ_max) / 2;
        setTiers(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...last, occ_max: splitPoint, label: `${Math.round(last.occ_min * 100)}-${Math.round(splitPoint * 100)}%` };
            updated.push({
                tier_index: tiers.length,
                label: `>${Math.round(splitPoint * 100)}%`,
                occ_min: splitPoint,
                occ_max: 1.0,
                multiplier: last.multiplier + 0.1,
            });
            return updated;
        });
        setSuccess(false);
    };

    // Remove last tier
    const removeTier = () => {
        if (tiers.length <= 3) return;
        setTiers(prev => {
            const updated = prev.slice(0, -1);
            updated[updated.length - 1] = { ...updated[updated.length - 1], occ_max: 1.0 };
            return updated;
        });
        setSuccess(false);
    };

    // Save
    const handleSave = async () => {
        if (validationErrors.length > 0) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/pricing/occ-tiers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tiers: tiers.map((t, i) => ({
                        tier_index: i,
                        label: t.label,
                        occ_min: t.occ_min,
                        occ_max: t.occ_max,
                        multiplier: t.multiplier,
                    })),
                }),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to save');
            }
            setSuccess(true);
            // Update saved snapshot (dirty → clean)
            savedTiersRef.current = JSON.stringify(tiers.map(normTier));
            setIsDirty(false);
            onTiersChange?.();
            setTimeout(() => setSuccess(false), 2000);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 bg-white border border-slate-200 rounded-xl">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto" />
            </div>
        );
    }

    return (
        <div className={`p-4 bg-white border rounded-xl space-y-3 ${isDirty ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-700">📊 Bậc OCC (Occupancy Tiers)</h3>
                    {isDirty && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full font-medium">
                            Chưa lưu
                        </span>
                    )}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={addTier}
                        disabled={tiers.length >= 6}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:text-slate-300 rounded transition-colors"
                        title="Thêm bậc"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={removeTier}
                        disabled={tiers.length <= 3}
                        className="p-1.5 text-red-500 hover:bg-red-50 disabled:text-slate-300 rounded transition-colors"
                        title="Xóa bậc cuối"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Tier rows */}
            <div className="space-y-1">
                {tiers.map((tier, idx) => {
                    const rowErrors = getRowErrors(idx);
                    return (
                        <div key={idx}>
                            <div className={`flex items-center gap-2 text-sm px-1 py-1 rounded ${rowErrors.length > 0 ? 'bg-red-50' : ''}`}>
                                <span className="w-12 text-xs text-slate-400 text-center">#{idx}</span>
                                <input
                                    type="number"
                                    value={Math.round(tier.occ_min * 100)}
                                    onChange={(e) => updateTier(idx, 'occ_min', e.target.value)}
                                    className={`w-16 px-2 py-1.5 border rounded text-center text-sm ${rowErrors.length > 0 ? 'border-red-300' : 'border-slate-300'}`}
                                    min={0}
                                    max={100}
                                    disabled={idx === 0}
                                />
                                <span className="text-slate-400">–</span>
                                <input
                                    type="number"
                                    value={Math.round(tier.occ_max * 100)}
                                    onChange={(e) => updateTier(idx, 'occ_max', e.target.value)}
                                    className={`w-16 px-2 py-1.5 border rounded text-center text-sm ${rowErrors.length > 0 ? 'border-red-300' : 'border-slate-300'}`}
                                    min={0}
                                    max={100}
                                    disabled={idx === tiers.length - 1}
                                />
                                <span className="text-slate-400">%</span>
                                <span className="text-slate-400 mx-1">×</span>
                                <input
                                    type="number"
                                    value={parseFloat(tier.multiplier.toFixed(2))}
                                    onChange={(e) => updateTier(idx, 'multiplier', e.target.value)}
                                    className={`w-20 px-2 py-1.5 border rounded text-center text-sm ${rowErrors.length > 0 ? 'border-red-300' : 'border-slate-300'}`}
                                    step={0.01}
                                    min={0.5}
                                    max={3.0}
                                />
                            </div>
                            {/* P2: Inline per-row errors */}
                            {rowErrors.length > 0 && (
                                <div className="ml-14 mt-0.5 mb-1">
                                    {rowErrors.map((e, i) => (
                                        <div key={i} className="text-[10px] text-red-500 flex items-center gap-1">
                                            <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                            {e}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Global validation errors */}
            {validationErrors.length > 0 && !hasRowErrors && (
                <div className="text-xs text-amber-600 space-y-0.5">
                    {validationErrors.map((e, i) => (
                        <div key={i} className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {e}
                        </div>
                    ))}
                </div>
            )}

            {error && <div className="text-xs text-red-600">❌ {error}</div>}
            {success && <div className="text-xs text-emerald-600">✅ Đã lưu!</div>}

            <button
                onClick={handleSave}
                disabled={saving || validationErrors.length > 0 || !isDirty}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-white text-sm rounded-lg transition-colors ${validationErrors.length > 0
                    ? 'bg-slate-300 cursor-not-allowed'
                    : isDirty
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
            >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isDirty ? 'Lưu bậc OCC' : 'Đã lưu ✓'}
            </button>
        </div>
    );
}
