/**
 * i18n-patch-analytics-tab.js
 * Adds translation keys for ALL analytics tab components:
 *   FullPipelineButton, StlyComparisonChart, SupplyChart, CancelForecastChart,
 *   AnalyticsKpiRow, AnalyticsControls, DodChips, DataQualityBadge,
 *   DatesToWatchPanel, ForecastAccuracyChart, BuildFeaturesInline,
 *   PaceTable, AnalyticsTabContent
 *
 * Usage: node scripts/i18n-patch-analytics-tab.js
 */
const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '..', 'messages');

// ─────────────────────────────────────────────────────────────
// English keys
// ─────────────────────────────────────────────────────────────
const analyticsTabEN = {
    // ── AnalyticsControls ──
    "asOf": "As-of:",
    "rooms": "Rooms",
    "revenue": "Revenue",

    // ── AnalyticsKpiRow ──
    "occ7d": "Occ 7d",
    "occ14d": "Occ 14d",
    "occ30d": "Occ 30d",
    "pace7d": "Pace 7d",
    "pace30d": "Pace 30d",
    "pickup7d": "Pickup 7d",
    "adr": "ADR",
    "vsYesterday": "vs qua:",
    "rms": "rms",
    "noYesterdaySnapshot": "No yesterday snapshot",

    // ── FullPipelineButton ──
    "pipelineTitle": "Analytics Pipeline",
    "runPipeline": "Run Full Pipeline",
    "running": "Running...",
    "stepOtbYesterday": "OTB (yesterday)",
    "stepOtbToday": "OTB (today)",
    "stepCancelStats": "Cancel Stats",
    "stepBuildFeatures": "Build Features",
    "stepRunForecast": "Run Forecast",
    "stepOptimizePricing": "Optimize Pricing",
    "stepFailed": "Step \"{step}\" failed",
    "unknownError": "Unknown error",

    // ── StlyComparisonChart ──
    "stlyTitle": "OTB vs STLY (60d) — {mode}",
    "stlyRooms": "Rooms",
    "stlyRevenue": "Revenue (M)",
    "thisYear": "This Year",
    "lastYear": "Last Year",

    // ── SupplyChart ──
    "supplyTitle": "Remaining Supply ({capacity} rooms)",
    "soldOut": "Sold out",
    "actualEmpty": "Actual Empty",
    "roomsOtb": "Rooms OTB",
    "available": "Available",
    "netAvailable": "Net Available",
    "cxlExpected": "+{cxl} CXL expected",

    // ── CancelForecastChart ──
    "cancelTitleEmpty": "Forecast Cancel rooms",
    "cancelTitle": "Forecast Cancel rooms (30 days remaining)",
    "noCancelData": "No cancel stats data. Run \"Build Features\" to generate.",
    "roomsHeld": "Rooms Held",
    "expectedCxl": "Expected Cancellations",
    "totalExpectedCxl": "Total expected cancellations: {count} rooms",
    "avgRate": "Avg Rate: {rate}%",
    "confidenceHigh": "🟢 Cao",
    "confidenceMedium": "🟡 TB",
    "confidenceLow": "🔴 Low",
    "confidenceFallback": "⚪ Default",

    // ── DodChips ──
    "comparedYesterday": "Compared to yesterday:",
    "topChange": "Top change:",

    // ── DataQualityBadge ──
    "qualityComplete": "{pct}% complete",
    "qualityPartial": "{pct}% — Partial data",
    "qualityLow": "Low confidence ({pct}%)",
    "rows": "{count} rows",
    "approx": "~{count} approx",
    "pickupDataT7": "Pickup data (T-7): {with}/{total} rows",
    "stlyCoverage": "STLY coverage: {pct}%",
    "stlyNearestDow": "~{count} STLY dùng nearest DOW",
    "missingSnapshots": "Missing snapshots so pace/pickup is incomplete. Results are for reference only.",

    // ── DatesToWatchPanel ──
    "datesToWatch": "Dates to Watch",

    // ── ForecastAccuracyChart ──
    "demandForecastTitle": "Demand Forecast (30 days)",
    "mapeLabel": "MAPE: {mape}% ({days} days remaining)",
    "actual": "Actual",
    "demandForecast": "Demand Forecast",

    // ── BuildFeaturesInline ──
    "noPickupStly": "No Pickup/STLY data for {date}",
    "buildHint": "Basic OTB still shows. Build features to see full Pickup, Pace, STLY.",
    "buildThisDate": "Build this date",
    "buildAll": "Build all",
    "rebuildForce": "🔄 Rebuild all (force)",
    "stop": "Stop",
    "building": "Building...",
    "daysProgress": "{done}/{total} days remaining",
    "builtSkipped": "({built} built, {skipped} skipped)",

    // ── PaceTable ──
    "bookingPace": "Booking Pace (Pickup)",
    "clickCollapse": "Click to collapse",
    "clickExpand": "Click to expand detail table",
    "stayDates": "{count} stay dates",
    "avgOcc7d": "Avg Occ 7d",
    "avgOcc30d": "Avg Occ 30d",
    "paceVsLy": "Pace vs LY",
    "avgAdr": "Avg ADR",
    "pickupWindows": "Pickup windows:",
    "hideT15T30": "− Hide T-15, T-30",
    "addT15T30": "+ Add T-15, T-30",
    "dateCol": "Date",
    "dowCol": "DOW",
    "otbCol": "OTB",
    "occCol": "Occ%",
    "supplyCol": "Supply",
    "vsStlyCol": "vs STLY",
    "adrCol": "ADR",
    "revparCol": "RevPAR",
    "dodCol": "DOD",
    "noFeaturesData": "No features data. Run Build Features first.",
    "totalDays": "Total ({count} days remaining)",

    // ── AnalyticsTabContent ──
    "loadingAnalytics": "Loading Analytics...",
    "noDataTitle": "No Analytics data available",
    "noDataSteps": "Step 1: Upload reservations → Step 2: Build OTB → Step 3: Build Features",
    "paywallTitle": "Pace & Pickup Analytics",
    "paywallSubtitle": "STLY Analysis, Booking Pace, Remaining Supply",
    "featureStly": "Same Time Last Year (STLY) comparison",
    "featurePace": "Booking Pace — track booking velocity",
    "featurePickup": "Detailed Pickup T-3/T-7/T-15/T-30",
    "featureSupply": "Remaining Supply — available rooms",
};

