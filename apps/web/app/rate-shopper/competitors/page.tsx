'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, Search, Trash2, Loader2, RefreshCw, Building2, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';

// ──────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────

interface Competitor {
    id: string;
    name: string;
    serpapi_property_token: string;
    tier: number;
    is_active: boolean;
    created_at: string;
}

interface SearchSuggestion {
    name: string;
    property_token: string;
    address?: string;
    rating?: number;
    thumbnail?: string;
}

// ──────────────────────────────────────────────────
// Competitor Management Page
// ──────────────────────────────────────────────────

export default function CompetitorManagementPage() {
    // State
    const [competitors, setCompetitors] = useState<Competitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchFromCache, setSearchFromCache] = useState(false);
    const [adding, setAdding] = useState<string | null>(null);
    const [removing, setRemoving] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // ──────────────────────────────────────────────────
    // Fetch competitors on mount
    // ──────────────────────────────────────────────────
    const fetchCompetitors = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/rate-shopper/competitors');
            if (!res.ok) throw new Error('Failed to load');
            const json = await res.json();
            setCompetitors(json.data || []);
        } catch {
            showNotification('error', 'Không thể tải danh sách đối thủ');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCompetitors(); }, [fetchCompetitors]);

    // ──────────────────────────────────────────────────
    // Search hotels via SerpApi (with server-side cache)
    // ──────────────────────────────────────────────────
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
        try {
            setSearching(true);
            setSuggestions([]);
            setSearchFromCache(false);
            const res = await fetch(`/api/rate-shopper/search?q=${encodeURIComponent(searchQuery.trim())}`);
            if (!res.ok) throw new Error('Search failed');
            const json = await res.json();
            setSuggestions(json.data || []);
            setSearchFromCache(json.fromCache === true);
            if ((json.data || []).length === 0) {
                showNotification('error', 'Không tìm thấy khách sạn nào');
            }
        } catch {
            showNotification('error', 'Lỗi tìm kiếm. Kiểm tra SERPAPI_API_KEY trong .env');
        } finally {
            setSearching(false);
        }
    }, [searchQuery]);

    // ──────────────────────────────────────────────────
    // Add competitor
    // ──────────────────────────────────────────────────
    const handleAdd = useCallback(async (suggestion: SearchSuggestion) => {
        try {
            setAdding(suggestion.property_token);
            const res = await fetch('/api/rate-shopper/competitors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: suggestion.name,
                    serpApiPropertyToken: suggestion.property_token,
                    tier: 1,
                }),
            });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Failed to add');
            }
            showNotification('success', `Đã thêm "${suggestion.name}"`);
            setSuggestions(prev => prev.filter(s => s.property_token !== suggestion.property_token));
            await fetchCompetitors();
        } catch (err) {
            showNotification('error', err instanceof Error ? err.message : 'Không thể thêm đối thủ');
        } finally {
            setAdding(null);
        }
    }, [fetchCompetitors]);

    // ──────────────────────────────────────────────────
    // Remove competitor (soft delete)
    // ──────────────────────────────────────────────────
    const handleRemove = useCallback(async (competitor: Competitor) => {
        if (!confirm(`Xóa "${competitor.name}" khỏi danh sách đối thủ?`)) return;
        try {
            setRemoving(competitor.id);
            const res = await fetch(`/api/rate-shopper/competitors/${competitor.id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to remove');
            showNotification('success', `Đã xóa "${competitor.name}"`);
            await fetchCompetitors();
        } catch {
            showNotification('error', 'Không thể xóa đối thủ');
        } finally {
            setRemoving(null);
        }
    }, [fetchCompetitors]);

    // ──────────────────────────────────────────────────
    // Notification helper
    // ──────────────────────────────────────────────────
    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    return (
        <div className="px-4 sm:px-8 py-4 sm:py-6">
            {/* Gradient Header — consistent with other pages */}
            <header
                className="rounded-2xl px-4 sm:px-6 py-4 text-white shadow-sm mb-6"
                style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
            >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">Quản lý đối thủ</h1>
                        <p className="text-white/70 text-sm">Thêm các khách sạn đối thủ để so sánh giá tự động hàng ngày</p>
                    </div>
                </div>
            </header>

            {/* Notification Toast */}
            {notification && (
                <div
                    style={{
                        position: 'fixed', top: 20, right: 20, zIndex: 50,
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '12px 20px', borderRadius: 12,
                        background: notification.type === 'success' ? '#ecfdf5' : '#fef2f2',
                        border: `1px solid ${notification.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                        color: notification.type === 'success' ? '#065f46' : '#991b1b',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                        animation: 'slideIn 0.3s ease',
                    }}
                >
                    {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{notification.message}</span>
                </div>
            )}

            {/* ──────────────────────────────── */}
            {/* Search Section */}
            {/* ──────────────────────────────── */}
            <div style={{
                background: '#fff', borderRadius: 16, padding: 24,
                border: '1px solid #e2e8f0', marginBottom: 24,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Search size={20} />
                    Tìm kiếm khách sạn đối thủ
                </h2>

                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Nhập tên khách sạn (VD: Vinpearl Phú Quốc, Pullman Saigon...)"
                        style={{
                            flex: 1, padding: '12px 16px', borderRadius: 10,
                            border: '1px solid #d1d5db', fontSize: '0.95rem',
                            outline: 'none', transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                        onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={searching || searchQuery.trim().length < 2}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '12px 24px', borderRadius: 10,
                            background: searching ? '#94a3b8' : '#6366f1',
                            color: '#fff', border: 'none', cursor: searching ? 'wait' : 'pointer',
                            fontWeight: 600, fontSize: '0.9rem',
                            transition: 'background 0.2s',
                        }}
                    >
                        {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                        Tìm
                    </button>
                </div>

                {/* Search Results */}
                {suggestions.length > 0 && (
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                                Tìm thấy {suggestions.length} kết quả. Click &quot;Thêm&quot; để thêm vào danh sách đối thủ.
                            </p>
                            <span style={{
                                padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600,
                                background: searchFromCache ? '#ecfdf5' : '#eff6ff',
                                color: searchFromCache ? '#065f46' : '#1e40af',
                                border: `1px solid ${searchFromCache ? '#a7f3d0' : '#bfdbfe'}`,
                                whiteSpace: 'nowrap',
                            }}>
                                {searchFromCache ? '⚡ Cache' : '🌐 SerpApi'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {suggestions.map((s) => {
                                const alreadyAdded = competitors.some(
                                    c => c.serpapi_property_token === s.property_token
                                );
                                return (
                                    <div
                                        key={s.property_token}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '12px 16px', borderRadius: 10,
                                            background: '#f8fafc', border: '1px solid #e2e8f0',
                                            transition: 'background 0.15s',
                                        }}
                                    >
                                        <Building2 size={20} style={{ color: '#6366f1', flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>{s.name}</div>
                                            {s.address && (
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {s.address}
                                                </div>
                                            )}
                                        </div>
                                        {s.rating && (
                                            <span style={{
                                                padding: '2px 8px', borderRadius: 6,
                                                background: '#fef3c7', color: '#92400e',
                                                fontSize: '0.8rem', fontWeight: 600,
                                            }}>
                                                ★ {s.rating}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleAdd(s)}
                                            disabled={alreadyAdded || adding === s.property_token}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                padding: '8px 16px', borderRadius: 8,
                                                background: alreadyAdded ? '#e2e8f0' : adding === s.property_token ? '#94a3b8' : '#10b981',
                                                color: alreadyAdded ? '#94a3b8' : '#fff',
                                                border: 'none', cursor: alreadyAdded ? 'default' : 'pointer',
                                                fontWeight: 600, fontSize: '0.85rem',
                                                transition: 'background 0.2s', flexShrink: 0,
                                            }}
                                        >
                                            {adding === s.property_token ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : alreadyAdded ? (
                                                <>✓ Đã thêm</>
                                            ) : (
                                                <><Plus size={14} /> Thêm</>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ──────────────────────────────── */}
            {/* Current Competitors List */}
            {/* ──────────────────────────────── */}
            <div style={{
                background: '#fff', borderRadius: 16, padding: 24,
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Building2 size={20} />
                        Đối thủ đang theo dõi
                        {competitors.length > 0 && (
                            <span style={{
                                padding: '2px 10px', borderRadius: 12,
                                background: '#6366f1', color: '#fff',
                                fontSize: '0.75rem', fontWeight: 700,
                            }}>
                                {competitors.length}
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={fetchCompetitors}
                        disabled={loading}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 8,
                            background: '#f1f5f9', color: '#475569',
                            border: '1px solid #e2e8f0', cursor: 'pointer',
                            fontSize: '0.85rem', fontWeight: 500,
                        }}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                        <Loader2 size={32} className="animate-spin" style={{ color: '#6366f1' }} />
                    </div>
                ) : competitors.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '48px 20px',
                        color: '#94a3b8',
                    }}>
                        <Building2 size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                        <p style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
                            Chưa có đối thủ nào
                        </p>
                        <p style={{ fontSize: '0.9rem' }}>
                            Sử dụng ô tìm kiếm ở trên để tìm và thêm khách sạn đối thủ.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {competitors.map((c) => (
                            <div
                                key={c.id}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '14px 16px', borderRadius: 10,
                                    background: '#f8fafc', border: '1px solid #e2e8f0',
                                    transition: 'background 0.15s',
                                }}
                            >
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 700, fontSize: '1rem',
                                    flexShrink: 0,
                                }}>
                                    {c.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>
                                        {c.name}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{
                                            padding: '1px 6px', borderRadius: 4, fontSize: '0.7rem',
                                            background: c.tier === 1 ? '#dbeafe' : c.tier === 2 ? '#fef3c7' : '#f1f5f9',
                                            color: c.tier === 1 ? '#1e40af' : c.tier === 2 ? '#92400e' : '#475569',
                                            fontWeight: 600,
                                        }}>
                                            Tier {c.tier}
                                        </span>
                                        <span>•</span>
                                        <span>Thêm {new Date(c.created_at).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>
                                <a
                                    href={`https://www.google.com/travel/hotels/entity/${c.serpapi_property_token}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 4,
                                        padding: '6px 12px', borderRadius: 6,
                                        background: '#f1f5f9', color: '#6366f1',
                                        textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500,
                                        border: '1px solid #e2e8f0',
                                    }}
                                >
                                    <ExternalLink size={12} /> Google
                                </a>
                                <button
                                    onClick={() => handleRemove(c)}
                                    disabled={removing === c.id}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        width: 36, height: 36, borderRadius: 8,
                                        background: removing === c.id ? '#fecaca' : '#fff',
                                        color: '#ef4444', border: '1px solid #fecaca',
                                        cursor: 'pointer', transition: 'background 0.2s',
                                    }}
                                >
                                    {removing === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Usage / Quota Info */}
            <div style={{
                marginTop: 24, padding: 16, borderRadius: 12,
                background: '#f8fafc', border: '1px solid #e2e8f0',
                fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6,
            }}>
                <strong style={{ color: '#475569' }}>💡 Cách hoạt động:</strong>
                <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                    <li>Tìm khách sạn đối thủ qua Google Hotels → Thêm vào danh sách</li>
                    <li>Hệ thống tự động thu thập giá 5 mốc: 7, 14, 30, 60, 90 ngày</li>
                    <li>Xem so sánh chi tiết tại trang <a href="/rate-shopper" style={{ color: '#6366f1', fontWeight: 500, textDecoration: 'none' }}>So sánh giá</a></li>
                    <li>Giới hạn: tối đa 20 lần quét/ngày, 200 lần/tháng</li>
                </ul>
            </div>

            <style>{`
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
