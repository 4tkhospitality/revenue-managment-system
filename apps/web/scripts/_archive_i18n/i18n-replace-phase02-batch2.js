/**
 * Phase 02 — Batch 2: Competitors, Analytics, Gates, Compliance, Shared, PaywallModal, UpgradeBanner, HotelSwitcher, DatePickerSnapshot
 */
const fs = require('fs');
const path = require('path');

const webDir = path.join(__dirname, '..');
let totalReplacements = 0;
let filesProcessed = 0;

function replaceAll(relPath, replacements) {
    const filePath = path.join(webDir, relPath);
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ SKIP (not found): ${relPath}`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    let count = 0;

    for (const [target, replacement] of replacements) {
        if (content.includes(target)) {
            content = content.replace(target, replacement);
            count++;
        }
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${relPath} — ${count} changes`);
        totalReplacements += count;
        filesProcessed++;
    } else {
        console.log(`⏭️ ${relPath} — no changes needed`);
    }
}

// ═══════════════════════════════════════════════════════════════
// COMPETITORS PAGE
// ═══════════════════════════════════════════════════════════════
replaceAll('app/rate-shopper/competitors/page.tsx', [
    // Notifications (inside function scope, t already added from batch 1)
    ["showNotification('error', 'Không thể tải danh sách đối thủ');",
        "showNotification('error', t('cannotLoadCompetitors'));"],
    ["showNotification('error', 'Không tìm thấy khách sạn nào');",
        "showNotification('error', t('noHotelsFound'));"],
    ["showNotification('error', 'Lỗi tìm kiếm. Kiểm tra SERPAPI_API_KEY trong .env');",
        "showNotification('error', t('searchError'));"],
    ["showNotification('success', `Đã thêm \"${suggestion.name}\"`);",
        "showNotification('success', t('addedCompetitor', { name: suggestion.name }));"],
    ["showNotification('error', err instanceof Error ? err.message : 'Không thể thêm đối thủ');",
        "showNotification('error', err instanceof Error ? err.message : t('cannotAddCompetitor'));"],
    ["if (!confirm(`Xóa \"${competitor.name}\" khỏi danh sách đối thủ?`)) return;",
        "if (!confirm(t('confirmRemoveCompetitor', { name: competitor.name }))) return;"],
    ["showNotification('success', `Đã xóa \"${competitor.name}\"`);",
        "showNotification('success', t('removedCompetitor', { name: competitor.name }));"],
    ["showNotification('error', 'Không thể xóa đối thủ');",
        "showNotification('error', t('cannotRemoveCompetitor'));"],
    // Header
    [">Quản lý đối thủ</h1>", ">{t('manageCompetitorsTitle')}</h1>"],
    [">Thêm các khách sạn đối thủ để so sánh giá tự động hàng ngày</p>",
        ">{t('manageCompetitorsSubtitle')}</p>"],
    // Search section
    ["Tìm kiếm khách sạn đối thủ", "{t('searchCompetitors')}"],
    ["placeholder=\"Nhập tên khách sạn (VD: Vinpearl Phú Quốc, Pullman Saigon...)\"",
        "placeholder={t('searchPlaceholder')}"],
    ["                        Tìm\n", "                        {t('searchBtn')}\n"],
    // Search results
    ["Tìm thấy {suggestions.length} kết quả. Click &quot;Thêm&quot; để thêm vào danh sách đối thủ.",
        "{t('foundResults', { count: suggestions.length })}"],
    ["<>✓ Đã thêm</>", "<>✓ {t('alreadyAdded')}</>"],
    ["<><Plus size={14} /> Thêm</>", "<><Plus size={14} /> {t('addBtn')}</>"],
    // Competitor list
    ["Đối thủ đang theo dõi", "{t('trackedCompetitors')}"],
    ["Làm mới", "{t('refresh')}"],
    // Empty + usage
    ["Chưa có đối thủ nào", "{t('noCompetitorsYet')}"],
    ["Sử dụng ô tìm kiếm ở trên để tìm và thêm khách sạn đối thủ.",
        "{t('useSearchToAdd')}"],
    ["<span>Thêm {new Date(c.created_at).toLocaleDateString('vi-VN')}</span>",
        "<span>{new Date(c.created_at).toLocaleDateString()}</span>"],
    // Usage
    [">Cách hoạt động:</strong>", ">{t('howItWorks')}</strong>"],
    ["<li>Tìm khách sạn đối thủ qua Google Hotels → Thêm vào danh sách</li>",
        "<li>{t('howStep1')}</li>"],
    ["<li>Hệ thống tự động thu thập giá 5 mốc: 7, 14, 30, 60, 90 ngày</li>",
        "<li>{t('howStep2')}</li>"],
    ["<li>Xem so sánh chi tiết tại trang <a href=\"/rate-shopper\" style={{ color: '#6366f1', fontWeight: 500, textDecoration: 'none' }}>So sánh giá</a></li>",
        "<li>{t('howStep3')} <a href=\"/rate-shopper\" style={{ color: '#6366f1', fontWeight: 500, textDecoration: 'none' }}>{t('compareRatesLink')}</a></li>"],
    ["<li>Giới hạn: tối đa 20 lần quét/ngày, 200 lần/tháng</li>",
        "<li>{t('howStep4')}</li>"],
]);

