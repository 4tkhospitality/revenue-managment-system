/**
 * Phase 02B - FINAL pass 4: Remaining mixed VN/EN and untouched VN text
 */
const fs = require('fs');
const path = require('path');
const BASE = path.join(__dirname, '..');

function r(relPath, pairs) {
    const fp = path.join(BASE, relPath);
    if (!fs.existsSync(fp)) { console.log(`⚠️  ${relPath} not found`); return 0; }
    let src = fs.readFileSync(fp, 'utf8');
    let count = 0;
    for (const [from, to] of pairs) {
        if (src.includes(from)) {
            const n = src.split(from).length - 1;
            src = src.split(from).join(to);
            count += n;
        }
    }
    if (count > 0) fs.writeFileSync(fp, src, 'utf8');
    return count;
}

let total = 0;

// ═══════════════════════════════════════════════════════
// PLGAdminDashboard.tsx (30 remaining)
// ═══════════════════════════════════════════════════════
total += r('components/admin/PLGAdminDashboard.tsx', [
    // Line 599
    ['PLG (Product-Led Growth) là hệ thống quản lý reseller (Resellers), mã khuyến mãi (Promo Codes),', 'PLG (Product-Led Growth) is the system for managing Resellers, Promo Codes,'],
    // Line 617 - mixed
    ['💾 Lưu', '💾 Save'],
    // Line 621
    ['Click vào badge', 'Click the badge'],
    ['để toggle.', 'to toggle.'],
    // Line 627
    ['Save ý: Không xóa hẳn khỏi DB để bảo toàn lịch sử attribution và commissions.', 'Note: Not fully deleted from DB to preserve attribution and commission history.'],
    // Line 631
    ['💡 Mẹo:', '💡 Tip:'],
    // Line 632
    ['Cột <strong>Hotels</strong> cho biết reseller đang quản lý bao nhiêu hotel. Cột <strong>Promos</strong> cho biết số mã khuyến mãi liên kết.', 'The <strong>Hotels</strong> column shows how many hotels a reseller manages. The <strong>Promos</strong> column shows linked promo codes.'],
    // Line 640
    ['<strong>Promo Code là gì?</strong> Là mã discount cho khách hàng khi đăng ký/nâng cấp gói dịch vụ.', '<strong>What is a Promo Code?</strong> A discount code for customers when signing up or upgrading plans.'],
    // Line 641
    ['Có 3 loại mã:', 'There are 3 types:'],
    // Line 646
    ['Dùng chung cho tất cả', 'Shared for all users'],
    // Line 650
    ['Gắn với reseller cụ thể', 'Linked to specific reseller'],
    // Line 654
    ['Chiến dịch marketing', 'Marketing campaign'],
    // Line 658
    ['Create mã mới', 'Create new code'],
    // Line 659
    ['+ Create Mã', '+ Create Code'],
    ['Điền:', 'Fill in:'],
    // Line 660
    ['<strong>Mã Code</strong>: VD', '<strong>Code</strong>: e.g.'],
    ['(tự động viết hoa)', '(auto-uppercased)'],
    // Line 661
    ['<strong>Loại</strong>:', '<strong>Type</strong>:'],
    // Line 662
    ['Phần trăm discount (1-100)', 'Discount percentage (1-100)'],
    // Line 663
    ['<strong>Giới hạn sử dụng</strong>: Tối đa bao nhiêu lần dùng (bỏ trống = không giới hạn)', '<strong>Usage Limit</strong>: Max number of uses (empty = unlimited)'],
    // Line 664
    ['<strong>Hết hạn</strong>: Ngày hết hạn (bỏ trống = không hết hạn)', '<strong>Expiry</strong>: Expiry date (empty = no expiry)'],
    // Line 667
    ['Bật/Tắt mã', 'Toggle code status'],
    // Line 668
    ['để toggle. Mã inactive không thể sử dụng nhưng vẫn được giữ lại.', 'to toggle. Inactive codes cannot be used but are preserved.'],
    // Line 671
    ['Vô hiệu hóa mã', 'Deactivate code'],
    // Line 672
    ['Mã chuyển thành Inactive.', 'Code changes to Inactive.'],
    // Line 676
    ['💡 Quy tắc', '💡 Rule of'],
    // Line 677
    ['Khi hotel có nhiều mã discount, hệ thống tự chọn mã có discount CAO NHẤT. Priority: Campaign', 'When a hotel has multiple discount codes, the system picks the HIGHEST discount. Priority: Campaign'],
    // Line 685
    ['<strong>Commission là gì?</strong> Là commission trả cho reseller khi hotel họ giới thiệu thanh toán phí dịch vụ.', '<strong>What is Commission?</strong> Commission paid to resellers when referred hotels pay service fees.'],
    // Line 686
    ['Hoa hồng được tính tự động theo <strong>tỉ lệ %</strong> (commission rate) trong hợp đồng reseller.', 'Commission is auto-calculated based on <strong>% rate</strong> (commission rate) in the reseller agreement.'],
    // Line 692
    ['Commission = Doanh thu', 'Commission = Revenue'],
    // Line 702
    ['Including loại, tỉ lệ, số tiền, mô tả, và days tạo.', 'Including type, rate, amount, description, and creation date.'],
    // Line 712
    ['the reseller just tạo', 'the reseller just created'],
    // Line 741
    ['and dữ liệu attribution.', 'and attribution data.'],
    // Line 747
    ['Mọi thao tác (tạo, sửa, xóa) đều được ghi nhận vào audit log để truy vết.', 'All actions (create, edit, delete) are recorded in the audit log for traceability.'],
]);

