/**
 * Phase 02B - Cleanup: Targeted sweep for all remaining VN strings
 * Covers: BookingChecklist, PromotionsTab, PLGAdminDashboard, upload/page,
 * guide/page, DynamicPricingTab, AgodaChecklist, settings/team, AnalyticsPanel,
 * RecommendationTable, InsightsPanel, dashboard/page, and many smaller files
 */
const fs = require('fs');
const path = require('path');
const BASE = path.join(__dirname, '..');

function replaceInFile(relPath, pairs) {
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

// ═══ BookingChecklist.tsx ═══
total += replaceInFile('components/guide/BookingChecklist.tsx', [
    // Long Vietnamese descriptions are data arrays - replace them inline
    [`Tiến độ thực hiện`, `Implementation Progress`],
    [`→→ Cách làm:`, `→→ How to:`],
    [`Nguồn: `, `Source: `],
    [`Về &quot;Ad&quot; label:`, `About &quot;Ad&quot; label:`],
    [`Nếu thấy đối thủ nổi bật thường`, `If a competitor consistently appears prominent`],
    [`có thể họ đang dùng paid placement`, `they may be using paid placement`],
    [`Booking.com xếp hạng dựa trên 3 trụ cột`, `Booking.com ranks based on 3 pillars`],
    [`Mỗi item trong checklist cho biết nó ảnh hưởng phần nào của funnel`, `Each checklist item shows which part of the funnel it impacts`],
]);

// ═══ PromotionsTab.tsx — remaining currency/format strings ═══
total += replaceInFile('components/pricing/PromotionsTab.tsx', [
    [`}đ`, `}₫`],
    [`hoa hồng`, `commission`],
    [`Tính giá`, `Calculate Price`],
    [`Giá phòng mà khách sạn muốn thu về`, `Room price the hotel wants to receive`],
    [`Giá trước khuyến mại`, `Price before promotions`],
    [`Nhân luỹ tiến`, `Progressive`],
    [`Deal cao nhất`, `Highest Deal`],
    [`Cộng dồn`, `Additive`],
    [`KM bị loại bỏ`, `Promos excluded`],
    [`do quy tắc xếp chồng`, `due to stacking rules`],
    [`Kết quả`, `Result`],
    [`Giá Channel Manager`, `Channel Manager Price`],
    [`Khách thấy trên OTA`, `Guest sees on OTA`],
    [`Khách sạn thu về`, `Hotel receives`],
    [`Chọn hạng phòng để xem số liệu cụ thể`, `Select room type for detailed pricing`],
    [`Tổng giảm giá`, `Total discount`],
    [`tối đa 80%`, `max 80%`],
    [`luỹ tiến`, `progressive`],
    [`deal cao nhất`, `highest deal`],
    [`cộng dồn`, `additive`],
    [`không KM`, `no promos`],
    [`Member tiết kiệm`, `Member saves`],
    [`rẻ hơn`, `cheaper`],
    [`Khuyến mại`, `Promotions`],
    [`khuyến mại`, `promotion`],
    [`Hoa hồng OTA`, `OTA Commission`],
    [`Tiền thu về`, `Net Revenue`],
    [`Commission rất cao`, `Commission very high`],
    [`kiểm tra lại`, `please verify`],
    [`Tất cả quy tắc đều đạt`, `All rules passed`],
    [`Giải thích cách tính`, `Pricing Explained`],
    [`Bước 1`, `Step 1`],
    [`Bước 2`, `Step 2`],
    [`Bước 3`, `Step 3`],
    [`Giá gốc`, `Base Price`],
    [`Cộng hoa hồng`, `Add commission`],
    [`Xóa promotion này?`, `Delete this promotion?`],
    [`Chưa có hạng phòng`, `No room types`],
    [`Vui lòng thêm`, `Please add`],
    [`Hạng phòng`, `Room Types`],
    [`Nhập giá thu về mong muốn`, `Enter desired net revenue`],
    [`Nhập giá BAR`, `Enter BAR price`],
    [`Nhập giá khách thấy trên OTA`, `Enter price guest sees on OTA`],
    [`Tìm kiếm chương trình`, `Search promotions`],
    [`Không tìm thấy chương trình`, `No promotions found`],
    [`Thử tìm kiếm với từ khóa khác`, `Try different keywords`],
    [`Nhấn để thêm khuyến mại`, `Click to add promotion`],
    [`Tên khuyến mại`, `Promotion Name`],
    [`Giảm giá`, `Discount`],
    [`Trạng thái`, `Status`],
    [`Thao tác`, `Actions`],
    [`Chọn chương trình khuyến mại từ danh mục có sẵn`, `Select promotion from catalog`],
    [`Thêm khuyến mại từ catalog`, `Add from catalog`],
    [`Chưa có khuyến mại nào`, `No promotions yet`],
    [`Nhấn để thêm`, `Click to add`],
    [`Agoda tự động bật cộng dồn cho khuyến mại Cơ bản`, `Agoda auto-enables stacking for Essential promos`],
    [`cộng dồn giảm giá`, `stack discounts`],
    [`Campaign không cộng dồn`, `Campaign doesn't stack`],
    [`tự động loại bỏ`, `automatically exclude`],
    [`% cao nhất được áp dụng`, `% highest applied`],
    [`Kết hợp với khuyến mại khác`, `Combine with other promotions`],
]);

// ═══ PLGAdminDashboard.tsx — remaining admin strings ═══
total += replaceInFile('components/admin/PLGAdminDashboard.tsx', [
    [`Cách tính:`, `How it's calculated:`],
    [`Tab này hiện tại:`, `This tab currently:`],
    [`Hiển thị lịch sử tất cả giao dịch hoa hồng`, `Shows all commission transaction history`],
    [`Bao gồm loại, tỷ lệ, số tiền, mô tả`, `Including type, rate, amount, description`],
    [`Cung cấp tên, email`, `Provide name, email`],
    [`Nhận Ref Code tự động`, `Get auto-generated Ref Code`],
    [`Loại RESELLER, gắn vào reseller`, `Type RESELLER, link to reseller`],
    [`Hotel nhập mã khi đăng ký`, `Hotel enters code at signup`],
    [`Tự động attribution`, `Auto attribution`],
    [`Hệ thống ghi nhận redemption`, `System records redemption`],
    [`tính discount`, `calculates discount`],
    [`Khi hotel thanh toán`, `When hotel pays`],
    [`Commission cho resel`, `Commission for resel`],
    [`Xóa = Soft Delete:`, `Delete = Soft Delete:`],
    [`Reseller và Promo chỉ bị deactivate, không xóa khỏi database`, `Reseller and Promo are only deactivated, not deleted from database`],
    [`Điều này bảo toàn lịch sử và`, `This preserves history and`],
    [`Ref Code không đổi:`, `Ref Code is permanent:`],
    [`Mỗi reseller có 1 mã ref code cố định, không thể thay đổi sau khi tạo`, `Each reseller has a fixed ref code that cannot be changed after creation`],
    [`Audit logging:`, `Audit logging:`],
    [`Mỗi thao tác (tạo, sửa, xóa) đều được ghi nhận vào audit log để truy vết`, `Every action (create, edit, delete) is recorded in audit log for tracking`],
    [`Quyền Admin:`, `Admin Access:`],
    [`Chỉ user đã đăng nhập với quyền admin mới truy cập được trang này`, `Only logged-in admin users can access this page`],
    [`VD: Hotel trả`, `E.g.: Hotel pays`],
    [`Reseller nhận:`, `Reseller receives:`],
    [`hoa hồng`, `commission`],
    [`Tạo Reseller`, `Create Reseller`],
    [`Tạo Promo Code cho Reseller`, `Create Promo Code for Reseller`],
    [`Reseller chia sẻ mã cho khách hàng`, `Reseller shares code with customers`],
    [`Hotel áp dụng mã`, `Hotel applies code`],
    [`Nhận giảm giá`, `Receives discount`],
    [`Hoa hồng tự động tính`, `Commission auto-calculated`],
]);

// ═══ upload/page.tsx ═══
total += replaceInFile('app/upload/page.tsx', [
    [`Tải lên dữ liệu`, `Upload Data`],
    [`Kéo thả file`, `Drag & drop file`],
    [`bấm để chọn`, `click to select`],
    [`Đang xử lý`, `Processing`],
    [`Upload thành công`, `Upload Successful`],
    [`Upload thất bại`, `Upload Failed`],
    [`Chọn khách sạn`, `Select Hotel`],
    [`Hỗ trợ: XML, CSV`, `Supported: XML, CSV`],
    [`Tải template mẫu`, `Download Sample Template`],
    [`Xử lý xong`, `Processing Complete`],
    [`dòng đã import`, `rows imported`],
    [`dòng bị skip`, `rows skipped`],
    [`Lịch sử upload`, `Upload History`],
    [`Đang tải file...`, `Loading file...`],
    [`Chưa chọn khách sạn`, `No hotel selected`],
    [`Chọn file để upload`, `Select file to upload`],
    [`đã xử lý`, `processed`],
    [`cảnh báo`, `warnings`],
    [`Lần cuối upload`, `Last upload`],
    [`Chưa có lịch sử`, `No upload history`],
    [`Đang upload...`, `Uploading...`],
    [`Upload`, `Upload`],
    [`Vui lòng`, `Please`],
]);

// ═══ guide/page.tsx — remaining 37 strings ═══
total += replaceInFile('app/guide/page.tsx', [
    [`Mục lục`, `Table of Contents`],
    [`Tìm thuật ngữ, hướng dẫn`, `Search terms, guides`],
    [`Xin chào`, `Hello`],
    [`Hãy bắt đầu`, `Let's begin`],
    [`Lỗi & Khắc phục`, `Troubleshooting`],
    [`Nguyên nhân`, `Cause`],
    [`Cách sửa`, `Fix`],
    [`Mở `, `Open `],
    [`Build dữ liệu`, `Build Data`],
    [`Xem Dashboard`, `View Dashboard`],
    [`Accept/Override giá`, `Accept/Override Price`],
    [`Cập nhật OTA`, `Update OTA`],
    [`Tổng thời gian`, `Total time`],
    [`Upload xong`, `After upload`],
    [`hệ thống tự động xử lý dữ liệu`, `the system processes data automatically`],
    [`Đăng nhập`, `Sign In`],
    [`tài khoản Google được admin cấp`, `Google account provided by admin`],
    [`Liên hệ admin`, `Contact admin`],
    [`Nếu chưa có quyền truy cập`, `If you don't have access`],
    [`Upload dữ liệu từ PMS`, `Upload Data from PMS`],
    [`Kéo thả file XML hoặc CSV`, `Drag & drop XML or CSV file`],
    [`Upload dữ liệu mỗi ngày`, `Upload data daily`],
    [`để có số liệu chính xác nhất`, `for the most accurate metrics`],
    [`Xem biểu đồ OTB`, `View OTB chart`],
    [`Giá khuyến nghị`, `Price recommendation`],
    [`Ra Quyết định Giá`, `Make Pricing Decisions`],
    [`Đồng ý với giá hệ thống đề xuất`, `Accept system recommended price`],
    [`Nhập giá theo ý mình`, `Enter your own price`],
    [`Thuật ngữ`, `Terminology`],
    [`Giải thích`, `Definition`],
    [`Sẵn sàng`, `Ready`],
    [`Bắt đầu ngay`, `Get started`],
]);

// ═══ DynamicPricingTab.tsx ═══
total += replaceInFile('components/pricing/DynamicPricingTab.tsx', [
    [`Giá Linh Hoạt`, `Dynamic Pricing`],
    [`Mùa (Seasons)`, `Seasons`],
    [`Bậc công suất`, `Occupancy Tiers`],
    [`OCC Tiers`, `OCC Tiers`],
    [`Hạng phòng`, `Room Type`],
    [`Giá NET`, `NET Price`],
    [`NET cơ sở`, `Base NET`],
    [`Hệ số nhân`, `Multiplier`],
    [`Bậc OCC`, `OCC Tier`],
    [`Giá hiện tại`, `Current Price`],
    [`Chế độ`, `Mode`],
    [`Thu về`, `Revenue`],
    [`Hiển thị`, `Display`],
    [`Chưa cấu hình`, `Not configured`],
    [`Thêm mùa`, `Add Season`],
    [`Chọn mùa`, `Select Season`],
    [`Tất cả hạng phòng`, `All room types`],
    [`Giá theo mùa`, `Seasonal pricing`],
    [`Chưa có dữ liệu`, `No data`],
    [`Cấu hình`, `Configuration`],
    [`Đang tải`, `Loading`],
    [`tháng`, `month`],
    [`ngày`, `day`],
    [`phòng`, `room`],
    [`Bảng giá`, `Price Table`],
    [`Xem chi tiết`, `View Details`],
    [`Lưu thay đổi`, `Save Changes`],
]);

// ═══ AgodaChecklist.tsx — descriptions (data) ═══
total += replaceInFile('components/guide/AgodaChecklist.tsx', [
    // Replace key Vietnamese descriptive strings
    [`Dữ liệu từ Agoda Partner Hub`, `Data from Agoda Partner Hub`],
    [`Trang gốc trả về 403`, `Original page returns 403`],
    [`thông tin do BA cung cấp`, `information provided by BA`],
    [`Con số này là benchmark trung bình`, `These are average benchmarks`],
    [`ước tính, không đảm bảo kết quả`, `estimates, not guaranteed results`],
    [`AGP yêu cầu tham gia tối thiểu 90 ngày`, `AGP requires minimum 90-day participation`],
    [`Cân nhắc kỹ trước khi đăng ký`, `Consider carefully before enrolling`],
    [`Content Score`, `Content Score`],
    [`Điểm nội dung`, `Content Score`],
    [`Property Photos chiếm 45% Content Score`, `Property Photos = 45% of Content Score`],
    [`Room Photos chiếm 25% Content Score`, `Room Photos = 25% of Content Score`],
    [`Description chiếm 20% Content Score`, `Description = 20% of Content Score`],
    [`Facilities/Amenities chiếm 10% Content Score`, `Facilities/Amenities = 10% of Content Score`],
    [`Ảnh Property`, `Property Photos`],
    [`Ảnh Room`, `Room Photos`],
    [`Mô tả`, `Description`],
    [`Tiện nghi`, `Amenities`],
    [`Tiến độ thực hiện`, `Implementation Progress`],
    [`Đánh giá khách hàng`, `Guest Reviews`],
    [`Duy trì Review Score`, `Maintain Review Score`],
    [`Trả lời`, `Reply to`],
    [`đánh giá`, `reviews`],
    [`Giá cạnh tranh`, `Competitive Pricing`],
    [`Tính khả dụng`, `Availability`],
    [`Mở bán`, `Open availability`],
    [`đủ room types`, `all room types`],
    [`Chương trình Agoda`, `Agoda Programs`],
    [`tăng commission để đổi lấy visibility`, `increase commission for higher visibility`],
    [`Quảng cáo trả phí`, `Paid advertising`],
    [`trọng số`, `weight`],
    [`chất lượng cao`, `high quality`],
    [`Cách làm:`, `How to:`],
    [`Nguồn:`, `Source:`],
    [`visibility tăng tương ứng`, `visibility increases accordingly`],
    [`Upload ảnh HD`, `Upload HD photos`],
    [`Viết mô tả`, `Write description`],
    [`Tick tất cả`, `Tick all`],
    [`Đặc biệt`, `Especially`],
    [`Đăng ký`, `Enroll`],
    [`Monitor ROI`, `Monitor ROI`],
    [`Set budget`, `Set budget`],
    [`trả lời tất cả reviews`, `reply to all reviews`],
    [`kiểm tra daily`, `check daily`],
    [`Đảm bảo`, `Ensure`],
    [`Nhấn mạnh`, `Emphasize`],
    [`chuyên nghiệp`, `professionally`],
    [`cải thiện`, `improve`],
]);

// ═══ settings/team/page.tsx ═══
total += replaceInFile('app/settings/team/page.tsx', [
    [`Có lỗi xảy ra`, `An error occurred`],
    [`Đã xóa thành viên`, `Member removed`],
    [`Không thể xóa thành viên`, `Cannot remove member`],
    [`Quản lý Team`, `Team Management`],
    [`Invite Member và quản lý quyền truy cập`, `Invite members and manage access`],
    [` thành viên`, ` members`],
    [`Đã đạt giới hạn thành viên cho gói `, `Member limit reached for plan `],
    [`Quota Users giới hạn theo gói (tier), không theo số rooms (band)`, `User quota limited by plan (tier), not by rooms (band)`],
    [`Upgrade gói để thêm thành viên →`, `Upgrade plan for more members →`],
    [`Mã mời (vai trò:`, `Invite code (role:`],
    [`Hoặc gửi link:`, `Or share link:`],
    [`Đã copy`, `Copied`],
    [`Hết hạn:`, `Expires:`],
    [`Create mã mới khác`, `Create new invite code`],
    [`Đã đạt giới hạn thành viên`, `Member limit reached`],
    [`Đang tạo...`, `Creating...`],
    [`Đã đạt giới hạn`, `Limit reached`],
    [`Create mã mời mới`, `Create new invite code`],
    [`Mã mời đang hoạt động`, `Active invite codes`],
    [`Dùng:`, `Used:`],
    [`Hết hạn`, `Expired`],
    [`Thu hồi mã mời`, `Revoke invite code`],
    [`Đang tải...`, `Loading...`],
    [`Chưa có thành viên nào`, `No members yet`],
    [`(bạn)`, `(you)`],
]);

// ═══ AnalyticsPanel.tsx — tooltips & labels ═══
total += replaceInFile('components/dashboard/AnalyticsPanel.tsx', [
    // Tooltip tips and good values
    [`'So sánh số rooms đã bán năm nay với cùng kỳ năm ngoái`, `'Compare rooms sold this year vs Same Time Last Year`],
    [`Same Time Last Year`, `Same Time Last Year`],
    [`Dương = bán tốt hơn năm ngoái`, `Positive = selling better than last year`],
    [`Âm = bán ít hơn → cần tăng marketing/giảm giá`, `Negative = selling less → increase marketing/reduce prices`],
    [`Medium số rooms được đặt thêm mỗi`, `Median rooms booked per`],
    [`Càng cao càng tốt, nghĩa là demand đang mạnh`, `Higher is better, indicates strong demand`],
    [`chưa đủ dữ liệu lịch sử`, `not enough historical data`],
    [`cần ít nhất 2 OTB snapshots cách nhau 7`, `need at least 2 OTB snapshots 7 days apart`],
    [`Medium số rooms CÒN TRỐNG chưa bán`, `Median rooms still AVAILABLE unsold`],
    [`gần full → có thể tăng giá`, `nearly full → consider raising prices`],
    [`Quá cao = nhiều rooms trống → cần đẩy bán`, `Too high = many empty rooms → push sales`],
    [`Phần trăm days có đủ dữ liệu để so sánh`, `Percentage of days with enough data for comparison`],
    [`≥80% là tốt, đủ để phân tích`, `≥80% is good, sufficient for analysis`],
    [`<50% = thiếu data năm ngoái → kết quả so sánh chưa chính xác`, `<50% = missing last year data → comparison results inaccurate`],
    [`Số rooms được đặt THÊM trong 7`, `Rooms booked ADDITIONALLY in last 7`],
    [`Dương = có thêm đặt rooms`, `Positive = more rooms booked`],
    [`Dấu - nghĩa là chưa đủ data lịch sử`, `Negative = not enough historical data`],
    [`cần OTB snapshot 7`, `need OTB snapshot 7`],
    [`Giống T-7 nhưng ngắn hơn`, `Same as T-7 but shorter term`],
    [`cho thấy xu hướng gần đây`, `shows recent trends`],
    [`cần OTB snapshot 3`, `need OTB snapshot 3`],
    [`Tổng số rooms ĐÃ ĐẶT`, `Total rooms BOOKED`],
    [`trừ rooms đã hủy`, `minus cancelled rooms`],
    [`Càng gần capacity = càng tốt`, `Closer to capacity = better`],
    [`Cùng kỳ năm ngoái`, `Same Time Last Year`],
    [`số rooms đã bán cho`, `rooms sold for`],
    [`Dùng để so sánh`, `Used for comparison`],
    [`bán tốt hơn hay kém hơn năm ngoái`, `selling better or worse than last year`],
    [`Tỷ lệ % chênh lệch giữa năm nay và cùng kỳ năm ngoái`, `Percentage difference between this year and last year`],
    [`Dương xanh = tốt hơn năm ngoái`, `Positive green = better than last year`],
    [`Âm đỏ = kém hơn → cần hành động`, `Negative red = worse → take action`],
    [`Số rooms còn trống cho`, `Remaining rooms for`],
    [`= Tổng rooms - OTB`, `= Total rooms - OTB`],
    [`Low = gần full, cân nhắc tăng giá`, `Low = nearly full, consider raising price`],
    [`High = nhiều rooms trống`, `High = many rooms available`],
    [`Ngày gần nhất có sẵn`, `Nearest available date`],
    [`Xu hướng đặt rooms`, `Room booking trends`],
    [`7 ngày tới`, `next 7 days`],
    [`Ngày`, `Date`],
    [`Đã đặt`, `Booked`],
    [`So sánh`, `Comparison`],
    [`Trống`, `Available`],
]);

// ═══ RecommendationTable.tsx ═══
total += replaceInFile('components/dashboard/RecommendationTable.tsx', [
    [`đang dùng công thức ước tính`, `using estimation formula`],
    [`Chạy lại Pipeline để có giá chính xác`, `Re-run Pipeline for accurate pricing`],
    [`days có ADR (tham khảo) lệch`, `days have ADR (reference) deviating`],
    [`so với giá anchor`, `from anchor price`],
    [`Kiểm tra giá approved hoặc cập nhật Base Rate trong Settings`, `Check approved prices or update Base Rate in Settings`],
    [`Hiển thị `, `Showing `],
    [`Còn`, `Remaining`],
    [`D.Báo`, `Forecast`],
    [`Anchor = giá approved hoặc rack ra`, `Anchor = approved price or rack ra`],
    [`Cách tính các cột`, `How columns are calculated`],
    [`Ngày ở (stay_date)`, `Stay date`],
    [`SUM(rooms) từ reservations`, `SUM(rooms) from reservations`],
    [`Capacity - OTB`, `Capacity - OTB`],
    [`remaining_demand từ ML`, `remaining_demand from ML`],
    [`ADR = Revenue ÷ Rooms`, `ADR = Revenue ÷ Rooms`],
    [`Pricing Engine tối ưu Rev`, `Pricing Engine optimizes Rev`],
    [`Giải thích từ supply/demand`, `Supply/demand explanation`],
    [`Cuối tuần`, `Weekend`],
    [`Stop Selling`, `Stop Selling`],
    [`Còn ≤ 0`, `Remaining ≤ 0`],
    [` d'`, ` ₫'`],
]);

// ═══ InsightsPanel.tsx ═══
total += replaceInFile('components/dashboard/InsightsPanel.tsx', [
    [`Tình hình`, `Situation`],
    [`Ý nghĩa`, `So What`],
    [`Nên làm`, `Do This`],
    [`Tác dụng ước tính`, `Estimated Impact`],
    [`Analytics & Gợi ý`, `Analytics & Insights`],
    [`Chưa đủ dữ liệu. Upload thêm reservations.`, `Not enough data. Upload more reservations.`],
    [`Ngày chú ý khác`, `Other Days to Watch`],
    [`Top actions - 7 ngày tới`, `Top actions - next 7 days`],
    [`phân tích khác`, `more insights`],
    [`Các ngày cần chú ý (ngoài top 3)`, `Days to watch (outside top 3)`],
    [`Không có ngày nào đặc biệt ngoài Top 3`, `No notable days outside Top 3`],
]);

// ═══ dashboard/page.tsx ═══
total += replaceInFile('app/dashboard/page.tsx', [
    [`Chưa cấu hình Hotel ID`, `Hotel ID Not Configured`],
    [`Vui lòng thêm`, `Please add`],
    [`vào file`, `to file`],
    [`Đi tới Settings →`, `Go to Settings →`],
    [`Chưa đặt tên`, `Unnamed`],
    [`Hết rooms - ngừng bán`, `Sold out - stop selling`],
    [`Thiếu giá hiện tại`, `Missing current price`],
    [`Giữ giá`, `Keep Price`],
    [`Đề xuất tăng`, `Suggest increase`],
    [`Đề xuất giảm`, `Suggest decrease`],
    [`No Data OTB. Vui lòng`, `No OTB data. Please`],
    [`tải lên reservations`, `upload reservations`],
    [`Chưa cấu hình hotels!`, `Hotels not configured!`],
    [`Vào Settings`, `Go to Settings`],
    [`nhập Số rooms và các thông tin khác`, `enter room count and other info`],
]);

// ═══ Remaining smaller files ═══
// PaymentHistoryPanel
total += replaceInFile('components/settings/PaymentHistoryPanel.tsx', [
    [`>Gói</th>`, `>Plan</th>`],
    [`>Hình thức</th>`, `>Method</th>`],
    [`>Số tiền</th>`, `>Amount</th>`],
    [`>Trạng thái</th>`, `>Status</th>`],
    [`1 tháng`, `1 month`],
    [` tháng`, ` months`],
    [`Lịch sử thanh toán`, `Payment History`],
    [`Chưa có giao dịch`, `No transactions yet`],
]);

// SetupTab
total += replaceInFile('components/pricing/SetupTab.tsx', [
    [`Cấu hình`, `Setup`],
    [`Kênh OTA`, `OTA Channels`],
    [`Hạng phòng`, `Room Types`],
    [`Bậc công suất`, `Occupancy Tiers`],
    [`Mùa`, `Seasons`],
]);

// RateShopperPaywall
total += replaceInFile('components/paywall/RateShopperPaywall.tsx', [
    [`So sánh giá đối thủ`, `Competitor Price Comparison`],
    [`Nâng cấp`, `Upgrade`],
    [`Mở khóa`, `Unlock`],
    [`Tính năng`, `Feature`],
]);

// ComplianceBanner
total += replaceInFile('components/compliance/ComplianceBanner.tsx', [
    [`Nâng cấp`, `Upgrade`],
    [`giới hạn`, `limit`],
]);

// DatePickerSnapshot
total += replaceInFile('components/DatePickerSnapshot.tsx', [
    [`ngày dữ liệu`, `data days`],
    [`Đang tải snapshot`, `Loading snapshot`],
    [`Không thể tải`, `Cannot load`],
]);

// DashboardToolbarCard
total += replaceInFile('components/dashboard/DashboardToolbarCard.tsx', [
    [`Cập nhật lúc`, `Updated at`],
    [`Tổng quan`, `Overview`],
    [`Làm mới`, `Refresh`],
    [`Chế độ`, `Mode`],
]);

// OtbChart
total += replaceInFile('components/dashboard/OtbChart.tsx', [
    [`Năm nay`, `This Year`],
    [`Năm trước`, `Last Year`],
    [`Dự báo`, `Forecast`],
]);

// TopAccountsTable
total += replaceInFile('components/dashboard/TopAccountsTable.tsx', [
    [`Tên khách`, `Guest Name`],
    [`Số đêm`, `Nights`],
    [`Top tài khoản`, `Top Accounts`],
]);

// AccountDetailModal
total += replaceInFile('components/dashboard/AccountDetailModal.tsx', [
    [`Chi tiết`, `Details`],
    [`Lịch sử đặt phòng`, `Booking History`],
    [`Tổng chi tiêu`, `Total Spending`],
]);

// Various analytics components
total += replaceInFile('components/analytics/types.ts', [
    [`ngày`, `day`],
    [`tháng`, `month`],
    [`phòng`, `room`],
]);

total += replaceInFile('components/analytics/BuildFeaturesInline.tsx', [
    [`Đang build`, `Building`],
    [`Build thành công`, `Build Successful`],
    [`Build thất bại`, `Build Failed`],
]);

total += replaceInFile('components/analytics/CancelForecastChart.tsx', [
    [`Dự báo hủy phòng`, `Cancellation Forecast`],
    [`phòng dự kiến hủy`, `rooms expected to cancel`],
    [`Chưa có dữ liệu`, `No data`],
]);

total += replaceInFile('components/analytics/PaceTable.tsx', [
    [`Pace so với năm trước`, `Pace vs Last Year`],
    [`ngày`, `days`],
]);

// Various page files
total += replaceInFile('app/payment/success/page.tsx', [
    [`Thanh toán thành công`, `Payment Successful`],
    [`Gói dịch vụ đã được kích hoạt`, `Plan activated`],
    [`Về trang chủ`, `Go to Homepage`],
    [`Quay lại Dashboard`, `Back to Dashboard`],
    [`Cảm ơn`, `Thank you`],
    [`đơn hàng`, `order`],
]);

total += replaceInFile('app/admin/users/page.tsx', [
    [`Quản lý người dùng`, `User Management`],
    [`Tìm kiếm`, `Search`],
    [`Lần đăng nhập cuối`, `Last Login`],
    [`Ngày tạo`, `Created Date`],
    [`Xóa người dùng`, `Delete User`],
    [`Đang tải`, `Loading`],
    [`người dùng`, `users`],
]);

total += replaceInFile('app/welcome/page.tsx', [
    [`Chào mừng`, `Welcome`],
    [`Hệ thống quản lý doanh thu`, `Revenue Management System`],
    [`Bắt đầu sử dụng`, `Get Started`],
    [`Liên hệ hỗ trợ`, `Contact Support`],
    [`đăng nhập`, `sign in`],
]);

total += replaceInFile('app/rate-shopper/page.tsx', [
    [`So sánh giá`, `Price Comparison`],
    [`Đối thủ`, `Competitors`],
    [`Giá thấp nhất`, `Lowest`],
    [`Giá cao nhất`, `Highest`],
    [`Giá trung bình`, `Average`],
    [`Cập nhật lần cuối`, `Last Updated`],
    [`Đang tải`, `Loading`],
]);

total += replaceInFile('app/invite/page.tsx', [
    [`Bạn được mời tham gia`, `You've been invited`],
    [`Chấp nhận lời mời`, `Accept Invitation`],
    [`Từ chối`, `Decline`],
    [`Lời mời không hợp lệ`, `Invalid Invitation`],
    [`Lời mời đã hết hạn`, `Invitation Expired`],
    [`Đang xử lý`, `Processing`],
]);

total += replaceInFile('app/auth/login/page.tsx', [
    [`Đăng nhập`, `Sign In`],
    [`Đăng nhập với Google`, `Sign in with Google`],
    [`Đang đăng nhập`, `Signing in`],
    [`quản lý doanh thu khách sạn`, `hotel revenue management`],
]);

total += replaceInFile('app/pricing/page.tsx', [
    [`Bảng giá dịch vụ`, `Service Pricing`],
    [`Dùng thử miễn phí`, `Free Trial`],
    [`Đang tải`, `Loading`],
    [`tháng`, `month`],
]);

total += replaceInFile('app/no-hotel-access/page.tsx', [
    [`Chưa có quyền truy cập`, `No Access`],
    [`Bạn chưa được gán khách sạn`, `You haven't been assigned to a hotel`],
    [`Liên hệ quản trị viên`, `Contact Admin`],
]);

total += replaceInFile('app/blocked/page.tsx', [
    [`Tài khoản bị khóa`, `Account Blocked`],
    [`Liên hệ quản trị viên để được hỗ trợ`, `Contact admin for support`],
]);

total += replaceInFile('app/unauthorized/page.tsx', [
    [`Không có quyền truy cập`, `Unauthorized Access`],
    [`Bạn không có quyền truy cập trang này`, `You don't have permission`],
]);

total += replaceInFile('app/settings/page.tsx', [
    [`Cài đặt`, `Settings`],
    [`Lưu thay đổi`, `Save Changes`],
    [`Đã lưu`, `Saved`],
]);

total += replaceInFile('app/select-hotel/page.tsx', [
    [`Chọn khách sạn`, `Select Hotel`],
    [`khách sạn`, `hotel`],
]);

// Misc remaining files
total += replaceInFile('components/billing/UpgradeModal.tsx', [
    [`Nâng cấp gói`, `Upgrade Plan`],
    [`Chọn gói phù hợp`, `Choose the right plan`],
    [`Đang xử lý`, `Processing`],
]);

total += replaceInFile('components/AuditTeaser.tsx', [
    [`Dữ liệu hợp lệ`, `Data Valid`],
    [`Có lỗi cần sửa`, `Errors Need Fixing`],
    [`dòng dữ liệu`, `data rows`],
    [`Phát hiện`, `Found`],
    [`lỗi nghiêm trọng`, `critical errors`],
    [`Không phát hiện lỗi`, `No errors found`],
]);

total += replaceInFile('components/settings/SubscriptionBadge.tsx', [
    [`phòng`, `rooms`],
    [` tháng`, ` months`],
    [`Gói hiện tại`, `Current Plan`],
    [`Đang tải gói`, `Loading plan`],
    [`nên dùng band`, `should use band`],
    [`Chỉnh tại PLG Admin`, `Adjust in PLG Admin`],
    [`vượt band`, `exceeds band`],
    [`Liên hệ quản trị viên`, `Contact admin`],
    [`Xem bảng giá`, `View Pricing`],
    [`Trial: còn`, `Trial:`],
    [`ngày`, `days`],
]);

total += replaceInFile('app/data/DeleteByMonthButton.tsx', [
    [`Xóa dữ liệu`, `Delete Data`],
    [`Bạn có chắc`, `Are you sure`],
    [`xóa tất cả`, `delete all`],
    [`Đang xóa`, `Deleting`],
]);

total += replaceInFile('components/gates/QuotaWarning.tsx', [
    [`Đã đạt giới hạn`, `Limit reached`],
    [`Nâng cấp để tiếp tục`, `Upgrade to continue`],
]);

total += replaceInFile('components/gates/FeatureGate.tsx', [
    [`Tính năng yêu cầu`, `Feature requires`],
    [`Nâng cấp`, `Upgrade`],
]);

total += replaceInFile('components/billing/PromoRedeemCard.tsx', [
    [`Nhập mã khuyến mại`, `Enter promo code`],
    [`Áp dụng`, `Apply`],
    [`Mã không hợp lệ`, `Invalid code`],
]);

total += replaceInFile('components/paywall/TierPaywall.tsx', [
    [`Nâng cấp`, `Upgrade`],
    [`Tính năng`, `Feature`],
    [`yêu cầu gói`, `requires plan`],
]);

total += replaceInFile('app/payment/cancel/page.tsx', [
    [`Thanh toán bị hủy`, `Payment Cancelled`],
    [`Quay lại`, `Go Back`],
]);

total += replaceInFile('components/dashboard/RoomLosMixPanel.tsx', [
    [`Phân bố hạng phòng`, `Room Type Distribution`],
    [`Phân bố thời gian lưu trú`, `Length of Stay`],
    [`đêm`, `nights`],
]);

total += replaceInFile('components/dashboard/QuickModePanel.tsx', [
    [`Chế độ nhanh`, `Quick Mode`],
    [`Duyệt tất cả`, `Approve All`],
]);

total += replaceInFile('components/dashboard/DashboardTabs.tsx', [
    [`Phân tích`, `Analytics`],
]);

total += replaceInFile('components/pricing/SeasonConfigPanel.tsx', [
    [`Lỗi:`, `Error:`],
    [`Chưa có season`, `No seasons`],
    [`khoảng`, `ranges`],
]);

total += replaceInFile('components/pricing/SeasonRateEditor.tsx', [
    [`Đã lưu rates`, `Rates saved`],
    [`Lưu NET`, `Save NET`],
]);

total += replaceInFile('components/pricing/RoomTypesTab.tsx', [
    [`Xác nhận xóa hạng phòng`, `Confirm delete room type`],
]);

total += replaceInFile('components/pricing/OccTierEditor.tsx', [
    [`Chưa lưu`, `Unsaved`],
    [`Đã lưu thành công`, `Saved successfully`],
    [`Lưu bậc OCC`, `Save OCC Tiers`],
]);

total += replaceInFile('components/pricing/OTAConfigTab.tsx', [
    [`Xác nhận xóa kênh OTA`, `Confirm delete OTA channel`],
    [`Đang hoạt động`, `Active`],
]);

// Settings components
total += replaceInFile('components/settings/OrgContextBadge.tsx', [
    [`Tổ chức`, `Organization`],
    [`Không tìm thấy`, `Not found`],
]);

total += replaceInFile('components/settings/QuotaUsagePanel.tsx', [
    [`Hạn mức sử dụng`, `Usage Quotas`],
    [`Đang tải hạn mức`, `Loading quotas`],
    [`Lưu trữ dữ liệu`, `Data Retention`],
    [` tháng`, ` months`],
]);

// Other smaller files
total += replaceInFile('app/analytics/page.tsx', [
    [`Phân tích`, `Analytics`],
    [`Đang tải`, `Loading`],
]);

total += replaceInFile('app/dashboard/layout.tsx', [
    [`Đang tải`, `Loading`],
]);

total += replaceInFile('app/dashboard/loading.tsx', [
    [`Đang tải`, `Loading`],
]);

total += replaceInFile('app/pricing-plans/layout.tsx', [
    [`Bảng giá`, `Pricing`],
]);

total += replaceInFile('app/rate-shopper/competitors/page.tsx', [
    [`Đối thủ`, `Competitors`],
]);

total += replaceInFile('app/onboarding/page.tsx', [
    [`Đang xử lý`, `Processing`],
    [`Tiếp tục`, `Continue`],
]);

total += replaceInFile('components/analytics/SupplyChart.tsx', [
    [`phòng`, `rooms`],
]);

total += replaceInFile('components/analytics/DodChips.tsx', [
    [`ngày`, `day`],
]);

total += replaceInFile('components/analytics/ForecastAccuracyChart.tsx', [
    [`Độ chính xác`, `Accuracy`],
]);

total += replaceInFile('components/analytics/DataQualityBadge.tsx', [
    [`chất lượng dữ liệu`, `Data Quality`],
]);

total += replaceInFile('components/shared/ExportPdfButton.tsx', [
    [`Xuất báo cáo`, `Export Report`],
    [`Xuất PDF`, `Export PDF`],
    [`Báo cáo`, `Report`],
]);

total += replaceInFile('components/shared/DataStatusBadge.tsx', [
    [`Đủ dữ liệu`, `Data Complete`],
    [`Thiếu`, `Missing`],
]);

total += replaceInFile('components/payments/PayPalCheckout.tsx', [
    [`Có lỗi xảy ra`, `An error occurred`],
    [`Đang tạo đơn`, `Creating order`],
    [`Đang kết nối`, `Connecting`],
]);

total += replaceInFile('components/payments/PaymentMethodModal.tsx', [
    [`Có lỗi xảy ra`, `An error occurred`],
    [`Quay lại`, `Go Back`],
    [`Thử lại`, `Retry`],
]);

// WhenToBoost
total += replaceInFile('components/guide/WhenToBoost.tsx', [
    [`Khi nào nên`, `When should you`],
    [`Đẩy mạnh`, `Boost`],
    [`quyết định`, `decision`],
    [`Lý do`, `Reason`],
    [`Kỳ vọng`, `Expected`],
    [`Ghi nhận`, `Record`],
]);

// ScorecardInputModal
total += replaceInFile('components/guide/ScorecardInputModal.tsx', [
    [`Cập nhật chỉ số`, `Update Metrics`],
    [`Nhập dữ liệu`, `Enter data`],
    [`Hủy bỏ`, `Cancel`],
    [`Lưu chỉ số`, `Save Metrics`],
]);

// Admin PricingTab
total += replaceInFile('components/admin/PricingTab.tsx', [
    [`Chỉnh sửa`, `Edit`],
    [`Thêm mới`, `Add New`],
    [`Chọn gói`, `Select Plan`],
    [`Chọn band`, `Select Band`],
    [`Chọn kỳ hạn`, `Select Term`],
    [`Giảm giá`, `Discount`],
    [`Hiệu lực từ`, `Effective From`],
    [`Nhãn`, `Label`],
    [`Ghi chú`, `Notes`],
    [`Đang lưu`, `Saving`],
    [`Tạo mới`, `Create`],
    [`Cập nhật`, `Update`],
    [`Vĩnh viễn`, `Permanent`],
    [`Hủy kích hoạt`, `Deactivate`],
    [`Chưa có config`, `No config`],
    [`Đang seed`, `Seeding`],
    [`Seed thất bại`, `Seed failed`],
    [`Đang tải cấu hình`, `Loading config`],
    [`Tính giá thực tế`, `Calculate actual price`],
    [`Đang tính toán`, `Calculating`],
    [`Khách trả`, `Customer pays`],
    [`so với monthly`, `vs monthly`],
    [`Giá gốc monthly`, `Monthly base price`],
    [`Giá gốc theo gói`, `Base Price by Plan`],
    [`Hệ số nhân theo quy mô phòng`, `Multiplier by Room Band`],
    [`Chiết khấu theo kỳ hạn`, `Discount by Term`],
    [`phòng`, `rooms`],
    [` tháng`, ` months`],
    [`Gói`, `Plan`],
    [`Giá/tháng`, `Price/month`],
    [`Band`, `Band`],
    [`Hệ số`, `Multiplier`],
    [`Kỳ hạn`, `Term`],
]);

console.log(`\n🎯 Cleanup Total: ${total} replacements`);
