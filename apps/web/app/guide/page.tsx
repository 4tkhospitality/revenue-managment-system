'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    BookOpen, BarChart3, TrendingUp, DollarSign, CalendarDays, Upload, Database,
    HelpCircle, Calculator, Percent, Tag, ArrowRightLeft, Lock, ChevronRight,
    Layers, Settings, Download, Search, ExternalLink, ChevronDown, AlertTriangle,
    Clock, Zap, ArrowRight, CheckCircle2, XCircle, Info,
} from 'lucide-react';
import { validateOTBData, type ValidationResult } from '../actions/validateOTBData';
import Link from 'next/link';
import { useTierAccess } from '@/hooks/useTierAccess';
import { TierPaywall } from '@/components/paywall/TierPaywall';

/* ═══════════════════════ TYPES & DATA ═══════════════════════ */

type SectionId = 'quickstart' | 'analytics' | 'pricing' | 'data';

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode; sub?: { id: string; label: string }[] }[] = [
    {
        id: 'quickstart', label: 'Bắt đầu nhanh', icon: <Zap className="w-4 h-4" />,
        sub: [
            { id: 'morning-routine', label: 'Routine 5 phút mỗi sáng' },
            { id: 'steps', label: '5 bước bắt đầu' },
            { id: 'glossary-full', label: 'Thuật ngữ đầy đủ' },
            { id: 'faq', label: 'Lỗi hay gặp' },
        ],
    },
    {
        id: 'analytics', label: 'Quản lý Doanh thu', icon: <BarChart3 className="w-4 h-4" />,
        sub: [
            { id: 'rm-intro', label: 'Revenue Management là gì?' },
            { id: 'kpi', label: 'Các thẻ KPI' },
            { id: 'charts', label: 'Biểu đồ OTB' },
            { id: 'rec-table', label: 'Bảng khuyến nghị giá' },
            { id: 'dp-overview', label: 'Giá Linh Hoạt' },
            { id: 'dp-seasons', label: 'Mùa (Seasons)' },
            { id: 'dp-occ-tiers', label: 'Bậc OCC' },
            { id: 'terms', label: 'Thuật ngữ chuyên ngành' },
        ],
    },
    {
        id: 'pricing', label: 'Tính giá OTA', icon: <Calculator className="w-4 h-4" />,
        sub: [
            { id: 'pricing-intro', label: 'Tổng quan' },
            { id: 'formula', label: '2 công thức tính giá' },
            { id: 'channels', label: 'Kênh OTA & Hoa hồng' },
            { id: 'promos', label: 'Khuyến mãi & Stacking' },
            { id: 'compare', label: 'So sánh giữa các kênh' },
            { id: 'price-matrix', label: 'Bảng giá tổng hợp' },
            { id: 'reverse', label: 'Tính ngược (BAR → NET)' },
            { id: 'dp-export', label: 'Xuất CSV' },
        ],
    },
    {
        id: 'data', label: 'Quản lý dữ liệu', icon: <Database className="w-4 h-4" />,
        sub: [
            { id: 'upload', label: 'Import dữ liệu' },
            { id: 'build-otb', label: 'Build OTB' },
            { id: 'build-features', label: 'Build Features' },
            { id: 'run-forecast', label: 'Run Forecast' },
        ],
    },
];



const TROUBLESHOOTING = [
    { symptom: 'Trang trắng, không có dữ liệu', cause: 'Chưa upload file PMS', fix: 'Vào Upload, kéo thả file XML/CSV từ PMS', link: '/upload' },
    { symptom: 'Upload thất bại', cause: 'Format file không đúng', fix: 'Dùng file XML hoặc CSV xuất từ PMS (Opera, RoomRaccoon, Cloudbeds)', link: '/upload' },
    { symptom: 'Pickup hiện "N/A"', cause: 'Cần ít nhất 2 lần upload', fix: 'Upload thêm, chờ 7 ngày để có dữ liệu pickup', link: null },
    { symptom: 'Forecast hiện "Ước lượng"', cause: 'Thiếu dữ liệu pickup', fix: 'Tiếp tục upload hàng ngày, sau 2 tuần sẽ có forecast chính xác', link: null },
    { symptom: 'Giá quá cao / quá thấp', cause: 'Promotion stacking > 50%', fix: 'Giảm số lượng KM hoặc kiểm tra commission boosters', link: '/pricing' },
    { symptom: 'Season "auto" chọn sai mùa', cause: 'Khoảng ngày Season chưa đúng', fix: 'Vào Config Season, kiểm tra date ranges', link: '/pricing' },
];

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */

export default function GuidePage() {
    const [activeSection, setActiveSection] = useState<SectionId>('quickstart');
    const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set(['quickstart']));
    const [searchQuery, setSearchQuery] = useState('');

    const [showTroubleshooting, setShowTroubleshooting] = useState(false);
    const { hasAccess: hasRevenueAccess, loading: tierLoading } = useTierAccess('SUPERIOR');

    useEffect(() => {
        if (!tierLoading && hasRevenueAccess) {
            setActiveSection('analytics');
            setExpandedSections(new Set(['analytics']));
        }
    }, [tierLoading, hasRevenueAccess]);

    // Ctrl+K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('guide-search')?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const handleNav = (sectionId: SectionId, subId?: string) => {
        if (activeSection === sectionId && !subId) {
            // Re-clicking the active section → toggle expand/collapse
            setExpandedSections(prev => {
                const next = new Set(prev);
                if (next.has(sectionId)) next.delete(sectionId); else next.add(sectionId);
                return next;
            });
        } else {
            // Switching to a different section → set active + expand
            setActiveSection(sectionId);
            setExpandedSections(prev => new Set(prev).add(sectionId));
        }
        if (subId) {
            setTimeout(() => document.getElementById(subId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
    };

    return (
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 space-y-4">
            {/* ── Hero ── */}
            <header
                className="rounded-2xl px-6 py-5 text-white shadow-sm relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #102A4C 100%)' }}
            >
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            <h1 className="text-lg font-semibold">Hướng dẫn sử dụng RMS</h1>
                        </div>
                        <p className="text-white/70 text-sm mt-1">
                            Tài liệu hướng dẫn cho General Manager và nhân viên quản lý doanh thu
                        </p>
                    </div>
                    <button
                        onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Lỗi & Khắc phục
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mt-4 max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                        id="guide-search"
                        type="text"
                        placeholder="Tìm thuật ngữ, hướng dẫn... (Ctrl+K)"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-white/40 outline-none focus:border-white/40 focus:bg-white/15 transition-colors"
                    />
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-white/60">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 5 phút mỗi sáng</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> 30+ thuật ngữ</span>
                    <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> 4 modules</span>
                </div>
            </header>

            {/* ── Troubleshooting Panel (global) ── */}
            {showTroubleshooting && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-amber-800 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Lỗi & Khắc phục
                        </h3>
                        <button onClick={() => setShowTroubleshooting(false)} className="text-amber-400 hover:text-amber-600">
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="grid gap-2">
                        {TROUBLESHOOTING.filter(t =>
                            !searchQuery || t.symptom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.fix.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((t, i) => (
                            <div key={i} className="bg-white rounded-lg p-3 border border-amber-100 flex items-start gap-3">
                                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-800 text-sm">{t.symptom}</div>
                                    <p className="text-xs text-gray-500 mt-0.5">Nguyên nhân: {t.cause}</p>
                                    <p className="text-xs text-emerald-700 mt-1">Cách sửa: {t.fix}</p>
                                </div>
                                {t.link && (
                                    <Link href={t.link} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0">
                                        Mở <ExternalLink className="w-3 h-3" />
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* ── Body: Sidebar + Content ── */}
            <div className="flex gap-6">
                {/* Left Sidebar Nav */}
                <nav className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-6 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        {SECTIONS.map(sec => (
                            <div key={sec.id}>
                                <button
                                    onClick={() => handleNav(sec.id)}
                                    className={`w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm font-medium transition-colors ${activeSection === sec.id
                                        ? 'bg-blue-50 text-blue-700 border-l-[3px] border-blue-600'
                                        : 'text-gray-700 hover:bg-gray-50 border-l-[3px] border-transparent'
                                        }`}
                                >
                                    {sec.icon}
                                    <span className="flex-1">{sec.label}</span>
                                    {sec.id === 'analytics' && !tierLoading && !hasRevenueAccess && <Lock className="w-3 h-3 text-amber-500" />}
                                    <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expandedSections.has(sec.id) ? 'rotate-90' : ''}`} />
                                </button>
                                {expandedSections.has(sec.id) && sec.sub && (
                                    <div className="bg-gray-50 border-t border-gray-100">
                                        {sec.sub.map(sub => (
                                            <button
                                                key={sub.id}
                                                onClick={() => handleNav(sec.id, sub.id)}
                                                className="w-full text-left pl-11 pr-4 py-2 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                                            >
                                                {sub.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </nav>

                {/* Mobile Nav */}
                <div className="lg:hidden w-full">
                    <div className="bg-white border border-gray-200 rounded-xl p-1 flex gap-1 overflow-x-auto mb-4">
                        {SECTIONS.map(sec => (
                            <button
                                key={sec.id}
                                onClick={() => handleNav(sec.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeSection === sec.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                {sec.icon} {sec.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-6">
                    {activeSection === 'quickstart' && <QuickStartSection />}
                    {activeSection === 'analytics' && (
                        !tierLoading && !hasRevenueAccess ? (
                            <TierPaywall
                                title="Quan ly Doanh thu"
                                subtitle="Huong dan phan tich OTB, Pickup, Forecast va Revenue Management"
                                tierDisplayName="Superior"
                                colorScheme="blue"
                                features={[
                                    { icon: <BarChart3 className="w-4 h-4" />, label: 'Hieu OTB (On The Books) va Pickup' },
                                    { icon: <TrendingUp className="w-4 h-4" />, label: 'Phan tich Booking Pace & Remaining Supply' },
                                    { icon: <DollarSign className="w-4 h-4" />, label: 'Chien luoc dinh gia theo demand' },
                                    { icon: <CalendarDays className="w-4 h-4" />, label: 'Daily Actions workflow hang ngay' },
                                ]}
                            />
                        ) : <AnalyticsSection />
                    )}
                    {activeSection === 'pricing' && <PricingSection />}
                    {activeSection === 'data' && <DataSection />}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════ SHARED COMPONENTS ═══════════════════════ */

function Card({ id, title, icon, children, gradient }: { id?: string; title: string; icon?: React.ReactNode; children: React.ReactNode; gradient?: string }) {
    const gradientClass = gradient ? `bg-gradient-to-r from-${gradient}-50 to-white` : 'bg-white';
    return (
        <section id={id} className={`${gradientClass} border border-gray-200 rounded-xl p-6 space-y-3 shadow-sm scroll-mt-4`}>
            {icon || title ? (
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {icon} {title}
                </h2>
            ) : null}
            {children}
        </section>
    );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-blue-600">{n}</span>
            </div>
            <div className="space-y-2">
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                {children}
            </div>
        </div>
    );
}

function Pipeline({ steps }: { steps: string[] }) {
    return (
        <div className="flex flex-wrap items-center gap-2 text-sm mt-2">
            {steps.map((s, i) => (
                <span key={s}>
                    <span className="bg-white px-3 py-1 rounded-lg border border-gray-200">{s}</span>
                    {i < steps.length - 1 && <span className="text-gray-400 ml-2">&rarr;</span>}
                </span>
            ))}
        </div>
    );
}

function Tip({ children }: { children: React.ReactNode }) {
    return <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 text-sm mt-2 flex items-start gap-2"><Info className="w-4 h-4 shrink-0 mt-0.5" /> <span>{children}</span></div>;
}

function Warn({ children }: { children: React.ReactNode }) {
    return <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-gray-700 mt-2">{children}</div>;
}

function KPIExplain({ color, name, desc }: { color: string; name: string; desc: string }) {
    return (
        <div className={`bg-${color}-50 p-4 rounded-xl border border-${color}-100`}>
            <div className={`text-${color}-700 font-medium mb-2`}>{name}</div>
            <p className="text-sm text-gray-700"><strong>Ý nghĩa:</strong> {desc}</p>
        </div>
    );
}

function DeepLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link href={href} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors border border-blue-200">
            {children} <ExternalLink className="w-3 h-3" />
        </Link>
    );
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                <span className="text-sm font-medium text-gray-800">{title}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && <div className="px-4 py-3 text-sm text-gray-700 space-y-2">{children}</div>}
        </div>
    );
}

/* ═══════════════════════ SECTION 1: BAT DAU NHANH ═══════════════════════ */
function QuickStartSection() {
    const [dqStats, setDqStats] = useState<ValidationResult | null>(null);
    useEffect(() => { validateOTBData().then(setDqStats).catch(() => { }); }, []);
    const warningCount = dqStats?.stats.warningCount ?? 0;
    const totalRows = dqStats?.stats.totalRows ?? 0;
    const completeness = dqStats?.stats.completeness ?? 0;
    const pastCount = dqStats?.issues.filter(i => i.code === 'PAST_STAY_DATE').length ?? 0;
    const pastPct = totalRows > 0 ? Math.round((pastCount / totalRows) * 100) : 0;

    return (
        <>
            {/* Layer 1: Morning Routine */}
            <Card id="morning-routine" title="Routine 5 phút mỗi sáng" icon={<Clock className="w-5 h-5 text-blue-600" />}>
                <p className="text-sm text-gray-600">Làm theo 6 bước này mỗi sáng để quản lý doanh thu hiệu quả:</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    {[
                        { label: 'Export PMS', icon: <Download className="w-3.5 h-3.5" />, link: null },
                        { label: 'Upload', icon: <Upload className="w-3.5 h-3.5" />, link: '/upload' },
                        { label: 'Build dữ liệu', icon: <Database className="w-3.5 h-3.5" />, link: '/data' },
                        { label: 'Xem Dashboard', icon: <BarChart3 className="w-3.5 h-3.5" />, link: '/dashboard' },
                        { label: 'Accept/Override giá', icon: <CheckCircle2 className="w-3.5 h-3.5" />, link: '/dashboard' },
                        { label: 'Cập nhật OTA', icon: <ExternalLink className="w-3.5 h-3.5" />, link: null },
                    ].map((step, i) => (
                        <span key={i} className="flex items-center gap-1">
                            {step.link ? (
                                <Link href={step.link} className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg border border-blue-200 transition-colors cursor-pointer">
                                    {step.icon} {step.label}
                                </Link>
                            ) : (
                                <span className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg border border-gray-200">
                                    {step.icon} {step.label}
                                </span>
                            )}
                            {i < 5 && <ArrowRight className="w-3.5 h-3.5 text-gray-300" />}
                        </span>
                    ))}
                </div>
                <Tip>Tổng thời gian: khoảng 5 phút. Upload xong, hệ thống tự động xử lý dữ liệu.</Tip>
            </Card>

            {/* Layer 2: 5 Steps */}
            <Card id="steps" title="5 bước bắt đầu">
                <div className="space-y-5">
                    <Step n={1} title="Đăng nhập">
                        <p className="text-sm text-gray-600">Sử dụng tài khoản Google được admin cấp. Sau khi đăng nhập, bạn sẽ thấy khách sạn được gán trong sidebar.</p>
                        <Tip>Nếu chưa có quyền truy cập, liên hệ admin qua Zalo: 0778602953</Tip>
                    </Step>
                    <hr className="border-gray-100" />
                    <Step n={2} title="Upload dữ liệu từ PMS">
                        <p className="text-sm text-gray-600">Vào menu <strong>Upload</strong> &rarr; Kéo thả file XML hoặc CSV từ PMS (Opera, RoomRaccoon, Cloudbeds...).</p>
                        <DeepLink href="/upload">Mở trang Upload</DeepLink>
                        <Warn>Upload dữ liệu mỗi ngày (sáng) để có số liệu chính xác nhất.</Warn>
                    </Step>
                    <hr className="border-gray-100" />
                    <Step n={3} title="Build dữ liệu (tự động)">
                        <p className="text-sm text-gray-600">Vào menu <strong>Dữ liệu</strong> &rarr; Nhấn các nút theo thứ tự:</p>
                        <Pipeline steps={['Build OTB', 'Build Features', 'Run Forecast']} />
                        <DeepLink href="/data">Mở trang Dữ liệu</DeepLink>
                    </Step>
                    <hr className="border-gray-100" />
                    <Step n={4} title="Xem Dashboard">
                        <ul className="space-y-1 text-gray-600 text-sm list-disc list-inside ml-2">
                            <li><strong>KPI Cards:</strong> Rooms OTB, Remaining Supply, Pickup</li>
                            <li><strong>Charts:</strong> Biểu đồ OTB theo ngày, so sánh năm trước</li>
                            <li><strong>Price Table:</strong> Giá khuyến nghị cho từng ngày</li>
                        </ul>
                        <DeepLink href="/dashboard">Mở Dashboard</DeepLink>
                    </Step>
                    <hr className="border-gray-100" />
                    <Step n={5} title="Ra Quyết định Giá">
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                                <div className="font-medium text-emerald-700">Accept</div>
                                <p className="text-xs text-gray-500 mt-1">Đồng ý với giá hệ thống đề xuất</p>
                            </div>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                                <div className="font-medium text-amber-700">Override</div>
                                <p className="text-xs text-gray-500 mt-1">Nhập giá theo ý mình</p>
                            </div>
                        </div>
                    </Step>
                </div>
            </Card>

            {/* Layer 3a: Full Glossary */}
            <Card id="glossary-full" title="Thuật ngữ chuyên ngành" icon={<BookOpen className="w-5 h-5 text-blue-600" />}>
                <table className="w-full text-sm">
                    <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left text-gray-600">Thuật ngữ</th><th className="px-3 py-2 text-left text-gray-600">Giải thích</th></tr></thead>
                    <tbody className="text-gray-700">
                        {[
                            ['OTB', 'On The Books — Số phòng/doanh thu đã được đặt'],
                            ['ADR', 'Average Daily Rate — Giá phòng trung bình'],
                            ['RevPAR', 'Revenue Per Available Room — Doanh thu/phòng khả dụng'],
                            ['Occupancy (OCC)', 'Tỷ lệ lấp đầy — % phòng được bán'],
                            ['Pickup', 'Lượng booking mới trong khoảng thời gian'],
                            ['BAR', 'Best Available Rate — Giá gốc trên OTA (trước KM)'],
                            ['NET', 'Giá thu về thực tế sau hoa hồng và KM'],
                            ['Display Price', 'Giá khách thấy trên OTA (sau KM)'],
                            ['STLY', 'Same Time Last Year — So sánh cùng kỳ năm trước'],
                            ['Pace', 'Tốc độ bán phòng — so sánh với cùng kỳ'],
                            ['Remaining Supply', 'Số phòng còn trống có thể bán'],
                            ['Commission', 'Hoa hồng OTA thu (VD: Agoda 20%, Booking 18%)'],
                            ['Stacking', 'Kết hợp nhiều KM cùng lúc (cộng dồn / luỹ tiến / chọn 1)'],
                        ].map(([term, desc]) => (
                            <tr key={term} className="border-t border-gray-100"><td className="px-3 py-3 font-mono text-blue-600">{term}</td><td className="px-3 py-3">{desc}</td></tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            {/* Layer 3b: FAQ / Common Issues */}
            <Card id="faq" title="Lỗi hay gặp & FAQ" icon={<HelpCircle className="w-5 h-5 text-blue-600" />}>
                <div className="space-y-3">
                    <Accordion title="Data Quality: có cảnh báo không?" defaultOpen={warningCount > 0}>
                        <p className="text-gray-600">{warningCount > 0 ? <>Phần lớn cảnh báo là <code className="bg-gray-100 px-1 rounded text-xs">PAST_STAY_DATE</code> — dữ liệu có các ngày lưu trú đã qua.</> : 'Tất cả dữ liệu đều hợp lệ.'}</p>
                        {totalRows > 0 && <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mt-2"><strong>Khách sạn của bạn:</strong> {totalRows.toLocaleString()} dòng OTB{pastCount > 0 && <>, trong đó {pastCount.toLocaleString()} dòng đã qua ({pastPct}%)</>}. Hoàn thiện: <strong>{completeness}%</strong>.</div>}
                    </Accordion>
                    <Accordion title={`"Pickup TB: N/A" — Tại sao không hiện số?`}>
                        <p><strong>Pickup</strong> = So sánh số phòng đặt hôm nay với 7 ngày trước. Cần ít nhất <strong>2 lần upload cách nhau &#8805; 7 ngày</strong>.</p>
                    </Accordion>
                    <Accordion title={`Dự báo hiện "Ước lượng" — Có chính xác không?`}>
                        <p>Khi chưa có đủ dữ liệu pickup, hệ thống dùng ước lượng sơ bộ. Sau <strong>&#8805; 2 lần upload cách nhau &#8805; 7 ngày</strong>, dự báo sẽ dựa trên pickup thực tế.</p>
                    </Accordion>
                    <Accordion title="Upload xong nhưng không thấy data?">
                        <p>Kiểm tra: (1) File đúng định dạng XML/CSV, (2) Chạy Build OTB &rarr; Build Features &rarr; Run Forecast, (3) Đợi vài giây để hệ thống xử lý.</p>
                        <DeepLink href="/data">Mở trang Dữ liệu</DeepLink>
                    </Accordion>
                </div>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <p className="text-blue-700 mb-3">Đã sẵn sàng? Bắt đầu ngay!</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/upload" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"><Upload className="w-4 h-4" /> Upload dữ liệu</Link>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"><BarChart3 className="w-4 h-4" /> Xem Dashboard</Link>
                </div>
            </div>
        </>
    );
}

/* ═══════════════════════ PLACEHOLDER SECTIONS (to be filled) ═══════════════════════ */
function AnalyticsSection() {
    return (
        <>
            <Card id="rm-intro" title="Revenue Management là gì?" icon={<TrendingUp className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700">Revenue Management (RM) = <strong>bán đúng phòng, đúng giá, đúng thời điểm</strong> để tối ưu doanh thu. Hệ thống giúp bạn:</p>
                <div className="grid sm:grid-cols-3 gap-3 mt-3">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
                        <BarChart3 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <div className="font-medium text-gray-800 text-sm">Theo dõi OTB</div>
                        <p className="text-xs text-gray-500 mt-1">Bao nhiêu phòng đã đặt, bao nhiêu còn trống</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
                        <TrendingUp className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                        <div className="font-medium text-gray-800 text-sm">Dự báo Demand</div>
                        <p className="text-xs text-gray-500 mt-1">Predict booking pace cho 30–90 ngày tới</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
                        <DollarSign className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                        <div className="font-medium text-gray-800 text-sm">Khuyến nghị giá</div>
                        <p className="text-xs text-gray-500 mt-1">Accept giá hệ thống hoặc Override theo ý mình</p>
                    </div>
                </div>
            </Card>

            <Card id="kpi" title="Hôm nay đang bán tốt không?" icon={<BarChart3 className="w-5 h-5 text-blue-600" />}>
                <p className="text-sm text-gray-600 mb-3">Dashboard hiển thị 4 thẻ KPI chính. Đọc theo câu hỏi GM hay hỏi:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                    <KPIExplain color="blue" name="Rooms OTB" desc="Số phòng đã đặt. VD: OTB = 45 nghĩa là bạn đã bán 45 phòng cho ngày đó." />
                    <KPIExplain color="amber" name="Remaining Supply" desc="Số phòng còn trống. VD: Remaining = 15 nghĩa là còn 15 phòng cần bán." />
                    <KPIExplain color="emerald" name="Pickup (7d)" desc="Số phòng mới đặt trong 7 ngày qua. Pickup = +8 là tốt (demand tăng)." />
                    <KPIExplain color="purple" name="ADR" desc="Giá phòng trung bình. VD: ADR = 1.2M nghĩa là trung bình thu 1.2 triệu/phòng/đêm." />
                </div>
                <DeepLink href="/dashboard">Mở Dashboard xem KPI</DeepLink>
            </Card>

            <Card id="charts" title="So với năm ngoái thì sao?" icon={<TrendingUp className="w-5 h-5 text-blue-600" />}>
                <p className="text-sm text-gray-600 mb-3">Biểu đồ OTB giúp bạn so sánh hiệu suất với <strong>cùng kỳ năm trước (STLY)</strong>:</p>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm"><strong>OTB năm nay</strong> — Đường xanh: số phòng đặt hiện tại</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                        <span className="text-sm"><strong>STLY</strong> — Đường xám: số phòng cùng kỳ năm trước</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-sm"><strong>Pace</strong> — <span className="text-emerald-600">+5 OTB</span> = bán nhanh hơn năm trước 5 phòng</span>
                    </div>
                </div>
                <Tip>Nếu Pace âm (−), nghĩa là bán chậm hơn năm ngoái &rarr; cần xem xét giảm giá hoặc tăng KM.</Tip>
            </Card>

            <Card id="rec-table" title="Tôi nên tăng hay giảm giá?" icon={<DollarSign className="w-5 h-5 text-blue-600" />}>
                <p className="text-sm text-gray-600 mb-3">Bảng <strong>Khuyến nghị giá</strong> (Recommendations) hiển thị giá đề xuất cho từng ngày:</p>
                <table className="w-full text-sm mb-3">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-3 py-2 text-left text-gray-600">Cột</th>
                            <th className="px-3 py-2 text-left text-gray-600">Ý nghĩa</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        <tr className="border-t"><td className="px-3 py-2 font-medium">Stay Date</td><td className="px-3 py-2">Ngày lưu trú</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium">OTB</td><td className="px-3 py-2">Số phòng đã đặt cho ngày đó</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium">Remaining</td><td className="px-3 py-2">Số phòng còn trống</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium">Pickup</td><td className="px-3 py-2">Lượng đặt mới 7 ngày qua</td></tr>
                        <tr className="border-t bg-blue-50"><td className="px-3 py-2 font-medium">REC Price</td><td className="px-3 py-2"><strong>Giá hệ thống khuyến nghị</strong> dựa trên OCC, Pace, Season</td></tr>
                        <tr className="border-t bg-emerald-50"><td className="px-3 py-2 font-medium">Action</td><td className="px-3 py-2"><strong>Accept</strong> (đồng ý) hoặc <strong>Override</strong> (nhập giá khác)</td></tr>
                    </tbody>
                </table>
                <DeepLink href="/dashboard">Mở Daily Actions</DeepLink>
            </Card>

            {/* Dynamic Pricing subsection */}
            <Card id="dp-overview" title="Giá Linh Hoạt (Dynamic Pricing)" icon={<Layers className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700">Giá Linh Hoạt tự động điều chỉnh giá theo <strong>3 yếu tố</strong>:</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm border border-purple-200">Mùa (Season)</span>
                    <span className="text-gray-400">&times;</span>
                    <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">OCC% (Bậc công suất)</span>
                    <span className="text-gray-400">=</span>
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-200 font-medium">Giá NET</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-sm mt-3">
                    <p className="font-mono text-center text-lg">NET động = NET cơ sở (season) &times; Multiplier (OCC tier)</p>
                    <p className="text-gray-600 mt-2 text-center">VD: Normal Season NET = 1.200.000 &times; 1.10 (OCC 50%) = <strong>1.320.000đ</strong></p>
                </div>
                <DeepLink href="/pricing">Mở tab Giá Linh Hoạt</DeepLink>
            </Card>

            <Card id="dp-seasons" title="Mùa (Seasons)" icon={<CalendarDays className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">Season quyết định <strong>giá NET cơ sở</strong>. 3 loại mùa:</p>
                <table className="w-full text-sm mb-4">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-3 py-2 text-left text-gray-600">Season</th>
                            <th className="px-3 py-2 text-center text-gray-600">Mức giá</th>
                            <th className="px-3 py-2 text-left text-gray-600">Ví dụ</th>
                            <th className="px-3 py-2 text-right text-gray-600">NET cơ sở</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        <tr className="border-t"><td className="px-3 py-3"><span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs mr-1">P1</span> Normal</td><td className="px-3 py-3 text-center">Cơ bản</td><td className="px-3 py-3">Ngày thường, mùa thấp</td><td className="px-3 py-3 text-right font-mono">1.200.000đ</td></tr>
                        <tr className="border-t bg-amber-50"><td className="px-3 py-3"><span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs mr-1">P2</span> High</td><td className="px-3 py-3 text-center">Cao</td><td className="px-3 py-3">Cuối tuần, hè, sự kiện</td><td className="px-3 py-3 text-right font-mono">1.500.000đ</td></tr>
                        <tr className="border-t bg-red-50"><td className="px-3 py-3"><span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs mr-1">P3</span> Holiday</td><td className="px-3 py-3 text-center">Cao nhất</td><td className="px-3 py-3">Tết, Noel, 30/4, 2/9</td><td className="px-3 py-3 text-right font-mono">2.000.000đ</td></tr>
                    </tbody>
                </table>
                <div className="space-y-2">
                    <Step n={1} title="Bấm Config trên thanh điều khiển"><p className="text-sm text-gray-600">Panel &quot;Mùa (Seasons)&quot; sẽ hiện ra bên trái.</p></Step>
                    <Step n={2} title="Tạo Season"><p className="text-sm text-gray-600">Bấm nút <strong>+ NORMAL</strong>, <strong>+ HIGH</strong>, hoặc <strong>+ HOLIDAY</strong> để tạo season mới.</p></Step>
                    <Step n={3} title="Thêm khoảng ngày"><p className="text-sm text-gray-600">Mở season &rarr; <strong>+ Thêm</strong> khoảng ngày &rarr; chọn ngày bắt đầu và kết thúc.</p></Step>
                    <Step n={4} title="Thiết lập NET rates"><p className="text-sm text-gray-600">Trong mỗi season, nhập giá NET mong muốn cho từng hạng phòng.</p></Step>
                    <Step n={5} title="Lưu"><p className="text-sm text-gray-600">Bấm <strong>Lưu</strong> để áp dụng. Bảng giá sẽ tự cập nhật.</p></Step>
                </div>
                <Warn><strong>Quy tắc ưu tiên (auto-detect):</strong> Nếu 1 ngày thuộc nhiều season, hệ thống chọn season có <strong>priority cao nhất</strong>: Holiday (P3) {'>'} High (P2) {'>'} Normal (P1).</Warn>
            </Card>

            <Card id="dp-occ-tiers" title="Bậc OCC (Occupancy Tiers)" icon={<Percent className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3"><strong>OCC Tier</strong> là bậc thang giá theo công suất phòng. Mỗi bậc có <strong>hệ số nhân (multiplier)</strong>.</p>
                <table className="w-full text-sm mb-4">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-3 py-2 text-left text-gray-600">Bậc</th>
                            <th className="px-3 py-2 text-center text-gray-600">OCC%</th>
                            <th className="px-3 py-2 text-center text-gray-600">Hệ số</th>
                            <th className="px-3 py-2 text-left text-gray-600">Ý nghĩa</th>
                            <th className="px-3 py-2 text-right text-gray-600">NET (VD)</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        <tr className="border-t"><td className="px-3 py-3">#0</td><td className="px-3 py-3 text-center">0–35%</td><td className="px-3 py-3 text-center font-mono">&times;1.00</td><td className="px-3 py-3 text-gray-500">Phòng còn nhiều &rarr; giá gốc</td><td className="px-3 py-3 text-right font-mono">1.200.000đ</td></tr>
                        <tr className="border-t bg-blue-50"><td className="px-3 py-3">#1</td><td className="px-3 py-3 text-center">35–65%</td><td className="px-3 py-3 text-center font-mono">&times;1.10</td><td className="px-3 py-3 text-gray-500">Trung bình &rarr; tăng 10%</td><td className="px-3 py-3 text-right font-mono">1.320.000đ</td></tr>
                        <tr className="border-t bg-amber-50"><td className="px-3 py-3">#2</td><td className="px-3 py-3 text-center">65–85%</td><td className="px-3 py-3 text-center font-mono">&times;1.20</td><td className="px-3 py-3 text-gray-500">Gần kín &rarr; tăng 20%</td><td className="px-3 py-3 text-right font-mono">1.440.000đ</td></tr>
                        <tr className="border-t bg-red-50"><td className="px-3 py-3">#3</td><td className="px-3 py-3 text-center">{'>'} 85%</td><td className="px-3 py-3 text-center font-mono">&times;1.30</td><td className="px-3 py-3 text-gray-500">Sắp hết phòng &rarr; tăng 30%</td><td className="px-3 py-3 text-right font-mono">1.560.000đ</td></tr>
                    </tbody>
                </table>
                <Tip>OCC% được tính tự động từ dữ liệu OTB: <strong>OCC = Số phòng đã đặt / Tổng phòng khách sạn</strong>. Nếu chưa có dữ liệu, bạn có thể nhập tay.</Tip>
            </Card>

            <Card id="terms" title="Thuật ngữ Revenue Management" icon={<BookOpen className="w-5 h-5 text-blue-600" />}>
                <div className="grid sm:grid-cols-2 gap-3">
                    {[
                        { term: 'OTB', desc: 'On The Books — Tổng số phòng/doanh thu đã đặt' },
                        { term: 'ADR', desc: 'Average Daily Rate — Giá phòng trung bình mỗi đêm' },
                        { term: 'RevPAR', desc: 'Revenue Per Available Room — Doanh thu trên mỗi phòng khả dụng' },
                        { term: 'OCC%', desc: 'Occupancy — Tỷ lệ lấp đầy phòng (% phòng đã bán)' },
                        { term: 'Pickup', desc: 'Số phòng mới đặt thêm so với lần capture trước' },
                        { term: 'STLY', desc: 'Same Time Last Year — So sánh cùng kỳ năm trước' },
                        { term: 'Pace', desc: 'Chênh lệch OTB hiện tại vs STLY (nhanh hơn hay chậm hơn)' },
                        { term: 'Lead Time', desc: 'Số ngày từ lúc đặt đến ngày lưu trú' },
                    ].map(({ term, desc }) => (
                        <div key={term} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <span className="font-mono text-blue-600 font-medium text-sm">{term}</span>
                            <p className="text-xs text-gray-600 mt-1">{desc}</p>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <p className="text-blue-700 mb-3">Sẵn sàng xem dữ liệu khách sạn?</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"><BarChart3 className="w-4 h-4" /> Mở Dashboard</Link>
                    <Link href="/pricing" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"><Layers className="w-4 h-4" /> Đi tới Giá Linh Hoạt</Link>
                </div>
            </div>
        </>
    );
}
function PricingSection() {
    return (
        <>
            {/* Intro with 1 example */}
            <Card id="pricing-intro" title="Tính giá OTA — Tổng quan" icon={<Calculator className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700">Hệ thống tính 3 loại giá từ <strong>1 giá gốc duy nhất (NET)</strong>:</p>
                <div className="bg-gray-50 rounded-xl p-4 mt-3">
                    <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                        <div className="bg-emerald-100 border border-emerald-300 rounded-lg px-4 py-3 text-center">
                            <div className="font-medium text-emerald-800">NET</div>
                            <div className="text-lg font-mono font-bold text-emerald-700">1.000.000đ</div>
                            <div className="text-xs text-emerald-600">Bạn thu về</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                        <div className="bg-blue-100 border border-blue-300 rounded-lg px-4 py-3 text-center">
                            <div className="font-medium text-blue-800">BAR</div>
                            <div className="text-lg font-mono font-bold text-blue-700">1.250.000đ</div>
                            <div className="text-xs text-blue-600">Giá gốc trên OTA</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                        <div className="bg-purple-100 border border-purple-300 rounded-lg px-4 py-3 text-center">
                            <div className="font-medium text-purple-800">Display</div>
                            <div className="text-lg font-mono font-bold text-purple-700">1.062.500đ</div>
                            <div className="text-xs text-purple-600">Khách thấy (sau KM 15%)</div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card id="formula" title="2 Công thức tính giá" icon={<Calculator className="w-5 h-5 text-blue-600" />}>
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h4 className="font-medium text-blue-800 mb-2">Công thức 1: NET &rarr; BAR (Forward)</h4>
                        <p className="font-mono text-center text-lg">BAR = NET &divide; (1 - commission%)</p>
                        <p className="text-sm text-gray-600 mt-2 text-center">VD: 1.000.000 &divide; (1 - 0.20) = <strong>1.250.000đ</strong></p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <h4 className="font-medium text-purple-800 mb-2">Công thức 2: BAR &rarr; Display (sau KM)</h4>
                        <p className="font-mono text-center text-lg">Display = BAR &times; (1 - total_discount%)</p>
                        <p className="text-sm text-gray-600 mt-2 text-center">VD: 1.250.000 &times; (1 - 0.15) = <strong>1.062.500đ</strong></p>
                    </div>
                </div>
                <Tip>Hệ thống tính tự động. Bạn chỉ cần nhập NET — BAR và Display được tính sẵn.</Tip>
            </Card>

            <Card id="channels" title="Kênh OTA & Hoa hồng" icon={<Percent className="w-5 h-5 text-blue-600" />}>
                <p className="text-sm text-gray-600 mb-3">Mỗi OTA có cách tính khác nhau. Bấm vào từng kênh để xem chi tiết:</p>
                <div className="space-y-3">
                    <Accordion title="Agoda — Commission 15-22% | ADDITIVE stacking" defaultOpen>
                        <p>Agoda dùng <strong>ADDITIVE</strong> stacking: các KM cộng dồn vào nhau.</p>
                        <p className="mt-2">VD: Mobile 5% + Member Deal 10% + Early Bird 15% = <strong>30% tong discount</strong></p>
                        <div className="bg-gray-50 rounded-lg p-3 mt-2 text-xs space-y-1">
                            <p>BAR = 1.250.000đ</p>
                            <p>Total discount = 30%</p>
                            <p>Display = 1.250.000 &times; 0.70 = <strong>875.000đ</strong></p>
                            <p className="text-emerald-600">NET = 875.000 &times; (1 - 0.20) = <strong>700.000đ</strong></p>
                        </div>
                        <Warn><strong>Chú ý:</strong> Nếu stacking quá nhiều KM, NET có thể giảm dưới mức mong muốn!</Warn>
                    </Accordion>

                    <Accordion title="Booking.com — Commission 15-18% | PROGRESSIVE stacking">
                        <p>Booking dùng <strong>PROGRESSIVE</strong> stacking: KM tính luỹ tiến (KM2 áp lên giá sau KM1).</p>
                        <p className="mt-2">VD: Genius 20% &rarr; Mobile 10%</p>
                        <div className="bg-gray-50 rounded-lg p-3 mt-2 text-xs space-y-1">
                            <p>BAR = 1.250.000đ</p>
                            <p>Sau Genius 20% = 1.000.000đ</p>
                            <p>Sau Mobile 10% = <strong>900.000đ</strong> (Display)</p>
                            <p>Tổng giảm thực tế: 28% (không phải 30%)</p>
                        </div>
                    </Accordion>

                    <Accordion title="Expedia — Commission 18-25% | HIGHEST_WINS stacking">
                        <p>Expedia dùng <strong>HIGHEST_WINS</strong>: chỉ áp dụng 1 KM có % cao nhất.</p>
                        <p className="mt-2">VD: Có 3 KM: Package 20%, Member 15%, Flash 25% &rarr; chỉ áp <strong>Flash 25%</strong>.</p>
                    </Accordion>

                    <Accordion title="Traveloka — Commission 18-22% | SINGLE stacking">
                        <p>Traveloka dùng <strong>SINGLE</strong> (tương tự HIGHEST_WINS): chỉ 1 KM tại 1 thời điểm.</p>
                        <p className="mt-2">KM ưu tiên theo thứ tự: Flash Sale &rarr; PayLater &rarr; Coupon.</p>
                    </Accordion>

                    <Accordion title="CTRIP/Trip.com — Commission 20-25% | ONLY_WITH_GENIUS stacking">
                        <p>CTRIP dùng <strong>ONLY_WITH_GENIUS</strong>: KM bổ sung chỉ áp dụng khi đã có KM chính.</p>
                        <p className="mt-2">VD: CTrip VIP 15% (chính) + Extra 5% (chỉ khi có VIP) = 20%.</p>
                    </Accordion>
                </div>
            </Card>

            <Card id="promos" title="Khuyến mại & Stacking Rules" icon={<Tag className="w-5 h-5 text-blue-600" />}>
                <div className="grid sm:grid-cols-2 gap-3">
                    <div className="border border-blue-200 rounded-xl p-4">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">ADDITIVE</span>
                        <p className="text-sm text-gray-700 mt-2">Cộng dồn: 10% + 15% = <strong>25%</strong></p>
                        <p className="text-xs text-gray-500 mt-1">Agoda</p>
                    </div>
                    <div className="border border-purple-200 rounded-xl p-4">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">PROGRESSIVE</span>
                        <p className="text-sm text-gray-700 mt-2">Luỹ tiến: áp KM2 lên giá sau KM1</p>
                        <p className="text-xs text-gray-500 mt-1">Booking.com</p>
                    </div>
                    <div className="border border-amber-200 rounded-xl p-4">
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">HIGHEST_WINS</span>
                        <p className="text-sm text-gray-700 mt-2">Chỉ áp KM có % cao nhất</p>
                        <p className="text-xs text-gray-500 mt-1">Expedia</p>
                    </div>
                    <div className="border border-emerald-200 rounded-xl p-4">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">SINGLE / ONLY_WITH</span>
                        <p className="text-sm text-gray-700 mt-2">Chỉ 1 KM / KM phụ thuộc KM chính</p>
                        <p className="text-xs text-gray-500 mt-1">Traveloka, CTRIP</p>
                    </div>
                </div>
            </Card>

            <Card id="compare" title="So sánh giữa các kênh OTA" icon={<ArrowRightLeft className="w-5 h-5 text-blue-600" />}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-3 py-2 text-left text-gray-600">Kênh</th>
                                <th className="px-3 py-2 text-center text-gray-600">Hoa hồng</th>
                                <th className="px-3 py-2 text-center text-gray-600">Stacking</th>
                                <th className="px-3 py-2 text-right text-gray-600">NET (VD)</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            <tr className="border-t"><td className="px-3 py-2">Agoda</td><td className="px-3 py-2 text-center">15-22%</td><td className="px-3 py-2 text-center"><span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">ADDITIVE</span></td><td className="px-3 py-2 text-right font-mono">700.000đ</td></tr>
                            <tr className="border-t"><td className="px-3 py-2">Booking</td><td className="px-3 py-2 text-center">15-18%</td><td className="px-3 py-2 text-center"><span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">PROGRESSIVE</span></td><td className="px-3 py-2 text-right font-mono">738.000đ</td></tr>
                            <tr className="border-t"><td className="px-3 py-2">Expedia</td><td className="px-3 py-2 text-center">18-25%</td><td className="px-3 py-2 text-center"><span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">HIGHEST_WINS</span></td><td className="px-3 py-2 text-right font-mono">750.000đ</td></tr>
                            <tr className="border-t"><td className="px-3 py-2">Traveloka</td><td className="px-3 py-2 text-center">18-22%</td><td className="px-3 py-2 text-center"><span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">SINGLE</span></td><td className="px-3 py-2 text-right font-mono">780.000đ</td></tr>
                            <tr className="border-t"><td className="px-3 py-2">CTRIP</td><td className="px-3 py-2 text-center">20-25%</td><td className="px-3 py-2 text-center"><span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">ONLY_WITH</span></td><td className="px-3 py-2 text-right font-mono">720.000đ</td></tr>
                        </tbody>
                    </table>
                </div>
                <Tip>Cùng 1 giá NET, mỗi kênh sẽ cho khách thấy giá khác nhau do cách tính KM và hoa hồng khác nhau.</Tip>
            </Card>

            <Card id="price-matrix" title="Bảng giá Ma trận" icon={<Layers className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">Bảng giá hiển thị giá cho <strong>tất cả hạng phòng &times; tất cả bậc OCC</strong> cùng lúc.</p>
                <table className="w-full text-sm mb-3">
                    <thead className="bg-gray-100">
                        <tr><th className="px-3 py-2 text-left text-gray-600">Thành phần</th><th className="px-3 py-2 text-left text-gray-600">Ý nghĩa</th></tr>
                    </thead>
                    <tbody className="text-gray-700">
                        <tr className="border-t"><td className="px-3 py-2 font-medium">Cột &quot;Hạng phòng&quot;</td><td className="px-3 py-2">Tên hạng phòng (Deluxe, Superior, Suite...)</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium">Cột &quot;NET cơ sở&quot;</td><td className="px-3 py-2">Giá NET theo season (chưa nhân OCC)</td></tr>
                        <tr className="border-t bg-blue-50"><td className="px-3 py-2 font-medium">Cột bậc OCC</td><td className="px-3 py-2">Giá sau khi nhân hệ số OCC (tùy chế độ: NET/BAR/Display)</td></tr>
                        <tr className="border-t bg-blue-100"><td className="px-3 py-2 font-medium">Cột highlight (xanh đậm)</td><td className="px-3 py-2"><strong>Bậc đang áp dụng</strong> theo OCC% thực tế</td></tr>
                        <tr className="border-t bg-red-50"><td className="px-3 py-2 font-medium">Ô đỏ</td><td className="px-3 py-2"><strong>Vi phạm guardrail</strong> — giá quá cao hoặc quá thấp</td></tr>
                    </tbody>
                </table>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="font-medium text-blue-700 mb-2">3 chế độ xem:</p>
                    <div className="grid sm:grid-cols-3 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="font-medium text-emerald-700 text-sm">Thu về (NET)</div>
                            <p className="text-xs text-gray-600 mt-1">Tiền khách sạn thực nhận</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="font-medium text-blue-700 text-sm">BAR</div>
                            <p className="text-xs text-gray-600 mt-1">Giá gốc trước KM, sau hoa hồng</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="font-medium text-purple-700 text-sm">Hiển thị (Display)</div>
                            <p className="text-xs text-gray-600 mt-1">Giá khách thấy trên OTA</p>
                        </div>
                    </div>
                </div>
            </Card>

            <Card id="reverse" title="Tính ngược: BAR &rarr; NET" icon={<ArrowRightLeft className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">Khi bạn biết giá BAR và muốn biết NET thực nhận:</p>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="font-mono text-lg">NET = BAR &times; (1 - commission%)</p>
                    <p className="text-sm text-gray-600 mt-2">VD: BAR = 1.250.000, Commission Agoda = 20%</p>
                    <p className="text-sm text-gray-600">NET = 1.250.000 &times; 0.80 = <strong>1.000.000đ</strong></p>
                </div>
                <Tip>Tab &quot;Tính ngược&quot; trên trang Pricing cho phép bạn nhập BAR để tính NET cho từng kênh OTA.</Tip>
            </Card>

            <Card id="dp-export" title="Xuất CSV" icon={<Download className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">Bấm nút <strong>Export</strong> để tải bảng giá dưới dạng file CSV.</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                    <li>Tất cả hạng phòng</li>
                    <li>Giá NET cơ sở</li>
                    <li>Giá NET, BAR, Display cho từng bậc OCC</li>
                </ul>
                <Tip>Mở file CSV bằng Excel hoặc Google Sheets &rarr; In ra cho team Front Desk hoặc gửi cho Sales Manager để cập nhật giá lên OTA.</Tip>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <p className="text-blue-700 mb-3">Sẵn sàng tính giá cho các kênh OTA?</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/pricing" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"><Calculator className="w-4 h-4" /> Mở Tính giá OTA</Link>
                </div>
            </div>
        </>
    );
}
function DataSection() {
    return (
        <>
            <Card id="upload" title="Import dữ liệu" icon={<Upload className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">Upload file dữ liệu từ PMS (Property Management System) để hệ thống có dữ liệu phân tích.</p>
                <div className="space-y-3">
                    <Step n={1} title="Chuẩn bị file">
                        <p className="text-sm text-gray-600">Xuất dữ liệu booking từ PMS (Opera, RoomRaccoon, Cloudbeds...) dưới dạng <strong>XML hoặc CSV</strong>.</p>
                        <Tip>File cần chứa: tên khách, ngày đặt, ngày lưu trú, hạng phòng, giá.</Tip>
                    </Step>
                    <Step n={2} title="Upload file">
                        <p className="text-sm text-gray-600">Kéo thả file vào vùng upload hoặc bấm chọn file.</p>
                        <DeepLink href="/upload">Mở trang Upload</DeepLink>
                    </Step>
                    <Step n={3} title="Kiểm tra kết quả">
                        <p className="text-sm text-gray-600">Hệ thống hiển thị số dòng dữ liệu được xử lý và cảnh báo (nếu có).</p>
                    </Step>
                </div>
                <Warn><strong>Upload mỗi ngày (sáng)</strong> để có số liệu chính xác nhất. Hệ thống tự động skip dòng trùng lập.</Warn>
            </Card>

            <Card id="build-otb" title="Build OTB" icon={<Database className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">Bước này tổng hợp dữ liệu booking thành <strong>OTB (On The Books)</strong> — số phòng đã đặt cho từng ngày.</p>
                <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                    <p><strong>Input:</strong> Dữ liệu booking (từ Upload)</p>
                    <p><strong>Output:</strong> Bảng OTB: số phòng/doanh thu đã đặt cho mỗi stay_date</p>
                    <p><strong>Thời gian:</strong> ~10–30 giây</p>
                </div>
                <DeepLink href="/data">Mở trang Dữ liệu</DeepLink>
            </Card>

            <Card id="build-features" title="Build Features" icon={<Settings className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">Tính các chỉ số phân tích từ dữ liệu OTB:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                    <li><strong>Pickup:</strong> Số phòng mới đặt (so sánh với 7 ngày trước)</li>
                    <li><strong>STLY:</strong> Số phòng cùng kỳ năm trước</li>
                    <li><strong>Pace:</strong> Tốc độ bán phòng so với năm trước</li>
                    <li><strong>Remaining Supply:</strong> Số phòng còn trống</li>
                </ul>
                <Warn>Cần ít nhất <strong>2 lần upload cách nhau 7 ngày</strong> để có Pickup thực tế. Trước đó, hệ thống sẽ hiện &quot;N/A&quot;.</Warn>
            </Card>

            <Card id="run-forecast" title="Run Forecast" icon={<TrendingUp className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">Dự báo số phòng sẽ đặt thêm trong tương lai dựa trên booking pace:</p>
                <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                    <p><strong>Khi có đủ pickup:</strong> Dự báo chính xác dựa trên xu hướng thực tế</p>
                    <p><strong>Khi chưa có đủ pickup:</strong> Hiện &quot;Ước lượng&quot; bằng sơ bộ (ít chính xác hơn)</p>
                </div>
                <Pipeline steps={['Upload file', 'Build OTB', 'Build Features', 'Run Forecast']} />
                <Tip>Sau khi hoàn thành 4 bước, quay lại Dashboard để xem KPI và Khuyến nghị giá mới nhất.</Tip>
                <DeepLink href="/dashboard">Mở Dashboard</DeepLink>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <p className="text-blue-700 mb-3">Sẵn sàng xử lý dữ liệu?</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/upload" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"><Upload className="w-4 h-4" /> Upload dữ liệu</Link>
                    <Link href="/data" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"><Database className="w-4 h-4" /> Mở trang Dữ liệu</Link>
                </div>
            </div>
        </>
    );
}
