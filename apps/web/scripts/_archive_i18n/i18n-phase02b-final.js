/**
 * Phase 02B - FINAL cleanup: Every remaining VN string
 * Exact patterns extracted from line-level scan of all 71 files
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

// ═════════════════════════════════
// BookingChecklist.tsx (53 remaining)
// ═════════════════════════════════
total += r('components/guide/BookingChecklist.tsx', [
    // Data array items - these are the actual checklist items with VN descriptions
    [`'→→ Content Score (Điểm nội dung)'`, `'→→ Content Score'`],
    [`Điểm nội dung`, `Content Score`],
    [`Ảnh chất lượng cao`, `High-quality Photos`],
    [`trọng số`, `weight`],
    [`ảnh property`, `property photos`],
    [`ảnh phòng`, `room photos`],
    [`mô tả chi tiết`, `detailed description`],
    [`tiện nghi đầy đủ`, `complete amenities`],
    [`Đánh giá khách hàng`, `Guest Reviews`],
    [`Duy trì Review Score`, `Maintain Review Score`],
    [`Trả lời đánh giá`, `Reply to reviews`],
    [`Tỷ lệ trả lời`, `Reply rate`],
    [`ảnh hưởng ranking`, `affects ranking`],
    [`Giá & Tính khả dụng`, `Price & Availability`],
    [`Giá cạnh tranh`, `Competitive Pricing`],
    [`Rate Intelligence`, `Rate Intelligence`],
    [`Mở bán`, `Open availability`],
    [`Chương trình`, `Programs`],
    [`Visibility Booster`, `Visibility Booster`],
    [`Preferred Partner`, `Preferred Partner`],
    [`Genius Program`, `Genius Program`],
    [`Commission tăng`, `Increased commission`],
    [`Content Score tối thiểu`, `Minimum Content Score`],
    [`từ Booking Partner Hub`, `from Booking Partner Hub`],
    [`Upload ảnh HD`, `Upload HD photos`],
    [`Đảm bảo`, `Ensure`],
    [`Kiểm tra daily`, `Check daily`],
    [`Đăng ký`, `Enroll`],
    [`Trả lời ALL`, `Reply ALL`],
    [`cảm ơn`, `thank`],
    [`xin lỗi`, `apologize`],
    [`mời quay lại`, `invite to return`],
    [`visibility tăng`, `visibility increases`],
    [`chuyên nghiệp`, `professionally`],
    [`Cách làm`, `How to`],
    [`Nguồn`, `Source`],
    [`action plan cụ thể`, `specific action plan`],
    [`góc rộng`, `wide angle`],
    [`ánh sáng tự nhiên`, `natural light`],
    [`nổi bật`, `prominent`],
    [`giường`, `bed`],
    [`phòng tắm`, `bathroom`],
    [`vị trí`, `location`],
    [`trải nghiệm`, `experience`],
    [`nhấn mạnh USP`, `emphasize USP`],
    [`đối thủ`, `competitor`],
    [`Tick tất cả`, `Tick all`],
    [`Đặc biệt`, `Especially`],
    [`quảng cáo`, `advertising`],
    [`ngày`, `day`],
    [`tháng`, `month`],
    [`phòng`, `room`],
    [`từ khóa`, `keyword`],
]);

// ═════════════════════════════════
// PLGAdminDashboard.tsx (43 remaining)
// ═════════════════════════════════
total += r('components/admin/PLGAdminDashboard.tsx', [
    [`VD: Hotel trả`, `E.g.: Hotel pays`],
    [`/tháng, rate = `, `/month, rate = `],
    [`Reseller nhận:`, `Reseller receives:`],
    [`Tạo Reseller (Tab Resellers)`, `Create Reseller (Tab Resellers)`],
    [`Tạo Promo Code cho Reseller (Tab Promo Codes)`, `Create Promo Code for Reseller (Tab Promo Codes)`],
    [`Loại RESELLER, gắn vào reseller vừa tạo`, `Type RESELLER, link to the reseller just created`],
    [`Reseller chia sẻ mã cho khách hàng`, `Reseller shares code with customers`],
    [`Hotel nhập mã khi đăng ký → Tự động attribution`, `Hotel enters code at signup → Auto attribution`],
    [`Hotel áp dụng mã → Nhận giảm giá`, `Hotel applies code → Receives discount`],
    [`Hệ thống ghi nhận redemption, tính discount`, `System records redemption, calculates discount`],
    [`Khi hotel thanh toán → Commission cho reseller`, `When hotel pays → Commission for reseller`],
    [`Reseller và Promo chỉ bị deactivate, không xóa khỏi database. Điều này bảo toàn lịch sử và `, `Reseller and Promo are only deactivated, not deleted from database. This preserves history and `],
    [`Mỗi reseller có 1 mã ref code cố định, không thể thay đổi sau khi tạo.`, `Each reseller has a fixed ref code that cannot be changed after creation.`],
    [`Mỗi thao tác (tạo, sửa, xóa) đều được ghi nhận vào audit log để truy vết.`, `Every action (create, edit, delete) is recorded in audit log for tracking.`],
    [`Chỉ user đã đăng nhập với quyền admin mới truy cập được trang này.`, `Only logged-in admin users can access this page.`],
    [` Hiển thị lịch sử tất cả giao dịch hoa hồng. Bao gồm loại, tỷ lệ, số tiền, mô tả,`, ` Shows all commission transaction history. Including type, rate, amount, description,`],
    [`Cung cấp tên, email → Nhận Ref Code tự động`, `Provide name, email → Get auto-generated Ref Code`],
    [`hoa hồng`, `commission`],
    [`Cách tính`, `How it's calculated`],
    [`Tab này hiện tại`, `This tab currently`],
]);

// ═════════════════════════════════
// upload/page.tsx (40 remaining)
// ═════════════════════════════════
total += r('app/upload/page.tsx', [
    [`Tải lên dữ liệu`, `Upload Data`],
    [`Kéo thả file`, `Drag & drop file`],
    [`hoặc bấm để chọn`, `or click to select`],
    [`Đang xử lý`, `Processing`],
    [`thành công`, `successful`],
    [`thất bại`, `failed`],
    [`Chọn khách sạn`, `Select Hotel`],
    [`Hỗ trợ`, `Supported`],
    [`Tải template`, `Download template`],
    [`Xử lý xong`, `Processing complete`],
    [`dòng đã import`, `rows imported`],
    [`dòng bị skip`, `rows skipped`],
    [`Lịch sử upload`, `Upload History`],
    [`Đang tải file`, `Loading file`],
    [`Chưa chọn khách sạn`, `No hotel selected`],
    [`đã xử lý`, `processed`],
    [`cảnh báo`, `warnings`],
    [`Lần cuối upload`, `Last upload`],
    [`Chưa có lịch sử`, `No upload history`],
    [`Đang upload`, `Uploading`],
    [`Vui lòng`, `Please`],
    [`chọn file`, `select a file`],
    [`hàng đã nhập`, `rows imported`],
    [`Tải lên`, `Upload`],
    [`Chưa có dữ liệu upload`, `No upload data`],
    [`Xem chi tiết`, `View details`],
    [`Ấn vào đây`, `Click here`],
    [`để tải template`, `to download template`],
    [`File format`, `File format`],
    [`file hợp lệ`, `valid file`],
    [`Đang gửi`, `Sending`],
    [`Gửi`, `Send`],
    [`Xóa`, `Delete`],
    [`Tạo mới`, `Create new`],
    [`đăng nhập`, `sign in`],
    [`dữ liệu`, `data`],
    [`khách sạn`, `hotel`],
    [`Chọn file`, `Select file`],
    [`Kéo thả`, `Drag & drop`],
    [`hoặc chọn file`, `or select file`],
]);

// ═════════════════════════════════
// guide/page.tsx (36 remaining)
// ═════════════════════════════════
total += r('app/guide/page.tsx', [
    [`Revenue Management là gì?`, `What is Revenue Management?`],
    [`dư phòng`, `remaining rooms`],
    [`OTB X%, dư phòng Y%`, `OTB X%, remaining Y%`],
    [`Open tab Giá Linh Hoạt`, `Open Dynamic Pricing tab`],
    [`Mùa (Seasons)`, `Seasons`],
    [`+ Thêm`, `+ Add`],
    [`khoảng ngày`, `date range`],
    [`chọn ngày bắt đầu và kết thúc`, `select start and end dates`],
    [`Giá cơ bản, mùa thường`, `Base price, normal season`],
    [`Giá cao hơn, mùa cao điểm`, `Higher price, peak season`],
    [`Giá cao nhất, lễ/tết`, `Highest price, holidays`],
    [`VD: occupancy < 35%, giữ giá gốc`, `E.g.: occupancy < 35%, keep base price`],
    [`VD: 35-65%, tăng ×1.10`, `E.g.: 35-65%, increase ×1.10`],
    [`VD: 65-85%, tăng giá mạnh hơn`, `E.g.: 65-85%, increase price more`],
    [`VD: > 85%, giá cao nhất`, `E.g.: > 85%, highest price`],
    [`1.000.000đ`, `1,000,000₫`],
    [`1.250.000đ`, `1,250,000₫`],
    [`1.062.500đ`, `1,062,500₫`],
    [`1.250.000 `, `1,250,000 `],
    [`875.000đ`, `875,000₫`],
    [`700.000đ`, `700,000₫`],
    [`1.000.000đ`, `1,000,000₫`],
    [`Luỹ tiến (mặc định)`, `Progressive (default)`],
    [`Cộng dồn`, `Additive`],
    [`Open file CSV bằng Excel hoặc Google Sheets → In ra cho team Front Desk hoặc gửi cho Sales Manager để cập nhật giá lên OTA.`, `Open CSV file in Excel or Google Sheets → Print for Front Desk team or send to Sales Manager to update OTA prices.`],
    [`Import dữ liệu`, `Import Data`],
    [`Open trang Dữ liệu`, `Open Data page`],
    [`Chạy từng bước`, `Run step by step`],
    [`đồng bộ dữ liệu`, `sync data`],
    [`phân tích`, `analysis`],
    [`dự báo`, `forecast`],
]);

// ═════════════════════════════════
// DynamicPricingTab.tsx (31 remaining)
// ═════════════════════════════════
total += r('components/pricing/DynamicPricingTab.tsx', [
    [`'Giá thu về thấp nhất'`, `'Lowest Net Revenue'`],
    [` vi phạm guardrail`, ` guardrail violations`],
    [` vi phạm khác`, ` more violations`],
    [`Đang tính giá...`, `Calculating prices...`],
    [`Tổng quan hiện tại`, `Current Overview`],
    [`Công suất room`, `Room occupancy`],
    [`OTB (tự động)`, `OTB (automatic)`],
    [`Không có dữ liệu`, `No data`],
    [`placeholder="Nhập OCC %"`, `placeholder="Enter OCC %"`],
    [`Mùa vụ`, `Season`],
    [`Tự động theo cấu hình`, `Auto from config`],
    [`Override thủ công`, `Manual override`],
    [`Reset về auto`, `Reset to auto`],
    [`Bậc giá hiện tại`, `Current Price Tier`],
    [`Điều chỉnh:`, `Adjustment:`],
    [`(giữ nguyên)`, `(unchanged)`],
    [`Không xác định`, `Unknown`],
    [`Kênh OTA`, `OTA Channel`],
    [`Discount giá hiệu lực`, `Effective price discount`],
    [`Trung bình:`, `Average:`],
    [`Configuration Mùa & Bậc giá`, `Season & Price Tier Configuration`],
    [`Giá thu về thấp nhất`, `Lowest Net Revenue`],
    [`Click để xem chi tiết`, `Click for details`],
    [`Phân tích giá`, `Price Analysis`],
    [` đ`, ` ₫`],
    [`+ Cộng thêm`, `+ Add (Fixed)`],
    [`x Multiplier`, `× Multiplier`],
    [`BAR = Display (không có khuyến mại)`, `BAR = Display (no promotions)`],
    [`Thiết lập season và occupancy tiers cho khách sạn`, `Set up seasons and occupancy tiers for your hotel`],
    [`Dòng`, `Row`],
    [`Bấm nút Configuration ở card bên trái để thiết lập bậc giá theo OCC%`, `Click the Configuration button on the left card to set up price tiers by OCC%`],
]);

// ═════════════════════════════════
// PromotionsTab.tsx (25 remaining)
// ═════════════════════════════════
total += r('components/pricing/PromotionsTab.tsx', [
    [`lũy tiến`, `progressive`],
    [`luỹ tiến`, `progressive`],
    [`Lũy tiến`, `Progressive`],
    [`deal cao nhất`, `highest deal`],
    [`cộng dồn`, `additive`],
    [`Cộng dồn`, `Additive`],
    [`không KM`, `no promos`],
    [`Member tiết kiệm`, `Member saves`],
    [`rẻ hơn`, `cheaper`],
    [`hoa hồng`, `commission`],
    [`Hoa hồng`, `Commission`],
    [`tiền thu về`, `net revenue`],
    [`Tiền thu về`, `Net Revenue`],
    [`Commission rất cao`, `Commission very high`],
    [`kiểm tra lại`, `please verify`],
    [`Tất cả quy tắc đều đạt`, `All rules passed`],
    [`Giải thích cách tính`, `Pricing Explained`],
    [`Bước `, `Step `],
    [`Giá gốc`, `Base Price`],
    [`Cộng hoa hồng`, `Add commission`],
    [`Xóa promotion này?`, `Delete this promotion?`],
    [`Chưa có hạng phòng`, `No room types`],
    [`Vui lòng thêm`, `Please add`],
    [`Nhấn để thêm khuyến mại`, `Click to add promotion`],
    [`Chưa có khuyến mại nào`, `No promotions yet`],
    [`Nhấn để thêm`, `Click to add`],
    [`Giá phòng mà khách sạn muốn thu về`, `Room price the hotel wants to receive`],
    [`Giá trước khuyến mại`, `Price before promotions`],
    [`KM bị loại bỏ`, `Promos excluded`],
    [`do quy tắc xếp chồng`, `due to stacking rules`],
    [`Kết quả`, `Result`],
    [`Giá Channel Manager`, `Channel Manager Price`],
    [`Khách thấy trên OTA`, `Guest sees on OTA`],
    [`Khách sạn thu về`, `Hotel receives`],
    [`Tổng giảm giá`, `Total discount`],
    [`tối đa 80%`, `max 80%`],
    [`Chọn hạng phòng để xem`, `Select room type to view`],
    [`số liệu cụ thể`, `detailed pricing`],
    [`Nhập giá thu về mong muốn`, `Enter desired net revenue`],
    [`Nhập giá BAR`, `Enter BAR price`],
    [`Nhập giá khách thấy trên OTA`, `Enter price guest sees on OTA`],
    [`Tìm kiếm chương trình`, `Search promotions`],
    [`Không tìm thấy chương trình`, `No promotions found`],
    [`Thử tìm kiếm với từ khóa khác`, `Try different keywords`],
    [`Tên khuyến mại`, `Promotion Name`],
    [`Giảm giá`, `Discount`],
    [`Trạng thái`, `Status`],
    [`Thao tác`, `Actions`],
    [`Chọn chương trình khuyến mại từ danh mục có sẵn`, `Select promotion from catalog`],
    [`Thêm khuyến mại từ catalog`, `Add from catalog`],
    [`tự động loại bỏ`, `automatically exclude`],
    [`cao nhất được áp dụng`, `highest applied`],
    [`Kết hợp với khuyến mại khác`, `Combine with other promotions`],
    [`Agoda tự động bật cộng dồn`, `Agoda auto-enables stacking`],
    [`Campaign không cộng dồn`, `Campaign doesn't stack`],
    [`Tính giá`, `Calculate Price`],
    [`Giá hiển thị`, `Display Price`],
    [`Hạng phòng`, `Room Type`],
]);

// ═════════════════════════════════
// AgodaChecklist.tsx (24 remaining)
// ═════════════════════════════════
total += r('components/guide/AgodaChecklist.tsx', [
    [`trung bình cộng x 2 (thang 10). Mỗi review có weight như nhau (khác Booking.com)`, `average score × 2 (scale of 10). Each review has equal weight (unlike Booking.com)`],
    [`Reply to tất cả reviews. Focus improve: Cleanliness, Location, Staff, Value for Money`, `Reply to all reviews. Focus on improving: Cleanliness, Location, Staff, Value for Money`],
    [`Tỷ lệ trả lời review ảnh hưởng ranking. Reply to nhanh (24-48h) và professionally`, `Review reply rate affects ranking. Reply quickly (24-48h) and professionally`],
    [`Reply ALL. Negative: cảm ơn + xin lỗi + action plan cụ thể. Positive: cảm ơn + mời quay lại`, `Reply ALL. Negative: thank + apologize + specific action plan. Positive: thank + invite to return`],
    [`Giá & Availability`, `Price & Availability`],
    [`Agoda so sánh giá với các OTA khác. Rate parity violation = ranking bị penalize`, `Agoda compares prices with other OTAs. Rate parity violation = ranking gets penalized`],
    [`Kiểm tra daily. Ensure giá Agoda ≤ giá kênh khác. Dùng RMS So sánh giá`, `Check daily. Ensure Agoda price ≤ other channels. Use RMS Price Comparison`],
    [`Availability window dài + all room types = hiển thị trong nhiều search results hơn`, `Long availability window + all room types = shown in more search results`],
    [`Mở ít nhất 12 tháng. Ensure tất cả room types đều có rate plan active`, `Open at least 12 months. Ensure all room types have active rate plans`],
    [`increase commission for higher visibility cao hơn. ROI = revenue from departed bookings / program cost`, `increase commission for higher visibility. ROI = revenue from departed bookings / program cost`],
    [`Enroll. Set mức commission boost. Monitor ROI qua YCS dashboard hoặc RMS ROI Engine`, `Enroll. Set commission boost level. Monitor ROI via YCS dashboard or RMS ROI Engine`],
    [`ROI tính trên departed bookings / departed room nights`, `ROI calculated on departed bookings / departed room nights`],
    [`Paid advertising trên kết quả tìm kiếm Agoda. Pay-per-click model`, `Paid advertising on Agoda search results. Pay-per-click model`],
    [`Set budget hằng days + bid. Bắt đầu nhỏ, monitor ROI`, `Set daily budget + bid. Start small, monitor ROI`],
    [`thông tin do BA cung cấp và cross-check với nội dung p`, `information provided by BA and cross-checked with content p`],
    [`cho từng khách sạn`, `for individual hotels`],
    [`(mandatory). Cân nhắc kỹ trước khi đăng ký`, `(mandatory). Consider carefully before enrolling`],
    [`property (không phải room). Đảm bảo cover: lobby, pool, restaurant, ext`, `property (not room). Ensure coverage: lobby, pool, restaurant, ext`],
    [`ảnh/room type. Chụp góc rộng, ánh sáng tự nhiên`, `photos/room type. Wide angle shots, natural light`],
    [`từ tiếng Anh. Nhấn mạnh USP, vị trí, trải nghiệm đặc biệt`, `in English. Emphasize USP, location, unique experiences`],
    [`WiFi, Parking, Pool, Gym, Spa, Airport Transfer`, `WiFi, Parking, Pool, Gym, Spa, Airport Transfer`],
    [` (BA-verified). Trang gốc trả về 403`, ` (BA-verified). Original page returns 403`],
    [`Tiến độ thực hiện`, `Implementation Progress`],
    [`Cách làm:`, `How to:`],
    [`Nguồn:`, `Source:`],
]);

// ═════════════════════════════════
// AnalyticsPanel.tsx (15 remaining — mixed EN/VN tooltip text)
// ═════════════════════════════════
total += r('components/dashboard/AnalyticsPanel.tsx', [
    // These are partially-translated tooltip strings from the first cleanup
    [`VD: +50% nghĩa là năm nay bán nhiều gấp rưỡi.`, `E.g.: +50% means selling 1.5x more this year.`],
    [`. Ví dụ: +50% nghia là năm nay bán nhiều gấp rưỡi.`, `. E.g.: +50% means selling 1.5x this year.`],
    [`trong 7 days qua. VD: +3.5 nghĩa là mỗi days có thêm 3-4 booking mới.`, `in last 7 days. E.g.: +3.5 means 3-4 new bookings per day.`],
    [`Số 0 = not enough historical data (need at least 2 OTB snapshots 7 days apart days).`, `0 = not enough historical data (need at least 2 OTB snapshots 7 days apart).`],
    [`Đây là inventory còn lại.`, `This is remaining inventory.`],
    [`Phần trăm days có dữ liệu để so sánh với cùng kỳ năm ngoài. 100% = tất cả days đều có data năm ngoái để so.`, `Percentage of days with data for year-over-year comparison. 100% = all days have last year data.`],
    [`days qua (cho days lưu trú đó). VD: +5 nghĩa là so với 7 days trước, days này có thêm 5 booking.`, `days (for that stay date). E.g.: +5 means 5 more bookings vs 7 days ago.`],
    [`Dấu - nghĩa là chưa đủ data lịch sử (need OTB snapshot 7 days trước).`, `Negative = not enough historical data (need OTB snapshot 7 days ago).`],
    [`Số rooms được đặt THÊM trong 3 days gần nhất. Giống T-7 nhưng ngắn hơn hơn, shows recent trends.`, `Rooms booked ADDITIONALLY in last 3 days. Same as T-7 but shorter, shows recent trends.`],
    [`Dương = demand đang tăng gần. Dấu - = chưa đủ data (need OTB snapshot 3 days trước).`, `Positive = demand rising. Negative = not enough data (need OTB snapshot 3 days ago).`],
    [`cho days lưu trú đó (minus cancelled rooms).`, `for that stay date (minus cancelled rooms).`],
    [`Đây là số rooms chắc chắn đã có. Closer to capacity = better.`, `These are confirmed booked rooms. Closer to capacity = better.`],
    [` - rooms sold for days tương ứng năm trước.`, ` - rooms sold for corresponding days last year.`],
    [`+200% = bán gấp 3. -50% = bán ít hơn nửa.`, `+200% = selling 3x more. -50% = selling half.`],
    [`days đó = Tổng rooms - OTB.`, `that day = Total rooms - OTB.`],
    [`7 days tới`, `next 7 days`],
    [`Ngày gần nhất có sẵn:`, `Nearest available date:`],
]);

// ═════════════════════════════════
// settings/team/page.tsx (8 remaining)
// ═════════════════════════════════
total += r('app/settings/team/page.tsx', [
    [`members cho gói hiện tại.`, `members for the current plan.`],
    [`Không thể tạo mã mời`, `Cannot create invite code`],
    [`Đã đổi vai trò thành`, `Role changed to`],
    [`Không thể đổi vai trò`, `Cannot change role`],
    [`members cho gói `, `members for plan `],
    [`Upgrade gói để thêm members →`, `Upgrade plan for more members →`],
    [`Create mã mới khác`, `Create new invite code`],
    [`Chưa có members nào`, `No members yet`],
    [`Mã mời (vai trò:`, `Invite code (role:`],
    [`Hoặc gửi link:`, `Or share link:`],
    [`Đã copy`, `Copied`],
    [`Create mã mới khác`, `Create new code`],
    [`Đã đạt giới hạn`, `Limit reached`],
    [`Đang tạo`, `Creating`],
    [`Create mã mời mới`, `Create invite code`],
    [`Mã mời đang hoạt động`, `Active invite codes`],
    [`Dùng:`, `Used:`],
    [`Hết hạn`, `Expired`],
    [`Thu hồi mã mời`, `Revoke invite code`],
    [`Đang tải`, `Loading`],
    [`(bạn)`, `(you)`],
    [`thành viên`, `member`],
    [`Mã mời không hợp lệ`, `Invalid invite code`],
    [`Không thể kết nối server`, `Cannot connect to server`],
]);

// ═════════════════════════════════
// PaymentHistoryPanel.tsx (12 remaining)
// ═════════════════════════════════
total += r('components/settings/PaymentHistoryPanel.tsx', [
    [`'Thành công'`, `'Completed'`],
    [`'Đang xử lý'`, `'Processing'`],
    [`'Thất bại'`, `'Failed'`],
    [`'Hết hạn'`, `'Expired'`],
    [`'Hoàn tiền'`, `'Refunded'`],
    [`'Zalo (Thủ công)'`, `'Zalo (Manual)'`],
    [`+ 'đ'`, `+ '₫'`],
    [`Đang tải lịch sử thanh toán`, `Loading payment history`],
    [`Không thể tải lịch sử thanh toán`, `Cannot load payment history`],
    [`No transactions yet thanh toán nào`, `No payment transactions yet`],
    [`>Ngày</th>`, `>Date</th>`],
    [`>Mã đơn</th>`, `>Order ID</th>`],
    [` tháng`, ` months`],
]);

// ═════════════════════════════════
// OverviewTab.tsx (10 remaining)
// ═════════════════════════════════
total += r('components/pricing/OverviewTab.tsx', [
    [`'Hạng phòng'`, `'Room Type'`],
    [`'Giá hiển thị (nhập)'`, `'Display Price (input)'`],
    [`'Giá thu về (NET)'`, `'Net Revenue (NET)'`],
    [`' - Thu về'`, `' - Net'`],
    [`' - BAR'`, `' - BAR'`],
    [`' - Hiển thị'`, `' - Display'`],
    [`Đang tính toán...`, `Calculating...`],
    [`Tính lại`, `Recalculate`],
    [`BAR Price (nhập CM)`, `BAR Price (input CM)`],
    [`Hạng phòng`, `Room Type`],
    [`}đ`, `}₫`],
]);

// ═════════════════════════════════
// RateShopperPaywall.tsx (10 remaining)
// ═════════════════════════════════
total += r('components/paywall/RateShopperPaywall.tsx', [
    [`Price Comparison đối thủ`, `Competitor Price Comparison`],
    [`Theo dõi giá đối thủ theo thời gian thực`, `Track competitor prices in real-time`],
    [`Feature này chỉ dành cho gói`, `This feature is only for`],
    [`Gói Suite bao gồm`, `Suite plan includes`],
    [`'Price Comparison với 10+ đối thủ'`, `'Price Comparison with 10+ competitors'`],
    [`'Quét giá tự động hằng days remaining'`, `'Automatic price scanning daily'`],
    [`'Báo cáo phân tích giá thị trường'`, `'Market price analysis reports'`],
    [`'Cảnh báo khi đối thủ giảm giá'`, `'Alerts when competitors drop prices'`],
    [`Upgrade lên Suite`, `Upgrade to Suite`],
    [`Hoặc liên hệ Zalo để được tư vấn`, `Or contact via Zalo for consultation`],
]);

// ═════════════════════════════════
// payment/success/page.tsx (10 remaining)
// ═════════════════════════════════
total += r('app/payment/success/page.tsx', [
    [`Có lỗi xảy ra khi xác nhận thanh toán`, `Error confirming payment`],
    [`Đang xác nhận thanh toán PayPal`, `Confirming PayPal payment`],
    [`Vui lòng chờ trong giây lát. Không đóng trang này.`, `Please wait a moment. Don't close this page.`],
    [`Lỗi xác nhận thanh toán`, `Payment confirmation error`],
    [`Thanh toán có thể đã thành công trên PayPal. Vui lòng liên hệ admin nếu gói chưa được kích hoạt.`, `Payment may have succeeded on PayPal. Please contact admin if plan is not activated.`],
    [`Vào Dashboard`, `Go to Dashboard`],
    ['đã được kích hoạt! Hãy tạo hotels của bạn để bắt đầu.', 'plan activated! Create your hotels to get started.'],
    ['đã được kích hoạt. Bạn có thể bắt đầu sử dụng ngay bây giờ.', 'plan activated. You can start using it now.'],
    ['Gói của bạn', 'Your plan'],
    [`'Gói của bạn đã được kích hoạt. Bạn có thể bắt đầu sử dụng ngay bây giờ.'`, `'Your plan has been activated. You can start using it now.'`],
    [`'Vào Dashboard'`, `'Go to Dashboard'`],
]);

// ═════════════════════════════════
// admin/users/page.tsx (9 remaining)
// ═════════════════════════════════
total += r('app/admin/users/page.tsx', [
    [`Quản lý Users`, `User Management`],
    [`Đang tải`, `Loading`],
    [`Trial sắp hết`, `Trial expiring`],
    [`Vượt`, `Exceeds`],
    [`Chọn gói để kích hoạt subscription cho hotel này`, `Select plan to activate subscription for this hotel`],
]);

// ═════════════════════════════════
// welcome/page.tsx (9 remaining)
// ═════════════════════════════════
total += r('app/welcome/page.tsx', [
    [`Xem Demo`, `View Demo`],
    [`Dành cho người muốn tìm hiểu hệ thống trước`, `For those who want to explore the system first`],
    [`Nhập mã mời`, `Enter invite code`],
    [`Dành cho nhân viên được mời tham gia`, `For staff members invited to join`],
    [`Không thể kết nối server`, `Cannot connect to server`],
    [`Mã mời không hợp lệ`, `Invalid invite code`],
    [`Đang tải`, `Loading`],
]);

// ═════════════════════════════════
// rate-shopper/page.tsx (9 remaining)
// ═════════════════════════════════
total += r('app/rate-shopper/page.tsx', [
    [`Quản lý đối thủ`, `Manage Competitors`],
    [`Add đối thủ`, `Add Competitor`],
    [`Nguồn (OTA)`, `Source (OTA)`],
    [`Giá`, `Price`],
    [`Tin cậy`, `Reliability`],
    [`Mỗi lần quét tiêu 1 credit SerpApi / đối thủ`, `Each scan uses 1 SerpApi credit / competitor`],
    [`Thử lại`, `Retry`],
    [`Thấp`, `Low`],
    [`nguồn giá`, `price sources`],
]);

// ═════════════════════════════════
// auth/login/page.tsx (8 remaining — VN comments)
// ═════════════════════════════════
total += r('app/auth/login/page.tsx', [
    [`// 4TK Brand Colors (từ logo)`, `// 4TK Brand Colors (from logo)`],
    [`// Brand Dark (nền sâu)`, `// Brand Dark (deep background)`],
    [`// Brand Light (viền/hover nhẹ)`, `// Brand Light (border/hover light)`],
    [`{/* Glass Card - tiếp brand */}`, `{/* Glass Card - brand theme */}`],
    [`{/* Logo - với nền xanh brand để tiếp màu logo JPG */}`, `{/* Logo - with brand blue bg to match logo JPG */}`],
    [`{/* Title - text-white cho title chính */}`, `{/* Title - text-white for main title */}`],
    [`{/* Subtitle - dùng text-white/70 (không dùng xám) */}`, `{/* Subtitle - uses text-white/70 (not gray) */}`],
    [`{/* Google Login Button - Trắng chuẩn, nổi bật */}`, `{/* Google Login Button - standard white, prominent */}`],
]);

// ═════════════════════════════════
// invite/page.tsx (7 remaining)
// ═════════════════════════════════
total += r('app/invite/page.tsx', [
    [`thành viên`, `member`],
    [`Mã mời không hợp lệ`, `Invalid invite code`],
    [`Có lỗi xảy ra, vui lòng thử lại`, `An error occurred, please try again`],
    [`Nhập mã mời`, `Enter invite code`],
    [`Nhập mã để tham gia hotels của đồng nghiệp`, `Enter code to join your colleague's hotel`],
    [`Go Back trang chào mừng`, `Go Back to welcome`],
    [`Đang tải`, `Loading`],
    [`Không thể kết nối server`, `Cannot connect to server`],
]);