// ═══════════════════════════════════════════════════════
// upload/page.tsx (22 remaining)  
// ═══════════════════════════════════════════════════════
total += r('app/upload/page.tsx', [
    // Line 74
    ['Import báo cáo đặt rooms & hủy rooms', 'Import booking & cancellation reports'],
    // Line 256 - mixed
    ['Import room booking reports from PMS - hỗ trợ upload', 'Import room booking reports from PMS - supports uploading'],
    // Line 307
    ['Báo cáo Hủy rooms', 'Cancellation Reports'],
    // Line 319
    ["Upload báo cáo \"Reservation Booked On Date\" từ PMS. Chọn multiple files at once (Ctrl+Click hoặc kéo thả).", "Upload \"Reservation Booked On Date\" reports from PMS. Select multiple files (Ctrl+Click or drag & drop)."],
    // Line 320
    ["Upload báo cáo \"Reservation Cancelled\" từ PMS. Chọn multiple files at once.", "Upload \"Reservation Cancelled\" reports from PMS. Select multiple files."],
    // Line 353
    ['Upload bị tắt cho Demo Hotel', 'Upload disabled for Demo Hotel'],
    // Line 354
    ['Liên hệ admin để được gán hotels', 'Contact admin to be assigned a hotel'],
    // Line 362
    ['Drag & drop file CSV, XML hoặc Excel vào đây', 'Drag & drop CSV, XML, or Excel files here'],
    // Line 365
    ['Supported chọn <strong>nhiều file</strong> cùng lúc (tối đa 31 file/lần)', 'Supports selecting <strong>multiple files</strong> at once (max 31 files/batch)'],
    // Line 374
    ['Select file (có thể chọn nhiều)', 'Select files (multi-select available)'],
    // Line 383
    ['Tải file mẫu Excel', 'Download sample Excel file'],
    ['(Đặt rooms)', '(Bookings)'],
    ['(Hủy rooms)', '(Cancellations)'],
    // Line 387
    ['File mẫu có 7 cột: Mã, Ngày đặt, Check-in, Check-out, Phòng, Doanh thu, Status', 'Sample has 7 columns: Code, Booking Date, Check-in, Check-out, Room, Revenue, Status'],
    // Line 388
    ['File mẫu có 8 cột: bao gồm cột Ngày hủy (bắt buộc)', 'Sample has 8 columns: includes Cancel Date column (required)'],
    // Line 405
    ['Hoàn tất', 'Completed'],
    // Line 415
    ['lỗi', 'errors'],
    // Line 419
    ['Tổng:', 'Total:'],
    // Line 464
    ['Chờ...', 'Wait...'],
    // Line 492
    ['Upload thêm file', 'Upload more files'],
    // Line 515
    ['Export từ PMS với format Crystal Reports XML.', 'Export from PMS in Crystal Reports XML format.'],
    // Line 532
    ['File CSV với các cột:', 'CSV file with columns:'],
    // Line 546
    ['<strong><Lightbulb className="w-4 h-4 inline mr-0.5" />Mẹo:</strong>', '<strong><Lightbulb className="w-4 h-4 inline mr-0.5" />Tip:</strong>'],
    ['Dùng Ctrl+A (chọn tất cả) hoặc Ctrl+Click để chọn multiple files at once.', 'Use Ctrl+A (select all) or Ctrl+Click to select multiple files at once.'],
    // Line 547
    ['Hệ thống sẽ tự động import từng file theo thứ tự.', 'System will automatically import each file in order.'],
]);

