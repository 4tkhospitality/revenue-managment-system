/**
 * i18n-patch-analytics.js — Add missing analytics, dataStatus, and insightsEngine keys
 * Run: node scripts/i18n-patch-analytics.js
 */
const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '..', 'messages');

// ───────────────────── METRIC_TIPS keys for analytics ─────────────────────
const analyticsTipsEN = {
    asOf: "As-of: {date}",
    tipPaceLabel: "Pace vs LY",
    tipPaceTip: "Compare rooms sold this year vs STLY (Same Time Last Year). E.g.: +50% means 1.5x rooms sold.",
    tipPaceGood: "🟢 Positive = selling better than last year. 🔴 Negative = selling less → increase marketing.",
    tipPickupLabel: "Avg Pickup (7 days)",
    tipPickupTip: "Median rooms booked per day in last 7 days.",
    tipPickupGood: "🟢 Higher is better. 0 = not enough data.",
    tipSupplyLabel: "Avg Rem. Supply",
    tipSupplyTip: "Median rooms still available unsold.",
    tipSupplyGood: "🟢 Low = nearly full. 🟡 High = many empty rooms.",
    tipStlyLabel: "STLY Coverage",
    tipStlyTip: "Percent of days with STLY comparison data.",
    tipStlyGood: "🟢 ≥80% is good. 🟡 <50% = missing data.",
    tipT7Label: "T-7",
    tipT7Tip: "Rooms booked in last 7 days for those stay dates.",
    tipT7Good: "🟢 Positive = more booked. — = insufficient data.",
    tipT3Label: "T-3",
    tipT3Tip: "Additional rooms booked in last 3 days.",
    tipT3Good: "🟢 Positive = demand increasing. — = insufficient data.",
    tipOtbLabel: "OTB (On The Books)",
    tipOtbTip: "Total rooms booked for that stay date.",
    tipOtbGood: "Confirmed booked rooms. Closer to capacity = better.",
    tipStlyColLabel: "STLY",
    tipStlyColTip: "Same Time Last Year — rooms sold for corresponding dates last year.",
    tipStlyColGood: "Used for comparison: selling better or worse than last year?",
    tipPaceColLabel: "Pace",
    tipPaceColTip: "Percentage difference between this year and last year.",
    tipPaceColGood: "🟢 Positive = better. 🔴 Negative = worse → take action.",
    tipRemLabel: "Remaining",
    tipRemTip: "Remaining rooms = Total − OTB.",
    tipRemGood: "🟢 Low = nearly full. 🟡 High = many available.",
};

const analyticsTipsVI = {
    asOf: "Tính đến: {date}",
    tipPaceLabel: "Tốc độ vs Năm trước",
    tipPaceTip: "So sánh phòng bán năm nay vs cùng kỳ năm trước. VD: +50% nghĩa là bán gấp 1.5 lần.",
    tipPaceGood: "🟢 Dương = bán tốt hơn năm trước. 🔴 Âm = bán kém → tăng marketing.",
    tipPickupLabel: "TB Pickup (7 ngày)",
    tipPickupTip: "Trung bình phòng đặt mỗi ngày trong 7 ngày qua.",
    tipPickupGood: "🟢 Càng cao càng tốt. 0 = chưa đủ dữ liệu.",
    tipSupplyLabel: "TB Phòng Trống",
    tipSupplyTip: "Trung bình số phòng còn trống chưa bán.",
    tipSupplyGood: "🟢 Thấp = gần đầy. 🟡 Cao = nhiều phòng trống.",
    tipStlyLabel: "So sánh STLY",
    tipStlyTip: "Phần trăm ngày có dữ liệu so sánh cùng kỳ năm trước.",
    tipStlyGood: "🟢 ≥80% là tốt. 🟡 <50% = thiếu dữ liệu.",
    tipT7Label: "T-7",
    tipT7Tip: "Phòng đặt thêm trong 7 ngày qua cho các ngày lưu trú đó.",
    tipT7Good: "🟢 Dương = đặt thêm. — = chưa đủ dữ liệu.",
    tipT3Label: "T-3",
    tipT3Tip: "Phòng đặt thêm trong 3 ngày qua.",
    tipT3Good: "🟢 Dương = nhu cầu tăng. — = chưa đủ dữ liệu.",
    tipOtbLabel: "OTB (Đã đặt)",
    tipOtbTip: "Tổng phòng đã đặt cho ngày lưu trú đó.",
    tipOtbGood: "Phòng đã xác nhận. Gần tối đa = tốt.",
    tipStlyColLabel: "STLY",
    tipStlyColTip: "Cùng kỳ năm trước — số phòng bán cho các ngày tương ứng năm ngoái.",
    tipStlyColGood: "Dùng so sánh: năm nay bán tốt hơn hay kém hơn?",
    tipPaceColLabel: "Pace",
    tipPaceColTip: "Chênh lệch phần trăm giữa năm nay và năm trước.",
    tipPaceColGood: "🟢 Dương xanh = tốt hơn. 🔴 Âm đỏ = kém → hành động.",
    tipRemLabel: "Còn lại",
    tipRemTip: "Phòng còn lại = Tổng − OTB.",
    tipRemGood: "🟢 Thấp = gần đầy. 🟡 Cao = nhiều phòng trống.",
};

