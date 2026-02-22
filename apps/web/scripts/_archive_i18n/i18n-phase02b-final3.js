/**
 * Phase 02B - FINAL pass 3: Every remaining VN string across all 59 files
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
// PLGAdminDashboard.tsx (30 lines)
// ═══════════════════════════════════════════════════════
total += r('components/admin/PLGAdminDashboard.tsx', [
    ['>Mô tả<', '>Description<'],
    ['PLG (Product-Led Growth) là hệ thống quản lý đại lý (Resellers), mã khuyến mại (Promo Codes),', 'PLG (Product-Led Growth) is the system for managing Resellers, Promo Codes,'],
    ['và commission (Commissions). Dưới đây là hướng dẫn chi tiết từng bước.', 'and Commissions. Below is a detailed step-by-step guide.'],
    ['<strong>Reseller là ai?</strong>', '<strong>Who is a Reseller?</strong>'],
    ['Là đối tác giới thiệu khách hàng (hotels) sử dụng hệ thống RMS.', 'A partner who refers hotels to use the RMS system.'],
    ['Mỗi reseller được cấp một', 'Each reseller is assigned a'],
    ['(mã giới thiệu) tự động, dùng để tracking attribution.', '(referral code) automatically, used for tracking attribution.'],
    ['Create Reseller mới', 'Create new Reseller'],
    ['Bấm nút', 'Click button'],
    ['+ Thêm Reseller', '+ Add Reseller'],
    ['Điền tên, email, SĐT', 'Enter name, email, phone'],
    ['Bấm <strong>Tạo</strong>', 'Click <strong>Create</strong>'],
    ['Hệ thống tự sinh mã Ref Code', 'System auto-generates Ref Code'],
    ['Sửa thông tin Reseller', 'Edit Reseller info'],
    ['Bấm icon', 'Click icon'],
    ['✏️ bút chì</strong>', '✏️ pencil</strong>'],
    ['trên dòng reseller cần sửa', 'on the reseller row to edit'],
    ['Thay đổi tên hoặc email', 'Change name or email'],
    ['✅ Lưu</strong>', '✅ Save</strong>'],
    ['Bật/Tắt trạng thái Active', 'Toggle Active status'],
    ['Bấm vào badge', 'Click the badge'],
    ['Reseller inactive sẽ không còn hoạt động nhưng dữ liệu vẫn được giữ.', 'Inactive resellers stop working but data is preserved.'],
    ['Xóa Reseller (Soft Delete)', 'Delete Reseller (Soft Delete)'],
    ['🗑️ thùng rác</strong>', '🗑️ trash</strong>'],
    ['Xác nhận', 'Confirm'],
    ['Reseller chuyển thành Inactive.', 'Reseller changes to Inactive.'],
    ['Hiển thị lịch sử tất cả giao dịch', 'Shows all transaction history'],
    ['loại, tỷ lệ, số tiền, mô tả', 'type, rate, amount, description'],
    ['Cung cấp tên, email', 'Provide name, email'],
    ['Nhận Ref Code tự động', 'Get auto-generated Ref Code'],
    ['Thêm thủ công', 'Add manually'],
    ['Nhập mã', 'Enter code'],
    ['giảm giá', 'discount'],
    ['ngày hết hạn', 'expiry date'],
    ['Tạo Promo Code mới', 'Create new Promo Code'],
    ['Nhấn icon', 'Click icon'],
    ['để copy toàn bộ mã', 'to copy entire code'],
    ['Chia sẻ cho khách', 'Share with guests'],
    ['Xóa Promo Code', 'Delete Promo Code'],
    ['Promo Code bị xóa vĩnh viễn', 'Promo Code is permanently deleted'],
    ['tự động tính commission', 'auto-calculate commission'],
    ['Bao gồm', 'Including'],
    ['Cấu hình Commission', 'Configure Commission'],
    ['Mỗi dòng = 1 commission rule', 'Each row = 1 commission rule'],
    ['Thêm Commission Rule', 'Add Commission Rule'],
    ['Sửa Rule', 'Edit Rule'],
    ['Xóa Rule', 'Delete Rule'],
    ['Lưu ý quan trọng', 'Important notes'],
    ['Đảm bảo tạo reseller TRƯỚC', 'Ensure creating reseller FIRST'],
    ['Commission tự động tính', 'Commission auto-calculates'],
    ['Promo code có thể tạo không giới hạn', 'Promo codes can be created unlimitedly'],
    ['không khôi phục được', 'cannot be recovered'],
    ['Mô tả ngắn cho rule này', 'Short description for this rule'],
    ['Quay lại overview', 'Back to overview'],
    ['Xem chi tiết', 'View details'],
    ['đại lý', 'reseller'],
    ['mã khuyến mại', 'promo codes'],
    ['hoa hồng', 'commission'],
    ['Hướng dẫn sử dụng', 'User Guide'],
]);

// ═══════════════════════════════════════════════════════
// upload/page.tsx (22 lines)
// ═══════════════════════════════════════════════════════
total += r('app/upload/page.tsx', [
    ['Import báo cáo đặt rooms từ PMS', 'Import booking reports from PMS'],
    ['Upload nhiều file CSV/XML cùng lúc', 'Upload multiple CSV/XML files at once'],
    ['Import báo cáo đặt rooms & hủy rooms', 'Import booking & cancellation reports'],
    ['Tự động xử lý & validate data', 'Auto-process & validate data'],
    ['Chỉ hỗ trợ file CSV, XML hoặc Excel (.xlsx)', 'Only CSV, XML, or Excel (.xlsx) files supported'],
    ['Lỗi không xác định', 'Unknown error'],
    ['Không tìm thấy Hotel ID', 'Hotel ID not found'],
    ['Import báo cáo đặt rooms từ PMS - hỗ trợ upload', 'Import booking reports from PMS - supports uploading'],
    ['nhiều file cùng lúc', 'multiple files at once'],
    ['(tối đa 31 file)', '(max 31 files)'],
    ['Demo Hotel - Chế độ xem', 'Demo Hotel - View mode'],
    ['Bạn đang sử dụng Demo Hotel. Upload file bị tắt.', 'You are using Demo Hotel. File upload is disabled.'],
    ['Please liên hệ admin để được gán hotels thực.', 'Please contact admin to be assigned a real hotel.'],
    ['Báo cáo Đặt rooms', 'Booking Reports'],
    ['Báo cáo Hủy rooms', 'Cancellation Reports'],
    // Handle strings with smart quotes or special chars 
    ['Upload báo cáo "Reservation Booked On Date" từ PMS. Chọn nhiều file cùng lúc (Ctrl+Click hoặc kéo thả).', 'Upload "Reservation Booked On Date" reports from PMS. Select multiple files (Ctrl+Click or drag & drop).'],
    ['Upload báo cáo "Reservation Cancelled" từ PMS. Chọn nhiều file cùng lúc.', 'Upload "Reservation Cancelled" reports from PMS. Select multiple files.'],
    ['Đã tải lên', 'Uploaded'],
    ['Đang tải lên', 'Uploading'],
    ['File đã xử lý', 'File processed'],
    ['Chưa chọn file nào', 'No files selected'],
    ['Kéo thả file vào đây', 'Drag & drop files here'],
    ['hoặc click để chọn', 'or click to select'],
    ['Đang xử lý...', 'Processing...'],
]);

// ═══════════════════════════════════════════════════════
// PromotionsTab.tsx (19 lines)  
// ═══════════════════════════════════════════════════════
total += r('components/pricing/PromotionsTab.tsx', [
    ['Thêm khuyến mại', 'Add Promotion'],
    ['Click to add khuyến mại', 'Click to add promotion'],
    ['Tên khuyến mại', 'Promotion name'],
    ['Chưa có khuyến mại nào - Click to add', 'No promotions yet - Click to add'],
    ['Chọn chương trình khuyến mại từ danh mục có sẵn', 'Select a promotion from the available catalog'],
    ['Khuyến mại -', 'Promotion -'],
    ['khuyến mại', 'promotion'],
    ['Giá khách thấy trên OTA', 'Price guest sees on OTA'],
    ['Cộng commission OTA', 'Add OTA commission'],
    ['Giá trước khuyến mại', 'Price before promotions'],
    ['Nhân progressive', 'Multiply progressive'],
    ['Cộng dồn', 'Additive'],
    ['>đ<', '>₫<'],
    ['Thêm</button>', 'Add</button>'],
    ['Hủy</button>', 'Cancel</button>'],
    ['Lưu</button>', 'Save</button>'],
]);

// ═══════════════════════════════════════════════════════
// guide/page.tsx (15 lines)
// ═══════════════════════════════════════════════════════
total += r('app/guide/page.tsx', [
    ['Số phòng còn trống có thể bán', 'Available rooms for sale'],
    ['Data Quality: có cảnh báo không?', 'Data Quality: any warnings?'],
    ['dư phòng Y%', 'remaining rooms Y%'],
    ['Open file CSV bằng Excel hoặc Google Sheets', 'Open CSV file in Excel or Google Sheets'],
    ['In ra cho team Front Desk hoặc gửi cho Sales Manager để cập nhật giá lên OTA.', 'Print for Front Desk team or send to Sales Manager to update OTA prices.'],
    ['Giá cơ bản, mùa thường', 'Base price, regular season'],
    ['Giá cao hơn, mùa cao điểm', 'Higher price, peak season'],
    ['Giá cao nhất, lễ/tết', 'Highest price, holidays'],
    ['giữ giá gốc', 'keep base price'],
    ['tăng giá mạnh hơn', 'increase price more'],
    ['giá cao nhất', 'highest price'],
    ['Luỹ tiến (mặc định)', 'Progressive (default)'],
]);

// ═══════════════════════════════════════════════════════
// AgodaChecklist.tsx (11 lines)
// ═══════════════════════════════════════════════════════
total += r('components/guide/AgodaChecklist.tsx', [
    ['information provided by BA và cross-check với nội dung public.', 'information provided by BA and cross-checked with public content.'],
    ['tham gia tối thiểu 90 days (mandatory). Consider carefully before enrolling.', 'minimum 90-day participation (mandatory). Consider carefully before enrolling.'],
    ['Upload ≥20 ảnh property (không phải room). Ensure cover: lobby, pool, restaurant, exterior, amenities.', 'Upload ≥20 property photos (not rooms). Ensure coverage: lobby, pool, restaurant, exterior, amenities.'],
    ['Ảnh rooms cho mỗi room type (25% weight)', 'Room photos for each room type (25% weight)'],
    ['Room Photos = 25% of Content Score. Mỗi room type cần ≥5 ảnh riêng (giường, rooms tắm, view, tiện nghi).', 'Room Photos = 25% of Content Score. Each room type needs ≥5 unique photos (bed, bathroom, view, amenities).'],
    ['Upload ≥5 photos/room type. Wide angle shots, natural light.', 'Upload ≥5 photos/room type. Wide angle shots, natural light.'],
    ['Description chi tiết bằng tiếng Anh - Agoda tự dịch sang các ngôn ngữ khác.', 'Detailed description in English - Agoda auto-translates to other languages.'],
    ['Write description ≥200 từ tiếng Anh. Emphasize USP, vị trí, trải nghiệm đặc biệt.', 'Write description ≥200 words in English. Emphasize USP, location, unique experiences.'],
    ['Facilities/Amenities = 10% of Content Score. Tick đầy đủ tất cả tiện nghi có sẵn trong property.', 'Facilities/Amenities = 10% of Content Score. Tick all available amenities in your property.'],
    ['Agoda review score = trung bình cộng x 2 (thang 10). Each review has equal weight (unlike Booking.com).', 'Agoda review score = average × 2 (scale of 10). Each review has equal weight (unlike Booking.com).'],
    ['Set budget hằng days + bid. Start small, monitor ROI.', 'Set daily budget + bid. Start small, monitor ROI.'],
    ['Tiến độ thực hiện', 'Implementation Progress'],
]);

// ═══════════════════════════════════════════════════════
// admin/users/page.tsx (9 lines)
// ═══════════════════════════════════════════════════════
total += r('app/admin/users/page.tsx', [
    ["'Chưa đặt tên'", "'Unnamed'"],
    ["'Có lỗi xảy ra'", "'An error occurred'"],
    ["Chỉnh sửa", "Edit"],
    ['Họ tên', 'Full name'],
    ['Nhập họ tên', 'Enter full name'],
    ['Số điện thoại', 'Phone number'],
    ['Quyền thật nằm ở Hotel Role (trong Gán hotel).', 'Actual permissions are set in Hotel Role (in Assign hotel).'],
    ["'Đang lưu...'", "'Saving...'"],
    ['Quản lý Users', 'User Management'],
    ['Trial sắp hết', 'Trial expiring'],
    ['Vượt', 'Exceeds'],
    ['Chọn gói để kích hoạt subscription cho hotel này', 'Select plan to activate subscription for this hotel'],
]);

// ═══════════════════════════════════════════════════════
// AnalyticsPanel.tsx (9 lines) — tooltip text
// ═══════════════════════════════════════════════════════
total += r('components/dashboard/AnalyticsPanel.tsx', [
    ['Compare rooms sold this year vs Same Time Last Year (Same Time Last Year). Ví dụ: +50% nghĩa là năm nay bán nhiều gấp rưỡi.', 'Compare rooms sold this year vs STLY (Same Time Last Year). E.g.: +50% means 1.5x rooms sold this year.'],
    ['Median rooms booked per days trong 7 days qua. Ví dụ: +3.5 nghĩa là mỗi days có thêm 3-4 booking mới.', 'Median rooms booked per day in last 7 days. E.g.: +3.5 means 3-4 new bookings each day.'],
    ['Phần trăm days có dữ liệu để so sánh với cùng kỳ năm ngoái. 100% = tất cả days đều có data năm ngoái để so.', 'Percent of days with data for STLY comparison. 100% = all days have last year data.'],
    ['Rooms booked ADDITIONALLY in last 7 days qua (cho days lưu trú đó). Ví dụ: +5 nghĩa là so với 7 days trước, days này có thêm 5 booking.', 'Rooms additionally booked in last 7 days (for those stay dates). E.g.: +5 means 5 more bookings vs 7 days ago.'],
    ['Positive = more rooms booked. Dấu - nghĩa là chưa đủ data lịch sử (need OTB snapshot 7 days trước).', 'Positive = more rooms booked. Minus sign = insufficient historical data (need OTB snapshot 7 days ago).'],
    ['Số rooms được đặt THÊM trong 3 days gần nhất. Giống T-7 nhưng ngắn hơn hơn, shows recent trends.', 'Additional rooms booked in last 3 days. Similar to T-7 but shorter, shows recent trends.'],
    ['Dương = demand đang tăng gần. Dấu - = chưa đủ data (need OTB snapshot 3 days trước).', 'Positive = demand increasing recently. Minus = insufficient data (need OTB snapshot 3 days ago).'],
    ['Same Time Last Year (Same Time Last Year) - rooms sold for days tương ứng năm trước.', 'STLY (Same Time Last Year) - rooms sold for corresponding dates last year.'],
    ['Remaining rooms for days đó = Tổng rooms - OTB.', 'Remaining rooms for those dates = Total rooms - OTB.'],
]);

// ═══════════════════════════════════════════════════════
// analytics/types.ts (8 lines)
// ═══════════════════════════════════════════════════════
total += r('components/analytics/types.ts', [
    ["'Occupancy trung bình cho 7 days remaining lưu trú tiếp theo\\n= Σ(rooms_otb) / (7 x capacity) x 100'", "'Average occupancy for next 7 stay dates\\n= Σ(rooms_otb) / (7 × capacity) × 100'"],
    ["'Occupancy trung bình cho 14 days remaining lưu trú tiếp theo'", "'Average occupancy for next 14 stay dates'"],
    ["'Occupancy trung bình cho 30 days remaining lưu trú tiếp theo'", "'Average occupancy for next 30 stay dates'"],
    ["'So sánh tổng OTB hiện tại vs cùng thời điểm năm trước\\ncho 7 days remaining lưu trú tiếp. Dương = đang ahead.'", "'Compare current OTB total vs same time last year\\nfor next 7 stay dates. Positive = ahead of pace.'"],
    ["'So sánh tổng OTB hiện tại vs cùng thời điểm năm trước\\ncho 30 days remaining lưu trú tiếp.'", "'Compare current OTB total vs same time last year\\nfor next 30 stay dates.'"],
    ["'Tổng rooms đặt thêm (net) trong 7 days remaining qua.\\nBao gồm bookings mới - cancellations.'", "'Total net additional rooms booked in last 7 days.\\nIncludes new bookings minus cancellations.'"],
    ["'Giá rooms trung bình (Average Daily Rate)\\n= Tổng Revenue / Tổng Rooms (7d ahead)'", "'Average room rate (Average Daily Rate)\\n= Total Revenue / Total Rooms (7d ahead)'"],
    ["'Thay đổi OTB từ hôm qua đến hôm nay\\ncho toàn bộ horizon đang hiển thị.'", "'OTB change from yesterday to today\\nfor entire currently displayed horizon.'"],
]);

// ═══════════════════════════════════════════════════════
// BuildFeaturesInline.tsx (7 lines)
// ═══════════════════════════════════════════════════════
total += r('components/analytics/BuildFeaturesInline.tsx', [
    ['Build days remaining này (single date)', 'Build this date (single date)'],
    ['Build tất cả (smart skip)', 'Build all (smart skip)'],
    ['OTB cơ bản vẫn hiển thị. Build features để xem đầy đủ Pickup, Pace, STLY.', 'Basic OTB still shows. Build features to see full Pickup, Pace, STLY.'],
    ['>Dừng<', '>Stop<'],
    ['>Build days remaining này<', '>Build this date<'],
    ['>Build tất cả<', '>Build all<'],
    ['Rebuild tất cả (force)', 'Rebuild all (force)'],
    ['Build days remaining này', 'Build this date'],
]);

// ═══════════════════════════════════════════════════════
// CancelForecastChart.tsx (5 lines)
// ═══════════════════════════════════════════════════════
total += r('components/analytics/CancelForecastChart.tsx', [
    ["'⚠️ Thấp'", "'⚠️ Low'"],
    ["'⚡ Mặc định'", "'⚡ Default'"],
    ['Trống thực tế', 'Actual Empty'],
    ['Tỷ lệ TB:', 'Avg Rate:'],
    ['name="Trống thực tế"', 'name="Actual Empty"'],
]);

// ═══════════════════════════════════════════════════════
// PricingTab.tsx (5 lines)
// ═══════════════════════════════════════════════════════
total += r('components/admin/PricingTab.tsx', [
    ['Giá (VND/tháng)', 'Price (VND/month)'],
    ['Khuyến mãi Q1', 'Q1 Promotion'],
    ['Lỗi:', 'Error:'],
    ['Loading cấu hình giá.', 'Loading price configuration.'],
    ['Multiplier nhân theo quy mô rooms', 'Multiplier by room count scale'],
]);

// ═══════════════════════════════════════════════════════
// WhenToBoost.tsx (5 lines)
// ═══════════════════════════════════════════════════════
total += r('components/guide/WhenToBoost.tsx', [
    ['Occupancy thấp (< 50%) trong 7-14 days tới', 'Low occupancy (< 50%) in next 7-14 days'],
    ['Bật Visibility Booster (Booking) hoặc AGP (Agoda) cho các days gap.', 'Enable Visibility Booster (Booking) or AGP (Agoda) for gap days.'],
    ['Priority Preferred Partner (badge uy tín) + trả lời 100% reviews + push giá cạnh tranh.', 'Priority Preferred Partner (credibility badge) + reply to 100% reviews + push competitive pricing.'],
    ['>Lưu<', '>Save<'],
    ['>Hủy<', '>Cancel<'],
]);

// ═══════════════════════════════════════════════════════
// OccTierEditor.tsx (5 lines)  
// ═══════════════════════════════════════════════════════
total += r('components/pricing/OccTierEditor.tsx', [
    ['Hệ số ngoài 0.5-3.0', 'Multiplier outside 0.5-3.0'],
    ['không liền mạch - bậc trước kết thúc', 'not continuous - previous tier ends at'],
    ['min ≥ max', 'min ≥ max'],
    ['hệ số ngoài 0.5-3.0', 'multiplier outside 0.5-3.0'],
    ['không liền mạch với bậc', 'not continuous with tier'],
    ['Bậc', 'Tier'],
]);

// ═══════════════════════════════════════════════════════
// AuditTeaser.tsx (4 lines)
// ═══════════════════════════════════════════════════════
total += r('components/AuditTeaser.tsx', [
    ['Phân tích độ hoàn thiện dữ liệu', 'Data completeness analysis'],
    ['Found anomaly & pickup bất thường', 'Found anomalies & unusual pickup patterns'],
    ['Đề xuất cải thiện chất lượng dữ liệu', 'Data quality improvement recommendations'],
    ['Export báo cáo PDF', 'Export PDF report'],
]);

// ═══════════════════════════════════════════════════════
// TopAccountsTable.tsx (4 lines)
// ═══════════════════════════════════════════════════════
total += r('components/dashboard/TopAccountsTable.tsx', [
    ["'Không tải được dữ liệu'", "'Failed to load data'"],
    ["'Không có dữ liệu'", "'No data available'"],
    ['Chưa có dữ liệu booking trong', 'No booking data available in the next'],
    ['Click hàng để xem chi tiết account', 'Click a row to view account details'],
    ['days tới.', 'days.'],
]);

// ═══════════════════════════════════════════════════════
// TierPaywall.tsx (4 lines)
// ═══════════════════════════════════════════════════════
total += r('components/paywall/TierPaywall.tsx', [
    ['trở lên', 'or higher'],
    ['Gói {tierDisplayName} bao gồm', '{tierDisplayName} plan includes'],
    ['Xem gói nâng cấp', 'View upgrade plans'],
    ['Liên hệ Zalo 0778602953 để được tư vấn', 'Contact Zalo 0778602953 for consultation'],
]);

// ═══════════════════════════════════════════════════════
// AccountDetailModal.tsx (4 lines)
// ═══════════════════════════════════════════════════════
total += r('components/dashboard/AccountDetailModal.tsx', [
    ["'Không có dữ liệu'", "'No data available'"],
    ['Phân bố theo Room Type', 'Room Type Distribution'],
    ['days có booking)', 'days with bookings)'],
    ['>Ngày<', '>Date<'],
]);

// ═══════════════════════════════════════════════════════
// DynamicPricingTab.tsx (4 lines)
// ═══════════════════════════════════════════════════════
total += r('components/pricing/DynamicPricingTab.tsx', [
    ['violations', 'violations'],
    ['BAR = Display (không có khuyến mại)', 'BAR = Display (no promotions)'],
    ['>Dòng<', '>Row<'],
    ['Bấm nút Configuration ở card bên trái để thiết lập bậc giá theo OCC%', 'Click Configuration button on the left card to set up price tiers by OCC%'],
]);

// ═══════════════════════════════════════════════════════
// dashboard/page.tsx (4 lines)
// ═══════════════════════════════════════════════════════
total += r('app/dashboard/page.tsx', [
    ["'Hết rooms — ngừng bán'", "'Sold out — stop selling'"],
    ['và <a href="/data"', 'and <a href="/data"'],
    ['để enter room count and other info.', 'to enter room count and other info.'],
]);

// ═══════════════════════════════════════════════════════
// DeleteByMonthButton.tsx (4 lines)
// ═══════════════════════════════════════════════════════
total += r('app/data/DeleteByMonthButton.tsx', [
    ["'XOA DỮ LIỆU'", "'DELETE DATA'"],
    ['XOA DỮ LIỆU', 'DELETE DATA'],
    ['Xóa dữ liệu', 'Delete data'],
    ['để xác nhận', 'to confirm'],
]);

// ═══════════════════════════════════════════════════════
// admin/hotels/page.tsx (4 lines)
// ═══════════════════════════════════════════════════════
total += r('app/admin/hotels/page.tsx', [
    ['Quản lý Hotels', 'Hotel Management'],
    ['Đang tải hotels', 'Loading hotels'],
    ['Thêm hotel', 'Add hotel'],
    ['Chỉnh sửa', 'Edit'],
]);

// ═══════════════════════════════════════════════════════
// QuotaWarning.tsx (3 lines)
// ═══════════════════════════════════════════════════════
total += r('components/gates/QuotaWarning.tsx', [
    ["'người dùng'", "'users'"],
    ['Đã dùng hết quota', 'Quota fully used'],
    ['Gần hết quota', 'Quota nearly used'],
]);

// ═══════════════════════════════════════════════════════
// PaceTable.tsx (3 lines)
// ═══════════════════════════════════════════════════════
total += r('components/analytics/PaceTable.tsx', [
    ['// Default:  Ngày | DOW | OTB', '// Default:  Date | DOW | OTB'],
    ['Click để thu gọn', 'Click to collapse'],
    ['Click để mở bảng chi tiết', 'Click to expand detail table'],
    ['Ẩn T-15, T-30', 'Hide T-15, T-30'],
]);

// ═══════════════════════════════════════════════════════
// RoomLosMixPanel.tsx (3 lines)
// ═══════════════════════════════════════════════════════
total += r('components/dashboard/RoomLosMixPanel.tsx', [
    ["'Không tải được dữ liệu'", "'Failed to load data'"],
    ["'Không có dữ liệu'", "'No data available'"],
    ['Chưa có dữ liệu.', 'No data available.'],
]);

// ═══════════════════════════════════════════════════════
// InsightsPanel.tsx (3 lines)
// ═══════════════════════════════════════════════════════
total += r('components/dashboard/InsightsPanel.tsx', [
    ['Impact - Tác động', 'Impact'],
    ['Tác động ước tính', 'Estimated Impact'],
    ['Days to watch khác', 'Other days to watch'],
]);

// ═══════════════════════════════════════════════════════
// DatePickerSnapshot.tsx (3 lines)
// ═══════════════════════════════════════════════════════
total += r('components/DatePickerSnapshot.tsx', [
    ['Hôm nay, Hôm qua, 3 days remaining trước, 1 tuần trước', 'Today, Yesterday, 3 days ago, 1 week ago'],
    ['days remaining trước', 'days ago'],
    ['days remaining dữ liệu', 'days of data'],
]);

// ═══════════════════════════════════════════════════════
// FeatureGate.tsx (3 lines)
// ═══════════════════════════════════════════════════════
total += r('components/gates/FeatureGate.tsx', [
    ['Bản xem trước', 'Preview'],
    ['Upgrade để mở khóa', 'Upgrade to unlock'],
    ['Upgrade để sử dụng', 'Upgrade to use'],
]);

// ═══════════════════════════════════════════════════════
// SetupTab.tsx (3 lines)
// ═══════════════════════════════════════════════════════
total += r('components/pricing/SetupTab.tsx', [
    ["'Luỹ tiến'", "'Progressive'"],
    ['>Luỹ tiến - Progressive<', '>Progressive<'],
    ['>Cộng dồn - Additive<', '>Additive<'],
]);

// ═══════════════════════════════════════════════════════
// 2-line files
// ═══════════════════════════════════════════════════════
total += r('components/settings/OrgContextBadge.tsx', [
    ['Đang tải thông tin tổ chức...', 'Loading organization info...'],
    ['Quản lý Organization →', 'Manage Organization →'],
]);

total += r('components/payments/PaymentMethodModal.tsx', [
    ['Đơn hàng sẽ hết hạn sau 30 phút. Sau khi chuyển khoản, hệ thống sẽ tự động kích hoạt gói.', 'Order expires after 30 minutes. After transfer, the system will automatically activate your plan.'],
    ['Hoàn tất', 'Complete'],
]);

total += r('app/analytics/page.tsx', [
    ['Đang chuyển hướng...', 'Redirecting...'],
]);

total += r('tests/pricing-golden.test.ts', [
    ["'cao hơn'", "'higher'"],
    ['cao hơn', 'higher'],
]);

total += r('components/pricing/OTAConfigTab.tsx', [
    ['Thêm kênh OTA', 'Add OTA Channel'],
    ['>Hủy<', '>Cancel<'],
]);

total += r('components/pricing/RoomTypesTab.tsx', [
    ['Thêm room type', 'Add room type'],
    ['>Hủy<', '>Cancel<'],
]);

total += r('components/pricing/SeasonConfigPanel.tsx', [
    ['> Thêm<', '> Add<'],
    ['>Lưu<', '>Save<'],
]);

total += r('components/payments/PayPalCheckout.tsx', [
    ['Thanh toán 1 lần qua PayPal. Bạn sẽ được chuyển đến PayPal để xác nhận.', 'One-time payment via PayPal. You will be redirected to PayPal for confirmation.'],
    ['Đăng ký thanh toán tự động hàng tháng qua PayPal.', 'Subscribe to monthly auto-payment via PayPal.'],
]);

total += r('app/dashboard/layout.tsx', [
    ['Sidebar giữ xanh', 'Sidebar stays blue'],
    ['Main content nền SÁNG', 'Main content light bg'],
]);

total += r('app/auth/login/page.tsx', [
    ['Glass Card - tiếp brand', 'Glass Card - brand continuation'],
    ['Logo - với nền xanh brand để tiếp mầu logo JPG', 'Logo - with brand blue bg to match JPG logo'],
]);

total += r('app/welcome/page.tsx', [
    ["data.error || 'Có lỗi xảy ra'", "data.error || 'An error occurred'"],
    ["'thành viên'", "'member'"],
]);

total += r('app/payment/success/page.tsx', [
    ['Gói ', ''],  // will be handled carefully below
]);

total += r('app/payment/cancel/page.tsx', [
    ['Thanh toán đã hủy', 'Payment Cancelled'],
    ['Giao dịch chưa được hoàn tất. Bạn có thể thử lại bất cứ lúc nào.', 'Transaction was not completed. You can try again at any time.'],
]);

total += r('components/analytics/DataQualityBadge.tsx', [
    ['STLY dòng nearest DOW', 'STLY nearest DOW rows'],
    ['Thiếu snapshot nên pace/pickup chưa đầy đủ. Kết quả chỉ mang tính tham khảo.', 'Missing snapshots so pace/pickup is incomplete. Results are for reference only.'],
]);

total += r('components/billing/PromoRedeemCard.tsx', [
    ["'Lỗi kết nối. Vui lòng thử lại.'", "'Connection error. Please try again.'"],
    ['>Kiểm tra<', '>Verify<'],
]);

total += r('components/dashboard/RecommendationTable.tsx', [
    ['>Ngày<', '>Date<'],
    ['>Thao tác<', '>Actions<'],
]);

total += r('components/dashboard/OtbChart.tsx', [
    ['OTB so với năm trước', 'OTB vs Last Year'],
    ["Last Year {!hasStlyData && '(chưa có)'}", "Last Year {!hasStlyData && '(none yet)'}"],
]);

total += r('app/onboarding/page.tsx', [
    ['VND - Việt Nam Đồng', 'VND - Vietnamese Dong'],
    ['Việt Nam (GMT+7)', 'Vietnam (GMT+7)'],
]);

// 1-line files
total += r('components/analytics/ForecastAccuracyChart.tsx', [
    ['name="Thực tế"', 'name="Actual"'],
]);

total += r('components/analytics/DodChips.tsx', [
    ['So với hôm qua:', 'Compared to yesterday:'],
]);

total += r('app/rate-shopper/competitors/page.tsx', [
    ['>Tìm<', '>Search<'],
]);

total += r('app/settings/team/page.tsx', [
    ['Create mã mới khác', 'Create a new code'],
]);

total += r('components/shared/LanguageSwitcher.tsx', [
    ["'🇻🇳 Tiếng Việt'", "'🇻🇳 Vietnamese'"],
]);

total += r('app/pricing-plans/layout.tsx', [
    ['Chọn gói phù hợp với hotels của bạn', 'Choose a plan that fits your hotel'],
]);

total += r('app/dashboard/loading.tsx', [
    ['Loading dữ liệu Dashboard...', 'Loading Dashboard data...'],
]);

total += r('components/paywall/RateShopperPaywall.tsx', [
    ['Quét giá tự động hàng days remaining', 'Automatic daily price scanning'],
]);

total += r('components/dashboard/DashboardTabs.tsx', [
    ["'Chưa có'", "'None yet'"],
    ['Xem chi tiết', 'View details'],
]);

total += r('components/dashboard/QuickModePanel.tsx', [
    ["'vi-VN'", "'en-US'"],
    ["+ ' đ'", "+ ' ₫'"],
]);

total += r('components/analytics/SupplyChart.tsx', [
    ['Trống thực tế', 'Actual Empty'],
]);

total += r('app/pricing/page.tsx', [
    ["'Khuyến mãi'", "'Promotions'"],
]);

total += r('components/pricing/OverviewTab.tsx', [
    ['Thu về', 'Net Revenue'],
    ['Hiển thị', 'Display'],
]);

console.log(`\n🎯 FINAL Pass 3: ${total} replacements`);
