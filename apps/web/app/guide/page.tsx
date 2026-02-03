import { BookOpen, BarChart3, TrendingUp, DollarSign, CalendarDays, Upload, Database, Settings, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function GuidePage() {
    return (
        <div className="mx-auto max-w-[1400px] px-8 py-6 space-y-6">
            {/* Header - lighter */}
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

            <div className="max-w-4xl mx-auto space-y-6">
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
                        <a href="#settings" className="block text-blue-600 hover:text-blue-700">5. Cài đặt khách sạn</a>
                        <a href="#thuat-ngu" className="block text-blue-600 hover:text-blue-700">6. Thuật ngữ chuyên ngành</a>
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
                                <p className="text-sm text-gray-600 mt-1">
                                    <strong>Công thức:</strong> SUM(rooms_otb) trong 30 ngày
                                </p>
                            </div>

                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <div className="text-purple-700 font-medium mb-2">🏨 Remaining Supply</div>
                                <p className="text-sm text-gray-700">
                                    <strong>Ý nghĩa:</strong> Số phòng còn trống có thể bán trong 30 ngày tới.
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    <strong>Công thức:</strong> = (Capacity × 30 ngày) − Rooms OTB
                                </p>
                            </div>

                            <div className="bg-emerald-50 p-4 rounded-xl border-l-4 border-emerald-500">
                                <div className="text-emerald-700 font-medium mb-2">📈 Avg Pickup T7</div>
                                <p className="text-sm text-gray-700">
                                    <strong>Ý nghĩa:</strong> Trung bình số phòng được đặt THÊM trong 7 ngày qua cho mỗi stay date.
                                </p>
                                <p className="text-sm text-amber-600 mt-2">
                                    <strong>💡 Insight:</strong> Pickup cao = demand đang tăng → có thể tăng giá.
                                </p>
                            </div>

                            <div className="bg-amber-50 p-4 rounded-xl border-l-4 border-amber-500">
                                <div className="text-amber-700 font-medium mb-2">🎯 Forecast Demand</div>
                                <p className="text-sm text-gray-700">
                                    <strong>Ý nghĩa:</strong> Dự báo số phòng SẼ được đặt thêm trong tương lai.
                                </p>
                                <p className="text-sm text-amber-600 mt-2">
                                    <strong>💡 Insight:</strong> Nếu Forecast Demand lớn và Remaining Supply nhỏ → sẽ hết phòng → nên TĂNG GIÁ ngay.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2.2 Chart */}
                    <div id="bieu-do" className="border-t border-gray-200 pt-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">2.2. Biểu đồ OTB theo ngày</h3>

                        <div className="text-sm text-gray-700 space-y-3">
                            <p>
                                Biểu đồ hiển thị số phòng đã đặt (OTB) cho mỗi ngày trong tương lai:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong>Trục ngang (X):</strong> Các ngày lưu trú từ hôm nay đến 30 ngày tới</li>
                                <li><strong>Trục dọc (Y):</strong> Số phòng đã được đặt cho ngày đó</li>
                                <li><strong>Cột cao (màu xanh):</strong> Ngày có nhiều booking → Demand cao</li>
                                <li><strong>Cột thấp:</strong> Ngày ít booking → Cần promotion</li>
                            </ul>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4">
                                <p className="text-amber-700">
                                    <strong>💡 Mẹo:</strong> Chú ý các ngày cuối tuần thường có demand cao hơn ngày thường.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2.3 Recommendations Table */}
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
                                    <tr className="border-t border-gray-100">
                                        <td className="px-3 py-3 font-medium">Remaining</td>
                                        <td className="px-3 py-3">Số phòng còn trống = Capacity − OTB.</td>
                                    </tr>
                                    <tr className="border-t border-gray-100">
                                        <td className="px-3 py-3 font-medium">Fcst (Forecast)</td>
                                        <td className="px-3 py-3">Dự báo số phòng sẽ được đặt thêm.</td>
                                    </tr>
                                    <tr className="border-t border-gray-100">
                                        <td className="px-3 py-3 font-medium">Current (ADR)</td>
                                        <td className="px-3 py-3">Giá phòng trung bình hiện tại.</td>
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
                        3. Import dữ liệu đặt phòng
                    </h2>

                    <div className="text-gray-700 space-y-4">
                        <p>
                            Để hệ thống hoạt động, bạn cần import dữ liệu đặt phòng từ PMS.
                        </p>

                        {/* Steps */}
                        <div className="border-t border-gray-200 pt-4">
                            <h4 className="font-medium text-gray-900 mb-3">📝 Các bước thực hiện:</h4>
                            <ol className="list-decimal list-inside space-y-2 ml-4 text-gray-600">
                                <li>Export báo cáo &quot;Reservation Booked On Date&quot; từ PMS</li>
                                <li>Lưu file dạng CSV hoặc XML (Crystal Reports)</li>
                                <li>Vào menu <strong>Upload</strong> → Kéo thả file vào</li>
                                <li>Chờ hệ thống xử lý (vài giây)</li>
                                <li>Vào <strong>Data Inspector</strong> → Nhấn các nút theo thứ tự: <br />
                                    <span className="text-blue-600">Build OTB</span> → <span className="text-purple-600">Build Features</span> → <span className="text-amber-600">Run Forecast</span>
                                </li>
                            </ol>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-4">
                            <p className="text-blue-700 text-sm">
                                <strong>📌 Tần suất:</strong> Nên import mỗi ngày vào buổi sáng để có dữ liệu mới nhất.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 4: Data Inspector */}
                <section id="data-inspector" className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        4. Data Inspector - Kiểm tra dữ liệu
                    </h2>

                    <div className="text-gray-700 space-y-4">
                        <p>
                            Trang này giúp bạn kiểm tra dữ liệu đã import và chạy các pipeline xử lý.
                        </p>

                        <div className="space-y-3">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">1. Build OTB</span>
                                <p className="text-sm text-blue-700 mt-2">
                                    Tính <strong>rooms_otb</strong> và <strong>revenue_otb</strong> từ reservations.
                                </p>
                            </div>

                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                                <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">2. Build Features</span>
                                <p className="text-sm text-purple-700 mt-2">
                                    Tính <strong>pickup_t7</strong>, <strong>pace_vs_ly</strong> từ OTB snapshots.
                                </p>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                <span className="bg-amber-600 text-white px-2 py-1 rounded text-xs font-medium">3. Run Forecast</span>
                                <p className="text-sm text-amber-700 mt-2">
                                    Tính <strong>remaining_demand</strong> dự báo.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-100 rounded-xl p-4 mt-4">
                            <p className="text-sm text-gray-700">
                                <strong>💡 Quy trình chuẩn:</strong> Upload → Build OTB → Build Features → Run Forecast → Dashboard
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 5: Settings */}
                <section id="settings" className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-blue-600" />
                        5. Cài đặt khách sạn
                    </h2>

                    <div className="text-gray-700 space-y-4">
                        <p>
                            Nhập thông tin khách sạn để hệ thống tính toán chính xác:
                        </p>

                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Tên khách sạn:</strong> Hiển thị trên báo cáo</li>
                            <li><strong>Số phòng (Capacity):</strong> QUAN TRỌNG! Dùng để tính Occupancy</li>
                            <li><strong>Đơn vị tiền tệ:</strong> VND, USD, EUR</li>
                            <li><strong>Giá cơ bản:</strong> Giá mặc định khi chưa có dữ liệu</li>
                            <li><strong>Giá sàn/trần:</strong> Giới hạn giá để hệ thống đề xuất</li>
                        </ul>
                    </div>
                </section>

                {/* Section 6: Terminology */}
                <section id="thuat-ngu" className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        6. Thuật ngữ chuyên ngành
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-600">Thuật ngữ</th>
                                    <th className="px-3 py-2 text-left text-gray-600">Tiếng Việt</th>
                                    <th className="px-3 py-2 text-left text-gray-600">Giải thích</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3 font-mono text-blue-600">OTB</td>
                                    <td className="px-3 py-3">On The Books</td>
                                    <td className="px-3 py-3">Số phòng/doanh thu đã được đặt</td>
                                </tr>
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3 font-mono text-blue-600">ADR</td>
                                    <td className="px-3 py-3">Giá phòng trung bình</td>
                                    <td className="px-3 py-3">Average Daily Rate = Doanh thu ÷ Số phòng</td>
                                </tr>
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3 font-mono text-blue-600">RevPAR</td>
                                    <td className="px-3 py-3">Doanh thu/phòng khả dụng</td>
                                    <td className="px-3 py-3">Revenue Per Available Room</td>
                                </tr>
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3 font-mono text-blue-600">Occupancy</td>
                                    <td className="px-3 py-3">Tỷ lệ lấp đầy</td>
                                    <td className="px-3 py-3">% phòng được bán</td>
                                </tr>
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3 font-mono text-blue-600">Pickup</td>
                                    <td className="px-3 py-3">Lượng booking mới</td>
                                    <td className="px-3 py-3">Số phòng đặt thêm trong khoảng thời gian</td>
                                </tr>
                                <tr className="border-t border-gray-100">
                                    <td className="px-3 py-3 font-mono text-blue-600">Pace</td>
                                    <td className="px-3 py-3">Tốc độ đặt phòng</td>
                                    <td className="px-3 py-3">So sánh OTB với cùng kỳ năm trước</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Footer */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                    <p className="text-blue-700 mb-3">
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
        </div>
    );
}