// ───────────────────── DataStatus keys ─────────────────────
const dataStatusEN = {
    dataComplete: "Data Complete",
    missingCancel: "Missing Cancellation Data",
    missingStly: "Missing STLY",
    missingSnapshots: "Missing Snapshots",
    missingBooktime: "Missing book_time",
    missingRoomcode: "Missing room_code",
};

const dataStatusVI = {
    dataComplete: "Dữ liệu đầy đủ",
    missingCancel: "Thiếu dữ liệu hủy",
    missingStly: "Thiếu dữ liệu STLY",
    missingSnapshots: "Thiếu snapshot",
    missingBooktime: "Thiếu book_time",
    missingRoomcode: "Thiếu room_code",
};

// ───────────────────── InsightsV2Engine keys ─────────────────────
const insightsEN = {
    dangerTitle: "DANGER — {date}",
    dangerWhat: "Only {occPct}% rooms booked{paceInfo}. Need ~{gap} more room nights to reach safe level",
    dangerPaceInfo: " — {points} points behind STLY",
    dangerSoWhat: "This date is behind the required pace — rooms will remain empty without early demand stimulation",
    dangerDoThis: "Reduce prices 8–15% on main channels to attract more bookings",
    dangerDoThisLow: "Need more data for specific recommendations — please upload more bookings",
    dangerImpact: "If filling 50% of vacant rooms → additional ~{amount}",
    dangerImpactLow: "Not enough data to estimate",
    hotTitle: "HOT — {date}",
    hotWhat: "{occPct}% rooms booked, only {remaining} rooms left{pickupInfo}",
    hotPickupInfo: ". Receiving ~{pickup} bookings per day",
    hotSoWhat: "Demand exceeds remaining supply — this is a good opportunity to raise prices",
    hotDoThis: "Raise prices 10–20%, prioritize low-commission channels (website, direct booking)",
    hotImpact: "If raising prices {pct}% for remaining rooms → additional ~{amount}",
    revenueTitle: "Potential Revenue — Next 30 Days",
    revenueWhat: "In the next 30 days, the hotel has {totalRemaining} room nights without bookings",
    revenueSoWhatForecast: "System has calculated demand forecast for all 30 days — sufficient info for pricing",
    revenueSoWhatNoForecast: "{days} days without demand forecast — more data needed",
    revenueDoThisLow: "Please upload more booking data for more detailed recommendations",
    revenueDoThisNoForecast: "Focus on {days} days without forecast — boost sales via website and loyal customers",
    revenueDoThisRec: "Go to Recommended Prices tab, select dates where recommended price is 5%+ above current → review and apply",
    revenueImpactRecHigh: "If applying recommended prices, additional revenue ~{amount} (+{pct}%)",
    revenueImpactLow: "Rough estimate ~{amount} — need more data for accuracy",
    revenueImpactAdr: "If selling all vacant rooms at current average price → additional ~{amount}",
    paceAheadTitle: "vs STLY: ahead by {delta} room nights",
    paceBehindTitle: "vs STLY: behind by {delta} room nights",
    paceWhat: "Booked {totalRN} room nights (STLY: {stlyRN}, {rnPct}%). ADR: {adr} (STLY: {stlyAdr}, {adrPct}%)",
    paceSoWhatUp: "Revenue increased mainly due to {driver}",
    paceSoWhatDown: "Revenue decreased mainly due to {driver}",
    paceDriverRate: "price changes",
    paceDriverVolume: "booking volume changes",
    paceDoThisLow: "Need more data for detailed recommendations — please upload more bookings",
    paceDoThisAheadRate: "Maintain pricing strategy, suggest room upgrades to increase revenue",
    paceDoThisAheadVolume: "Bookings are strong, prices can increase — consider adjusting rates",
    paceDoThisBehindVolume: "Need {delta} more room nights to match STLY — increase advertising or reduce prices on weak channels",
    paceDoThisBehindRate: "Rates are lower than STLY — limit deep discounts, review pricing strategy",
    paceImpact: "RevPAR: {direction} {pct}% vs STLY",
    paceImpactUp: "up",
    paceImpactDown: "down",
    accelTitle: "Bookings ACCELERATING",
    decelTitle: "Bookings DECELERATING",
    accelWhat: "Last 3 days: {t3} rooms/day. 7-day avg: {t7} rooms/day (diff {pct}%)",
    accelSoWhat: "Higher-than-normal bookings — possibly due to events, peak season, or last-minute demand",
    decelSoWhat: "Bookings declining vs last week — needs close monitoring and contingency planning",
    accelDoThisLow: "Please upload more booking data for more specific recommendations",
    accelDoThis: "No promotions needed for the next 7 days — organic demand is strong",
    decelDoThis: "Consider demand stimulation — review prices for dates with few bookings",
    accelImpact: "If maintaining good prices, avoid losing ~{amount} revenue",
    decelImpact: "Need to recover ~{amount} revenue vs last week",
    pricingHintNote: "Note: recent price changes may affect booking volume",
    cancelTitle: "30-day cancellation rate: {pct}%",
    cancelWhat: "Last week: {gross} new bookings, {cancelled} cancelled → net gain {net} room nights{topChannel}",
    cancelTopChannel: ". Top cancel channel: {channel}",
    cancelSoWhatHigh: "High cancellation rate — losing significant revenue each week",
    cancelSoWhatNormal: "Cancellation rate is normal — continue monitoring",
    cancelDoThisLow: "Need channel data for detailed cancellation analysis",
    cancelDoThisHigh: "Review cancellation policy — consider requiring deposits or cancellation fees",
    cancelDoThisNormal: "No action needed — continue weekly monitoring",
    cancelImpact: "Losing {count} room nights per week due to cancellations",
    oversellTitle: "Opportunity: Overbooking Strategy",
    oversellWhat: "With {pct}% cancel rate, can accept 5–8% more bookings for dates above 80% occupancy",
    oversellSoWhat: "Leverage cancellation trends to optimize revenue — walk risk is very low",
    oversellDoThis: "Allow 5–8% overbooking on dates above 80% occupancy",
    oversellImpact: "Recover ~{rn} room nights/month = +{amount}. Walk risk cost: {walkCost}/guest",
    segmentTitle: "{pct}% bookings from OTA channels (Booking.com, Agoda...)",
    segmentWhat: "Channel distribution: {breakdown}",
    segmentSoWhat: "Paying high OTA commissions — opportunity to shift guests to direct booking to reduce costs",
    segmentDoThisLow: "Need channel data for more accurate analysis",
    segmentDoThis: "Ensure best website prices + run promotions for direct bookers and loyal guests",
    segmentImpactLow: "Not enough channel data to estimate",
    segmentImpact: "If shifting 10% bookings from OTA to direct → save ~{amount}/year in commissions",
    pickupWeak: "pickup T7 weak",
    pickupAccelerating: "pickup accelerating",
    upliftLabel: "Uplift +{pct}% (~+{amount}) if applying PriceRec",
    roughEstimate: "~{amount} (rough estimate — wide range)",
    adrEstimate: "~{amount} (based on current ADR)",
};

