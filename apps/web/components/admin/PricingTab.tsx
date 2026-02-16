'use client';

// ════════════════════════════════════════════════════════════════════
// Pricing Config Admin Tab — Professional SaaS Hospitality
// UUPM Design: Navy + Gold, Lucide icons, inline edit, smooth hover
// ════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Plus, RefreshCw, Save, X, Trash2, Pencil, Calendar, Calculator,
    DollarSign, Layers, Percent, ChevronDown, ChevronUp, Sprout,
    Check, AlertCircle,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────

interface PricingConfig {
    id: string;
    config_type: 'BASE_PRICE' | 'BAND_MULTIPLIER' | 'TERM_DISCOUNT';
    tier: string | null;
    room_band: string | null;
    term_months: number | null;
    amount_vnd: number | null;
    percent: number | null;
    multiplier: number | null;
    effective_from: string;
    effective_to: string | null;
    scope: string;
    hotel_id: string | null;
    priority: number;
    label: string | null;
    updated_at: string;
    updated_by: string | null;
}

type ConfigType = 'BASE_PRICE' | 'BAND_MULTIPLIER' | 'TERM_DISCOUNT';

const TIERS = ['STANDARD', 'SUPERIOR', 'DELUXE', 'SUITE'];
const TIER_LABELS: Record<string, string> = {
    STANDARD: 'Standard', SUPERIOR: 'Superior', DELUXE: 'Deluxe', SUITE: 'Suite',
};
const BANDS = ['R30', 'R80', 'R150', 'R300P'];
const BAND_LABELS: Record<string, string> = {
    R30: '1–30 phòng', R80: '31–80 phòng', R150: '81–150 phòng', R300P: '151–300+',
};
const TERMS = [1, 3, 6, 12];

// ── Design Tokens (UUPM: Navy + Gold SaaS) ──────────────────────

const C = {
    navy900: '#0f172a',
    navy800: '#1e293b',
    navy700: '#334155',
    navy600: '#475569',
    navy400: '#94a3b8',
    navy300: '#cbd5e1',
    navy200: '#e2e8f0',
    navy100: '#f1f5f9',
    navy50: '#f8fafc',
    blue600: '#2563eb',
    blue500: '#3b82f6',
    blue100: '#dbeafe',
    blue50: '#eff6ff',
    green600: '#16a34a',
    green100: '#dcfce7',
    green50: '#f0fdf4',
    gold600: '#ca8a04',
    gold100: '#fef3c7',
    red500: '#ef4444',
    red100: '#fee2e2',
    white: '#ffffff',
};

// ── Helpers ──────────────────────────────────────────────────────

function fmt(n: number): string {
    return n.toLocaleString('vi-VN');
}
function fmtVND(n: number): string {
    return fmt(n) + '₫';
}
function fmtDate(s: string): string {
    return new Date(s).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
}
function isActive(c: PricingConfig): boolean {
    const now = new Date();
    return new Date(c.effective_from) <= now && (!c.effective_to || new Date(c.effective_to) > now);
}
function isFuture(c: PricingConfig): boolean {
    return new Date(c.effective_from) > new Date();
}
function isPast(c: PricingConfig): boolean {
    return !!c.effective_to && new Date(c.effective_to) <= new Date();
}
function toLocalISO(d: string | null): string {
    if (!d) return '';
    const dt = new Date(d);
    const offset = dt.getTimezoneOffset() * 60000;
    return new Date(dt.getTime() - offset).toISOString().slice(0, 16);
}

// ── Reusable Status Pill ────────────────────────────────────────

function StatusPill({ config }: { config: PricingConfig }) {
    if (isActive(config)) {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: C.green100, color: C.green600, letterSpacing: 0.3,
            }}>
                <Check size={10} strokeWidth={3} /> Active
            </span>
        );
    }
    if (isFuture(config)) {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: C.blue100, color: C.blue600, letterSpacing: 0.3,
            }}>
                <Calendar size={10} /> Scheduled
            </span>
        );
    }
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: C.navy100, color: C.navy400, letterSpacing: 0.3,
        }}>
            Expired
        </span>
    );
}

// ── Section Icon Component ──────────────────────────────────────

function SectionIcon({ type }: { type: ConfigType }) {
    const base: React.CSSProperties = {
        width: 36, height: 36, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    };
    switch (type) {
        case 'BASE_PRICE':
            return <div style={{ ...base, background: C.blue50, color: C.blue600 }}><DollarSign size={18} /></div>;
        case 'BAND_MULTIPLIER':
            return <div style={{ ...base, background: C.gold100, color: C.gold600 }}><Layers size={18} /></div>;
        case 'TERM_DISCOUNT':
            return <div style={{ ...base, background: C.green50, color: C.green600 }}><Percent size={18} /></div>;
    }
}

