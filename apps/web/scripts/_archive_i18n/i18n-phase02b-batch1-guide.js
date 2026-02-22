/**
 * Phase 02B - Batch 1: Guide Page (guide/page.tsx)
 * ~316 Vietnamese strings → English
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'app', 'guide', 'page.tsx');

const replacements = [
    // ═══ SECTIONS nav labels (lines 19-63) ═══
    [`'Bắt đầu nhanh'`, `'Quick Start'`],
    [`'Routine 5 phút mỗi sáng'`, `'5-Minute Morning Routine'`],
    [`'5 bước bắt đầu'`, `'5 Steps to Get Started'`],
    [`'Thuật ngữ đầy đủ'`, `'Full Glossary'`],
    [`'Lỗi hay gặp'`, `'Common Issues'`],
    [`'Quản lý Doanh thu'`, `'Revenue Management'`],
    [`'Revenue Management là gì?'`, `'What is Revenue Management?'`],
    [`'Các thẻ KPI'`, `'KPI Cards'`],
    [`'Biểu đồ OTB'`, `'OTB Charts'`],
    [`'Bảng khuyến nghị giá'`, `'Price Recommendation Table'`],
    [`'Giá Linh Hoạt'`, `'Dynamic Pricing'`],
    [`'Mùa (Seasons)'`, `'Seasons'`],
    [`'Bậc OCC'`, `'OCC Tiers'`],
    [`'Thuật ngữ chuyên ngành'`, `'Industry Terminology'`],
    [`'Tính giá OTA'`, `'OTA Pricing'`],
    [`'Tổng quan'`, `'Overview'`],
    [`'2 công thức tính giá'`, `'2 Pricing Formulas'`],
    [`'Kênh OTA & Hoa hồng'`, `'OTA Channels & Commissions'`],
    [`'Khuyến mãi & Stacking'`, `'Promotions & Stacking'`],
    [`'So sánh giữa các kênh'`, `'Cross-Channel Comparison'`],
    [`'Bảng giá tổng hợp'`, `'Price Matrix'`],
    [`'Tính ngược (BAR → NET)'`, `'Reverse Calc (BAR → NET)'`],
    [`'Xuất CSV'`, `'Export CSV'`],
    [`'Quản lý dữ liệu'`, `'Data Management'`],
    [`'Import dữ liệu'`, `'Import Data'`],

    // ═══ TROUBLESHOOTING table (lines 68-75) ═══
    [`'Trang trắng, không có dữ liệu'`, `'Blank page, no data'`],
    [`'Chưa upload file PMS'`, `'PMS file not uploaded'`],
    [`'Vào Upload, kéo thả file XML/CSV từ PMS'`, `'Go to Upload, drag & drop XML/CSV file from PMS'`],
    [`'Upload thất bại'`, `'Upload failed'`],
    [`'Format file không đúng'`, `'Incorrect file format'`],
    [`'Dùng file XML hoặc CSV xuất từ PMS (Opera, RoomRaccoon, Cloudbeds)'`, `'Use XML or CSV file exported from PMS (Opera, RoomRaccoon, Cloudbeds)'`],
    [`'Pickup hiện \"N/A\"'`, `'Pickup shows \"N/A\"'`],
    [`'Cần ít nhất 2 lần upload'`, `'Need at least 2 uploads'`],
    [`'Upload thêm, chờ 7 ngày để có dữ liệu pickup'`, `'Upload more, wait 7 days for pickup data'`],
    [`'Forecast hiện \"Ước lượng\"'`, `'Forecast shows \"Estimate\"'`],
    [`'Thiếu dữ liệu pickup'`, `'Missing pickup data'`],
    [`'Tiếp tục upload hàng ngày, sau 2 tuần sẽ có forecast chính xác'`, `'Continue uploading daily, accurate forecast available after 2 weeks'`],
    [`'Giá quá cao / quá thấp'`, `'Price too high / too low'`],
    [`'Promotion stacking > 50%'`, `'Promotion stacking > 50%'`],
    [`'Giảm số lượng KM hoặc kiểm tra commission boosters'`, `'Reduce number of promotions or check commission boosters'`],
    [`'Season \"auto\" chọn sai mùa'`, `'Season \"auto\" selects wrong season'`],
    [`'Khoảng ngày Season chưa đúng'`, `'Season date range is incorrect'`],
    [`'Vào Config Season, kiểm tra date ranges'`, `'Go to Config Season, check date ranges'`],

    // ═══ Hero header (lines 135-167) ═══
    [`Hướng dẫn sử dụng RMS`, `RMS User Guide`],
    [`Tài liệu hướng dẫn cho General Manager và nhân viên quản lý doanh thu`, `Guide for General Managers and revenue management staff`],
    [`Lỗi & Khắc phục`, `Troubleshooting`],
    [`Tìm thuật ngữ, hướng dẫn... (Ctrl+K)`, `Search terms, guides... (Ctrl+K)`],
    [`5 phút mỗi sáng`, `5 min every morning`],
    [`30+ thuật ngữ`, `30+ terms`],
    // second occurrence of Lỗi & Khắc phục handled by AllowMultiple

    // ═══ Troubleshooting panel labels (lines 191-196) ═══
    [`Nguyên nhân: `, `Cause: `],
    [`Cách sửa: `, `Fix: `],
    [`>Mở `, `>Open `],

    // ═══ TierPaywall labels (lines 264-273) ═══
    [`'Hieu OTB (On The Books) va Pickup'`, `'Understand OTB (On The Books) & Pickup'`],
    [`'Phan tich Booking Pace & Remaining Supply'`, `'Analyze Booking Pace & Remaining Supply'`],
    [`'Chien luoc dinh gia theo demand'`, `'Demand-based pricing strategy'`],
    [`'Daily Actions workflow hang ngay'`, `'Daily Actions workflow'`],

    // ═══ KPIExplain component (line 340) ═══
    [`<strong>Ý nghĩa:</strong>`, `<strong>Meaning:</strong>`],

    // ═══ QuickStartSection — Morning Routine (lines 379-404) ═══
    [`"Routine 5 phút mỗi sáng"`, `"5-Minute Morning Routine"`],
    [`Làm theo 6 bước này mỗi sáng để quản lý doanh thu hiệu quả:`, `Follow these 6 steps every morning for effective revenue management:`],
    [`'Build dữ liệu'`, `'Build Data'`],
    [`'Xem Dashboard'`, `'View Dashboard'`],
    [`'Accept/Override giá'`, `'Accept/Override Price'`],
    [`'Cập nhật OTA'`, `'Update OTA'`],
    [`Tổng thời gian: khoảng 5 phút. Upload xong, hệ thống tự động xử lý dữ liệu.`, `Total time: ~5 minutes. After upload, the system processes data automatically.`],

    // ═══ QuickStartSection — 5 Steps (lines 408-449) ═══
    [`"5 bước bắt đầu"`, `"5 Steps to Get Started"`],
    [`"Đăng nhập"`, `"Sign In"`],
    [`Sử dụng tài khoản Google được admin cấp. Sau khi đăng nhập, bạn sẽ thấy khách sạn được gán trong sidebar.`, `Use the Google account provided by admin. After signing in, you'll see your assigned hotel in the sidebar.`],
    [`Nếu chưa có quyền truy cập, liên hệ admin qua Zalo: 0778602953`, `If you don't have access, contact admin via Zalo: 0778602953`],
    [`"Upload dữ liệu từ PMS"`, `"Upload Data from PMS"`],
    [`Vào menu <strong>Upload</strong> &rarr; Kéo thả file XML hoặc CSV từ PMS (Opera, RoomRaccoon, Cloudbeds...).`, `Go to <strong>Upload</strong> menu → Drag & drop XML or CSV file from PMS (Opera, RoomRaccoon, Cloudbeds...).`],
    [`>Mở trang Upload<`, `>Open Upload Page<`],
    [`Upload dữ liệu mỗi ngày (sáng) để có số liệu chính xác nhất.`, `Upload data daily (morning) for the most accurate metrics.`],
    [`"Build dữ liệu (tự động)"`, `"Build Data (automatic)"`],
    [`Vào menu <strong>Dữ liệu</strong> &rarr; Nhấn các nút theo thứ tự:`, `Go to <strong>Data</strong> menu → Click buttons in order:`],
    [`>Mở trang Dữ liệu<`, `>Open Data Page<`],
    [`"Xem Dashboard"`, `"View Dashboard"`],
    [`<strong>Charts:</strong> Biểu đồ OTB theo ngày, so sánh năm trước`, `<strong>Charts:</strong> Daily OTB chart, year-over-year comparison`],
    [`<strong>Price Table:</strong> Giá khuyến nghị cho từng ngày`, `<strong>Price Table:</strong> Recommended price for each day`],
    [`>Mở Dashboard<`, `>Open Dashboard<`],
    [`"Ra Quyết định Giá"`, `"Make Pricing Decisions"`],
    [`Đồng ý với giá hệ thống đề xuất`, `Accept system-recommended price`],
    [`Nhập giá theo ý mình`, `Enter your own price`],

    // ═══ Glossary (lines 452-475) ═══
    [`"Thuật ngữ chuyên ngành"`, `"Industry Terminology"`],
    [`Thuật ngữ`, `Term`],
    [`Giải thích`, `Definition`],
    [`'On The Books — Số phòng/doanh thu đã được đặt'`, `'On The Books — Rooms/revenue already booked'`],
    [`'Average Daily Rate — Giá phòng trung bình'`, `'Average Daily Rate — Average room price'`],
    [`'Revenue Per Available Room — Doanh thu/phòng khả dụng'`, `'Revenue Per Available Room'`],
    [`'Tỷ lệ lấp đầy — % phòng được bán'`, `'Occupancy rate — % of rooms sold'`],
    [`'Lượng booking mới trong khoảng thời gian'`, `'New bookings within a time period'`],
    [`'Best Available Rate — Giá gốc trên OTA (trước KM)'`, `'Best Available Rate — Base price on OTA (before promos)'`],
    [`'Giá thu về thực tế sau hoa hồng và KM'`, `'Actual revenue after commission and promotions'`],
    [`'Giá khách thấy trên OTA (sau KM)'`, `'Price guests see on OTA (after promos)'`],
    [`'Same Time Last Year — So sánh cùng kỳ năm trước'`, `'Same Time Last Year — Year-over-year comparison'`],
    [`'Tốc độ bán phòng — so sánh với cùng kỳ'`, `'Booking pace — compared to same period'`],
    [`'Hoa hồng OTA thu (VD: Agoda 20%, Booking 18%)'`, `'OTA commission (e.g. Agoda 20%, Booking 18%)'`],
    [`'Kết hợp nhiều KM cùng lúc (cộng dồn / luỹ tiến / chọn 1)'`, `'Combining multiple promos (additive / progressive / pick one)'`],

    // ═══ FAQ section (lines 478-495) ═══
    [`"Lỗi hay gặp & FAQ"`, `"Common Issues & FAQ"`],
    [`Phần lớn cảnh báo là `, `Most warnings are `],
    [` — dữ liệu có các ngày lưu trú đã qua.`, ` — data has past stay dates.`],
    [`'Tất cả dữ liệu đều hợp lệ.'`, `'All data is valid.'`],
    [`<strong>Khách sạn của bạn:</strong> `, `<strong>Your hotel:</strong> `],
    [` dòng OTB`, ` OTB rows`],
    [`, trong đó `, `, of which `],
    [` dòng đã qua (`, ` rows are past (`],
    [`). Hoàn thiện: `, `). Completeness: `],
    [`"Pickup TB: N/A" — Tại sao không hiện số?`, `"Avg Pickup: N/A" — Why no numbers?`],
    [`<strong>Pickup</strong> = So sánh số phòng đặt hôm nay với 7 ngày trước. Cần ít nhất <strong>2 lần upload cách nhau &#8805; 7 ngày</strong>.`, `<strong>Pickup</strong> = Compare today's bookings with 7 days ago. Need at least <strong>2 uploads ≥ 7 days apart</strong>.`],
    [`Dự báo hiện "Ước lượng" — Có chính xác không?`, `Forecast shows "Estimate" — Is it accurate?`],
    [`Khi chưa có đủ dữ liệu pickup, hệ thống dùng ước lượng sơ bộ. Sau <strong>&#8805; 2 lần upload cách nhau &#8805; 7 ngày</strong>, dự báo sẽ dựa trên pickup thực tế.`, `Without enough pickup data, the system uses rough estimates. After <strong>≥ 2 uploads ≥ 7 days apart</strong>, forecast will be based on actual pickup.`],
    [`Upload xong nhưng không thấy data?`, `Uploaded but no data showing?`],
    [`Kiểm tra: (1) File đúng định dạng XML/CSV, (2) Chạy Build OTB &rarr; Build Features &rarr; Run Forecast, (3) Đợi vài giây để hệ thống xử lý.`, `Check: (1) File is in XML/CSV format, (2) Run Build OTB → Build Features → Run Forecast, (3) Wait a few seconds for processing.`],

    // ═══ CTA buttons (lines 497-502) ═══
    [`Đã sẵn sàng? Bắt đầu ngay!`, `Ready? Let's get started!`],
    [`> Upload dữ liệu<`, `> Upload Data<`],
    [`> Xem Dashboard<`, `> View Dashboard<`],

    // ═══ AnalyticsSection — RM Intro (lines 512-531) ═══
    [`Revenue Management (RM) = <strong>bán đúng phòng, đúng giá, đúng thời điểm</strong> để tối ưu doanh thu. Hệ thống giúp bạn:`, `Revenue Management (RM) = <strong>selling the right room, at the right price, at the right time</strong> to maximize revenue. The system helps you:`],
    [`>Theo dõi OTB<`, `>Monitor OTB<`],
    [`Bao nhiêu phòng đã đặt, bao nhiêu còn trống`, `How many rooms are booked, how many are available`],
    [`>Dự báo Demand<`, `>Forecast Demand<`],
    [`Predict booking pace cho 30–90 ngày tới`, `Predict booking pace for the next 30–90 days`],
    [`>Khuyến nghị giá<`, `>Price Recommendation<`],
    [`Accept giá hệ thống hoặc Override theo ý mình`, `Accept system price or Override with your own`],

    // ═══ KPI section (lines 533-541) ═══
    [`"Hôm nay đang bán tốt không?"`, `"Are we selling well today?"`],
    [`Dashboard hiển thị 4 thẻ KPI chính. Đọc theo câu hỏi GM hay hỏi:`, `Dashboard shows 4 main KPI cards. Read them by common GM questions:`],
    [`Số phòng đã đặt. VD: OTB = 45 nghĩa là bạn đã bán 45 phòng cho ngày đó.`, `Rooms already booked. E.g.: OTB = 45 means you've sold 45 rooms for that day.`],
    [`Số phòng còn trống. VD: Remaining = 15 nghĩa là còn 15 phòng cần bán.`, `Rooms still available. E.g.: Remaining = 15 means 15 rooms left to sell.`],
    [`Số phòng mới đặt trong 7 ngày qua. Pickup = +8 là tốt (demand tăng).`, `New bookings in the last 7 days. Pickup = +8 is good (demand increasing).`],
    [`Giá phòng trung bình. VD: ADR = 1.2M nghĩa là trung bình thu 1.2 triệu/phòng/đêm.`, `Average room price. E.g.: ADR = 1.2M means averaging 1.2M per room per night.`],
    [`>Mở Dashboard xem KPI<`, `>Open Dashboard to View KPIs<`],

    // ═══ Charts section (lines 544-561) ═══
    [`"So với năm ngoái thì sao?"`, `"How does it compare to last year?"`],
    [`Biểu đồ OTB giúp bạn so sánh hiệu suất với <strong>cùng kỳ năm trước (STLY)</strong>:`, `OTB chart helps you compare performance with <strong>Same Time Last Year (STLY)</strong>:`],
    [`<strong>OTB năm nay</strong> — Đường xanh: số phòng đặt hiện tại`, `<strong>Current Year OTB</strong> — Blue line: current bookings`],
    [`<strong>STLY</strong> — Đường xám: số phòng cùng kỳ năm trước`, `<strong>STLY</strong> — Gray line: bookings same time last year`],
    [` — <span className="text-emerald-600">+5 OTB</span> = bán nhanh hơn năm trước 5 phòng`, ` — <span className="text-emerald-600">+5 OTB</span> = selling 5 rooms ahead of last year`],
    [`Nếu Pace âm (−), nghĩa là bán chậm hơn năm ngoái &rarr; cần xem xét giảm giá hoặc tăng KM.`, `If Pace is negative (−), you're selling slower than last year → consider lowering prices or increasing promotions.`],

    // ═══ Recommendation Table section (lines 563-691) ═══
    [`"Cách đọc bảng Giá Đề Xuất"`, `"How to Read the Price Recommendation Table"`],
    [`Dashboard có <strong>2 chế độ xem</strong>: Duyệt nhanh (Quick) và Phân tích chi tiết (Detail).`, `Dashboard has <strong>2 view modes</strong>: Quick Review and Detailed Analysis.`],
    [`>⚡ Duyệt nhanh<`, `>⚡ Quick Review<`],
    [`Xem nhanh giá đề xuất, hành động (Tăng/Giảm/Giữ), và bấm Duyệt.`, `Quick view of recommended prices, actions (Increase/Decrease/Keep), and approve.`],
    [`Dành cho: GM duyệt giá hàng ngày (5 phút)`, `For: GM daily price review (5 minutes)`],
    [`>📊 Phân tích chi tiết<`, `>📊 Detailed Analysis<`],
    [`Xem OTB, Còn, Dự báo, Anchor, ADR — hiểu TẠI SAO hệ thống đề xuất.`, `View OTB, Remaining, Forecast, Anchor, ADR — understand WHY the system recommends.`],
    [`Dành cho: phân tích sâu, override giá`, `For: deep analysis, price override`],
    [`Ý nghĩa các cột (Phân tích chi tiết)`, `Column Definitions (Detailed Analysis)`],
    [`>Cột<`, `>Column<`],
    [`>Ý nghĩa<`, `>Meaning<`],
    [`>Nguồn<`, `>Source<`],
    [`>Ngày<`, `>Date<`],
    [`>Ngày lưu trú (stay_date)<`, `>Stay date<`],
    [`>Số phòng đã đặt<`, `>Rooms booked<`],
    [`>Còn<`, `>Remaining<`],
    [`>Phòng còn trống (capacity – OTB)<`, `>Rooms available (capacity – OTB)<`],
    [`>tính toán<`, `>calculated<`],
    [`>D.Báo<`, `>Forecast<`],
    [`>Nhu cầu dự báo (remaining demand từ ML)<`, `>Forecasted demand (remaining demand from ML)<`],
    [`><strong>Giá neo</strong> — giá GM đang chọn bán<`, `><strong>Anchor price</strong> — price GM is currently selling at<`],
    [`>ADR (nhỏ)<`, `>ADR (small)<`],
    [`>Giá bán trung bình thực tế (tham khảo)<`, `>Actual average selling price (reference)<`],
    [`>Đề Xuất<`, `>Suggested<`],
    [`><strong>Giá hệ thống khuyến nghị</strong><`, `><strong>System recommended price</strong><`],
    [`>Hành Động<`, `>Action<`],
    [`>Tăng / Giảm / Giữ / Ngừng bán<`, `>Increase / Decrease / Keep / Stop Selling<`],
    [`>so sánh đề xuất vs anchor<`, `>compare suggested vs anchor<`],
    [`>Lý Do<`, `>Reason<`],
    [`>Giải thích: &quot;OTB X%, dự phóng Y%&quot;<`, `>Explanation: &quot;OTB X%, projected Y%&quot;<`],

    // ═══ Accordion titles & content (lines 604-691) ═══
    [`"OTB% vs Dự phóng% — khác nhau thế nào?"`, `"OTB% vs Projected% — What's the difference?"`],
    [`Số phòng đã đặt hiện tại / tổng phòng. <strong>Đây là thực tế</strong>, không dự đoán.`, `Current rooms booked / total rooms. <strong>This is actual data</strong>, not a prediction.`],
    [`>Dự phóng%<`, `>Projected%<`],
    [`Projected OCC = (OTB – huỷ dự kiến + booking mới dự kiến) / tổng phòng. <strong>Đây là dự đoán</strong> (có thể sai).`, `Projected OCC = (OTB – expected cancellations + expected new bookings) / total rooms. <strong>This is a prediction</strong> (may be inaccurate).`],
    [`VD: OTB = 162/270 = <strong>60%</strong>, dự phóng = (162 − 49 + 0) / 270 = <strong>42%</strong>`, `E.g.: OTB = 162/270 = <strong>60%</strong>, projected = (162 − 49 + 0) / 270 = <strong>42%</strong>`],
    [`Nghĩa là: hiện tại 60% phòng đã book, nhưng dự kiến cuối cùng chỉ còn 42% (do cancel).`, `Meaning: currently 60% rooms are booked, but projected final is only 42% (due to cancellations).`],
    [`"Anchor là gì? Tại sao không dùng ADR?"`, `"What is Anchor? Why not use ADR?"`],
    [`<strong>Anchor</strong> = giá GM đang chọn bán (intention signal):`, `<strong>Anchor</strong> = price GM is currently selling at (intention signal):`],
    [`<strong>Ưu tiên 1:</strong> Giá đã duyệt/override gần nhất cho ngày đó (last accepted)`, `<strong>Priority 1:</strong> Most recently approved/overridden price for that day (last accepted)`],
    [`<strong>Ưu tiên 2:</strong> Rack rate = Base Rate × Season (nếu chưa có decision)`, `<strong>Priority 2:</strong> Rack rate = Base Rate × Season (if no decision made yet)`],
    [`<strong>ADR</strong> (Average Daily Rate) = giá bán trung bình thực tế. Đây là <em>outcome signal</em> — bị nhiễu bởi room type mix, discount, OTA channel. <strong>Không dùng ADR làm gốc quyết định</strong> vì sẽ gây feedback loop (ADR cao → tăng giá → ADR cao hơn → xoắn ốc).`, `<strong>ADR</strong> (Average Daily Rate) = actual average selling price. This is an <em>outcome signal</em> — affected by room type mix, discounts, OTA channel. <strong>Don't use ADR as the pricing anchor</strong> as it creates a feedback loop (ADR high → raise price → ADR higher → spiral).`],
    [`ADR hiện dưới Anchor dưới dạng chữ nhỏ để tham khảo. Nếu ADR lệch Anchor `, `ADR is shown below Anchor in small text for reference. If ADR deviates from Anchor `],
    [`, banner vàng sẽ cảnh báo.`, `, a yellow warning banner will appear.`],
    [`"Hệ thống quyết định tăng/giảm giá thế nào?"`, `"How does the system decide to increase/decrease price?"`],
    [`Pricing Engine dùng <strong>Anchor + Projected OCC</strong> (không phải ADR):`, `Pricing Engine uses <strong>Anchor + Projected OCC</strong> (not ADR):`],
    [`'Chọn Anchor'`, `'Select Anchor'`],
    [`'Tính Projected OCC'`, `'Calculate Projected OCC'`],
    [`'Xác định Zone'`, `'Determine Zone'`],
    [`'Áp multiplier'`, `'Apply Multiplier'`],
    [`>Hệ số<`, `>Multiplier<`],
    [`>Hành động<`, `>Action<`],
    [`>Giảm mạnh<`, `>Sharp Decrease<`],
    [`>Giảm nhẹ<`, `>Slight Decrease<`],
    [`>Giữ giá<`, `>Hold Price<`],
    [`>Tăng<`, `>Increase<`],
    [`>Tăng mạnh<`, `>Sharp Increase<`],
    [`Bảng Zone`, `Zone Table`],
    [`"Banner vàng 'ADR lệch lớn' nghĩa là gì?"`, `"What does the 'Large ADR Deviation' yellow banner mean?"`],
    [`Khi nhiều ngày có ADR lệch `, `When many days have ADR deviating `],
    [` so với Anchor, hệ thống cảnh báo:`, ` from Anchor, the system warns:`],
    [`⚠️ ADR lệch lớn: X ngày có ADR lệch `, `⚠️ Large ADR Deviation: X days have ADR deviating `],
    [` so với giá anchor. Kiểm tra giá đã duyệt hoặc cập nhật Base Rate trong Settings.`, ` from anchor price. Check approved prices or update Base Rate in Settings.`],
    [`<strong>Nguyên nhân:</strong> Có thể do KM OTA quá nhiều, room type mix, hoặc Base Rate trong Settings chưa cập nhật.`, `<strong>Cause:</strong> May be due to too many OTA promotions, room type mix, or outdated Base Rate in Settings.`],
    [`<strong>Hành động:</strong> Kiểm tra Settings → Base Rate, hoặc review các quyết định giá đã duyệt.`, `<strong>Action:</strong> Check Settings → Base Rate, or review approved pricing decisions.`],
    [`"Khi nào GM nên Override giá?"`, `"When should GM Override the price?"`],
    [`Hệ thống đề xuất giá tự động, nhưng GM có quyền Override khi:`, `The system auto-recommends prices, but GM can Override when:`],
    [`<strong>Sự kiện đặc biệt</strong> mà hệ thống chưa biết (VIP group, event)`, `<strong>Special events</strong> that the system doesn't know about (VIP group, event)`],
    [` → thị trường trả giá cao hơn, cân nhắc tăng Anchor`, ` → market is paying higher, consider raising Anchor`],
    [` → có thể đang xả discount nhiều quá`, ` → may be giving too many discounts`],
    [`<strong>Competitor</strong> thay đổi giá đột ngột (chưa có rate shopper tích hợp)`, `<strong>Competitor</strong> changed prices suddenly (no integrated rate shopper yet)`],
    [`Rule vận hành: GM duyệt theo Anchor-based recommendation; ADR chỉ để xác nhận thị trường chấp nhận mức đó hay không (sanity check).`, `Operational rule: GM reviews Anchor-based recommendation; ADR is only for confirming whether the market accepts that level (sanity check).`],

    // ═══ Dynamic Pricing section (lines 695-758) ═══
    [`"Giá Linh Hoạt (Dynamic Pricing)"`, `"Dynamic Pricing"`],
    [`Giá Linh Hoạt tự động điều chỉnh giá theo <strong>3 yếu tố</strong>:`, `Dynamic Pricing auto-adjusts prices based on <strong>3 factors</strong>:`],
    [`>Mùa (Season)<`, `>Season<`],
    [`>OCC% (Bậc công suất)<`, `>OCC% (Occupancy Tier)<`],
    [`>Giá NET<`, `>NET Price<`],
    [`NET động = NET cơ sở (season) &times; Multiplier (OCC tier)`, `Dynamic NET = Base NET (season) × Multiplier (OCC tier)`],
    [`VD: Normal Season NET = 1.200.000 &times; 1.10 (OCC 50%) = <strong>1.320.000đ</strong>`, `E.g.: Normal Season NET = 1,200,000 × 1.10 (OCC 50%) = <strong>1,320,000₫</strong>`],
    [`>Mở tab Giá Linh Hoạt<`, `>Open Dynamic Pricing Tab<`],
    [`Season quyết định <strong>giá NET cơ sở</strong>. 3 loại mùa:`, `Season determines the <strong>base NET price</strong>. 3 season types:`],
    [`>Mức giá<`, `>Price Level<`],
    [`>Ví dụ<`, `>Example<`],
    [`>NET cơ sở<`, `>Base NET<`],
    [`>Cơ bản<`, `>Base<`],
    [`>Ngày thường, mùa thấp<`, `>Regular days, low season<`],
    [`>Cao<`, `>High<`],
    [`>Cuối tuần, hè, sự kiện<`, `>Weekends, summer, events<`],
    [`>Cao nhất<`, `>Highest<`],
    [`>Tết, Noel, 30/4, 2/9<`, `>Tet, Christmas, national holidays<`],
    [`"Bấm Config trên thanh điều khiển"`, `"Click Config on the toolbar"`],
    [`Panel &quot;Mùa (Seasons)&quot; sẽ hiện ra bên trái.`, `The &quot;Seasons&quot; panel will appear on the left.`],
    [`"Tạo Season"`, `"Create Season"`],
    [`Bấm nút <strong>+ NORMAL</strong>, <strong>+ HIGH</strong>, hoặc <strong>+ HOLIDAY</strong> để tạo season mới.`, `Click <strong>+ NORMAL</strong>, <strong>+ HIGH</strong>, or <strong>+ HOLIDAY</strong> to create a new season.`],
    [`"Thêm khoảng ngày"`, `"Add Date Range"`],
    [`Mở season &rarr; <strong>+ Thêm</strong> khoảng ngày &rarr; chọn ngày bắt đầu và kết thúc.`, `Open season → <strong>+ Add</strong> date range → select start and end dates.`],
    [`"Thiết lập NET rates"`, `"Set NET Rates"`],
    [`Trong mỗi season, nhập giá NET mong muốn cho từng hạng phòng.`, `In each season, enter the desired NET price for each room type.`],
    [`"Lưu"`, `"Save"`],
    [`Bấm <strong>Lưu</strong> để áp dụng. Bảng giá sẽ tự cập nhật.`, `Click <strong>Save</strong> to apply. The price table will update automatically.`],
    [`<strong>Quy tắc ưu tiên (auto-detect):</strong> Nếu 1 ngày thuộc nhiều season, hệ thống chọn season có <strong>priority cao nhất</strong>: Holiday (P3)`, `<strong>Priority rule (auto-detect):</strong> If a day belongs to multiple seasons, the system picks the <strong>highest priority</strong>: Holiday (P3)`],

    // ═══ OCC Tiers section (lines 738-757) ═══
    [`"Bậc OCC (Occupancy Tiers)"`, `"OCC Tiers (Occupancy Tiers)"`],
    [`<strong>OCC Tier</strong> là bậc thang giá theo công suất phòng. Mỗi bậc có <strong>hệ số nhân (multiplier)</strong>.`, `<strong>OCC Tier</strong> is a price tier based on occupancy. Each tier has a <strong>multiplier</strong>.`],
    [`>Bậc<`, `>Tier<`],
    [`Phòng còn nhiều &rarr; giá gốc`, `Many rooms available → base price`],
    [`Trung bình &rarr; tăng 10%`, `Average → increase 10%`],
    [`Gần kín &rarr; tăng 20%`, `Nearly full → increase 20%`],
    [`Sắp hết phòng &rarr; tăng 30%`, `Almost sold out → increase 30%`],
    [`OCC% được tính tự động từ dữ liệu OTB: <strong>OCC = Số phòng đã đặt / Tổng phòng khách sạn</strong>. Nếu chưa có dữ liệu, bạn có thể nhập tay.`, `OCC% is calculated automatically from OTB data: <strong>OCC = Rooms Booked / Total Hotel Rooms</strong>. If no data yet, you can enter manually.`],

    // ═══ Terms section (lines 760-778) ═══
    [`"Thuật ngữ Revenue Management"`, `"Revenue Management Terminology"`],
    [`'On The Books — Tổng số phòng/doanh thu đã đặt'`, `'On The Books — Total rooms/revenue booked'`],
    [`'Average Daily Rate — Giá phòng trung bình mỗi đêm'`, `'Average Daily Rate — Average room price per night'`],
    [`'Revenue Per Available Room — Doanh thu trên mỗi phòng khả dụng'`, `'Revenue Per Available Room'`],
    [`'Occupancy — Tỷ lệ lấp đầy phòng (% phòng đã bán)'`, `'Occupancy — Room fill rate (% rooms sold)'`],
    [`'Số phòng mới đặt thêm so với lần capture trước'`, `'New rooms booked since last capture'`],
    [`'Same Time Last Year — So sánh cùng kỳ năm trước'`, `'Same Time Last Year — Year-over-year comparison'`],
    [`'Chênh lệch OTB hiện tại vs STLY (nhanh hơn hay chậm hơn)'`, `'Difference between current OTB vs STLY (ahead or behind)'`],
    [`'Số ngày từ lúc đặt đến ngày lưu trú'`, `'Number of days between booking and stay date'`],

    // ═══ CTA - Analytics (lines 780-786) ═══
    [`Sẵn sàng xem dữ liệu khách sạn?`, `Ready to view your hotel data?`],
    [`> Mở Dashboard<`, `> Open Dashboard<`],
    [`> Đi tới Giá Linh Hoạt<`, `> Go to Dynamic Pricing<`],

    // ═══ PricingSection (lines 790-984) ═══
    [`"Tính giá OTA — Tổng quan"`, `"OTA Pricing — Overview"`],
    [`Hệ thống tính 3 loại giá từ <strong>1 giá gốc duy nhất (NET)</strong>:`, `The system calculates 3 price types from <strong>1 single base price (NET)</strong>:`],
    [`>Bạn thu về<`, `>You receive<`],
    [`>Giá gốc trên OTA<`, `>Base price on OTA<`],
    [`>Khách thấy (sau KM 15%)<`, `>Guest sees (after 15% promo)<`],

    // ═══ Pricing formulas (lines 819-833) ═══
    [`"2 Công thức tính giá"`, `"2 Pricing Formulas"`],
    [`>Công thức 1: NET &rarr; BAR (Forward)<`, `>Formula 1: NET → BAR (Forward)<`],
    [`>Công thức 2: BAR &rarr; Display (sau KM)<`, `>Formula 2: BAR → Display (after Promos)<`],
    [`Hệ thống tính tự động. Bạn chỉ cần nhập NET — BAR và Display được tính sẵn.`, `System calculates automatically. You only need to enter NET — BAR and Display are calculated for you.`],

    // ═══ OTA Channels (lines 835-876) ═══
    [`"Kênh OTA & Hoa hồng"`, `"OTA Channels & Commissions"`],
    [`Mỗi OTA có cách tính khác nhau. Bấm vào từng kênh để xem chi tiết:`, `Each OTA calculates differently. Click each channel for details:`],
    [`Agoda dùng <strong>ADDITIVE</strong> stacking: các KM cộng dồn vào nhau.`, `Agoda uses <strong>ADDITIVE</strong> stacking: promotions are added together.`],
    [`<strong>Chú ý:</strong> Nếu stacking quá nhiều KM, NET có thể giảm dưới mức mong muốn!`, `<strong>Note:</strong> If stacking too many promotions, NET may drop below desired level!`],
    [`Booking dùng <strong>PROGRESSIVE</strong> stacking: KM tính luỹ tiến (KM2 áp lên giá sau KM1).`, `Booking uses <strong>PROGRESSIVE</strong> stacking: promotions are applied progressively (promo 2 applies on price after promo 1).`],
    [`Sau Genius 20% = 1.000.000đ`, `After Genius 20% = 1,000,000₫`],
    [`Sau Mobile 10% = <strong>900.000đ</strong> (Display)`, `After Mobile 10% = <strong>900,000₫</strong> (Display)`],
    [`Tổng giảm thực tế: 28% (không phải 30%)`, `Total actual discount: 28% (not 30%)`],
    [`Expedia dùng <strong>HIGHEST_WINS</strong>: chỉ áp dụng 1 KM có % cao nhất.`, `Expedia uses <strong>HIGHEST_WINS</strong>: only the highest % promotion applies.`],
    [`VD: Có 3 KM: Package 20%, Member 15%, Flash 25% &rarr; chỉ áp <strong>Flash 25%</strong>.`, `E.g.: 3 promotions: Package 20%, Member 15%, Flash 25% → only <strong>Flash 25%</strong> applies.`],
    [`Traveloka dùng <strong>SINGLE</strong> (tương tự HIGHEST_WINS): chỉ 1 KM tại 1 thời điểm.`, `Traveloka uses <strong>SINGLE</strong> (similar to HIGHEST_WINS): only 1 promotion at a time.`],
    [`KM ưu tiên theo thứ tự: Flash Sale &rarr; PayLater &rarr; Coupon.`, `Promotion priority order: Flash Sale → PayLater → Coupon.`],
    [`CTRIP dùng <strong>ONLY_WITH_GENIUS</strong>: KM bổ sung chỉ áp dụng khi đã có KM chính.`, `CTRIP uses <strong>ONLY_WITH_GENIUS</strong>: add-on promos only apply when main promo is active.`],
    [`VD: CTrip VIP 15% (chính) + Extra 5% (chỉ khi có VIP) = 20%.`, `E.g.: CTrip VIP 15% (main) + Extra 5% (only with VIP) = 20%.`],

    // ═══ Promotions & Stacking (lines 878-900) ═══
    [`"Khuyến mại & Stacking Rules"`, `"Promotions & Stacking Rules"`],
    [`>Cộng dồn: 10% + 15% = <strong>25%</strong><`, `>Additive: 10% + 15% = <strong>25%</strong><`],
    [`>Luỹ tiến: áp KM2 lên giá sau KM1<`, `>Progressive: promo 2 applies on price after promo 1<`],
    [`>Chỉ áp KM có % cao nhất<`, `>Only the highest % promo applies<`],
    [`>Chỉ 1 KM / KM phụ thuộc KM chính<`, `>Only 1 promo / add-on depends on main promo<`],

    // ═══ Cross-channel comparison (lines 903-924) ═══
    [`"So sánh giữa các kênh OTA"`, `"Cross-Channel OTA Comparison"`],
    [`>Kênh<`, `>Channel<`],
    [`>Hoa hồng<`, `>Commission<`],
    [`Cùng 1 giá NET, mỗi kênh sẽ cho khách thấy giá khác nhau do cách tính KM và hoa hồng khác nhau.`, `Same NET price, each channel shows guests different prices due to different promo and commission calculations.`],

    // ═══ Price Matrix (lines 926-957) ═══
    [`"Bảng giá Ma trận"`, `"Price Matrix"`],
    [`Bảng giá hiển thị giá cho <strong>tất cả hạng phòng &times; tất cả bậc OCC</strong> cùng lúc.`, `Price matrix shows prices for <strong>all room types × all OCC tiers</strong> at once.`],
    [`>Thành phần<`, `>Element<`],
    [`>Cột &quot;Hạng phòng&quot;<`, `>Column &quot;Room Type&quot;<`],
    [`>Tên hạng phòng (Deluxe, Superior, Suite...)<`, `>Room type name (Deluxe, Superior, Suite...)<`],
    [`>Cột &quot;NET cơ sở&quot;<`, `>Column &quot;Base NET&quot;<`],
    [`>Giá NET theo season (chưa nhân OCC)<`, `>NET price by season (before OCC multiplier)<`],
    [`>Cột bậc OCC<`, `>OCC tier columns<`],
    [`>Giá sau khi nhân hệ số OCC (tùy chế độ: NET/BAR/Display)<`, `>Price after OCC multiplier (depends on mode: NET/BAR/Display)<`],
    [`>Cột highlight (xanh đậm)<`, `>Highlighted column (dark blue)<`],
    [`><strong>Bậc đang áp dụng</strong> theo OCC% thực tế<`, `><strong>Currently active tier</strong> based on actual OCC%<`],
    [`>Ô đỏ<`, `>Red cell<`],
    [`><strong>Vi phạm guardrail</strong> — giá quá cao hoặc quá thấp<`, `><strong>Guardrail violation</strong> — price too high or too low<`],
    [`3 chế độ xem:`, `3 view modes:`],
    [`>Thu về (NET)<`, `>Revenue (NET)<`],
    [`>Tiền khách sạn thực nhận<`, `>Actual hotel revenue<`],
    [`>Giá gốc trước KM, sau hoa hồng<`, `>Base price before promos, after commission<`],
    [`>Hiển thị (Display)<`, `>Display Price<`],
    [`>Giá khách thấy trên OTA<`, `>Price guests see on OTA<`],

    // ═══ Reverse calc (lines 959-967) ═══
    [`"Tính ngược: BAR &rarr; NET"`, `"Reverse Calc: BAR → NET"`],
    [`Khi bạn biết giá BAR và muốn biết NET thực nhận:`, `When you know the BAR price and want to know actual NET received:`],
    [`Tab &quot;Tính ngược&quot; trên trang Pricing cho phép bạn nhập BAR để tính NET cho từng kênh OTA.`, `The &quot;Reverse Calc&quot; tab on the Pricing page lets you enter BAR to calculate NET for each OTA channel.`],

    // ═══ Export CSV (lines 969-977) ═══
    [`"Xuất CSV"`, `"Export CSV"`],
    [`Bấm nút <strong>Export</strong> để tải bảng giá dưới dạng file CSV.`, `Click <strong>Export</strong> to download the price table as a CSV file.`],
    [`>Tất cả hạng phòng<`, `>All room types<`],
    [`>Giá NET cơ sở<`, `>Base NET prices<`],
    [`>Giá NET, BAR, Display cho từng bậc OCC<`, `>NET, BAR, Display prices for each OCC tier<`],
    [`Mở file CSV bằng Excel hoặc Google Sheets &rarr; In ra cho team Front Desk hoặc gửi cho Sales Manager để cập nhật giá lên OTA.`, `Open CSV with Excel or Google Sheets → Print for Front Desk team or send to Sales Manager to update OTA prices.`],

    // ═══ Pricing CTA (lines 979-984) ═══
    [`Sẵn sàng tính giá cho các kênh OTA?`, `Ready to calculate prices for OTA channels?`],
    [`> Mở Tính giá OTA<`, `> Open OTA Pricing<`],

    // ═══ DataSection (lines 988-1049) ═══
    [`Upload file dữ liệu từ PMS (Property Management System) để hệ thống có dữ liệu phân tích.`, `Upload data file from PMS (Property Management System) so the system has data to analyze.`],
    [`"Chuẩn bị file"`, `"Prepare File"`],
    [`Xuất dữ liệu booking từ PMS (Opera, RoomRaccoon, Cloudbeds...) dưới dạng <strong>XML hoặc CSV</strong>.`, `Export booking data from PMS (Opera, RoomRaccoon, Cloudbeds...) in <strong>XML or CSV</strong> format.`],
    [`File cần chứa: tên khách, ngày đặt, ngày lưu trú, hạng phòng, giá.`, `File must contain: guest name, booking date, stay date, room type, rate.`],
    [`"Upload file"`, `"Upload File"`],
    [`Kéo thả file vào vùng upload hoặc bấm chọn file.`, `Drag & drop file into upload area or click to select file.`],
    [`"Kiểm tra kết quả"`, `"Check Results"`],
    [`Hệ thống hiển thị số dòng dữ liệu được xử lý và cảnh báo (nếu có).`, `System shows number of data rows processed and warnings (if any).`],
    [`<strong>Upload mỗi ngày (sáng)</strong> để có số liệu chính xác nhất. Hệ thống tự động skip dòng trùng lập.`, `<strong>Upload daily (morning)</strong> for the most accurate data. System auto-skips duplicate rows.`],
    [`Bước này tổng hợp dữ liệu booking thành <strong>OTB (On The Books)</strong> — số phòng đã đặt cho từng ngày.`, `This step aggregates booking data into <strong>OTB (On The Books)</strong> — rooms booked per day.`],
    [`<strong>Input:</strong> Dữ liệu booking (từ Upload)`, `<strong>Input:</strong> Booking data (from Upload)`],
    [`<strong>Output:</strong> Bảng OTB: số phòng/doanh thu đã đặt cho mỗi stay_date`, `<strong>Output:</strong> OTB table: rooms/revenue booked per stay_date`],
    [`<strong>Thời gian:</strong> ~10–30 giây`, `<strong>Duration:</strong> ~10–30 seconds`],
    [`Tính các chỉ số phân tích từ dữ liệu OTB:`, `Calculate analytics metrics from OTB data:`],
    [`<strong>Pickup:</strong> Số phòng mới đặt (so sánh với 7 ngày trước)`, `<strong>Pickup:</strong> New rooms booked (compared to 7 days ago)`],
    [`<strong>STLY:</strong> Số phòng cùng kỳ năm trước`, `<strong>STLY:</strong> Rooms booked same time last year`],
    [`<strong>Pace:</strong> Tốc độ bán phòng so với năm trước`, `<strong>Pace:</strong> Booking pace compared to last year`],
    [`<strong>Remaining Supply:</strong> Số phòng còn trống`, `<strong>Remaining Supply:</strong> Rooms still available`],
    [`Cần ít nhất <strong>2 lần upload cách nhau 7 ngày</strong> để có Pickup thực tế. Trước đó, hệ thống sẽ hiện &quot;N/A&quot;.`, `Need at least <strong>2 uploads 7 days apart</strong> for actual Pickup. Before that, the system will show &quot;N/A&quot;.`],
    [`Dự báo số phòng sẽ đặt thêm trong tương lai dựa trên booking pace:`, `Forecast additional future bookings based on booking pace:`],
    [`<strong>Khi có đủ pickup:</strong> Dự báo chính xác dựa trên xu hướng thực tế`, `<strong>With enough pickup data:</strong> Accurate forecast based on actual trends`],
    [`<strong>Khi chưa có đủ pickup:</strong> Hiện &quot;Ước lượng&quot; bằng sơ bộ (ít chính xác hơn)`, `<strong>Without enough pickup data:</strong> Shows &quot;Estimate&quot; using rough approximation (less accurate)`],
    [`Sau khi hoàn thành 4 bước, quay lại Dashboard để xem KPI và Khuyến nghị giá mới nhất.`, `After completing all 4 steps, return to Dashboard to see latest KPIs and Price Recommendations.`],

    // ═══ Data CTA (lines 1041-1047) ═══
    [`Sẵn sàng xử lý dữ liệu?`, `Ready to process data?`],
    [`> Upload dữ liệu<`, `> Upload Data<`],
    [`> Mở trang Dữ liệu<`, `> Open Data Page<`],
];

// ── Run ──
let src = fs.readFileSync(FILE, 'utf8');
let count = 0;

for (const [from, to] of replacements) {
    if (src.includes(from)) {
        // Replace ALL occurrences
        const parts = src.split(from);
        const hits = parts.length - 1;
        src = parts.join(to);
        count += hits;
    }
}

fs.writeFileSync(FILE, src, 'utf8');
console.log(`✅ guide/page.tsx: ${count} replacements`);
