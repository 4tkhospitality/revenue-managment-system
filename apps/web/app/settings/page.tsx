'use client';

import { useState, useEffect } from 'react';
import { Save, Hotel, AlertCircle, CheckCircle, Lock, Settings, DollarSign, Lightbulb, CreditCard, Receipt, Building2, BarChart3, Tag, ArrowUpRight, Users, Globe } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { COUNTRIES, getCountryDisplay } from '@/lib/constants/countries';

// ── Constants ────────────────────────────────────────────────────────

const LADDER_PRESETS = {
    conservative: { name: 'Conservative (±10%)', steps: [-0.10, -0.05, 0, 0.05, 0.10] },
    standard: { name: 'Standard (±20%)', steps: [-0.20, -0.10, -0.05, 0, 0.05, 0.10, 0.20] },
    aggressive: { name: 'Aggressive (±30%)', steps: [-0.30, -0.20, -0.10, 0, 0.10, 0.20, 0.30] },
};

const TIMEZONE_KEYS = [
    { value: 'Asia/Ho_Chi_Minh', labelKey: 'tzVietnam' },
    { value: 'Asia/Bangkok', labelKey: 'tzThailand' },
    { value: 'Asia/Singapore', labelKey: 'tzSingapore' },
    { value: 'Asia/Jakarta', labelKey: 'tzIndonesia' },
    { value: 'Asia/Kuala_Lumpur', labelKey: 'tzMalaysia' },
    { value: 'Asia/Tokyo', labelKey: 'tzJapan' },
    { value: 'UTC', labelKey: 'tzUtc' },
];

const PLAN_COLORS: Record<string, string> = { STANDARD: '#22c55e', SUPERIOR: '#3b82f6', DELUXE: '#a855f7', SUITE: '#eab308' };
const PLAN_LABELS: Record<string, string> = { STANDARD: 'Starter', SUPERIOR: 'Superior', DELUXE: 'Deluxe', SUITE: 'Suite' };
const BAND_LABEL_KEYS: Record<string, string> = { R30: 'bandR30', R80: 'bandR80', R150: 'bandR150', R300P: 'bandR300P' };