// ── Inline Edit/Add Form ────────────────────────────────────────

function ConfigForm({
    type,
    initial,
    onSave,
    onCancel,
    saving,
}: {
    type: ConfigType;
    initial?: PricingConfig | null;
    onSave: (data: Record<string, unknown>) => Promise<void>;
    onCancel: () => void;
    saving: boolean;
}) {
    const [form, setForm] = useState<Record<string, unknown>>(() => {
        if (initial) {
            return {
                id: initial.id,
                config_type: initial.config_type,
                tier: initial.tier || '',
                room_band: initial.room_band || '',
                term_months: initial.term_months ?? '',
                amount_vnd: initial.amount_vnd ?? '',
                percent: initial.percent ?? '',
                multiplier: initial.multiplier != null ? Number(initial.multiplier) : '',
                effective_from: toLocalISO(initial.effective_from),
                effective_to: toLocalISO(initial.effective_to),
                scope: initial.scope || 'GLOBAL',
                hotel_id: initial.hotel_id || '',
                priority: initial.priority || 0,
                label: initial.label || '',
            };
        }
        return { config_type: type, scope: 'GLOBAL', priority: 0, effective_from: toLocalISO(new Date().toISOString()) };
    });

    const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
    const isEdit = !!initial;

    const inp: React.CSSProperties = {
        width: '100%', padding: '7px 10px', border: `1px solid ${C.navy200}`,
        borderRadius: 8, fontSize: 13, outline: 'none', background: C.white,
        transition: 'border-color 0.15s',
    };
    const lbl: React.CSSProperties = {
        display: 'block', fontSize: 11, fontWeight: 600, color: C.navy600,
        marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
    };

    return (
        <div style={{
            padding: 16, marginBottom: 12, borderRadius: 10,
            border: `1px solid ${isEdit ? C.gold100 : C.blue100}`,
            background: isEdit ? '#fffbeb' : C.blue50,
        }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.navy800, marginBottom: 12 }}>
                {isEdit ? <><Pencil size={13} style={{ marginRight: 4 }} /> Chỉnh sửa</> : <><Plus size={13} style={{ marginRight: 4 }} /> Thêm mới</>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10 }}>
                {type === 'BASE_PRICE' && (
                    <>
                        <div>
                            <label style={lbl}>Gói</label>
                            <select style={inp} value={form.tier as string || ''}
                                onChange={e => set('tier', e.target.value)}>
                                <option value="">Chọn gói</option>
                                {TIERS.map(t => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Giá (VNĐ/tháng)</label>
                            <input style={inp} type="number" min={0} step={10000}
                                value={form.amount_vnd as number ?? ''}
                                onChange={e => set('amount_vnd', Number(e.target.value))}
                                placeholder="990.000" />
                        </div>
                    </>
                )}
                {type === 'BAND_MULTIPLIER' && (
                    <>
                        <div>
                            <label style={lbl}>Band phòng</label>
                            <select style={inp} value={form.room_band as string || ''}
                                onChange={e => set('room_band', e.target.value)}>
                                <option value="">Chọn band</option>
                                {BANDS.map(b => <option key={b} value={b}>{b} — {BAND_LABELS[b]}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Multiplier (×)</label>
                            <input style={inp} type="number" min={0.1} step={0.01} max={10}
                                value={form.multiplier as number ?? ''}
                                onChange={e => set('multiplier', Number(e.target.value))}
                                placeholder="1.30" />
                        </div>
                    </>
                )}
                {type === 'TERM_DISCOUNT' && (
                    <>
                        <div>
                            <label style={lbl}>Kỳ hạn</label>
                            <select style={inp} value={form.term_months as number ?? ''}
                                onChange={e => set('term_months', Number(e.target.value))}>
                                <option value="">Chọn kỳ hạn</option>
                                {TERMS.map(t => <option key={t} value={t}>{t} tháng</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Giảm giá (%)</label>
                            <input style={inp} type="number" min={0} max={99}
                                value={form.percent as number ?? ''}
                                onChange={e => set('percent', Number(e.target.value))}
                                placeholder="50" />
                        </div>
                    </>
                )}
                <div>
                    <label style={lbl}>Hiệu lực từ</label>
                    <input style={inp} type="datetime-local"
                        value={form.effective_from as string || ''}
                        onChange={e => set('effective_from', e.target.value)} />
                </div>
                <div>
                    <label style={lbl}>Đến (trống = vĩnh viễn)</label>
                    <input style={inp} type="datetime-local"
                        value={form.effective_to as string || ''}
                        onChange={e => set('effective_to', e.target.value || undefined)} />
                </div>
                <div>
                    <label style={lbl}>Nhãn / Ghi chú</label>
                    <input style={inp}
                        value={form.label as string || ''}
                        onChange={e => set('label', e.target.value)}
                        placeholder="VD: Khuyến mãi Q1" />
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                <button onClick={onCancel} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '7px 14px', fontSize: 13, fontWeight: 500,
                    borderRadius: 8, border: `1px solid ${C.navy200}`, background: C.white,
                    color: C.navy600, cursor: 'pointer', transition: 'all 0.15s',
                }}>
                    <X size={14} /> Hủy
                </button>
                <button onClick={() => {
                    // Strip fields that don't belong to this config_type
                    // to avoid validation errors from the API
                    const shared = ['id', 'config_type', 'effective_from', 'effective_to', 'scope', 'hotel_id', 'priority', 'label'];
                    const allowed: Record<string, string[]> = {
                        BASE_PRICE: [...shared, 'tier', 'amount_vnd'],
                        BAND_MULTIPLIER: [...shared, 'room_band', 'multiplier'],
                        TERM_DISCOUNT: [...shared, 'term_months', 'percent'],
                    };
                    const keys = allowed[type] || shared;
                    const clean: Record<string, unknown> = {};
                    for (const k of keys) {
                        if (form[k] !== undefined && form[k] !== '') clean[k] = form[k];
                    }
                    clean.config_type = type; // always include
                    onSave(clean);
                }} disabled={saving} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '7px 14px', fontSize: 13, fontWeight: 600,
                    borderRadius: 8, border: 'none', cursor: saving ? 'wait' : 'pointer',
                    background: C.blue600, color: C.white,
                    opacity: saving ? 0.7 : 1, transition: 'all 0.15s',
                }}>
                    <Save size={14} /> {saving ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Tạo mới'}
                </button>
            </div>
        </div>
    );
}

// ── Config Data Row ─────────────────────────────────────────────

function ConfigRow({
    config, type, onEdit, onDelete,
}: {
    config: PricingConfig;
    type: ConfigType;
    onEdit: (c: PricingConfig) => void;
    onDelete: (id: string) => void;
}) {
    const past = isPast(config);
    const rowStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '1fr 130px 180px 80px auto',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: `1px solid ${C.navy100}`,
        opacity: past ? 0.45 : 1,
        transition: 'background 0.15s',
        cursor: 'default',
    };

    // Label cell
    let nameCell: React.ReactNode;
    switch (type) {
        case 'BASE_PRICE':
            nameCell = (
                <div>
                    <span style={{ fontWeight: 600, fontSize: 14, color: C.navy800 }}>{TIER_LABELS[config.tier || ''] || config.tier}</span>
                    {config.label && <div style={{ fontSize: 11, color: C.navy400, marginTop: 1 }}>{config.label}</div>}
                </div>
            );
            break;
        case 'BAND_MULTIPLIER':
            nameCell = (
                <div>
                    <span style={{ fontWeight: 600, fontSize: 14, color: C.navy800 }}>{config.room_band}</span>
                    <span style={{ fontWeight: 400, color: C.navy400, fontSize: 12, marginLeft: 6 }}>{BAND_LABELS[config.room_band || '']}</span>
                    {config.label && <div style={{ fontSize: 11, color: C.navy400, marginTop: 1 }}>{config.label}</div>}
                </div>
            );
            break;
        case 'TERM_DISCOUNT':
            nameCell = (
                <div>
                    <span style={{ fontWeight: 600, fontSize: 14, color: C.navy800 }}>{config.term_months} tháng</span>
                    {config.label && <div style={{ fontSize: 11, color: C.navy400, marginTop: 1 }}>{config.label}</div>}
                </div>
            );
            break;
    }

    // Value cell
    let valueCell: React.ReactNode;
    switch (type) {
        case 'BASE_PRICE':
            valueCell = <span style={{ fontWeight: 700, fontSize: 14, color: C.navy900, fontFeatureSettings: '"tnum"' }}>{fmtVND(config.amount_vnd || 0)}</span>;
            break;
        case 'BAND_MULTIPLIER':
            valueCell = <span style={{ fontWeight: 700, fontSize: 14, color: C.gold600, fontFeatureSettings: '"tnum"' }}>×{Number(config.multiplier).toFixed(2)}</span>;
            break;
        case 'TERM_DISCOUNT':
            valueCell = <span style={{ fontWeight: 700, fontSize: 14, color: C.green600, fontFeatureSettings: '"tnum"' }}>−{config.percent}%</span>;
            break;
    }

    return (
        <div style={rowStyle} className="pricing-row">
            {nameCell}
            <div style={{ textAlign: 'right' }}>{valueCell}</div>
            <div style={{ textAlign: 'center', fontSize: 12, color: C.navy400, lineHeight: 1.4 }}>
                <div>{fmtDate(config.effective_from)}</div>
                <div style={{ color: config.effective_to ? C.navy400 : C.green600, fontSize: 11 }}>
                    {config.effective_to ? `→ ${fmtDate(config.effective_to)}` : '∞ Vĩnh viễn'}
                </div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <StatusPill config={config} />
            </div>
            <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {!past && (
                    <>
                        <button onClick={() => onEdit(config)} title="Chỉnh sửa" style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 30, height: 30, borderRadius: 6, border: 'none',
                            background: 'transparent', color: C.navy400, cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = C.blue50; e.currentTarget.style.color = C.blue600; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.navy400; }}
                        >
                            <Pencil size={14} />
                        </button>
                        <button onClick={() => onDelete(config.id)} title="Hủy kích hoạt" style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 30, height: 30, borderRadius: 6, border: 'none',
                            background: 'transparent', color: C.navy400, cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = C.red100; e.currentTarget.style.color = C.red500; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.navy400; }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Config Section Card ─────────────────────────────────────────

function ConfigSection({
    type, configs, label, subtitle, onSave, onDelete,
}: {
    type: ConfigType;
    configs: PricingConfig[];
    label: string;
    subtitle: string;
    onSave: (data: Record<string, unknown>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const [showForm, setShowForm] = useState<'add' | PricingConfig | null>(null);
    const [saving, setSaving] = useState(false);

    const filtered = useMemo(() => {
        const list = configs.filter(c => c.config_type === type);
        return [...list].sort((a, b) => {
            const o = (x: PricingConfig) => isActive(x) ? 0 : isFuture(x) ? 1 : 2;
            const d = o(a) - o(b);
            return d !== 0 ? d : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
    }, [configs, type]);

    const activeCount = filtered.filter(c => isActive(c)).length;

    const handleSaveForm = async (data: Record<string, unknown>) => {
        setSaving(true);
        await onSave(data);
        setSaving(false);
        setShowForm(null);
    };

    const handleEdit = (c: PricingConfig) => {
        setShowForm(c);
    };

    // Header labels for grid
    const colLabels = type === 'BASE_PRICE'
        ? ['Gói', 'Giá/tháng', 'Hiệu lực', 'Status', '']
        : type === 'BAND_MULTIPLIER'
            ? ['Band', 'Hệ số', 'Hiệu lực', 'Status', '']
            : ['Kỳ hạn', 'Giảm giá', 'Hiệu lực', 'Status', ''];

    return (
        <div style={{
            background: C.white, borderRadius: 12,
            border: `1px solid ${C.navy200}`, marginBottom: 16,
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            overflow: 'hidden',
        }}>
            {/* Section Header */}
            <div
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', cursor: 'pointer',
                    borderBottom: collapsed ? 'none' : `1px solid ${C.navy100}`,
                    transition: 'background 0.15s',
                }}
                onClick={() => setCollapsed(p => !p)}
                onMouseEnter={e => e.currentTarget.style.background = C.navy50}
                onMouseLeave={e => e.currentTarget.style.background = C.white}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <SectionIcon type={type} />
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.navy800 }}>{label}</div>
                        <div style={{ fontSize: 12, color: C.navy400 }}>
                            {subtitle} · <span style={{ color: C.green600, fontWeight: 600 }}>{activeCount} active</span> / {filtered.length} total
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                        onClick={e => { e.stopPropagation(); setShowForm('add'); setCollapsed(false); }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '6px 12px', fontSize: 12, fontWeight: 600,
                            borderRadius: 7, border: `1px solid ${C.blue600}`,
                            background: C.blue600, color: C.white,
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = C.blue500; }}
                        onMouseLeave={e => { e.currentTarget.style.background = C.blue600; }}
                    >
                        <Plus size={13} /> Thêm mới
                    </button>
                    {collapsed ? <ChevronDown size={16} color={C.navy400} /> : <ChevronUp size={16} color={C.navy400} />}
                </div>
            </div>

            {/* Collapsible Body */}
            {!collapsed && (
                <div>
                    {/* Form (Add or Edit) */}
                    {showForm && (
                        <div style={{ padding: '12px 16px 0' }}>
                            <ConfigForm
                                type={type}
                                initial={showForm === 'add' ? null : showForm}
                                onSave={handleSaveForm}
                                onCancel={() => setShowForm(null)}
                                saving={saving}
                            />
                        </div>
                    )}

                    {/* Column Headers */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 130px 180px 80px auto',
                        padding: '8px 16px',
                        background: C.navy50,
                        borderBottom: `1px solid ${C.navy100}`,
                    }}>
                        {colLabels.map((l, i) => (
                            <div key={i} style={{
                                fontSize: 11, fontWeight: 600, color: C.navy400,
                                textTransform: 'uppercase', letterSpacing: 0.5,
                                textAlign: i === 1 ? 'right' : i === 2 || i === 3 ? 'center' : 'left',
                            }}>{l}</div>
                        ))}
                    </div>

                    {/* Rows */}
                    {filtered.length === 0 ? (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: C.navy400 }}>
                            <AlertCircle size={20} style={{ marginBottom: 6, opacity: 0.5 }} />
                            <div style={{ fontSize: 13 }}>Chưa có config nào</div>
                        </div>
                    ) : (
                        filtered.map(c => (
                            <ConfigRow
                                key={c.id}
                                config={c}
                                type={type}
                                onEdit={handleEdit}
                                onDelete={onDelete}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ── Preview Calculator ──────────────────────────────────────────

function PreviewCalculator() {
    const [tier, setTier] = useState('SUPERIOR');
    const [band, setBand] = useState('R30');
    const [term, setTerm] = useState(1);
    const [result, setResult] = useState<{
        price: number; basePrice: number; multiplier: number; discountPercent: number;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    const calculate = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pricing/active?band=${band}`);
            const data = await res.json();
            const tierData = data[tier];
            if (tierData) {
                setResult({
                    price: term === 1 ? tierData.monthly : (tierData.quarterly || tierData.monthly),
                    basePrice: tierData.monthly,
                    multiplier: 1,
                    discountPercent: tierData.discountPercent || 0,
                });
            }
        } catch { /* ignore */ }
        setLoading(false);
    }, [tier, band, term]);

    useEffect(() => { calculate(); }, [calculate]);

    const inp: React.CSSProperties = {
        width: '100%', padding: '7px 10px', border: `1px solid ${C.navy200}`,
        borderRadius: 8, fontSize: 13, outline: 'none', background: C.white,
    };
    const lbl: React.CSSProperties = {
        display: 'block', fontSize: 11, fontWeight: 600, color: C.navy600,
        marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
    };

    return (
        <div style={{
            background: C.white, borderRadius: 12,
            border: `1px solid ${C.navy200}`, overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 16px', borderBottom: `1px solid ${C.navy100}`,
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#f5f3ff', color: '#7c3aed',
                }}>
                    <Calculator size={18} />
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.navy800 }}>Preview Calculator</div>
                    <div style={{ fontSize: 12, color: C.navy400 }}>Tính giá thực tế theo cấu hình hiện tại</div>
                </div>
            </div>
            <div style={{ padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                    <div>
                        <label style={lbl}>Gói</label>
                        <select style={inp} value={tier} onChange={e => setTier(e.target.value)}>
                            {TIERS.map(t => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Band phòng</label>
                        <select style={inp} value={band} onChange={e => setBand(e.target.value)}>
                            {BANDS.map(b => <option key={b} value={b}>{b} — {BAND_LABELS[b]}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Kỳ hạn</label>
                        <select style={inp} value={term} onChange={e => setTerm(Number(e.target.value))}>
                            {TERMS.map(t => <option key={t} value={t}>{t} tháng</option>)}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 24, color: C.navy400, fontSize: 13 }}>
                        Đang tính toán…
                    </div>
                ) : result && (
                    <div style={{
                        padding: 24, borderRadius: 10, textAlign: 'center',
                        background: `linear-gradient(135deg, ${C.navy50}, #f5f3ff)`,
                        border: `1px solid ${C.navy200}`,
                    }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: C.navy400, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Khách trả / tháng
                        </div>
                        <div style={{
                            fontSize: 36, fontWeight: 800, color: C.navy900,
                            fontFeatureSettings: '"tnum"', lineHeight: 1,
                        }}>
                            {fmtVND(result.price)}
                        </div>
                        {result.discountPercent > 0 && (
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                marginTop: 10, padding: '4px 12px',
                                background: C.green100, borderRadius: 20,
                                fontSize: 12, fontWeight: 600, color: C.green600,
                            }}>
                                <Percent size={11} /> Giảm {result.discountPercent}% so với monthly
                            </div>
                        )}
                        <div style={{ fontSize: 12, color: C.navy400, marginTop: 8 }}>
                            Giá gốc monthly: {fmtVND(result.basePrice)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main PricingTab ─────────────────────────────────────────────

export default function PricingTab() {
    const [configs, setConfigs] = useState<PricingConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);

    const fetchConfigs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/pricing-config?mode=all');
            if (res.ok) setConfigs(await res.json());
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

    const handleSave = async (data: Record<string, unknown>) => {
        const res = await fetch('/api/admin/pricing-config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json();
            alert(`Lỗi: ${err.error}`);
            return;
        }
        fetchConfigs();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hủy kích hoạt config này? (effective_to = now)')) return;
        await fetch(`/api/admin/pricing-config?id=${id}`, { method: 'DELETE' });
        fetchConfigs();
    };

    const handleSeed = async () => {
        setSeeding(true);
        try {
            const res = await fetch('/api/admin/pricing-config/seed', { method: 'POST' });
            const data = await res.json();
            alert(data.message);
            fetchConfigs();
        } catch { alert('Seed thất bại'); }
        setSeeding(false);
    };

    const activeCount = configs.filter(c => isActive(c)).length;

    // Loading skeleton
    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <RefreshCw size={20} color={C.navy300} style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ marginTop: 8, fontSize: 13, color: C.navy400 }}>Đang tải cấu hình giá…</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        );
    }

    return (
        <div>
            {/* Summary Bar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 16, padding: '10px 14px', borderRadius: 10,
                background: C.navy50, border: `1px solid ${C.navy200}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 13, color: C.navy600 }}>
                        <span style={{ fontWeight: 700, fontSize: 18, color: C.navy900, marginRight: 4 }}>{configs.length}</span> configs
                    </div>
                    <div style={{ width: 1, height: 20, background: C.navy200 }} />
                    <div style={{ fontSize: 13, color: C.green600, fontWeight: 600 }}>
                        {activeCount} active
                    </div>
                    <div style={{ width: 1, height: 20, background: C.navy200 }} />
                    <div style={{ fontSize: 13, color: C.navy400 }}>
                        {configs.length - activeCount} inactive
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {configs.length === 0 && (
                        <button onClick={handleSeed} disabled={seeding} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '7px 14px', fontSize: 12, fontWeight: 600,
                            borderRadius: 7, border: 'none',
                            background: C.green600, color: C.white,
                            cursor: seeding ? 'wait' : 'pointer', transition: 'all 0.15s',
                        }}>
                            <Sprout size={14} /> {seeding ? 'Đang seed…' : 'Seed Defaults'}
                        </button>
                    )}
                    <button onClick={fetchConfigs} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '7px 14px', fontSize: 12, fontWeight: 500,
                        borderRadius: 7, border: `1px solid ${C.navy200}`,
                        background: C.white, color: C.navy600,
                        cursor: 'pointer', transition: 'all 0.15s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = C.navy50}
                        onMouseLeave={e => e.currentTarget.style.background = C.white}
                    >
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>
            </div>

            {/* Config Sections */}
            <ConfigSection
                type="BASE_PRICE"
                label="Base Price"
                subtitle="Giá gốc theo gói"
                configs={configs}
                onSave={handleSave}
                onDelete={handleDelete}
            />
            <ConfigSection
                type="BAND_MULTIPLIER"
                label="Band Multiplier"
                subtitle="Hệ số nhân theo quy mô phòng"
                configs={configs}
                onSave={handleSave}
                onDelete={handleDelete}
            />
            <ConfigSection
                type="TERM_DISCOUNT"
                label="Term Discount"
                subtitle="Chiết khấu theo kỳ hạn cam kết"
                configs={configs}
                onSave={handleSave}
                onDelete={handleDelete}
            />

            {/* Preview Calculator */}
            <PreviewCalculator />
        </div>
    );
}