// ═════════════════════════════════
// pricing/page.tsx (7 remaining)
// ═════════════════════════════════
total += r('app/pricing/page.tsx', [
    [`'Cấu hình'`, `'Setup'`],
    [`'Khuyến mại'`, `'Promotions'`],
    [`'Bảng giá'`, `'Price Table'`],
    [`'Giá Linh Hoạt'`, `'Dynamic Pricing'`],
    [`'Tối ưu OTA'`, `'Optimize OTA'`],
    [`title="Tính giá OTA"`, `title="OTA Price Calculator"`],
    [`subtitle="Quản lý giá hiển thị trên các kênh OTA"`, `subtitle="Manage display prices across OTA channels"`],
]);

// ═════════════════════════════════
// no-hotel-access/page.tsx (5 remaining)
// ═════════════════════════════════
total += r('app/no-hotel-access/page.tsx', [
    [`Đang kiểm tra quyền truy cập`, `Checking access permissions`],
    [`Chưa được gán hotels`, `Not assigned to any hotel`],
    [`Tài khoản của bạn chưa được gán quyền truy cập hotels nào`, `Your account has not been assigned access to any hotel`],
    [`Vui lòng thử đăng nhập lại hoặc liên hệ quản trị viên`, `Please try signing in again or contact admin`],
    [`Sign In lại`, `Sign In Again`],
]);

