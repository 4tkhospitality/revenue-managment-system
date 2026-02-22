/**
 * Phase 02B - Batch 5-6: All remaining pages + small components
 * Pages: upload, settings/team, rate-shopper, welcome, payment/success, admin/users, etc.
 * Components: DataStatusBadge, ExportPdfButton, DatePickerSnapshot, AuditTeaser, 
 * SubscriptionBadge, QuotaUsagePanel, PaymentHistoryPanel, LanguageSwitcher, etc.
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');

// Collect all .tsx/.ts files recursively, excluding node_modules, .next, scripts, excel.ts, slug.ts
function getFiles(dir, exclude) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (['node_modules', '.next', 'scripts'].includes(e.name)) continue;
            results = results.concat(getFiles(full, exclude));
        } else if (/\.(tsx?|ts)$/.test(e.name) && !exclude.includes(e.name)) {
            results.push(full);
        }
    }
    return results;
}

// Files already handled in previous batches
const alreadyDone = [
    'page.tsx', // guide page already done in batch 1 - we'll skip by checking path
    'PromotionsTab.tsx', 'DynamicPricingTab.tsx', 'SetupTab.tsx', 'OverviewTab.tsx',
    'OccTierEditor.tsx', 'OTAConfigTab.tsx', 'RoomTypesTab.tsx', 'SeasonConfigPanel.tsx', 'SeasonRateEditor.tsx',
    'AnalyticsPanel.tsx', 'RecommendationTable.tsx', 'InsightsPanel.tsx', 'OtbChart.tsx',
    'DashboardToolbarCard.tsx', 'TopAccountsTable.tsx', 'AccountDetailModal.tsx', 'DashboardTabs.tsx',
    'RoomLosMixPanel.tsx', 'QuickModePanel.tsx',
    'BookingChecklist.tsx', 'AgodaChecklist.tsx', 'WhenToBoost.tsx', 'ScorecardInputModal.tsx',
    'PLGAdminDashboard.tsx', 'PricingTab.tsx',
    'PaymentMethodModal.tsx', 'PayPalCheckout.tsx',
    // Intentionally keep Vietnamese:
    'excel.ts', 'slug.ts',
];

const replacements = [
    // ═══ Settings Components ═══
    [`>Gói</th>`, `>Plan</th>`],
    [`>Hình thức</th>`, `>Method</th>`],
    [`>Số tiền</th>`, `>Amount</th>`],
    [`>Trạng thái</th>`, `>Status</th>`],
    [`'1 tháng'`, `'1 month'`],
    [` tháng\``, ` months\``],
    [`>Đang tải hạn mức...</span>`, `>Loading quotas...</span>`],
    [`>Hạn mức sử dụng</h3>`, `>Usage Quotas</h3>`],
    [`label="Imports (tháng)"`, `label="Imports (monthly)"`],
    [`label="Exports (ngày)"`, `label="Exports (daily)"`],
    [`label="Rate Shops (tháng)"`, `label="Rate Shops (monthly)"`],
    [`>Lưu trữ dữ liệu</span>`, `>Data Retention</span>`],
    [`'≤ 30 phòng'`, `'≤ 30 rooms'`],
    [`'31-80 phòng'`, `'31-80 rooms'`],
    [`'81-150 phòng'`, `'81-150 rooms'`],
    [`'151-300+ phòng'`, `'151-300+ rooms'`],
    [`>Đang tải gói dịch vụ...</span>`, `>Loading plan...</span>`],
    [`>Gói hiện tại</h3>`, `>Current Plan</h3>`],
    [`/tháng</span>`, `/month</span>`],
    [`→→ Trial: còn `, `→→ Trial: `],
    [` ngày`, ` days remaining`],
    [`Xem bảng giá `, `View Pricing `],
    [`phòng`, `rooms`],

    // ═══ Shared Components ═══
    // DataStatusBadge
    [`'Đủ dữ liệu'`, `'Data Complete'`],
    [`'Thiếu dữ liệu hủy'`, `'Missing Cancellation Data'`],
    [`'Thiếu STLY'`, `'Missing STLY'`],
    [`'Thiếu snapshots'`, `'Missing Snapshots'`],
    [`'Thiếu book_time'`, `'Missing book_time'`],
    [`'Thiếu room_code'`, `'Missing room_code'`],

    // ExportPdfButton
    [`title="Xuất báo cáo PDF"`, `title="Export PDF Report"`],
    [`>Xuất PDF</span>`, `>Export PDF</span>`],
    [`'Báo cáo Dashboard'`, `'Dashboard Report'`],
    [`'Báo cáo Pace & Pickup'`, `'Pace & Pickup Report'`],
    [`'Báo cáo Daily Actions'`, `'Daily Actions Report'`],
    [`'Báo cáo RMS'`, `'RMS Report'`],

    // DatePickerSnapshot
    [`'Hôm nay'`, `'Today'`],
    [`'Hôm qua'`, `'Yesterday'`],
    [` ngày trước\``, ` days ago\``],
    [`'1 tuần trước'`, `'1 week ago'`],
    [`'2 tuần trước'`, `'2 weeks ago'`],
    [`'1 tháng trước'`, `'1 month ago'`],
    [`'2 tháng trước'`, `'2 months ago'`],
    [` tháng trước\``, ` months ago\``],
    [`'Không thể tải danh sách snapshot'`, `'Cannot load snapshot list'`],
    [`>Đang tải snapshot...</span>`, `>Loading snapshot...</span>`],
    [` ngày dữ liệu)`, ` data days)`],

    // AuditTeaser
    [`'Dữ liệu hợp lệ'`, `'Data Valid'`],
    [`'Có lỗi cần sửa'`, `'Errors Need Fixing'`],
    [` dòng dữ liệu`, ` data rows`],
    [`Phát hiện `, `Found `],
    [` lỗi nghiêm trọng:`, ` critical errors:`],
    [`Không phát hiện lỗi nghiêm trọng trong dữ liệu.`, `No critical errors found in data.`],
    [`Báo cáo Audit đầy đủ`, `Full Audit Report`],
    [`→ Phân tích độ hoàn thiện dữ liệu`, `→ Data completeness analysis`],
    [`→ Phát hiện anomaly & pickup bất thường`, `→ Anomaly & unusual pickup detection`],
    [`→ Đề xuất cải thiện chất lượng dữ liệu`, `→ Data quality improvement suggestions`],
    [`→ Export báo cáo PDF`, `→ Export PDF report`],
    [`Nâng cấp Pro để mở khóa →`, `Upgrade to Pro to unlock →`],
    [`>Xem báo cáo Audit đầy đủ</span>`, `>View Full Audit Report</span>`],
    [`>Độ hoàn thiện</div>`, `>Completeness</div>`],
    [`>Cảnh báo</div>`, `>Warnings</div>`],
    [`>Lỗi</div>`, `>Errors</div>`],
    [`>Pickup bất thường</div>`, `>Unusual Pickup</div>`],
    [`>Đề xuất:</h4>`, `>Suggestions:</h4>`],

    // LanguageSwitcher
    [`'🇻🇳 Tiếng Việt'`, `'🇻🇳 Tiếng Việt'`], // Keep Vietnamese name for the language option

    // ═══ Pages ═══
    // Upload page
    [`Tải lên dữ liệu`, `Upload Data`],
    [`Kéo thả file hoặc bấm để chọn`, `Drag & drop file or click to select`],
    [`Đang xử lý file...`, `Processing file...`],
    [`Upload thành công`, `Upload Successful`],
    [`Upload thất bại`, `Upload Failed`],
    [`Chọn khách sạn`, `Select Hotel`],
    [`Chọn file để upload`, `Select File to Upload`],
    [`Hỗ trợ: XML, CSV`, `Supported: XML, CSV`],
    [`Tải template mẫu`, `Download Sample Template`],
    [`Xử lý xong`, `Processing Complete`],
    [` dòng đã import`, ` rows imported`],
    [` dòng bị skip`, ` rows skipped`],
    [`Lịch sử upload`, `Upload History`],

    // Settings/Team page  
    [`Quản lý thành viên`, `Team Management`],
    [`Thêm thành viên`, `Add Member`],
    [`Email thành viên`, `Member Email`],
    [`Vai trò`, `Role`],
    [`Quản trị viên`, `Admin`],
    [`Nhân viên`, `Staff`],
    [`Xóa thành viên`, `Remove Member`],
    [`Mời thành viên`, `Invite Member`],
    [`Xác nhận xóa thành viên này?`, `Confirm remove this member?`],
    [`Đã gửi lời mời`, `Invitation Sent`],
    [`Thành viên`, `Members`],
    [`Đang chờ`, `Pending`],
    [`Đã tham gia`, `Joined`],
    [`Chủ sở hữu`, `Owner`],

    // Rate-shopper page
    [`Đang tải dữ liệu...`, `Loading data...`],
    [`So sánh giá`, `Price Comparison`],
    [`Đối thủ`, `Competitors`],
    [`Giá thấp nhất`, `Lowest Price`],
    [`Giá cao nhất`, `Highest Price`],
    [`Giá trung bình`, `Average Price`],
    [`Cập nhật lần cuối`, `Last Updated`],

    // Welcome page
    [`Chào mừng đến với RMS`, `Welcome to RMS`],
    [`Hệ thống quản lý doanh thu`, `Revenue Management System`],
    [`Bắt đầu sử dụng`, `Get Started`],
    [`Liên hệ hỗ trợ`, `Contact Support`],

    // Payment/success page
    [`Thanh toán thành công!`, `Payment Successful!`],
    [`Gói dịch vụ đã được kích hoạt`, `Your service plan has been activated`],
    [`Về trang chủ`, `Go to Homepage`],
    [`Quay lại Dashboard`, `Back to Dashboard`],

    // Admin/users page
    [`Quản lý người dùng`, `User Management`],
    [`Tìm kiếm người dùng`, `Search Users`],
    [`Lần đăng nhập cuối`, `Last Login`],
    [`Ngày tạo`, `Created Date`],
    [`Xóa người dùng`, `Delete User`],

    // Admin/hotels page
    [`Quản lý khách sạn`, `Hotel Management`],
    [`Số phòng`, `Room Count`],
    [`Trạng thái`, `Status`],
    [`Hoạt động`, `Active`],
    [`Tạm ngưng`, `Suspended`],

    // Auth/login page
    [`Đăng nhập`, `Sign In`],
    [`Đăng nhập với Google`, `Sign in with Google`],
    [`Đang đăng nhập...`, `Signing in...`],
    [`Hệ thống quản lý doanh thu khách sạn`, `Hotel Revenue Management System`],

    // Invite page
    [`Bạn được mời tham gia`, `You've been invited to join`],
    [`Chấp nhận lời mời`, `Accept Invitation`],
    [`Từ chối`, `Decline`],
    [`Lời mời không hợp lệ`, `Invalid Invitation`],
    [`Lời mời đã hết hạn`, `Invitation Expired`],

    // Pricing page
    [`Bảng giá dịch vụ`, `Service Pricing`],
    [`Dùng thử miễn phí`, `Free Trial`],

    // No-hotel-access page
    [`Chưa có quyền truy cập`, `No Access`],
    [`Bạn chưa được gán khách sạn nào`, `You haven't been assigned to any hotel`],
    [`Liên hệ quản trị viên`, `Contact Admin`],

    // Settings page
    [`Cài đặt`, `Settings`],
    [`Cài đặt chung`, `General Settings`],
    [`Lưu thay đổi`, `Save Changes`],
    [`Đã lưu`, `Saved`],

    // Select-hotel page
    [`Chọn khách sạn`, `Select Hotel`],
    [`khách sạn`, `hotels`],

    // Blocked page
    [`Tài khoản bị khóa`, `Account Blocked`],
    [`Liên hệ quản trị viên để được hỗ trợ`, `Contact admin for support`],

    // Unauthorized page
    [`Không có quyền truy cập`, `Unauthorized Access`],
    [`Bạn không có quyền truy cập trang này`, `You don't have permission to access this page`],

    // Dashboard page
    [`Chưa có dữ liệu`, `No Data`],
    [`Lần cuối cập nhật:`, `Last updated:`],

    // Data page
    [`Trang dữ liệu`, `Data Page`],
    [`Build OTB`, `Build OTB`],
    [`Build Features`, `Build Features`],
    [`Run Forecast`, `Run Forecast`],
    [`Đang build...`, `Building...`],
    [`Build thành công`, `Build Successful`],
    [`Chạy Full Pipeline`, `Run Full Pipeline`],

    // ═══ Compliance / Billing / Paywall ═══
    [`Nâng cấp`, `Upgrade`],
    [`Mở khóa`, `Unlock`],
    [`Tính năng này yêu cầu gói`, `This feature requires plan`],
    [`Nâng cấp để sử dụng`, `Upgrade to use`],
    [`Quay lại`, `Go Back`],
    [`Đóng`, `Close`],
    [`Hủy`, `Cancel`],
    [`Lưu`, `Save`],
    [`Xác nhận`, `Confirm`],
    [`Thêm`, `Add`],
    [`Sửa`, `Edit`],
    [`Xóa`, `Delete`],
    [`Tạo`, `Create`],
    [`Cập nhật`, `Update`],
    [`Chi tiết`, `Details`],
];

// ── Run ──
const vnRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/;
const allFiles = getFiles(BASE, ['excel.ts', 'slug.ts']);
let totalCount = 0;
let filesModified = 0;

for (const filePath of allFiles) {
    const basename = path.basename(filePath);
    const relPath = path.relative(BASE, filePath);
    // Skip already-done files
    if (alreadyDone.includes(basename) && !relPath.startsWith('app\\')) continue;
    // For page.tsx, skip the guide one (already done)
    if (basename === 'page.tsx' && relPath.includes('guide')) continue;

    let src = fs.readFileSync(filePath, 'utf8');
    // Only process files that have Vietnamese
    if (!vnRegex.test(src)) continue;

    let count = 0;
    for (const [from, to] of replacements) {
        if (src.includes(from)) {
            const parts = src.split(from);
            count += parts.length - 1;
            src = parts.join(to);
        }
    }
    if (count > 0) {
        fs.writeFileSync(filePath, src, 'utf8');
        console.log(`✅ ${relPath}: ${count}`);
        totalCount += count;
        filesModified++;
    }
}
console.log(`\n🎯 Batch 5-6 Total: ${totalCount} replacements in ${filesModified} files`);