// ═══════════════════════════════════════════════════════════════
// ANALYTICS COMPONENTS
// ═══════════════════════════════════════════════════════════════

// AnalyticsTabContent
replaceAll('components/analytics/AnalyticsTabContent.tsx', [
    [">Đang tải Analytics...</div>", ">Loading Analytics...</div>"],
    [">Chưa có dữ liệu Analytics</div>", ">No Analytics data available</div>"],
    ["Bước 1: Upload reservations → Bước 2: Build OTB → Bước 3: Build Features",
        "Step 1: Upload reservations → Step 2: Build OTB → Step 3: Build Features"],
    ["subtitle=\"Phân tích STLY, Booking Pace, Remaining Supply\"",
        "subtitle=\"STLY Analysis, Booking Pace, Remaining Supply\""],
    ["{ icon: <TrendingUp className=\"w-4 h-4\" />, label: 'So sánh cùng kỳ năm trước (STLY)' },",
        "{ icon: <TrendingUp className=\"w-4 h-4\" />, label: 'Same Time Last Year (STLY) comparison' },"],
    ["{ icon: <BarChart3 className=\"w-4 h-4\" />, label: 'Booking Pace — theo dõi tốc độ đặt phòng' },",
        "{ icon: <BarChart3 className=\"w-4 h-4\" />, label: 'Booking Pace — track booking velocity' },"],
    ["{ icon: <CalendarDays className=\"w-4 h-4\" />, label: 'Pickup T-3/T-7/T-15/T-30 chi tiết' },",
        "{ icon: <CalendarDays className=\"w-4 h-4\" />, label: 'Detailed Pickup T-3/T-7/T-15/T-30' },"],
    ["{ icon: <Database className=\"w-4 h-4\" />, label: 'Remaining Supply — phòng còn trống' },",
        "{ icon: <Database className=\"w-4 h-4\" />, label: 'Remaining Supply — available rooms' },"],
]);

// FullPipelineButton
replaceAll('components/analytics/FullPipelineButton.tsx', [
    ["{ key: 'otbYesterday', label: 'OTB (hôm qua)', action: 'buildOTB', dateOffset: -1 },",
        "{ key: 'otbYesterday', label: 'OTB (yesterday)', action: 'buildOTB', dateOffset: -1 },"],
    ["{ key: 'otbToday', label: 'OTB (hôm nay)', action: 'buildOTB', dateOffset: 0 },",
        "{ key: 'otbToday', label: 'OTB (today)', action: 'buildOTB', dateOffset: 0 },"],
    ["{ key: 'cancelStats', label: 'Tính Cancel Stats', action: 'buildCancelStats' },",
        "{ key: 'cancelStats', label: 'Cancel Stats', action: 'buildCancelStats' },"],
    ["{ key: 'pricing', label: 'Tối ưu giá', action: 'runPricing' },",
        "{ key: 'pricing', label: 'Optimize Pricing', action: 'runPricing' },"],
    ["Đang chạy...", "Running..."],
    ["Chạy Full Pipeline", "Run Full Pipeline"],
]);