// ═════════════════════════════════
// admin/hotels/page.tsx (5 remaining)
// ═════════════════════════════════
total += r('app/admin/hotels/page.tsx', [
    [`Quản lý Hotels`, `Hotel Management`],
    [`Đang tải`, `Loading`],
    [`phòng`, `rooms`],
    [`Hoạt động`, `Active`],
    [`Tạm ngưng`, `Suspended`],
]);

// ═════════════════════════════════
// PricingTab.tsx (5 remaining)
// ═════════════════════════════════
total += r('components/admin/PricingTab.tsx', [
    [`phòng`, `rooms`],
    [` tháng`, ` months`],
    [`Chỉnh sửa`, `Edit`],
    [`Tạo mới`, `Create`],
    [`Cập nhật`, `Update`],
    [`Đang lưu`, `Saving`],
    [`đ`, `₫`],
]);

// ═════════════════════════════════
// Smaller files (4-1 remaining each)
// ═════════════════════════════════

// dashboard/page.tsx (4)
total += r('app/dashboard/page.tsx', [
    [`Chưa cấu hình Hotel ID`, `Hotel ID Not Configured`],
    [`Chưa đặt tên`, `Unnamed`],
    [`Hết rooms - ngừng bán`, `Sold out - stop selling`],
    [`Thiếu giá hiện tại`, `Missing current price`],
    [`Giữ giá`, `Keep Price`],
    [`Đề xuất tăng`, `Suggest increase`],
    [`Đề xuất giảm`, `Suggest decrease`],
    [`tải lên reservations`, `upload reservations`],
    [`nhập Số rooms và các thông tin khác`, `enter room count and other info`],
    [`Đi tới Settings`, `Go to Settings`],
    [`Chưa cấu hình hotels`, `Hotels not configured`],
    [`Vào Settings`, `Go to Settings`],
    [`reasonTextVi`, `reasonText`],
]);

