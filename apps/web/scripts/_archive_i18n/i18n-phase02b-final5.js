/**
 * Phase 02B - FINAL pass 5: Remaining exact patterns from file inspection
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

// guide/page.tsx - need to look at exact lines
// Line 599: "OTB X%, dư phòng Y%"
total += r('app/guide/page.tsx', [
    ['dư phòng', 'remaining rooms'],
    ['Cộng dồn', 'Additive'],
]);

// upload/page.tsx
total += r('app/upload/page.tsx', [
    ["Import báo cáo đặt rooms & hủy rooms", "Import booking & cancellation reports"],
    ['hỗ trợ upload', 'supports uploading'],
    ['Báo cáo Hủy rooms', 'Cancellation Reports'],
    ["Upload báo cáo \"Reservation Booked On Date\" từ PMS. Chọn multiple files at once (Ctrl+Click hoặc kéo thả).", "Upload \"Reservation Booked On Date\" reports from PMS. Select multiple files (Ctrl+Click or drag & drop)."],
    ["Upload báo cáo \"Reservation Cancelled\" từ PMS. Chọn multiple files at once.", "Upload \"Reservation Cancelled\" reports from PMS. Select multiple files."],
    ['Upload bị tắt cho Demo Hotel', 'Upload disabled for Demo Hotel'],
    ['Liên hệ admin để được gán hotels', 'Contact admin to be assigned a hotel'],
    ['Drag & drop file CSV, XML hoặc Excel vào đây', 'Drag & drop CSV, XML, or Excel files here'],
    ['chọn <strong>nhiều file</strong> cùng lúc (tối đa 31 file/lần)', 'select <strong>multiple files</strong> at once (max 31 files/batch)'],
    ['Select file (có thể chọn nhiều)', 'Select files (multi-select available)'],
    ['Tải file mẫu Excel', 'Download sample Excel file'],
    ['(Đặt rooms)', '(Bookings)'],
    ['(Hủy rooms)', '(Cancellations)'],
    ['File mẫu có 7 cột: Mã, Ngày đặt, Check-in, Check-out, Phòng, Doanh thu, Status', 'Sample has 7 columns: Code, Booking Date, Check-in, Check-out, Room, Revenue, Status'],
    ['File mẫu có 8 cột: bao gồm cột Ngày hủy (bắt buộc)', 'Sample has 8 columns: includes Cancel Date column (required)'],
    ['Hoàn tất', 'Completed'],
    ['lỗi', 'errors'],
    ['Tổng:', 'Total:'],
    ['Chờ...', 'Wait...'],
    ['Upload thêm file', 'Upload more files'],
    ['Export từ PMS với format Crystal Reports XML.', 'Export from PMS in Crystal Reports XML format.'],
    ['File CSV với các cột:', 'CSV file with columns:'],
    ['Mẹo:', 'Tip:'],
    ['Dùng Ctrl+A (chọn tất cả) hoặc Ctrl+Click để chọn multiple files at once.', 'Use Ctrl+A (select all) or Ctrl+Click to select multiple files at once.'],
    ['Hệ thống sẽ tự động import từng file theo thứ tự.', 'System will automatically import each file in order.'],
]);

// AgodaChecklist.tsx
total += r('components/guide/AgodaChecklist.tsx', [
    ['yêu cầu minimum', 'requires minimum'],
    ['Từng room type → Photos → Upload ≥5 photos/room type', 'Each room type → Photos → Upload ≥5 photos/room type'],
    ['trung bình cộng x 2 (thang 10)', 'average × 2 (scale of 10)'],
    ['Set budget hằng days + bid', 'Set daily budget + bid'],
]);

// AnalyticsPanel.tsx  
total += r('components/dashboard/AnalyticsPanel.tsx', [
    ['Dấu - means', 'Minus sign means'],
    ['Số rooms được đặt THÊM trong 3 days gần nhất. Giống T-7 nhưng ngắn hơn hơn', 'Additional rooms booked in last 3 days. Similar to T-7 but shorter'],
    ['Dương = demand increasing recently. Dấu - = insufficient data', 'Positive = demand increasing recently. Minus = insufficient data'],
    ['for days đó = Tổng rooms - OTB', 'for those dates = Total rooms - OTB'],
]);

// DeleteByMonthButton.tsx
total += r('app/data/DeleteByMonthButton.tsx', [
    ["'XOA DỮ LIỆU'", "'DELETE DATA'"],
    ['XOA DỮ LIỆU', 'DELETE DATA'],
    ['"XOA DỮ LIỆU"', '"DELETE DATA"'],
]);

// admin/hotels/page.tsx
total += r('app/admin/hotels/page.tsx', [
    ['Quản lý Hotels', 'Hotel Management'],
    ['Đang tải hotels', 'Loading hotels'],
    ['Thêm hotel', 'Add hotel'],
    ['Chỉnh sửa', 'Edit'],
]);

// admin/users/page.tsx
total += r('app/admin/users/page.tsx', [
    ['Quản lý Users', 'User Management'],
    ['Trial sắp hết', 'Trial expiring'],
    ['Vượt', 'Exceeds'],
    ['Chọn gói để kích hoạt subscription cho hotel này', 'Select plan to activate subscription for this hotel'],
]);

// DynamicPricingTab.tsx
total += r('components/pricing/DynamicPricingTab.tsx', [
    ['không có khuyến mại', 'no promotions'],
    ['không có khuyến mãi', 'no promotions'],
    ['Bấm nút Configuration ở card bên trái để thiết lập bậc giá theo OCC%', 'Click Configuration on the left card to set up price tiers by OCC%'],
    ['>Dòng<', '>Row<'],
]);

// SetupTab.tsx
total += r('components/pricing/SetupTab.tsx', [
    ["'Luỹ tiến'", "'Progressive'"],
    ['>Luỹ tiến - Progressive<', '>Progressive<'],
    ['>Cộng dồn - Additive<', '>Additive<'],
]);

// OccTierEditor.tsx
total += r('components/pricing/OccTierEditor.tsx', [
    ['Hệ số ngoài', 'Multiplier outside'],
    ['hệ số ngoài', 'multiplier outside'],
]);

// login/page.tsx
total += r('app/auth/login/page.tsx', [
    ['tiếp brand', 'brand continuation'],
    ['với nền xanh brand để tiếp mầu logo JPG', 'with brand blue bg to match JPG logo'],
]);

// WhenToBoost.tsx
total += r('components/guide/WhenToBoost.tsx', [
    ['Occupancy thấp', 'Low occupancy'],
    ['trong 7-14 days tới', 'in next 7-14 days'],
    ['Bật Visibility Booster', 'Enable Visibility Booster'],
    ['cho các days gap', 'for gap days'],
    ['badge uy tín', 'credibility badge'],
    ['trả lời 100% reviews + push giá cạnh tranh', 'reply to 100% reviews + push competitive pricing'],
    ['>Lưu<', '>Save<'],
    ['>Hủy<', '>Cancel<'],
]);

// SeasonConfigPanel.tsx
total += r('components/pricing/SeasonConfigPanel.tsx', [
    ['> Thêm<', '> Add<'],
    ['>Lưu<', '>Save<'],
]);

// BuildFeaturesInline.tsx
total += r('components/analytics/BuildFeaturesInline.tsx', [
    ['>Dừng<', '>Stop<'],
]);

// types.ts
total += r('components/analytics/types.ts', [
    ['Occupancy trung bình cho', 'Average occupancy for next'],
]);

// PricingTab.tsx
total += r('components/admin/PricingTab.tsx', [
    ['Giá (VND/tháng)', 'Price (VND/month)'],
    ['Khuyến mãi Q1', 'Q1 Promotion'],
    ['Multiplier nhân theo quy mô rooms', 'Multiplier by room count'],
    ['Loading cấu hình giá.', 'Loading price configuration.'],
    ['Lỗi:', 'Error:'],
]);

// AccountDetailModal.tsx
total += r('components/dashboard/AccountDetailModal.tsx', [
    ['Phân bố theo Room Type', 'Room Type Distribution'],
    ['days có booking)', 'days with bookings)'],
    ['>Ngày<', '>Date<'],
]);

// CancelForecastChart.tsx
total += r('components/analytics/CancelForecastChart.tsx', [
    ["'⚠️ Thấp'", "'⚠️ Low'"],
    ["'⚡ Mặc định'", "'⚡ Default'"],
    ['Trống thực tế', 'Actual Empty'],
    ['Tỷ lệ TB:', 'Avg Rate:'],
]);

// RecommendationTable.tsx
total += r('components/dashboard/RecommendationTable.tsx', [
    ['>Ngày<', '>Date<'],
    ['>Thao tác<', '>Actions<'],
]);

// InsightsPanel.tsx
total += r('components/dashboard/InsightsPanel.tsx', [
    ['Tác động ước tính', 'Estimated Impact'],
    ['Days to watch khác', 'Other days to watch'],
    ['Impact - Tác động', 'Impact'],
]);

// PromoRedeemCard.tsx
total += r('components/billing/PromoRedeemCard.tsx', [
    ['>Kiểm tra<', '>Verify<'],
    ["'Lỗi kết nối. Vui lòng thử lại.'", "'Connection error. Please try again.'"],
]);

// RoomTypesTab.tsx
total += r('components/pricing/RoomTypesTab.tsx', [
    ['Thêm room type', 'Add room type'],
    ['>Hủy<', '>Cancel<'],
]);

// OTAConfigTab.tsx
total += r('components/pricing/OTAConfigTab.tsx', [
    ['Thêm kênh OTA', 'Add OTA Channel'],
    ['>Hủy<', '>Cancel<'],
]);

// DataQualityBadge.tsx
total += r('components/analytics/DataQualityBadge.tsx', [
    ['STLY dòng nearest DOW', 'STLY nearest DOW rows'],
    ['Thiếu snapshot nên pace/pickup chưa đầy đủ. Kết quả chỉ mang tính tham khảo.', 'Missing snapshots so pace/pickup is incomplete. Results are for reference only.'],
]);

// rate-shopper
total += r('app/rate-shopper/competitors/page.tsx', [
    ['>Tìm<', '>Search<'],
]);

// team page
total += r('app/settings/team/page.tsx', [
    ['Create mã mới khác', 'Create a new code'],
]);

// PLGAdminDashboard.tsx - just 1 remaining
total += r('components/admin/PLGAdminDashboard.tsx', [
    ['💡 Mẹo:', '💡 Tip:'],
]);

console.log(`\n🎯 FINAL Pass 5: ${total} replacements`);