// ─────────────────────────────────────────────────────────────
// Vietnamese keys
// ─────────────────────────────────────────────────────────────
const analyticsTabVI = {
    // ── AnalyticsControls ──
    "asOf": "Ngày:",
    "rooms": "Phòng",
    "revenue": "Doanh thu",

    // ── AnalyticsKpiRow ──
    "occ7d": "CS 7n",
    "occ14d": "CS 14n",
    "occ30d": "CS 30n",
    "pace7d": "Tốc độ 7n",
    "pace30d": "Tốc độ 30n",
    "pickup7d": "Pickup 7n",
    "adr": "ADR",
    "vsYesterday": "so hôm qua:",
    "rms": "phòng",
    "noYesterdaySnapshot": "Chưa có snapshot hôm qua",

    // ── FullPipelineButton ──
    "pipelineTitle": "Quy trình phân tích",
    "runPipeline": "Chạy toàn bộ",
    "running": "Đang chạy...",
    "stepOtbYesterday": "OTB (hôm qua)",
    "stepOtbToday": "OTB (hôm nay)",
    "stepCancelStats": "Thống kê hủy",
    "stepBuildFeatures": "Tạo Features",
    "stepRunForecast": "Chạy Forecast",
    "stepOptimizePricing": "Tối ưu giá",
    "stepFailed": "Bước \"{step}\" thất bại",
    "unknownError": "Lỗi không xác định",

    // ── StlyComparisonChart ──
    "stlyTitle": "OTB vs cùng kỳ (60 ngày) — {mode}",
    "stlyRooms": "Phòng",
    "stlyRevenue": "Doanh thu (Tr)",
    "thisYear": "Năm nay",
    "lastYear": "Năm trước",

    // ── SupplyChart ──
    "supplyTitle": "Phòng còn trống ({capacity} phòng)",
    "soldOut": "Hết phòng",
    "actualEmpty": "Thực tế trống",
    "roomsOtb": "Phòng OTB",
    "available": "Còn trống",
    "netAvailable": "Còn trống (ròng)",
    "cxlExpected": "+{cxl} dự kiến hủy",

    // ── CancelForecastChart ──
    "cancelTitleEmpty": "Dự báo phòng hủy",
    "cancelTitle": "Dự báo phòng hủy (30 ngày tới)",
    "noCancelData": "Chưa có dữ liệu hủy. Chạy \"Tạo Features\" để tạo.",
    "roomsHeld": "Phòng giữ",
    "expectedCxl": "Dự kiến hủy",
    "totalExpectedCxl": "Tổng dự kiến hủy: {count} phòng",
    "avgRate": "Tỷ lệ TB: {rate}%",
    "confidenceHigh": "🟢 Cao",
    "confidenceMedium": "🟡 TB",
    "confidenceLow": "🔴 Thấp",
    "confidenceFallback": "⚪ Mặc định",

    // ── DodChips ──
    "comparedYesterday": "So với hôm qua:",
    "topChange": "Thay đổi lớn nhất:",

    // ── DataQualityBadge ──
    "qualityComplete": "{pct}% đầy đủ",
    "qualityPartial": "{pct}% — Dữ liệu một phần",
    "qualityLow": "Độ tin cậy thấp ({pct}%)",
    "rows": "{count} dòng",
    "approx": "~{count} ước lượng",
    "pickupDataT7": "Dữ liệu Pickup (T-7): {with}/{total} dòng",
    "stlyCoverage": "Phủ STLY: {pct}%",
    "stlyNearestDow": "~{count} STLY dùng nearest DOW",
    "missingSnapshots": "Thiếu snapshot nên pace/pickup chưa đầy đủ. Kết quả chỉ mang tính tham khảo.",

    // ── DatesToWatchPanel ──
    "datesToWatch": "Ngày cần lưu ý",

    // ── ForecastAccuracyChart ──
    "demandForecastTitle": "Dự báo nhu cầu (30 ngày)",
    "mapeLabel": "MAPE: {mape}% ({days} ngày tới)",
    "actual": "Thực tế",
    "demandForecast": "Dự báo nhu cầu",

    // ── BuildFeaturesInline ──
    "noPickupStly": "Chưa có dữ liệu Pickup/STLY cho {date}",
    "buildHint": "OTB cơ bản vẫn hiển thị. Tạo features để xem Pickup, Pace, STLY đầy đủ.",
    "buildThisDate": "Tạo ngày này",
    "buildAll": "Tạo tất cả",
    "rebuildForce": "🔄 Tạo lại tất cả (bắt buộc)",
    "stop": "Dừng",
    "building": "Đang tạo...",
    "daysProgress": "{done}/{total} ngày",
    "builtSkipped": "({built} đã tạo, {skipped} bỏ qua)",

    // ── PaceTable ──
    "bookingPace": "Tốc độ đặt phòng (Pickup)",
    "clickCollapse": "Bấm để thu gọn",
    "clickExpand": "Bấm để mở bảng chi tiết",
    "stayDates": "{count} ngày lưu trú",
    "avgOcc7d": "CS TB 7n",
    "avgOcc30d": "CS TB 30n",
    "paceVsLy": "Tốc độ vs năm trước",
    "avgAdr": "ADR TB",
    "pickupWindows": "Cửa sổ Pickup:",
    "hideT15T30": "− Ẩn T-15, T-30",
    "addT15T30": "+ Thêm T-15, T-30",
    "dateCol": "Ngày",
    "dowCol": "Thứ",
    "otbCol": "OTB",
    "occCol": "CS%",
    "supplyCol": "Phòng trống",
    "vsStlyCol": "vs STLY",
    "adrCol": "ADR",
    "revparCol": "RevPAR",
    "dodCol": "DOD",
    "noFeaturesData": "Chưa có dữ liệu features. Chạy Tạo Features trước.",
    "totalDays": "Tổng ({count} ngày tới)",

    // ── AnalyticsTabContent ──
    "loadingAnalytics": "Đang tải phân tích...",
    "noDataTitle": "Chưa có dữ liệu phân tích",
    "noDataSteps": "Bước 1: Tải reservations → Bước 2: Tạo OTB → Bước 3: Tạo Features",
    "paywallTitle": "Phân tích Pace & Pickup",
    "paywallSubtitle": "So sánh cùng kỳ, Tốc độ đặt phòng, Phòng còn trống",
    "featureStly": "So sánh cùng kỳ năm trước (STLY)",
    "featurePace": "Tốc độ đặt phòng — theo dõi vận tốc booking",
    "featurePickup": "Chi tiết Pickup T-3/T-7/T-15/T-30",
    "featureSupply": "Phòng còn trống — available rooms",
};

// ─────────────────────────────────────────────────────────────
// Patch function
// ─────────────────────────────────────────────────────────────
function patchFile(locale, keys) {
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!json.analyticsTab) json.analyticsTab = {};
    Object.assign(json.analyticsTab, keys);

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
    console.log(`✅ Patched ${locale}.json — analyticsTab: ${Object.keys(keys).length} keys`);
}

// Patch all locales
patchFile('en', analyticsTabEN);
patchFile('vi', analyticsTabVI);
// id, ms, th use English as base (can be translated later)
patchFile('id', analyticsTabEN);
patchFile('ms', analyticsTabEN);
patchFile('th', analyticsTabEN);

console.log('\n🎉 Done! analyticsTab namespace added to all 5 locales.');