// ═══════════════════════════════════════════════════════
// PromotionsTab.tsx (19 remaining)
// ═══════════════════════════════════════════════════════
total += r('components/pricing/PromotionsTab.tsx', [
    // Line 144
    ['Thêm khuyến mại', 'Add Promotion'],
    ['khuyến mại', 'promotion'],
    ['Khuyến mại', 'Promotion'],
    // Line 314
    ['Chọn chương trình khuyến mại từ danh mục có sẵn', 'Select a promotion from the available catalog'],
    // Line 409
    ['>Thêm<', '>Add<'],
    // Line 898
    ['Giá trước khuyến mại', 'Price before promotions'],
    // Line 1478
    ['Thêm khuyến mại từ catalog', 'Add promotion from catalog'],
    // Line 1492
    ['Agoda tự động bật additive cho khuyến mại Cơ bản', 'Agoda auto-enables additive for Basic promotions'],
    // Line 1494
    ['Khi tạo khuyến mại Cơ bản trên Agoda, nút', 'When creating Basic promotions on Agoda, the button'],
    ['Kết hợp với khuyến mại khác', 'Combine with other promotions'],
    ['mặc định <strong>BẬT</strong>.', 'is <strong>ON</strong> by default.'],
    // Line 1495
    ['Điều này khiến tất cả khuyến mại Cơ bản <strong>additive giảm giá</strong> lên nhau.', 'This causes all Basic promotions to <strong>stack discounts additively</strong>.'],
    // Line 1496
    ['Nếu không muốn, hãy tắt nút này trong trang quản lý Agoda cho từng khuyến mại.', "If not desired, disable this button in Agoda's management page for each promotion."],
    // Line 1507
    ['Campaign không additive với KM khác', 'Campaign does not stack with other promotions'],
    // Line 1509
    ['Khi Campaign đang bật, hệ thống sẽ <strong>automatically exclude</strong> các khuyến mại còn lại (Regular, Targeted, Package...).', 'When Campaign is active, the system will <strong>automatically exclude</strong> other promotions (Regular, Targeted, Package...).'],
    ['Tên khuyến mại', 'Promotion name'],
    ['Chưa có khuyến mại nào', 'No promotions yet'],
]);

// ═══════════════════════════════════════════════════════
// guide/page.tsx (14 remaining)
// ═══════════════════════════════════════════════════════
total += r('app/guide/page.tsx', [
    ['Số phòng còn trống có thể bán', 'Available rooms for sale'],
    ['Data Quality: có cảnh báo không?', 'Data Quality: any warnings?'],
    ['dư phòng', 'remaining rooms'],
    ['Open file CSV bằng Excel hoặc Google Sheets', 'Open CSV file in Excel or Google Sheets'],
    ['In ra cho team Front Desk hoặc gửi cho Sales Manager để cập nhật giá lên OTA.', 'Print for Front Desk team or send to Sales Manager to update OTA prices.'],
    ['Giá cơ bản, mùa thường', 'Base price, regular season'],
    ['Giá cao hơn, mùa cao điểm', 'Higher price, peak season'],
    ['Giá cao nhất, lễ/tết', 'Highest price, holidays'],
    ['giữ giá gốc', 'keep base price'],
    ['tăng giá mạnh hơn', 'increase price more'],
    ['giá cao nhất', 'highest price'],
    ['Luỹ tiến (mặc định)', 'Progressive (default)'],
    ['Cộng dồn', 'Additive'],
]);

// ═══════════════════════════════════════════════════════
// Smaller remaining files
// ═══════════════════════════════════════════════════════

// AnalyticsPanel.tsx (5)
total += r('components/dashboard/AnalyticsPanel.tsx', [
    ['Ví dụ:', 'E.g.:'],
    ['nghĩa là', 'means'],
    ['năm nay bán nhiều gấp rưỡi', '1.5x rooms sold this year'],
    ['mỗi days có thêm', 'each day has'],
    ['booking mới', 'new bookings'],
    ['Phần trăm days có dữ liệu để so sánh với cùng kỳ năm ngoái', 'Percent of days with data for STLY comparison'],
    ['tất cả days đều có data năm ngoái để so', 'all days have last year data to compare'],
    ['nghĩa là so với 7 days trước, days này có thêm 5 booking', 'means 5 more bookings vs 7 days ago for this date'],
    ['chưa đủ data lịch sử (need OTB snapshot 7 days trước)', 'insufficient historical data (need OTB snapshot from 7 days ago)'],
    ['Giống T-7 nhưng ngắn hơn hơn', 'Similar to T-7 but shorter'],
    ['demand đang tăng gần', 'demand increasing recently'],
    ['chưa đủ data (need OTB snapshot 3 days trước)', 'insufficient data (need OTB snapshot from 3 days ago)'],
    ['days tương ứng năm trước', 'corresponding dates last year'],
    ['for days đó = Tổng rooms - OTB', 'for those dates = Total rooms - OTB'],
]);

