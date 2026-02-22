#!/usr/bin/env node
/**
 * Phase 02B: Replace remaining Vietnamese UI strings
 * Targets: PLGAdminDashboard, pricing-plans, BookingChecklist, OtbChart,
 *          DashboardToolbarCard, QuotaUsagePanel, TopAccountsTable, ScorecardInputModal,
 *          TierPaywall, invite/page, no-hotel-access/page, login, pricing/page,
 *          analytics/types, promo/promo
 */
const fs = require('fs');
const path = require('path');

const WEB = path.resolve(__dirname, '..');
let totalReplacements = 0;
let totalFiles = 0;

function replace(filePath, pairs) {
    const abs = path.resolve(WEB, filePath);
    if (!fs.existsSync(abs)) { console.warn(`⚠️  SKIP ${filePath} — not found`); return; }
    let src = fs.readFileSync(abs, 'utf8');
    let count = 0;
    for (const [find, rep] of pairs) {
        if (src.includes(find)) { src = src.split(find).join(rep); count++; }
    }
    if (count > 0) {
        fs.writeFileSync(abs, src, 'utf8');
        console.log(`✅ ${filePath} — ${count} replacements`);
        totalReplacements += count;
        totalFiles++;
    } else {
        console.log(`⏭️  ${filePath} — 0 replacements (already done or strings changed)`);
    }
}

