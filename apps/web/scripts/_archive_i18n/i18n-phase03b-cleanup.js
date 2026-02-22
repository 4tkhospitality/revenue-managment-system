#!/usr/bin/env node
/**
 * Phase 03B — Fix remaining Vietnamese strings missed by Phase 03A.
 * Handles: em-dash chars, typos, partial replacements, countries, etc.
 */
const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
let totalCount = 0;
let fileCount = 0;

function processFile(relPath, replacements) {
    const fp = path.join(BASE, relPath);
    if (!fs.existsSync(fp)) { console.warn(`  ⚠️ SKIP: ${relPath} not found`); return; }
    let src = fs.readFileSync(fp, 'utf8');
    let count = 0;
    for (const [find, replace] of replacements) {
        if (src.includes(find)) {
            src = src.split(find).join(replace);
            count++;
        } else {
            console.warn(`  ⚠️ NOT FOUND in ${relPath}: ${find.substring(0, 80)}...`);
        }
    }
    if (count > 0) {
        fs.writeFileSync(fp, src, 'utf8');
        console.log(`✅ ${relPath} — ${count} replacements`);
        totalCount += count;
        fileCount++;
    }
}

// ══════════════════════════════════════════════════════════════
// runPricingEngine.ts — em-dashes and Vietnamese reason texts
// ══════════════════════════════════════════════════════════════

processFile('app/actions/runPricingEngine.ts', [
    // Line 174: em-dash variant
    ["reasonTextVi = 'Thiếu giá hiện tại — không đề xuất thay đổi';", "reasonTextVi = 'Missing current rate — no adjustment suggested';"],
    // Line 181
    ["reasonTextVi = 'Hết phòng — ngừng bán';", "reasonTextVi = 'Sold out — stop selling';"],
    // Line 340: typo "phóng" instead of "phòng"
    ["return `OTB ${otbStr}, dự phóng ${projStr} cao → tăng giá ${deltaStr}`;", "return `OTB ${otbStr}, projected ${projStr} high → raise rate ${deltaStr}`;"],
    // Line 344
    ["return `Pickup thấp, OTB ${otbStr}, dự phóng ${projStr} → giảm giá ${deltaStr}`;", "return `Low pickup, OTB ${otbStr}, projected ${projStr} → lower rate ${deltaStr}`;"],
    // Line 350-352: switch cases
    ["return 'Hết phòng — ngừng bán';", "return 'Sold out — stop selling';"],
    ["return 'Thiếu giá hiện tại — không đề xuất thay đổi';", "return 'Missing current rate — no adjustment suggested';"],
    // Function name and comment
    ["* Generate Vietnamese reason text for GM display.", "* Generate reason text for GM display."],
    ["function generateViReason(", "function generateReason("],
    // All references to generateViReason
    ["reasonTextVi = generateViReason(", "reasonTextVi = generateReason("],
]);

// ══════════════════════════════════════════════════════════════
// validateOTBData.ts — missed due to different quote style
// ══════════════════════════════════════════════════════════════

processFile('app/actions/validateOTBData.ts', [
    // These are still there from what we see
]);

// ══════════════════════════════════════════════════════════════
// api/invite/create — find actual text
// ══════════════════════════════════════════════════════════════

processFile('app/api/invite/create/route.ts', [
    // May have been partially different - try alternate form
    ["'Không thể tạo mã mời'", "'Unable to create invite code'"],
]);

// ══════════════════════════════════════════════════════════════
// api/payments/paypal/activate — longer line with backtick
// ══════════════════════════════════════════════════════════════

processFile('app/api/payments/paypal/activate/route.ts', [
    // Try with curly quote or different text
    ["Bạn đang có subscription qua ${currentSub.external_provider}. Vui lòng hủy trước hoặc quản lý tại /settings/billing", "You have an active subscription via ${currentSub.external_provider}. Please cancel first or manage at /settings/billing"],
]);

// ══════════════════════════════════════════════════════════════
// api/payments/sepay — longer line
// ══════════════════════════════════════════════════════════════

processFile('app/api/payments/sepay/create-checkout/route.ts', [
    ["Bạn đang có subscription qua ${currentSub.external_provider}. Vui lòng hủy trước hoặc quản lý tại /settings/billing", "You have an active subscription via ${currentSub.external_provider}. Please cancel first or manage at /settings/billing"],
]);

// ══════════════════════════════════════════════════════════════
// api/settings — alternate text
// ══════════════════════════════════════════════════════════════

processFile('app/api/settings/route.ts', [
    ["Cần quyền Manager hoặc Admin để thay đổi cài đặt", "Manager or Admin role required to change settings"],
]);

// ══════════════════════════════════════════════════════════════
// api/team/members — remaining "Admin cuối cùng" strings
// ══════════════════════════════════════════════════════════════

processFile('app/api/team/members/route.ts', [
    ["Không thể bỏ Admin cuối cùng - cần ít nhất 1 Admin", "Cannot remove the last Admin - at least 1 Admin is required"],
    ["Không thể xóa Admin cuối cùng - cần ít nhất 1 Admin", "Cannot remove the last Admin - at least 1 Admin is required"],
]);

// ══════════════════════════════════════════════════════════════
// lib/seats.ts — partial replacement left Vietnamese at end
// ══════════════════════════════════════════════════════════════

