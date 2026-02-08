'use client';

import { useState, useEffect } from 'react';
import { BookOpen, BarChart3, TrendingUp, DollarSign, CalendarDays, Upload, Database, Settings, HelpCircle, XCircle, Calculator, Percent, Tag, ArrowRightLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

type TabId = 'revenue' | 'pricing';

export default function GuidePage() {
    const [activeTab, setActiveTab] = useState<TabId>('pricing'); // Default to pricing
    const [isDemo, setIsDemo] = useState(false);
    const [loading, setLoading] = useState(true);
    const { data: session } = useSession();

    // Super Admin bypasses demo restrictions
    const isSuperAdmin = (session?.user as any)?.role === 'super_admin';
    const effectiveIsDemo = isDemo && !isSuperAdmin;

    // Check if Demo Hotel
    useEffect(() => {
        const checkDemoHotel = async () => {
            try {
                const res = await fetch('/api/is-demo-hotel');
                const data = await res.json();
                setIsDemo(data.isDemo || false);
                // If NOT demo hotel OR super admin, default to revenue tab
                if (!data.isDemo || isSuperAdmin) {
                    setActiveTab('revenue');
                }
            } catch (error) {
                console.error('Error checking demo hotel:', error);
            } finally {
                setLoading(false);
            }
        };
        checkDemoHotel();
    }, [isSuperAdmin]);

    return (
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 space-y-6">
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

            {/* Tabs - only show Revenue tab if NOT Demo Hotel */}
            <div className="bg-white border border-gray-200 rounded-xl p-1 flex gap-1">
                {!effectiveIsDemo && (
                    <button
                        onClick={() => setActiveTab('revenue')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'revenue'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        Quản lý Doanh thu (Revenue)
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('pricing')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pricing'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <Calculator className="w-4 h-4" />
                    Tính giá OTA (Pricing)
                </button>
            </div>

            {/* Demo Hotel Notice */}
            {effectiveIsDemo && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-amber-800 font-medium">Demo Hotel - Chế độ giới hạn</p>
                        <p className="text-amber-700 text-sm">
                            Bạn đang sử dụng Demo Hotel nên chỉ xem được hướng dẫn Tính giá OTA.
                            Liên hệ admin để được gán khách sạn và truy cập đầy đủ.
                        </p>
                    </div>
                </div>
            )}

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'revenue' && !effectiveIsDemo && <RevenueGuide />}
                {activeTab === 'pricing' && <PricingGuide />}
            </div>
        </div>
    );
}

// ==================== REVENUE GUIDE ====================
function RevenueGuide() {
    return (
        <>
            {/* Table of Contents */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">📑 Mục lục</h2>
                <nav className="space-y-2 text-sm">
                    <a href="#gioi-thieu" className="block text-blue-600 hover:text-blue-700">1. Giới thiệu về Revenue Management</a>
                    <a href="#dashboard" className="block text-blue-600 hover:text-blue-700">2. Dashboard - Bảng điều khiển chính</a>
                    <a href="#kpi-cards" className="block text-blue-600 hover:text-blue-700 ml-4">2.1. Các thẻ KPI</a>
                    <a href="#bieu-do" className="block text-blue-600 hover:text-blue-700 ml-4">2.2. Biểu đồ OTB</a>
                    <a href="#bang-khuyen-nghi" className="block text-blue-600 hover:text-blue-700 ml-4">2.3. Bảng khuyến nghị giá</a>
                    <a href="#upload" className="block text-blue-600 hover:text-blue-700">3. Import dữ liệu</a>
                    <a href="#data-inspector" className="block text-blue-600 hover:text-blue-700">4. Data Inspector</a>
                    <a href="#thuat-ngu" className="block text-blue-600 hover:text-blue-700">5. Thuật ngữ chuyên ngành</a>
                </nav>
            </div>

            {/* Section 1: Introduction */}
            <section id="gioi-thieu" className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                    1. Giới thiệu về Revenue Management
                </h2>
                <div className="text-gray-700 space-y-3">
                    <p>
                        <strong>Revenue Management (RM)</strong> hay Quản lý Doanh thu là nghệ thuật bán đúng phòng,
                        cho đúng khách, vào đúng thời điểm, với mức giá tối ưu.
                    </p>
                    <p>Hệ thống RMS giúp bạn:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Theo dõi lượng đặt phòng (OTB - On The Books)</li>
                        <li>Theo dõi và xử lý các booking bị hủy</li>
                        <li>Dự đoán nhu cầu tương lai</li>
                        <li>Đề xuất mức giá tối ưu cho từng ngày</li>
                        <li>Phân tích hiệu quả kinh doanh</li>
                    </ul>
                </div>
            </section>

            {/* Section 2: Dashboard */}
            <section id="dashboard" className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    2. Dashboard - Bảng điều khiển chính
                </h2>
                <p className="text-gray-700">
                    Dashboard là nơi bạn xem tổng quan về tình hình đặt phòng và nhận khuyến nghị giá.
                </p>

                {/* 2.1 KPI Cards */}
                <div id="kpi-cards" className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">2.1. Các thẻ KPI (Chỉ số chính)</h3>
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="text-blue-700 font-medium mb-2">📊 Rooms OTB</div>
                            <p className="text-sm text-gray-700">
                                <strong>Ý nghĩa:</strong> Tổng số phòng đã được đặt (On The Books) trong 30 ngày tới.
                            </p>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <div className="text-purple-700 font-medium mb-2">🏨 Remaining Supply</div>
                            <p className="text-sm text-gray-700">
                                <strong>Ý nghĩa:</strong> Số phòng còn trống có thể bán trong 30 ngày tới.
                            </p>
                        </div>

                        <div className="bg-emerald-50 p-4 rounded-xl border-l-4 border-emerald-500">
                            <div className="text-emerald-700 font-medium mb-2">📈 Avg Pickup T7</div>
                            <p className="text-sm text-gray-700">
                                <strong>Ý nghĩa:</strong> Trung bình số phòng được đặt THÊM trong 7 ngày qua.
                            </p>
                            <p className="text-sm text-amber-600 mt-2">
                                <strong>💡 Insight:</strong> Pickup cao = demand đang tăng → có thể tăng giá.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2.2 Chart */}
                <div id="bieu-do" className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">2.2. Biểu đồ OTB theo ngày</h3>
                    <div className="text-sm text-gray-700 space-y-3">
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Trục ngang (X):</strong> Các ngày lưu trú</li>
                            <li><strong>Trục dọc (Y):</strong> Số phòng đã được đặt</li>
                            <li><strong>Cột cao (màu xanh):</strong> Ngày có nhiều booking → Demand cao</li>
                            <li><strong>Cột thấp:</strong> Ngày ít booking → Cần promotion</li>
                        </ul>
                    </div>
                </div>

                {/* 2.3 Recommendations */}
                <div id="bang-khuyen-nghi" className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">2.3. Bảng khuyến nghị giá</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-600">Cột</th>
                                    <th className="px-3 py-2 text-left text-gray-600">Giải thích</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3 font-medium">Stay Date</td>
                                    <td className="px-3 py-3">Ngày khách ở (check-in date).</td>
                                </tr>
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3 font-medium">OTB</td>
                                    <td className="px-3 py-3">Số phòng đã đặt cho ngày đó.</td>
                                </tr>
                                <tr className="border-t border-gray-100 bg-emerald-50">
                                    <td className="px-3 py-3 font-medium text-emerald-700">Recommended</td>
                                    <td className="px-3 py-3">Giá khuyến nghị do Pricing Engine tính.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Section 3: Upload */}
            <section id="upload" className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    3. Import dữ liệu
                </h2>
                <p className="text-gray-700">
                    Để hệ thống hoạt động chính xác, bạn cần import dữ liệu từ PMS:
                </p>
                <div className="space-y-2 ml-4">
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 text-sm">
                        <li>Export báo cáo từ PMS (định dạng XML hoặc CSV)</li>
                        <li>Vào menu <strong>Upload</strong></li>
                        <li>Kéo thả file vào ô upload</li>
                        <li>Chờ hệ thống xử lý (vài giây)</li>
                    </ol>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-blue-700 text-sm">
                        <strong>📌 Tần suất:</strong> Mỗi ngày 1 lần vào buổi sáng.
                    </p>
                </div>
            </section>

            {/* Section 4: Data Inspector */}
            <section id="data-inspector" className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    4. Data Inspector - Trung tâm xử lý dữ liệu
                </h2>
                <p className="text-gray-700">
                    Đây là nơi bạn kiểm tra dữ liệu đã nhập và chạy các bước xử lý để hệ thống có thể đưa ra khuyến nghị giá.
                </p>

                {/* Pipeline Overview */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-sm text-blue-700 font-medium mb-2">💡 Quy trình xử lý dữ liệu:</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="bg-white px-3 py-1 rounded-lg border border-blue-200">📤 Upload</span>
                        <span className="text-blue-400">→</span>
                        <span className="bg-white px-3 py-1 rounded-lg border border-blue-200">📊 Build OTB</span>
                        <span className="text-blue-400">→</span>
                        <span className="bg-white px-3 py-1 rounded-lg border border-blue-200">⚡ Build Features</span>
                        <span className="text-blue-400">→</span>
                        <span className="bg-white px-3 py-1 rounded-lg border border-blue-200">📈 Run Forecast</span>
                        <span className="text-blue-400">→</span>
                        <span className="bg-white px-3 py-1 rounded-lg border border-blue-200">🎯 Dashboard</span>
                    </div>
                </div>

                {/* Detailed Explanations */}
                <div className="space-y-4">
                    {/* Build OTB */}
                    <div className="border border-gray-200 rounded-xl p-4 bg-gradient-to-r from-blue-50 to-white">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                <span className="text-xl">📊</span>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-900">Build OTB (On The Books)</h4>
                                <div className="text-sm text-gray-700 space-y-2">
                                    <p>
                                        <strong>OTB là gì?</strong> Là số phòng đã được khách đặt trước (đã "ghi sổ").
                                        Giống như khi bạn xem sổ đặt phòng, đếm xem ngày mai có bao nhiêu phòng đã có khách book.
                                    </p>
                                    <p>
                                        <strong>Dữ liệu nguồn:</strong> Hệ thống đọc file XML bạn upload từ phần mềm quản lý
                                        (Opera, RoomRaccoon...) chứa danh sách các booking: ai đặt, đặt phòng nào,
                                        từ ngày nào đến ngày nào.
                                    </p>
                                    <p>
                                        <strong>Tại sao cần?</strong> Đây là bước đầu tiên - biết được "đã bán bao nhiêu"
                                        thì mới tính được "còn lại bao nhiêu" và "nên bán với giá nào".
                                    </p>
                                </div>
                                <div className="bg-blue-100 rounded-lg p-2 text-sm text-blue-700">
                                    <strong>👉 Kết quả:</strong> Bảng thống kê số phòng đã đặt cho từng ngày trong tương lai.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Build Features */}
                    <div className="border border-gray-200 rounded-xl p-4 bg-gradient-to-r from-purple-50 to-white">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                                <span className="text-xl">⚡</span>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-900">Build Features (Xây dựng chỉ số)</h4>
                                <div className="text-sm text-gray-700 space-y-2">
                                    <p>
                                        <strong>Features là gì?</strong> Là các "dấu hiệu" giúp AI hiểu tình hình booking đang tốt hay xấu.
                                        Ví dụ: "7 ngày qua có thêm 10 booking mới" → demand đang cao.
                                    </p>
                                    <p>
                                        <strong>Dữ liệu nguồn:</strong> Lấy từ bảng OTB vừa build, so sánh với:
                                    </p>
                                    <ul className="list-disc list-inside ml-4 space-y-1">
                                        <li><strong>Pickup T-7/T-15/T-30:</strong> Số booking mới trong 7/15/30 ngày qua</li>
                                        <li><strong>So với năm trước (STLY):</strong> Cùng kỳ năm ngoái có bao nhiêu booking?</li>
                                        <li><strong>Remaining Supply:</strong> Còn bao nhiêu phòng trống có thể bán?</li>
                                    </ul>
                                    <p>
                                        <strong>Tại sao cần?</strong> AI cần nhiều góc nhìn để quyết định đúng.
                                        Chỉ biết "đã bán 50 phòng" thì chưa đủ - phải biết "năm ngoái cùng ngày bán được 70"
                                        thì mới biết năm nay đang chậm hơn → cần giảm giá.
                                    </p>
                                </div>
                                <div className="bg-purple-100 rounded-lg p-2 text-sm text-purple-700">
                                    <strong>👉 Kết quả:</strong> Bảng các chỉ số phân tích cho từng ngày (pace, pickup, remaining supply...).
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Run Forecast */}
                    <div className="border border-gray-200 rounded-xl p-4 bg-gradient-to-r from-emerald-50 to-white">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                                <span className="text-xl">📈</span>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-900">Run Forecast (Dự báo nhu cầu)</h4>
                                <div className="text-sm text-gray-700 space-y-2">
                                    <p>
                                        <strong>Forecast là gì?</strong> Là dự đoán "còn bao nhiêu khách NỮA sẽ đặt phòng" từ hôm nay đến ngày đó.
                                        Giống như dự báo thời tiết - không chính xác 100% nhưng đủ để ra quyết định.
                                    </p>
                                    <p>
                                        <strong>Dữ liệu nguồn:</strong> Dựa vào các Features (chỉ số) vừa tính:
                                    </p>
                                    <ul className="list-disc list-inside ml-4 space-y-1">
                                        <li>Nếu pickup 7 ngày qua cao → Demand còn nhiều → Có thể tăng giá</li>
                                        <li>Nếu pace chậm hơn năm trước → Demand yếu → Cần khuyến mãi</li>
                                    </ul>
                                    <p>
                                        <strong>Tại sao cần?</strong> Đây là bước cuối cùng để AI tính ra "còn lại bao nhiêu nhu cầu chưa được đáp ứng"
                                        → Từ đó đưa ra khuyến nghị giá phù hợp.
                                    </p>
                                </div>
                                <div className="bg-emerald-100 rounded-lg p-2 text-sm text-emerald-700">
                                    <strong>👉 Kết quả:</strong> Dự báo số phòng sẽ được đặt thêm + Giá khuyến nghị cho từng ngày.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Important Notes */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="font-medium text-amber-700 mb-2">⚠️ Lưu ý quan trọng:</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                        <li>• <strong>Thứ tự bắt buộc:</strong> Phải chạy Build OTB trước → rồi Build Features → rồi Run Forecast</li>
                        <li>• <strong>Dữ liệu quá khứ:</strong> Bạn có thể upload dữ liệu từ nhiều tháng/năm trước để so sánh STLY</li>
                        <li>• <strong>Tự động:</strong> Sau khi upload file mới, các bước này sẽ tự động chạy (hoặc bạn bấm thủ công)</li>
                    </ul>
                </div>
            </section>

            {/* Section 5: Terminology */}
            <section id="thuat-ngu" className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    5. Thuật ngữ chuyên ngành
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-3 py-2 text-left text-gray-600">Thuật ngữ</th>
                                <th className="px-3 py-2 text-left text-gray-600">Giải thích</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            <tr className="border-t border-gray-100">
                                <td className="px-3 py-3 font-mono text-blue-600">OTB</td>
                                <td className="px-3 py-3">On The Books - Số phòng/doanh thu đã được đặt</td>
                            </tr>
                            <tr className="border-t border-gray-100">
                                <td className="px-3 py-3 font-mono text-blue-600">ADR</td>
                                <td className="px-3 py-3">Average Daily Rate - Giá phòng trung bình</td>
                            </tr>
                            <tr className="border-t border-gray-100">
                                <td className="px-3 py-3 font-mono text-blue-600">RevPAR</td>
                                <td className="px-3 py-3">Revenue Per Available Room - Doanh thu/phòng khả dụng</td>
                            </tr>
                            <tr className="border-t border-gray-100">
                                <td className="px-3 py-3 font-mono text-blue-600">Occupancy</td>
                                <td className="px-3 py-3">Tỷ lệ lấp đầy - % phòng được bán</td>
                            </tr>
                            <tr className="border-t border-gray-100">
                                <td className="px-3 py-3 font-mono text-blue-600">Pickup</td>
                                <td className="px-3 py-3">Lượng booking mới trong khoảng thời gian</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}

// ==================== PRICING GUIDE ====================
function PricingGuide() {
    return (
        <>
            {/* Table of Contents */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">📑 Mục lục</h2>
                <nav className="space-y-2 text-sm">
                    <a href="#pricing-intro" className="block text-blue-600 hover:text-blue-700">1. Giới thiệu về Tính giá OTA</a>
                    <a href="#cong-thuc" className="block text-blue-600 hover:text-blue-700">2. Công thức tính giá</a>
                    <a href="#hang-phong" className="block text-blue-600 hover:text-blue-700">3. Quản lý Hạng phòng</a>
                    <a href="#kenh-ota" className="block text-blue-600 hover:text-blue-700">4. Kênh OTA & Hoa hồng</a>
                    <a href="#khuyen-mai" className="block text-blue-600 hover:text-blue-700">5. Chương trình khuyến mãi</a>
                    <a href="#bang-gia" className="block text-blue-600 hover:text-blue-700">6. Bảng giá tổng hợp</a>
                    <a href="#tinh-nguoc" className="block text-blue-600 hover:text-blue-700">7. Tính ngược (BAR → NET)</a>
                </nav>
            </div>

            {/* Section 1: Introduction */}
            <section id="pricing-intro" className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    1. Giới thiệu về Tính giá OTA
                </h2>
                <div className="text-gray-700 space-y-3">
                    <p>
                        Module <strong>Tính giá OTA</strong> giúp bạn tính toán giá hiển thị trên các kênh bán phòng
                        (Agoda, Booking.com, Expedia...) sao cho đảm bảo thu về đúng số tiền mong muốn sau khi
                        trừ hoa hồng và khuyến mãi.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-blue-700">
                            <strong>💡 Vấn đề:</strong> Nếu muốn thu về <strong>1.000.000đ</strong> nhưng OTA lấy 18% hoa hồng + 10% khuyến mãi,
                            bạn phải đặt giá bao nhiêu?
                        </p>
                        <p className="text-blue-700 mt-2">
                            <strong>→ Đáp án:</strong> Đặt giá <strong>1.389.000đ</strong> để sau khi trừ hết, về tay đúng 1 triệu!
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 2: Formula */}
            <section id="cong-thuc" className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    2. Công thức tính giá
                </h2>
                <div className="text-gray-700 space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 font-mono text-center">
                        <p className="text-lg">
                            <strong>Giá hiển thị (BAR)</strong> = NET ÷ (1 - Hoa hồng) ÷ (1 - KM₁) ÷ (1 - KM₂) ...
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-600">Thuật ngữ</th>
                                    <th className="px-3 py-2 text-left text-gray-600">Giải thích</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3 font-medium text-emerald-600">NET</td>
                                    <td className="px-3 py-3">Giá thu về mong muốn (tiền thực nhận)</td>
                                </tr>
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3 font-medium text-blue-600">BAR</td>
                                    <td className="px-3 py-3">Best Available Rate - Giá hiển thị trên OTA</td>
                                </tr>
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3 font-medium text-orange-600">Hoa hồng</td>
                                    <td className="px-3 py-3">% OTA thu (VD: Agoda 18%, Booking 15%)</td>
                                </tr>
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3 font-medium text-purple-600">KM</td>
                                    <td className="px-3 py-3">Khuyến mãi (Early Bird, Mobile Deal...)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="font-medium text-amber-700 mb-2">📝 Ví dụ cụ thể:</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                            <li>• NET mong muốn: <strong>1.000.000đ</strong></li>
                            <li>• Hoa hồng Agoda: <strong>18%</strong></li>
                            <li>• Early Bird 10%, Mobile Deal 5%</li>
                            <li>• BAR = 1.000.000 ÷ 0.82 ÷ 0.90 ÷ 0.95 = <strong>1.427.000đ</strong></li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Section 3: Room Types */}
            <section id="hang-phong" className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    🏨 3. Quản lý Hạng phòng
                </h2>
                <div className="text-gray-700 space-y-3">
                    <p>Tạo các hạng phòng với giá NET mong muốn cho từng loại:</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-600">Hạng phòng</th>
                                    <th className="px-3 py-2 text-right text-gray-600">Giá NET</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3">Standard</td>
                                    <td className="px-3 py-3 text-right font-mono">1.000.000đ</td>
                                </tr>
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3">Deluxe</td>
                                    <td className="px-3 py-3 text-right font-mono">1.500.000đ</td>
                                </tr>
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3">Suite</td>
                                    <td className="px-3 py-3 text-right font-mono">2.500.000đ</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                        <p className="text-emerald-700 text-sm">
                            <strong>💡 Mẹo:</strong> Giá NET là số tiền bạn muốn THỰC NHẬN sau khi OTA trừ hết các khoản.
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 4: OTA Channels */}
            <section id="kenh-ota" className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Percent className="w-5 h-5 text-blue-600" />
                    4. Kênh OTA & Hoa hồng
                </h2>
                <div className="text-gray-700 space-y-3">
                    <p>Cấu hình các kênh OTA với tỷ lệ hoa hồng tương ứng:</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-600">Kênh</th>
                                    <th className="px-3 py-2 text-center text-gray-600">Hoa hồng</th>
                                    <th className="px-3 py-2 text-left text-gray-600">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3 font-medium">Agoda</td>
                                    <td className="px-3 py-3 text-center">18%</td>
                                    <td className="px-3 py-3 text-gray-500">Phổ biến ở Châu Á</td>
                                </tr>
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3 font-medium">Booking.com</td>
                                    <td className="px-3 py-3 text-center">15%</td>
                                    <td className="px-3 py-3 text-gray-500">Phổ biến toàn cầu</td>
                                </tr>
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3 font-medium">Expedia</td>
                                    <td className="px-3 py-3 text-center">17%</td>
                                    <td className="px-3 py-3 text-gray-500">Thị trường Mỹ</td>
                                </tr>
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3 font-medium">Traveloka</td>
                                    <td className="px-3 py-3 text-center">17%</td>
                                    <td className="px-3 py-3 text-gray-500">Đông Nam Á</td>
                                </tr>
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3 font-medium">CTRIP</td>
                                    <td className="px-3 py-3 text-center">18%</td>
                                    <td className="px-3 py-3 text-gray-500">Khách Trung Quốc</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Section 5: Promotions */}
            <section id="khuyen-mai" className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-blue-600" />
                    5. Chương trình khuyến mãi
                </h2>
                <div className="text-gray-700 space-y-4">
                    <p>Các loại khuyến mãi phổ biến trên OTA:</p>

                    <div className="grid gap-3">
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                            <div className="font-medium text-blue-700">🌙 Early Bird</div>
                            <p className="text-sm text-gray-600">Đặt sớm trước 7-30 ngày, giảm 10-20%</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                            <div className="font-medium text-purple-700">📱 Mobile Deal</div>
                            <p className="text-sm text-gray-600">Đặt qua app, giảm 5-10%</p>
                        </div>
                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                            <div className="font-medium text-amber-700">⚡ Last Minute</div>
                            <p className="text-sm text-gray-600">Đặt gấp trong 24h, giảm 15-25%</p>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                            <div className="font-medium text-emerald-700">🔒 Member Deal</div>
                            <p className="text-sm text-gray-600">Thành viên VIP, giảm 5-15%</p>
                        </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-700 text-sm">
                            <strong>⚠️ Lưu ý:</strong> Các KM được tính lũy tiến (nhân dồn). VD: Early Bird 10% + Mobile 5%
                            → Tổng giảm = 1 - (0.90 × 0.95) = <strong>14.5%</strong> (không phải 15%!)
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 6: Price Matrix */}
            <section id="bang-gia" className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    📊 6. Bảng giá tổng hợp
                </h2>
                <div className="text-gray-700 space-y-3">
                    <p>
                        Tab <strong>"Bảng giá"</strong> hiển thị ma trận giá cho tất cả hạng phòng × kênh OTA:
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-600">Hạng phòng</th>
                                    <th className="px-3 py-2 text-right text-gray-600">NET</th>
                                    <th className="px-3 py-2 text-right text-gray-600">Agoda</th>
                                    <th className="px-3 py-2 text-right text-gray-600">Booking</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3">Standard</td>
                                    <td className="px-3 py-3 text-right font-mono">1.000.000</td>
                                    <td className="px-3 py-3 text-right font-mono text-blue-600">1.389.000</td>
                                    <td className="px-3 py-3 text-right font-mono text-blue-600">1.333.000</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <p className="text-blue-700 text-sm">
                            <strong>💡 Mẹo:</strong> Hover vào ô giá để xem chi tiết cách tính.
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 7: Reverse Calculation */}
            <section id="tinh-nguoc" className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                    7. Tính ngược (BAR → NET)
                </h2>
                <div className="text-gray-700 space-y-4">
                    <p>
                        Chế độ <strong>"Giá hiển thị → Thu về"</strong> giúp tính ngược: Nếu đặt giá đồng nhất trên tất cả OTA,
                        khách sạn sẽ thu về bao nhiêu từ mỗi kênh?
                    </p>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="font-medium text-amber-700 mb-2">📝 Ví dụ:</p>
                        <p className="text-sm text-gray-700">
                            Đặt giá đồng nhất <strong>1.500.000đ</strong> trên tất cả kênh:
                        </p>
                        <ul className="text-sm text-gray-700 mt-2 space-y-1">
                            <li>• Agoda (18% + 10% KM): Thu về <strong>1.107.000đ</strong> (74%)</li>
                            <li>• Booking (15% + 5% KM): Thu về <strong>1.211.000đ</strong> (81%)</li>
                            <li>• Direct (0%): Thu về <strong>1.500.000đ</strong> (100%)</li>
                        </ul>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <p className="text-emerald-700 text-sm">
                            <strong>💡 Ứng dụng:</strong> So sánh hiệu quả giữa các kênh để quyết định
                            nên ưu tiên kênh nào (kênh nào giữ lại được nhiều % nhất).
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <p className="text-blue-700 mb-3">
                    Sẵn sàng tính giá?
                </p>
                <Link
                    href="/pricing"
                    className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    Đi tới Tính giá OTA →
                </Link>
            </div>
        </>
    );
}
