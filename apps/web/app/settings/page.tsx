'use client';

import { useState, useEffect } from 'react';
import { Save, Hotel, AlertCircle, CheckCircle } from 'lucide-react';

// Ladder presets
const LADDER_PRESETS = {
    conservative: { name: '⚡ Conservative (±10%)', steps: [-0.10, -0.05, 0, 0.05, 0.10] },
    standard: { name: '🎯 Standard (±20%)', steps: [-0.20, -0.10, -0.05, 0, 0.05, 0.10, 0.20] },
    aggressive: { name: '🚀 Aggressive (±30%)', steps: [-0.30, -0.20, -0.10, 0, 0.10, 0.20, 0.30] },
};

const TIMEZONES = [
    { value: 'Asia/Ho_Chi_Minh', label: 'Việt Nam (GMT+7)' },
    { value: 'Asia/Bangkok', label: 'Thái Lan (GMT+7)' },
    { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
    { value: 'Asia/Jakarta', label: 'Indonesia (GMT+7)' },
    { value: 'Asia/Kuala_Lumpur', label: 'Malaysia (GMT+8)' },
    { value: 'Asia/Tokyo', label: 'Nhật Bản (GMT+9)' },
    { value: 'UTC', label: 'UTC (GMT+0)' },
];

interface HotelSettings {
    name: string;
    capacity: number;
    currency: string;
    defaultBaseRate: number;
    minRate: number;
    maxRate: number;
    timezone: string;
    fiscalStartDay: number;
    ladderPreset: 'conservative' | 'standard' | 'aggressive';
}

const getHotelId = () => {
    return process.env.NEXT_PUBLIC_DEFAULT_HOTEL_ID || '';
};

// Format number with dots as thousands separator (Vietnamese style)
const formatNumberDisplay = (num: number): string => {
    return num.toLocaleString('vi-VN');
};

// Parse formatted string back to number
const parseFormattedNumber = (str: string): number => {
    // Remove all dots and spaces
    const cleaned = str.replace(/\./g, '').replace(/\s/g, '');
    return parseInt(cleaned) || 0;
};

export default function SettingsPage() {
    const [settings, setSettings] = useState<HotelSettings>({
        name: '',
        capacity: 240,
        currency: 'VND',
        defaultBaseRate: 1500000,
        minRate: 500000,
        maxRate: 5000000,
        timezone: 'Asia/Ho_Chi_Minh',
        fiscalStartDay: 1,
        ladderPreset: 'standard',
    });

    // Display values as formatted strings
    const [displayValues, setDisplayValues] = useState({
        defaultBaseRate: '1.500.000',
        minRate: '500.000',
        maxRate: '5.000.000',
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Update display values when settings change
    useEffect(() => {
        setDisplayValues({
            defaultBaseRate: formatNumberDisplay(settings.defaultBaseRate),
            minRate: formatNumberDisplay(settings.minRate),
            maxRate: formatNumberDisplay(settings.maxRate),
        });
    }, [settings.defaultBaseRate, settings.minRate, settings.maxRate]);

    // Load settings on mount
    useEffect(() => {
        async function loadSettings() {
            try {
                const res = await fetch(`/api/settings?hotelId=${getHotelId()}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.hotel) {
                        // Determine ladder preset from stored steps
                        let ladderPreset: 'conservative' | 'standard' | 'aggressive' = 'standard';
                        if (data.hotel.ladder_steps) {
                            const steps = JSON.parse(data.hotel.ladder_steps);
                            if (steps.length === 5) ladderPreset = 'conservative';
                            else if (steps.length === 7 && steps.includes(-0.3)) ladderPreset = 'aggressive';
                        }

                        const newSettings = {
                            name: data.hotel.name || '',
                            capacity: data.hotel.capacity || 240,
                            currency: data.hotel.currency || 'VND',
                            defaultBaseRate: Number(data.hotel.default_base_rate) || 1500000,
                            minRate: Number(data.hotel.min_rate) || 500000,
                            maxRate: Number(data.hotel.max_rate) || 5000000,
                            timezone: data.hotel.timezone || 'Asia/Ho_Chi_Minh',
                            fiscalStartDay: data.hotel.fiscal_start_day || 1,
                            ladderPreset: ladderPreset,
                        };
                        setSettings(newSettings);
                    }
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hotelId: getHotelId(),
                    ...settings,
                    ladderSteps: JSON.stringify(LADDER_PRESETS[settings.ladderPreset].steps),
                }),
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Đã lưu cài đặt thành công!' });
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Lưu thất bại' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi kết nối server' });
        } finally {
            setSaving(false);
        }
    };

    const handlePriceChange = (field: 'defaultBaseRate' | 'minRate' | 'maxRate', value: string) => {
        // Allow only digits and dots
        const sanitized = value.replace(/[^\d.]/g, '');
        setDisplayValues(prev => ({ ...prev, [field]: sanitized }));
    };

    const handlePriceBlur = (field: 'defaultBaseRate' | 'minRate' | 'maxRate') => {
        const numValue = parseFormattedNumber(displayValues[field]);
        setSettings(prev => ({ ...prev, [field]: numValue }));
        setDisplayValues(prev => ({ ...prev, [field]: formatNumberDisplay(numValue) }));
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center">
                <div className="text-slate-400">Đang tải cài đặt...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
                    <Hotel className="w-7 h-7 text-blue-500" />
                    Cài đặt Khách sạn
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Nhập thông tin khách sạn để hệ thống tính toán chính xác
                </p>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
                    ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                    : 'bg-rose-500/20 border border-rose-500 text-rose-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {/* Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
                {/* Hotel Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Tên khách sạn
                    </label>
                    <input
                        type="text"
                        value={settings.name}
                        onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="VD: Sunset Beach Resort"
                    />
                </div>

                {/* Capacity */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Số phòng (Capacity)
                    </label>
                    <input
                        type="number"
                        value={settings.capacity}
                        onChange={(e) => setSettings({ ...settings, capacity: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min={1}
                        max={10000}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Tổng số phòng có thể bán của khách sạn
                    </p>
                </div>

                {/* Currency */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Đơn vị tiền tệ
                    </label>
                    <select
                        value={settings.currency}
                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="VND">VND - Việt Nam Đồng</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                    </select>
                </div>

                {/* Advanced Settings Section */}
                <div className="border-t border-slate-700 pt-6">
                    <h3 className="text-lg font-semibold text-slate-50 mb-4">⚙️ Cài đặt nâng cao</h3>

                    {/* Timezone */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Múi giờ (Timezone)
                        </label>
                        <select
                            value={settings.timezone}
                            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {TIMEZONES.map((tz) => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                            Ảnh hưởng đến tính toán OTB theo ngày
                        </p>
                    </div>

                    {/* Fiscal Start Day */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Ngày bắt đầu tháng tài chính
                        </label>
                        <input
                            type="number"
                            value={settings.fiscalStartDay}
                            onChange={(e) => setSettings({ ...settings, fiscalStartDay: parseInt(e.target.value) || 1 })}
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min={1}
                            max={31}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Mặc định = 1 (ngày đầu tháng). Dùng cho báo cáo pace.
                        </p>
                    </div>

                    {/* Ladder Config */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Cấu hình Pricing Ladder (mức điều chỉnh giá)
                        </label>
                        <div className="space-y-2">
                            {(Object.entries(LADDER_PRESETS) as [keyof typeof LADDER_PRESETS, typeof LADDER_PRESETS[keyof typeof LADDER_PRESETS]][]).map(([key, preset]) => (
                                <label
                                    key={key}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${settings.ladderPreset === key
                                            ? 'bg-blue-950/30 border-blue-600'
                                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="ladderPreset"
                                        value={key}
                                        checked={settings.ladderPreset === key}
                                        onChange={() => setSettings({ ...settings, ladderPreset: key })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-slate-200">{preset.name}</div>
                                        <div className="text-xs text-slate-400">
                                            Steps: {preset.steps.map(s => `${s > 0 ? '+' : ''}${(s * 100).toFixed(0)}%`).join(', ')}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Giá khuyến nghị sẽ được tính theo các bậc này. Conservative = an toàn, Aggressive = biến động mạnh.
                        </p>
                    </div>
                </div>
                {/* Pricing Section */}
                <div className="border-t border-slate-700 pt-6">
                    <h3 className="text-lg font-semibold text-slate-50 mb-4">💰 Cài đặt giá</h3>

                    {/* Default Base Rate */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Giá cơ bản (Base Rate)
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={displayValues.defaultBaseRate}
                                onChange={(e) => handlePriceChange('defaultBaseRate', e.target.value)}
                                onBlur={() => handlePriceBlur('defaultBaseRate')}
                                className="w-full px-4 py-2.5 pr-16 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                                {settings.currency}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Giá mặc định khi chưa có dữ liệu lịch sử
                        </p>
                    </div>

                    {/* Min/Max Rate */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Giá sàn (Min Rate)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={displayValues.minRate}
                                    onChange={(e) => handlePriceChange('minRate', e.target.value)}
                                    onBlur={() => handlePriceBlur('minRate')}
                                    className="w-full px-4 py-2.5 pr-16 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                                    {settings.currency}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Giá trần (Max Rate)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={displayValues.maxRate}
                                    onChange={(e) => handlePriceChange('maxRate', e.target.value)}
                                    onBlur={() => handlePriceBlur('maxRate')}
                                    className="w-full px-4 py-2.5 pr-16 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                                    {settings.currency}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
                {saving ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang lưu...
                    </>
                ) : (
                    <>
                        <Save className="w-5 h-5" />
                        Lưu cài đặt
                    </>
                )}
            </button>

            {/* Info Box */}
            <div className="bg-amber-950/30 border border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-300">
                    <strong>💡 Lưu ý:</strong> Các thay đổi sẽ ảnh hưởng đến tính toán trong Dashboard.
                    Số phòng (Capacity) quyết định cách tính Occupancy và Remaining Supply.
                </p>
            </div>
        </div>
    );
}