// blocked/page.tsx (4)
total += r('app/blocked/page.tsx', [
    [`Tài khoản đã bị vô hiệu hóa`, `Account has been disabled`],
    [`Tài khoản của bạn đã bị vô hiệu hóa bởi quản trị viên`, `Your account has been disabled by admin`],
    [`Vui lòng liên hệ để được hỗ trợ`, `Please contact for support`],
    [`Đang đăng xuất tự động`, `Signing out automatically`],
]);

// select-hotel/page.tsx (4)
total += r('app/select-hotel/page.tsx', [
    [`Không thể chọn hotels. Vui lòng thử lại.`, `Cannot select hotel. Please try again.`],
    [`Bạn có quyền truy cập`, `You have access to`],
    [`hotels`, `hotels`],
    [`Chọn một hotels để tiếp tục`, `Select a hotel to continue`],
    [`Không tìm thấy hotels nào`, `No hotels found`],
]);

// unauthorized/page.tsx (2)
total += r('app/unauthorized/page.tsx', [
    [`với vai trò hiện tại`, `with your current role`],
    [`Vui lòng liên hệ quản trị viên để được cấp quyền`, `Please contact admin for access`],
]);

// DeleteByMonthButton.tsx (4)
total += r('app/data/DeleteByMonthButton.tsx', [
    [`'XOA DỮ LIỆU'`, `'DELETE DATA'`],
    [`XOA DỮ LIỆU`, `DELETE DATA`],
]);