// ─────────────────────────────────────────────────────────
// 1. PLGAdminDashboard.tsx
// ─────────────────────────────────────────────────────────
replace('components/admin/PLGAdminDashboard.tsx', [
    // Add useTranslations import
    ["import PricingTab from './PricingTab';", "import PricingTab from './PricingTab';\nimport { useTranslations } from 'next-intl';"],

    // ConfirmDialog
    ['>Hủy</button>', '>{t(\'cancel\')}</button>'],
    ['>Xác nhận</button>', '>{t(\'confirm\')}</button>'],

    // ResellersTab - add hook
    ['function ResellersTab() {\n    const [resellers', "function ResellersTab() {\n    const t = useTranslations('plgAdmin');\n    const [resellers"],
    ['function ResellersTab() {\r\n    const [resellers', "function ResellersTab() {\r\n    const t = useTranslations('plgAdmin');\r\n    const [resellers"],

    // ResellersTab strings
    ['message="Bạn có chắc muốn vô hiệu hóa reseller này? (Soft delete — có thể kích hoạt lại)"', "message={t('confirmDeactivateReseller')}"],
    ['label="Tổng"', "label={t('total')}"],
    ['> Thêm Reseller', "> {t('addReseller')}"],
    ['>Tên</label>', ">{t('name')}</label>"],
    ['>SĐT</label>', ">{t('phone')}</label>"],
    ['>Tạo</button>', ">{t('create')}</button>"],
    ['>Tên</th>', ">{t('name')}</th>"],
    ['>Thao tác</th>', ">{t('actions')}</th>"],
    ['>Chưa có reseller nào</td>', ">{t('noResellers')}</td>"],
    ['title="Lưu">', "title={t('save')}>"],
    ['> Lưu\r\n', "> {t('save')}\r\n"],
    ['> Lưu\n', "> {t('save')}\n"],
    ['title="Hủy">', "title={t('cancel')}>"],
    ['title="Sửa">', "title={t('edit')}>"],
    ['title="Xóa">', "title={t('delete')}>"],

    // PromosTab - add hook
    ['function PromosTab() {\n    const [promos', "function PromosTab() {\n    const t = useTranslations('plgAdmin');\n    const [promos"],
    ['function PromosTab() {\r\n    const [promos', "function PromosTab() {\r\n    const t = useTranslations('plgAdmin');\r\n    const [promos"],

    ['message="Bạn có chắc muốn vô hiệu hóa mã khuyến mãi này?"', "message={t('confirmDeactivatePromo')}"],
    ['label="Tổng mã"', "label={t('totalCodes')}"],
    ['> Tạo Mã', "> {t('createCode')}"],
    ['>Mã Code</label>', ">{t('codeLabel')}</label>"],
    ['>Loại</label>', ">{t('type')}</label>"],
    ['>Giảm %</label>', ">{t('discountPercent')}</label>"],
    ['>Mô tả</label>', ">{t('description')}</label>"],
    ['>Giới hạn sử dụng</label>', ">{t('usageLimit')}</label>"],
    ['>Hết hạn</label>', ">{t('expiresAt')}</label>"],
    ['>Tạo Mã</button>', ">{t('createCode')}</button>"],
    ['>Mã</th>', ">{t('code')}</th>"],
    ['>Loại</th>', ">{t('type')}</th>"],
    ['>Giảm</th>', ">{t('discount')}</th>"],
    ['>Đã dùng</th>', ">{t('used')}</th>"],
    ['>Hết hạn</th>', ">{t('expiresAt')}</th>"],
    ['>Chưa có mã nào</td>', ">{t('noCodes')}</td>"],
    ['title="Vô hiệu hóa">', "title={t('deactivate')}>"],

    // CommissionsTab - add hook
    ['function CommissionsTab() {\n    const [commissions', "function CommissionsTab() {\n    const t = useTranslations('plgAdmin');\n    const [commissions"],
    ['function CommissionsTab() {\r\n    const [commissions', "function CommissionsTab() {\r\n    const t = useTranslations('plgAdmin');\r\n    const [commissions"],

    ['label="Tổng giao dịch"', "label={t('totalTransactions')}"],
    ['>Tỉ lệ</th>', ">{t('rate')}</th>"],
    ['>Số tiền</th>', ">{t('amount')}</th>"],
    ['>Ngày</th>', ">{t('date')}</th>"],
    ['>Chưa có giao dịch hoa hồng nào</td>', ">{t('noCommissions')}</td>"],

    // GuideTab - add hook
    ['function GuideTab() {\n    return', "function GuideTab() {\n    const t = useTranslations('plgAdmin');\n    return"],
    ['function GuideTab() {\r\n    return', "function GuideTab() {\r\n    const t = useTranslations('plgAdmin');\r\n    return"],

    // GuideTab section titles and content
    ['📖 Hướng dẫn sử dụng PLG Admin', "{t('guideTitle')}"],
    ['PLG (Product-Led Growth) là hệ thống quản lý đại lý (Resellers), mã khuyến mãi (Promo Codes),\n                     và hoa hồng (Commissions). Dưới đây là hướng dẫn chi tiết từng bước.', "{t('guideDescription')}"],
    ['PLG (Product-Led Growth) là hệ thống quản lý đại lý (Resellers), mã khuyến mãi (Promo Codes),\r\n                     và hoa hồng (Commissions). Dưới đây là hướng dẫn chi tiết từng bước.', "{t('guideDescription')}"],

    ['title="1. Quản lý Resellers (Đại Lý)"', "title={t('guideResellersTitle')}"],
    ['title="2. Quản lý Promo Codes (Mã Khuyến Mãi)"', "title={t('guidePromosTitle')}"],
    ['title="3. Hoa hồng (Commissions)"', "title={t('guideCommissionsTitle')}"],
    ['title="4. Quy trình hoàn chỉnh (Full PLG Flow)"', "title={t('guideFlowTitle')}"],
    ['title="5. Lưu ý quan trọng"', "title={t('guideNotesTitle')}"],

    // Tab labels
    ["{ key: 'guide', label: 'Hướng dẫn', icon: BookOpen },", "{ key: 'guide', label: 'Guide', icon: BookOpen },"],

    // Main Dashboard
    ['Quản lý Resellers, Mã khuyến mãi, và Hoa hồng', "{t('subtitle')}"],
]);

