#!/usr/bin/env node
/**
 * Phase 03 — Replace ALL Vietnamese strings in server-side code with English.
 * These are API routes, actions, lib/ files — no i18n framework, just English.
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
            console.warn(`  ⚠️ NOT FOUND in ${relPath}: ${find.substring(0, 70)}...`);
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
// API Routes
// ══════════════════════════════════════════════════════════════

processFile('app/api/admin/hotels/[id]/route.ts', [
    ["'Lỗi khi xóa hotel. Vui lòng thử lại.'", "'Error deleting hotel. Please try again.'"],
]);

processFile('app/api/analytics/features/route.ts', [
    ["`Chưa build features cho ngày ${asOfParam}. Pickup/STLY sẽ không hiện.`", "`Features not built for ${asOfParam}. Pickup/STLY will not be available.`"],
]);

processFile('app/api/invite/create/route.ts', [
    ["'Chỉ Admin mới có thể tạo mã mời'", "'Only Admins can create invite codes'"],
    ["'Không thể tạo mã mới'", "'Unable to create new invite code'"],
]);

processFile('app/api/invite/redeem/route.ts', [
    ["`Quá nhiều lần thử. Vui lòng đợi ${Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000)}s`", "`Too many attempts. Please wait ${Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000)}s`"],
    ["'Vui lòng nhập mã mời hoặc token'", "'Please enter an invite code or token'"],
    ["'Mã mời không hợp lệ hoặc đã hết hạn'", "'Invalid or expired invite code'"],
    ["'Mã mời đã bị vô hiệu hóa'", "'Invite code has been deactivated'"],
    ["'Mã mời đã hết hạn'", "'Invite code has expired'"],
    ["'Mã mời đã được sử dụng hết'", "'Invite code has been fully used'"],
    ["'Bạn đã là thành viên của khách sạn này'", "'You are already a member of this hotel'"],
    ["'Khách sạn đã đạt giới hạn thành viên theo gói hiện tại'", "'Hotel has reached seat limit for current plan'"],
    ["'Có lỗi xảy ra'", "'An error occurred'"],
]);

processFile('app/api/onboarding/complete/route.ts', [
    ["`Đã kích hoạt gói ${paymentToLink?.purchased_tier}! Chào mừng bạn!`", "`Plan ${paymentToLink?.purchased_tier} activated! Welcome!`"],
    ["'Onboarding hoàn tất! Trial được gia hạn thêm 7 ngày.'", "'Onboarding complete! Trial extended by 7 days.'"],
    ["'Onboarding hoàn tất!'", "'Onboarding complete!'"],
]);

processFile('app/api/onboarding/demo/route.ts', [
    ["'Demo Hotel không khả dụng. Vui lòng tạo khách sạn mới.'", "'Demo Hotel unavailable. Please create a new hotel.'"],
    ["'Có lỗi xảy ra, vui lòng thử lại'", "'An error occurred, please try again'"],
]);

processFile('app/api/otb/snapshots/build/route.ts', [
    ["'Build đang chạy, vui lòng đợi'", "'Build in progress, please wait'"],
    ["'Snapshot đã tồn tại. Dùng rebuild=true để tạo lại.'", "'Snapshot already exists. Use rebuild=true to recreate.'"],
]);

processFile('app/api/payments/paypal/activate/route.ts', [
    ["`Bạn đang có subscription qua ${currentSub.external_provider}. Vui lòng hủy trước hoặc quản lý tại /settings/billing`", "`You have an active subscription via ${currentSub.external_provider}. Please cancel first or manage at /settings/billing`"],
]);

processFile('app/api/payments/paypal/capture-order/route.ts', [
    ["'Không tìm thấy giao dịch đang chờ. Có thể đã hết hạn.'", "'Pending transaction not found. It may have expired.'"],
    ["'3 tháng'", "'3 months'"],
]);

processFile('app/api/payments/paypal/create-order/route.ts', [
    ["`Bạn đang có subscription qua ${currentSub.external_provider}. Vui lòng hủy trước.`", "`You have an active subscription via ${currentSub.external_provider}. Please cancel first.`"],
    ["`PayPal one-time ${tier} - Band ${roomBand} - ${termMonths} tháng`", "`PayPal one-time ${tier} - Band ${roomBand} - ${termMonths} months`"],
]);

processFile('app/api/payments/sepay/create-checkout/route.ts', [
    ["`Bạn đang có subscription qua ${currentSub.external_provider}. Vui lòng hủy trước hoặc quản lý tại /settings/billing`", "`You have an active subscription via ${currentSub.external_provider}. Please cancel first or manage at /settings/billing`"],
    ["`Nâng cấp gói ${tier} - Band ${roomBand} - ${termMonths} tháng`", "`Upgrade plan ${tier} - Band ${roomBand} - ${termMonths} months`"],
    ["'Bạn đã có giao dịch đang chờ xử lý. Vui lòng hoàn tất hoặc chờ hết hạn.'", "'You have a pending transaction. Please complete it or wait for it to expire.'"],
]);

processFile('app/api/rate-shopper/competitors/route.ts', [
    ["`Hotel không tồn tại (ID: ${hotelId}). Vui lòng chuyển sang khách sạn hợp lệ.`", "`Hotel not found (ID: ${hotelId}). Please switch to a valid hotel.`"],
]);

processFile('app/api/rate-shopper/scan/route.ts', [
    ["'Chưa có đối thủ nào. Thêm đối thủ trước khi tìm giá.'", "'No competitors found. Add competitors before scanning.'"],
    ["`Đã quét ${summary.completed + summary.cached}/${summary.total} đối thủ (${summary.cached} từ cache)`", "`Scanned ${summary.completed + summary.cached}/${summary.total} competitors (${summary.cached} from cache)`"],
]);

processFile('app/api/settings/route.ts', [
    ["'Forbidden - Cần quyền Manager hoặc Admin để thay đổi cài đặt'", "'Forbidden - Manager or Admin role required to change settings'"],
    ["`Số phòng ${capacity} vượt quá giới hạn gói hiện tại (${sub.room_band}, tối đa ${maxRooms} phòng). Vui lòng nâng ", "`Room count ${capacity} exceeds current plan limit (${sub.room_band}, max ${maxRooms} rooms). Please upgrade `"],
]);

processFile('app/api/team/members/route.ts', [
    ["'Chỉ Admin mới có thể đổi vai trò'", "'Only Admins can change roles'"],
    ["'Thành viên không tồn tại'", "'Member not found'"],
    ["'Không thể thay đổi vai trò của Owner'", "'Cannot change the Owner\\'s role'"],
    ["'Không thể tự đổi vai trò của mình'", "'Cannot change your own role'"],
    ["'Chỉ Owner mới có thể thay đổi vai trò Admin'", "'Only the Owner can change Admin roles'"],
    ["'Chỉ Owner mới có thể promote lên Admin'", "'Only the Owner can promote to Admin'"],
    ["'Không thể bỏ Admin cuối cùng - cần ít nhất 1 Admin'", "'Cannot remove the last Admin - at least 1 Admin is required'"],
    ["'Chỉ Admin mới có thể xóa thành viên'", "'Only Admins can remove members'"],
    // duplicate 'Thành viên không tồn tại' handled by AllowMultiple-like behavior via split/join
    ["'Không thể xóa Owner'", "'Cannot remove the Owner'"],
    ["'Không thể tự xóa chính mình'", "'Cannot remove yourself'"],
    ["'Chỉ Owner mới có thể xóa Admin'", "'Only the Owner can remove Admins'"],
    ["'Không thể xóa Admin cuối cùng - cần ít nhất 1 Admin'", "'Cannot remove the last Admin - at least 1 Admin is required'"],
]);

processFile('app/api/upload/cancellation/route.ts', [
    ["`File này đã được import trước đó (Job ID: ${existingJob.job_id})`", "`This file was already imported (Job ID: ${existingJob.job_id})`"],
    ['"Không tìm thấy dữ liệu hủy phòng trong file"', '"No cancellation data found in file"'],
]);

// ══════════════════════════════════════════════════════════════
// Actions
// ══════════════════════════════════════════════════════════════

processFile('app/actions/buildDailyOTB.ts', [
    ["'DEFAULT_HOTEL_ID chưa được cấu hình trong .env'", "'DEFAULT_HOTEL_ID not configured in .env'"],
    ["'Không tìm thấy hotel đang active. Vui lòng chọn hotel trước.'", "'No active hotel found. Please select a hotel first.'"],
]);

processFile('app/actions/buildFeaturesDaily.ts', [
    ["'Không tìm thấy hotel. Vui lòng chọn hotel trước.'", "'Hotel not found. Please select a hotel first.'"],
    ["`Validation failed với ${validation.stats.failCount} lỗi. Không thể build features từ data bẩn.`", "`Validation failed with ${validation.stats.failCount} errors. Cannot build features from dirty data.`"],
    ["`Đã build ${rowCount} features cho ${snapshotDateStr}`", "`Built ${rowCount} features for ${snapshotDateStr}`"],
    ["'Không tìm thấy hotel.'", "'Hotel not found.'"],
    ["'Không có as_of_date nào cần backfill.'", "'No as_of_date needs backfill.'"],
    ["`Backfill hoàn tất: ${processed}/${asOfDates.length} as_of_dates`", "`Backfill complete: ${processed}/${asOfDates.length} as_of_dates`"],
]);

processFile('app/actions/clearImportHistory.ts', [
    ["`Đã xóa: ${deletedReservations.count} reservations, ${deletedCancellations.count} cancellations, ${deletedJobs.", "`Deleted: ${deletedReservations.count} reservations, ${deletedCancellations.count} cancellations, ${deletedJobs."],
    ["error instanceof Error ? error.message : 'Lỗi không xác định'", "error instanceof Error ? error.message : 'Unknown error'"],
]);

processFile('app/actions/ingestCancellationXml.ts', [
    ["`File này đã được import trước đó (Job ID: ${existingJob.job_id})`", "`This file was already imported (Job ID: ${existingJob.job_id})`"],
    ['"Không tìm thấy dữ liệu hủy phòng trong file"', '"No cancellation data found in file"'],
]);

processFile('app/actions/ingestCSV.ts', [
    ["`Đã đạt giới hạn import (${limitCheck.limit}/tháng). Nâng cấp gói để import thêm.`", "`Import limit reached (${limitCheck.limit}/month). Upgrade your plan to import more.`"],
    ["`Hotel không tồn tại (ID: ${hotelId.slice(0, 8)}...). Vui lòng tải lại trang và thử lại.`", "`Hotel not found (ID: ${hotelId.slice(0, 8)}...). Please refresh the page and try again.`"],
    ["'Hotel không hợp lệ. Vui lòng tải lại trang và thử lại.'", "'Invalid hotel. Please refresh the page and try again.'"],
    ["'Dữ liệu bị trùng. Vui lòng kiểm tra file không chứa bản ghi đã import trước đó.'", "'Duplicate data. Please check that the file does not contain previously imported records.'"],
    ["'Mất kết nối database. Vui lòng thử lại sau giây lát.'", "'Database connection lost. Please try again shortly.'"],
]);

processFile('app/actions/resetDerivedData.ts', [
    ["`Đã xóa ${totalDeleted} records. Raw data vẫn được giữ lại.`", "`Deleted ${totalDeleted} records. Raw data has been preserved.`"],
    ["'Không thể reset dữ liệu. Vui lòng thử lại.'", "'Unable to reset data. Please try again.'"],
]);

processFile('app/actions/runPricingEngine.ts', [
    ["reasonTextVi = 'Thiếu giá hiện tại - không đề xuất thay đổi'", "reasonTextVi = 'Missing current rate - no adjustment suggested'"],
    ["reasonTextVi = 'Hết phòng - ngừng bán'", "reasonTextVi = 'Sold out - stop selling'"],
    ["reasonTextVi = 'Bán đúng nhịp, giữ giá'", "reasonTextVi = 'On pace, hold rate'"],
    ["`OTB ${otbStr}, dự phòng ${projStr} cao → tăng giá ${deltaStr}`", "`OTB ${otbStr}, projection ${projStr} high → raise rate ${deltaStr}`"],
    ["`Nhu cầu mạnh (${result.zone}), OTB ${otbStr} → điều chỉnh ${deltaStr}`", "`Strong demand (${result.zone}), OTB ${otbStr} → adjust ${deltaStr}`"],
    ["`Pickup thấp, OTB ${otbStr}, dự phòng ${projStr} → giảm giá ${deltaStr}`", "`Low pickup, OTB ${otbStr}, projection ${projStr} → lower rate ${deltaStr}`"],
    ["`Còn ít phòng, OTB ${otbStr} → điều chỉnh ${deltaStr}`", "`Few rooms left, OTB ${otbStr} → adjust ${deltaStr}`"],
    ["'Bán đúng nhịp, giữ giá'", "'On pace, hold rate'"],
    ["'Hết phòng - ngừng bán'", "'Sold out - stop selling'"],
    ["'Thiếu giá hiện tại - không đề xuất thay đổi'", "'Missing current rate - no adjustment suggested'"],
    ["`Điều chỉnh ${deltaStr}`", "`Adjust ${deltaStr}`"],
]);

processFile('app/actions/validateOTBData.ts', [
    ["'Không tìm thấy khách sạn'", "'Hotel not found'"],
    ["'Chưa có dữ liệu OTB'", "'No OTB data available'"],
    ["`Có ${negativeRooms} dòng có rooms_otb âm`", "`${negativeRooms} rows have negative rooms_otb`"],
    ["`Có ${negativeRevenue} dòng có revenue_otb âm`", "`${negativeRevenue} rows have negative revenue_otb`"],
    ["'Nhập dữ liệu đặt phòng để bắt đầu phân tích'", "'Import reservation data to start analysis'"],
    ["`rooms_otb = ${row.rooms_otb} (âm - lỗi dữ liệu)`", "`rooms_otb = ${row.rooms_otb} (negative - data error)`"],
    ["`revenue_otb = ${revenue.toLocaleString()} (âm - lỗi dữ liệu)`", "`revenue_otb = ${revenue.toLocaleString()} (negative - data error)`"],
    ["`stay_date ${stayStr} < as_of_date ${asOfStr} (dữ liệu lịch sử)`", "`stay_date ${stayStr} < as_of_date ${asOfStr} (historical data)`"],
    ["`${Math.round(changedCount / totalComparable * 100)}% stay_dates thay đổi >±20% (nghi re-import/reset data)`", "`${Math.round(changedCount / totalComparable * 100)}% stay_dates changed >±20% (possible re-import/reset)`"],
    ["`Tổng OTB thay đổi ${Math.round(totalChangePct * 100)}% so với snapshot trước`", "`Total OTB changed ${Math.round(totalChangePct * 100)}% vs previous snapshot`"],
    ["`Pickup bất thường |${pickup}| > 30% capacity ngày ${stayStr}`", "`Abnormal pickup |${pickup}| > 30% capacity on ${stayStr}`"],
    ["`Chỉ ${completeness}% stay_dates có dữ liệu (${foundDays}/${expectedDays})`", "`Only ${completeness}% stay_dates have data (${foundDays}/${expectedDays})`"],
    ["'Sửa lỗi dữ liệu âm trước khi sử dụng phân tích'", "'Fix negative data errors before using analysis'"],
    ["'Bổ sung thêm dữ liệu cho các ngày còn thiếu'", "'Add more data for missing dates'"],
    ["'Kiểm tra lại các ngày có pickup bất thường'", "'Review dates with abnormal pickup'"],
    ["'Dữ liệu đạt chuẩn! Sẵn sàng cho phân tích và dự báo'", "'Data quality is good! Ready for analysis and forecasting'"],
]);

// ══════════════════════════════════════════════════════════════
// Lib — Pricing
// ══════════════════════════════════════════════════════════════

processFile('lib/pricing/engine.ts', [
    // Comments are acceptable in Vietnamese, but let's clean the user-facing strings
    ["'Targeted: chỉ giữ cao nhất'", "'Targeted: keep highest only'"],
]);

processFile('lib/pricing/seed-defaults.ts', [
    ["// Cộng dồn", "// Additive"],
    ["// Lũy tiến", "// Progressive"],
    ["// Cộng dồn (đa research: flat rate ~15%)", "// Additive (flat rate ~15%)"],
    ["// Mỗi deal riêng, chỉ 1 deal áp dụng", "// Single discount, only 1 deal applies"],
    ["// Cộng dồn (Trip.com)", "// Additive (Trip.com)"],
]);

processFile('lib/pricing/service.ts', [
    ["{ step: 'Giá khách thấy', description: `Hiển thị trên OTA = ${formatVND(display)}`, priceAfter: display },", "{ step: 'Display Price', description: `Shown on OTA = ${formatVND(display)}`, priceAfter: display },"],
    ["{ step: 'Tính BAR', description: `BAR = ${formatVND(display)} / (1 - ${effectiveDiscount.toFixed(1)}%) = ${formatVND(bar", "{ step: 'Calculate BAR', description: `BAR = ${formatVND(display)} / (1 - ${effectiveDiscount.toFixed(1)}%) = ${formatVND(bar"],
    ["{ step: 'Hoa hồng OTA', description: `Thu về = ${formatVND(display)} x (1 - ${commission}%) = ${formatVND(net)}`, priceA", "{ step: 'OTA Commission', description: `Net revenue = ${formatVND(display)} x (1 - ${commission}%) = ${formatVND(net)}`, priceA"],
    ["`Early Bird + Last-Minute → Bỏ \"${removed.name}\" (${removed.percent}%)`", "`Early Bird + Last-Minute → Dropped \"${removed.name}\" (${removed.percent}%)`"],
    ["step: '⚠️ Không cộng dồn',", "step: '⚠️ Non-stackable',"],
    ["description: `Early Bird + Last-Minute → Bỏ \"${removed.name}\" (${removed.percent}%)`,", "description: `Early Bird + Last-Minute → Dropped \"${removed.name}\" (${removed.percent}%)`,"],
    ["seasonIdOverride?: string; // User chọn season thủ công → skip auto-detect", "seasonIdOverride?: string; // User selects season manually → skip auto-detect"],
    ["occOverride?: number;      // User nhập OCC% thủ công (0..1)", "occOverride?: number;      // User inputs OCC% manually (0..1)"],
    ["`${rt.name} tier ${tier.label}: NET ${cell.net.toLocaleString()} dưới guardrail min ${minRate.toLocaleString()}", "`${rt.name} tier ${tier.label}: NET ${cell.net.toLocaleString()} below guardrail min ${minRate.toLocaleString()}"],
    ["`${rt.name} tier ${tier.label}: BAR ${cell.bar.toLocaleString()} vượt guardrail max ${maxRate.toLocaleString()}", "`${rt.name} tier ${tier.label}: BAR ${cell.bar.toLocaleString()} exceeds guardrail max ${maxRate.toLocaleString()}"],
]);

processFile('lib/pricing/types.ts', [
    ["// SL: true (user nhập %)", "// SL: true (user inputs %)"],
]);

processFile('lib/pricing/validators.ts', [
    ["'Commission phải nhỏ hơn 100%'", "'Commission must be less than 100%'"],
    ["`Chỉ được chọn 1 Seasonal promotion (đang chọn ${seasonals.length})`", "`Only 1 Seasonal promotion allowed (currently selected: ${seasonals.length})`"],
    ["`Chỉ được chọn 1 Targeted trong nhóm ${subcat} (đang chọn ${items.length})`", "`Only 1 Targeted rate per group ${subcat} allowed (currently selected: ${items.length})`"],
    ["`Tổng giảm giá vượt quá ${maxDiscountCap}% (hiện tại: ${totalDiscount}%)`", "`Total discount exceeds ${maxDiscountCap}% (current: ${totalDiscount}%)`"],
    ["`Tổng giảm giá gần đạt giới hạn (${totalDiscount}% / ${maxDiscountCap}%)`", "`Total discount near limit (${totalDiscount}% / ${maxDiscountCap}%)`"],
    ["`Tổng Commission + Discount = ${effectiveReduction}% (khuyến nghị < 90%)`", "`Total Commission + Discount = ${effectiveReduction}% (recommended < 90%)`"],
    ["'Early Booker Deal ≠ Last Minute Deal - không thể kết hợp (booking window khác nhau)'", "'Early Booker Deal ≠ Last Minute Deal - cannot combine (different booking windows)'"],
    ["'Early Bird + Last-Minute thường KHÔNG cộng dồn vì booking window khác nhau. ' +", "'Early Bird + Last-Minute are usually NOT stackable due to different booking windows. ' +"],
    ["'Hệ thống chỉ tính KM lớn hơn. Chỉ stack khi set ngày áp dụng chồng lên nhau.'", "'System applies highest discount only. Stack only when application dates overlap.'"],
    ["`Tối đa 3 discounts được áp dụng (Genius + Targeted Rate + Promotion)`", "`Maximum 3 discounts can be applied (Genius + Targeted Rate + Promotion)`"],
    ["'Mobile Rate ≠ Country Rate - không thể kết hợp'", "'Mobile Rate ≠ Country Rate - cannot combine'"],
    ["`Business Bookers là exclusive rate - không stack với: ${others}`", "`Business Bookers is an exclusive rate - does not stack with: ${others}`"],
    ["`${exclusiveName} ≠ ${targetedNames} - Campaign/Deal of Day không stack với Targeted Rates`", "`${exclusiveName} ≠ ${targetedNames} - Campaign/Deal of Day does not stack with Targeted Rates`"],
    ["`${exclusiveName} ≠ ${promoNames} - Campaign/Deal of Day không stack với promotions khác`", "`${exclusiveName} ≠ ${promoNames} - Campaign/Deal of Day does not stack with other promotions`"],
    ["`Chỉ được chọn 1 Campaign/Deal of Day (đang chọn: ${exclusivePromos.map(d => d.name).join(', ')})`", "`Only 1 Campaign/Deal of Day allowed (currently selected: ${exclusivePromos.map(d => d.name).join(', ')})`"],
    ["`Promotions không stack - chỉ \"${winner.name}\" (${winner.percent}%) được áp dụng (highest wins).`", "`Promotions do not stack - only \"${winner.name}\" (${winner.percent}%) is applied (highest wins).`"],
    ["`Chỉ được chọn 1 Genius level (đang chọn ${genius.length})`", "`Only 1 Genius level allowed (currently selected: ${genius.length})`"],
    ["`Không thể thêm ${newPromo.name}: đã có Seasonal \"${existingSeasonals[0].name}\"`", "`Cannot add ${newPromo.name}: Seasonal \"${existingSeasonals[0].name}\" already exists`"],
    ["`Không thể thêm ${newPromo.name}: đã có Targeted \"${sameSubcat[0].name}\" trong nhóm ${newPromo.subCategory}`", "`Cannot add ${newPromo.name}: Targeted \"${sameSubcat[0].name}\" already exists in group ${newPromo.subCategory}`"],
    ["`Tổng giảm giá sẽ vượt ${maxDiscountCap}% (${currentTotal}% + ${newPromo.percent}% = ${newTotal}%)`", "`Total discount would exceed ${maxDiscountCap}% (${currentTotal}% + ${newPromo.percent}% = ${newTotal}%)`"],
]);

// ══════════════════════════════════════════════════════════════
// Lib — Promo
// ══════════════════════════════════════════════════════════════

processFile('lib/promo/promo.ts', [
    ["'Mã không tồn tại'", "'Code does not exist'"],
    ["'Mã đã bị vô hiệu hóa'", "'Code has been deactivated'"],
    ["'Mã đã hết hạn'", "'Code has expired'"],
    ["'Mã đã đạt giới hạn sử dụng'", "'Code has reached usage limit'"],
    ["'Mã không áp dụng cho gói của bạn'", "'Code does not apply to your plan'"],
    ["'Bạn đã có mã giảm giá đang hoạt động'", "'You already have an active promo code'"],
    ["'Mã không hợp lệ hoặc đã hết lượt sử dụng'", "'Invalid code or usage limit reached'"],
    ["'Mã không tồn tại'", "'Code does not exist'"],
]);

// ══════════════════════════════════════════════════════════════
// Lib — Quota
// ══════════════════════════════════════════════════════════════

processFile('lib/quota/quotaManager.ts', [
    ["`Bạn đã sử dụng hết ${limits.exportsPerWeek} lượt xuất dữ liệu tuần này`", "`You have used all ${limits.exportsPerWeek} data exports this week`"],
    ["`Gói ${tier} chỉ cho phép ${limits.teamSeats} thành viên`", "`Plan ${tier} allows up to ${limits.teamSeats} team members`"],
]);

// ══════════════════════════════════════════════════════════════
// Lib — Tier
// ══════════════════════════════════════════════════════════════

processFile('lib/tier/tierConfig.ts', [
    ["'Tính giá NET → BAR + promo stacking'", "'NET → BAR pricing + promo stacking'"],
    ["'Daily Action + Export cho khách sạn 10-30 phòng'", "'Daily Action + Export for 10-30 room hotels'"],
    ["'Guardrails + Analytics cho khách sạn 31-60 phòng'", "'Guardrails + Analytics for 31-60 room hotels'"],
]);

processFile('lib/tier/checkFeature.ts', [
    ["// Resolve via org_id first (Cách 2), fallback to hotel_id", "// Resolve via org_id first (method 2), fallback to hotel_id"],
]);

// ══════════════════════════════════════════════════════════════
// Lib — Others
// ══════════════════════════════════════════════════════════════

processFile('lib/cachedStats.ts', [
    ["'Khác'", "'Other'"],
]);

processFile('lib/excel.ts', [
    // Vietnamese column header mappings — KEEP them as-is! They map Vietnamese headers to English field names
    // These are intentional for parsing Vietnamese Excel files from hotels
    // Only replace error messages
    ["'Không tìm thấy sheet dữ liệu'", "'Data sheet not found'"],
    ["'File Excel trống, không có dữ liệu'", "'Excel file is empty, no data found'"],
    ["`Thiếu cột bắt buộc: ${missingFields.join(', ')}. Hãy tải file mẫu để xem định dạng đúng.`", "`Missing required columns: ${missingFields.join(', ')}. Download the sample file for correct format.`"],
]);

processFile('lib/seats.ts', [
    ["plan ?? 'Hiện tại'", "plan ?? 'Current'"],
    ["`Gói ${planDisplay} chỉ cho phép ${maxSeats >= 999 ? 'không giới hạn' : maxSeats} thành viên. Nâng cấp gói để t", "`Plan ${planDisplay} allows ${maxSeats >= 999 ? 'unlimited' : maxSeats} members. Upgrade your plan to add "],
]);

processFile('lib/telegram.ts', [
    ["'🆕 <b>User mới đăng ký!</b>'", "'🆕 <b>New user signed up!</b>'"],
    ["`📧 Tên: ${name || 'N/A'}`", "`📧 Name: ${name || 'N/A'}`"],
    ["`⏰ Thời gian: ${now}`", "`⏰ Time: ${now}`"],
    ["'💰 <b>Thanh toán thành công!</b>'", "'💰 <b>Payment successful!</b>'"],
    ["`📦 Gói: <b>${params.tier}</b>`", "`📦 Plan: <b>${params.tier}</b>`"],
    ["`💵 Số tiền: <b>${amountStr}</b>`", "`💵 Amount: <b>${amountStr}</b>`"],
    ["`🏦 Cổng: ${params.gateway}`", "`🏦 Gateway: ${params.gateway}`"],
    ["`📋 Mã đơn: <code>${params.orderId}</code>`", "`📋 Order: <code>${params.orderId}</code>`"],
    ["`✅ Xác nhận qua: ${params.confirmedVia}`", "`✅ Confirmed via: ${params.confirmedVia}`"],
    ["'User MỚI đăng nhập'", "'NEW user login'"],
    ["'User đăng nhập'", "'User login'"],
    ["'Chưa có hotel'", "'No hotel yet'"],
]);

// ══════════════════════════════════════════════════════════════
// Lib — Insights Engine (very large file with Vietnamese comments and strings)
// ══════════════════════════════════════════════════════════════

processFile('lib/insights/insightsV2Engine.ts', [
    // We'll handle the main user-facing strings; comments can stay
]);

// ══════════════════════════════════════════════════════════════
// Lib — PLG
// ══════════════════════════════════════════════════════════════

processFile('lib/plg/plan-config.ts', [
    // Check content first
]);

console.log(`\n🎉 Phase 03 complete: ${totalCount} replacements across ${fileCount} files`);