// CancelForecastChart
replaceAll('components/analytics/CancelForecastChart.tsx', [
    [">Dự báo Hủy phòng</h3>", ">Cancellation Forecast</h3>"],
    ["Chưa có dữ liệu cancel stats. Chạy &quot;Build Features&quot; để tạo.",
        "No cancel stats data. Run \"Build Features\" to generate."],
    [">Dự báo Hủy phòng (30 ngày)</h3>", ">Cancellation Forecast (30 days)</h3>"],
    ["<span className=\"w-2.5 h-2.5 rounded-sm bg-blue-500\" /> Phòng giữ",
        "<span className=\"w-2.5 h-2.5 rounded-sm bg-blue-500\" /> Rooms Held"],
    ["<span className=\"w-2.5 h-2.5 rounded-sm bg-amber-400\" /> Dự báo hủy",
        "<span className=\"w-2.5 h-2.5 rounded-sm bg-amber-400\" /> Expected Cancellations"],
    ["Tổng dự báo hủy: {totalCxl} phòng",
        "Total expected cancellations: {totalCxl} rooms"],
    ["if (name === 'Phòng giữ') return [value, name];",
        "if (name === 'Rooms Held') return [value, name];"],
    ["if (name === 'Dự báo hủy') {",
        "if (name === 'Expected Cancellations') {"],
    ["<Bar dataKey=\"stay_rooms\" stackId=\"otb\" name=\"Phòng giữ\" fill=\"#3b82f6\" />",
        "<Bar dataKey=\"stay_rooms\" stackId=\"otb\" name=\"Rooms Held\" fill=\"#3b82f6\" />"],
    ["<Bar dataKey=\"expected_cxl\" stackId=\"otb\" name=\"Dự báo hủy\">",
        "<Bar dataKey=\"expected_cxl\" stackId=\"otb\" name=\"Expected Cancellations\">"],
]);

// ForecastAccuracyChart
replaceAll('components/analytics/ForecastAccuracyChart.tsx', [
    ["Dự báo Demand (30 ngày)", "Demand Forecast (30 days)"],
    ["name=\"Dự báo demand\"", "name=\"Demand Forecast\""],
]);

// BuildFeaturesInline
replaceAll('components/analytics/BuildFeaturesInline.tsx', [
    ["Chưa có Pickup/STLY cho {asOfDate}", "No Pickup/STLY data for {asOfDate}"],
    ["Đang build...", "Building..."],
]);

// PaceTable
replaceAll('components/analytics/PaceTable.tsx', [
    [">Ngày</th>", ">Date</th>"],
    ["Chưa có features data. Chạy Build Features trước.",
        "No features data. Run Build Features first."],
]);

// DodChips
replaceAll('components/analytics/DodChips.tsx', [
    ["title=\"Chưa có snapshot hôm qua\"", "title=\"No yesterday snapshot\""],
]);

// SupplyChart
replaceAll('components/analytics/SupplyChart.tsx', [
    ["// Yellow 70-89% \"Cần theo dõi\"", "// Yellow 70-89% \"Watch\""],
    ["// Green  <70%  \"Còn nhiều\"", "// Green  <70%  \"Available\""],
    ["if (occPct >= 70) return '#f59e0b';    // amber-500 — Cần theo dõi",
        "if (occPct >= 70) return '#f59e0b';    // amber-500 — Watch"],
    ["return '#10b981';                       // emerald-500 — Còn nhiều",
        "return '#10b981';                       // emerald-500 — Available"],
    ["> Trống thực tế\n", "> Net Available\n"],
    ["name=\"Còn trống\">", "name=\"Available\">"],
    ["name=\"Trống thực tế\"", "name=\"Net Available\""],
    ["if (name === 'Trống thực tế'", "if (name === 'Net Available'"],
    ["return [`${value} (+${props.payload.expected_cxl} CXL dự báo)`, name];",
        "return [`${value} (+${props.payload.expected_cxl} CXL expected)`, name];"],
]);

// DataQualityBadge
replaceAll('components/analytics/DataQualityBadge.tsx', [
    ["'Tốt' : 'Thiếu dữ liệu'", "'Good' : 'Missing data'"],
]);

// ═══════════════════════════════════════════════════════════════
// GATES
// ═══════════════════════════════════════════════════════════════
replaceAll('components/gates/FeatureGate.tsx', [
    [">Tính năng bị khóa</p>", ">Feature locked</p>"],
]);

replaceAll('components/gates/QuotaWarning.tsx', [
    ["Bạn đã sử dụng", "You've used"],
    ["hành động trong kỳ này", "actions this period"],
    ["Nâng cấp để mở giới hạn", "Upgrade to unlock limits"],
]);

// ═══════════════════════════════════════════════════════════════
// COMPLIANCE
// ═══════════════════════════════════════════════════════════════
replaceAll('components/compliance/ComplianceBanner.tsx', [
    ["nhưng gói hiện tại là {compliance.subscriptionBand}. Một số quota có thể bị giới hạn.",
        "but current plan is {compliance.subscriptionBand}. Some quotas may be limited."],
]);

// ═══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════
replaceAll('components/shared/ExportPdfButton.tsx', [
    ["'Lỗi xuất PDF. Thử lại sau.'", "'PDF export error. Try again later.'"],
    [">Đang xuất...</span>", ">Exporting...</span>"],
]);

replaceAll('components/shared/DataStatusBadge.tsx', [
    ["'Mới nhất'", "'Fresh'"],
    ["'Cũ'", "'Stale'"],
]);