// ─────────────────────────────────────────────────────────
// 2. pricing-plans/page.tsx
// ─────────────────────────────────────────────────────────
replace('app/pricing-plans/page.tsx', [
    // Add useTranslations import
    ["import { PaymentMethodModal } from '@/components/payments/PaymentMethodModal';", "import { PaymentMethodModal } from '@/components/payments/PaymentMethodModal';\nimport { useTranslations } from 'next-intl';"],

    // Add hook in main component
    ['export default function PricingPlansPage() {\n    const { data: session', "export default function PricingPlansPage() {\n    const t = useTranslations('pricingPlans');\n    const { data: session"],
    ['export default function PricingPlansPage() {\r\n    const { data: session', "export default function PricingPlansPage() {\r\n    const t = useTranslations('pricingPlans');\r\n    const { data: session"],

    // Room bands
    ["{ id: 'R30', label: '≤ 30 phòng', max: 30 },", "{ id: 'R30', label: t('band.r30'), max: 30 },"],
    ["{ id: 'R80', label: '31 - 80 phòng', max: 80 },", "{ id: 'R80', label: t('band.r80'), max: 80 },"],
    ["{ id: 'R150', label: '81 - 150 phòng', max: 150 },", "{ id: 'R150', label: t('band.r150'), max: 150 },"],
    ["{ id: 'R300P', label: '151 - 300+ phòng', max: 300 },", "{ id: 'R300P', label: t('band.r300p'), max: 300 },"],

    // Tier names & descriptions
    ["name: 'Tiêu chuẩn',", "name: t('tier.standard.name'),"],
    ["description: 'Tính giá OTA nhanh chóng',", "description: t('tier.standard.desc'),"],
    ["description: 'Tối ưu Ranking OTA',", "description: t('tier.superior.desc'),"],
    ["description: 'Analytics & Dữ liệu',", "description: t('tier.deluxe.desc'),"],
    ["description: 'Enterprise & Chuỗi',", "description: t('tier.suite.desc'),"],

    // Features
    ["{ text: 'Tính giá NET → BAR', included: true },", "{ text: t('feat.netToBar'), included: true },"],
    ["{ text: '5 kênh OTA cơ bản', included: true },", "{ text: t('feat.otaChannels'), included: true },"],
    ["{ text: '1 người dùng', included: true },", "{ text: t('feat.singleUser'), included: true },"],
    ["{ text: 'Tối ưu OTA (Demo)', included: true, hint: 'Xem giao diện demo, không nhập dữ liệu thật' },", "{ text: t('feat.otaOptDemo'), included: true, hint: t('feat.otaOptDemoHint') },"],
    ["{ text: 'Dashboard & Analytics', included: false },", "{ text: t('feat.dashAnalytics'), included: false },"],
    ["{ text: 'Quản lý nhiều KS', included: false },", "{ text: t('feat.multiHotel'), included: false },"],
    ["cta: 'Dùng miễn phí',", "cta: t('cta.free'),"],

    ["{ text: 'Tất cả tính năng Free', included: true },", "{ text: t('feat.allFree'), included: true },"],
    ["{ text: 'Full Tối ưu OTA (6 tools)', included: true, hint: 'Scorecard, Checklist, ROI, Review Simulator...' },", "{ text: t('feat.fullOta'), included: true, hint: t('feat.fullOtaHint') },"],
    ["{ text: 'Khuyến mãi Stacking', included: true },", "{ text: t('feat.promoStack'), included: true },"],
    ["{ text: 'Export Price Matrix', included: true },", "{ text: t('feat.exportMatrix'), included: true },"],
    ["{ text: '3 người dùng', included: true },", "{ text: t('feat.threeUsers'), included: true },"],
    ["cta: 'Liên hệ Ngay',", "cta: t('cta.contactNow'),"],
    ["badge: 'BÁN CHẠY',", "badge: t('badge.bestSeller'),"],

    ["{ text: 'Tất cả tính năng Superior', included: true },", "{ text: t('feat.allSuperior'), included: true },"],
    ["{ text: 'Dashboard & KPI', included: true },", "{ text: t('feat.dashKpi'), included: true },"],
    ["{ text: 'Upload dữ liệu (CSV)', included: true },", "{ text: t('feat.uploadCsv'), included: true },"],
    ["{ text: '10 người dùng', included: true },", "{ text: t('feat.tenUsers'), included: true },"],
    ["cta: 'Liên hệ Zalo',", "cta: t('cta.contactZalo'),"],

    ["{ text: 'Tất cả tính năng Deluxe', included: true },", "{ text: t('feat.allDeluxe'), included: true },"],
    ["{ text: 'Quản lý nhiều khách sạn', included: true },", "{ text: t('feat.multiHotels'), included: true },"],
    ["{ text: 'Không giới hạn Users', included: true },", "{ text: t('feat.unlimitedUsers'), included: true },"],
    ["{ text: 'Phân quyền (RBAC)', included: true },", "{ text: t('feat.rbac'), included: true },"],
    ["{ text: 'Hỗ trợ 1-1 ưu tiên', included: true },", "{ text: t('feat.prioritySupport'), included: true },"],
    ["{ text: 'Setup tận nơi', included: true },", "{ text: t('feat.onsiteSetup'), included: true },"],

    // Header section
    ['Bảng giá linh hoạt cho mọi quy mô', "{t('title')}"],
    ["Chọn gói phù hợp với số lượng phòng của bạn.", "{t('subtitle')}"],
    ['>Tiết kiệm 50%</span> khi thanh toán 3 tháng ngay hôm nay!', ">{t('save50')}</span> {t('subtitle2')}"],
    ['Khách sạn của bạn có:', "{t('yourHotelHas')}"],
    ['Chu kỳ thanh toán', "{t('billingCycle')}"],
    ['>Tháng</button>', ">{t('monthly')}</button>"],
    ['>3 Tháng', ">{t('quarterly')}"],
    ["'🔥 Khuyên dùng: Giảm giá 50% giai đoạn ra mắt!'", "t('quarterlyRec')"],
    ["'Thanh toán linh hoạt từng tháng.'", "t('monthlyNote')"],

    // Badges & CTA
    ["> GÓI HIỆN TẠI", "> {t('currentPlan')}"],
    ["isCurrentTier ? '✓ Gói hiện tại' : `Nâng cấp ${tier.name}`", "isCurrentTier ? t('currentPlanBtn') : t('upgradeTo', { name: tier.name })"],
    ["/tháng</span>", "/{t('month')}</span>"],
    ["/tháng", "/{t('month')}"],

    // Trust section
    ['>Setup trong 5 phút</h4>', ">{t('trust.setup')}</h4>"],
    ['>Không cần cài đặt phức tạp. Đăng nhập và bắt đầu sử dụng ngay lập tức.</p>', ">{t('trust.setupDesc')}</p>"],
    ['>Hỗ trợ 24/7</h4>', ">{t('trust.support')}</h4>"],
    ['>Đội ngũ hỗ trợ qua Zalo luôn sẵn sàng giải đáp mọi thắc mắc của bạn.</p>', ">{t('trust.supportDesc')}</p>"],
    ['>Hoàn tiền 30 ngày</h4>', ">{t('trust.refund')}</h4>"],
    ['>Nếu bạn không hài lòng, chúng tôi hoàn tiền 100% trong 30 ngày đầu.</p>', ">{t('trust.refundDesc')}</p>"],

    // Footer
    ['Liên hệ Zalo: ', "{t('contactZalo')}: "],
    ['>Đăng nhập</Link>', ">{t('login')}</Link>"],
]);

// ─────────────────────────────────────────────────────────
// 3. Other remaining files (smaller)
// ─────────────────────────────────────────────────────────

// OtbChart.tsx
replace('components/dashboard/OtbChart.tsx', [
    // Will scan for specifics after running
]);

// invite/page.tsx
replace('app/invite/page.tsx', [
    // Needs specific string scan
]);

// no-hotel-access/page.tsx
replace('app/no-hotel-access/page.tsx', [
    // Needs specific string scan
]);

console.log(`\n${'═'.repeat(50)}`);
console.log(`🎉 Total: ${totalReplacements} replacements in ${totalFiles} files`);
console.log(`${'═'.repeat(50)}\n`);