// SetupTab.tsx (8)
total += r('components/pricing/SetupTab.tsx', [
    [`>Thêm<`, `>Add<`],
    [`Chưa có hạng phòng nào. Nhấn &quot;Thêm&quot; để bắt đầu.`, `No room types yet. Click &quot;Add&quot; to start.`],
    [`Chưa có kênh OTA nào. Nhấn &quot;Thêm&quot; để bắt đầu.`, `No OTA channels yet. Click &quot;Add&quot; to start.`],
    [`>Chế độ</th>`, `>Mode</th>`],
    [`Luỹ tiến`, `Progressive`],
    [`Lũy tiến - Progressive`, `Progressive`],
    [`Cộng dồn - Additive`, `Additive`],
    [`Thêm`, `Add`],
]);

// DashboardToolbarCard.tsx (7)
total += r('components/dashboard/DashboardToolbarCard.tsx', [
    [`'Cũ'`, `'Stale'`],
    [`'Thiếu'`, `'Missing'`],
    [`'Chưa có'`, `'None'`],
    [`'Đặt rooms'`, `'Room bookings'`],
    [`'Hủy rooms'`, `'Room cancellations'`],
    [`Trạng thái dữ liệu`, `Data Status`],
    [`Xem OTB tại`, `View OTB at`],
]);

