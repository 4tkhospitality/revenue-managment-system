'use client';

// ════════════════════════════════════════════════════════════════════
// Admin PLG Dashboard — Resellers, Promos, Commissions, Guide
// V2: Added Edit/Delete actions + PLG Usage Guide tab
// ════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import {
    Users, Tag, DollarSign, Plus, RefreshCw, Eye,
    Building2, Check, X, Clock, ChevronDown,
    Pencil, Trash2, BookOpen, ChevronRight, AlertTriangle, Save, CreditCard
} from 'lucide-react';
import PricingTab from './PricingTab';

// ── Types ────────────────────────────────────────────────────────

interface Reseller {
    id: string; name: string; email: string; phone: string | null;
    ref_code: string; is_active: boolean; created_at: string;
    _count: { attributions: number; promo_codes: number };
}

interface PromoCode {
    id: string; code: string; template_type: string; percent_off: number;
    description: string | null; is_active: boolean; max_redemptions: number | null;
    current_redemptions: number; expires_at: string | null; created_at: string;
    _count: { redemptions: number };
    reseller: { name: string; ref_code: string } | null;
}

interface CommissionEntry {
    id: string; type: string; amount: number; rate: number;
    description: string | null; created_at: string;
}

type TabKey = 'resellers' | 'promos' | 'commissions' | 'pricing' | 'guide';

// ── Shared Styles ───────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
    background: 'white', borderRadius: 12, border: '1px solid #e5e7eb',
    padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const btnPrimary: React.CSSProperties = {
    background: '#2563eb', color: 'white', border: 'none', borderRadius: 8,
    padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
};

const btnDanger: React.CSSProperties = {
    ...btnPrimary, background: '#ef4444',
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

// ── Stats Badge ────────────────────────────────────────────────

function StatBadge({ icon: Icon, label, value, color }: {
    icon: React.ElementType; label: string; value: number | string; color: string;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: `${color}10`, borderRadius: 8 }}>
            <Icon size={16} color={color} />
            <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
            <span style={{ fontSize: 16, fontWeight: 600, color }}>{value}</span>
        </div>
    );
}

// ── Confirm Dialog ─────────────────────────────────────────────

function ConfirmDialog({ message, onConfirm, onCancel }: {
    message: string; onConfirm: () => void; onCancel: () => void;
}) {
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
            <div style={{ ...cardStyle, maxWidth: 400, textAlign: 'center' }}>
                <AlertTriangle size={40} color="#f59e0b" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 15, marginBottom: 20, color: '#374151' }}>{message}</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button onClick={onCancel} style={{ ...btnPrimary, background: '#f3f4f6', color: '#374151' }}>Hủy</button>
                    <button onClick={onConfirm} style={btnDanger}>Xác nhận</button>
                </div>
            </div>
        </div>
    );
}

// ── Resellers Tab ──────────────────────────────────────────────

