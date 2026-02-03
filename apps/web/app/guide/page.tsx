import { BookOpen, BarChart3, TrendingUp, DollarSign, CalendarDays, Upload, Database, Settings, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function GuidePage() {
    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
                    <BookOpen className="w-7 h-7 text-blue-500" />
                    Hướng dẫn sử dụng RMS
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Tài liệu hướng dẫn dành cho General Manager và nhân viên quản lý doanh thu
                </p>
            </div>

            {/* Table of Contents */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-slate-50 mb-4">📑 Mục lục</h2>
                <nav className="space-y-2 text-sm">
                    <a href="#gioi-thieu" className="block text-blue-400 hover:text-blue-300">1. Giới thiệu về Revenue Management</a>
                    <a href="#dashboard" className="block text-blue-400 hover:text-blue-300">2. Dashboard - Bảng điều khiển chính</a>
                    <a href="#kpi-cards" className="block text-blue-400 hover:text-blue-300 ml-4">2.1. Các thẻ KPI</a>
                    <a href="#bieu-do" className="block text-blue-400 hover:text-blue-300 ml-4">2.2. Biểu đồ OTB</a>
                    <a href="#bang-khuyen-nghi" className="block text-blue-400 hover:text-blue-300 ml-4">2.3. Bảng khuyến nghị giá</a>
                    <a href="#upload" className="block text-blue-400 hover:text-blue-300">3. Import dữ liệu</a>
                    <a href="#data-inspector" className="block text-blue-400 hover:text-blue-300">4. Data Inspector</a>
                    <a href="#settings" className="block text-blue-400 hover:text-blue-300">5. Cài đặt khách sạn</a>
                    <a href="#thuat-ngu" className="block text-blue-400 hover:text-blue-300">6. Thuật ngữ chuyên ngành</a>
                </nav>
            </div>

            {/* Section 1: Introduction */}
            <section id="gioi-thieu" className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold text-slate-50 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-blue-500" />
                    1. Giới thiệu về Revenue Management
                </h2>

                <div className="text-slate-300 space-y-3">
                    <p>
                        <strong>Revenue Management (RM)</strong> hay Quản lý Doanh thu là nghệ thuật bán đúng phòng,
                        cho đúng khách, vào đúng thời điểm, với mức giá tối ưu.
                    </p>
                    <p>
                        Hệ thống RMS giúp bạn:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Theo dõi lượng đặt phòng (OTB - On The Books)</li>
                        <li>Dự đoán nhu cầu tương lai</li>
                        <li>Đề xuất mức giá tối ưu cho từng ngày</li>
                        <li>Phân tích hiệu quả kinh doanh</li>
                    </ul>
                </div>
            </section>

            {/* Section 2: Dashboard */}
            <section id="dashboard" className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold text-slate-50 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    2. Dashboard - Bảng điều khiển chính
                </h2>

                <p className="text-slate-300">
                    Dashboard là nơi bạn xem tổng quan về tình hình đặt phòng và nhận khuyến nghị giá.
                </p>

                {/* 2.1 KPI Cards */}
                <div id="kpi-cards" className="border-t border-slate-700 pt-4">
                    <h3 className="text-lg font-medium text-slate-50 mb-3">2.1. Các thẻ KPI (Chỉ số chính)</h3>

                    <div className="space-y-4">
                        <div className="bg-slate-800/50 p-4 rounded-lg">
                            <div className="text-blue-400 font-medium mb-2">📊 Rooms OTB</div>
                            <p className="text-sm text-slate-300">
                                <strong>Ý nghĩa:</strong> Tổng số phòng đã được đặt (On The Books) trong 30 ngày tới.
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                                <strong>Công thức:</strong> SUM(rooms_otb) trong 30 ngày
                            </p>
                            <p className="text-sm text-slate-400">
                                <strong>Cách đọc:</strong> Ví dụ "1,234" = đã có 1,234 room-nights được đặt. Số càng cao = booking càng tốt.
                            </p>
                        </div>

                        <div className="bg-slate-800/50 p-4 rounded-lg">
                            <div className="text-purple-400 font-medium mb-2">🏨 Remaining Supply</div>
                            <p className="text-sm text-slate-300">
                                <strong>Ý nghĩa:</strong> Số phòng còn trống có thể bán trong 30 ngày tới.
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                                <strong>Công thức:</strong> = (Capacity × 30 ngày) − Rooms OTB
                            </p>
                            <p className="text-sm text-slate-400">
                                <strong>Ví dụ:</strong> Hotel 240 phòng: (240 × 30) − 1234 = 5,966 phòng còn trống
                            </p>
                            <p className="text-sm text-slate-400">
                                <strong>Cách đọc:</strong> Số càng nhỏ = càng ít phòng trống = demand cao, nên tăng giá.
                            </p>
                        </div>

                        <div className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-emerald-500">
                            <div className="text-emerald-400 font-medium mb-2">📈 Avg Pickup T7</div>
                            <p className="text-sm text-slate-300">
                                <strong>Ý nghĩa:</strong> Trung bình số phòng được đặt THÊM trong 7 ngày qua cho mỗi stay date.
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                                <strong>Công thức:</strong> AVG(pickup_t7) = AVG( OTB_hôm_nay − OTB_7_ngày_trước )
                            </p>
                            <p className="text-sm text-slate-400">
                                <strong>Ví dụ:</strong> "+6.3" nghĩa là trung bình mỗi ngày stay trong tương lai đã nhận thêm 6.3 bookings so với 7 ngày trước.
                            </p>
                            <p className="text-sm text-amber-400 mt-2">
                                <strong>💡 Insight:</strong> Pickup cao = demand đang tăng → có thể tăng giá. Pickup âm = đang có hủy nhiều hơn đặt mới.
                            </p>
                        </div>

                        <div className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-amber-500">
                            <div className="text-amber-400 font-medium mb-2">🎯 Forecast Demand</div>
                            <p className="text-sm text-slate-300">
                                <strong>Ý nghĩa:</strong> Dự báo số phòng SẼ được đặt thêm trong tương lai (remaining demand).
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                                <strong>Công thức:</strong> Dựa trên heuristic: MAX( AVG(pickup_t5, t15, t30), pickup_t7 )
                            </p>
                            <p className="text-sm text-slate-400">
                                <strong>Ví dụ:</strong> "+4664" nghĩa là hệ thống dự báo sẽ có thêm 4,664 room-nights được đặt trong tương lai.
                            </p>
                            <p className="text-sm text-amber-400 mt-2">
                                <strong>💡 Insight:</strong> Nếu Forecast Demand lớn và Remaining Supply nhỏ → sẽ hết phòng → nên TĂNG GIÁ ngay.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2.2 Chart */}
                <div id="bieu-do" className="border-t border-slate-700 pt-4">
                    <h3 className="text-lg font-medium text-slate-50 mb-3">2.2. Biểu đồ OTB theo ngày</h3>

                    <div className="text-sm text-slate-300 space-y-3">
                        <p>
                            Biểu đồ hiển thị số phòng đã đặt (OTB) cho mỗi ngày trong tương lai:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>
                                <strong>Trục ngang (X):</strong> Các ngày lưu trú (Stay Date) từ hôm nay đến 30 ngày tới
                            </li>
                            <li>
                                <strong>Trục dọc (Y):</strong> Số phòng đã được đặt cho ngày đó
                            </li>
                            <li>
                                <strong>Cột cao (màu xanh):</strong> Ngày có nhiều booking → Demand cao → Có thể tăng giá
                            </li>
                            <li>
                                <strong>Cột thấp:</strong> Ngày ít booking → Cần chạy promotion hoặc giảm giá để thu hút khách
                            </li>
                        </ul>

                        <div className="bg-amber-950/30 border border-amber-800 rounded-lg p-3 mt-4">
                            <p className="text-amber-300">
                                <strong>💡 Mẹo:</strong> Chú ý các ngày cuối tuần (Thứ 6, 7) thường có demand cao hơn ngày thường.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2.3 Recommendations Table */}
                <div id="bang-khuyen-nghi" className="border-t border-slate-700 pt-4">
                    <h3 className="text-lg font-medium text-slate-50 mb-3">2.3. Bảng khuyến nghị giá</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-800">
                                <tr>
                                    <th className="px-3 py-2 text-left text-slate-400">Cột</th>
                                    <th className="px-3 py-2 text-left text-slate-400">Giải thích</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300">
                                <tr className="border-t border-slate-700">
                                    <td className="px-3 py-3 font-medium">Stay Date</td>
                                    <td className="px-3 py-3">Ngày khách ở (check-in date). Ngày cuối tuần có highlight riêng.</td>
                                </tr>
                                <tr className="border-t border-slate-700">
                                    <td className="px-3 py-3 font-medium">OTB</td>
                                    <td className="px-3 py-3">Số phòng đã đặt cho ngày đó. Dữ liệu thực từ database.</td>
                                </tr>
                                <tr className="border-t border-slate-700">
                                    <td className="px-3 py-3 font-medium">Remaining</td>
                                    <td className="px-3 py-3">
                                        Số phòng còn trống = Capacity − OTB. Dữ liệu thực.
                                    </td>
                                </tr>
                                <tr className="border-t border-slate-700">
                                    <td className="px-3 py-3 font-medium">Fcst (Forecast)</td>
                                    <td className="px-3 py-3">
                                        Dự báo số phòng sẽ được đặt thêm. Từ bảng <code className="bg-slate-700 px-1 rounded">demand_forecast</code>.
                                        <br /><span className="text-slate-400">Cần chạy "Run Forecast" ở trang /data để có data.</span>
                                    </td>
                                </tr>
                                <tr className="border-t border-slate-700">
                                    <td className="px-3 py-3 font-medium">Current (ADR)</td>
                                    <td className="px-3 py-3">
                                        Giá phòng trung bình hiện tại = Revenue ÷ OTB. Dữ liệu thực.
                                    </td>
                                </tr>
                                <tr className="border-t border-slate-700 bg-emerald-950/20">
                                    <td className="px-3 py-3 font-medium text-emerald-400">Recommended</td>
                                    <td className="px-3 py-3">
                                        Giá khuyến nghị do <strong>Pricing Engine</strong> tính dựa trên:
                                        <ul className="list-disc list-inside text-slate-400 mt-1 text-xs">
                                            <li>Giá hiện tại (ADR)</li>
                                            <li>Forecast Demand (nhu cầu dự báo)</li>
                                            <li>Remaining Supply (phòng còn trống)</li>
                                        </ul>
                                        <span className="text-emerald-400 text-xs">✅ Đang dùng Pricing Engine thật (ladder pricing strategy)</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Accept/Override Explanation */}
                    <div className="mt-6 space-y-4">
                        <h4 className="text-md font-medium text-slate-50">🎯 Nút Accept và Override là gì?</h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-emerald-950/30 border border-emerald-800 rounded-lg p-4">
                                <div className="text-emerald-400 font-medium mb-2">✅ Accept</div>
                                <p className="text-sm text-slate-300">
                                    Đồng ý áp dụng giá khuyến nghị của hệ thống.
                                </p>
                                <p className="text-sm text-slate-400 mt-2">
                                    <strong>Khi bấm:</strong> Giá recommended sẽ được lưu vào <code className="bg-slate-700 px-1 rounded">decision_log</code> với status = "accepted"
                                </p>
                            </div>

                            <div className="bg-blue-950/30 border border-blue-800 rounded-lg p-4">
                                <div className="text-blue-400 font-medium mb-2">✏️ Override</div>
                                <p className="text-sm text-slate-300">
                                    Nhập giá khác theo ý bạn (có thể cao hơn hoặc thấp hơn).
                                </p>
                                <p className="text-sm text-slate-400 mt-2">
                                    <strong>Khi bấm:</strong> Popup hiện ra để bạn nhập giá. Sau đó lưu với status = "overridden"
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 rounded-lg p-4">
                            <p className="text-sm text-slate-300">
                                <strong>💡 Mục đích:</strong> Decision Log giúp theo dõi các quyết định giá của bạn.
                                Sau này hệ thống có thể học từ các quyết định override để cải thiện đề xuất.
                            </p>
                        </div>
                    </div>

                    {/* Pricing Engine Explanation */}
                    <div className="mt-6 border-t border-slate-700 pt-6">
                        <h4 className="text-md font-medium text-slate-50 mb-4">⚙️ Pricing Engine hoạt động như thế nào?</h4>

                        <div className="space-y-4">
                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <p className="text-sm text-slate-300 mb-3">
                                    Pricing Engine tính giá khuyến nghị dựa trên <strong>3 yếu tố</strong>:
                                </p>
                                <table className="w-full text-sm">
                                    <tbody>
                                        <tr className="border-b border-slate-700">
                                            <td className="py-2 font-medium text-blue-400">1. Current Price</td>
                                            <td className="py-2 text-slate-300">Giá ADR hiện tại (Revenue ÷ Rooms)</td>
                                        </tr>
                                        <tr className="border-b border-slate-700">
                                            <td className="py-2 font-medium text-amber-400">2. Forecast Demand</td>
                                            <td className="py-2 text-slate-300">Nhu cầu dự báo sẽ đặt thêm (từ Run Forecast)</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 font-medium text-purple-400">3. Remaining Supply</td>
                                            <td className="py-2 text-slate-300">Số phòng còn trống = Capacity − OTB</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-emerald-950/30 border border-emerald-800 rounded-lg p-4">
                                <div className="text-emerald-400 font-medium mb-2">📈 Chiến lược "Ladder Pricing"</div>
                                <ul className="text-sm text-slate-300 space-y-2">
                                    <li>• <strong>Demand cao + Supply thấp</strong> → Đề xuất <span className="text-emerald-400">TĂNG GIÁ</span> (+10%, +20%)</li>
                                    <li>• <strong>Demand thấp + Supply cao</strong> → Đề xuất <span className="text-amber-400">GIỮ GIÁ</span> hoặc giảm nhẹ</li>
                                    <li>• <strong>Supply = 0</strong> → <span className="text-rose-400">STOP SELL</span> (hết phòng, ngừng bán)</li>
                                </ul>
                            </div>

                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <div className="text-slate-400 font-medium mb-2">🔢 Công thức đơn giản:</div>
                                <code className="block bg-slate-900 p-3 rounded text-xs text-slate-300">
                                    expected_sales = min(forecast_demand, remaining_supply)<br />
                                    revenue = price × expected_sales<br />
                                    → Chọn giá có revenue cao nhất
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3: Upload */}
            <section id="upload" className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold text-slate-50 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-500" />
                    3. Import dữ liệu đặt phòng
                </h2>

                <div className="text-slate-300 space-y-4">
                    <p>
                        Để hệ thống hoạt động, bạn cần import dữ liệu đặt phòng từ PMS (Property Management System).
                    </p>

                    {/* Required Fields */}
                    <div className="border-t border-slate-700 pt-4">
                        <h4 className="font-medium text-slate-50 mb-3">📋 Các trường dữ liệu bắt buộc:</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-800">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-slate-400">Trường</th>
                                        <th className="px-3 py-2 text-left text-slate-400">Ví dụ</th>
                                        <th className="px-3 py-2 text-left text-slate-400">Dùng để tính</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-300">
                                    <tr className="border-t border-slate-700">
                                        <td className="px-3 py-2 font-mono text-blue-400">reservation_id</td>
                                        <td className="px-3 py-2">RES-2024-001234</td>
                                        <td className="px-3 py-2">ID đặt phòng (để chống trùng lặp)</td>
                                    </tr>
                                    <tr className="border-t border-slate-700 bg-emerald-950/20">
                                        <td className="px-3 py-2 font-mono text-emerald-400">booking_date</td>
                                        <td className="px-3 py-2">2024-01-15</td>
                                        <td className="px-3 py-2"><strong>Pickup</strong> = So sánh OTB theo thời gian đặt</td>
                                    </tr>
                                    <tr className="border-t border-slate-700 bg-amber-950/20">
                                        <td className="px-3 py-2 font-mono text-amber-400">arrival_date</td>
                                        <td className="px-3 py-2">2024-02-10</td>
                                        <td className="px-3 py-2"><strong>OTB</strong> = Nhóm theo stay_date để đếm phòng</td>
                                    </tr>
                                    <tr className="border-t border-slate-700 bg-amber-950/20">
                                        <td className="px-3 py-2 font-mono text-amber-400">departure_date</td>
                                        <td className="px-3 py-2">2024-02-13</td>
                                        <td className="px-3 py-2"><strong>OTB</strong> = Tính số đêm (arrival → departure)</td>
                                    </tr>
                                    <tr className="border-t border-slate-700 bg-blue-950/20">
                                        <td className="px-3 py-2 font-mono text-blue-400">rooms</td>
                                        <td className="px-3 py-2">2</td>
                                        <td className="px-3 py-2"><strong>Rooms OTB</strong> = Tổng số phòng mỗi đêm</td>
                                    </tr>
                                    <tr className="border-t border-slate-700 bg-purple-950/20">
                                        <td className="px-3 py-2 font-mono text-purple-400">revenue</td>
                                        <td className="px-3 py-2">4,500,000</td>
                                        <td className="px-3 py-2"><strong>ADR</strong> = Revenue ÷ Rooms → <strong>Pricing Engine</strong></td>
                                    </tr>
                                    <tr className="border-t border-slate-700">
                                        <td className="px-3 py-2 font-mono text-rose-400">status</td>
                                        <td className="px-3 py-2">booked / cancelled</td>
                                        <td className="px-3 py-2">Lọc ra booking active (không tính cancelled)</td>
                                    </tr>
                                    <tr className="border-t border-slate-700">
                                        <td className="px-3 py-2 font-mono text-slate-400">cancel_date</td>
                                        <td className="px-3 py-2">2024-01-20 (hoặc trống)</td>
                                        <td className="px-3 py-2">Ngày hủy (nếu có) - dùng cho báo cáo cancellation</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Data Flow Diagram */}
                    <div className="border-t border-slate-700 pt-4">
                        <h4 className="font-medium text-slate-50 mb-3">🔄 Luồng dữ liệu:</h4>
                        <div className="bg-slate-800/50 rounded-lg p-4 space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">1. Upload</span>
                                <span className="text-slate-400">→</span>
                                <span className="text-slate-300">File CSV/XML chứa reservations</span>
                            </div>
                            <div className="flex items-center gap-2 ml-6">
                                <span className="text-slate-500">↓</span>
                                <span className="text-slate-400 text-xs">Lưu vào bảng <code className="bg-slate-700 px-1 rounded">reservations_raw</code></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">2. Build OTB</span>
                                <span className="text-slate-400">→</span>
                                <span className="text-slate-300">Tính <strong>rooms_otb</strong>, <strong>revenue_otb</strong> theo stay_date</span>
                            </div>
                            <div className="flex items-center gap-2 ml-6">
                                <span className="text-slate-500">↓</span>
                                <span className="text-slate-400 text-xs">Lưu vào bảng <code className="bg-slate-700 px-1 rounded">daily_otb</code></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">3. Build Features</span>
                                <span className="text-slate-400">→</span>
                                <span className="text-slate-300">Tính <strong>pickup_t7</strong>, <strong>pace_vs_ly</strong></span>
                            </div>
                            <div className="flex items-center gap-2 ml-6">
                                <span className="text-slate-500">↓</span>
                                <span className="text-slate-400 text-xs">Lưu vào bảng <code className="bg-slate-700 px-1 rounded">features_daily</code></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-amber-600 text-white px-2 py-1 rounded text-xs font-medium">4. Run Forecast</span>
                                <span className="text-slate-400">→</span>
                                <span className="text-slate-300">Tính <strong>remaining_demand</strong></span>
                            </div>
                            <div className="flex items-center gap-2 ml-6">
                                <span className="text-slate-500">↓</span>
                                <span className="text-slate-400 text-xs">Lưu vào bảng <code className="bg-slate-700 px-1 rounded">demand_forecast</code></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-emerald-600 text-white px-2 py-1 rounded text-xs font-medium">5. Pricing Engine</span>
                                <span className="text-slate-400">→</span>
                                <span className="text-slate-300">Tính <strong>recommended_price</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="border-t border-slate-700 pt-4">
                        <h4 className="font-medium text-slate-50 mb-3">📝 Các bước thực hiện:</h4>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>Export báo cáo &quot;Reservation Booked On Date&quot; từ PMS</li>
                            <li>Lưu file dạng CSV hoặc XML (Crystal Reports)</li>
                            <li>Vào menu <strong>Upload</strong> → Kéo thả file vào</li>
                            <li>Chờ hệ thống xử lý (vài giây)</li>
                            <li>Vào <strong>Data Inspector</strong> → Nhấn các nút theo thứ tự: <br />
                                <span className="text-blue-400">Build OTB</span> → <span className="text-purple-400">Build Features</span> → <span className="text-amber-400">Run Forecast</span>
                            </li>
                        </ol>
                    </div>

                    <div className="bg-blue-950/30 border border-blue-800 rounded-lg p-3 mt-4">
                        <p className="text-blue-300">
                            <strong>📌 Tần suất:</strong> Nên import mỗi ngày vào buổi sáng để có dữ liệu mới nhất.
                            Càng nhiều ngày data → Pickup và Forecast càng chính xác.
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 4: Data Inspector */}
            <section id="data-inspector" className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold text-slate-50 flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-500" />
                    4. Data Inspector - Kiểm tra dữ liệu
                </h2>

                <div className="text-slate-300 space-y-4">
                    <p>
                        Trang này giúp bạn kiểm tra dữ liệu đã import và chạy các pipeline xử lý.
                    </p>

                    <h4 className="font-medium text-slate-50 mt-4">📊 Các mục dữ liệu:</h4>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Import Jobs:</strong> Danh sách các file đã upload, trạng thái xử lý (phân trang 10/page)</li>
                        <li><strong>Reservations by Booking Date:</strong> Thống kê booking theo ngày đặt</li>
                        <li><strong>Recent Reservations:</strong> 50 booking gần nhất</li>
                        <li><strong>Daily OTB:</strong> Dữ liệu OTB đã tính toán</li>
                    </ul>

                    {/* Action Buttons Section */}
                    <div className="border-t border-slate-700 pt-4 mt-4">
                        <h4 className="font-medium text-slate-50 mb-3">🔘 Các nút hành động (Pipeline):</h4>

                        <div className="space-y-3">
                            {/* Build OTB */}
                            <div className="bg-blue-950/30 border border-blue-800 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">1. Build OTB</span>
                                </div>
                                <p className="text-sm text-blue-300">
                                    Tính <strong>rooms_otb</strong> và <strong>revenue_otb</strong> từ reservations.
                                    Chạy sau mỗi lần upload file mới.
                                </p>
                            </div>

                            {/* Build Features */}
                            <div className="bg-purple-950/30 border border-purple-800 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">2. Build Features</span>
                                </div>
                                <p className="text-sm text-purple-300">
                                    Tính <strong>pickup_t7</strong>, <strong>pace_vs_ly</strong> từ OTB snapshots.
                                    Cần có ít nhất 7 ngày OTB data.
                                </p>
                            </div>

                            {/* Run Forecast */}
                            <div className="bg-amber-950/30 border border-amber-800 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-amber-600 text-white px-2 py-1 rounded text-xs font-medium">3. Run Forecast</span>
                                </div>
                                <p className="text-sm text-amber-300">
                                    Tính <strong>remaining_demand</strong> dự báo.
                                    Đầu vào quan trọng cho Pricing Engine.
                                </p>
                            </div>

                            {/* Reset & Rebuild */}
                            <div className="bg-rose-950/30 border border-rose-800 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-rose-600 text-white px-2 py-1 rounded text-xs font-medium">⚠️ Reset & Rebuild</span>
                                </div>
                                <p className="text-sm text-rose-300 mb-2">
                                    <strong>XÓA TOÀN BỘ</strong> dữ liệu đã tính toán và bắt đầu lại từ đầu.
                                </p>
                                <ul className="text-xs text-slate-400 space-y-1">
                                    <li>❌ Xóa: daily_otb, features, forecast, recommendations, decisions</li>
                                    <li>✅ Giữ lại: reservations_raw (dữ liệu gốc vẫn an toàn)</li>
                                </ul>
                                <p className="text-xs text-rose-400 mt-2">
                                    <strong>Dùng khi:</strong> Import nhầm file, reset test data, pilot reset
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4 mt-4">
                        <p className="text-sm text-slate-300">
                            <strong>💡 Quy trình chuẩn:</strong> Upload → Build OTB → Build Features → Run Forecast → Dashboard
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 5: Settings */}
            <section id="settings" className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold text-slate-50 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-500" />
                    5. Cài đặt khách sạn
                </h2>

                <div className="text-slate-300 space-y-4">
                    <p>
                        Nhập thông tin khách sạn để hệ thống tính toán chính xác:
                    </p>

                    {/* Basic Settings */}
                    <div>
                        <h4 className="font-medium text-slate-50 mb-2">📋 Cài đặt cơ bản:</h4>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Tên khách sạn:</strong> Hiển thị trên báo cáo</li>
                            <li><strong>Số phòng (Capacity):</strong> QUAN TRỌNG! Dùng để tính Occupancy và Remaining</li>
                            <li><strong>Đơn vị tiền tệ:</strong> VND, USD, EUR</li>
                            <li><strong>Giá cơ bản:</strong> Giá mặc định khi chưa có dữ liệu</li>
                            <li><strong>Giá sàn/trần:</strong> Giới hạn giá để hệ thống đề xuất trong khoảng này</li>
                        </ul>
                    </div>

                    {/* Advanced Settings */}
                    <div className="border-t border-slate-700 pt-4">
                        <h4 className="font-medium text-slate-50 mb-3">⚙️ Cài đặt nâng cao:</h4>

                        <div className="space-y-3">
                            {/* Timezone */}
                            <div className="bg-slate-800/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-blue-400 font-medium">🌏 Múi giờ (Timezone)</span>
                                </div>
                                <p className="text-sm text-slate-400">
                                    Ảnh hưởng đến cách tính OTB theo ngày. Mặc định: Asia/Ho_Chi_Minh (GMT+7)
                                </p>
                            </div>

                            {/* Fiscal Start Day */}
                            <div className="bg-slate-800/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-amber-400 font-medium">📅 Ngày bắt đầu tháng tài chính</span>
                                </div>
                                <p className="text-sm text-slate-400">
                                    Mặc định = 1 (ngày đầu tháng). Dùng cho báo cáo pace theo năm tài chính.
                                </p>
                            </div>

                            {/* Ladder Config */}
                            <div className="bg-emerald-950/30 border border-emerald-800 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-emerald-400 font-medium">📈 Cấu hình Pricing Ladder</span>
                                </div>
                                <p className="text-sm text-slate-400 mb-2">
                                    Mức điều chỉnh giá mà Pricing Engine sẽ xem xét:
                                </p>
                                <table className="w-full text-xs">
                                    <tbody>
                                        <tr className="border-t border-slate-700">
                                            <td className="py-2 text-slate-300">⚡ Conservative</td>
                                            <td className="py-2 text-slate-400">±10% (an toàn, biến động thấp)</td>
                                        </tr>
                                        <tr className="border-t border-slate-700">
                                            <td className="py-2 text-slate-300">🎯 Standard</td>
                                            <td className="py-2 text-slate-400">±20% (mặc định, cân bằng)</td>
                                        </tr>
                                        <tr className="border-t border-slate-700">
                                            <td className="py-2 text-slate-300">🚀 Aggressive</td>
                                            <td className="py-2 text-slate-400">±30% (biến động mạnh, tối đa revenue)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 6: Terminology */}
            <section id="thuat-ngu" className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold text-slate-50 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    6. Thuật ngữ chuyên ngành
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800">
                            <tr>
                                <th className="px-3 py-2 text-left text-slate-400">Thuật ngữ</th>
                                <th className="px-3 py-2 text-left text-slate-400">Tiếng Việt</th>
                                <th className="px-3 py-2 text-left text-slate-400">Giải thích</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-300">
                            <tr className="border-t border-slate-700">
                                <td className="px-3 py-3 font-mono text-blue-400">OTB</td>
                                <td className="px-3 py-3">On The Books</td>
                                <td className="px-3 py-3">Số phòng/doanh thu đã được đặt (confirmed)</td>
                            </tr>
                            <tr className="border-t border-slate-700">
                                <td className="px-3 py-3 font-mono text-blue-400">ADR</td>
                                <td className="px-3 py-3">Giá phòng trung bình</td>
                                <td className="px-3 py-3">Average Daily Rate = Doanh thu ÷ Số phòng bán</td>
                            </tr>
                            <tr className="border-t border-slate-700">
                                <td className="px-3 py-3 font-mono text-blue-400">RevPAR</td>
                                <td className="px-3 py-3">Doanh thu/phòng khả dụng</td>
                                <td className="px-3 py-3">Revenue Per Available Room = ADR × Occupancy%</td>
                            </tr>
                            <tr className="border-t border-slate-700">
                                <td className="px-3 py-3 font-mono text-blue-400">Occupancy</td>
                                <td className="px-3 py-3">Tỷ lệ lấp đầy</td>
                                <td className="px-3 py-3">% phòng được bán = Rooms Sold ÷ Total Rooms</td>
                            </tr>
                            <tr className="border-t border-slate-700">
                                <td className="px-3 py-3 font-mono text-blue-400">Stay Date</td>
                                <td className="px-3 py-3">Ngày lưu trú</td>
                                <td className="px-3 py-3">Ngày khách ở trong khách sạn</td>
                            </tr>
                            <tr className="border-t border-slate-700">
                                <td className="px-3 py-3 font-mono text-blue-400">Booking Date</td>
                                <td className="px-3 py-3">Ngày đặt phòng</td>
                                <td className="px-3 py-3">Ngày khách thực hiện đặt phòng</td>
                            </tr>
                            <tr className="border-t border-slate-700">
                                <td className="px-3 py-3 font-mono text-blue-400">Lead Time</td>
                                <td className="px-3 py-3">Thời gian đặt trước</td>
                                <td className="px-3 py-3">Số ngày từ lúc đặt đến ngày check-in</td>
                            </tr>
                            <tr className="border-t border-slate-700">
                                <td className="px-3 py-3 font-mono text-blue-400">Pickup</td>
                                <td className="px-3 py-3">Lượng booking mới</td>
                                <td className="px-3 py-3">Số phòng đặt thêm trong khoảng thời gian (7 ngày, 30 ngày)</td>
                            </tr>
                            <tr className="border-t border-slate-700">
                                <td className="px-3 py-3 font-mono text-blue-400">Pace</td>
                                <td className="px-3 py-3">Tốc độ đặt phòng</td>
                                <td className="px-3 py-3">So sánh OTB hiện tại với cùng kỳ năm trước</td>
                            </tr>
                            <tr className="border-t border-slate-700">
                                <td className="px-3 py-3 font-mono text-blue-400">Demand</td>
                                <td className="px-3 py-3">Nhu cầu</td>
                                <td className="px-3 py-3">Lượng khách muốn đặt phòng (có thể lớn hơn capacity)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Footer */}
            <div className="bg-blue-950/30 border border-blue-800 rounded-lg p-6 text-center">
                <p className="text-blue-300 mb-3">
                    Bạn cần hỗ trợ thêm? Liên hệ đội ngũ kỹ thuật.
                </p>
                <Link
                    href="/settings"
                    className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    Đi tới Cài đặt →
                </Link>
            </div>
        </div>
    );
}