// RecommendationTable.tsx (7)
total += r('components/dashboard/RecommendationTable.tsx', [
    [` đ'`, ` ₫'`],
    [`chưa có dữ liệu pipeline`, `no pipeline data`],
    [`dùng công thức ước tính`, `using estimation formula`],
    [`>Ngày<`, `>Date<`],
    [`>Thao tác<`, `>Actions<`],
    [`(tham khảo)`, `(reference)`],
    [`>Ngày:</span>`, `>Date:</span>`],
    [`>Hiện tại:</span>`, `>Current:</span>`],
    [`Chạy lại Pipeline để có giá chính xác`, `Re-run Pipeline for accurate pricing`],
]);

// InsightsPanel.tsx (6)
total += r('components/dashboard/InsightsPanel.tsx', [
    [`Tác dụng`, `Impact`],
    [`Tác dụng ước tính`, `Estimated Impact`],
    [`7 days tới`, `next 7 days`],
    [`Ngày cần chú ý`, `Days to watch`],
    [`Các days cần chú ý (ngoài top 3)`, `Days to watch (outside top 3)`],
    [`Không có days nào đặc biệt ngoài Top 3`, `No notable days outside Top 3`],
]);

// UpgradeModal.tsx (5)
total += r('components/billing/UpgradeModal.tsx', [
    [`'3/tháng'`, `'3/month'`],
    [`'15/tháng'`, `'15/month'`],
    [`'50/tháng'`, `'50/month'`],
    [`'1/ngày'`, `'1/day'`],
    [`'10/ngày'`, `'10/day'`],
    [`'Không giới hạn'`, `'Unlimited'`],
    [`'Xem trước'`, `'Preview'`],
]);