function ResellersTab() {
    const [resellers, setResellers] = useState<Reseller[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const fetchResellers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/resellers');
            if (!res.ok) { setResellers([]); setLoading(false); return; }
            setResellers(await res.json());
        } catch { setResellers([]); }
        setLoading(false);
    }, []);

    useEffect(() => { fetchResellers(); }, [fetchResellers]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        await fetch('/api/admin/resellers', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });
        setForm({ name: '', email: '', phone: '' });
        setShowCreate(false);
        fetchResellers();
    }

    function startEdit(r: Reseller) {
        setEditingId(r.id);
        setEditForm({ name: r.name, email: r.email, phone: r.phone || '' });
    }

    async function handleSaveEdit() {
        if (!editingId) return;
        await fetch(`/api/admin/resellers?id=${editingId}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        });
        setEditingId(null);
        fetchResellers();
    }

    async function handleDelete(id: string) {
        await fetch(`/api/admin/resellers?id=${id}`, { method: 'DELETE' });
        setDeleteConfirm(null);
        fetchResellers();
    }

    async function handleToggleActive(r: Reseller) {
        await fetch(`/api/admin/resellers?id=${r.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !r.is_active }),
        });
        fetchResellers();
    }

    return (
        <div>
            {deleteConfirm && (
                <ConfirmDialog
                    message="Bạn có chắc muốn vô hiệu hóa reseller này? (Soft delete — có thể kích hoạt lại)"
                    onConfirm={() => handleDelete(deleteConfirm)}
                    onCancel={() => setDeleteConfirm(null)}
                />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    <StatBadge icon={Users} label="Tổng" value={resellers.length} color="#2563eb" />
                    <StatBadge icon={Check} label="Active" value={resellers.filter(r => r.is_active).length} color="#16a34a" />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={fetchResellers} style={{ ...btnPrimary, background: '#f3f4f6', color: '#374151' }}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button onClick={() => setShowCreate(!showCreate)} style={btnPrimary}>
                        <Plus size={14} /> Thêm Reseller
                    </button>
                </div>
            </div>

            {showCreate && (
                <form onSubmit={handleCreate} style={{ ...cardStyle, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Tên</label>
                        <input style={inputStyle} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Reseller name" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Email</label>
                        <input style={inputStyle} type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>SĐT</label>
                        <input style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Optional" />
                    </div>
                    <button type="submit" style={btnPrimary}>Tạo</button>
                </form>
            )}

            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Tên</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Ref Code</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Email</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>Hotels</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>Promos</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>Status</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Loading...</td></tr>
                        ) : resellers.length === 0 ? (
                            <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Chưa có reseller nào</td></tr>
                        ) : resellers.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '12px 16px' }}>
                                    {editingId === r.id ? (
                                        <input style={{ ...inputStyle, padding: '4px 8px' }} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                    ) : (
                                        <span style={{ fontWeight: 500 }}>{r.name}</span>
                                    )}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                    <code style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>{r.ref_code}</code>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                    {editingId === r.id ? (
                                        <input style={{ ...inputStyle, padding: '4px 8px' }} value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                                    ) : (
                                        <span style={{ color: '#6b7280' }}>{r.email}</span>
                                    )}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>{r._count.attributions}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>{r._count.promo_codes}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    <button onClick={() => handleToggleActive(r)} style={{
                                        ...btnGhost,
                                        padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                                        background: r.is_active ? '#dcfce7' : '#fee2e2',
                                        color: r.is_active ? '#166534' : '#991b1b',
                                    }}>
                                        {r.is_active ? <Check size={12} /> : <X size={12} />}
                                        {r.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                        {editingId === r.id ? (
                                            <>
                                                <button onClick={handleSaveEdit} style={{ ...btnGhost, color: '#16a34a' }} title="Lưu">
                                                    <Save size={14} /> Lưu
                                                </button>
                                                <button onClick={() => setEditingId(null)} style={btnGhost} title="Hủy">
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startEdit(r)} style={btnGhost} title="Sửa">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => setDeleteConfirm(r.id)} style={{ ...btnGhost, color: '#ef4444' }} title="Xóa">
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Promos Tab ─────────────────────────────────────────────────

function PromosTab() {
    const [promos, setPromos] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({
        code: '', templateType: 'GLOBAL', percentOff: 10, description: '',
        maxRedemptions: '', expiresAt: '',
    });
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const fetchPromos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/promos');
            if (!res.ok) { setPromos([]); setLoading(false); return; }
            setPromos(await res.json());
        } catch { setPromos([]); }
        setLoading(false);
    }, []);

    useEffect(() => { fetchPromos(); }, [fetchPromos]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        await fetch('/api/admin/promos', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...form, percentOff: Number(form.percentOff),
                maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : undefined,
                expiresAt: form.expiresAt ? new Date(form.expiresAt) : undefined,
            }),
        });
        setForm({ code: '', templateType: 'GLOBAL', percentOff: 10, description: '', maxRedemptions: '', expiresAt: '' });
        setShowCreate(false);
        fetchPromos();
    }

    async function handleToggleActive(p: PromoCode) {
        await fetch(`/api/admin/promos?id=${p.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !p.is_active }),
        });
        fetchPromos();
    }

    async function handleDelete(id: string) {
        await fetch(`/api/admin/promos?id=${id}`, { method: 'DELETE' });
        setDeleteConfirm(null);
        fetchPromos();
    }

    return (
        <div>
            {deleteConfirm && (
                <ConfirmDialog
                    message="Bạn có chắc muốn vô hiệu hóa mã khuyến mãi này?"
                    onConfirm={() => handleDelete(deleteConfirm)}
                    onCancel={() => setDeleteConfirm(null)}
                />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    <StatBadge icon={Tag} label="Tổng mã" value={promos.length} color="#7c3aed" />
                    <StatBadge icon={Check} label="Active" value={promos.filter(p => p.is_active).length} color="#16a34a" />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={fetchPromos} style={{ ...btnPrimary, background: '#f3f4f6', color: '#374151' }}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button onClick={() => setShowCreate(!showCreate)} style={btnPrimary}>
                        <Plus size={14} /> Tạo Mã
                    </button>
                </div>
            </div>

            {showCreate && (
                <form onSubmit={handleCreate} style={{ ...cardStyle, marginBottom: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Mã Code</label>
                            <input style={inputStyle} required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="VD: WELCOME20" />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Loại</label>
                            <select style={inputStyle} value={form.templateType} onChange={e => setForm({ ...form, templateType: e.target.value })}>
                                <option value="GLOBAL">Global</option>
                                <option value="RESELLER">Reseller</option>
                                <option value="CAMPAIGN">Campaign</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Giảm %</label>
                            <input style={inputStyle} type="number" min={1} max={100} required value={form.percentOff} onChange={e => setForm({ ...form, percentOff: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Mô tả</label>
                            <input style={inputStyle} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Giới hạn sử dụng</label>
                            <input style={inputStyle} type="number" value={form.maxRedemptions} onChange={e => setForm({ ...form, maxRedemptions: e.target.value })} placeholder="Unlimited" />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Hết hạn</label>
                            <input style={inputStyle} type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" style={btnPrimary}>Tạo Mã</button>
                    </div>
                </form>
            )}

            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Mã</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>Loại</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>Giảm</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>Đã dùng</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Reseller</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>Hết hạn</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>Status</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Loading...</td></tr>
                        ) : promos.length === 0 ? (
                            <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Chưa có mã nào</td></tr>
                        ) : promos.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '12px 16px' }}>
                                    <code style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 13 }}>{p.code}</code>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    <span style={{
                                        padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                                        background: p.template_type === 'CAMPAIGN' ? '#ede9fe' : p.template_type === 'GLOBAL' ? '#dbeafe' : '#fef3c7',
                                        color: p.template_type === 'CAMPAIGN' ? '#5b21b6' : p.template_type === 'GLOBAL' ? '#1d4ed8' : '#92400e',
                                    }}>{p.template_type}</span>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#16a34a' }}>{Number(p.percent_off)}%</td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    {p.current_redemptions}{p.max_redemptions ? `/${p.max_redemptions}` : ''}
                                </td>
                                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{p.reseller?.name || '—'}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
                                    {p.expires_at ? new Date(p.expires_at).toLocaleDateString('vi-VN') : '∞'}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    <button onClick={() => handleToggleActive(p)} style={{
                                        ...btnGhost,
                                        padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                                        background: p.is_active ? '#dcfce7' : '#fee2e2',
                                        color: p.is_active ? '#166534' : '#991b1b',
                                    }}>
                                        {p.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    <button onClick={() => setDeleteConfirm(p.id)} style={{ ...btnGhost, color: '#ef4444' }} title="Vô hiệu hóa">
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Commissions Tab ────────────────────────────────────────────

function CommissionsTab() {
    const [commissions, setCommissions] = useState<CommissionEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCommissions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/commissions');
            if (!res.ok) { setCommissions([]); setLoading(false); return; }
            setCommissions(await res.json());
        } catch { setCommissions([]); }
        setLoading(false);
    }, []);

    useEffect(() => { fetchCommissions(); }, [fetchCommissions]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <StatBadge icon={DollarSign} label="Tổng giao dịch" value={commissions.length} color="#059669" />
                <button onClick={fetchCommissions} style={{ ...btnPrimary, background: '#f3f4f6', color: '#374151' }}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Loại</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500 }}>Tỉ lệ</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500 }}>Số tiền</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Mô tả</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Ngày</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Loading...</td></tr>
                        ) : commissions.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Chưa có giao dịch hoa hồng nào</td></tr>
                        ) : commissions.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '12px 16px' }}>
                                    <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500, background: '#dbeafe', color: '#1d4ed8' }}>
                                        {c.type}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500 }}>{c.rate}%</td>
                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                                    {Number(c.amount).toLocaleString('vi-VN')}₫
                                </td>
                                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{c.description || '—'}</td>
                                <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 13 }}>
                                    {new Date(c.created_at).toLocaleDateString('vi-VN')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Guide Tab ──────────────────────────────────────────────────

function GuideSection({ title, icon: Icon, color, children }: {
    title: string; icon: React.ElementType; color: string; children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ ...cardStyle, padding: 0, marginBottom: 12 }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '16px 20px', border: 'none', background: 'white', cursor: 'pointer',
                    borderRadius: 12, fontSize: 15, fontWeight: 600, color: '#1f2937',
                }}
            >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={color} />
                </div>
                <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
                <ChevronRight size={18} color="#9ca3af" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {open && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f3f4f6', lineHeight: 1.8 }}>
                    {children}
                </div>
            )}
        </div>
    );
}

function StepItem({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <div style={{
                width: 28, height: 28, borderRadius: '50%', background: '#2563eb',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 2,
            }}>{number}</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{children}</div>
            </div>
        </div>
    );
}

function GuideTab() {
    return (
        <div>
            <div style={{ ...cardStyle, marginBottom: 20, background: 'linear-gradient(135deg, #2563eb08, #7c3aed08)', border: '1px solid #e0e7ff' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#1e40af' }}>
                    📖 Hướng dẫn sử dụng PLG Admin
                </h2>
                <p style={{ color: '#6b7280', margin: 0, fontSize: 14, lineHeight: 1.6 }}>
                    PLG (Product-Led Growth) là hệ thống quản lý đại lý (Resellers), mã khuyến mãi (Promo Codes),
                    và hoa hồng (Commissions). Dưới đây là hướng dẫn chi tiết từng bước.
                </p>
            </div>

            <GuideSection title="1. Quản lý Resellers (Đại Lý)" icon={Users} color="#2563eb">
                <div style={{ padding: '12px 0' }}>
                    <p style={{ fontSize: 14, color: '#374151', marginTop: 12 }}>
                        <strong>Reseller là ai?</strong> Là đối tác giới thiệu khách hàng (hotels) sử dụng hệ thống RMS.
                        Mỗi reseller được cấp một <strong>Ref Code</strong> (mã giới thiệu) tự động, dùng để tracking attribution.
                    </p>

                    <StepItem number={1} title="Tạo Reseller mới">
                        Bấm nút <strong style={{ color: '#2563eb' }}>+ Thêm Reseller</strong> → Điền tên, email, SĐT → Bấm <strong>Tạo</strong>.
                        <br />Hệ thống tự sinh mã Ref Code (VD: <code style={{ background: '#f3f4f6', padding: '1px 6px', borderRadius: 4 }}>RESEZH</code>).
                    </StepItem>

                    <StepItem number={2} title="Sửa thông tin Reseller">
                        Bấm icon <strong>✏️ bút chì</strong> trên dòng reseller cần sửa → Thay đổi tên hoặc email → Bấm <strong style={{ color: '#16a34a' }}>💾 Lưu</strong>.
                    </StepItem>

                    <StepItem number={3} title="Bật/Tắt trạng thái Active">
                        Bấm vào badge <strong style={{ color: '#166534', background: '#dcfce7', padding: '1px 8px', borderRadius: 8, fontSize: 12 }}>Active</strong> hoặc <strong style={{ color: '#991b1b', background: '#fee2e2', padding: '1px 8px', borderRadius: 8, fontSize: 12 }}>Inactive</strong> để toggle.
                        Reseller inactive sẽ không còn hoạt động nhưng dữ liệu vẫn được giữ.
                    </StepItem>

                    <StepItem number={4} title="Xóa Reseller (Soft Delete)">
                        Bấm icon <strong style={{ color: '#ef4444' }}>🗑️ thùng rác</strong> → Xác nhận → Reseller chuyển thành Inactive.
                        <br /><em>Lưu ý: Không xóa hẳn khỏi DB để bảo toàn lịch sử attribution và commissions.</em>
                    </StepItem>

                    <div style={{ marginTop: 16, padding: '12px 16px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                        <strong style={{ color: '#1d4ed8', fontSize: 13 }}>💡 Mẹo:</strong>
                        <span style={{ fontSize: 13, color: '#1e40af' }}> Cột <strong>Hotels</strong> cho biết reseller đang quản lý bao nhiêu hotel. Cột <strong>Promos</strong> cho biết số mã khuyến mãi liên kết.</span>
                    </div>
                </div>
            </GuideSection>

            <GuideSection title="2. Quản lý Promo Codes (Mã Khuyến Mãi)" icon={Tag} color="#7c3aed">
                <div style={{ padding: '12px 0' }}>
                    <p style={{ fontSize: 14, color: '#374151', marginTop: 12 }}>
                        <strong>Promo Code là gì?</strong> Là mã giảm giá cho khách hàng khi đăng ký/nâng cấp gói dịch vụ.
                        Có 3 loại mã:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
                        <div style={{ padding: 12, background: '#dbeafe', borderRadius: 8, textAlign: 'center' }}>
                            <div style={{ fontWeight: 600, color: '#1d4ed8', fontSize: 13 }}>GLOBAL</div>
                            <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 4 }}>Dùng chung cho tất cả</div>
                        </div>
                        <div style={{ padding: 12, background: '#fef3c7', borderRadius: 8, textAlign: 'center' }}>
                            <div style={{ fontWeight: 600, color: '#92400e', fontSize: 13 }}>RESELLER</div>
                            <div style={{ fontSize: 12, color: '#d97706', marginTop: 4 }}>Gắn với reseller cụ thể</div>
                        </div>
                        <div style={{ padding: 12, background: '#ede9fe', borderRadius: 8, textAlign: 'center' }}>
                            <div style={{ fontWeight: 600, color: '#5b21b6', fontSize: 13 }}>CAMPAIGN</div>
                            <div style={{ fontSize: 12, color: '#7c3aed', marginTop: 4 }}>Chiến dịch marketing</div>
                        </div>
                    </div>

                    <StepItem number={1} title="Tạo mã mới">
                        Bấm <strong style={{ color: '#2563eb' }}>+ Tạo Mã</strong> → Điền:
                        <br />• <strong>Mã Code</strong>: VD <code style={{ background: '#f3f4f6', padding: '1px 6px', borderRadius: 4 }}>WELCOME20</code> (tự động viết hoa)
                        <br />• <strong>Loại</strong>: Global / Reseller / Campaign
                        <br />• <strong>Giảm %</strong>: Phần trăm giảm giá (1-100)
                        <br />• <strong>Giới hạn sử dụng</strong>: Tối đa bao nhiêu lần dùng (bỏ trống = không giới hạn)
                        <br />• <strong>Hết hạn</strong>: Ngày hết hạn (bỏ trống = không hết hạn)
                    </StepItem>

                    <StepItem number={2} title="Bật/Tắt mã">
                        Bấm vào badge <strong>Active/Inactive</strong> để toggle. Mã inactive không thể sử dụng nhưng vẫn được giữ lại.
                    </StepItem>

                    <StepItem number={3} title="Vô hiệu hóa mã">
                        Bấm icon <strong style={{ color: '#ef4444' }}>🗑️</strong> → Xác nhận → Mã chuyển thành Inactive.
                    </StepItem>

                    <div style={{ marginTop: 16, padding: '12px 16px', background: '#faf5ff', borderRadius: 8, border: '1px solid #e9d5ff' }}>
                        <strong style={{ color: '#7c3aed', fontSize: 13 }}>💡 Quy tắc &quot;Best Discount Wins&quot;:</strong>
                        <span style={{ fontSize: 13, color: '#6d28d9' }}> Khi hotel có nhiều mã giảm giá, hệ thống tự chọn mã có giảm giá CAO NHẤT. Ưu tiên: Campaign &gt; Global &gt; Reseller.</span>
                    </div>
                </div>
            </GuideSection>

            <GuideSection title="3. Hoa hồng (Commissions)" icon={DollarSign} color="#059669">
                <div style={{ padding: '12px 0' }}>
                    <p style={{ fontSize: 14, color: '#374151', marginTop: 12 }}>
                        <strong>Commission là gì?</strong> Là hoa hồng trả cho reseller khi hotel họ giới thiệu thanh toán phí dịch vụ.
                        Hoa hồng được tính tự động theo <strong>tỉ lệ %</strong> (commission rate) trong hợp đồng reseller.
                    </p>

                    <div style={{ marginTop: 16 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937', marginBottom: 8 }}>Cách tính:</div>
                        <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, border: '1px solid #bbf7d0', fontFamily: 'monospace', fontSize: 13 }}>
                            Commission = Doanh thu × Commission Rate (%)
                            <br /><br />
                            VD: Hotel trả 5.000.000₫/tháng, rate = 15%
                            <br />
                            → Reseller nhận: 750.000₫
                        </div>
                    </div>

                    <div style={{ marginTop: 16, padding: '12px 16px', background: '#ecfdf5', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                        <strong style={{ color: '#059669', fontSize: 13 }}>📊 Tab này hiện tại:</strong>
                        <span style={{ fontSize: 13, color: '#065f46' }}> Hiển thị lịch sử tất cả giao dịch hoa hồng. Bao gồm loại, tỉ lệ, số tiền, mô tả, và ngày tạo.</span>
                    </div>
                </div>
            </GuideSection>

            <GuideSection title="4. Quy trình hoàn chỉnh (Full PLG Flow)" icon={ChevronRight} color="#f59e0b">
                <div style={{ padding: '12px 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                        {[
                            { step: '1', text: 'Tạo Reseller (Tab Resellers)', color: '#2563eb', desc: 'Cung cấp tên, email → Nhận Ref Code tự động' },
                            { step: '2', text: 'Tạo Promo Code cho Reseller (Tab Promo Codes)', color: '#7c3aed', desc: 'Loại RESELLER, gắn vào reseller vừa tạo' },
                            { step: '3', text: 'Reseller chia sẻ mã cho khách hàng', color: '#f59e0b', desc: 'Hotel nhập mã khi đăng ký → Tự động attribution' },
                            { step: '4', text: 'Hotel áp dụng mã → Nhận giảm giá', color: '#16a34a', desc: 'Hệ thống ghi nhận redemption, tính discount' },
                            { step: '5', text: 'Hoa hồng tự động tính (Tab Commissions)', color: '#059669', desc: 'Khi hotel thanh toán → Commission cho reseller' },
                        ].map(item => (
                            <div key={item.step} style={{
                                display: 'flex', alignItems: 'flex-start', gap: 12,
                                padding: '12px 16px', background: '#fafafa', borderRadius: 8,
                                borderLeft: `3px solid ${item.color}`,
                            }}>
                                <div style={{
                                    width: 24, height: 24, borderRadius: '50%', background: item.color,
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                                }}>{item.step}</div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>{item.text}</div>
                                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </GuideSection>

            <GuideSection title="5. Lưu ý quan trọng" icon={AlertTriangle} color="#ef4444">
                <div style={{ padding: '12px 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                        <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, fontSize: 13, color: '#991b1b' }}>
                            ⚠️ <strong>Xóa = Soft Delete:</strong> Reseller và Promo chỉ bị deactivate, không xóa khỏi database. Điều này bảo toàn lịch sử và dữ liệu attribution.
                        </div>
                        <div style={{ padding: '10px 14px', background: '#fffbeb', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                            ⚠️ <strong>Ref Code không đổi:</strong> Mỗi reseller có 1 mã ref code cố định, không thể thay đổi sau khi tạo.
                        </div>
                        <div style={{ padding: '10px 14px', background: '#eff6ff', borderRadius: 8, fontSize: 13, color: '#1e40af' }}>
                            ℹ️ <strong>Audit logging:</strong> Mọi thao tác (tạo, sửa, xóa) đều được ghi nhận vào audit log để truy vết.
                        </div>
                        <div style={{ padding: '10px 14px', background: '#ecfdf5', borderRadius: 8, fontSize: 13, color: '#065f46' }}>
                            ✅ <strong>Quyền Admin:</strong> Chỉ user đã đăng nhập với quyền admin mới truy cập được trang này.
                        </div>
                    </div>
                </div>
            </GuideSection>
        </div>
    );
}

// ── Main Dashboard ─────────────────────────────────────────────

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'resellers', label: 'Resellers', icon: Users },
    { key: 'promos', label: 'Promo Codes', icon: Tag },
    { key: 'commissions', label: 'Commissions', icon: DollarSign },
    { key: 'pricing', label: 'Pricing', icon: CreditCard },
    { key: 'guide', label: 'Hướng dẫn', icon: BookOpen },
];

export default function PLGAdminDashboard() {
    const [activeTab, setActiveTab] = useState<TabKey>('resellers');

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
                    <Building2 style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} size={24} />
                    PLG Admin
                </h1>
                <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
                    Quản lý Resellers, Mã khuyến mãi, và Hoa hồng
                </p>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex', gap: 4, marginBottom: 24,
                background: '#f3f4f6', borderRadius: 10, padding: 4,
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1, padding: '10px 16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            border: 'none', borderRadius: 8,
                            fontSize: 14, fontWeight: 500, cursor: 'pointer',
                            background: activeTab === tab.key ? 'white' : 'transparent',
                            color: activeTab === tab.key ? '#111827' : '#6b7280',
                            boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s',
                        }}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'resellers' && <ResellersTab />}
            {activeTab === 'promos' && <PromosTab />}
            {activeTab === 'commissions' && <CommissionsTab />}
            {activeTab === 'pricing' && <PricingTab />}
            {activeTab === 'guide' && <GuideTab />}
        </div>
    );
}