const insightsVI = {
    dangerTitle: "NGUY HIỂM — {date}",
    dangerWhat: "Chỉ {occPct}% phòng đã đặt{paceInfo}. Cần thêm ~{gap} đêm phòng để đạt mức an toàn",
    dangerPaceInfo: " — {points} điểm sau STLY",
    dangerSoWhat: "Ngày này đang chậm so với tốc độ yêu cầu — phòng sẽ trống nếu không kích cầu sớm",
    dangerDoThis: "Giảm giá 8–15% trên các kênh chính để thu hút đặt phòng",
    dangerDoThisLow: "Cần thêm dữ liệu để đưa ra đề xuất cụ thể — vui lòng tải lên thêm booking",
    dangerImpact: "Nếu lấp 50% phòng trống → thêm ~{amount}",
    dangerImpactLow: "Chưa đủ dữ liệu để ước tính",
    hotTitle: "NÓNG — {date}",
    hotWhat: "{occPct}% phòng đã đặt, chỉ còn {remaining} phòng{pickupInfo}",
    hotPickupInfo: ". Đang nhận ~{pickup} booking/ngày",
    hotSoWhat: "Nhu cầu vượt cung — cơ hội tốt để tăng giá",
    hotDoThis: "Tăng giá 10–20%, ưu tiên kênh hoa hồng thấp (website, đặt trực tiếp)",
    hotImpact: "Nếu tăng giá {pct}% cho phòng còn lại → thêm ~{amount}",
    revenueTitle: "Doanh thu tiềm năng — 30 ngày tới",
    revenueWhat: "Trong 30 ngày tới, khách sạn có {totalRemaining} đêm phòng chưa có booking",
    revenueSoWhatForecast: "Hệ thống đã tính dự báo nhu cầu cho cả 30 ngày — đủ thông tin để định giá",
    revenueSoWhatNoForecast: "{days} ngày chưa có dự báo nhu cầu — cần thêm dữ liệu",
    revenueDoThisLow: "Vui lòng tải thêm dữ liệu booking để có đề xuất chi tiết hơn",
    revenueDoThisNoForecast: "Tập trung vào {days} ngày chưa có dự báo — đẩy bán qua website và khách hàng trung thành",
    revenueDoThisRec: "Vào tab Giá đề xuất, chọn ngày có giá đề xuất cao hơn hiện tại 5%+ → xem xét và áp dụng",
    revenueImpactRecHigh: "Nếu áp dụng giá đề xuất, doanh thu thêm ~{amount} (+{pct}%)",
    revenueImpactLow: "Ước tính sơ bộ ~{amount} — cần thêm dữ liệu để chính xác",
    revenueImpactAdr: "Nếu bán hết phòng trống với giá TB hiện tại → thêm ~{amount}",
    paceAheadTitle: "vs STLY: dẫn trước {delta} đêm phòng",
    paceBehindTitle: "vs STLY: đang chậm {delta} đêm phòng",
    paceWhat: "Đã đặt {totalRN} đêm phòng (STLY: {stlyRN}, {rnPct}%). ADR: {adr} (STLY: {stlyAdr}, {adrPct}%)",
    paceSoWhatUp: "Doanh thu tăng chủ yếu do {driver}",
    paceSoWhatDown: "Doanh thu giảm chủ yếu do {driver}",
    paceDriverRate: "thay đổi giá",
    paceDriverVolume: "thay đổi lượng đặt phòng",
    paceDoThisLow: "Cần thêm dữ liệu để đề xuất chi tiết — vui lòng tải thêm booking",
    paceDoThisAheadRate: "Duy trì chiến lược giá, đề xuất nâng hạng phòng để tăng doanh thu",
    paceDoThisAheadVolume: "Booking mạnh, giá có thể tăng — cân nhắc điều chỉnh giá",
    paceDoThisBehindVolume: "Cần thêm {delta} đêm phòng để bằng STLY — tăng quảng cáo hoặc giảm giá trên kênh yếu",
    paceDoThisBehindRate: "Giá thấp hơn STLY — hạn chế giảm giá sâu, xem lại chiến lược giá",
    paceImpact: "RevPAR: {direction} {pct}% vs STLY",
    paceImpactUp: "tăng",
    paceImpactDown: "giảm",
    accelTitle: "Booking TĂNG TỐC",
    decelTitle: "Booking GIẢM TỐC",
    accelWhat: "3 ngày qua: {t3} phòng/ngày. TB 7 ngày: {t7} phòng/ngày (chênh {pct}%)",
    accelSoWhat: "Booking cao bất thường — có thể do sự kiện, mùa cao điểm, hoặc nhu cầu phút chót",
    decelSoWhat: "Booking giảm so với tuần trước — cần theo dõi sát và có kế hoạch dự phòng",
    accelDoThisLow: "Vui lòng tải thêm dữ liệu booking để có đề xuất cụ thể hơn",
    accelDoThis: "Không cần khuyến mãi trong 7 ngày tới — nhu cầu tự nhiên đang mạnh",
    decelDoThis: "Cân nhắc kích cầu — xem lại giá cho các ngày ít booking",
    accelImpact: "Nếu giữ giá tốt, tránh mất ~{amount} doanh thu",
    decelImpact: "Cần phục hồi ~{amount} doanh thu so với tuần trước",
    pricingHintNote: "Lưu ý: thay đổi giá gần đây có thể ảnh hưởng đến lượng booking",
    cancelTitle: "Tỷ lệ hủy 30 ngày: {pct}%",
    cancelWhat: "Tuần qua: {gross} booking mới, {cancelled} bị hủy → tăng ròng {net} đêm phòng{topChannel}",
    cancelTopChannel: ". Kênh hủy nhiều nhất: {channel}",
    cancelSoWhatHigh: "Tỷ lệ hủy cao — mất doanh thu đáng kể mỗi tuần",
    cancelSoWhatNormal: "Tỷ lệ hủy bình thường — tiếp tục theo dõi",
    cancelDoThisLow: "Cần dữ liệu kênh để phân tích hủy chi tiết",
    cancelDoThisHigh: "Xem lại chính sách hủy — cân nhắc yêu cầu đặt cọc hoặc phí hủy",
    cancelDoThisNormal: "Không cần hành động — tiếp tục theo dõi hàng tuần",
    cancelImpact: "Mất {count} đêm phòng mỗi tuần do hủy",
    oversellTitle: "Cơ hội: Chiến lược Overbooking",
    oversellWhat: "Với tỷ lệ hủy {pct}%, có thể nhận thêm 5–8% booking cho ngày trên 80% occupancy",
    oversellSoWhat: "Tận dụng xu hướng hủy để tối ưu doanh thu — rủi ro walk rất thấp",
    oversellDoThis: "Cho phép overbooking 5–8% vào các ngày trên 80% occupancy",
    oversellImpact: "Phục hồi ~{rn} đêm phòng/tháng = +{amount}. Chi phí walk: {walkCost}/khách",
    segmentTitle: "{pct}% booking từ kênh OTA (Booking.com, Agoda...)",
    segmentWhat: "Phân bổ kênh: {breakdown}",
    segmentSoWhat: "Đang trả hoa hồng OTA cao — cơ hội chuyển khách sang đặt trực tiếp để giảm chi phí",
    segmentDoThisLow: "Cần dữ liệu kênh để phân tích chính xác hơn",
    segmentDoThis: "Đảm bảo giá website tốt nhất + chạy khuyến mãi cho khách đặt trực tiếp và khách trung thành",
    segmentImpactLow: "Chưa đủ dữ liệu kênh để ước tính",
    segmentImpact: "Nếu chuyển 10% booking từ OTA sang trực tiếp → tiết kiệm ~{amount}/năm hoa hồng",
    pickupWeak: "pickup T7 yếu",
    pickupAccelerating: "pickup đang tăng tốc",
    upliftLabel: "Tăng +{pct}% (~+{amount}) nếu áp dụng PriceRec",
    roughEstimate: "~{amount} (ước tính sơ bộ — biên độ rộng)",
    adrEstimate: "~{amount} (dựa trên ADR hiện tại)",
};

// ───────────────────── Patch function ─────────────────────
function patchFile(locale, analyticsKeys, dataStatusKeys, insightsEngineKeys) {
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Patch analytics namespace
    if (!json.analytics) json.analytics = {};
    Object.assign(json.analytics, analyticsKeys);

    // Patch dataStatus namespace (new)
    if (!json.dataStatus) json.dataStatus = {};
    Object.assign(json.dataStatus, dataStatusKeys);

    // Patch insightsEngine namespace (new)
    if (!json.insightsEngine) json.insightsEngine = {};
    Object.assign(json.insightsEngine, insightsEngineKeys);

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
    console.log(`✅ Patched ${locale}.json`);
}

patchFile('en', analyticsTipsEN, dataStatusEN, insightsEN);
patchFile('vi', analyticsTipsVI, dataStatusVI, insightsVI);
// For id/ms/th, use English as fallback (same as other namespaces)
patchFile('id', analyticsTipsEN, dataStatusEN, insightsEN);
patchFile('ms', analyticsTipsEN, dataStatusEN, insightsEN);
patchFile('th', analyticsTipsEN, dataStatusEN, insightsEN);

console.log('🎉 Done! analytics, dataStatus, insightsEngine keys added to all 5 languages.');