// ComplianceBanner.tsx (4)
total += r('components/compliance/ComplianceBanner.tsx', [
    [`Gói Tiêu chuẩn chỉ dành cho hotels ≤ 30 rooms`, `Standard plan is for hotels ≤ 30 rooms only`],
    [`Khách sạn của bạn có`, `Your hotel has`],
    [`rooms. Vui lòng nâng cấp để tiếp tục sử dụng`, `rooms. Please upgrade to continue`],
    [`Band không khớp`, `Band mismatch`],
    [`Khách sạn có`, `Hotel has`],
    [`rooms (band`, `rooms (band`],
]);

// analytics/types.ts (8)
total += r('components/analytics/types.ts', [
    [`ngày`, `day`],
    [`tháng`, `month`],
    [`phòng`, `room`],
    [`dự báo`, `forecast`],
    [`thực tế`, `actual`],
    [`chênh lệch`, `variance`],
]);

// BuildFeaturesInline.tsx (7)
total += r('components/analytics/BuildFeaturesInline.tsx', [
    [`Đang build`, `Building`],
    [`thành công`, `successful`],
    [`thất bại`, `failed`],
    [`Chạy lại`, `Run again`],
    [`Build Features`, `Build Features`],
    [`Đang xử lý`, `Processing`],
]);

// CancelForecastChart.tsx (7)
total += r('components/analytics/CancelForecastChart.tsx', [
    [`Dự báo hủy phòng`, `Cancellation Forecast`],
    [`phòng dự kiến hủy`, `rooms expected to cancel`],
    [`Chưa có dữ liệu`, `No data`],
    [`Ngày`, `Date`],
    [`Thực tế`, `Actual`],
    [`Dự báo`, `Forecast`],
]);

// PaceTable.tsx (3)
total += r('components/analytics/PaceTable.tsx', [
    [`Pace so với năm trước`, `Pace vs Last Year`],
    [`ngày`, `days`],
]);

// Various small files
total += r('components/dashboard/TopAccountsTable.tsx', [
    [`Tên khách`, `Guest Name`],
    [`Số đêm`, `Nights`],
    [`Tổng chi tiêu`, `Total Spending`],
]);

total += r('components/dashboard/AccountDetailModal.tsx', [
    [`Chi tiết tài khoản`, `Account Details`],
    [`Lịch sử đặt phòng`, `Booking History`],
    [`Tổng chi tiêu`, `Total Spending`],
    [`Lần cuối`, `Last Visit`],
]);

total += r('components/dashboard/RoomLosMixPanel.tsx', [
    [`đêm`, `nights`],
    [`Phân bố`, `Distribution`],
]);

total += r('components/paywall/TierPaywall.tsx', [
    [`Nâng cấp`, `Upgrade`],
    [`Tính năng`, `Feature`],
    [`yêu cầu gói`, `requires plan`],
]);

total += r('components/AuditTeaser.tsx', [
    [`Dữ liệu hợp lệ`, `Data Valid`],
    [`Có lỗi cần sửa`, `Errors Need Fixing`],
    [`dòng dữ liệu`, `data rows`],
    [`lỗi nghiêm trọng`, `critical errors`],
]);

