#!/usr/bin/env node
/**
 * Fix PLGAdminDashboard.tsx for i18n:
 * 1. Add useTranslations import
 * 2. Add useTranslations hooks to ConfirmDialog and PLGAdminDashboard
 * 3. Replace Vietnamese strings with t() calls (inside components that have hooks)
 */
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'components', 'admin', 'PLGAdminDashboard.tsx');
let src = fs.readFileSync(FILE, 'utf8');
let count = 0;

function rep(find, replace) {
    if (src.includes(find)) {
        src = src.split(find).join(replace);
        count++;
    } else {
        console.warn(`  ⚠️ NOT FOUND: ${find.substring(0, 60)}...`);
    }
}

// 1. Add useTranslations import (after PricingTab import)
rep(
    "import PricingTab from './PricingTab';",
    "import PricingTab from './PricingTab';\nimport { useTranslations } from 'next-intl';"
);

// 2. Add useTranslations hook in ConfirmDialog
rep(
    `function ConfirmDialog({ message, onConfirm, onCancel }: {
    message: string; onConfirm: () => void; onCancel: () => void;
}) {
    return (`,
    `function ConfirmDialog({ message, onConfirm, onCancel }: {
    message: string; onConfirm: () => void; onCancel: () => void;
}) {
    const t = useTranslations('plgAdmin');
    return (`
);

// 3. ConfirmDialog buttons
rep('>Hủy</button>', '>{t(\'cancel\')}</button>');
rep('>Xác nhận</button>', '>{t(\'confirm\')}</button>');

// 4. Add useTranslations hook in ResellersTab
rep(
    `function ResellersTab() {
    const [resellers`,
    `function ResellersTab() {
    const t = useTranslations('plgAdmin');
    const [resellers`
);

// 5. ResellersTab strings
rep('message="Bạn có chắc muốn vô hiệu hóa reseller này? (Soft delete — có thể kích hoạt lại)"', "message={t('confirmDeactivateReseller')}");
rep('label="Tổng"', "label={t('total')}");
rep('> Thêm Reseller', "> {t('addReseller')}");
rep('>Tên</label>', ">{t('name')}</label>");
rep('>SĐT</label>', ">{t('phone')}</label>");
rep('>Tạo</button>', ">{t('create')}</button>");
rep('>Tên</th>', ">{t('name')}</th>");
rep('>Thao tác</th>', ">{t('actions')}</th>");
rep('>Chưa có reseller nào</td>', ">{t('noResellers')}</td>");
rep('title="Lưu">', "title={t('save')}>");
rep('title="Hủy">', "title={t('cancel')}>");
rep('title="Sửa">', "title={t('edit')}>");
rep('title="Xóa">', "title={t('delete')}>");

// Fix the " Lưu\n" buttons (there might be two patterns)  
rep('> Lưu\n', "> {t('save')}\n");
rep('> Lưu\r\n', "> {t('save')}\r\n");

// 6. Add useTranslations hook in PromosTab
rep(
    `function PromosTab() {
    const [promos`,
    `function PromosTab() {
    const t = useTranslations('plgAdmin');
    const [promos`
);

// 7. PromosTab strings
rep('message="Bạn có chắc muốn vô hiệu hóa mã khuyến mãi này?"', "message={t('confirmDeactivatePromo')}");
rep('label="Tổng mã"', "label={t('totalCodes')}");
rep('> Tạo Mã', "> {t('createCode')}");
rep('>Mã Code</label>', ">{t('codeLabel')}</label>");
rep('>Loại</label>', ">{t('type')}</label>");
rep('>Giảm %</label>', ">{t('discountPercent')}</label>");
rep('>Mô tả</label>', ">{t('description')}</label>");
rep('>Giới hạn sử dụng</label>', ">{t('usageLimit')}</label>");
rep('>Hết hạn</label>', ">{t('expiresAt')}</label>");
rep('>Tạo Mã</button>', ">{t('createCode')}</button>");
rep('>Mã</th>', ">{t('code')}</th>");
rep('>Loại</th>', ">{t('type')}</th>");
rep('>Giảm</th>', ">{t('discount')}</th>");
rep('>Đã dùng</th>', ">{t('used')}</th>");
rep('>Hết hạn</th>', ">{t('expiresAt')}</th>");
rep('>Chưa có mã nào</td>', ">{t('noCodes')}</td>");
rep('title="Vô hiệu hóa">', "title={t('deactivate')}>");

// 8. Add useTranslations hook in CommissionsTab
rep(
    `function CommissionsTab() {
    const [commissions`,
    `function CommissionsTab() {
    const t = useTranslations('plgAdmin');
    const [commissions`
);

// 9. CommissionsTab strings
rep('label="Tổng giao dịch"', "label={t('totalTransactions')}");
rep('>Tỉ lệ</th>', ">{t('rate')}</th>");
rep('>Số tiền</th>', ">{t('amount')}</th>");
rep('>Ngày</th>', ">{t('date')}</th>");
rep('>Chưa có giao dịch hoa hồng nào</td>', ">{t('noCommissions')}</td>");

// 10. Add useTranslations hook in GuideTab
rep(
    `function GuideTab() {
    return (`,
    `function GuideTab() {
    const t = useTranslations('plgAdmin');
    return (`
);

// 11. GuideTab section titles
rep('📖 Hướng dẫn sử dụng PLG Admin', "{t('guideTitle')}");
rep('title="1. Quản lý Resellers (Đại Lý)"', "title={t('guideResellersTitle')}");
rep('title="2. Quản lý Promo Codes (Mã Khuyến Mãi)"', "title={t('guidePromosTitle')}");
rep('title="3. Hoa hồng (Commissions)"', "title={t('guideCommissionsTitle')}");
rep('title="4. Quy trình hoàn chỉnh (Full PLG Flow)"', "title={t('guideFlowTitle')}");
rep('title="5. Lưu ý quan trọng"', "title={t('guideNotesTitle')}");

// 12. Tab labels (already English, no VN replacement needed)
// But update Guide label if in Vietnamese
rep("{ key: 'guide', label: 'Hướng dẫn', icon: BookOpen },", "{ key: 'guide', label: 'Guide', icon: BookOpen },");

// 13. Add useTranslations hook in PLGAdminDashboard main component
rep(
    `export default function PLGAdminDashboard() {
    const [activeTab, setActiveTab]`,
    `export default function PLGAdminDashboard() {
    const t = useTranslations('plgAdmin');
    const [activeTab, setActiveTab]`
);

// 14. Main component subtitle
rep('Quản lý Resellers, Mã khuyến mãi, và Hoa hồng', "{t('subtitle')}");

fs.writeFileSync(FILE, src, 'utf8');
console.log(`\n✅ PLGAdminDashboard.tsx — ${count} replacements applied`);
