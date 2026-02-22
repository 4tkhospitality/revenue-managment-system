/**
 * Phase 03C — Final i18n cleanup for remaining server-side Vietnamese strings
 * Files: engine.ts, catalog.ts, insightsV2Engine.ts, plan-config.ts,
 *        entitlements.ts, seed-defaults.ts, rate-shopper/parser.ts
 */
const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');

const replacements = [
    // ── lib/pricing/engine.ts ──
    {
        file: 'lib/pricing/engine.ts',
        pairs: [
            // Comments (lines 35-36)
            ['* - Early Bird: khách đặt sớm (14-30 ngày trước check-in)', '* - Early Bird: early booker (14-30 days before check-in)'],
            ['* - Last-Minute: khách đặt gấp (1-7 ngày trước check-in)', '* - Last-Minute: last-minute booker (1-7 days before check-in)'],
            // Step names & error messages
            ["step: '⚠️ Không cộng dồn',", "step: '⚠️ Non-stackable',"],
            ['Early Bird + Last-Minute không stack → Bỏ "', 'Early Bird + Last-Minute do not stack → Removed "'],
            ['%), giữ KM lớn hơn', '%), keeping larger discount'],
            ["errors: ['Commission phải < 100%'],", "errors: ['Commission must be < 100%'],"],
            ["errors: ['Giảm giá phải < 100%'],", "errors: ['Discount must be < 100%'],"],
            ["errors: ['Tổng giảm giá phải < 100%'],", "errors: ['Total discount must be < 100%'],"],
            ["step: 'Giá hiển thị',", "step: 'Display Price',"],
            ["step: 'Tổng KM',", "step: 'Total Discounts',"],
            ["step: 'Hoa hồng OTA',", "step: 'OTA Commission',"],
            ["step: '💰 Thu về',", "step: '💰 Net Revenue',"],
            // Stacking reasons
            ['Cùng nhóm "', 'Same group "'],
            ['" cao hơn (', '" is higher ('],
            // pickBest reason
            ['Scenario "', 'Scenario "'],
            ['%) thắng', '%) wins'],
            ['Scenario không campaign (', 'Scenario without campaign ('],
            ['Bị chặn bởi Deep Deal "', 'Blocked by Deep Deal "'],
            ['(EXCLUSIVE — không stack với Genius)', '(EXCLUSIVE - does not stack with Genius)'],
            ['có level cao hơn', 'has higher level'],
            ['Genius bị loại', 'Genius excluded'],
            ['Bị chặn bởi Campaign "', 'Blocked by Campaign "'],
            ['(TARGETED không stack với Campaign)', '(TARGETED does not stack with Campaign)'],
            ['(PORTFOLIO không stack với Campaign)', '(PORTFOLIO does not stack with Campaign)'],
            ['Bị chặn bởi Business Bookers "', 'Blocked by Business Bookers "'],
            ['Portfolio: chỉ giữ cao nhất', 'Portfolio: keep highest only'],
            ['Targeted: chỉ giữ cao nhất (Mobile/Country không cộng dồn)', 'Targeted: keep highest only (Mobile/Country non-stackable)'],
            ['Genius: chỉ giữ level cao nhất', 'Genius: keep highest level only'],
            ['Member: chỉ giữ deal cao nhất', 'Member: keep highest deal only'],
            ['Non-member: chỉ giữ deal cao nhất (stack với Member)', 'Non-member: keep highest deal only (stacks with Member)'],
            ['Expedia: chỉ cho phép 1 discount (không có Member)', 'Expedia: only 1 discount allowed (no Member deal)'],
            ['Campaign: chỉ giữ cao nhất', 'Campaign: keep highest only'],
            ['(Campaign không cộng dồn với KM khác)', '(Campaign does not stack with other discounts)'],
            ['Targeted: keep highest only', 'Targeted: keep highest only'], // already English in trip.com section
        ],
    },
    // ── lib/pricing/catalog.ts ──
    {
        file: 'lib/pricing/catalog.ts',
        pairs: [
            ['isVariable: true, // User nhập %', 'isVariable: true, // User inputs %'],
            ['isVariable: true, // Hotel chọn % boost', 'isVariable: true, // Hotel chooses % boost'],
            // Group labels — Vietnamese → English (all 4 vendor sections identical)
            ["SEASONAL: 'Theo mùa',", "SEASONAL: 'Seasonal',"],
            ["ESSENTIAL: 'Cơ bản',", "ESSENTIAL: 'Essential',"],
            ["TARGETED: 'Mục tiêu',", "TARGETED: 'Targeted',"],
            ["PORTFOLIO: 'Gói ưu đãi',", "PORTFOLIO: 'Portfolio',"],
            ["CAMPAIGN: 'Chiến dịch',", "CAMPAIGN: 'Campaign',"],
            // Comment
            ["// Unified group labels — same Vietnamese names across ALL vendors (no per-vendor variation)", "// Unified group labels across ALL vendors (no per-vendor variation)"],
        ],
    },
    // ── lib/plg/plan-config.ts ──
    {
        file: 'lib/plg/plan-config.ts',
        pairs: [
            ["R30: '≤ 30 phòng',", "R30: '≤ 30 rooms',"],
            ["R80: '31–80 phòng',", "R80: '31–80 rooms',"],
            ["R150: '81–150 phòng',", "R150: '81–150 rooms',"],
            ["R300P: '151–300+ phòng',", "R300P: '151–300+ rooms',"],
        ],
    },
    // ── lib/plg/entitlements.ts ──
    {
        file: 'lib/plg/entitlements.ts',
        pairs: [
            ['// Resolves subscription via Organization (Cách 2)', '// Resolves subscription via Organization (Method 2)'],
        ],
    },
    // ── lib/pricing/seed-defaults.ts ──
    {
        file: 'lib/pricing/seed-defaults.ts',
        pairs: [
            ["calc_type: 'ADDITIVE' as CalcTypeValue, // Additive (da research: flat rate ~15%)", "calc_type: 'ADDITIVE' as CalcTypeValue, // Additive (researched: flat rate ~15%)"],
        ],
    },
    // ── lib/rate-shopper/parser.ts ──
    {
        file: 'lib/rate-shopper/parser.ts',
        pairs: [
            ['* 1. total_rate_before_tax (nếu có)', '* 1. total_rate_before_tax (if available)'],
        ],
    },
    // ── lib/insights/insightsV2Engine.ts ──
    {
        file: 'lib/insights/insightsV2Engine.ts',
        pairs: [
            // formatDate day names
            ["const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];", "const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];"],
            // Tỷ = Billion currency label
            ["return `${nf1.format(n / 1_000_000_000)} Tỷ₫`;", "return `${nf1.format(n / 1_000_000_000)}B₫`;"],
            // ── Compression DANGER ──
            ['pickup T7 yếu', 'pickup T7 weak'],
            [`what: \`Mới đặt \${occPct}% phòng\${paceGap != null ? \` — thua cùng kỳ năm trước \${Math.abs(Math.round(paceGap))} điểm\` : ''}. Còn thiếu khoảng \${Math.max(0, rnGap)} đêm phòng mới đạt mức an toàn\``, `what: \`Only \${occPct}% rooms booked\${paceGap != null ? \` — \${Math.abs(Math.round(paceGap))} points behind STLY\` : ''}. Need ~\${Math.max(0, rnGap)} more room nights to reach safe level\``],
            ["soWhat: 'Ngày này đang bán chậm hơn mức cần thiết — nếu không kích cầu sớm, phòng sẽ bỏ trống',", "soWhat: 'This date is behind the required pace — rooms will remain empty without early demand stimulation',"],
            ["? 'Cần thêm dữ liệu để đưa ra khuyến nghị cụ thể — hãy upload thêm booking'", "? 'Need more data for specific recommendations — please upload more bookings'"],
            [": `Giảm giá 8–15% trên các kênh bán chính để thu hút thêm booking`,", ": `Reduce prices 8–15% on main channels to attract more bookings`,"],
            ["? 'Chưa đủ dữ liệu để ước tính'", "? 'Not enough data to estimate'"],
            [": `Nếu lấp được 50% phòng đang thiếu → thu thêm khoảng ${formatVND(impactEst)}`", ": `If filling 50% of vacant rooms → additional ~${formatVND(impactEst)}`"],
            // ── Compression HOT ──
            [`\`Đã đặt \${occPct}% phòng, chỉ còn \${remaining} phòng trống\${day.pickupNetT7 != null ? \`. Đang nhận thêm khoảng \${Math.round(day.pickupNetT7)} booking mỗi ngày\` : ''}\``, "`${occPct}% rooms booked, only ${remaining} rooms left${day.pickupNetT7 != null ? `. Receiving ~${Math.round(day.pickupNetT7)} bookings per day` : ''}`"],
            ["soWhat: 'Nhu cầu cao hơn số phòng còn lại — đây là cơ hội tốt để tăng giá bán',", "soWhat: 'Demand exceeds remaining supply — this is a good opportunity to raise prices',"],
            [": `Tăng giá 10–20%, ưu tiên bán qua kênh ít phí hoa hồng (website, đặt trực tiếp)`,", ": `Raise prices 10–20%, prioritize low-commission channels (website, direct booking)`,"],
            [": `Nếu tăng giá ${Math.round(uplift * 100)}% cho phòng còn lại → thu thêm khoảng ${formatVND(impactEst)}`", ": `If raising prices ${Math.round(uplift * 100)}% for remaining rooms → additional ~${formatVND(impactEst)}`"],
            ["`Còn ${remaining} RN`", "`${remaining} RN left`"],
            ["reasons.push('pickup đang tăng tốc');", "reasons.push('pickup accelerating');"],
            // ── Revenue Opportunity ──
            ["`Uplift +${nf1.format(upliftPct)}% (~+${formatVND(upliftTotal)}) nếu áp dụng PriceRec`", "`Uplift +${nf1.format(upliftPct)}% (~+${formatVND(upliftTotal)}) if applying PriceRec`"],
            ["? `~${formatVND(revenueEstimate)} (ước tính sơ — range rộng)`", "? `~${formatVND(revenueEstimate)} (rough estimate — wide range)`"],
            [": `~${formatVND(revenueEstimate)} (dựa ADR hiện tại)`", ": `~${formatVND(revenueEstimate)} (based on current ADR)`"],
            ["`Nếu áp dụng giá khuyến nghị, doanh thu tăng thêm khoảng ${formatVND(upliftTotal)} (+${nf1.format(upliftTotal > 0 && revenueEstimate > 0 ? (upliftTotal / (revenueEstimate - upliftTotal) * 100) : 0)}%)`", "`If applying recommended prices, additional revenue ~${formatVND(upliftTotal)} (+${nf1.format(upliftTotal > 0 && revenueEstimate > 0 ? (upliftTotal / (revenueEstimate - upliftTotal) * 100) : 0)}%)`"],
            ["`Ước tính sơ bộ khoảng ${formatVND(revenueEstimate)} — cần thêm dữ liệu để chính xác hơn`", "`Rough estimate ~${formatVND(revenueEstimate)} — need more data for accuracy`"],
            ["`Nếu bán hết phòng trống với giá trung bình hiện tại → thu thêm khoảng ${formatVND(revenueEstimate)}`", "`If selling all vacant rooms at current average price → additional ~${formatVND(revenueEstimate)}`"],
            ["title: 'Doanh thu tiềm năng — 30 ngày tới',", "title: 'Potential Revenue — Next 30 Days',"],
            ["`Trong 30 ngày tới, khách sạn còn ${nfVND.format(totalRemaining)} đêm phòng chưa có ai đặt`", "`In the next 30 days, the hotel has ${nfVND.format(totalRemaining)} room nights without bookings`"],
            ["`Có ${noForecastDays} ngày hệ thống chưa tính được dự báo nhu cầu — cần thêm dữ liệu`", "`${noForecastDays} days without demand forecast — more data needed`"],
            ["'Hệ thống đã tính được dự báo nhu cầu cho toàn bộ 30 ngày — đủ thông tin để ra quyết định giá'", "'System has calculated demand forecast for all 30 days — sufficient info for pricing decisions'"],
            ["'Hãy upload thêm dữ liệu booking để hệ thống đưa ra khuyến nghị chi tiết hơn'", "'Please upload more booking data for more detailed recommendations'"],
            ["`Tập trung vào ${nfVND.format(noForecastDays)} ngày chưa có dự báo — đẩy mạnh bán qua website và khách hàng thân thiết`", "`Focus on ${nfVND.format(noForecastDays)} days without forecast — boost sales via website and loyal customers`"],
            ["`Vào tab Giá đề xuất, chọn những ngày có giá khuyến nghị tăng hơn 5% so với hiện tại → duyệt và áp dụng`", "`Go to Recommended Prices tab, select dates where recommended price is 5%+ above current → review and apply`"],
            // ── Pace vs STLY ──
            ["title: `So với cùng kỳ năm trước: ${isAhead ? 'tốt hơn' : 'kém hơn'} ${Math.abs(rnDelta)} đêm phòng`,", "title: `vs STLY: ${isAhead ? 'ahead by' : 'behind by'} ${Math.abs(rnDelta)} room nights`,"],
            ["`Đã đặt ${nfVND.format(totalRN)} đêm phòng (năm trước: ${nfVND.format(stlyRN)}, ${rnPctChange >= 0 ? '+' : ''}${rnPctChange}%). Giá trung bình: ${formatVND(adrCurrent)} (năm trước: ${formatVND(adrStly)}, ${adrPctChange >= 0 ? '+' : ''}${adrPctChange}%)`", "`Booked ${nfVND.format(totalRN)} room nights (STLY: ${nfVND.format(stlyRN)}, ${rnPctChange >= 0 ? '+' : ''}${rnPctChange}%). ADR: ${formatVND(adrCurrent)} (STLY: ${formatVND(adrStly)}, ${adrPctChange >= 0 ? '+' : ''}${adrPctChange}%)`"],
            ["`Doanh thu ${isAhead ? 'tăng' : 'giảm'} chủ yếu vì ${driver === 'rate' ? 'giá bán thay đổi' : 'lượng booking thay đổi'}`", "`Revenue ${isAhead ? 'increased' : 'decreased'} mainly due to ${driver === 'rate' ? 'price changes' : 'booking volume changes'}`"],
            ["'Cần thêm dữ liệu để đưa ra khuyến nghị chi tiết — hãy upload thêm booking'", "'Need more data for detailed recommendations — please upload more bookings'"],
            ["'Giữ nguyên chiến lược giá, đề xuất khách nâng hạng phòng để tăng doanh thu'", "'Maintain pricing strategy, suggest room upgrades to increase revenue'"],
            ["'Lượng đặt tốt, giá có thể tăng thêm — xem xét điều chỉnh giá bán'", "'Bookings are strong, prices can increase — consider adjusting rates'"],
            ["`Cần thêm ${Math.abs(rnDelta)} đêm phòng để bằng năm trước — tăng quảng cáo hoặc giảm giá các kênh yếu`", "`Need ${Math.abs(rnDelta)} more room nights to match STLY — increase advertising or reduce prices on weak channels`"],
            ["`Giá bán đang thấp hơn năm trước — hạn chế giảm giá sâu, xem lại chiến lược giá`", "`Rates are lower than STLY — limit deep discounts, review pricing strategy`"],
            ["`Doanh thu trên mỗi phòng: ${revParPct >= 0 ? 'tăng' : 'giảm'} ${Math.abs(revParPct)}% so với cùng kỳ`", "`RevPAR: ${revParPct >= 0 ? 'up' : 'down'} ${Math.abs(revParPct)}% vs STLY`"],
            // ── Pickup Acceleration ──
            ["title: isAccelerating ? 'Booking đang TĂNG TỐC' : 'Booking đang GIẢM TỐC',", "title: isAccelerating ? 'Bookings ACCELERATING' : 'Bookings DECELERATING',"],
            ["`3 ngày gần nhất: ${avgT3 >= 0 ? '+' : ''}${nf1.format(avgT3)} phòng/ngày. Trung bình 7 ngày: ${avgT7 >= 0 ? '+' : ''}${nf1.format(avgT7)} phòng/ngày (chênh lệch ${accelPct >= 0 ? '+' : ''}${accelPct}%)`", "`Last 3 days: ${avgT3 >= 0 ? '+' : ''}${nf1.format(avgT3)} rooms/day. 7-day avg: ${avgT7 >= 0 ? '+' : ''}${nf1.format(avgT7)} rooms/day (diff ${accelPct >= 0 ? '+' : ''}${accelPct}%)`"],
            ["'Khách đặt phòng nhiều hơn bình thường — có thể do sự kiện, mùa cao điểm, hoặc nhu cầu cuối giờ'", "'Higher-than-normal bookings — possibly due to events, peak season, or last-minute demand'"],
            ["'Lượng đặt phòng đang giảm so với tuần trước — cần theo dõi sát và chuẩn bị phương án'", "'Bookings declining vs last week — needs close monitoring and contingency planning'"],
            ["'Hãy upload thêm dữ liệu booking để hệ thống đưa ra khuyến nghị cụ thể hơn'", "'Please upload more booking data for more specific recommendations'"],
            ["'Không cần chạy khuyến mãi trong 7 ngày tới — nhu cầu tự nhiên đang tốt'", "'No promotions needed for the next 7 days — organic demand is strong'"],
            ["'Cân nhắc kích cầu — xem lại giá các ngày có ít booking'", "'Consider demand stimulation — review prices for dates with few bookings'"],
            ["`Nếu giữ giá tốt, tránh mất khoảng ${formatVND(impactVND)} doanh thu`", "`If maintaining good prices, avoid losing ~${formatVND(impactVND)} revenue`"],
            ["`Cần bù khoảng ${formatVND(impactVND)} doanh thu so với tuần trước`", "`Need to recover ~${formatVND(impactVND)} revenue vs last week`"],
            ["pricingHint: pricingHintTag ? 'Lưu ý: có thay đổi giá gần đây, có thể ảnh hưởng đến lượng booking' : undefined,", "pricingHint: pricingHintTag ? 'Note: recent price changes may affect booking volume' : undefined,"],
            // ── Cancel Tier 1 ──
            ["`Tỷ lệ hủy phòng 30 ngày: ${cancelPct}%`", "`30-day cancellation rate: ${cancelPct}%`"],
            ["`Tuần qua: nhận ${cancelData.pickupGross7d} booking mới, bị hủy ${cancelData.cancel7d} → thực tế tăng ${netPickup} đêm phòng${cancelData.topCancelSegment ? `. Kênh hủy nhiều nhất: ${cancelData.topCancelSegment}` : ''}`", "`Last week: ${cancelData.pickupGross7d} new bookings, ${cancelData.cancel7d} cancelled → net gain ${netPickup} room nights${cancelData.topCancelSegment ? `. Top cancel channel: ${cancelData.topCancelSegment}` : ''}`"],
            ["'Tỷ lệ hủy đang cao — đang mất đáng kể doanh thu mỗi tuần'", "'High cancellation rate — losing significant revenue each week'"],
            ["'Tỷ lệ hủy ở mức bình thường — tiếp tục theo dõi'", "'Cancellation rate is normal — continue monitoring'"],
            ["'Cần bổ sung dữ liệu kênh bán để phân tích nguyên nhân hủy chi tiết hơn'", "'Need channel data for detailed cancellation analysis'"],
            ["'Xem lại chính sách hủy phòng — cân nhắc yêu cầu đặt cọc hoặc phí hủy phòng'", "'Review cancellation policy — consider requiring deposits or cancellation fees'"],
            ["'Chưa cần hành động — tiếp tục theo dõi hàng tuần'", "'No action needed — continue weekly monitoring'"],
            ["`Mỗi tuần mất ${cancelData.cancel7d} đêm phòng vì bị hủy`", "`Losing ${cancelData.cancel7d} room nights per week due to cancellations`"],
            // ── Cancel Tier 2 ──
            ["title: 'Cơ hội: Bán vượt công suất',", "title: 'Opportunity: Overbooking Strategy',"],
            ["`Vì tỷ lệ hủy ${cancelPct}%, có thể nhận thêm 5–8% booking cho những ngày đã đặt trên 80% phòng`", "`With ${cancelPct}% cancel rate, can accept 5–8% more bookings for dates above 80% occupancy`"],
            ["soWhat: 'Tận dụng xu hướng hủy phòng để tối ưu doanh thu — rủi ro khách bị chuyển phòng rất thấp',", "soWhat: 'Leverage cancellation trends to optimize revenue — walk risk is very low',"],
            ["`Cho phép nhận thêm 5–8% booking vượt công suất vào những ngày đã đặt trên 80% phòng`", "`Allow 5–8% overbooking on dates above 80% occupancy`"],
            ["`Thu hồi được khoảng ${nfVND.format(recoverRN)} đêm phòng/tháng = +${formatVND(recoverVND)}. Chi phí rủi ro nếu phải chuyển khách: ${formatVND(config.walkCostPerGuest)}/khách`", "`Recover ~${nfVND.format(recoverRN)} room nights/month = +${formatVND(recoverVND)}. Walk risk cost: ${formatVND(config.walkCostPerGuest)}/guest`"],
            // ── Segment Mix ──
            ["`${Math.round(otaPct * 100)}% booking đến từ kênh OTA (Booking.com, Agoda...)`", "`${Math.round(otaPct * 100)}% bookings from OTA channels (Booking.com, Agoda...)`"],
            ["`Phân bổ kênh bán: ${segmentBreakdown}`", "`Channel distribution: ${segmentBreakdown}`"],
            ["soWhat: 'Đang trả nhiều phí hoa hồng cho OTA — có cơ hội chuyển khách sang đặt trực tiếp để giảm chi phí',", "soWhat: 'Paying high OTA commissions — opportunity to shift guests to direct booking to reduce costs',"],
            ["'Cần bổ sung dữ liệu kênh bán để phân tích chính xác hơn'", "'Need channel data for more accurate analysis'"],
            ["'Đảm bảo giá website luôn tốt nhất + chạy ưu đãi cho khách đặt trực tiếp và khách hàng thân thiết'", "'Ensure best website prices + run promotions for direct bookers and loyal guests'"],
            ["'Chưa đủ dữ liệu kênh bán để ước tính'", "'Not enough channel data to estimate'"],
            ["`Nếu chuyển được 10% booking từ OTA sang đặt trực tiếp → tiết kiệm khoảng ${formatVND(annualSaved)}/năm tiền hoa hồng`", "`If shifting 10% bookings from OTA to direct → save ~${formatVND(annualSaved)}/year in commissions`"],
        ],
    },
];

let totalReplacements = 0;
let totalFiles = 0;

for (const { file, pairs } of replacements) {
    const filePath = path.join(BASE, file);
    if (!fs.existsSync(filePath)) {
        console.log(`  ❌ FILE NOT FOUND: ${file}`);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    let fileReplacements = 0;

    for (const [search, replace] of pairs) {
        // Count occurrences
        const count = content.split(search).length - 1;
        if (count > 0) {
            content = content.split(search).join(replace);
            fileReplacements += count;
        } else {
            // Only warn if it looks intentionally targeted (not a duplicate from a prior run)
            if (content.indexOf(replace) === -1) {
                console.log(`  ⚠️ NOT FOUND in ${file}: ${search.substring(0, 60)}...`);
            }
        }
    }

    if (fileReplacements > 0) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ ${file} — ${fileReplacements} replacements`);
        totalReplacements += fileReplacements;
        totalFiles++;
    }
}

console.log(`\n🎉 Phase 03C complete: ${totalReplacements} replacements across ${totalFiles} files`);