// AgodaChecklist.tsx (5)
total += r('components/guide/AgodaChecklist.tsx', [
    ['và cross-check với nội dung public', 'and cross-checked with public content'],
    ['tham gia tối thiểu 90 days', 'minimum 90-day participation'],
    ['không phải room', 'not rooms'],
    ['Mỗi room type cần ≥5 ảnh riêng (giường, rooms tắm, view, tiện nghi)', 'Each room type needs ≥5 unique photos (bed, bathroom, view, amenities)'],
    ['Description chi tiết bằng tiếng Anh', 'Detailed description in English'],
    ['Agoda tự dịch sang các ngôn ngữ khác', 'Agoda auto-translates to other languages'],
    ['từ tiếng Anh. Emphasize USP, vị trí, trải nghiệm đặc biệt', 'in English. Emphasize USP, location, unique experiences'],
    ['Tick đầy đủ tất cả tiện nghi có sẵn trong property', 'Tick all available amenities in your property'],
    ['trung bình cộng x 2 (thang 10)', 'average × 2 (scale of 10)'],
    ['Set budget hằng days + bid', 'Set daily budget + bid'],
    ['Tiến độ thực hiện', 'Implementation Progress'],
]);

// DeleteByMonthButton.tsx (4)
total += r('app/data/DeleteByMonthButton.tsx', [
    ['XOA DỮ LIỆU', 'DELETE DATA'],
    ['Xóa dữ liệu', 'Delete data'],
    ['để xác nhận', 'to confirm'],
]);

// admin/hotels/page.tsx (4)
total += r('app/admin/hotels/page.tsx', [
    ['Quản lý Hotels', 'Hotel Management'],
    ['Đang tải hotels', 'Loading hotels'],
    ['Thêm hotel', 'Add hotel'],
    ['Chỉnh sửa', 'Edit'],
]);

// DynamicPricingTab.tsx (4)
total += r('components/pricing/DynamicPricingTab.tsx', [
    ['không có khuyến mại', 'no promotions'],
    ['Bấm nút Configuration ở card bên trái để thiết lập bậc giá theo OCC%', 'Click Configuration on the left card to set up price tiers by OCC%'],
    ['>Dòng<', '>Row<'],
    ['và {data.violations.length - 5} more violations', 'and {data.violations.length - 5} more violations'],
]);

// SetupTab.tsx (3)
total += r('components/pricing/SetupTab.tsx', [
    ["'Luỹ tiến'", "'Progressive'"],
    ['Luỹ tiến - Progressive', 'Progressive'],
    ['Cộng dồn - Additive', 'Additive'],
]);

// OccTierEditor.tsx (3)
total += r('components/pricing/OccTierEditor.tsx', [
    ['Hệ số ngoài 0.5-3.0', 'Multiplier outside 0.5-3.0'],
    ['hệ số ngoài 0.5-3.0', 'multiplier outside 0.5-3.0'],
    ['không liền mạch', 'not continuous'],
    ['bậc trước kết thúc', 'previous tier ends at'],
    ['không liền mạch với bậc', 'not continuous with tier'],
    ['Bậc', 'Tier'],
]);

// RecommendationTable.tsx (2)
total += r('components/dashboard/RecommendationTable.tsx', [
    ['>Ngày<', '>Date<'],
    ['>Thao tác<', '>Actions<'],
]);

// login/page.tsx (2)
total += r('app/auth/login/page.tsx', [
    ['tiếp brand', 'brand continuation'],
    ['với nền xanh brand để tiếp mầu logo JPG', 'with brand blue bg to match JPG logo'],
]);

// WhenToBoost.tsx (2)
total += r('components/guide/WhenToBoost.tsx', [
    ['Occupancy thấp', 'Low occupancy'],
    ['trong 7-14 days tới', 'in next 7-14 days'],
    ['Bật Visibility Booster (Booking) hoặc AGP (Agoda) cho các days gap.', 'Enable Visibility Booster (Booking) or AGP (Agoda) for gap days.'],
    ['Preferred Partner (badge uy tín) + trả lời 100% reviews + push giá cạnh tranh.', 'Preferred Partner (credibility badge) + reply to 100% reviews + push competitive pricing.'],
    ['>Lưu<', '>Save<'],
    ['>Hủy<', '>Cancel<'],
]);

