/**
 * Phase 02B - Batch 3-4: Dashboard + Guide sub-components + Admin + Payments
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');
const fileMap = {
    'components/dashboard/AnalyticsPanel.tsx': [],
    'components/dashboard/RecommendationTable.tsx': [],
    'components/dashboard/InsightsPanel.tsx': [],
    'components/dashboard/OtbChart.tsx': [],
    'components/dashboard/DashboardToolbarCard.tsx': [],
    'components/dashboard/TopAccountsTable.tsx': [],
    'components/dashboard/AccountDetailModal.tsx': [],
    'components/dashboard/DashboardTabs.tsx': [],
    'components/dashboard/RoomLosMixPanel.tsx': [],
    'components/dashboard/QuickModePanel.tsx': [],
    'components/guide/BookingChecklist.tsx': [],
    'components/guide/AgodaChecklist.tsx': [],
    'components/guide/WhenToBoost.tsx': [],
    'components/guide/ScorecardInputModal.tsx': [],
    'components/admin/PLGAdminDashboard.tsx': [],
    'components/admin/PricingTab.tsx': [],
    'components/payments/PaymentMethodModal.tsx': [],
    'components/payments/PayPalCheckout.tsx': [],
};

// Global replacements applied to ALL files
const globalReplacements = [
    // Common UI patterns
    [`>Thao tác</th>`, `>Actions</th>`],
    [`>Trạng thái</th`, `>Status</th`],
    [`>Hủy<`, `>Cancel<`],
    [`>Lưu<`, `>Save<`],
    [`>Đóng<`, `>Close<`],
    [`>Quay lại<`, `>Go Back<`],
    [`Đang tải`, `Loading`],

    // ═══ Dashboard Components ═══
    // AnalyticsPanel
    [`Chế độ xem:`, `View Mode:`],
    [`Duyệt nhanh`, `Quick Review`],
    [`Chi tiết`, `Detailed`],
    [`Chưa có dữ liệu OTB`, `No OTB data available`],
    [`Hãy upload dữ liệu và chạy Build OTB`, `Please upload data and run Build OTB`],
    [`Chưa có gì`, `Nothing yet`],
    [`Chưa có dữ liệu để hiển thị`, `No data to display`],
    [`Upload dữ liệu để bắt đầu`, `Upload data to get started`],
    [`Phòng đã đặt`, `Rooms Booked`],
    [`Phòng còn trống`, `Rooms Available`],
    [`Pickup 7 ngày`, `7-Day Pickup`],
    [`so với hôm qua`, `vs yesterday`],
    [`Doanh thu OTB`, `OTB Revenue`],
    [`Giá TB`, `Avg Rate`],
    [`Lọc theo:`, `Filter by:`],
    [`Tất cả`, `All`],
    [`Hôm nay`, `Today`],
    [`Tuần này`, `This Week`],
    [`Tháng này`, `This Month`],
    [`Đang xử lý...`, `Processing...`],
    [`ngày`, `days`],
    [`phòng`, `rooms`],

    // RecommendationTable
    [`Bảng Giá Khuyến nghị`, `Price Recommendation Table`],
    [`Ngày lưu trú`, `Stay Date`],
    [`Giá hiện tại`, `Current Price`],
    [`Giá đề xuất`, `Recommended Price`],
    [`Hành động`, `Action`],
    [`Lý do`, `Reason`],
    [`Duyệt`, `Approve`],
    [`Đã duyệt`, `Approved`],
    [`Override`, `Override`],
    [`nhập giá của bạn`, `enter your price`],
    [`Giữ giá`, `Keep Price`],
    [`Tăng giá`, `Increase`],
    [`Giảm giá`, `Decrease`],
    [`Ngừng bán`, `Stop Selling`],
    [`Đề xuất`, `Suggested`],
    [`Anchor`, `Anchor`],
    [`Chưa có dữ liệu khuyến nghị`, `No recommendation data`],
    [`Duyệt tất cả`, `Approve All`],
    [`đã duyệt`, `approved`],
    [`Giá khách thấy`, `Guest Price`],

    // InsightsPanel
    [`Phân tích Insights`, `Insights Analysis`],
    [`Đang tải insights...`, `Loading insights...`],
    [`Chưa có insights`, `No insights available`],
    [`Xem thêm`, `See More`],
    [`Thu gọn`, `Collapse`],
    [`Cần làm:`, `Action Needed:`],
    [`Tại sao:`, `Why:`],
    [`Tác động:`, `Impact:`],
    [`Ưu tiên`, `Priority`],
    [`Cao`, `High`],
    [`Trung bình`, `Medium`],
    [`Thấp`, `Low`],

    // OtbChart
    [`Biểu đồ OTB`, `OTB Chart`],
    [`Phòng đặt`, `Rooms Booked`],
    [`Năm nay`, `This Year`],
    [`Năm trước`, `Last Year`],
    [`Dự báo`, `Forecast`],
    [`Còn phòng`, `Available`],

    // DashboardToolbarCard
    [`Tổng quan`, `Overview`],
    [`Cập nhật lúc`, `Updated at`],
    [`Làm mới`, `Refresh`],

    // TopAccountsTable
    [`Top tài khoản`, `Top Accounts`],
    [`Tên khách`, `Guest Name`],
    [`Số đêm`, `Nights`],

    // AccountDetailModal
    [`Chi tiết tài khoản`, `Account Details`],
    [`Lịch sử đặt phòng`, `Booking History`],
    [`Tổng chi tiêu`, `Total Spending`],
    [`Lần cuối`, `Last Visit`],

    // DashboardTabs
    [`Giá & Quyết định`, `Price & Decisions`],
    [`Phân tích`, `Analytics`],

    // RoomLosMixPanel
    [`Phân bố hạng phòng`, `Room Type Distribution`],
    [`Phân bố thời gian lưu trú`, `Length of Stay Distribution`],

    // QuickModePanel - likely 1 string
    [`Chế độ nhanh`, `Quick Mode`],

    // ═══ Guide Sub-Components ═══
    // BookingChecklist
    [`Booking.com xếp hạng dựa trên 3 trụ cột: CTR, Gross Bookings, và Net Bookings.`, `Booking.com ranks based on 3 pillars: CTR, Gross Bookings, and Net Bookings.`],
    [`Mỗi item trong checklist cho biết nó ảnh hưởng phần nào của funnel.`, `Each checklist item shows which part of the funnel it impacts.`],
    [`>Tiến độ thực hiện</span>`, `>Implementation Progress</span>`],
    [`<strong>→→ Cách làm:</strong>`, `<strong>→→ How to:</strong>`],
    [`>Nguồn: `, `>Source: `],
    [`<strong>Về &quot;Ad&quot; label:</strong>`, `<strong>About &quot;Ad&quot; label:</strong>`],
    [`Một số kết quả tìm kiếm trên Booking.com có gắn nhãn &quot;Ad&quot; - đây là `, `Some search results on Booking.com have an &quot;Ad&quot; label - this is `],
    [`Nếu thấy đối thủ nổi bật thường, có thể họ đang dùng paid placement.`, `If a competitor consistently appears prominent, they may be using paid placement.`],
    [`Nguồn: Booking.com &quot;How we work&quot; - Paid placements are labeled.`, `Source: Booking.com &quot;How we work&quot; - Paid placements are labeled.`],

    // AgodaChecklist
    [`Dữ liệu từ Agoda Partner Hub (YCS).`, `Data from Agoda Partner Hub (YCS).`],
    [`Dữ liệu từ Agoda Partner Hub (BA-verified). Trang gốc trả về 403.`, `Data from Agoda Partner Hub (BA-verified). Original page returns 403.`],
    [`Con số này là benchmark trung bình - ước tính, không đảm bảo kết quả cho từng khách sạn.`, `These numbers are average benchmarks - estimates, not guarantees for individual hotels.`],
    [`AGP yêu cầu tham gia tối thiểu 90 ngày (mandatory). Cân nhắc kỹ trước khi đăng ký.`, `AGP requires minimum 90-day participation (mandatory). Consider carefully before enrolling.`],
    [`'→→ Content Score (Điểm nội dung)'`, `'→→ Content Score'`],
    [`'Ảnh property chất lượng cao (45% trọng số)'`, `'High-quality Property Photos (45% weight)'`],
    [`'Ảnh phòng cho mỗi room type (25% trọng số)'`, `'Room Photos for Each Type (25% weight)'`],
    [`'Mô tả & Translation (20% trọng số)'`, `'Description & Translation (20% weight)'`],
    [`'Tiện nghi đầy đủ (10% trọng số)'`, `'Complete Amenities (10% weight)'`],
    [`'→ Đánh giá khách hàng'`, `'→ Guest Reviews'`],
    [`'Duy trì Review Score ≥8.0'`, `'Maintain Review Score ≥8.0'`],
    [`'Trả lời ≥80% đánh giá'`, `'Reply to ≥80% of Reviews'`],
    [`'→→ Giá & Tính khả dụng'`, `'→→ Price & Availability'`],
    [`'Giá cạnh tranh (Rate Intelligence)'`, `'Competitive Pricing (Rate Intelligence)'`],
    [`'Mở bán ≥12 tháng & đủ room types'`, `'Availability ≥12 months & all room types'`],
    [`'→→ Chương trình Agoda'`, `'→→ Agoda Programs'`],
    [`>Ảnh Property</div>`, `>Property Photos</div>`],
    [`>Ảnh Room</div>`, `>Room Photos</div>`],
    [`>Mô tả</div>`, `>Description</div>`],
    [`>Tiện nghi</div>`, `>Amenities</div>`],

    // WhenToBoost
    [`'Occupancy thấp (< 50%) trong 7-14 ngày tới'`, `'Low Occupancy (< 50%) in next 7-14 days'`],
    [`'Bật Visibility Booster (Booking) hoặc AGP (Agoda) cho các ngày gap.'`, `'Enable Visibility Booster (Booking) or AGP (Agoda) for gap dates.'`],
    [`'Đối thủ giảm giá mạnh (Rate Shopper alert)'`, `'Competitor aggressive pricing (Rate Shopper alert)'`],
    [`'Cân nhắc Mobile Rate hoặc Last-Minute Deal thay vì giảm giá trực tiếp.'`, `'Consider Mobile Rate or Last-Minute Deal instead of direct price reduction.'`],
    [`'Mùa thấp điểm sắp tới'`, `'Upcoming Low Season'`],
    [`'Tham gia Genius Program (Booking) để tiếp cận segment \"Genius travelers\" có sẵn demand.'`, `'Join Genius Program (Booking) to reach the "Genius travelers" segment with existing demand.'`],
    [`'Property mới / Review Score thấp'`, `'New Property / Low Review Score'`],
    [`'Ưu tiên Preferred Partner (badge uy tín) + trả lời 100% reviews + push giá cạnh tranh.'`, `'Prioritize Preferred Partner (trust badge) + reply to 100% reviews + push competitive pricing.'`],
    [`'Thêm Non-Refundable rate plan với giá thấp hơn 10-15% để giữ Net Bookings.'`, `'Add Non-Refundable rate plan 10-15% lower to protect Net Bookings.'`],
    [`'Hiệu suất tốt, muốn đẩy thêm'`, `'Good Performance, Want to Push More'`],
    [`'Double-down: tăng Visibility Booster commission hoặc join thêm campaign Agoda.'`, `'Double-down: increase Visibility Booster commission or join more Agoda campaigns.'`],
    [`Khi nào nên Đẩy mạnh Tăng Ranking?`, `When Should You Boost Ranking?`],
    [`Nguyên tắc tăng Ranking hiệu quả dựa trên tình huống thực tế`, `Effective ranking boost principles based on real scenarios`],
    [`Ghi lại quyết định Boost để theo dõi & rút kinh nghiệm`, `Record Boost decisions for tracking & learning`],
    [`>Ghi nhận<`, `>Record<`],
    [`>Kênh</label>`, `>Channel</label>`],
    [`>Chương trình</label>`, `>Program</label>`],
    [`>Lý do quyết định</label>`, `>Decision Reason</label>`],
    [`placeholder="Occupancy thấp tháng 3, gap dates..."`, `placeholder="Low occupancy March, gap dates..."`],
    [`>Uplift kỳ vọng (%)</label>`, `>Expected Uplift (%)</label>`],
    [`>Lưu`, `>Save`],
    [`>Hủy`, `>Cancel`],
    [`Chưa có quyết định nào. Nhấn &quot;Ghi nhận&quot; để bắt đầu.`, `No decisions recorded yet. Click &quot;Record&quot; to start.`],
    [` quyết định đang active`, ` active decisions`],
    [`Kỳ vọng +`, `Expected +`],

    // ScorecardInputModal
    [`Cập nhật chỉ số OTA Health`, `Update OTA Health Metrics`],
    [`Nhập dữ liệu từ Extranet/YCS báo cáo tháng trước.`, `Enter data from last month's Extranet/YCS report.`],
    [`Mẹo: Booking.com Analytics Dashboard & Agoda Production Report.`, `Tip: Booking.com Analytics Dashboard & Agoda Production Report.`],
    [`>Hủy bỏ<`, `>Cancel<`],
    [`>Lưu chỉ số<`, `>Save Metrics<`],

    // ═══ Admin Components ═══
    // PLGAdminDashboard
    [`>Cách tính:</div>`, `>How it's calculated:</div>`],
    [`→→ Tab này hiện tại:</strong>`, `→→ This tab currently:</strong>`],
    [` Hiển thị lịch sử tất cả giao dịch hoa hồng.`, ` Shows history of all commission transactions.`],
    [`'Cung cấp tên, email → Nhận Ref Code tự động'`, `'Provide name, email → Get auto-generated Ref Code'`],
    [`'Loại RESELLER, gắn vào reseller vừa t`, `'Type RESELLER, link to the reseller just t`],
    [`'Hotel nhập mã khi đăng ký → Tự động attribution'`, `'Hotel enters code at signup → Auto attribution'`],
    [`'Hệ thống ghi nhận redemption, tính discount'`, `'System records redemption, calculates discount'`],
    [`'Khi hotel thanh toán → Commission cho resel`, `'When hotel pays → Commission for resel`],
    [`→→ <strong>Xóa = Soft Delete:</strong>`, `→→ <strong>Delete = Soft Delete:</strong>`],
    [`→→ <strong>Ref Code không đổi:</strong>`, `→→ <strong>Ref Code is permanent:</strong>`],
    [`→→ <strong>Audit logging:</strong>`, `→→ <strong>Audit logging:</strong>`],
    [`→ <strong>Quyền Admin:</strong>`, `→ <strong>Admin Access:</strong>`],

    // PricingTab
    [`'1-30 phòng'`, `'1-30 rooms'`],
    [`'31-80 phòng'`, `'31-80 rooms'`],
    [`'81-150 phòng'`, `'81-150 rooms'`],
    [`Chỉnh sửa`, `Edit`],
    [`Thêm mới`, `Add New`],
    [`>Gói</label>`, `>Plan</label>`],
    [`>Chọn gói</option>`, `>Select Plan</option>`],
    [`>Giá (VND/tháng)</label>`, `>Price (VND/month)</label>`],
    [`>Band phòng</label>`, `>Room Band</label>`],
    [`>Chọn band</option>`, `>Select Band</option>`],
    [`>Kỳ hạn</label>`, `>Term</label>`],
    [`>Chọn kỳ hạn</option>`, `>Select Term</option>`],
    [` tháng</option>`, ` months</option>`],
    [`>Giảm giá (%)</label>`, `>Discount (%)</label>`],
    [`>Hiệu lực từ</label>`, `>Effective From</label>`],
    [`>Đến (trống = vĩnh viễn)</label>`, `>To (empty = permanent)</label>`],
    [`>Nhãn / Ghi chú</label>`, `>Label / Notes</label>`],
    [`placeholder="VD: Khuyến mại Q1"`, `placeholder="E.g.: Q1 Promotion"`],
    [`> Hủy`, `> Cancel`],
    [`'Đang lưu...'`, `'Saving...'`],
    [`'Cập nhật'`, `'Update'`],
    [`'Tạo mới'`, `'Create'`],
    [` tháng</span>`, ` months</span>`],
    [`' ∞ Vĩnh viễn'`, `' ∞ Permanent'`],
    [`title="Chỉnh sửa"`, `title="Edit"`],
    [`title="Hủy kích hoạt"`, `title="Deactivate"`],
    [`'Gói'`, `'Plan'`],
    [`'Giá/tháng'`, `'Price/month'`],
    [`'Hiệu lực'`, `'Effective'`],
    [`'Band'`, `'Band'`],
    [`'Hệ số'`, `'Multiplier'`],
    [`'Kỳ hạn'`, `'Term'`],
    [`>Thêm mới<`, `>Add New<`],
    [`Chưa có config nào`, `No config yet`],
    [`Tính giá thực tế theo cấu hình hiện tại`, `Calculate actual price based on current config`],
    [`Đang tính toán...`, `Calculating...`],
    [`Khách trả / tháng`, `Customer pays / month`],
    [`Giảm `, `Discount `],
    [`% so với monthly`, `% compared to monthly`],
    [`Giá gốc monthly: `, `Monthly base price: `],
    [`'Hủy kích hoạt config này? (effective_to = now)'`, `'Deactivate this config? (effective_to = now)'`],
    [`'Seed thất bại'`, `'Seed failed'`],
    [`Đang tải cấu hình giá...`, `Loading pricing config...`],
    [`'Đang seed...'`, `'Seeding...'`],
    [`subtitle="Giá gốc theo gói"`, `subtitle="Base Price by Plan"`],
    [`subtitle="Hệ số nhân theo quy mô phòng"`, `subtitle="Multiplier by Room Band"`],
    [`subtitle="Chiết khấu theo kỳ hạn cam kết"`, `subtitle="Discount by Commitment Term"`],

    // ═══ Payments ═══
    // PaymentMethodModal
    [`'Thanh toán thất bại'`, `'Payment failed'`],
    [`'Có lỗi xảy ra'`, `'An error occurred'`],
    [`Nâng cấp gói `, `Upgrade to `],
    [`Chuyển khoản ngân hàng qua QR`, `Bank transfer via QR`],
    [`'tháng (x3)'`, `'month (x3)'`],
    [`'tháng'`, `'month'`],
    [`'Thanh toán 1 lần bằng USD'`, `'One-time payment in USD'`],
    [`'Thanh toán định kỳ bằng USD'`, `'Recurring payment in USD'`],
    [`'Subscription hàng tháng'`, `'Monthly subscription'`],
    [`>Liên hệ Zalo</div>`, `>Contact via Zalo</div>`],
    [`>Tư vấn trước khi đăng ký/nâng cấp</div>`, `>Get advice before subscribing/upgrading</div>`],
    [`>Đang tạo đơn thanh toán...</p>`, `>Creating payment order...</p>`],
    [`>Đơn hàng đã tạo!</h3>`, `>Order Created!</h3>`],
    [`>Quét QR để thanh toán</p>`, `>Scan QR to pay</p>`],
    [`Số tiền: `, `Amount: `],
    [`Mã đơn: `, `Order ID: `],
    [`→→ Đơn hàng sẽ hết hạn sau 30 phút. Sau khi chuyển khoản, hệ thống sẽ tự động kích hoạt gói.`, `→→ Order expires in 30 minutes. After transfer, the system will auto-activate your plan.`],
    [`>Thanh toán thành công!</h3>`, `>Payment Successful!</h3>`],
    [`>Gói dịch vụ đã được kích hoạt</p>`, `>Your service plan has been activated</p>`],
    [`>Hoàn tất<`, `>Complete<`],
    [`> Quay lại<`, `> Go Back<`],
    [`>✗ Có lỗi xảy ra</p>`, `>✗ An error occurred</p>`],
    [`>Thử lại<`, `>Retry<`],

    // PayPalCheckout
    [`'Không nhận được link thanh toán từ PayPal'`, `'Did not receive payment link from PayPal'`],
    [`'PayPal Plan ID chưa được cấu hình. Vui lòng liên hệ admin.'`, `'PayPal Plan ID not configured. Please contact admin.'`],
    [`'PayPal subscription integration đang được hoàn thiện. '`, `'PayPal subscription integration is being finalized. '`],
    [`'Vui lòng liên hệ admin hoặc sử dụng chế độ thanh toán 1 lần.'`, `'Please contact admin or use one-time payment mode.'`],
    [`'Đang tạo đơn PayPal...'`, `'Creating PayPal order...'`],
    [`'Đang kết nối PayPal...'`, `'Connecting to PayPal...'`],
    [`'→→ Thanh toán 1 lần qua PayPal. Bạn sẽ được chuyển đến PayPal để xác nhận.'`, `'→→ One-time payment via PayPal. You will be redirected to PayPal for confirmation.'`],
    [`'→→ Đăng ký thanh toán tự động hàng tháng qua PayPal.'`, `'→→ Auto-recurring monthly payment via PayPal.'`],
    [`'Thanh toán qua PayPal'`, `'Pay via PayPal'`],
    [`'Đăng ký PayPal'`, `'Subscribe via PayPal'`],
    [`'Thanh toán 1 lần. Bạn sẽ được chuyển đến trang PayPal.'`, `'One-time payment. You will be redirected to PayPal.'`],
    [`'Thanh toán định kỳ hàng tháng qua PayPal. Có thể hủy bất cứ lúc nào.'`, `'Monthly recurring payment via PayPal. Cancel anytime.'`],
];

// ── Run ──
let totalCount = 0;
for (const relPath of Object.keys(fileMap)) {
    const filePath = path.join(BASE, relPath);
    if (!fs.existsSync(filePath)) { console.log(`⚠️  ${relPath} not found`); continue; }
    let src = fs.readFileSync(filePath, 'utf8');
    let count = 0;
    for (const [from, to] of globalReplacements) {
        if (src.includes(from)) {
            const parts = src.split(from);
            count += parts.length - 1;
            src = parts.join(to);
        }
    }
    if (count > 0) {
        fs.writeFileSync(filePath, src, 'utf8');
        console.log(`✅ ${path.basename(relPath)}: ${count} replacements`);
        totalCount += count;
    } else {
        console.log(`   ${path.basename(relPath)}: 0 replacements (may need manual review)`);
    }
}
console.log(`\n🎯 Batch 3-4 Total: ${totalCount} replacements`);
