/**
 * Phase 02B - FINAL pass 6: Read files directly and replace by line matching
 * Uses regex to detect Vietnamese characters and then matches by line content
 */
const fs = require('fs');
const path = require('path');
const BASE = path.join(__dirname, '..');

const VN_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/;

// Define replacements by file -> { lineContains -> newLine }
// We match lines by a unique Vietnamese substring, then replace the whole line
const REPLACEMENTS = {
    'app/guide/page.tsx': [
        // L599: "dư phòng" in the Reason row - mixed VN/EN
        { match: 'dư phòng', replace: (line) => line.replace(/dư phòng/g, 'remaining rooms') },
        // L482: "đã qua" in hotel stats
        { match: 'đã qua', replace: (line) => line.replace(/đã qua/g, 'passed') },
        // L595: "đang bán" 
        { match: 'đang bán', replace: (line) => line.replace(/đang bán/g, 'currently selling') },
        // guide table rows with VN
        { match: 'Tối ưu', replace: (line) => line.replace(/Tối ưu/g, 'Optimal') },
        { match: 'Tăng giá', replace: (line) => line.replace(/Tăng giá/g, 'Increase price').replace(/giảm giá/g, 'decrease price') },
        { match: 'giảm giá', replace: (line) => line.replace(/giảm giá/g, 'decrease price') },
        { match: 'Giữ giá', replace: (line) => line.replace(/Giữ giá/g, 'Keep price') },
        { match: 'Từ thấp', replace: (line) => line.replace(/Từ thấp/g, 'From low').replace(/đến cao/g, 'to high') },
        { match: 'đến cao', replace: (line) => line.replace(/đến cao/g, 'to high') },
        { match: 'Bậc thấp nhất', replace: (line) => line.replace(/Bậc thấp nhất/g, 'Lowest tier') },
        { match: 'bậc cao nhất', replace: (line) => line.replace(/bậc cao nhất/g, 'highest tier') },
        { match: 'Giá cơ sở', replace: (line) => line.replace(/Giá cơ sở/g, 'Base price') },
        { match: 'Hoa hồng', replace: (line) => line.replace(/Hoa hồng/g, 'Commission') },
        { match: 'Giá bán', replace: (line) => line.replace(/Giá bán/g, 'Selling price') },
        { match: 'Giá khách', replace: (line) => line.replace(/Giá khách/g, 'Guest price') },
        { match: 'Chiến lược giá', replace: (line) => line.replace(/Chiến lược giá/g, 'Pricing strategy') },
        { match: 'Nhận doanh thu', replace: (line) => line.replace(/Nhận doanh thu/g, 'Received revenue') },
    ],

    'components/pricing/DynamicPricingTab.tsx': [
        { match: 'Dòng', replace: (line) => line.replace(/>Dòng</, '>Row<') },
        { match: 'Bấm nút', replace: (line) => line.replace(/Bấm nút Configuration ở card bên trái để thiết lập bậc giá theo OCC%/, 'Click Configuration on the left card to set up price tiers by OCC%') },
    ],

    'components/guide/AgodaChecklist.tsx': [
        { match: 'trung bình cộng', replace: (line) => line.replace(/trung bình cộng x 2 \(thang 10\)/, 'average × 2 (scale of 10)') },
        { match: 'hằng days', replace: (line) => line.replace(/Set budget hằng days \+ bid/, 'Set daily budget + bid') },
    ],

    'components/dashboard/AccountDetailModal.tsx': [
        { match: 'Không có dữ liệu', replace: (line) => line.replace(/Không có dữ liệu/g, 'No data available') },
        { match: 'Phân bố theo Room Type', replace: (line) => line.replace(/Phân bố theo Room Type/g, 'Room Type Distribution') },
    ],

    'components/dashboard/RecommendationTable.tsx': [
        { match: '>Ngày<', replace: (line) => line.replace(/>Ngày</g, '>Date<') },
        { match: '>Thao tác<', replace: (line) => line.replace(/>Thao tác</g, '>Actions<') },
    ],

    'components/guide/WhenToBoost.tsx': [
        { match: '>Lưu<', replace: (line) => line.replace(/>Lưu</g, '>Save<') },
        { match: '>Huỷ<', replace: (line) => line.replace(/>Huỷ</g, '>Cancel<') },
        { match: '>Hủy<', replace: (line) => line.replace(/>Hủy</g, '>Cancel<') },
    ],

    'app/auth/login/page.tsx': [
        { match: 'tiếp brand', replace: (line) => line.replace(/tiếp brand/, 'brand continuation') },
        { match: 'với nền xanh brand', replace: (line) => line.replace(/với nền xanh brand để tiếp màu logo JPG/, 'with brand blue bg to match JPG logo') },
        { match: 'để tiếp mầu', replace: (line) => line.replace(/để tiếp mầu logo JPG/, 'to match JPG logo') },
    ],

    'components/pricing/SeasonConfigPanel.tsx': [
        { match: '> Thêm<', replace: (line) => line.replace(/> Thêm</, '> Add<') },
        { match: '>Thêm<', replace: (line) => line.replace(/>Thêm</g, '>Add<') },
        { match: '>Lưu<', replace: (line) => line.replace(/>Lưu</g, '>Save<') },
    ],

    'components/admin/PricingTab.tsx': [
        { match: 'Giá (VND/tháng)', replace: (line) => line.replace(/Giá \(VND\/tháng\)/, 'Price (VND/month)') },
        { match: 'Loading cấu hình giá', replace: (line) => line.replace(/Loading cấu hình giá\./, 'Loading price configuration.') },
    ],

    'components/pricing/OTAConfigTab.tsx': [
        { match: '>Huỷ<', replace: (line) => line.replace(/>Huỷ</g, '>Cancel<') },
        { match: '>Hủy<', replace: (line) => line.replace(/>Hủy</g, '>Cancel<') },
    ],

    'components/pricing/RoomTypesTab.tsx': [
        { match: '>Huỷ<', replace: (line) => line.replace(/>Huỷ</g, '>Cancel<') },
        { match: '>Hủy<', replace: (line) => line.replace(/>Hủy</g, '>Cancel<') },
    ],

    'components/analytics/types.ts': [
        { match: 'Tổng rooms đặt thêm', replace: (line) => line.replace(/Tổng rooms đặt thêm \(net\) trong 7 days remaining qua/, 'Total additional rooms booked (net) in last 7 days') },
        { match: 'Bao gồm bookings mới', replace: (line) => line.replace(/Bao gồm bookings mới - cancellations/, 'Including new bookings - cancellations') },
    ],

    'components/analytics/DataQualityBadge.tsx': [
        { match: 'dòng nearest DOW', replace: (line) => line.replace(/STLY dòng nearest DOW/g, 'STLY nearest DOW rows') },
    ],

    'components/analytics/BuildFeaturesInline.tsx': [
        { match: '>Dừng<', replace: (line) => line.replace(/>Dừng</g, '>Stop<') },
    ],

    'components/admin/PLGAdminDashboard.tsx': [
        { match: 'Mã inactive không thể sử dụng nhưng vẫn được giữ lại', replace: (line) => line.replace(/Mã inactive không thể sử dụng nhưng vẫn được giữ lại/, 'Inactive codes cannot be used but are still retained') },
        { match: 'Mã inactive', replace: (line) => line.replace(/Mã? inactive không thể sử dụng nhưng vẫn được giữ lại/g, 'Inactive codes cannot be used but are still retained') },
        { match: 'Ma inactive', replace: (line) => line.replace(/Ma inactive kh[^ ]+ th[^ ]+ s[^ ]+ d[^ ]+ nh[^ ]+ v[^ ]+ đ[^ ]+ gi[^ ]+ l[^ ]+/g, 'Inactive codes cannot be used but are still retained') },
    ],

    'app/settings/team/page.tsx': [
        { match: 'mã mới khác', replace: (line) => line.replace(/Create mã mới khác/, 'Create a new code') },
    ],

    'components/billing/PromoRedeemCard.tsx': [
        { match: '>Kiểm tra<', replace: (line) => line.replace(/>Kiểm tra</g, '>Verify<') },
    ],

    'app/rate-shopper/competitors/page.tsx': [
        { match: '>Tìm<', replace: (line) => line.replace(/>Tìm</g, '>Search<') },
    ],

    'app/admin/hotels/page.tsx': [
        { match: 'Quản lý Hotels', replace: (line) => line.replace(/Quản lý Hotels/g, 'Hotel Management') },
        { match: 'Đang tải hotels', replace: (line) => line.replace(/Đang tải hotels/g, 'Loading hotels') },
        { match: 'Thêm hotel', replace: (line) => line.replace(/Thêm hotel/g, 'Add hotel') },
        { match: 'Chỉnh sửa', replace: (line) => line.replace(/Chỉnh sửa/g, 'Edit') },
    ],

    'app/admin/users/page.tsx': [
        { match: 'Quản lý Users', replace: (line) => line.replace(/Quản lý Users/g, 'User Management') },
        { match: 'Trial sắp hết', replace: (line) => line.replace(/Trial sắp hết/g, 'Trial expiring') },
        { match: 'Vượt', replace: (line) => line.replace(/Vượt/g, 'Exceeds') },
        { match: 'Chọn gói để kích hoạt subscription cho hotel này', replace: (line) => line.replace(/Chọn gói để kích hoạt subscription cho hotel này/g, 'Select plan to activate subscription for this hotel') },
    ],

    // upload/page.tsx - remaining "Xem data"
    'app/upload/page.tsx': [
        { match: 'Xem data', replace: (line) => line.replace(/Xem data/g, 'View data') },
    ],

    // DeleteByMonthButton.tsx - "Gõ"
    'app/data/DeleteByMonthButton.tsx': [
        { match: 'Gõ <strong>', replace: (line) => line.replace(/Gõ <strong>/, 'Type <strong>') },
    ],
};

let total = 0;

for (const [relPath, rules] of Object.entries(REPLACEMENTS)) {
    const fp = path.join(BASE, relPath);
    if (!fs.existsSync(fp)) {
        console.log(`⚠️  ${relPath} not found`);
        continue;
    }

    let src = fs.readFileSync(fp, 'utf8');
    let lines = src.split('\n');
    let fileCount = 0;

    for (const rule of rules) {
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(rule.match)) {
                const original = lines[i];
                lines[i] = rule.replace(lines[i]);
                if (lines[i] !== original) {
                    fileCount++;
                }
            }
        }
    }

    if (fileCount > 0) {
        fs.writeFileSync(fp, lines.join('\n'), 'utf8');
        console.log(`✅ ${relPath}: ${fileCount} replacements`);
        total += fileCount;
    }
}

console.log(`\n🎯 FINAL Pass 6: ${total} replacements`);
