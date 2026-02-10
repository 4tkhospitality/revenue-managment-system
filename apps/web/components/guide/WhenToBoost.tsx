'use client';

import { useState, useEffect, useMemo } from 'react';
import { Zap, Calendar, TrendingDown, TrendingUp, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BoostDecision {
    id: string;
    date: string;
    channel: 'booking' | 'agoda';
    program: string;
    reason: string;
    expectedUplift: number;
    actualResult?: string;
    status: 'active' | 'completed' | 'cancelled';
}

const STORAGE_KEY = 'rms_boost_decisions';

const SCENARIOS = [
    {
        id: 'low_occ',
        icon: <TrendingDown className="w-4 h-4 text-red-500" />,
        title: 'Occupancy thấp (< 50%) trong 7-14 ngày tới',
        recommendation: 'Bật Visibility Booster (Booking) hoặc AGP (Agoda) cho các ngày gap.',
        urgency: 'high' as const,
    },
    {
        id: 'competitor_price',
        icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
        title: 'Đối thủ giảm giá mạnh (Rate Shopper alert)',
        recommendation: 'Cân nhắc Mobile Rate hoặc Last-Minute Deal thay vì giảm giá trực tiếp.',
        urgency: 'medium' as const,
    },
    {
        id: 'low_season',
        icon: <Calendar className="w-4 h-4 text-blue-500" />,
        title: 'Mùa thấp điểm sắp tới',
        recommendation: 'Tham gia Genius Program (Booking) để tiếp cận segment "Genius travelers" có sẵn demand.',
        urgency: 'medium' as const,
    },
    {
        id: 'new_property',
        icon: <Zap className="w-4 h-4 text-purple-500" />,
        title: 'Property mới / Review Score thấp',
        recommendation: 'Ưu tiên Preferred Partner (badge uy tín) + trả lời 100% reviews + push giá cạnh tranh.',
        urgency: 'high' as const,
    },
    {
        id: 'high_cancel',
        icon: <TrendingDown className="w-4 h-4 text-red-500" />,
        title: 'Cancellation rate cao (> 30%)',
        recommendation: 'Thêm Non-Refundable rate plan với giá thấp hơn 10-15% để giữ Net Bookings.',
        urgency: 'high' as const,
    },
    {
        id: 'good_perf',
        icon: <TrendingUp className="w-4 h-4 text-emerald-500" />,
        title: 'Hiệu suất tốt, muốn đẩy thêm',
        recommendation: 'Double-down: tăng Visibility Booster commission hoặc join thêm campaign Agoda.',
        urgency: 'low' as const,
    },
];

export function WhenToBoost() {
    const [decisions, setDecisions] = useState<BoostDecision[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form state
    const [formChannel, setFormChannel] = useState<'booking' | 'agoda'>('booking');
    const [formProgram, setFormProgram] = useState('');
    const [formReason, setFormReason] = useState('');
    const [formUplift, setFormUplift] = useState(10);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setDecisions(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
    }, [decisions]);

    const addDecision = () => {
        if (!formProgram || !formReason) return;
        const newDecision: BoostDecision = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            channel: formChannel,
            program: formProgram,
            reason: formReason,
            expectedUplift: formUplift,
            status: 'active',
        };
        setDecisions(prev => [newDecision, ...prev]);
        setShowAddForm(false);
        setFormProgram('');
        setFormReason('');
        setFormUplift(10);
    };

    const toggleStatus = (id: string) => {
        setDecisions(prev => prev.map(d =>
            d.id === id ? { ...d, status: d.status === 'active' ? 'completed' : 'active' } : d
        ));
    };

    const removeDecision = (id: string) => {
        setDecisions(prev => prev.filter(d => d.id !== id));
    };

    const activeCount = decisions.filter(d => d.status === 'active').length;

    return (
        <div className="space-y-6">
            {/* When to Boost Guide */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="mb-5">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-600" />
                        Khi nào nên Boost?
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Nguyên tắc Boost hiệu quả dựa trên tình huống thực tế</p>
                </div>

                <div className="space-y-3">
                    {SCENARIOS.map(s => (
                        <div key={s.id} className={`flex items-start gap-3 p-3 rounded-lg border ${s.urgency === 'high' ? 'border-red-100 bg-red-50/30' :
                            s.urgency === 'medium' ? 'border-amber-100 bg-amber-50/30' :
                                'border-gray-100 bg-gray-50/30'
                            }`}>
                            {s.icon}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800">{s.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">→ {s.recommendation}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${s.urgency === 'high' ? 'bg-red-100 text-red-600' :
                                s.urgency === 'medium' ? 'bg-amber-100 text-amber-600' :
                                    'bg-gray-100 text-gray-500'
                                }`}>
                                {s.urgency === 'high' ? 'Urgent' : s.urgency === 'medium' ? 'Medium' : 'Low'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Decision Log */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">📋 Decision Log</h3>
                        <p className="text-xs text-gray-500">Ghi lại quyết định Boost để theo dõi & rút kinh nghiệm</p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Ghi nhận
                    </button>
                </div>

                {/* Add Form */}
                {showAddForm && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-600">Kênh</label>
                                <select value={formChannel} onChange={(e) => setFormChannel(e.target.value as 'booking' | 'agoda')}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                                    <option value="booking">Booking.com</option>
                                    <option value="agoda">Agoda</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600">Chương trình</label>
                                <input value={formProgram} onChange={(e) => setFormProgram(e.target.value)}
                                    placeholder="Genius, Preferred, VB..."
                                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600">Lý do quyết định</label>
                            <input value={formReason} onChange={(e) => setFormReason(e.target.value)}
                                placeholder="Occupancy thấp tháng 3, gap dates..."
                                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                        </div>
                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-gray-600">Uplift kỳ vọng (%)</label>
                                <input type="number" value={formUplift} onChange={(e) => setFormUplift(Number(e.target.value))}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <button onClick={addDecision} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                                Lưu
                            </button>
                            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">
                                Hủy
                            </button>
                        </div>
                    </div>
                )}

                {/* Decision List */}
                {decisions.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        Chưa có quyết định nào. Nhấn &quot;Ghi nhận&quot; để bắt đầu.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {decisions.map(d => (
                            <div key={d.id} className={`flex items-center gap-3 p-3 rounded-lg border ${d.status === 'completed' ? 'bg-gray-50 border-gray-100' : 'border-gray-200'}`}>
                                <button onClick={() => toggleStatus(d.id)} className="shrink-0">
                                    {d.status === 'completed' ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                    )}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${d.channel === 'booking' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                            {d.channel === 'booking' ? 'BK' : 'AG'}
                                        </span>
                                        <span className={`text-sm font-medium ${d.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                            {d.program}
                                        </span>
                                        <span className="text-xs text-gray-400">{d.date}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{d.reason} • Kỳ vọng +{d.expectedUplift}%</p>
                                </div>
                                <button onClick={() => removeDecision(d.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {activeCount > 0 && (
                    <div className="mt-3 text-xs text-gray-400 text-right">
                        {activeCount} quyết định đang active
                    </div>
                )}
            </div>
        </div>
    );
}