const PAYMENT_STATUS_KEYS: Record<string, { labelKey: string; color: string }> = {
    COMPLETED: { labelKey: 'statusCompleted', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    PENDING: { labelKey: 'statusPending', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    FAILED: { labelKey: 'statusFailed', color: 'text-red-700 bg-red-50 border-red-200' },
    EXPIRED: { labelKey: 'statusExpired', color: 'text-gray-600 bg-gray-50 border-gray-200' },
    REFUNDED: { labelKey: 'statusRefunded', color: 'text-blue-700 bg-blue-50 border-blue-200' },
};

const GATEWAY_MAP: Record<string, string> = { SEPAY: 'SePay', PAYPAL: 'PayPal', ZALO_MANUAL: 'Zalo', ADMIN_MANUAL: 'Admin' };

// ── Helpers ──────────────────────────────────────────────────────────

const formatVND = (n: number) => n.toLocaleString('vi-VN');
const formatNumberDisplay = (num: number): string => num.toLocaleString('vi-VN');
const parseFormattedNumber = (str: string): number => parseInt(str.replace(/\./g, '').replace(/\s/g, '')) || 0;
const formatDateLocale = (iso: string, locale: string) => new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatDateTimeLocale = (iso: string, locale: string) => new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const formatAmount = (amount: number, currency: string) => currency === 'VND' ? formatVND(amount) + '₫' : '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2 });
const fmtLimit = (n: number) => n === 0 ? '∞' : n.toString();

// ── Types ────────────────────────────────────────────────────────────

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

interface SubData {
    plan: string;
    effectivePlan: string;
    roomBand: string;
    price: number;
    hotelCapacity: number;
    derivedBand: string;
    isTrialActive: boolean;
    trialDaysRemaining: number;
    status: string;
    periodStart: string | null;
    periodEnd: string | null;
    isExpired: boolean;
    limits: {
        maxImportsMonth: number;
        maxExportsDay: number;
        includedRateShopsMonth: number;
        maxUsers: number;
        dataRetentionMonths: number;
    };
    usage: {
        importsThisMonth: number;
        exportsToday: number;
    };
}

interface OrgData {
    org: { id: string; name: string; slug: string | null };
    hotels: { count: number; maxProperties: number };
    members: { count: number; maxUsers: number };
    subscription: { plan: string; roomBand: string; status: string };
}

interface PaymentRecord {
    id: string;
    orderId: string;
    gateway: string;
    amount: number;
    currency: string;
    status: string;
    purchasedTier: string | null;
    termMonths: number | null;
    createdAt: string;
    failedReason: string | null;
}

type TabKey = 'hotel' | 'billing' | 'payments' | 'account';

const getHotelId = () => process.env.NEXT_PUBLIC_DEFAULT_HOTEL_ID || '';

// ── Sub-components ───────────────────────────────────────────────────

function QuotaBar({ label, used, limit, unit }: { label: string; used: number; limit: number; unit?: string }) {
    const isUnlimited = limit === 0;
    const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
    const barColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500';
    const textColor = pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-gray-600';
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className={`font-medium ${textColor}`}>{used}/{isUnlimited ? '∞' : limit}{unit ? ` ${unit}` : ''}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${isUnlimited ? 3 : pct}%` }} />
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${active
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

// ── Main Component ───────────────────────────────────────────────────

export default function SettingsPage() {
    const t = useTranslations('settingsPage');
    const locale = useLocale();
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<TabKey>('hotel');
    const [settings, setSettings] = useState<HotelSettings>({
        name: '', capacity: 240, currency: 'VND',
        defaultBaseRate: 1500000, minRate: 500000, maxRate: 5000000,
        timezone: 'Asia/Ho_Chi_Minh', fiscalStartDay: 1, ladderPreset: 'standard',
    });
    const [displayValues, setDisplayValues] = useState({ defaultBaseRate: '1.500.000', minRate: '500.000', maxRate: '5.000.000' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isDemo, setIsDemo] = useState(false);

    // Billing data (single fetch, shared across tab)
    const [subData, setSubData] = useState<SubData | null>(null);
    const [orgData, setOrgData] = useState<OrgData | null>(null);

    // Payments
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [paymentsFetched, setPaymentsFetched] = useState(false);

    // Promo
    const [promoCode, setPromoCode] = useState('');
    const [promoStatus, setPromoStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid' | 'redeeming' | 'success' | 'error'>('idle');
    const [promoMessage, setPromoMessage] = useState('');
    const [promoInfo, setPromoInfo] = useState<{ percentOff: number } | null>(null);

    // Account tab
    const [userCountry, setUserCountry] = useState<string>('');
    const [countrySaving, setCountrySaving] = useState(false);

    const isAdmin = !!(session?.user as any)?.isAdmin;

    // ── Data Loading ─────────────────────────────────────────────────

    useEffect(() => {
        const load = async () => {
            try {
                const [demoRes, settingsRes, subRes, orgRes] = await Promise.all([
                    fetch('/api/is-demo-hotel'),
                    fetch(`/api/settings?hotelId=${getHotelId()}`),
                    fetch('/api/subscription'),
                    fetch('/api/organization').catch(() => null),
                ]);

                const demoData = await demoRes.json();
                const isAdminRole = demoData.role === 'super_admin' || demoData.role === 'hotel_admin';
                setIsDemo(isAdminRole ? false : (demoData.isDemo || false));

                if (settingsRes.ok) {
                    const sData = await settingsRes.json();
                    if (sData.hotel) {
                        let ladderPreset: 'conservative' | 'standard' | 'aggressive' = 'standard';
                        if (sData.hotel.ladder_steps) {
                            const steps = JSON.parse(sData.hotel.ladder_steps);
                            if (steps.length === 5) ladderPreset = 'conservative';
                            else if (steps.length === 7 && steps.includes(-0.3)) ladderPreset = 'aggressive';
                        }
                        setSettings({
                            name: sData.hotel.name || '',
                            capacity: sData.hotel.capacity || 240,
                            currency: sData.hotel.currency || 'VND',
                            defaultBaseRate: Number(sData.hotel.default_base_rate) || 1500000,
                            minRate: Number(sData.hotel.min_rate) || 500000,
                            maxRate: Number(sData.hotel.max_rate) || 5000000,
                            timezone: sData.hotel.timezone || 'Asia/Ho_Chi_Minh',
                            fiscalStartDay: sData.hotel.fiscal_start_day || 1,
                            ladderPreset,
                        });
                    }
                }

                if (subRes.ok) {
                    const s = await subRes.json();
                    setSubData(s);
                }

                if (orgRes && orgRes.ok) {
                    const o = await orgRes.json();
                    if (o?.org) setOrgData(o);
                }
            } catch (err) {
                console.error('Error loading settings:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Load user profile (country)
    useEffect(() => {
        fetch('/api/user/profile')
            .then(r => r.json())
            .then(data => { if (data.country) setUserCountry(data.country); })
            .catch(() => { });
    }, []);

    // Lazy-load payments when tab is opened
    useEffect(() => {
        if (activeTab === 'payments' && !paymentsFetched) {
            setPaymentsLoading(true);
            fetch('/api/payments/history')
                .then(r => r.json())
                .then(data => setPayments(data.payments || []))
                .catch(() => setPayments([]))
                .finally(() => { setPaymentsLoading(false); setPaymentsFetched(true); });
        }
    }, [activeTab, paymentsFetched]);

    // Display values sync
    useEffect(() => {
        setDisplayValues({
            defaultBaseRate: formatNumberDisplay(settings.defaultBaseRate),
            minRate: formatNumberDisplay(settings.minRate),
            maxRate: formatNumberDisplay(settings.maxRate),
        });
    }, [settings.defaultBaseRate, settings.minRate, settings.maxRate]);

    // ── Handlers ─────────────────────────────────────────────────────

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hotelId: getHotelId(), ...settings,
                    ladderSteps: JSON.stringify(LADDER_PRESETS[settings.ladderPreset].steps),
                }),
            });
            if (res.ok) {
                setMessage({ type: 'success', text: t('saveSuccess') });
            }
            else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || t('saveFailed') });
            }
        } catch {
            setMessage({ type: 'error', text: t('connectionError') });
        } finally { setSaving(false); }
    };

    const handlePriceChange = (field: 'defaultBaseRate' | 'minRate' | 'maxRate', value: string) => {
        setDisplayValues(prev => ({ ...prev, [field]: value.replace(/[^\d.]/g, '') }));
    };
    const handlePriceBlur = (field: 'defaultBaseRate' | 'minRate' | 'maxRate') => {
        const n = parseFormattedNumber(displayValues[field]);
        setSettings(prev => ({ ...prev, [field]: n }));
        setDisplayValues(prev => ({ ...prev, [field]: formatNumberDisplay(n) }));
    };

    const handlePromoValidate = async () => {
        if (!promoCode.trim()) return;
        setPromoStatus('validating');
        try {
            const res = await fetch('/api/promo', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'validate', code: promoCode.trim().toUpperCase(), hotelId: getHotelId() }),
            });
            const data = await res.json();
            if (data.valid) {
                setPromoStatus('valid');
                setPromoInfo({ percentOff: data.promo.percentOff });
                setPromoMessage(t('promoDiscount', { percent: data.promo.percentOff }));
            } else { setPromoStatus('invalid'); setPromoMessage(data.error || t('promoInvalid')); }
        } catch { setPromoStatus('error'); setPromoMessage(t('promoConnectionError')); }
    };

    const handlePromoRedeem = async () => {
        setPromoStatus('redeeming');
        try {
            const res = await fetch('/api/promo', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'redeem', code: promoCode.trim().toUpperCase(), hotelId: getHotelId() }),
            });
            const data = await res.json();
            if (res.ok) { setPromoStatus('success'); setPromoMessage(t('promoSuccess', { percent: data.percentOff })); }
            else { setPromoStatus('error'); setPromoMessage(data.error || t('promoFailed')); }
        } catch { setPromoStatus('error'); setPromoMessage(t('promoConnectionError')); }
    };

    // ── Loading / Demo states ────────────────────────────────────────

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-2" />
                <span className="text-gray-500">{t('loadingSettings')}</span>
            </div>
        );
    }

    if (isDemo) {
        return (
            <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 space-y-6">
                <header className="rounded-2xl px-6 py-4 text-white shadow-sm" style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}>
                    <div className="flex items-center gap-2"><Hotel className="w-5 h-5" /><h1 className="text-lg font-semibold">{t('title')}</h1></div>
                </header>
                <div className="max-w-2xl">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
                        <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-amber-800 mb-2">{t('demoTitle')}</h2>
                        <p className="text-amber-700 mb-6">{t('demoDesc')}</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link href="/onboarding" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"><Hotel className="w-4 h-4" />{t('createHotel')}</Link>
                            <Link href="/dashboard" className="inline-block px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">{t('continueDemoBtn')}</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Plan Info ─────────────────────────────────────────────────────

    const planColor = PLAN_COLORS[subData?.plan || 'STANDARD'] ?? '#6b7280';
    const planLabel = PLAN_LABELS[subData?.plan || 'STANDARD'] ?? 'Standard';
    const bandLabelKey = BAND_LABEL_KEYS[subData?.roomBand || 'R30'] ?? 'bandR30';
    const bandLabel = t(bandLabelKey as any);

    // ── Render ───────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 space-y-5">
            {/* Header */}
            <header className="rounded-2xl px-6 py-4 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #102A4C 100%)' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            <h1 className="text-lg font-semibold">{t('title')}</h1>
                        </div>
                        <p className="text-white/60 text-sm mt-0.5">{t('subtitle')}</p>
                    </div>
                    {/* Quick plan badge in header */}
                    {subData && (
                        <div className="hidden sm:flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-sm font-bold text-white" style={{ backgroundColor: planColor }}>{planLabel}</span>
                            {subData.isTrialActive && <span className="text-xs text-amber-300">{t('trialBadge', { days: subData.trialDaysRemaining })}</span>}
                        </div>
                    )}
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-50 rounded-xl p-1 border border-gray-200">
                <TabButton active={activeTab === 'hotel'} onClick={() => setActiveTab('hotel')} icon={<Hotel className="w-4 h-4" />} label={t('tabHotel')} />
                <TabButton active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} icon={<CreditCard className="w-4 h-4" />} label={t('tabBilling')} />
                <TabButton active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} icon={<Receipt className="w-4 h-4" />} label={t('tabPayments')} />
                <TabButton active={activeTab === 'account'} onClick={() => setActiveTab('account')} icon={<Globe className="w-4 h-4" />} label={t('tabAccount') || 'Account'} />
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-xl flex items-center gap-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                </div>
            )}

            {/* ═══════════ TAB 1: HOTEL INFO ═══════════ */}
            {activeTab === 'hotel' && (
                <div className="space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Left: Basic Info */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <Hotel className="w-4 h-4 text-blue-500" /> {t('basicInfo')}
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('hotelName')}</label>
                                <input type="text" value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="VD: Sunset Beach Resort" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('roomCount')}</label>
                                    <input type="number" value={settings.capacity} onChange={(e) => setSettings({ ...settings, capacity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" min={1} max={10000} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('currency')}</label>
                                    <select value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                        <option value="VND">VND</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('timezone')}</label>
                                    <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                        {TIMEZONE_KEYS.map((tz) => <option key={tz.value} value={tz.value}>{t(tz.labelKey as any)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('fiscalStartDay')}</label>
                                    <input type="number" value={settings.fiscalStartDay} onChange={(e) => setSettings({ ...settings, fiscalStartDay: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" min={1} max={31} />
                                </div>
                            </div>
                        </div>

                        {/* Right: Pricing Config */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-500" /> {t('pricingConfig')}
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('baseRate')}</label>
                                <div className="relative">
                                    <input type="text" value={displayValues.defaultBaseRate} onChange={(e) => handlePriceChange('defaultBaseRate', e.target.value)} onBlur={() => handlePriceBlur('defaultBaseRate')} className="w-full px-3 py-2 pr-14 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono text-sm" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{settings.currency}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('floorRate')}</label>
                                    <div className="relative">
                                        <input type="text" value={displayValues.minRate} onChange={(e) => handlePriceChange('minRate', e.target.value)} onBlur={() => handlePriceBlur('minRate')} className="w-full px-3 py-2 pr-14 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono text-sm" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{settings.currency}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('ceilingRate')}</label>
                                    <div className="relative">
                                        <input type="text" value={displayValues.maxRate} onChange={(e) => handlePriceChange('maxRate', e.target.value)} onBlur={() => handlePriceBlur('maxRate')} className="w-full px-3 py-2 pr-14 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono text-sm" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{settings.currency}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Ladder Preset */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('pricingLadder')}</label>
                                <div className="space-y-1.5">
                                    {(Object.entries(LADDER_PRESETS) as [keyof typeof LADDER_PRESETS, typeof LADDER_PRESETS[keyof typeof LADDER_PRESETS]][]).map(([key, preset]) => (
                                        <label key={key} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${settings.ladderPreset === key ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                            <input type="radio" name="ladderPreset" value={key} checked={settings.ladderPreset === key} onChange={() => setSettings({ ...settings, ladderPreset: key })} className="w-3.5 h-3.5 text-blue-600" />
                                            <div className="flex-1">
                                                <span className="font-medium text-gray-900">{preset.name}</span>
                                                <span className="text-xs text-gray-400 ml-2">{preset.steps.map(s => `${s > 0 ? '+' : ''}${(s * 100).toFixed(0)}%`).join(', ')}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center gap-4">
                        <button onClick={handleSave} disabled={saving} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl flex items-center gap-2 transition-colors shadow-sm text-sm">
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? t('savingSettings') : t('saveSettings')}
                        </button>
                        <p className="text-xs text-gray-400"><Lightbulb className="w-3.5 h-3.5 inline mr-0.5" />{t('settingsHint')}</p>
                    </div>
                </div>
            )}

            {/* ═══════════ TAB 2: BILLING ═══════════ */}
            {activeTab === 'billing' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Left column: Subscription + Org */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Subscription Card */}
                        {subData && (
                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-blue-500" /> {t('currentPlan')}
                                        </h3>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-sm font-bold text-white" style={{ backgroundColor: planColor }}>{planLabel}</span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">{t('bandLabel')}</p>
                                        <p className="text-sm font-semibold text-gray-900">{subData.roomBand} <span className="font-normal text-gray-500">({bandLabel})</span></p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">{t('pricePerMonth')}</p>
                                        <p className="text-sm font-semibold text-gray-900">{subData.plan !== 'STANDARD' ? formatVND(subData.price) + '₫' : t('free')}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">{t('startDate')}</p>
                                        <p className="text-sm font-semibold text-gray-900">{subData.periodStart ? formatDateLocale(subData.periodStart, locale) : '—'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">{t('endDate')}</p>
                                        <p className={`text-sm font-semibold ${subData.isExpired ? 'text-red-600' : 'text-gray-900'}`}>{subData.periodEnd ? formatDateLocale(subData.periodEnd, locale) : '—'}</p>
                                    </div>
                                </div>

                                {subData.isTrialActive && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 font-medium mb-3">
                                        {t('trialRemaining', { days: subData.trialDaysRemaining })}
                                    </div>
                                )}

                                {subData.isExpired && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium mb-3">
                                        {t('planExpired')}
                                    </div>
                                )}

                                {subData.plan !== 'SUITE' && (
                                    <Link href="/pricing-plans" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                                        {t('upgradePlan')} <ArrowUpRight className="w-3.5 h-3.5" />
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Organization */}
                        {orgData?.org && (
                            <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-600" /></div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{orgData.org.name}</h3>
                                            <p className="text-xs text-gray-500">{t('organizationLabel')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1.5"><Hotel className="w-4 h-4" />{orgData.hotels.count}/{fmtLimit(orgData.hotels.maxProperties)}</span>
                                        <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{orgData.members.count}/{fmtLimit(orgData.members.maxUsers)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Promo Code */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                                <Tag className="w-4 h-4 text-purple-500" /> {t('promoCode')}
                            </h3>
                            <div className="flex gap-2">
                                <input className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={t('promoPlaceholder')} value={promoCode} onChange={e => { setPromoCode(e.target.value.toUpperCase()); if (promoStatus !== 'idle') setPromoStatus('idle'); }} onKeyDown={e => e.key === 'Enter' && handlePromoValidate()} disabled={promoStatus === 'success'} />
                                {promoStatus === 'valid' ? (
                                    <button onClick={handlePromoRedeem} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">{t('promoApply')}</button>
                                ) : (
                                    <button onClick={handlePromoValidate} disabled={!promoCode.trim() || promoStatus === 'validating'} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('promoCheck')}</button>
                                )}
                            </div>
                            {promoMessage && (
                                <div className={`mt-2 px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 ${promoStatus === 'success' || promoStatus === 'valid' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                    {promoStatus === 'success' || promoStatus === 'valid' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                    {promoMessage}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right column: Quota Usage */}
                    <div className="space-y-5">
                        {subData?.limits && (
                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                                    <BarChart3 className="w-4 h-4 text-indigo-500" /> {t('quotaUsage')}
                                </h3>
                                <div className="space-y-3">
                                    <QuotaBar label={t('quotaImports')} used={subData.usage?.importsThisMonth ?? 0} limit={subData.limits.maxImportsMonth} />
                                    <QuotaBar label={t('quotaExports')} used={subData.usage?.exportsToday ?? 0} limit={subData.limits.maxExportsDay} unit={t('perDay')} />
                                    <QuotaBar label={t('quotaRateShops')} used={0} limit={subData.limits.includedRateShopsMonth} />
                                    <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                                        <span className="text-gray-500">{t('dataRetention')}</span>
                                        <span className="font-medium text-gray-700">{subData.limits.dataRetentionMonths === 0 ? '∞' : `${subData.limits.dataRetentionMonths} ${t('months')}`}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">{t('maxUsersLabel')}</span>
                                        <span className="font-medium text-gray-700">{fmtLimit(subData.limits.maxUsers)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════ TAB 3: PAYMENT HISTORY ═══════════ */}
            {activeTab === 'payments' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-blue-500" /> {t('paymentHistoryTitle')}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{t('paymentHistoryDesc')}</p>
                    </div>

                    {paymentsLoading ? (
                        <div className="flex items-center justify-center py-12 text-gray-400">
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-2" />
                            {t('paymentLoading')}
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">{t('noPayments')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">{t('colPayDate')}</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">{t('colOrderId')}</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">{t('colPlan')}</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">{t('colGateway')}</th>
                                        <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">{t('colAmount')}</th>
                                        <th className="text-center py-3 px-4 font-medium text-gray-500 text-xs uppercase">{t('colPayStatus')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((p) => {
                                        const st = PAYMENT_STATUS_KEYS[p.status] || PAYMENT_STATUS_KEYS.PENDING;
                                        return (
                                            <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{formatDateTimeLocale(p.createdAt, locale)}</td>
                                                <td className="py-3 px-4 font-mono text-xs text-gray-400" title={p.orderId}>{p.orderId.length > 22 ? p.orderId.slice(0, 22) + '…' : p.orderId}</td>
                                                <td className="py-3 px-4">
                                                    <span className="font-medium text-gray-900">{p.purchasedTier ? PLAN_LABELS[p.purchasedTier] || p.purchasedTier : '—'}</span>
                                                    {p.termMonths && <span className="text-xs text-gray-400 ml-1">({p.termMonths}th)</span>}
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">{GATEWAY_MAP[p.gateway] || p.gateway}</td>
                                                <td className="py-3 px-4 text-right font-mono font-medium text-gray-900">{formatAmount(p.amount, p.currency)}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${st.color}`}>{t(st.labelKey as any)}</span>
                                                    {p.failedReason && <div className="text-xs text-red-400 mt-0.5">{p.failedReason}</div>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════ TAB 4: ACCOUNT ═══════════ */}
            {activeTab === 'account' && (
                <div className="space-y-5">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                            <Globe className="w-5 h-5 text-blue-600" />
                            {t('accountSectionTitle') || 'Your Profile'}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Name & Email (read-only from session) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1.5">{t('yourName') || 'Name'}</label>
                                <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                                    {session?.user?.name || '—'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1.5">{t('yourEmail') || 'Email'}</label>
                                <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                                    {session?.user?.email || '—'}
                                </div>
                            </div>
                            {/* Country - editable */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                                    <span className="flex items-center gap-1.5">
                                        🌍 {t('yourCountry') || 'Country'}
                                    </span>
                                </label>
                                <select
                                    value={userCountry}
                                    onChange={async (e) => {
                                        const newCountry = e.target.value;
                                        setUserCountry(newCountry);
                                        setCountrySaving(true);
                                        try {
                                            await fetch('/api/user/profile', {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ country: newCountry || null }),
                                            });
                                            setMessage({ type: 'success', text: t('countrySaved') || 'Country updated!' });
                                        } catch {
                                            setMessage({ type: 'error', text: t('countryError') || 'Failed to update country' });
                                        } finally {
                                            setCountrySaving(false);
                                            setTimeout(() => setMessage(null), 3000);
                                        }
                                    }}
                                    disabled={countrySaving}
                                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800
                                        focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm"
                                >
                                    <option value="">{t('autoDetect') || '— Auto-detect —'}</option>
                                    {COUNTRIES.map((c) => (
                                        <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">
                                    {userCountry
                                        ? `${t('currentlySet') || 'Currently'}: ${getCountryDisplay(userCountry)}`
                                        : (t('countryAutoHint') || 'Will be auto-detected on next login if left blank.')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
