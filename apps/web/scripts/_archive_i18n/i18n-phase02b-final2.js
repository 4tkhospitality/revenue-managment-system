/**
 * Phase 02B - FINAL pass 2: Long sentence patterns from data arrays
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

// ═══════════════════════════════════════
// BookingChecklist.tsx — full sentences
// ═══════════════════════════════════════
total += r('components/guide/BookingChecklist.tsx', [
    // DISCLAIMERS
    ['Kết quả tìm kiếm Booking.com được cá nhân hóa theo lịch sử người dùng. Thứ hạng hiển thị khác nhau cho mỗi khách.', 'Booking.com search results are personalized based on user history. Rankings vary for each guest.'],
    ['Con số này là benchmark trung bình từ Booking.com Partner Hub — ước tính, không đảm bảo kết quả cho từng khách sạn.', 'This is an estimated benchmark from Booking.com Partner Hub — not guaranteed for individual hotels.'],
    ['Booking.com hiện tạm dừng integrations mới. Tính năng API sẽ khả dụng khi có quyền truy cập.', 'Booking.com has paused new integrations. API features will be available when access is granted.'],

    // Category titles
    ['📸 Nội dung & Hình ảnh', '📸 Content & Photos'],
    ['💰 Giá & Chính sách', '💰 Price & Policy'],
    ['📅 Tính khả dụng', '📅 Availability'],
    ['⭐ Đánh giá & Uy tín', '⭐ Reviews & Reputation'],

    // Content items
    ['High-quality Photos (≥24 ảnh, ≥2048px)', 'High-quality Photos (≥24 photos, ≥2048px)'],
    ['Booking.com ưu tiên property có nhiều ảnh HD. Property Page Score phần "Photos" ảnh hưởng trực tiếp CTR.', 'Booking.com prioritizes properties with many HD photos. Property Page Score "Photos" section directly affects CTR.'],
    ['Extranet → Property → Photos → Upload ảnh ≥2048px chiều rộng. Cover tất cả room types, facilities, lobby, view.', 'Extranet → Property → Photos → Upload photos ≥2048px width. Cover all room types, facilities, lobby, view.'],
    ['Page Score 100% → tăng đến 18% bookings', 'Page Score 100% → up to 18% more bookings'],
    ['Mô tả property đầy đủ & hấp dẫn', 'Complete & attractive property description'],
    ['Mô tả chi tiết giúp khách hiểu rõ hơn → tăng conversion. Bao gồm USP, location, tiện nghi prominent.', 'Detailed description helps guests understand better → increases conversion. Include USP, location, prominent amenities.'],
    ['Extranet → Property → General Info → Cập nhật description tiếng Anh + Tiếng Việt. Nhấn mạnh điểm khác biệt.', 'Extranet → Property → General Info → Update description in English. Emphasize unique selling points.'],
    ['Cập nhật đầy đủ tiện nghi (Facilities)', 'Complete facilities update'],
    ['Khách filter theo tiện nghi (WiFi, Pool, Parking...). Thiếu = mất lượt hiển thị trong search results.', 'Guests filter by facilities (WiFi, Pool, Parking...). Missing = lost visibility in search results.'],
    ['Extranet → Property → Facilities & Services → Tick all tiện nghi có sẵn. Especially: WiFi, Parking, Pool, Breakfast.', 'Extranet → Property → Facilities & Services → Tick all available amenities. Especially: WiFi, Parking, Pool, Breakfast.'],

    // Pricing items
    ['Ensure rate parity (giá đồng nhất)', 'Ensure rate parity (consistent pricing)'],
    ['Booking.com penalize property có giá cao hơn các OTA khác hoặc website trực tiếp. Rate parity affects ranking.', 'Booking.com penalizes properties priced higher than other OTAs or direct websites. Rate parity affects ranking.'],
    ['So sánh giá trên Booking vs Agoda vs website. Dùng RMS Rate Shopper để monitor. Ensure giá Booking ≤ giá kênh khác.', 'Compare prices on Booking vs Agoda vs website. Use RMS Rate Shopper to monitor. Ensure Booking price ≤ other channels.'],
    ['Chính sách hủy linh hoạt', 'Flexible cancellation policy'],
    ['Booking.com confirmed: cancellation policy affects ranking. Free cancellation option tăng conversion đáng kể.', 'Booking.com confirmed: cancellation policy affects ranking. Free cancellation option significantly increases conversion.'],
    ['Extranet → Rates & Availability → Rate Plans → Thêm rate plan "Free Cancellation" (hủy miễn phí trước X days).', 'Extranet → Rates & Availability → Rate Plans → Add "Free Cancellation" rate plan (free cancel before X days).'],
    ['Competitive Pricing trong thị trường', 'Competitive market pricing'],
    ['Pricing là driver chính của conversion. Khách so sánh giá với các property tương tự trong khu vực.', 'Pricing is the main conversion driver. Guests compare prices with similar properties in the area.'],
    ['Dùng RMS So sánh giá để xem location giá. Điều chỉnh giá theo demand (RMS Dashboard khuyến nghị).', 'Use RMS Price Comparison to see area pricing. Adjust prices based on demand (RMS Dashboard recommendations).'],

    // Availability items
    ['Open availability ≥12 month tới', 'Open availability ≥12 months ahead'],
    ['Booking.com ưu tiên property có availability dài hạn. Khách book sớm sẽ thấy property của bạn trong kết quả.', 'Booking.com prioritizes properties with long-term availability. Early bookers will see your property in results.'],
    ['Extranet → Rates & Availability → Calendar → Mở availability ít nhất 12 month tới. Close dates chỉ khi thật sự full.', 'Extranet → Rates & Availability → Calendar → Open availability at least 12 months ahead. Close dates only when truly full.'],
    ['Giữ rooms cho last-minute bookings', 'Keep rooms for last-minute bookings'],
    ['Đừng close hết inventory khi còn 1-2 days. Last-minute travelers là phân khúc có sẵn demand.', "Don't close all inventory 1-2 days out. Last-minute travelers are a segment with ready demand."],
    ['Giữ tối thiểu 1-2 room types mở cho booking trong 48h tới nếu còn rooms trống.', 'Keep at least 1-2 room types open for booking in the next 48h if rooms are available.'],

    // Reputation items
    ['Review score là driver mạnh cho cả CTR và conversion. Booking.com dùng hệ thống tính điểm có weight — đánh giá mới ảnh hưởng nhiều hơn.', 'Review score strongly drives both CTR and conversion. Booking.com uses a weighted scoring system — newer reviews have more impact.'],
    ['Extranet → Guest Reviews → Trả lời 100% reviews. Cải thiện dịch vụ dựa trên feedback. Dùng RMS Review Calculator để mô phỏng.', 'Extranet → Guest Reviews → Reply to 100% of reviews. Improve service based on feedback. Use RMS Review Calculator to simulate.'],
    ['Trả lời 100% đánh giá (đặc biệt negative)', 'Reply to 100% of reviews (especially negative)'],
    ['Reply Score là thành phần của Property Page Score. Trả lời professionally cho đánh giá tiêu cực tăng uy tín.', 'Reply Score is a component of Property Page Score. Professional replies to negative reviews build credibility.'],
    ['Extranet → Guest Reviews → Reply to ALL reviews trong 24-48h. Negative reviews: thank + giải pháp cụ thể.', 'Extranet → Guest Reviews → Reply to ALL reviews within 24-48h. Negative reviews: thank + specific solution.'],

    // Programs items
    ['Tham gia Genius Program', 'Join Genius Program'],
    ['Genius giúp property hiện lên cho nhóm khách "Genius travelers" — chiếm phần lớn bookings trên Booking.com.', 'Genius helps your property appear for "Genius travelers" — making up the majority of Booking.com bookings.'],
    ['Extranet → Opportunities → Genius → Enroll. Level 1: Discount ≥10% cho Genius members. Level 2-3: thêm perks (breakfast, upgrade).', 'Extranet → Opportunities → Genius → Enroll. Level 1: Discount ≥10% for Genius members. Level 2-3: add perks (breakfast, upgrade).'],
    ['Đạt trạng thái Preferred Partner', 'Achieve Preferred Partner status'],
    ['Preferred Partner được hiển thị badge thumbs-up và ưu tiên trong ranking. Yêu cầu: performance tốt + thêm commission.', 'Preferred Partner gets a thumbs-up badge and ranking priority. Requirements: good performance + additional commission.'],
    ['Extranet → Opportunities → Preferred Partner Programme → Enroll nếu đủ điều kiện (review score, conversion rate...).', 'Extranet → Opportunities → Preferred Partner Programme → Enroll if eligible (review score, conversion rate...).'],
    ['Sử dụng Visibility Booster (lúc low demand)', 'Use Visibility Booster (during low demand)'],
    ['Visibility Booster tăng commission tạm thời để đổi lấy thứ hạng cao hơn. Hiển thị là "Ad" (advertising trả phí).', 'Visibility Booster temporarily increases commission for higher ranking. Shown as "Ad" (paid advertising).'],
    ['Extranet → Opportunities → Visibility Booster → Bật cho các days cần đẩy (low season, gap dates). Set commission boost %.', 'Extranet → Opportunities → Visibility Booster → Enable for days needing push (low season, gap dates). Set commission boost %.'],
    ['Decrease riêng cho khách book qua app Booking.com. Mobile bookings chiếm phần lớn traffic.', 'Special discount for guests booking via Booking.com app. Mobile bookings make up the majority of traffic.'],
    ['Extranet → Rates & Availability → Mobile Rates → Bật giảm giá ≥10% cho mobile users.', 'Extranet → Rates & Availability → Mobile Rates → Enable ≥10% discount for mobile users.'],

    // Bottom disclaimers
    ['Save ý về Ranking:', 'Note about Ranking:'],
    ['Kết quả tìm kiếm Booking.com được', 'Booking.com search results are'],
    ['cá nhân hóa', 'personalized'],
    ['theo lịch sử mỗi khách.', 'based on each guest\'s history.'],
    ['Không có thứ hạng cố định — hãy theo dõi', 'There is no fixed ranking — track'],
    ['(Search Views, CTR, Conversion, Net Bookings) thay vì position.', '(Search Views, CTR, Conversion, Net Bookings) instead of position.'],
    ['Một số kết quả tìm kiếm trên Booking.com có gắn nhãn', 'Some Booking.com search results are labeled'],
    ['đây là', 'these are'],
    ['advertising trả phí', 'paid advertising'],
    ['Nếu thấy competitor nổi bất thường, they may be using paid placement.', 'If a competitor stands out unusually, they may be using paid placement.'],
]);

// ═══════════════════════════════════════
// PLGAdminDashboard.tsx — long guide text
// ═══════════════════════════════════════
total += r('components/admin/PLGAdminDashboard.tsx', [
    ['>Mô tả</th>', '>Description</th>'],
    ['PLG (Product-Led Growth) là hệ thống quản lý đại lý (Resellers), mã khuyến mại (Promo Codes),', 'PLG (Product-Led Growth) is the system for managing Resellers, Promo Codes,'],
    ['và commission (Commissions). Dưới đây là hướng dẫn chi tiết từng bước.', 'and Commissions. Below is a detailed step-by-step guide.'],
    ['Reseller là ai?', 'Who is a Reseller?'],
    ['Là đối tác giới thiệu khách hàng (hotels) sử dụng hệ thống RMS.', 'A partner who refers hotels to use the RMS system.'],
    ['Mỗi reseller được cấp một', 'Each reseller is assigned a'],
    ['(mã giới thiệu) tự động, dùng để tracking attribution.', '(referral code) automatically, used for tracking attribution.'],
    ['Create Reseller mới', 'Create new Reseller'],
    ['Bấm nút', 'Click the button'],
    ['+ Thêm Reseller', '+ Add Reseller'],
    ['Điền tên, email, SĐT', 'Enter name, email, phone'],
    ['Bấm', 'Click'],
    ['Tạo', 'Create'],
    ['Hệ thống tự sinh mã Ref Code (VD:', 'System auto-generates Ref Code (e.g.:'],
    ['Sửa thông tin Reseller', 'Edit Reseller info'],
    ['Bấm icon', 'Click icon'],
    ['✏️ bút chì', '✏️ pencil'],
    ['trên dòng reseller cần sửa', 'on the reseller row to edit'],
    ['Thay đổi tên hoặc email', 'Change name or email'],
    ['✅ Lưu', '✅ Save'],
    ['Bật/Tắt trạng thái Active', 'Toggle Active status'],
    ['Bấm vào badge', 'Click the badge'],
    ['hoặc', 'or'],
    ['Reseller inactive sẽ không còn hoạt động nhưng dữ liệu vẫn được giữ.', 'Inactive resellers stop working but data is preserved.'],
    ['Xóa Reseller (Soft Delete)', 'Delete Reseller (Soft Delete)'],
    ['🗑️ thùng rác', '🗑️ trash'],
    ['Xác nhận', 'Confirm'],
    ['Reseller chuyển thành Inactive.', 'Reseller changes to Inactive.'],
    ['Hiển thị lịch sử tất cả giao dịch', 'Shows all transaction history'],
    ['Bao gồm loại, tỷ lệ, số tiền, mô tả', 'Including type, rate, amount, description'],
    ['Cung cấp tên, email', 'Provide name, email'],
    ['Nhận Ref Code tự động', 'Get auto-generated Ref Code'],
]);

// ═══════════════════════════════════════
// upload/page.tsx — data upload page
// ═══════════════════════════════════════
total += r('app/upload/page.tsx', [
    ['Import báo cáo đặt rooms từ PMS', 'Import room booking reports from PMS'],
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
    ['Upload báo cáo "Reservation Booked On Date" từ PMS. Chọn nhiều file cùng lúc (Ctrl+Click hoặc kéo thả).', 'Upload "Reservation Booked On Date" reports from PMS. Select multiple files (Ctrl+Click or drag & drop).'],
    ['Upload báo cáo "Reservation Cancelled" từ PMS. Chọn nhiều file cùng lúc.', 'Upload "Reservation Cancelled" reports from PMS. Select multiple files.'],
]);

// ═══════════════════════════════════════
// PromotionsTab.tsx — remaining partial matches
// ═══════════════════════════════════════
total += r('components/pricing/PromotionsTab.tsx', [
    ['Thêm khuyến mại', 'Add Promotion'],
    ['Click to add khuyến mại', 'Click to add promotion'],
    ['Tên khuyến mại', 'Promotion Name'],
    ['Khuyến mại', 'Promotion'],
    ['khuyến mại', 'promotion'],
    ['Chưa có khuyến mại nào - Click to add', 'No promotions yet - Click to add'],
    ['Chọn chương trình khuyến mại từ danh mục có sẵn', 'Select promotion from catalog'],
    ['Giá trước khuyến mại', 'Price before promotions'],
    ['Cộng commission OTA', 'Add OTA commission'],
    ['Giá khách thấy trên OTA', 'Price guest sees on OTA'],
    ['Giá tước khuyến mại', 'Price before promotions'],
    ['Nhân progressive', 'Multiply progressive'],
    ['>đ<', '>₫<'],
    ['Step 2: Cộng', 'Step 2: Add'],
    ['Step 3:', 'Step 3:'],
]);

// ═══════════════════════════════════════
// guide/page.tsx — remaining VN in long table cells
// ═══════════════════════════════════════
total += r('app/guide/page.tsx', [
    ['Số phòng còn trống có thể bán', 'Number of available rooms for sale'],
    ['Data Quality: có cảnh báo không?', 'Data Quality: any warnings?'],
    ['dư phòng Y%', 'remaining rooms Y%'],
    ['Giá cơ bản, mùa thường', 'Base price, normal season'],
    ['Giá cao hơn, mùa cao điểm', 'Higher price, peak season'],
    ['Giá cao nhất, lễ/tết', 'Highest price, holidays'],
    ['giữ giá gốc', 'keep base price'],
    ['tăng giá mạnh hơn', 'increase price more'],
    ['giá cao nhất', 'highest price'],
    ['Luỹ tiến (mặc định)', 'Progressive (default)'],
    ['Cộng dồn', 'Additive'],
]);

// ═══════════════════════════════════════
// AgodaChecklist.tsx — remaining
// ═══════════════════════════════════════  
total += r('components/guide/AgodaChecklist.tsx', [
    ['trung bình cộng x 2 (thang 10)', 'average score × 2 (scale of 10)'],
    ['Mỗi review có weight như nhau (khác Booking.com)', 'Each review has equal weight (unlike Booking.com)'],
    ['Tỷ lệ trả lời review ảnh hưởng ranking', 'Review reply rate affects ranking'],
    ['Reply to nhanh (24-48h) và professionally', 'Reply quickly (24-48h) and professionally'],
    ['Kiểm tra daily', 'Check daily'],
    ['Ensure giá Agoda ≤ giá kênh khác', 'Ensure Agoda price ≤ other channels'],
    ['Dùng RMS So sánh giá', 'Use RMS Price Comparison'],
    ['hiển thị trong nhiều search results hơn', 'shown in more search results'],
    ['Mở ít nhất 12 tháng', 'Open at least 12 months'],
    ['Ensure tất cả room types đều có rate plan active', 'Ensure all room types have active rate plans'],
    ['Set mức commission boost', 'Set commission boost level'],
    ['Monitor ROI qua YCS dashboard hoặc RMS ROI Engine', 'Monitor ROI via YCS dashboard or RMS ROI Engine'],
    ['ROI tính trên departed bookings / departed room nights', 'ROI calculated on departed bookings / departed room nights'],
    ['kết quả tìm kiếm Agoda', 'Agoda search results'],
    ['Set budget hằng days + bid', 'Set daily budget + bid'],
    ['Bắt đầu nhỏ, monitor ROI', 'Start small, monitor ROI'],
    ['thông tin do BA cung cấp và cross-check với nội dung p', 'information provided by BA and cross-checked with content p'],
    ['cho từng khách sạn', 'for individual hotels'],
    ['(mandatory). Cân nhắc kỹ trước khi đăng ký', '(mandatory). Consider carefully before enrolling'],
    ['property (không phải room). Đảm bảo cover: lobby, pool, restaurant, ext', 'property (not room). Ensure coverage: lobby, pool, restaurant, ext'],
    ['ảnh/room type. Chụp góc rộng, ánh sáng tự nhiên', 'photos/room type. Wide angle shots, natural light'],
    ['từ tiếng Anh. Nhấn mạnh USP, vị trí, trải nghiệm đặc biệt', 'in English. Emphasize USP, location, unique experiences'],
    ['(BA-verified). Trang gốc trả về 403', '(BA-verified). Original page returns 403'],
    ['Tiến độ thực hiện', 'Implementation Progress'],
]);

// ═══════════════════════════════════════
// admin/users/page.tsx
// ═══════════════════════════════════════
total += r('app/admin/users/page.tsx', [
    ['Quản lý Users', 'User Management'],
    ['Đang tải...', 'Loading...'],
    ['Trial sắp hết', 'Trial expiring'],
    ['Vượt', 'Exceeds'],
    ['Chọn gói để kích hoạt subscription cho hotel này', 'Select plan to activate subscription for this hotel'],
    ['phòng', 'rooms'],
    ['tháng', 'months'],
    ['Đang tải', 'Loading'],
]);

// ═══════════════════════════════════════
// DynamicPricingTab.tsx — remaining 5
// ═══════════════════════════════════════
total += r('components/pricing/DynamicPricingTab.tsx', [
    ['Điều chỉnh: +', 'Adjustment: +'],
    ['(giữ nguyên)', '(unchanged)'],
    ['OTB (tự động)', 'OTB (automatic)'],
    ["'Không có dữ liệu'", "'No data'"],
    ['Nguồn:', 'Source:'],
    ['Không có dữ liệu', 'No data'],
]);

// ═══════════════════════════════════════
// OccTierEditor.tsx
// ═══════════════════════════════════════
total += r('components/pricing/OccTierEditor.tsx', [
    ['Chưa lưu thay đổi', 'Unsaved changes'],
    ['ngoài 0.5-3.0', 'outside 0.5-3.0'],
    ['Đã lưu thành công', 'Saved successfully'],
    ['Lưu bậc OCC', 'Save OCC Tiers'],
    ['Bậc công suất', 'Occupancy Tiers'],
]);

// ═══════════════════════════════════════
// Various analytics & misc
// ═══════════════════════════════════════
total += r('components/analytics/types.ts', [
    // These short strings like 'ngày', 'tháng', 'phòng' might be inside comments or type definitions
    ['// ngày', '// day'],
    ['// tháng', '// month'],
    ['// phòng', '// room'],
    ['ngày lưu trú', 'stay date'],
    ['ngày đặt', 'booking date'],
    ['số phòng', 'room count'],
    ['dự báo', 'forecast'],
    ['thực tế', 'actual'],
    ['chênh lệch', 'variance'],
]);

total += r('components/analytics/BuildFeaturesInline.tsx', [
    ['Đang build features', 'Building features'],
    ['Build thành công', 'Build successful'],
    ['Build thất bại', 'Build failed'],
    ['Đang xử lý...', 'Processing...'],
    ['Chạy lại', 'Run again'],
]);

total += r('components/analytics/CancelForecastChart.tsx', [
    ['Dự báo hủy phòng', 'Cancellation Forecast'],
    ['phòng dự kiến hủy', 'rooms expected to cancel'],
    ['Chưa có dữ liệu', 'No data'],
    ['Thực tế', 'Actual'],
    ['Dự báo', 'Forecast'],
]);

total += r('components/guide/WhenToBoost.tsx', [
    ['quyết định', 'decision'],
    ['Kỳ vọng', 'Expected'],
    ['doanh thu', 'revenue'],
    ['tăng giá', 'increase price'],
    ['giảm giá', 'decrease price'],
]);

total += r('components/AuditTeaser.tsx', [
    ['Dữ liệu hợp lệ', 'Data Valid'],
    ['Có lỗi cần sửa', 'Errors Need Fixing'],
    ['dòng dữ liệu', 'data rows'],
    ['lỗi nghiêm trọng', 'critical errors'],
]);

total += r('components/paywall/TierPaywall.tsx', [
    ['Nâng cấp để mở khóa', 'Upgrade to unlock'],
    ['yêu cầu gói', 'requires plan'],
    ['Nâng cấp ngay', 'Upgrade now'],
]);

total += r('components/dashboard/TopAccountsTable.tsx', [
    ['Tên khách', 'Guest Name'],
    ['Số đêm', 'Nights'],
    ['Tổng chi tiêu', 'Total Spending'],
    ['Xem tất cả', 'View all'],
]);

total += r('components/dashboard/AccountDetailModal.tsx', [
    ['Chi tiết tài khoản', 'Account Details'],
    ['Lịch sử đặt phòng', 'Booking History'],
    ['Tổng chi tiêu', 'Total Spending'],
    ['Lần cuối', 'Last Visit'],
]);

total += r('app/data/DeleteByMonthButton.tsx', [
    ["'XOA DỮ LIỆU'", "'DELETE DATA'"],
    ['XOA DỮ LIỆU', 'DELETE DATA'],
    ['Xóa dữ liệu', 'Delete data'],
]);

total += r('components/admin/PricingTab.tsx', [
    ['Chỉnh sửa', 'Edit'],
    ['Tạo mới', 'Create'],
    ['Cập nhật', 'Update'],
    ['Đang lưu...', 'Saving...'],
    [' tháng', ' months'],
    ['phòng', 'rooms'],
]);

console.log(`\n🎯 FINAL Pass 2: ${total} replacements`);
