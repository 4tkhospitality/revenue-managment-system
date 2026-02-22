'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Save, Plus, Trash2, AlertTriangle, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface OccTier {
    id?: string;
    tier_index: number;
    label: string;
    occ_min: number;  // 0–1
    occ_max: number;  // 0–1
    multiplier: number;
    adjustment_type: 'MULTIPLY' | 'FIXED';
    fixed_amount: number;
}

interface Props {
    onTiersChange?: () => void;
}

export default function OccTierEditor({ onTiersChange }: Props) {
    const t = useTranslations('occTierEditor');
    const [tiers, setTiers] = useState<OccTier[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Dirty-state tracking
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
                    const parsed: OccTier[] = Array.isArray(tierList) && tierList.length > 0
                        ? tierList.map((t: any) => ({
                            ...t,
                            adjustment_type: t.adjustment_type ?? 'MULTIPLY',
                            fixed_amount: t.fixed_amount ?? 0,
                        }))
                        : getDefaultTiers();
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

    function normTier(t: OccTier) {
        return {
            occ_min: t.occ_min,
            occ_max: t.occ_max,
            multiplier: t.multiplier,
            adjustment_type: t.adjustment_type,
            fixed_amount: t.fixed_amount,
        };
    }

    useEffect(() => {
        if (loading) return;
        const current = JSON.stringify(tiers.map(normTier));
        setIsDirty(current !== savedTiersRef.current);
    }, [tiers, loading]);

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
            { tier_index: 0, label: '0-35%', occ_min: 0, occ_max: 0.35, multiplier: 1.0, adjustment_type: 'MULTIPLY', fixed_amount: 0 },
            { tier_index: 1, label: '35-65%', occ_min: 0.35, occ_max: 0.65, multiplier: 1.10, adjustment_type: 'MULTIPLY', fixed_amount: 0 },
            { tier_index: 2, label: '65-85%', occ_min: 0.65, occ_max: 0.85, multiplier: 1.20, adjustment_type: 'MULTIPLY', fixed_amount: 0 },
            { tier_index: 3, label: '>85%', occ_min: 0.85, occ_max: 1.0, multiplier: 1.30, adjustment_type: 'MULTIPLY', fixed_amount: 0 },
        ];
    }

    // Per-row validation
    function getRowErrors(idx: number): string[] {
        const tier = tiers[idx];
        const errors: string[] = [];
        if (tier.occ_min >= tier.occ_max) errors.push(t('errMinGteMax'));
        if (tier.adjustment_type === 'MULTIPLY' && (tier.multiplier < 0.5 || tier.multiplier > 3.0)) {
            errors.push(t('errMultiplierRange'));
        }
        if (idx > 0 && tiers[idx - 1].occ_max !== tier.occ_min) {
            errors.push(t('errNotContinuous', { pct: Math.round(tiers[idx - 1].occ_max * 100) }));
        }
        if (idx === 0 && tier.occ_min !== 0) errors.push(t('errMustStartZero'));
        if (idx === tiers.length - 1 && tier.occ_max !== 1.0) errors.push(t('errMustEndHundred'));
        return errors;
    }

    // Global validation
    function validate(): string[] {
        const errors: string[] = [];
        if (tiers.length < 3) errors.push(t('errNeedThreeTiers'));
        if (tiers.length > 6) errors.push(t('errMaxSixTiers'));

        for (let i = 0; i < tiers.length; i++) {
            const tier = tiers[i];
            if (tier.occ_min >= tier.occ_max) errors.push(t('errTierMinGteMax', { idx: i }));
            if (tier.adjustment_type === 'MULTIPLY' && (tier.multiplier < 0.5 || tier.multiplier > 3.0)) {
                errors.push(t('errTierMultiplier', { idx: i }));
            }
            if (i > 0 && tiers[i - 1].occ_max !== tier.occ_min) {
                errors.push(t('errTierNotContinuous', { idx: i, prevIdx: i - 1 }));
            }
        }
        if (tiers.length > 0 && tiers[0].occ_min !== 0) errors.push(t('errFirstTierStart'));
        if (tiers.length > 0 && tiers[tiers.length - 1].occ_max !== 1.0) errors.push(t('errLastTierEnd'));
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
            } else if (field === 'fixed_amount') {
                updated[idx] = { ...updated[idx], fixed_amount: Number(value) };
            } else if (field === 'adjustment_type') {
                updated[idx] = { ...updated[idx], adjustment_type: value as 'MULTIPLY' | 'FIXED' };
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

    // Toggle adjustment type for a tier
    const toggleAdjType = (idx: number) => {
        setTiers(prev => {
            const updated = [...prev];
            const current = updated[idx];
            updated[idx] = {
                ...current,
                adjustment_type: current.adjustment_type === 'MULTIPLY' ? 'FIXED' : 'MULTIPLY',
            };
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
            updated[updated.length - 1] = {
                ...last,
                occ_max: splitPoint,
                label: `${Math.round(last.occ_min * 100)}-${Math.round(splitPoint * 100)}%`,
            };
            updated.push({
                tier_index: tiers.length,
                label: `>${Math.round(splitPoint * 100)}%`,
                occ_min: splitPoint,
                occ_max: 1.0,
                multiplier: last.multiplier + 0.1,
                adjustment_type: last.adjustment_type,
                fixed_amount: last.adjustment_type === 'FIXED' ? last.fixed_amount + 50000 : 0,
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
                        adjustment_type: t.adjustment_type,
                        fixed_amount: t.fixed_amount,
                    })),
                }),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to save');
            }
            setSuccess(true);
            savedTiersRef.current = JSON.stringify(tiers.map(normTier));
            setIsDirty(false);
            onTiersChange?.();
            setTimeout(() => setSuccess(false), 2000);
        } catch (e) {
            setError(e instanceof Error ? e.message : t('saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    // Format VND for display
    const formatVND = (amount: number) => {
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M`;
        if (amount >= 1000) return `${Math.round(amount / 1000)}K`;
        return String(amount);
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold text-slate-700">{t('title')}</h3>
                    {isDirty && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full font-medium">
                            {t('unsaved')}
                        </span>
                    )}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={addTier}
                        disabled={tiers.length >= 6}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:text-slate-300 rounded transition-colors"
                        title={t('addTier')}
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={removeTier}
                        disabled={tiers.length <= 3}
                        className="p-1.5 text-red-500 hover:bg-red-50 disabled:text-slate-300 rounded transition-colors"
                        title={t('deleteLast')}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[40px_1fr_1fr_auto_1fr] gap-1.5 text-[10px] text-slate-400 uppercase tracking-wider px-1 font-medium">
                <span></span>
                <span>{t('from')}</span>
                <span>{t('to')}</span>
                <span className="text-center w-14">{t('type')}</span>
                <span>{t('adjustment')}</span>
            </div>

            {/* Tier rows */}
            <div className="space-y-1">
                {tiers.map((tier, idx) => {
                    const rowErrors = getRowErrors(idx);
                    const isMultiply = tier.adjustment_type === 'MULTIPLY';
                    return (
                        <div key={idx}>
                            <div className={`grid grid-cols-[40px_1fr_1fr_auto_1fr] gap-1.5 items-center text-sm px-1 py-1 rounded ${rowErrors.length > 0 ? 'bg-red-50' : ''}`}>
                                {/* Index */}
                                <span className="text-xs text-slate-400 text-center font-mono">#{idx}</span>

                                {/* Min */}
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={Math.round(tier.occ_min * 100)}
                                        onChange={(e) => updateTier(idx, 'occ_min', e.target.value)}
                                        className={`w-full px-2 py-1.5 border rounded text-center text-sm pr-6 ${rowErrors.length > 0 ? 'border-red-300' : 'border-slate-200'} ${idx === 0 ? 'bg-slate-50 text-slate-400' : ''}`}
                                        min={0}
                                        max={100}
                                        disabled={idx === 0}
                                    />
                                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
                                </div>

                                {/* Max */}
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={Math.round(tier.occ_max * 100)}
                                        onChange={(e) => updateTier(idx, 'occ_max', e.target.value)}
                                        className={`w-full px-2 py-1.5 border rounded text-center text-sm pr-6 ${rowErrors.length > 0 ? 'border-red-300' : 'border-slate-200'} ${idx === tiers.length - 1 ? 'bg-slate-50 text-slate-400' : ''}`}
                                        min={0}
                                        max={100}
                                        disabled={idx === tiers.length - 1}
                                    />
                                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
                                </div>

                                {/* Toggle: % / ₫ */}
                                <button
                                    onClick={() => toggleAdjType(idx)}
                                    className={`w-14 h-7 rounded-md text-xs font-semibold transition-all ${isMultiply
                                        ? 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
                                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                                        }`}
                                    title={isMultiply ? t('useMultiplierTooltip') : t('useAmountTooltip')}
                                >
                                    {isMultiply ? '× %' : '+ ₫'}
                                </button>

                                {/* Value input — changes based on type */}
                                {isMultiply ? (
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-blue-400">×</span>
                                        <input
                                            type="number"
                                            value={parseFloat(tier.multiplier.toFixed(2))}
                                            onChange={(e) => updateTier(idx, 'multiplier', e.target.value)}
                                            className={`w-full pl-6 pr-2 py-1.5 border rounded text-sm text-right ${rowErrors.length > 0 ? 'border-red-300' : 'border-slate-200'}`}
                                            step={0.01}
                                            min={0.5}
                                            max={3.0}
                                        />
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-emerald-400">+</span>
                                        <input
                                            type="number"
                                            value={tier.fixed_amount}
                                            onChange={(e) => updateTier(idx, 'fixed_amount', e.target.value)}
                                            className={`w-full pl-6 pr-6 py-1.5 border rounded text-sm text-right ${rowErrors.length > 0 ? 'border-red-300' : 'border-slate-200'}`}
                                            step={10000}
                                        />
                                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₫</span>
                                    </div>
                                )}
                            </div>

                            {/* Inline per-row errors */}
                            {rowErrors.length > 0 && (
                                <div className="ml-10 mt-0.5 mb-1">
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

            {/* Summary preview */}
            <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
                {tiers.map((t, i) => (
                    <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${t.adjustment_type === 'MULTIPLY'
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}>
                        {t.label}: {t.adjustment_type === 'MULTIPLY' ? `×${t.multiplier.toFixed(2)}` : `+${formatVND(t.fixed_amount)}`}
                    </span>
                ))}
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

            {error && <div className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {error}</div>}
            {success && <div className="text-xs text-emerald-600">{t('savedSuccess')}</div>}

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
                {isDirty ? t('saveButton') : t('saved')}
            </button>
        </div>
    );
}