// SeasonConfigPanel.tsx (2)
total += r('components/pricing/SeasonConfigPanel.tsx', [
    ['> Thêm<', '> Add<'],
    ['>Lưu<', '>Save<'],
]);

// BuildFeaturesInline.tsx (2)
total += r('components/analytics/BuildFeaturesInline.tsx', [
    ['Build days remaining này', 'Build this date'],
    ['Build tất cả', 'Build all'],
    ['>Dừng<', '>Stop<'],
    ['OTB cơ bản vẫn hiển thị. Build features để xem đầy đủ Pickup, Pace, STLY.', 'Basic OTB still shows. Build features to see full Pickup, Pace, STLY.'],
    ['Rebuild tất cả (force)', 'Rebuild all (force)'],
]);

// types.ts (2)
total += r('components/analytics/types.ts', [
    ['Occupancy trung bình cho', 'Average occupancy for next'],
    ['days remaining lưu trú tiếp theo', 'upcoming stay dates'],
    ['So sánh tổng OTB hiện tại vs cùng thời điểm năm trước', 'Compare current OTB vs same time last year'],
    ['days remaining lưu trú tiếp. Dương = đang ahead.', 'upcoming stay dates. Positive = ahead of pace.'],
    ['days remaining lưu trú tiếp.', 'upcoming stay dates.'],
    ['Tổng rooms đặt thêm (net) trong 7 days remaining qua.\\nBao gồm bookings mới - cancellations.', 'Total net rooms booked in last 7 days.\\nIncludes new bookings minus cancellations.'],
    ['Giá rooms trung bình (Average Daily Rate)\\n= Tổng Revenue / Tổng Rooms (7d ahead)', 'Average room rate (Average Daily Rate)\\n= Total Revenue / Total Rooms (7d ahead)'],
    ['Thay đổi OTB từ hôm qua đến hôm nay\\ncho toàn bộ horizon đang hiển thị.', 'OTB change from yesterday to today\\nfor entire displayed horizon.'],
]);

// PricingTab.tsx (2)
total += r('components/admin/PricingTab.tsx', [
    ['Giá (VND/tháng)', 'Price (VND/month)'],
    ['Khuyến mãi Q1', 'Q1 Promotion'],
    ['Loading cấu hình giá.', 'Loading price configuration.'],
    ['Multiplier nhân theo quy mô rooms', 'Multiplier by room count'],
    ['Lỗi:', 'Error:'],
]);

// AccountDetailModal.tsx (2)
total += r('components/dashboard/AccountDetailModal.tsx', [
    ['Phân bố theo Room Type', 'Room Type Distribution'],
    ['days có booking)', 'days with bookings)'],
    ['>Ngày<', '>Date<'],
]);

// CancelForecastChart.tsx (2)
total += r('components/analytics/CancelForecastChart.tsx', [
    ['Thấp', 'Low'],
    ['Mặc định', 'Default'],
    ['Trống thực tế', 'Actual Empty'],
    ['Tỷ lệ TB:', 'Avg Rate:'],
]);

// Single remaining fixes
total += r('components/billing/PromoRedeemCard.tsx', [
    ['>Kiểm tra<', '>Verify<'],
    ["'Lỗi kết nối. Vui lòng thử lại.'", "'Connection error. Please try again.'"],
]);

total += r('components/pricing/RoomTypesTab.tsx', [
    ['Thêm room type', 'Add room type'],
    ['>Hủy<', '>Cancel<'],
]);

total += r('components/pricing/OTAConfigTab.tsx', [
    ['Thêm kênh OTA', 'Add OTA Channel'],
    ['>Hủy<', '>Cancel<'],
]);

total += r('components/analytics/DataQualityBadge.tsx', [
    ['STLY dòng nearest DOW', 'STLY nearest DOW rows'],
    ['Thiếu snapshot nên pace/pickup chưa đầy đủ. Kết quả chỉ mang tính tham khảo.', 'Missing snapshots so pace/pickup is incomplete. Results are for reference only.'],
]);

total += r('components/dashboard/InsightsPanel.tsx', [
    ['Tác động ước tính', 'Estimated Impact'],
    ['Days to watch khác', 'Other days to watch'],
    ['Tác động', 'Impact'],
]);

total += r('app/rate-shopper/competitors/page.tsx', [
    ['>Tìm<', '>Search<'],
]);

total += r('app/settings/team/page.tsx', [
    ['Create mã mới khác', 'Create a new code'],
]);

console.log(`\n🎯 FINAL Pass 4: ${total} replacements`);
