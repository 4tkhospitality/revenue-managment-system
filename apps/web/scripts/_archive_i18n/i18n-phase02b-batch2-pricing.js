/**
 * Phase 02B - Batch 2: Pricing Components
 * PromotionsTab, DynamicPricingTab, SetupTab, OverviewTab, OccTierEditor,
 * OTAConfigTab, RoomTypesTab, SeasonConfigPanel, SeasonRateEditor
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'components', 'pricing');
const FILES = [
    'PromotionsTab.tsx', 'DynamicPricingTab.tsx', 'SetupTab.tsx',
    'OverviewTab.tsx', 'OccTierEditor.tsx', 'OTAConfigTab.tsx',
    'RoomTypesTab.tsx', 'SeasonConfigPanel.tsx', 'SeasonRateEditor.tsx',
];

const replacements = [
    // ═══ PromotionsTab.tsx ═══
    // Group labels
    [`'Seasonal (Theo mùa)'`, `'Seasonal'`],
    [`'Essential (Cơ bản)'`, `'Essential'`],
    [`'Targeted (Mục tiêu)'`, `'Targeted'`],
    [`'Theo mùa'`, `'Seasonal'`],
    [`'Cơ bản'`, `'Essential'`],
    [`'Mục tiêu'`, `'Targeted'`],
    [`'Gói ưu đãi'`, `'Portfolio'`],
    [`'Chiến dịch'`, `'Campaign'`],
    // Comment
    [`// % hoa hồng từ tab Kênh OTA`, `// % commission from OTA Channel tab`],
    // UI strings
    [`Thêm khuyến mại `, `Add Promotion `],
    [`>Thêm</span>`, `>Add</span>`],
    [`Nhấn để thêm khuyến mại`, `Click to add a promotion`],
    [`>Tên khuyến mại</span>`, `>Promotion Name</span>`],
    [`>Giảm giá</span>`, `>Discount</span>`],
    [`>Trạng thái</span>`, `>Status</span>`],
    [`>Xóa</span>`, `>Delete</span>`],
    [`Thêm Khuyến mại `, `Add Promotion `],
    [`Chọn chương trình khuyến mại từ danh mục có sẵn`, `Select a promotion from the available catalog`],
    [`placeholder="Tìm kiếm chương trình..."`, `placeholder="Search promotions..."`],
    [`Không tìm thấy chương trình nào`, `No promotions found`],
    [`Thử tìm kiếm với từ khóa khác`, `Try searching with different keywords`],
    [`Giảm `, `Discount `],
    [`>Thêm<`, `>Add<`],
    // Calculator
    [`// Giá thu về → Tính ngược lên BAR + Display`, `// Net Revenue → Reverse calc to BAR + Display`],
    [`// Giá BAR (Channel Manager) → Tính xuống Display + NET`, `// BAR Price (Channel Manager) → Calc down to Display + NET`],
    [`// Giá hiển thị (khách thấy) → Tính ngược BAR + tính xuống NET`, `// Display Price (guest sees) → Reverse to BAR + calc down to NET`],
    [`Tính giá - `, `Calculate Price - `],
    [`Chưa có hạng phòng. Vui lòng thêm ở tab &quot;Hạng phòng&quot;.`, `No room types yet. Please add them in the &quot;Room Types&quot; tab.`],
    [`'luỹ tiến'`, `'progressive'`],
    [`'deal cao nhất'`, `'highest deal'`],
    [`'cộng dồn'`, `'additive'`],
    [`Giá Thu về`, `Net Revenue`],
    [`Giá BAR`, `BAR Price`],
    [`Giá Hiển thị`, `Display Price`],
    [`'Nhập giá thu về mong muốn:'`, `'Enter desired net revenue:'`],
    [`'Nhập giá BAR (Channel Manager):'`, `'Enter BAR price (Channel Manager):'`],
    [`'Nhập giá khách thấy trên OTA:'`, `'Enter price guest sees on OTA:'`],
    [`→ Giá Channel Manager (BAR)`, `→ Channel Manager Price (BAR)`],
    [`Khuyến mại -`, `Promotions -`],
    [`→ Giá khách thấy trên OTA`, `→ Price Guest Sees on OTA`],
    [`Hoa hồng OTA -`, `OTA Commission -`],
    [`→ Tiền thu về (Net Revenue)`, `→ Net Revenue`],
    [`Commission rất cao (`, `Commission very high (`],
    [`%) - kiểm tra lại`, `%) - please verify`],
    [`Tất cả quy tắc đều đạt`, `All rules passed`],
    [`Giải thích cách tính`, `Pricing Calculation Explained`],
    [`→→ Bước 1: Giá gốc (Net price)`, `→→ Step 1: Base Price (Net price)`],
    [`Giá phòng mà khách sạn muốn thu về`, `Room price the hotel wants to receive`],
    [`→→ Bước 2: Cộng hoa hồng OTA (`, `→→ Step 2: Add OTA Commission (`],
    [`Giá trước khuyến mại`, `Price before promotions`],
    [`'Nhân luỹ tiến'`, `'Progressive'`],
    [`'Deal cao nhất'`, `'Highest Deal'`],
    [`'Cộng dồn'`, `'Additive'`],
    [`→→ Bước 3: `, `→→ Step 3: `],
    [`→→ KM bị loại bỏ (do quy tắc xếp chồng)`, `→→ Promos excluded (due to stacking rules)`],
    [`→ Kết quả`, `→ Result`],
    [`>Giá Channel Manager (BAR)<`, `>Channel Manager Price (BAR)<`],
    [`>Khách thấy trên OTA<`, `>Guest sees on OTA<`],
    [`>Khách sạn thu về (Net)<`, `>Hotel receives (Net)<`],
    [`Chọn hạng phòng để xem số liệu cụ thể`, `Select a room type to view detailed pricing`],
    [`'Xóa promotion này?'`, `'Delete this promotion?'`],
    // Footer stats
    [`Hoa hồng `, `Commission `],
    [`' · luỹ tiến'`, `' · progressive'`],
    [`' · deal cao nhất'`, `' · highest deal'`],
    [`' · cộng dồn'`, `' · additive'`],
    [`>Thêm khuyến mại<`, `>Add Promotion<`],
    [`Chưa có khuyến mại nào - Nhấn để thêm`, `No promotions yet - Click to add`],
    [`>Tên khuyến mại</`, `>Promotion Name</`],
    [`>Nhóm</th>`, `>Group</th>`],
    [`>Giảm</th>`, `>Discount</th>`],
    [`>Trạng thái</th`, `>Status</th`],
    [`>Thao tác</th>`, `>Actions</th>`],
    [`>Thêm khuyến mại từ catalog<`, `>Add Promotion from Catalog<`],
    // Agoda auto-stack warning
    [`Agoda tự động bật cộng dồn cho khuyến mại Cơ bản`, `Agoda auto-enables additive stacking for Essential promotions`],
    [`Khi tạo khuyến mại Cơ bản trên Agoda, nút &ldquo;Kết hợp với khuyến mại khác&rdquo; mặc định <strong>BẬT</strong>.`, `When creating Essential promotions on Agoda, the &ldquo;Combine with other promotions&rdquo; toggle defaults to <strong>ON</strong>.`],
    [`Điều này khiến tất cả khuyến mại Cơ bản <strong>cộng dồn giảm giá</strong> lên nhau.`, `This causes all Essential promotions to <strong>stack discounts additively</strong> on top of each other.`],
    [`Nếu không muốn, hãy tắt nút này trong trang quản lý Agoda cho từng khuyến mại.`, `If unwanted, turn off this toggle in the Agoda management page for each promotion.`],
    // Campaign warning
    [`→→ Campaign không cộng dồn với KM khác`, `→→ Campaign does not stack with other promotions`],
    [`Khi Campaign đang bật, hệ thống sẽ <strong>tự động loại bỏ</strong> các khuyến mại còn lại (Regular, Targeted, Package..`, `When Campaign is active, the system will <strong>automatically exclude</strong> other promotions (Regular, Targeted, Package..`],
    [`Chỉ Campaign có % cao nhất được áp dụng.`, `Only the Campaign with highest % is applied.`],
    // Discount summary
    [`Tổng giảm giá: `, `Total discount: `],
    [` (Agoda tối đa 80%)`, ` (Agoda max 80%)`],
    [`' (luỹ tiến)'`, `' (progressive)'`],
    [`' (deal cao nhất)'`, `' (highest deal)'`],
    [`' (cộng dồn)'`, `' (additive)'`],
    // Preview labels
    [`: ' (không KM)'`, `: ' (no promos)'`],
    [`→→ Member tiết kiệm `, `→→ Member saves `],
    [`rẻ hơn)`, `cheaper)`],

    // ═══ OverviewTab.tsx ═══
    [`>Chế độ:</span>`, `>Mode:</span>`],
    [`Thu về → Hiển thị`, `Revenue → Display`],
    [`Hiển thị → Thu về`, `Display → Revenue`],
    [`'Nhập giá Net → Tính ra giá BAR & Giá khách thấy'`, `'Enter Net price → Calculate BAR & Guest price'`],
    [`'Nhập giá khách thấy → Tính ra giá BAR & Thu về'`, `'Enter guest price → Calculate BAR & Net Revenue'`],
    [`>Đang tính...</span>`, `>Calculating...</span>`],
    [`>Tính lại<`, `>Recalculate<`],
    [`'Tính năng này không khả dụng cho Demo Hotel'`, `'This feature is not available for Demo Hotel'`],
    [`'Xuất PDF'`, `'Export PDF'`],
    [`'Xuất CSV'`, `'Export CSV'`],
    [`>Mỗi ô hiển thị:</span>`, `>Each cell shows:</span>`],
    [`Giá khách thấy (Display)`, `Guest Price (Display)`],
    [`Doanh thu thu về (Net)`, `Net Revenue`],
    [`Giá BAR (nhập CM)`, `BAR Price (for CM)`],
    [`Tỷ lệ giữ lại:`, `Retention rate:`],
    [`>Hạng phòng<`, `>Room Type<`],
    [`>Nhập giá hiển thị</span>`, `>Enter display price</span>`],
    [`>Giá Net cơ sở</span>`, `>Base Net price</span>`],
    [`>Khách thấy</div>`, `>Guest Sees</div>`],
    [`>Thu về (Net)</div>`, `>Net Revenue</div>`],
    [`Chưa nhập giá`, `No price set`],
    [`>Đang tính...<`, `>Calculating...<`],
    [`>Thu về</div>`, `>Revenue</div>`],
    [`Chưa có đủ dữ liệu để hiển thị.`, `Not enough data to display.`],
    [`Vui lòng thêm Hạng phòng và Kênh OTA trước.`, `Please add Room Types and OTA Channels first.`],
    [`>Chi tiết tính giá:</div>`, `>Pricing Details:</div>`],
    [`>Không có chi tiết</div>`, `>No details</div>`],
    [`>Hiển thị: `, `>Display: `],
    [`Thu về: `, `Revenue: `],

    // ═══ OccTierEditor.tsx ═══
    [`'Hệ số ngoài 0.5-3.0'`, `'Multiplier outside 0.5-3.0'`],
    [`không liên mạch - bậc trước kết thúc `, `not contiguous - previous tier ends at `],
    [`'phải bắt đầu từ 0%'`, `'must start at 0%'`],
    [`'phải kết thúc ở 100%'`, `'must end at 100%'`],
    [`'Cần ít nhất 3 bậc'`, `'Need at least 3 tiers'`],
    [`'Tối đa 6 bậc'`, `'Maximum 6 tiers'`],
    [`': min ≥ max'`, `': min ≥ max'`],
    [`': hệ số ngoài 0.5-3.0'`, `': multiplier outside 0.5-3.0'`],
    [`': không liên mạch với bậc '`, `': not contiguous with tier '`],
    [`'Bậc đầu phải bắt đầu từ 0%'`, `'First tier must start at 0%'`],
    [`'Bậc cuối phải kết thúc ở 100%'`, `'Last tier must end at 100%'`],
    [`>Bậc công suất (OCC Tiers)</h3>`, `>Occupancy Tiers (OCC Tiers)</h3>`],
    [`Chưa lưu`, `Unsaved`],
    [`title="Thêm bậc"`, `title="Add Tier"`],
    [`title="Xóa bậc cuối"`, `title="Delete Last Tier"`],
    [`>Từ</span>`, `>From</span>`],
    [`>Đến</span>`, `>To</span>`],
    [`>Loại</span>`, `>Type</span>`],
    [`>Điều chỉnh</span>`, `>Adjustment</span>`],
    [`'Đang dùng hệ số (×). Click để chuyển sang số tiền (₫)'`, `'Using multiplier (×). Click to switch to amount (₫)'`],
    [`'Đang dùng số tiền (₫). Click để chuyển sang hệ số (×)'`, `'Using amount (₫). Click to switch to multiplier (×)'`],
    [`Đã lưu thành công!`, `Saved successfully!`],
    [`'Lưu bậc OCC'`, `'Save OCC Tiers'`],
    [`'Đã lưu'`, `'Saved'`],

    // ═══ OTAConfigTab.tsx ═══
    [`'Xác nhận xóa kênh OTA này?'`, `'Confirm delete this OTA channel?'`],
    [`>Kênh OTA</h2>`, `>OTA Channels</h2>`],
    [`>Thêm kênh OTA<`, `>Add OTA Channel<`],
    [`'Sửa kênh OTA'`, `'Edit OTA Channel'`],
    [`'Thêm kênh OTA'`, `'Add OTA Channel'`],
    [`>Tên kênh *</label>`, `>Channel Name *</label>`],
    [`>Mã kênh *</label>`, `>Channel Code *</label>`],
    [`>Hoa hồng (%) *</label>`, `>Commission (%) *</label>`],
    [`>Chế độ tính</label>`, `>Calculation Mode</label>`],
    [`>Luỹ tiến - Progressive<`, `>Progressive<`],
    [`>Cộng dồn - Additive<`, `>Additive<`],
    [`>Đang hoạt động</label>`, `>Active</label>`],
    [`>Hủy<`, `>Cancel<`],
    [`'Cập nhật'`, `'Update'`],
    [`'Thêm'`, `'Add'`],
    [`Chưa có kênh OTA nào. Nhấn &quot;Thêm kênh OTA&quot; để bắt đầu.`, `No OTA channels yet. Click &quot;Add OTA Channel&quot; to get started.`],
    [`>Kênh OTA</th>`, `>OTA Channel</th>`],
    [`>Mã</th>`, `>Code</th>`],
    [`>Hoa hồng</th>`, `>Commission</th>`],
    [`>Chế độ tính</th>`, `>Calc Mode</th>`],
    [`'Luỹ tiến'`, `'Progressive'`],
    [`'Cộng dồn'`, `'Additive'`],

    // ═══ RoomTypesTab.tsx ═══
    [`'Xác nhận xóa hạng phòng này?'`, `'Confirm delete this room type?'`],
    [`>Hạng phòng</h2>`, `>Room Types</h2>`],
    [`>Thêm hạng phòng<`, `>Add Room Type<`],
    [`'Sửa hạng phòng'`, `'Edit Room Type'`],
    [`'Thêm hạng phòng'`, `'Add Room Type'`],
    [`>Tên hạng phòng *</label>`, `>Room Type Name *</label>`],
    [`>Mô tả</label>`, `>Description</label>`],
    [`>Giá thu về (VND) *</label>`, `>Net Revenue (VND) *</label>`],
    [`>Hủy`, `>Cancel`],
    [`Chưa có hạng phòng nào. Nhấn &quot;Thêm hạng phòng&quot; để bắt đầu.`, `No room types yet. Click &quot;Add Room Type&quot; to get started.`],
    [`>Hạng phòng</th>`, `>Room Type</th>`],
    [`>Mô tả</th>`, `>Description</th>`],
    [`>Giá thu về</th>`, `>Net Revenue</th>`],

    // ═══ SeasonConfigPanel.tsx ═══
    [`'Xóa season này? Dữ liệu NET rate liên quan cũng sẽ bị xóa.'`, `'Delete this season? Related NET rate data will also be deleted.'`],
    [`>Mùa (Seasons)</h3>`, `>Seasons</h3>`],
    [`Tạo `, `Create `],
    [`>Lỗi:</span>`, `>Error:</span>`],
    [`Chưa có season. Bấm nút trên để tạo.`, `No seasons yet. Click buttons above to create.`],
    [` khoảng</span>`, ` ranges</span>`],
    [`>Hệ số nhân (rack = base × hệ số):</span>`, `>Multiplier (rack = base × multiplier):</span>`],
    [`>Khoảng ngày:</span>`, `>Date Ranges:</span>`],
    [`> Thêm<`, `> Add<`],
    [`>Lưu<`, `>Save<`],

    // ═══ SeasonRateEditor.tsx ═══
    [`>✓ Đã lưu rates!</div>`, `>✓ Rates saved!</div>`],
    [`>Lưu NET rates<`, `>Save NET Rates<`],
];

// ── Run ──
let totalCount = 0;
for (const file of FILES) {
    const filePath = path.join(BASE, file);
    if (!fs.existsSync(filePath)) { console.log(`⚠️  ${file} not found`); continue; }
    let src = fs.readFileSync(filePath, 'utf8');
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
        console.log(`✅ ${file}: ${count} replacements`);
        totalCount += count;
    }
}
console.log(`\n🎯 Batch 2 Total: ${totalCount} replacements`);
