'use client';

// ════════════════════════════════════════════════════════════════════
// Pricing Config Admin Tab — Base Price, Band Multiplier, Term Discount
// ════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import {
    Plus, RefreshCw, Save, X, Trash2, Calendar, Calculator, Clock,
} from 'lucide-react';

// ── Styles (matching PLGAdminDashboard) ──────────────────────────

const cardStyle: React.CSSProperties = {
    background: 'white', borderRadius: 12, border: '1px solid #e5e7eb',
    padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const btnPrimary: React.CSSProperties = {
    background: '#2563eb', color: 'white', border: 'none', borderRadius: 8,
    padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
};

const btnGhost: React.CSSProperties = {
    background: 'transparent', border: 'none', cursor: 'pointer',
    padding: '6px 8px', borderRadius: 6, display: 'inline-flex',
    alignItems: 'center', gap: 4, fontSize: 13, color: '#6b7280',
    transition: 'all 0.15s',
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
    borderRadius: 8, fontSize: 14, outline: 'none',
};

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

const TIERS = ['STANDARD', 'SUPERIOR', 'DELUXE', 'SUITE'];
const BANDS = ['R30', 'R80', 'R150', 'R300P'];
const BAND_LABELS: Record<string, string> = {
    R30: '≤ 30 phòng', R80: '31–80 phòng', R150: '81–150 phòng', R300P: '151–300+ phòng',
};
const TERMS = [1, 3, 6, 12];

function formatVND(amount: number): string {
    return amount.toLocaleString('vi-VN') + '₫';
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function isActive(config: PricingConfig): boolean {
    const now = new Date();
    const from = new Date(config.effective_from);
    if (from > now) return false;
    if (config.effective_to && new Date(config.effective_to) <= now) return false;
    return true;
}

function isFuture(config: PricingConfig): boolean {
    return new Date(config.effective_from) > new Date();
}

function isPast(config: PricingConfig): boolean {
    return config.effective_to != null && new Date(config.effective_to) <= new Date();
}

// ── Status Badge ────────────────────────────────────────────────

function StatusBadge({ config }: { config: PricingConfig }) {
    if (isActive(config)) {
        return (
            <span style={{
                padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                background: '#dcfce7', color: '#166534',
            }}>● Active</span>
        );
    }
    if (isFuture(config)) {
        return (
            <span style={{
                padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                background: '#dbeafe', color: '#1d4ed8',
            }}>⏳ Scheduled</span>
        );
    }
    return (
        <span style={{
            padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
            background: '#f3f4f6', color: '#6b7280',
        }}>✓ Expired</span>
    );
}

// ── Config Section (shared for each type) ───────────────────────

function ConfigSection({
    title, configs, type, onSave, onDelete,
}: {
    title: string;
    configs: PricingConfig[];
    type: 'BASE_PRICE' | 'BAND_MULTIPLIER' | 'TERM_DISCOUNT';
    onSave: (data: Record<string, unknown>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}) {
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<Record<string, unknown>>({
        config_type: type,
        scope: 'GLOBAL',
        priority: 0,
    });

    const filtered = configs.filter(c => c.config_type === type);
    // Sort: active first, then future, then past
    const sorted = [...filtered].sort((a, b) => {
        const aOrder = isActive(a) ? 0 : isFuture(a) ? 1 : 2;
        const bOrder = isActive(b) ? 0 : isFuture(b) ? 1 : 2;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    const handleSave = async () => {
        setSaving(true);
        await onSave(form);
        setSaving(false);
        setShowAdd(false);
        setForm({ config_type: type, scope: 'GLOBAL', priority: 0 });
    };

    return (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{title}</h3>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>
                        {filtered.filter(c => isActive(c)).length} active · {filtered.length} total
                    </span>
                </div>
                <button onClick={() => setShowAdd(!showAdd)} style={btnPrimary}>
                    <Plus size={14} /> Thêm giai đoạn giá
                </button>
            </div>

            {/* Add Form */}
            {showAdd && (
                <div style={{
                    padding: 16, marginBottom: 16, border: '1px solid #dbeafe',
                    borderRadius: 8, background: '#f8fafc',
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                        {type === 'BASE_PRICE' && (
                            <>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Gói</label>
                                    <select style={inputStyle} value={form.tier as string || ''} onChange={e => setForm({ ...form, tier: e.target.value })}>
                                        <option value="">Chọn gói</option>
                                        {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Giá (VNĐ)</label>
                                    <input style={inputStyle} type="number" min={0} step={10000}
                                        value={form.amount_vnd as number || ''}
                                        onChange={e => setForm({ ...form, amount_vnd: Number(e.target.value) })}
                                        placeholder="990000" />
                                </div>
                            </>
                        )}
                        {type === 'BAND_MULTIPLIER' && (
                            <>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Band</label>
                                    <select style={inputStyle} value={form.room_band as string || ''} onChange={e => setForm({ ...form, room_band: e.target.value })}>
                                        <option value="">Chọn band</option>
                                        {BANDS.map(b => <option key={b} value={b}>{b} ({BAND_LABELS[b]})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Multiplier</label>
                                    <input style={inputStyle} type="number" min={0.1} step={0.1} max={10}
                                        value={form.multiplier as number || ''}
                                        onChange={e => setForm({ ...form, multiplier: Number(e.target.value) })}
                                        placeholder="1.3" />
                                </div>
                            </>
                        )}
                        {type === 'TERM_DISCOUNT' && (
                            <>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Kỳ hạn (tháng)</label>
                                    <select style={inputStyle} value={form.term_months as number || ''} onChange={e => setForm({ ...form, term_months: Number(e.target.value) })}>
                                        <option value="">Chọn kỳ hạn</option>
                                        {TERMS.map(t => <option key={t} value={t}>{t} tháng</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Giảm (%)</label>
                                    <input style={inputStyle} type="number" min={0} max={99}
                                        value={form.percent as number ?? ''}
                                        onChange={e => setForm({ ...form, percent: Number(e.target.value) })}
                                        placeholder="50" />
                                </div>
                            </>
                        )}
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Hiệu lực từ</label>
                            <input style={inputStyle} type="datetime-local"
                                value={form.effective_from as string || ''}
                                onChange={e => setForm({ ...form, effective_from: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Đến (trống = vĩnh viễn)</label>
                            <input style={inputStyle} type="datetime-local"
                                value={form.effective_to as string || ''}
                                onChange={e => setForm({ ...form, effective_to: e.target.value || undefined })} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Nhãn</label>
                            <input style={inputStyle}
                                value={form.label as string || ''}
                                onChange={e => setForm({ ...form, label: e.target.value })}
                                placeholder="VD: Khuyến mãi Tết" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                        <button onClick={() => setShowAdd(false)} style={{ ...btnPrimary, background: '#f3f4f6', color: '#374151' }}>
                            <X size={14} /> Hủy
                        </button>
                        <button onClick={handleSave} disabled={saving} style={btnPrimary}>
                            <Save size={14} /> {saving ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            {type === 'BASE_PRICE' && <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>Gói</th>}
                            {type === 'BAND_MULTIPLIER' && <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>Band</th>}
                            {type === 'TERM_DISCOUNT' && <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>Kỳ hạn</th>}
                            <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>Giá trị</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 500 }}>Hiệu lực</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 500 }}>Status</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>Nhãn</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 500 }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
                                Chưa có config nào — bấm &quot;Thêm giai đoạn giá&quot; để tạo
                            </td></tr>
                        ) : sorted.map(c => (
                            <tr key={c.id} style={{
                                borderBottom: '1px solid #f3f4f6',
                                opacity: isPast(c) ? 0.5 : 1,
                            }}>
                                {type === 'BASE_PRICE' && (
                                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.tier}</td>
                                )}
                                {type === 'BAND_MULTIPLIER' && (
                                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                                        {c.room_band} <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11 }}>
                                            {BAND_LABELS[c.room_band || '']}
                                        </span>
                                    </td>
                                )}
                                {type === 'TERM_DISCOUNT' && (
                                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.term_months} tháng</td>
                                )}
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                                    {type === 'BASE_PRICE' && formatVND(c.amount_vnd || 0)}
                                    {type === 'BAND_MULTIPLIER' && `×${Number(c.multiplier).toFixed(2)}`}
                                    {type === 'TERM_DISCOUNT' && `−${c.percent}%`}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: '#6b7280' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                                        <Calendar size={12} />
                                        {formatDate(c.effective_from)}
                                    </div>
                                    {c.effective_to && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginTop: 2 }}>
                                            <Clock size={12} />
                                            → {formatDate(c.effective_to)}
                                        </div>
                                    )}
                                    {!c.effective_to && (
                                        <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>∞ Vĩnh viễn</div>
                                    )}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    <StatusBadge config={c} />
                                </td>
                                <td style={{ padding: '10px 12px', color: '#6b7280', fontSize: 12 }}>
                                    {c.label || '—'}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    {!isPast(c) && (
                                        <button
                                            onClick={() => onDelete(c.id)}
                                            style={{ ...btnGhost, color: '#ef4444' }}
                                            title="Hủy kích hoạt"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
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
                const price = term === 1 ? tierData.monthly : tierData.quarterly;
                setResult({
                    price,
                    basePrice: tierData.monthly,
                    multiplier: 1,
                    discountPercent: tierData.discountPercent || 0,
                });
            }
        } catch { /* ignore */ }
        setLoading(false);
    }, [tier, band, term]);

    useEffect(() => { calculate(); }, [calculate]);

    return (
        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)', border: '1px solid #c7d2fe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Calculator size={20} color="#4f46e5" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1e1b4b' }}>Preview Calculator</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Gói</label>
                    <select style={inputStyle} value={tier} onChange={e => setTier(e.target.value)}>
                        {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Band</label>
                    <select style={inputStyle} value={band} onChange={e => setBand(e.target.value)}>
                        {BANDS.map(b => <option key={b} value={b}>{b} ({BAND_LABELS[b]})</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Kỳ hạn</label>
                    <select style={inputStyle} value={term} onChange={e => setTerm(Number(e.target.value))}>
                        {TERMS.map(t => <option key={t} value={t}>{t} tháng</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 16, color: '#9ca3af' }}>Đang tính...</div>
            ) : result && (
                <div style={{
                    padding: 20, background: 'white', borderRadius: 12,
                    border: '1px solid #e0e7ff', textAlign: 'center',
                }}>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Khách trả</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#1e40af' }}>
                        {formatVND(result.price)}
                    </div>
                    {result.discountPercent > 0 && (
                        <div style={{
                            display: 'inline-block', marginTop: 8,
                            padding: '4px 12px', background: '#dcfce7', borderRadius: 12,
                            fontSize: 12, fontWeight: 600, color: '#166534',
                        }}>
                            Giảm {result.discountPercent}% so với monthly
                        </div>
                    )}
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                        Giá gốc monthly: {formatVND(result.basePrice)}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Pricing Tab ────────────────────────────────────────────

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
        if (!confirm('Bạn muốn hủy kích hoạt config này? (set effective_to = now)')) return;
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

    if (loading) {
        return <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading pricing configs...</div>;
    }

    return (
        <div>
            {/* Header + Seed */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>
                        {configs.length} configs total · {configs.filter(c => isActive(c)).length} active
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {configs.length === 0 && (
                        <button onClick={handleSeed} disabled={seeding} style={{ ...btnPrimary, background: '#059669' }}>
                            {seeding ? 'Đang seed...' : '🌱 Seed Defaults'}
                        </button>
                    )}
                    <button onClick={fetchConfigs} style={{ ...btnPrimary, background: '#f3f4f6', color: '#374151' }}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {/* Config Sections */}
            <ConfigSection
                title="💰 Base Price (Giá gốc theo gói)"
                configs={configs}
                type="BASE_PRICE"
                onSave={handleSave}
                onDelete={handleDelete}
            />

            <ConfigSection
                title="📐 Band Multiplier (Hệ số theo quy mô phòng)"
                configs={configs}
                type="BAND_MULTIPLIER"
                onSave={handleSave}
                onDelete={handleDelete}
            />

            <ConfigSection
                title="🎫 Term Discount (Giảm giá theo kỳ hạn)"
                configs={configs}
                type="TERM_DISCOUNT"
                onSave={handleSave}
                onDelete={handleDelete}
            />

            {/* Preview Calculator */}
            <PreviewCalculator />
        </div>
    );
}
