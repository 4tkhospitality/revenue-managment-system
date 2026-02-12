'use client';

import { useState, useEffect } from 'react';
import {
    BookOpen, BarChart3, TrendingUp, DollarSign, CalendarDays, Upload, Database,
    HelpCircle, Calculator, Percent, Tag, ArrowRightLeft, Lock, ChevronRight,
    Layers, Settings, Download,
} from 'lucide-react';
import { validateOTBData, type ValidationResult } from '../actions/validateOTBData';
import Link from 'next/link';
import { useTierAccess } from '@/hooks/useTierAccess';
import { TierPaywall } from '@/components/paywall/TierPaywall';

type SectionId = 'quickstart' | 'analytics' | 'pricing' | 'dynamic-pricing' | 'data';

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode; sub?: { id: string; label: string }[] }[] = [
    {
        id: 'quickstart', label: 'Bắt đầu nhanh', icon: <HelpCircle className="w-4 h-4" />,
        sub: [
            { id: 'welcome', label: 'Giới thiệu' },
            { id: 'steps', label: '5 bước bắt đầu' },
            { id: 'daily', label: 'Quy trình hàng ngày' },
            { id: 'faq', label: 'Câu hỏi thường gặp' },
        ],
    },
    {
        id: 'analytics', label: 'Tổng quan & Phân tích', icon: <BarChart3 className="w-4 h-4" />,
        sub: [
            { id: 'rm-intro', label: 'Revenue Management là gì?' },
            { id: 'kpi', label: 'Các thẻ KPI' },
            { id: 'charts', label: 'Biểu đồ OTB' },
            { id: 'rec-table', label: 'Bảng khuyến nghị giá' },
            { id: 'terms', label: 'Thuật ngữ chuyên ngành' },
        ],
    },
    {
        id: 'pricing', label: 'Định giá OTA', icon: <Calculator className="w-4 h-4" />,
        sub: [
            { id: 'pricing-intro', label: 'Tổng quan' },
            { id: 'formula', label: '2 công thức tính giá' },
            { id: 'room-types', label: 'Hạng phòng' },
            { id: 'channels', label: 'Kênh OTA & Hoa hồng' },
            { id: 'promos', label: 'Khuyến mãi & Stacking' },
            { id: 'agoda-engine', label: '🟡 Agoda' },
            { id: 'booking-engine', label: '🔵 Booking.com' },
            { id: 'expedia-engine', label: '🟣 Expedia' },
            { id: 'traveloka-engine', label: '🟢 Traveloka' },
            { id: 'ctrip-engine', label: '🔴 CTRIP/Trip.com' },
            { id: 'compare', label: 'So sánh giữa các kênh' },
            { id: 'price-matrix', label: 'Bảng giá tổng hợp' },
            { id: 'reverse', label: 'Tính ngược (BAR → NET)' },
        ],
    },
    {
        id: 'dynamic-pricing', label: 'Giá Linh Hoạt', icon: <Layers className="w-4 h-4" />,
        sub: [
            { id: 'dp-overview', label: 'Tổng quan' },
            { id: 'dp-controls', label: 'Bộ điều khiển' },
            { id: 'dp-seasons', label: 'Mùa (Seasons)' },
            { id: 'dp-occ-tiers', label: 'Bậc OCC' },
            { id: 'dp-matrix', label: 'Bảng giá ma trận' },
            { id: 'dp-export', label: 'Xuất CSV' },
            { id: 'dp-faq', label: 'Câu hỏi thường gặp' },
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

export default function GuidePage() {
    const [activeSection, setActiveSection] = useState<SectionId>('quickstart');
    const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set(['quickstart']));
    const { hasAccess: hasRevenueAccess, loading: tierLoading } = useTierAccess('SUPERIOR');

    useEffect(() => {
        if (!tierLoading && hasRevenueAccess) {
            setActiveSection('analytics');
            setExpandedSections(new Set(['analytics']));
        }
    }, [tierLoading, hasRevenueAccess]);

    const toggleExpand = (id: SectionId) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleNav = (sectionId: SectionId, subId?: string) => {
        setActiveSection(sectionId);
        setExpandedSections(prev => new Set(prev).add(sectionId));
        if (subId) {
            setTimeout(() => document.getElementById(subId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
    };

    return (
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 space-y-4">
            {/* Header */}
            <header
                className="rounded-2xl px-6 py-4 text-white shadow-sm"
                style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
            >
                <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    <h1 className="text-lg font-semibold">Hướng dẫn sử dụng RMS</h1>
                </div>
                <p className="text-white/70 text-sm mt-1">
                    Tài liệu hướng dẫn dành cho General Manager và nhân viên quản lý doanh thu
                </p>
            </header>

            {/* Body: Sidebar + Content */}
            <div className="flex gap-6">
                {/* Left Sidebar Nav */}
                <nav className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-6 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        {SECTIONS.map(sec => (
                            <div key={sec.id}>
                                <button
                                    onClick={() => { handleNav(sec.id); toggleExpand(sec.id); }}
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
                                title="Tổng quan & Phân tích"
                                subtitle="Hướng dẫn phân tích OTB, Pickup, Forecast và Revenue Management"
                                tierDisplayName="Superior"
                                colorScheme="blue"
                                features={[
                                    { icon: <BarChart3 className="w-4 h-4" />, label: 'Hiểu OTB (On The Books) và Pickup' },
                                    { icon: <TrendingUp className="w-4 h-4" />, label: 'Phân tích Booking Pace & Remaining Supply' },
                                    { icon: <DollarSign className="w-4 h-4" />, label: 'Chiến lược định giá theo demand' },
                                    { icon: <CalendarDays className="w-4 h-4" />, label: 'Daily Actions workflow hàng ngày' },
                                ]}
                            />
                        ) : <AnalyticsSection />
                    )}
                    {activeSection === 'pricing' && <PricingSection />}
                    {activeSection === 'dynamic-pricing' && <DynamicPricingSection />}
                    {activeSection === 'data' && <DataSection />}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════ SECTION 1: BẮT ĐẦU NHANH ═══════════════════════ */
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
            <Card id="welcome" title="Bắt đầu sử dụng RMS" icon={<HelpCircle className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700">
                    Hệ thống Quản lý Doanh thu giúp bạn tối ưu hóa giá phòng và tăng doanh thu khách sạn.
                    Làm theo 5 bước dưới đây để bắt đầu.
                </p>
            </Card>

            <Card id="steps" title="5 bước bắt đầu">
                <div className="space-y-5">
                    <Step n={1} title="Đăng nhập">
                        <p className="text-sm text-gray-600">Sử dụng tài khoản Google được admin cấp. Sau khi đăng nhập, bạn sẽ thấy khách sạn được gán trong sidebar.</p>
                        <Tip>Nếu chưa có quyền truy cập, liên hệ admin qua Zalo: 0778602953</Tip>
                    </Step>
                    <hr className="border-gray-100" />
                    <Step n={2} title="Upload dữ liệu từ PMS">
                        <p className="text-sm text-gray-600">Vào menu <strong>Upload</strong> → Kéo thả file XML hoặc CSV từ PMS (Opera, RoomRaccoon, Cloudbeds...).</p>
                        <Warn>Upload dữ liệu mỗi ngày (sáng) để có số liệu chính xác nhất.</Warn>
                    </Step>
                    <hr className="border-gray-100" />
                    <Step n={3} title="Build dữ liệu (tự động)">
                        <p className="text-sm text-gray-600">Vào menu <strong>Dữ liệu</strong> → Nhấn các nút theo thứ tự:</p>
                        <Pipeline steps={['Build OTB', 'Build Features', 'Run Forecast']} />
                    </Step>
                    <hr className="border-gray-100" />
                    <Step n={4} title="Xem Dashboard">
                        <ul className="space-y-1 text-gray-600 text-sm list-disc list-inside ml-2">
                            <li><strong>KPI Cards:</strong> Rooms OTB, Remaining Supply, Pickup</li>
                            <li><strong>Charts:</strong> Biểu đồ OTB theo ngày, so sánh năm trước</li>
                            <li><strong>Price Table:</strong> Giá khuyến nghị cho từng ngày</li>
                        </ul>
                    </Step>
                    <hr className="border-gray-100" />
                    <Step n={5} title="Ra Quyết định Giá">
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                                <div className="font-medium text-gray-800">Chấp nhận</div>
                                <p className="text-xs text-gray-500 mt-1">Đồng ý với giá hệ thống đề xuất</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                                <div className="font-medium text-gray-800">Override</div>
                                <p className="text-xs text-gray-500 mt-1">Nhập giá theo ý mình</p>
                            </div>
                        </div>
                    </Step>
                </div>
            </Card>

            <Card id="daily" title="Quy trình hàng ngày" icon={<CalendarDays className="w-5 h-5 text-blue-600" />}>
                <ol className="space-y-2 text-gray-700 text-sm">
                    {['Sáng: Export báo cáo từ PMS → Upload vào hệ thống', 'Vào Dashboard xem tình hình booking hôm nay', 'Review giá khuyến nghị, Accept hoặc Override', 'Cập nhật giá lên Channel Manager / OTA'].map((t, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <span className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 shrink-0 mt-0.5">{i + 1}</span>
                            <span>{t}</span>
                        </li>
                    ))}
                </ol>
            </Card>

            <Card id="faq" title="Câu hỏi thường gặp" icon={<HelpCircle className="w-5 h-5 text-blue-600" />}>
                <div className="space-y-4">
                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Data Quality: {warningCount > 0 ? `${warningCount.toLocaleString()} cảnh báo` : 'Không có cảnh báo'}</h4>
                        <p className="text-gray-600 text-sm">{warningCount > 0 ? <>Phần lớn cảnh báo là <code className="bg-gray-100 px-1 rounded text-xs">PAST_STAY_DATE</code> — dữ liệu có các ngày lưu trú đã qua.</> : 'Tất cả dữ liệu đều hợp lệ.'}</p>
                        {totalRows > 0 && <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mt-2"><strong>Khách sạn của bạn:</strong> {totalRows.toLocaleString()} dòng OTB{pastCount > 0 && <>, trong đó {pastCount.toLocaleString()} dòng đã qua ({pastPct}%)</>}. Hoàn thiện: <strong>{completeness}%</strong>.</div>}
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="font-medium text-gray-900 mb-2">&quot;Pickup TB: N/A&quot; — Tại sao không hiện số?</h4>
                        <p className="text-gray-600 text-sm"><strong>Pickup</strong> = So sánh số phòng đặt hôm nay với 7 ngày trước. Cần ít nhất <strong>2 lần upload cách nhau ≥ 7 ngày</strong>.</p>
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Dự báo hiện &quot;Ước lượng&quot; — Có chính xác không?</h4>
                        <p className="text-gray-600 text-sm">Khi chưa có đủ dữ liệu pickup, hệ thống dùng ước lượng sơ bộ. Sau <strong>≥ 2 lần upload cách nhau ≥ 7 ngày</strong>, dự báo sẽ dựa trên pickup thực tế.</p>
                    </div>
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

/* ═══════════════════════ SECTION 2: TỔNG QUAN & PHÂN TÍCH ═══════════════════════ */
function AnalyticsSection() {
    return (
        <>
            <Card id="rm-intro" title="Revenue Management là gì?" icon={<HelpCircle className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700"><strong>Revenue Management (RM)</strong> hay Quản lý Doanh thu là nghệ thuật bán đúng phòng, cho đúng khách, vào đúng thời điểm, với mức giá tối ưu.</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700 mt-3">
                    <li>Theo dõi lượng đặt phòng (OTB - On The Books)</li>
                    <li>Theo dõi và xử lý các booking bị hủy</li>
                    <li>Dự đoán nhu cầu tương lai</li>
                    <li>Đề xuất mức giá tối ưu cho từng ngày</li>
                </ul>
            </Card>

            <Card id="kpi" title="Các thẻ KPI (Chỉ số chính)" icon={<BarChart3 className="w-5 h-5 text-blue-600" />}>
                <div className="space-y-3">
                    <KPIExplain color="blue" emoji="📊" name="Rooms OTB" desc="Tổng số phòng đã được đặt (On The Books) trong 30 ngày tới." />
                    <KPIExplain color="purple" emoji="🏨" name="Remaining Supply" desc="Số phòng còn trống có thể bán trong 30 ngày tới." />
                    <div className="bg-emerald-50 p-4 rounded-xl border-l-4 border-emerald-500">
                        <div className="text-emerald-700 font-medium mb-2">📈 Avg Pickup T7</div>
                        <p className="text-sm text-gray-700"><strong>Ý nghĩa:</strong> Trung bình số phòng được đặt THÊM trong 7 ngày qua.</p>
                        <p className="text-sm text-amber-600 mt-2"><strong>💡 Insight:</strong> Pickup cao = demand đang tăng → có thể tăng giá.</p>
                    </div>
                </div>
            </Card>

            <Card id="charts" title="Biểu đồ OTB theo ngày">
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm text-gray-700">
                    <li><strong>Trục ngang (X):</strong> Các ngày lưu trú</li>
                    <li><strong>Trục dọc (Y):</strong> Số phòng đã được đặt</li>
                    <li><strong>Cột cao (màu xanh):</strong> Ngày có nhiều booking → Demand cao</li>
                    <li><strong>Cột thấp:</strong> Ngày ít booking → Cần promotion</li>
                </ul>
            </Card>

            <Card id="rec-table" title="Bảng khuyến nghị giá">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left text-gray-600">Cột</th><th className="px-3 py-2 text-left text-gray-600">Giải thích</th></tr></thead>
                    <tbody className="text-gray-700">
                        <tr className="border-t border-gray-100"><td className="px-3 py-3 font-medium">Stay Date</td><td className="px-3 py-3">Ngày khách ở (check-in date).</td></tr>
                        <tr className="border-t border-gray-100"><td className="px-3 py-3 font-medium">OTB</td><td className="px-3 py-3">Số phòng đã đặt cho ngày đó.</td></tr>
                        <tr className="border-t border-gray-100 bg-emerald-50"><td className="px-3 py-3 font-medium text-emerald-700">Recommended</td><td className="px-3 py-3">Giá khuyến nghị do Pricing Engine tính.</td></tr>
                    </tbody>
                </table>
            </Card>

            <Card id="terms" title="Thuật ngữ chuyên ngành" icon={<TrendingUp className="w-5 h-5 text-blue-600" />}>
                <table className="w-full text-sm">
                    <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left text-gray-600">Thuật ngữ</th><th className="px-3 py-2 text-left text-gray-600">Giải thích</th></tr></thead>
                    <tbody className="text-gray-700">
                        {[
                            ['OTB', 'On The Books - Số phòng/doanh thu đã được đặt'],
                            ['ADR', 'Average Daily Rate - Giá phòng trung bình'],
                            ['RevPAR', 'Revenue Per Available Room - Doanh thu/phòng khả dụng'],
                            ['Occupancy', 'Tỷ lệ lấp đầy - % phòng được bán'],
                            ['Pickup', 'Lượng booking mới trong khoảng thời gian'],
                        ].map(([term, desc]) => (
                            <tr key={term} className="border-t border-gray-100"><td className="px-3 py-3 font-mono text-blue-600">{term}</td><td className="px-3 py-3">{desc}</td></tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </>
    );
}

/* ═══════════════════════ SECTION 3: ĐỊNH GIÁ OTA ═══════════════════════ */
function PricingSection() {
    return (
        <>
            <Card id="pricing-intro" title="Tổng quan về Tính giá OTA" icon={<Calculator className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700">Module <strong>Tính giá OTA</strong> giúp bạn tính toán giá hiển thị trên các kênh bán phòng (Agoda, Booking.com, Expedia...) sao cho đảm bảo thu về đúng số tiền mong muốn sau khi trừ hoa hồng và khuyến mãi.</p>
                <p className="text-gray-700 mt-2">Hệ thống hỗ trợ <strong>2 chế độ tính</strong>:</p>
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="font-medium text-blue-700 mb-1">① NET → BAR (Thu về → Giá hiển thị)</p>
                        <p className="text-sm text-gray-700">Bạn nhập số tiền muốn thu về, hệ thống tính ra giá cần đăng trên OTA.</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <p className="font-medium text-emerald-700 mb-1">② BAR → NET (Giá hiển thị → Thu về)</p>
                        <p className="text-sm text-gray-700">Bạn nhập giá trên OTA, hệ thống tính ngược xem thu về bao nhiêu.</p>
                    </div>
                </div>
            </Card>

            <Card id="formula" title="2 công thức tính giá" icon={<TrendingUp className="w-5 h-5 text-blue-600" />}>
                <table className="w-full text-sm mb-4">
                    <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left text-gray-600">Thuật ngữ</th><th className="px-3 py-2 text-left text-gray-600">Giải thích</th></tr></thead>
                    <tbody className="text-gray-700">
                        <tr className="border-t"><td className="px-3 py-3 font-medium text-emerald-600">NET</td><td className="px-3 py-3">Giá thu về mong muốn (tiền thực nhận)</td></tr>
                        <tr className="border-t"><td className="px-3 py-3 font-medium text-blue-600">BAR</td><td className="px-3 py-3">Best Available Rate - Giá hiển thị trên OTA</td></tr>
                        <tr className="border-t"><td className="px-3 py-3 font-medium text-orange-600">Hoa hồng</td><td className="px-3 py-3">% OTA thu (VD: Agoda 20%, Booking 18%)</td></tr>
                        <tr className="border-t"><td className="px-3 py-3 font-medium text-purple-600">KM</td><td className="px-3 py-3">Khuyến mãi (Early Bird, Mobile Deal...)</td></tr>
                    </tbody>
                </table>

                {/* Formula 1: NET → BAR */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="font-medium text-blue-700 mb-2">① NET → BAR (Thu về → Giá hiển thị)</p>
                    <div className="bg-white rounded-lg p-3 font-mono text-center">
                        <p className="text-lg"><strong>BAR</strong> = NET ÷ (1 - Hoa hồng) ÷ (1 - KM₁) ÷ (1 - KM₂) ...</p>
                    </div>
                    <div className="text-sm text-gray-700 mt-3 font-mono">
                        <p><strong>VD:</strong> NET = 1.000.000đ, Booking 18%, Genius L3 20%, Early Booker 15%</p>
                        <p>BAR = 1.000.000 ÷ 0.82 ÷ 0.80 ÷ 0.85 = <strong>1.793.000đ</strong></p>
                    </div>
                </div>

                {/* Formula 2: BAR → NET */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-3">
                    <p className="font-medium text-emerald-700 mb-2">② BAR → NET (Giá hiển thị → Thu về)</p>
                    <div className="bg-white rounded-lg p-3 font-mono text-center">
                        <p className="text-lg"><strong>NET</strong> = BAR × (1 - Hoa hồng) × (1 - KM₁) × (1 - KM₂) ...</p>
                    </div>
                    <div className="text-sm text-gray-700 mt-3 font-mono">
                        <p><strong>VD:</strong> BAR = 1.500.000đ, Booking 18%, Genius L2 15%</p>
                        <p>NET = 1.500.000 × 0.82 × 0.85 = <strong>1.045.500đ</strong> (thu về 70%)</p>
                    </div>
                </div>

                <Tip>Tùy bạn muốn &quot;biết giá cần đặt&quot; hay &quot;biết mình thu được bao nhiêu&quot;, chọn chế độ tính phù hợp ở tab Bảng giá.</Tip>
            </Card>

            <Card id="room-types" title="Quản lý Hạng phòng">
                <p className="text-gray-700">Tạo các hạng phòng với giá NET mong muốn cho từng loại:</p>
                <table className="w-full text-sm mt-3">
                    <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left text-gray-600">Hạng phòng</th><th className="px-3 py-2 text-right text-gray-600">Giá NET</th></tr></thead>
                    <tbody className="text-gray-700">
                        <tr className="border-t"><td className="px-3 py-3">Standard</td><td className="px-3 py-3 text-right font-mono">1.000.000đ</td></tr>
                        <tr className="border-t"><td className="px-3 py-3">Deluxe</td><td className="px-3 py-3 text-right font-mono">1.500.000đ</td></tr>
                        <tr className="border-t"><td className="px-3 py-3">Suite</td><td className="px-3 py-3 text-right font-mono">2.500.000đ</td></tr>
                    </tbody>
                </table>
                <Tip>Giá NET là số tiền bạn muốn THỰC NHẬN sau khi OTA trừ hết các khoản.</Tip>
            </Card>

            <Card id="channels" title="Kênh OTA & Hoa hồng" icon={<Percent className="w-5 h-5 text-blue-600" />}>
                <table className="w-full text-sm">
                    <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left text-gray-600">Kênh</th><th className="px-3 py-2 text-center text-gray-600">Hoa hồng</th><th className="px-3 py-2 text-center text-gray-600">Kiểu tính</th><th className="px-3 py-2 text-left text-gray-600">Ghi chú</th></tr></thead>
                    <tbody className="text-gray-700">
                        {[
                            ['Agoda', '20%', 'Additive (cộng dồn)', 'Châu Á'],
                            ['Booking.com', '18%', 'Progressive (lũy tiến)', 'Toàn cầu'],
                            ['Expedia', '17%', 'Single (chọn 1 cao nhất)', 'Thị trường Mỹ'],
                            ['Traveloka', '15%', 'Additive (cộng dồn)', 'Đông Nam Á'],
                            ['CTRIP', '18%', 'Additive (cộng dồn)', 'Khách Trung Quốc'],
                        ].map(([name, com, calc, note]) => (
                            <tr key={name} className="border-t"><td className="px-3 py-3 font-medium">{name}</td><td className="px-3 py-3 text-center">{com}</td><td className="px-3 py-3 text-center text-xs">{calc}</td><td className="px-3 py-3 text-gray-500">{note}</td></tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <Card id="promos" title="Khuyến mãi & Quy tắc Stacking" icon={<Tag className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">Các loại khuyến mãi phổ biến và quy tắc kết hợp:</p>
                <div className="grid gap-3">
                    {[
                        { emoji: '🌙', name: 'Early Bird', desc: 'Đặt sớm trước 7-30 ngày, giảm 10-20%', color: 'blue' },
                        { emoji: '📱', name: 'Mobile Deal', desc: 'Đặt qua app, giảm 5-10%', color: 'purple' },
                        { emoji: '⚡', name: 'Last Minute', desc: 'Đặt gấp trong 24h, giảm 15-25%', color: 'amber' },
                        { emoji: '🔒', name: 'Member Deal', desc: 'Thành viên VIP (Genius, Agoda VIP), giảm 5-20%', color: 'emerald' },
                    ].map(p => (
                        <div key={p.name} className={`bg-${p.color}-50 p-3 rounded-xl border border-${p.color}-100`}>
                            <div className={`font-medium text-${p.color}-700`}>{p.emoji} {p.name}</div>
                            <p className="text-sm text-gray-600">{p.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                    <p className="font-medium text-blue-700 mb-2">📌 3 kiểu tính trong hệ thống:</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                        <li><strong>Additive (Cộng dồn):</strong> Tổng KM = KM₁ + KM₂ + ... VD: 10% + 5% = <strong>15%</strong>. Dùng bởi: Agoda, Traveloka, CTRIP.</li>
                        <li><strong>Progressive (Lũy tiến):</strong> Mỗi KM nhân trên giá đã giảm. VD: 10% + 5% → 1-(0.90×0.95) = <strong>14.5%</strong>. Dùng bởi: Booking.com.</li>
                        <li><strong>Single Discount (Chọn 1):</strong> Chỉ áp deal cao nhất, không stack. Dùng bởi: Expedia.</li>
                    </ul>
                </div>
            </Card>

            {/* ═══ ALL CHANNELS ═══ */}

            {/* Agoda */}
            <Card id="agoda-engine" title="🟡 Agoda — Chi tiết cách tính">
                <p className="text-gray-700 mb-3">Agoda sử dụng <strong>ADDITIVE (Cộng dồn)</strong> — tất cả KM được <strong>cộng thẳng</strong> vào nhau. Commission mặc định <strong>20%</strong>.</p>

                <h4 className="font-semibold text-gray-800 mb-2">3 nhóm khuyến mãi:</h4>
                <table className="w-full text-sm mb-4">
                    <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">Nhóm</th><th className="px-3 py-2 text-left">Promotions</th><th className="px-3 py-2 text-left">Quy tắc</th></tr></thead>
                    <tbody className="text-gray-700 text-sm">
                        <tr className="border-t"><td className="px-3 py-2 font-medium"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block mr-1.5" />SEASONAL</td><td className="px-3 py-2">Double Day, Payday, Night Owl, Summer Vibes</td><td className="px-3 py-2"><strong>Chỉ chọn 1</strong> trong nhóm này</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block mr-1.5" />ESSENTIAL</td><td className="px-3 py-2">Early Bird, Last-Minute, Long Stay, Occupancy</td><td className="px-3 py-2"><strong>Stack thoải mái</strong></td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block mr-1.5" />TARGETED</td><td className="px-3 py-2">VIP Silver/Gold/Platinum, Mobile, Geo, Package, Beds</td><td className="px-3 py-2">Cùng subcategory → <strong>chỉ lấy cao nhất</strong></td></tr>
                    </tbody>
                </table>

                <div className="bg-gray-50 rounded-xl p-4 text-sm">
                    <p className="font-medium text-gray-800 mb-1">Công thức: BAR = NET ÷ (1 - 20%) ÷ (1 - Tổng KM)</p>
                    <p className="text-gray-600">VD: Payday 12% + Early Bird 10% + VIP Gold 10% → Tổng KM = <strong>32%</strong></p>
                    <p className="text-gray-600">BAR = 1.000.000 ÷ 0.80 ÷ 0.68 = <strong>1.838.000đ</strong></p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
                    <p className="text-sm text-amber-700"><strong>📢 Commission Boosters:</strong> AGP (10-15%), AGX (5%), Sponsored Listing (5%) — đây là phí quảng cáo trả thêm cho Agoda, <strong>không giảm giá cho khách</strong>, cộng dồn vào commission.</p>
                </div>
            </Card>

            {/* Booking.com */}
            <Card id="booking-engine" title="🔵 Booking.com — Chi tiết cách tính">
                <p className="text-gray-700 mb-4">Booking.com sử dụng <strong>Progressive (Lũy tiến)</strong> với hệ thống 4 nhóm khuyến mãi và 3 tầng ưu tiên.</p>

                {/* 4 groups */}
                <h4 className="font-semibold text-gray-800 mb-2">4 nhóm khuyến mãi:</h4>
                <table className="w-full text-sm mb-4">
                    <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">Nhóm</th><th className="px-3 py-2 text-left">Promotions</th><th className="px-3 py-2 text-left">Quy tắc</th></tr></thead>
                    <tbody className="text-gray-700 text-sm">
                        <tr className="border-t"><td className="px-3 py-2 font-medium"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block mr-1.5" />TARGETED</td><td className="px-3 py-2">Mobile Rate (10%), Country Rate (10%), Business Bookers (10%)</td><td className="px-3 py-2">Cùng subcategory → <strong>chỉ lấy cao nhất</strong>. Business Bookers = chặn tuyệt đối</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block mr-1.5" />GENIUS</td><td className="px-3 py-2">L1 (10%), L2 (15%), L3 (20%)</td><td className="px-3 py-2"><strong>Chỉ lấy level cao nhất</strong>. Bật cả 3 → chỉ áp L3 = 20%</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block mr-1.5" />PORTFOLIO</td><td className="px-3 py-2">Basic Deal, Secret Deal, Early Booker, Last Minute, Free Nights</td><td className="px-3 py-2"><strong>Highest Wins</strong> — chỉ áp deal cao nhất trong nhóm</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block mr-1.5" />CAMPAIGN</td><td className="px-3 py-2">Getaway, Black Friday, Deal of Day, Early 2026</td><td className="px-3 py-2"><strong>EXCLUSIVE</strong> — chặn tất cả, <strong>chỉ stack với Genius</strong></td></tr>
                    </tbody>
                </table>

                {/* 3-tier engine */}
                <h4 className="font-semibold text-gray-800 mb-2">Engine 3 tầng (thứ tự ưu tiên):</h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                        <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded shrink-0">Tầng 1</span>
                        <div><strong>Có Campaign Exclusive?</strong> → Giữ Campaign (cao nhất) + Genius (cao nhất) ONLY. Loại bỏ Mobile, Country, Portfolio.</div>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded shrink-0">Tầng 2</span>
                        <div><strong>Có Business Bookers?</strong> → Chỉ giữ Business Bookers ALONE (không stack Genius).</div>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded shrink-0">Tầng 3</span>
                        <div><strong>Stacking bình thường:</strong> Genius (cao nhất) + Targeted (cao nhất/sub) + Portfolio (cao nhất) → Lũy tiến tất cả.</div>
                    </div>
                </div>

                {/* Example */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
                    <p className="font-medium text-amber-700 mb-2">📝 Ví dụ thực tế:</p>
                    <div className="text-sm text-gray-700 space-y-1 font-mono">
                        <p>NET = 1.000.000đ, Commission = 18%, Genius L3 = 20%, Early Booker = 15%</p>
                        <p className="mt-2">Bước 1: Gross = 1.000.000 ÷ (1 - 18%) = 1.219.512đ</p>
                        <p>Bước 2: BAR = 1.219.512 ÷ 0.80 ÷ 0.85 = <strong>1.793.400đ</strong></p>
                        <p className="mt-2 text-emerald-700">Kiểm tra: 1.793.400 × 0.80 × 0.85 = 1.219.512 → trừ 18% = <strong>1.000.000đ ✅</strong></p>
                    </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
                    <p className="text-red-700 text-sm"><strong>⚠️ Giới hạn:</strong></p>
                    <ul className="text-sm text-red-700 mt-1 space-y-1">
                        <li>• Tối đa <strong>3 promotions</strong> cùng lúc</li>
                        <li>• Cùng nhóm/subcategory → chỉ áp deal cao nhất</li>
                        <li>• Campaign Deal → chỉ lũy tiến với Genius, <strong>không</strong> với Mobile/Country/Portfolio</li>
                    </ul>
                </div>
            </Card>

            {/* Expedia */}
            <Card id="expedia-engine" title="🟣 Expedia — Chi tiết cách tính">
                <p className="text-gray-700 mb-3">Expedia sử dụng <strong>SINGLE DISCOUNT (Chọn 1 cao nhất)</strong> — mỗi deal tạo rate plan riêng, khách chỉ nhận 1 discount.</p>

                <table className="w-full text-sm mb-4">
                    <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">Nhóm</th><th className="px-3 py-2 text-left">Promotions</th><th className="px-3 py-2 text-left">Quy tắc</th></tr></thead>
                    <tbody className="text-gray-700 text-sm">
                        <tr className="border-t"><td className="px-3 py-2 font-medium"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block mr-1.5" />DEALS</td><td className="px-3 py-2">Same Day (20%), Early Booker (15%), Multi-Night (10%)</td><td className="px-3 py-2 text-red-600"><strong>KHÔNG stack</strong> — mỗi deal độc lập</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block mr-1.5" />AUDIENCE</td><td className="px-3 py-2">Member Only (10%), Mobile Rate (10%), Package Rate (18%)</td><td className="px-3 py-2 text-red-600"><strong>KHÔNG stack</strong> — rate plan riêng</td></tr>
                    </tbody>
                </table>

                <div className="bg-purple-50 rounded-xl p-4 text-sm">
                    <p className="font-medium text-purple-800 mb-1">Engine: Chọn deal cao nhất (Highest Eligible)</p>
                    <p className="text-gray-600">VD: Bật Same Day 20% + Mobile 10% → Khách chỉ thấy <strong>1 rate plan</strong> giảm 20% (không cộng dồn)</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
                    <p className="text-sm text-amber-700"><strong>📢 Commission Boosters:</strong> Accelerator (5%+), B2B EPS/TAAP Uplift (5%) — phí quảng cáo trả thêm, <strong>không giảm giá cho khách</strong>.</p>
                </div>
            </Card>

            {/* Traveloka */}
            <Card id="traveloka-engine" title="🟢 Traveloka — Chi tiết cách tính">
                <p className="text-gray-700 mb-3">Traveloka sử dụng <strong>ADDITIVE (Cộng dồn)</strong> — quy tắc tương tự Agoda. Commission mặc định <strong>15%</strong>.</p>

                <table className="w-full text-sm mb-4">
                    <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">Nhóm</th><th className="px-3 py-2 text-left">Quy tắc</th></tr></thead>
                    <tbody className="text-gray-700 text-sm">
                        <tr className="border-t"><td className="px-3 py-2 font-medium"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block mr-1.5" />SEASONAL</td><td className="px-3 py-2"><strong>Chỉ chọn 1</strong> trong nhóm</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block mr-1.5" />ESSENTIAL</td><td className="px-3 py-2"><strong>Stack thoải mái</strong></td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block mr-1.5" />TARGETED</td><td className="px-3 py-2">Cùng subcategory → <strong>chỉ lấy cao nhất</strong></td></tr>
                    </tbody>
                </table>

                <div className="bg-emerald-50 rounded-xl p-4 text-sm">
                    <p className="font-medium text-emerald-800 mb-1">Công thức: BAR = NET ÷ (1 - 15%) ÷ (1 - Tổng KM)</p>
                    <p className="text-gray-600">Giống Agoda, cũng cộng dồn, nhưng commission thấp hơn (15% vs 20%).</p>
                </div>
            </Card>

            {/* CTRIP / Trip.com */}
            <Card id="ctrip-engine" title="🔴 CTRIP / Trip.com — Chi tiết cách tính">
                <p className="text-gray-700 mb-3">Trip.com sử dụng <strong>ADDITIVE (Cộng dồn)</strong> — discount các nhóm khác cộng thẳng vào nhau.</p>

                <table className="w-full text-sm mb-4">
                    <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">Nhóm (Box)</th><th className="px-3 py-2 text-left">Ví dụ</th><th className="px-3 py-2 text-left">Quy tắc</th></tr></thead>
                    <tbody className="text-gray-700 text-sm">
                        <tr className="border-t"><td className="px-3 py-2 font-medium">REGULAR</td><td className="px-3 py-2">Flash Sale, Basic Deal</td><td className="px-3 py-2"><strong>Chọn 1</strong> trong cùng box</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium">TARGETING</td><td className="px-3 py-2">Mobile, Country, Member</td><td className="px-3 py-2"><strong>Chọn 1</strong> trong cùng box</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-medium">CAMPAIGN</td><td className="px-3 py-2">Event Sale, Holiday</td><td className="px-3 py-2"><strong>Chọn 1</strong> trong cùng box</td></tr>
                    </tbody>
                </table>

                <div className="bg-red-50 rounded-xl p-4 text-sm">
                    <p className="font-medium text-red-800 mb-1">Engine: Cùng box → chọn 1, Khác box → CỘNG DỒN</p>
                    <p className="text-gray-600">VD: Flash Sale 15% (REGULAR) + Mobile 10% (TARGETING) = <strong>25%</strong> (cộng thẳng, không lũy tiến)</p>
                </div>

                <Warn>
                    <strong>⚠️ Cảnh báo:</strong> Tổng discount cộng dồn &gt; 50% là quá cao. Hệ thống sẽ cảnh báo nếu vượt ngưỡng.
                </Warn>
            </Card>

            {/* So sánh nhanh */}
            <Card id="compare" title="📊 So sánh nhanh giữa các kênh">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">Kênh</th><th className="px-3 py-2 text-center">Kiểu tính</th><th className="px-3 py-2 text-center">Stack?</th><th className="px-3 py-2 text-left">Đặc điểm riêng</th></tr></thead>
                    <tbody className="text-gray-700 text-sm">
                        <tr className="border-t bg-amber-50"><td className="px-3 py-2 font-medium">Agoda</td><td className="px-3 py-2 text-center">Additive</td><td className="px-3 py-2 text-center text-emerald-600">✅ Có</td><td className="px-3 py-2">20% HH, 3 nhóm, Seasonal max 1, có Commission Boosters</td></tr>
                        <tr className="border-t bg-blue-50"><td className="px-3 py-2 font-medium">Booking.com</td><td className="px-3 py-2 text-center">Progressive</td><td className="px-3 py-2 text-center text-emerald-600">✅ Có</td><td className="px-3 py-2">18% HH, 4 nhóm, 3 tầng engine, max 3 KM, Genius stack</td></tr>
                        <tr className="border-t bg-purple-50"><td className="px-3 py-2 font-medium">Expedia</td><td className="px-3 py-2 text-center">Single</td><td className="px-3 py-2 text-center text-red-600">❌ Không</td><td className="px-3 py-2">17% HH, Deal tạo rate plan riêng, khách chọn 1</td></tr>
                        <tr className="border-t bg-emerald-50"><td className="px-3 py-2 font-medium">Traveloka</td><td className="px-3 py-2 text-center">Additive</td><td className="px-3 py-2 text-center text-emerald-600">✅ Có</td><td className="px-3 py-2">15% HH, tương tự Agoda</td></tr>
                        <tr className="border-t bg-red-50"><td className="px-3 py-2 font-medium">CTRIP/Trip.com</td><td className="px-3 py-2 text-center">Additive</td><td className="px-3 py-2 text-center text-emerald-600">✅ Có</td><td className="px-3 py-2">18% HH, cùng box chọn 1, khác box cộng dồn</td></tr>
                    </tbody>
                </table>
            </Card>

            <Card id="price-matrix" title="Bảng giá tổng hợp">
                <p className="text-gray-700">Tab <strong>&quot;Bảng giá&quot;</strong> hiển thị ma trận giá cho tất cả hạng phòng × kênh OTA:</p>
                <table className="w-full text-sm mt-3">
                    <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">Hạng phòng</th><th className="px-3 py-2 text-right">NET</th><th className="px-3 py-2 text-right">Agoda</th><th className="px-3 py-2 text-right">Booking</th></tr></thead>
                    <tbody><tr className="border-t text-gray-700"><td className="px-3 py-3">Standard</td><td className="px-3 py-3 text-right font-mono">1.000.000</td><td className="px-3 py-3 text-right font-mono text-blue-600">1.389.000</td><td className="px-3 py-3 text-right font-mono text-blue-600">1.333.000</td></tr></tbody>
                </table>
                <Tip>Hover vào ô giá để xem chi tiết cách tính.</Tip>
            </Card>

            <Card id="reverse" title="Tính ngược (BAR → NET)" icon={<ArrowRightLeft className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700">Chế độ <strong>&quot;Giá hiển thị → Thu về&quot;</strong> giúp tính ngược: Nếu đặt giá đồng nhất trên tất cả OTA, khách sạn sẽ thu về bao nhiêu từ mỗi kênh?</p>
                <Warn>
                    <strong>Ví dụ:</strong> Đặt giá đồng nhất <strong>1.500.000đ</strong>:<br />
                    • Agoda (18% + 10% KM): Thu về <strong>1.107.000đ</strong> (74%)<br />
                    • Booking (18% + 15% Genius): Thu về <strong>1.045.500đ</strong> (70%)<br />
                    • Direct (0%): Thu về <strong>1.500.000đ</strong> (100%)
                </Warn>
                <Tip>So sánh hiệu quả giữa các kênh để quyết định nên ưu tiên kênh nào.</Tip>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <p className="text-blue-700 mb-3">Sẵn sàng tính giá?</p>
                <Link href="/pricing" className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Đi tới Tính giá OTA →</Link>
            </div>

        </>
    );
}

/* ═══════════════════════ SECTION 3B: GIÁ LINH HOẠT (DYNAMIC PRICING) ═══════════════════════ */
function DynamicPricingSection() {
    return (
        <>
            <Card id="dp-overview" title="Giá Linh Hoạt — Tổng quan" icon={<Layers className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700">
                    Tab <strong>"Giá Linh Hoạt"</strong> giúp bạn tự động điều chỉnh giá phòng theo <strong>công suất phòng (OCC%)</strong> và <strong>mùa (Season)</strong>.
                    Thay vì đặt 1 giá cố định, hệ thống tính giá khác nhau cho từng mức độ lấp đầy.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-3">
                    <p className="font-medium text-blue-700 mb-2">🎯 Ý tưởng cốt lõi:</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                        <li>• <strong>Phòng còn nhiều</strong> (OCC thấp) → Giá thấp hơn để hút khách</li>
                        <li>• <strong>Phòng gần hết</strong> (OCC cao) → Giá cao hơn vì cầu vượt cung</li>
                        <li>• <strong>Mùa cao điểm</strong> → Giá NET cơ sở cao hơn mùa thường</li>
                    </ul>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 mt-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                        <div className="text-2xl mb-1">🗓️</div>
                        <div className="font-medium text-emerald-700 text-sm">Season</div>
                        <p className="text-xs text-gray-600 mt-1">Quyết định giá NET cơ sở</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                        <div className="text-2xl mb-1">📊</div>
                        <div className="font-medium text-blue-700 text-sm">OCC%</div>
                        <p className="text-xs text-gray-600 mt-1">Nhân hệ số theo bậc lấp đầy</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
                        <div className="text-2xl mb-1">💰</div>
                        <div className="font-medium text-purple-700 text-sm">Giá OTA</div>
                        <p className="text-xs text-gray-600 mt-1">Tự động tính BAR + Display</p>
                    </div>
                </div>
            </Card>

            <Card id="dp-controls" title="🎛️ Bộ điều khiển" icon={<Settings className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">Thanh điều khiển nằm phía trên bảng giá, gồm các thành phần:</p>

                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-3 py-2 text-left text-gray-600">Thành phần</th>
                            <th className="px-3 py-2 text-left text-gray-600">Chức năng</th>
                            <th className="px-3 py-2 text-left text-gray-600">Chi tiết</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        <tr className="border-t">
                            <td className="px-3 py-3 font-medium">📅 Ngày lưu trú</td>
                            <td className="px-3 py-3">Chọn ngày khách ở</td>
                            <td className="px-3 py-3 text-gray-500 text-xs">
                                Hệ thống dùng ngày này để: (1) Tự nhận Season, (2) Lấy OCC% từ dữ liệu booking thực tế
                            </td>
                        </tr>
                        <tr className="border-t bg-blue-50">
                            <td className="px-3 py-3 font-medium">🗓️ Season (auto)</td>
                            <td className="px-3 py-3">Chọn mùa hoặc để auto</td>
                            <td className="px-3 py-3 text-gray-500 text-xs">
                                <strong>Auto:</strong> Hệ thống tự khớp ngày với khoảng ngày của Season.<br />
                                <strong>Thủ công:</strong> Ghi đè để so sánh giá giữa các mùa.
                            </td>
                        </tr>
                        <tr className="border-t">
                            <td className="px-3 py-3 font-medium">🏨 Kênh OTA</td>
                            <td className="px-3 py-3">Chọn kênh tính giá</td>
                            <td className="px-3 py-3 text-gray-500 text-xs">
                                Mỗi kênh có hoa hồng + khuyến mãi khác nhau → giá BAR và Display khác.
                            </td>
                        </tr>
                        <tr className="border-t bg-emerald-50">
                            <td className="px-3 py-3 font-medium">👁️ Thu về / BAR / Hiển thị</td>
                            <td className="px-3 py-3">Chuyển đổi góc nhìn giá</td>
                            <td className="px-3 py-3 text-gray-500 text-xs">
                                <strong>Thu về (NET):</strong> Tiền thực nhận.<br />
                                <strong>BAR:</strong> Giá gốc chưa giảm KM.<br />
                                <strong>Hiển thị:</strong> Giá khách thấy trên OTA (sau KM).
                            </td>
                        </tr>
                        <tr className="border-t">
                            <td className="px-3 py-3 font-medium">⚙️ Config</td>
                            <td className="px-3 py-3">Mở/đóng panel cấu hình</td>
                            <td className="px-3 py-3 text-gray-500 text-xs">
                                Hiện 2 panel: Season config + OCC Tier config.
                            </td>
                        </tr>
                        <tr className="border-t">
                            <td className="px-3 py-3 font-medium">📥 Export</td>
                            <td className="px-3 py-3">Xuất bảng giá CSV</td>
                            <td className="px-3 py-3 text-gray-500 text-xs">
                                Tải file CSV chứa toàn bộ bảng giá (NET + BAR + Display cho tất cả bậc OCC).
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mt-3">
                    <p className="text-sm text-emerald-700">
                        💡 <strong>OCC Badge</strong> (thanh xanh phía dưới) hiển thị OCC% thực tế từ dữ liệu OTB,
                        kèm tier đang áp dụng (VD: "Tier: 35-65% ×1.10").
                        Nếu chưa có dữ liệu OTB, bạn có thể nhập tay OCC%.
                    </p>
                </div>
            </Card>

            <Card id="dp-seasons" title="🗓️ Quản lý Mùa (Seasons)" icon={<CalendarDays className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">
                    <strong>Season (Mùa)</strong> quyết định giá NET cơ sở cho từng hạng phòng.
                    Mùa cao điểm → giá NET cao hơn, mùa thường → giá NET thấp hơn.
                </p>

                <h4 className="font-semibold text-gray-800 mb-2">3 loại Season mặc định:</h4>
                <table className="w-full text-sm mb-4">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-3 py-2 text-left text-gray-600">Season</th>
                            <th className="px-3 py-2 text-center text-gray-600">Ưu tiên</th>
                            <th className="px-3 py-2 text-left text-gray-600">Khi nào dùng</th>
                            <th className="px-3 py-2 text-right text-gray-600">NET ví dụ</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        <tr className="border-t">
                            <td className="px-3 py-3"><span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs mr-1">P1</span> Normal</td>
                            <td className="px-3 py-3 text-center">Thấp nhất</td>
                            <td className="px-3 py-3">Các ngày bình thường, không event</td>
                            <td className="px-3 py-3 text-right font-mono">1.200.000đ</td>
                        </tr>
                        <tr className="border-t bg-amber-50">
                            <td className="px-3 py-3"><span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs mr-1">P2</span> High</td>
                            <td className="px-3 py-3 text-center">Trung bình</td>
                            <td className="px-3 py-3">Cuối tuần, hè, liên hoan</td>
                            <td className="px-3 py-3 text-right font-mono">1.500.000đ</td>
                        </tr>
                        <tr className="border-t bg-red-50">
                            <td className="px-3 py-3"><span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs mr-1">P3</span> Holiday</td>
                            <td className="px-3 py-3 text-center">Cao nhất</td>
                            <td className="px-3 py-3">Tết, Noel, 30/4, 2/9</td>
                            <td className="px-3 py-3 text-right font-mono">2.000.000đ</td>
                        </tr>
                    </tbody>
                </table>

                <h4 className="font-semibold text-gray-800 mb-2">Cách thiết lập:</h4>
                <div className="space-y-2">
                    <Step n={1} title="Bấm ⚙️ Config trên thanh điều khiển">
                        <p className="text-sm text-gray-600">Panel "Mùa (Seasons)" sẽ hiện ra bên trái.</p>
                    </Step>
                    <Step n={2} title="Tạo Season">
                        <p className="text-sm text-gray-600">Bấm nút <strong>+ NORMAL</strong>, <strong>+ HIGH</strong>, hoặc <strong>+ HOLIDAY</strong> để tạo season mới.</p>
                    </Step>
                    <Step n={3} title="Thêm khoảng ngày">
                        <p className="text-sm text-gray-600">Mở season → <strong>+ Thêm</strong> khoảng ngày → chọn ngày bắt đầu và kết thúc.</p>
                        <p className="text-sm text-gray-500">VD: High Season từ 01/06 đến 31/08 (mùa hè).</p>
                    </Step>
                    <Step n={4} title="Thiết lập NET rates">
                        <p className="text-sm text-gray-600">Trong mỗi season, nhập giá NET mong muốn cho từng hạng phòng. Đây là giá cơ sở sẽ được nhân với hệ số OCC.</p>
                    </Step>
                    <Step n={5} title="Lưu">
                        <p className="text-sm text-gray-600">Bấm <strong>Lưu</strong> để áp dụng. Bảng giá sẽ tự cập nhật.</p>
                    </Step>
                </div>

                <Warn>
                    <strong>Quy tắc ưu tiên (auto-detect):</strong> Nếu 1 ngày thuộc nhiều season (VD: vừa High vừa Holiday), hệ thống chọn season có <strong>priority cao nhất</strong>: Holiday (P3) {'>'} High (P2) {'>'} Normal (P1).
                </Warn>
            </Card>

            <Card id="dp-occ-tiers" title="📊 Bậc OCC (Occupancy Tiers)" icon={<BarChart3 className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">
                    <strong>OCC Tier</strong> là bậc thang giá theo công suất phòng. Mỗi bậc có <strong>hệ số nhân (multiplier)</strong> áp lên giá NET cơ sở.
                </p>

                <h4 className="font-semibold text-gray-800 mb-2">Ví dụ 4 bậc cơ bản:</h4>
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
                        <tr className="border-t">
                            <td className="px-3 py-3">#0</td>
                            <td className="px-3 py-3 text-center">0–35%</td>
                            <td className="px-3 py-3 text-center font-mono">×1.00</td>
                            <td className="px-3 py-3 text-gray-500">Phòng còn nhiều → giá gốc</td>
                            <td className="px-3 py-3 text-right font-mono">1.200.000đ</td>
                        </tr>
                        <tr className="border-t bg-blue-50">
                            <td className="px-3 py-3">#1</td>
                            <td className="px-3 py-3 text-center">35–65%</td>
                            <td className="px-3 py-3 text-center font-mono">×1.10</td>
                            <td className="px-3 py-3 text-gray-500">Trung bình → tăng 10%</td>
                            <td className="px-3 py-3 text-right font-mono">1.320.000đ</td>
                        </tr>
                        <tr className="border-t bg-amber-50">
                            <td className="px-3 py-3">#2</td>
                            <td className="px-3 py-3 text-center">65–85%</td>
                            <td className="px-3 py-3 text-center font-mono">×1.20</td>
                            <td className="px-3 py-3 text-gray-500">Gần kín → tăng 20%</td>
                            <td className="px-3 py-3 text-right font-mono">1.440.000đ</td>
                        </tr>
                        <tr className="border-t bg-red-50">
                            <td className="px-3 py-3">#3</td>
                            <td className="px-3 py-3 text-center">{'>'}85%</td>
                            <td className="px-3 py-3 text-center font-mono">×1.30</td>
                            <td className="px-3 py-3 text-gray-500">Sắp hết phòng → tăng 30%</td>
                            <td className="px-3 py-3 text-right font-mono">1.560.000đ</td>
                        </tr>
                    </tbody>
                </table>

                <div className="bg-gray-50 rounded-xl p-4 text-sm mb-3">
                    <p className="font-medium text-gray-800 mb-1">Công thức:</p>
                    <p className="font-mono text-center text-lg">NET động = NET cơ sở (season) × Multiplier (OCC tier)</p>
                    <p className="text-gray-600 mt-2 text-center">VD: Normal Season NET = 1.200.000 × 1.10 (OCC 50%) = <strong>1.320.000đ</strong></p>
                </div>

                <h4 className="font-semibold text-gray-800 mb-2">Cách chỉnh:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                    <li>Bấm <strong>⚙️ Config</strong> → Panel "Bậc OCC" hiện ra bên phải</li>
                    <li>Chỉnh <strong>ngưỡng %</strong> và <strong>hệ số nhân</strong> cho từng bậc</li>
                    <li>Bấm <strong>+</strong> để thêm bậc (tối đa 6), <strong>🗑️</strong> để xóa (tối thiểu 3)</li>
                    <li>Bấm <strong>"Lưu bậc OCC"</strong> để áp dụng</li>
                </ul>

                <Warn>
                    <strong>Quy tắc:</strong> Các bậc phải liền mạch (bậc trước kết thúc = bậc sau bắt đầu), bắt đầu từ 0% và kết thúc ở 100%.
                </Warn>

                <Tip>
                    OCC% được tính tự động từ dữ liệu OTB: <strong>OCC = Số phòng đã đặt ÷ Tổng phòng khách sạn</strong>. Nếu chưa có dữ liệu, bạn có thể nhập tay.
                </Tip>
            </Card>

            <Card id="dp-matrix" title="📋 Bảng giá Ma trận" icon={<Calculator className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">
                    Bảng giá hiển thị giá cho <strong>tất cả hạng phòng × tất cả bậc OCC</strong> cùng lúc.
                </p>

                <h4 className="font-semibold text-gray-800 mb-2">Cách đọc bảng:</h4>
                <table className="w-full text-sm mb-4">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-3 py-2 text-left text-gray-600">Thành phần</th>
                            <th className="px-3 py-2 text-left text-gray-600">Ý nghĩa</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        <tr className="border-t">
                            <td className="px-3 py-3 font-medium">Cột "Hạng phòng"</td>
                            <td className="px-3 py-3">Tên hạng phòng (Deluxe, Superior, Suite...)</td>
                        </tr>
                        <tr className="border-t">
                            <td className="px-3 py-3 font-medium">Cột "NET cơ sở"</td>
                            <td className="px-3 py-3">Giá NET theo season (chưa nhân OCC)</td>
                        </tr>
                        <tr className="border-t bg-blue-50">
                            <td className="px-3 py-3 font-medium">Cột bậc OCC (0-35%, 35-65%...)</td>
                            <td className="px-3 py-3">Giá sau khi nhân hệ số OCC (tùy chế độ xem: NET/BAR/Display)</td>
                        </tr>
                        <tr className="border-t bg-blue-100">
                            <td className="px-3 py-3 font-medium">Cột highlight ★ (xanh đậm)</td>
                            <td className="px-3 py-3"><strong>Bậc đang áp dụng</strong> dựa trên OCC% thực tế. Đây là giá THỰC TẾ cho ngày đó.</td>
                        </tr>
                        <tr className="border-t bg-red-50">
                            <td className="px-3 py-3 font-medium">Ô đỏ ⚠️</td>
                            <td className="px-3 py-3"><strong>Vi phạm guardrail</strong> — giá quá cao hoặc quá thấp so với min/max của khách sạn.</td>
                        </tr>
                    </tbody>
                </table>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="font-medium text-blue-700 mb-2">3 chế độ xem (toggle trên thanh điều khiển):</p>
                    <div className="grid sm:grid-cols-3 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="font-medium text-emerald-700 text-sm">Thu về (NET)</div>
                            <p className="text-xs text-gray-600 mt-1">Tiền khách sạn thực nhận sau khi OTA trừ hoa hồng + KM</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="font-medium text-blue-700 text-sm">BAR</div>
                            <p className="text-xs text-gray-600 mt-1">Best Available Rate — giá gốc trước KM, sau hoa hồng</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="font-medium text-purple-700 text-sm">Hiển thị (Display)</div>
                            <p className="text-xs text-gray-600 mt-1">Giá khách thấy trên OTA (sau khi áp KM)</p>
                        </div>
                    </div>
                </div>

                <Tip>Chuyển đổi giữa 3 chế độ xem KHÔNG phải tải lại dữ liệu — hệ thống tính sẵn cả 3 giá trị cho mỗi ô.</Tip>
            </Card>

            <Card id="dp-export" title="📥 Xuất CSV" icon={<Download className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700 mb-3">
                    Bấm nút <strong>Export</strong> (màu xanh lá) để tải bảng giá dưới dạng file CSV.
                </p>
                <h4 className="font-semibold text-gray-800 mb-2">File CSV chứa:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                    <li>Tất cả hạng phòng</li>
                    <li>Giá NET cơ sở</li>
                    <li>Giá NET, BAR, Display cho từng bậc OCC</li>
                </ul>
                <Tip>Mở file CSV bằng Excel hoặc Google Sheets → In ra cho team Front Desk hoặc gửi cho Sales Manager để cập nhật giá lên OTA.</Tip>
            </Card>

            <Card id="dp-faq" title="❓ Câu hỏi thường gặp" icon={<HelpCircle className="w-5 h-5 text-blue-600" />}>
                <div className="space-y-4">
                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="font-medium text-gray-900 mb-2">"OCC chưa có dữ liệu" — Phải làm gì?</h4>
                        <p className="text-gray-600 text-sm">
                            OCC% tính từ dữ liệu OTB (số phòng đã đặt). Nếu chưa upload dữ liệu booking,
                            hệ thống không có OCC → bạn có thể <strong>nhập tay OCC%</strong> vào ô input trên thanh OCC Badge.
                        </p>
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Season &quot;auto&quot; chọn sai mùa?</h4>
                        <p className="text-gray-600 text-sm">
                            Kiểm tra khoảng ngày (date ranges) trong config Season. Nếu ngày lưu trú không nằm trong khoảng nào,
                            hệ thống dùng season mặc định (Normal). Bạn cũng có thể <strong>ghi đè thủ công</strong> bằng dropdown Season.
                        </p>
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Ô đỏ ⚠️ nghĩa là gì?</h4>
                        <p className="text-gray-600 text-sm">
                            Giá vi phạm <strong>guardrail</strong> (giới hạn an toàn) — quá thấp so với min_rate hoặc quá cao so với max_rate
                            của khách sạn. Chi tiết vi phạm hiện trong hộp cảnh báo màu vàng phía trên bảng.
                        </p>
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Muốn thêm bậc OCC (VD: chia nhỏ hơn)?</h4>
                        <p className="text-gray-600 text-sm">
                            Vào <strong>⚙️ Config → Bậc OCC → bấm +</strong>. Hệ thống hỗ trợ tối đa <strong>6 bậc</strong>.
                            Bạn có thể chia nhỏ để kiểm soát giá chính xác hơn — VD: thêm bậc 85-93%, 93-96%, 96-100% cho các mức
                            lấp đầy rất cao.
                        </p>
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="font-medium text-gray-900 mb-2">NET cơ sở lấy từ đâu?</h4>
                        <p className="text-gray-600 text-sm">
                            Nếu có <strong>Season NET rate</strong> (cấu hình trong Config Season) → dùng giá theo season.
                            Nếu không → dùng giá NET mặc định của hạng phòng (tab "Hạng phòng").
                        </p>
                    </div>
                </div>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <p className="text-blue-700 mb-3">Sẵn sàng thiết lập Giá Linh Hoạt?</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <a href="/pricing" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"><Layers className="w-4 h-4" /> Đi tới tab Giá Linh Hoạt →</a>
                </div>
            </div>
        </>
    );
}

/* ═══════════════════════ SECTION 4: QUẢN LÝ DỮ LIỆU ═══════════════════════ */
function DataSection() {
    return (
        <>
            <Card id="upload" title="Import dữ liệu" icon={<Upload className="w-5 h-5 text-blue-600" />}>
                <p className="text-gray-700">Để hệ thống hoạt động chính xác, bạn cần import dữ liệu từ PMS:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600 text-sm ml-4 mt-2">
                    <li>Export báo cáo từ PMS (định dạng XML hoặc CSV)</li>
                    <li>Vào menu <strong>Upload</strong></li>
                    <li>Kéo thả file vào ô upload</li>
                    <li>Chờ hệ thống xử lý (vài giây)</li>
                </ol>
                <Tip><strong>Tần suất:</strong> Mỗi ngày 1 lần vào buổi sáng.</Tip>
            </Card>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-blue-700 font-medium mb-2">💡 Quy trình xử lý dữ liệu:</p>
                <Pipeline steps={['📤 Upload', '📊 Build OTB', '⚡ Build Features', '📈 Run Forecast', '🎯 Dashboard']} />
            </div>

            <Card id="build-otb" title="Build OTB (On The Books)" gradient="blue">
                <p className="text-sm text-gray-700"><strong>OTB là gì?</strong> Là số phòng đã được khách đặt trước (&quot;ghi sổ&quot;). Giống như khi bạn xem sổ đặt phòng, đếm xem ngày mai có bao nhiêu phòng đã có khách book.</p>
                <p className="text-sm text-gray-700 mt-2"><strong>Dữ liệu nguồn:</strong> Hệ thống đọc file XML bạn upload từ PMS (Opera, RoomRaccoon...) chứa danh sách booking.</p>
                <p className="text-sm text-gray-700 mt-2"><strong>Tại sao cần?</strong> Đây là bước đầu tiên — biết được &quot;đã bán bao nhiêu&quot; thì mới tính được &quot;còn lại bao nhiêu&quot;.</p>
                <div className="bg-blue-100 rounded-lg p-2 text-sm text-blue-700 mt-3"><strong>👉 Kết quả:</strong> Bảng thống kê số phòng đã đặt cho từng ngày trong tương lai.</div>
            </Card>

            <Card id="build-features" title="Build Features (Xây dựng chỉ số)" gradient="purple">
                <p className="text-sm text-gray-700"><strong>Features là gì?</strong> Là các &quot;dấu hiệu&quot; giúp thuật toán phân tích tình hình booking đang tốt hay xấu.</p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-sm text-gray-700 mt-2">
                    <li><strong>Pickup T-7/T-15/T-30:</strong> Số booking mới trong 7/15/30 ngày qua</li>
                    <li><strong>So với năm trước (STLY):</strong> Cùng kỳ năm ngoái có bao nhiêu booking?</li>
                    <li><strong>Remaining Supply:</strong> Còn bao nhiêu phòng trống có thể bán?</li>
                </ul>
                <div className="bg-purple-100 rounded-lg p-2 text-sm text-purple-700 mt-3"><strong>👉 Kết quả:</strong> Bảng các chỉ số phân tích cho từng ngày (pace, pickup, remaining supply...).</div>
            </Card>

            <Card id="run-forecast" title="Run Forecast (Dự báo nhu cầu)" gradient="emerald">
                <p className="text-sm text-gray-700"><strong>Forecast là gì?</strong> Là dự đoán &quot;còn bao nhiêu khách NỮA sẽ đặt phòng&quot; từ hôm nay đến ngày đó.</p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-sm text-gray-700 mt-2">
                    <li>Nếu pickup 7 ngày qua cao → Demand còn nhiều → Có thể tăng giá</li>
                    <li>Nếu pace chậm hơn năm trước → Demand yếu → Cần khuyến mãi</li>
                </ul>
                <div className="bg-emerald-100 rounded-lg p-2 text-sm text-emerald-700 mt-3"><strong>👉 Kết quả:</strong> Dự báo số phòng sẽ được đặt thêm + Giá khuyến nghị cho từng ngày.</div>
            </Card>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="font-medium text-amber-700 mb-2">⚠️ Lưu ý quan trọng:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Thứ tự bắt buộc:</strong> Build OTB → Build Features → Run Forecast</li>
                    <li>• <strong>Dữ liệu quá khứ:</strong> Bạn có thể upload từ nhiều tháng/năm trước để so sánh STLY</li>
                    <li>• <strong>Tự động:</strong> Sau khi upload file mới, các bước này sẽ tự động chạy</li>
                </ul>
            </div>
        </>
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
                    {i < steps.length - 1 && <span className="text-gray-400 ml-2">→</span>}
                </span>
            ))}
        </div>
    );
}

function Tip({ children }: { children: React.ReactNode }) {
    return <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 text-sm mt-2">💡 {children}</div>;
}

function Warn({ children }: { children: React.ReactNode }) {
    return <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-gray-700 mt-2">{children}</div>;
}

function KPIExplain({ color, emoji, name, desc }: { color: string; emoji: string; name: string; desc: string }) {
    return (
        <div className={`bg-${color}-50 p-4 rounded-xl border border-${color}-100`}>
            <div className={`text-${color}-700 font-medium mb-2`}>{emoji} {name}</div>
            <p className="text-sm text-gray-700"><strong>Ý nghĩa:</strong> {desc}</p>
        </div>
    );
}