total += r('components/gates/QuotaWarning.tsx', [
    [`Đã đạt giới hạn`, `Limit reached`],
    [`Nâng cấp`, `Upgrade`],
    [`để tiếp tục`, `to continue`],
]);

total += r('components/gates/FeatureGate.tsx', [
    [`Tính năng`, `Feature`],
    [`yêu cầu`, `requires`],
    [`Nâng cấp`, `Upgrade`],
]);

total += r('components/DatePickerSnapshot.tsx', [
    [`ngày dữ liệu`, `data days`],
    [`Đang tải`, `Loading`],
    [`Không thể tải`, `Cannot load`],
]);

total += r('app/payment/cancel/page.tsx', [
    [`Thanh toán bị hủy`, `Payment Cancelled`],
    [`Quay lại`, `Go Back`],
    [`bảng giá`, `pricing`],
]);

total += r('components/settings/SubscriptionBadge.tsx', [
    [`phòng`, `rooms`],
    [`nên dùng band`, `should use band`],
    [`Chỉnh tại PLG Admin`, `Adjust in PLG Admin`],
    [`vượt band`, `exceeds band`],
    [`Liên hệ quản trị viên`, `Contact admin`],
]);

total += r('components/settings/OrgContextBadge.tsx', [
    [`Tổ chức`, `Organization`],
    [`Không tìm thấy`, `Not found`],
]);

total += r('components/settings/QuotaUsagePanel.tsx', [
    [`Lưu trữ dữ liệu`, `Data Retention`],
    [`tháng`, `months`],
]);

total += r('components/billing/PromoRedeemCard.tsx', [
    [`Nhập mã khuyến mại`, `Enter promo code`],
    [`Áp dụng`, `Apply`],
    [`Mã không hợp lệ`, `Invalid code`],
]);

total += r('app/analytics/page.tsx', [
    [`Phân tích`, `Analytics`],
    [`Đang tải`, `Loading`],
]);

total += r('app/dashboard/layout.tsx', [
    [`Đang tải`, `Loading`],
]);

total += r('app/dashboard/loading.tsx', [
    [`Đang tải`, `Loading`],
]);

total += r('app/pricing-plans/layout.tsx', [
    [`Bảng giá`, `Pricing`],
]);

total += r('app/rate-shopper/competitors/page.tsx', [
    [`Đối thủ`, `Competitors`],
]);

total += r('app/onboarding/page.tsx', [
    [`Đang xử lý`, `Processing`],
    [`Tiếp tục`, `Continue`],
]);

total += r('app/settings/page.tsx', [
    [`Cài đặt`, `Settings`],
    [`Đã lưu`, `Saved`],
    [`Lưu thay đổi`, `Save Changes`],
    [`đ`, `₫`],
]);

total += r('components/analytics/SupplyChart.tsx', [
    [`phòng`, `rooms`],
]);

total += r('components/analytics/DodChips.tsx', [
    [`ngày`, `day`],
]);

total += r('components/analytics/ForecastAccuracyChart.tsx', [
    [`Độ chính xác`, `Accuracy`],
]);

total += r('components/analytics/DataQualityBadge.tsx', [
    [`chất lượng dữ liệu`, `data quality`],
]);

total += r('components/shared/ExportPdfButton.tsx', [
    [`Xuất báo cáo`, `Export Report`],
    [`Xuất PDF`, `Export PDF`],
    [`Báo cáo`, `Report`],
]);

total += r('components/shared/DataStatusBadge.tsx', [
    [`Đủ dữ liệu`, `Data Complete`],
    [`Thiếu dữ liệu hủy`, `Missing Cancel Data`],
    [`Thiếu`, `Missing`],
]);

total += r('components/payments/PayPalCheckout.tsx', [
    [`Có lỗi xảy ra`, `An error occurred`],
]);

total += r('components/payments/PaymentMethodModal.tsx', [
    [`Có lỗi xảy ra`, `An error occurred`],
]);

total += r('components/guide/WhenToBoost.tsx', [
    [`quyết định`, `decision`],
    [`Kỳ vọng`, `Expected`],
]);

total += r('components/guide/ScorecardInputModal.tsx', [
    [`Cập nhật`, `Update`],
    [`Nhập dữ liệu`, `Enter data`],
]);

total += r('components/pricing/SeasonConfigPanel.tsx', [
    [`Lỗi`, `Error`],
    [`Chưa có season`, `No seasons`],
]);

total += r('components/pricing/SeasonRateEditor.tsx', [
    [`Đã lưu rates`, `Rates saved`],
]);

total += r('components/pricing/RoomTypesTab.tsx', [
    [`Xác nhận xóa`, `Confirm delete`],
    [`hạng phòng`, `room type`],
]);

total += r('components/pricing/OccTierEditor.tsx', [
    [`Chưa lưu`, `Unsaved`],
    [`Đã lưu`, `Saved`],
    [`thành công`, `successfully`],
    [`Lưu bậc OCC`, `Save OCC Tiers`],
    [`ngoài 0.5-3.0`, `outside 0.5-3.0`],
]);

total += r('components/pricing/OTAConfigTab.tsx', [
    [`Xác nhận xóa kênh OTA`, `Confirm delete OTA channel`],
    [`Đang hoạt động`, `Active`],
    [`Lũy tiến`, `Progressive`],
    [`Cộng dồn`, `Additive`],
]);

total += r('components/dashboard/OtbChart.tsx', [
    [`Năm nay`, `This Year`],
    [`Năm trước`, `Last Year`],
]);

total += r('components/dashboard/DashboardTabs.tsx', [
    [`Phân tích`, `Analytics`],
]);

total += r('components/dashboard/QuickModePanel.tsx', [
    [`Duyệt`, `Review`],
]);

// tests/pricing-golden.test.ts (2 — VN comments)
total += r('tests/pricing-golden.test.ts', [
    [`Đúng`, `Correct`],
    [`Sai`, `Wrong`],
]);

console.log(`\n🎯 FINAL Cleanup: ${total} replacements`);