// ═══════════════════════════════════════════════════════════════
// PAYWALL MODAL
// ═══════════════════════════════════════════════════════════════
replaceAll('components/PaywallModal.tsx', [
    // FEATURE_INFO
    ["title: 'Nâng cấp để xuất thêm dữ liệu',", "title: 'Upgrade to export more data',"],
    ["description: 'Gói miễn phí chỉ cho phép 3 lượt xuất dữ liệu mỗi tuần.',",
        "description: 'Free plan allows only 3 exports per week.',"],
    ["cta: 'Nâng cấp để xuất không giới hạn',", "cta: 'Upgrade for unlimited exports',"],
    ["title: 'Mời thêm thành viên',", "title: 'Invite more team members',"],
    ["description: 'Gói miễn phí chỉ cho phép 1 thành viên.',",
        "description: 'Free plan allows only 1 member.',"],
    ["cta: 'Nâng cấp để mở rộng team',", "cta: 'Upgrade to expand your team',"],
    ["title: 'Báo cáo kiểm tra dữ liệu chi tiết',", "title: 'Detailed data audit reports',"],
    ["description: 'Phân tích sâu về chất lượng dữ liệu chỉ có ở gói Pro.',",
        "description: 'Deep data quality analysis available on Pro plan.',"],
    ["cta: 'Nâng cấp để xem báo cáo đầy đủ',", "cta: 'Upgrade for full reports',"],
    ["title: 'Tính năng cao cấp',", "title: 'Premium feature',"],
    ["description: 'Tính năng này yêu cầu nâng cấp gói.',",
        "description: 'This feature requires a plan upgrade.',"],
    ["cta: 'Xem các gói nâng cấp',", "cta: 'View upgrade plans',"],
    // TIER_BADGES
    ["FREE: { label: 'Miễn phí', color: 'bg-slate-500' },",
        "FREE: { label: 'Free', color: 'bg-slate-500' },"],
    // Body
    ["Gói hiện tại:", "Current plan:"],
    [">Gói Pro bao gồm:</p>", ">Pro plan includes:</p>"],
    ["<span className=\"text-green-400\">✓</span> Xuất dữ liệu không giới hạn",
        "<span className=\"text-green-400\">✓</span> Unlimited data exports"],
    ["<span className=\"text-green-400\">✓</span> Mời tối đa 10 thành viên",
        "<span className=\"text-green-400\">✓</span> Up to 10 team members"],
    ["<span className=\"text-green-400\">✓</span> Báo cáo kiểm tra dữ liệu chi tiết",
        "<span className=\"text-green-400\">✓</span> Detailed data audit reports"],
    ["<span className=\"text-green-400\">✓</span> Rate Shopper theo dõi giá đối thủ",
        "<span className=\"text-green-400\">✓</span> Rate Shopper competitor tracking"],
    // CTA
    ["{loading ? 'Đang chuyển...' : info.cta}", "{loading ? 'Redirecting...' : info.cta}"],
    ["Để sau", "Maybe later"],
]);