processFile('lib/seats.ts', [
    ["add hàm.", "add more."],
    // Try alternate if the above doesn't match
    ["add hàm", "add more"],
]);

// ══════════════════════════════════════════════════════════════
// lib/pdf/exportToPdf.ts
// ══════════════════════════════════════════════════════════════

processFile('lib/pdf/exportToPdf.ts', [
    ["`Không tìm thấy phần tử #${elementId}`", "`Element #${elementId} not found`"],
]);

// ══════════════════════════════════════════════════════════════
// lib/telegram.ts — missed emoji strings
// ══════════════════════════════════════════════════════════════

processFile('lib/telegram.ts', [
    // Try with HTML entities
    ["User mới đăng ký!", "New user signed up!"],
    ["Tên: ${name", "Name: ${name"],
    ["Thời gian: ${now}", "Time: ${now}"],
    ["Mã đơn: <code>", "Order: <code>"],
    ["Chưa có hotel", "No hotel yet"],
]);

// ══════════════════════════════════════════════════════════════
// lib/pricing/validators.ts — special chars (≠, ≤, etc.)
// ══════════════════════════════════════════════════════════════

processFile('lib/pricing/validators.ts', [
    // Try different quote/dash patterns
    ["Early Booker Deal ≠ Last Minute Deal - không thể kết hợp", "Early Booker Deal ≠ Last Minute Deal - cannot combine"],
    ["Mobile Rate ≠ Country Rate - không thể kết hợp", "Mobile Rate ≠ Country Rate - cannot combine"],
    ["Business Bookers là exclusive rate - không stack với", "Business Bookers is exclusive rate - does not stack with"],
    ["Campaign/Deal of Day không stack với Targeted Rates", "Campaign/Deal of Day does not stack with Targeted Rates"],
    ["Campaign/Deal of Day không stack với promotions khác", "Campaign/Deal of Day does not stack with other promotions"],
    ["Promotions không stack - chỉ", "Promotions do not stack - only"],
    ["được áp dụng (highest wins).", "is applied (highest wins)."],
]);

// ══════════════════════════════════════════════════════════════
// lib/pricing/service.ts — remaining lines
// ══════════════════════════════════════════════════════════════

processFile('lib/pricing/service.ts', [
    ["Hoa hồng OTA", "OTA Commission"],
    ["Thu về =", "Net revenue ="],
]);

// ══════════════════════════════════════════════════════════════
// lib/pricing/seed-defaults.ts — remaining comments
// ══════════════════════════════════════════════════════════════

processFile('lib/pricing/seed-defaults.ts', [
    ["// Cộng dồn", "// Additive"],
]);

// ══════════════════════════════════════════════════════════════
// lib/constants/countries.ts — Vietnamese country names → English
// ══════════════════════════════════════════════════════════════

processFile('lib/constants/countries.ts', [
    ["name: 'Việt Nam'", "name: 'Vietnam'"],
    ["name: 'Thái Lan'", "name: 'Thailand'"],
    ["name: 'Lào'", "name: 'Laos'"],
    ["name: 'Nhật Bản'", "name: 'Japan'"],
    ["name: 'Hàn Quốc'", "name: 'South Korea'"],
    ["name: 'Trung Quốc'", "name: 'China'"],
    ["name: 'Đài Loan'", "name: 'Taiwan'"],
    ["name: 'Hồng Kông'", "name: 'Hong Kong'"],
    ["name: 'Ấn Độ'", "name: 'India'"],
    ["name: 'Ả Rập Xê Út'", "name: 'Saudi Arabia'"],
    ["name: 'Thổ Nhĩ Kỳ'", "name: 'Turkey'"],
    ["name: 'Úc'", "name: 'Australia'"],
    ["name: 'Hoa Kỳ'", "name: 'United States'"],
    ["name: 'Pháp'", "name: 'France'"],
    ["name: 'Đức'", "name: 'Germany'"],
    ["name: 'Ý'", "name: 'Italy'"],
    ["name: 'Tây Ban Nha'", "name: 'Spain'"],
    ["name: 'Bồ Đào Nha'", "name: 'Portugal'"],
    ["name: 'Hà Lan'", "name: 'Netherlands'"],
    ["name: 'Bỉ'", "name: 'Belgium'"],
    ["name: 'Thụy Sĩ'", "name: 'Switzerland'"],
    ["name: 'Áo'", "name: 'Austria'"],
    ["name: 'Thụy Điển'", "name: 'Sweden'"],
    ["name: 'Đan Mạch'", "name: 'Denmark'"],
    ["name: 'Phần Lan'", "name: 'Finland'"],
    ["name: 'Hy Lạp'", "name: 'Greece'"],
    ["name: 'Ai Cập'", "name: 'Egypt'"],
]);

// ══════════════════════════════════════════════════════════════
// lib/engine/dailyAction.ts — check for Vietnamese
// ══════════════════════════════════════════════════════════════

processFile('lib/engine/dailyAction.ts', [
    // Will check what's there
]);

// ══════════════════════════════════════════════════════════════
// lib/plg/trial.ts — Vietnamese in label
// ══════════════════════════════════════════════════════════════

processFile('lib/plg/trial.ts', [
    ["label: 'Import dữ liệu'", "label: 'Import data'"],
]);

console.log(`\n🎉 Phase 03B complete: ${totalCount} replacements across ${fileCount} files`);