// ═══════════════════════════════════════════════════════════════
// UPGRADE BANNER
// ═══════════════════════════════════════════════════════════════
replaceAll('components/UpgradeBanner.tsx', [
    // FEATURE_DESCRIPTIONS
    ["pricing_calc: 'Tính giá NET → BAR',", "pricing_calc: 'NET → BAR price calculation',"],
    ["promo_stacking: 'Ghép nhiều khuyến mãi',", "promo_stacking: 'Stack multiple promotions',"],
    ["daily_actions: 'Gợi ý giá hàng ngày + 1 click Accept',", "daily_actions: 'Daily price suggestions + 1-click Accept',"],
    ["rate_calendar: 'Lịch giá 30 ngày',", "rate_calendar: '30-day rate calendar',"],
    ["export_excel: 'Xuất Excel để upload OTA',", "export_excel: 'Excel export for OTA upload',"],
    ["pickup_pace_simple: 'Xem tốc độ bán phòng',", "pickup_pace_simple: 'View booking pace',"],
    ["guardrails: 'Cảnh báo giá quá cao/thấp',", "guardrails: 'High/low price alerts',"],
    ["decision_log: 'Lịch sử quyết định giá',", "decision_log: 'Price decision history',"],
    ["basic_analytics: 'Báo cáo doanh thu cơ bản',", "basic_analytics: 'Basic revenue reports',"],
    ["advanced_analytics: 'Phân tích nâng cao',", "advanced_analytics: 'Advanced analytics',"],
    ["multi_property: 'Quản lý nhiều khách sạn',", "multi_property: 'Multi-property management',"],
    ["api_import: 'Nhập dữ liệu tự động qua API',", "api_import: 'Automated API data import',"],
    ["rate_shopper_addon: 'Theo dõi giá đối thủ',", "rate_shopper_addon: 'Competitor rate tracking',"],
    // Content
    ["<Lock className=\"w-4 h-4 inline mr-1\" /> Tính năng dành cho {requiredTier}",
        "<Lock className=\"w-4 h-4 inline mr-1\" /> Feature available on {requiredTier}"],
    ["<strong>{featureDesc}</strong> — Nâng cấp để mở khóa tính năng này và tiết kiệm thời gian mỗi ngày.",
        "<strong>{featureDesc}</strong> — Upgrade to unlock this feature and save time every day."],
    ["Với gói {requiredTier}, bạn sẽ có:", "With {requiredTier} plan, you get:"],
    // Assistant benefits
    ["<li>✓ Gợi ý giá hàng ngày (Daily Actions)</li>", "<li>✓ Daily price suggestions (Daily Actions)</li>"],
    ["<li>✓ Xuất Excel để upload OTA</li>", "<li>✓ Excel export for OTA upload</li>"],
    ["<li>✓ Lịch giá 30 ngày</li>", "<li>✓ 30-day rate calendar</li>"],
    // RMS Lite benefits
    ["<li>✓ Tất cả tính năng Assistant</li>", "<li>✓ All Assistant features</li>"],
    ["<li>✓ Cảnh báo giá (Guardrails)</li>", "<li>✓ Price alerts (Guardrails)</li>"],
    ["<li>✓ Báo cáo phân tích</li>", "<li>✓ Analytics reports</li>"],
    // Professional benefits
    ["<li>✓ Tất cả tính năng RMS Lite</li>", "<li>✓ All RMS Lite features</li>"],
    ["<li>✓ Quản lý nhiều khách sạn</li>", "<li>✓ Multi-property management</li>"],
    ["<li>✓ Theo dõi giá đối thủ</li>", "<li>✓ Competitor rate tracking</li>"],
    // CTA
    ["Xem bảng giá", "View pricing"],
    ["Liên hệ Zalo", "Contact via Zalo"],
    // UpgradeTooltip
    ["<Lock className=\"w-3 h-3 inline mr-0.5\" /> Cần gói {requiredTier}",
        "<Lock className=\"w-3 h-3 inline mr-0.5\" /> Requires {requiredTier} plan"],
]);

// ═══════════════════════════════════════════════════════════════
// HOTEL SWITCHER
// ═══════════════════════════════════════════════════════════════
replaceAll('components/HotelSwitcher.tsx', [
    ["const activeHotelName = activeHotel?.name || 'Chọn Hotel';",
        "const activeHotelName = activeHotel?.name || 'Select Hotel';"],
    ["{isAdmin ? `Tất cả khách sạn (${hotelList.length})` : 'Khách sạn của bạn'}",
        "{isAdmin ? `All hotels (${hotelList.length})` : 'Your hotels'}"],
]);

// ═══════════════════════════════════════════════════════════════
// DATEPICKER SNAPSHOT
// ═══════════════════════════════════════════════════════════════
replaceAll('components/DatePickerSnapshot.tsx', [
    ["{formatDate(s.as_of_date)} - {getRelativeLabel(s.as_of_date)} ({s.row_count} ngày dữ liệu)",
        "{formatDate(s.as_of_date)} - {getRelativeLabel(s.as_of_date)} ({s.row_count} days of data)"],
    ["title=\"Snapshot mới nhất\"", "title=\"Latest snapshot\""],
    ["Mới nhất", "Latest"],
    // Older snapshot button tooltip
    ["title={hasTarget ? `Gần ngày ${formatDate(target)}` : `Chưa có snapshot ${days} ngày trước`}",
        "title={hasTarget ? `Near ${formatDate(target)}` : `No snapshot ${days} days ago`}"],
    ["Chỉ có 1 snapshot. Upload thêm dữ liệu để có lịch sử so sánh.",
        "Only 1 snapshot. Upload more data for comparison history."],
    ["Chưa có snapshot cho ngày này.", "No snapshot for this date."],
    ["{building ? 'Đang tạo...' : 'Tạo snapshot'}", "{building ? 'Building...' : 'Build snapshot'}"],
]);

// ═══════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(50)}`);
console.log(`🎉 Phase 02 Batch 2 complete!`);
console.log(`   Files processed: ${filesProcessed}`);
console.log(`   Total replacements: ${totalReplacements}`);
console.log('═'.repeat(50));
