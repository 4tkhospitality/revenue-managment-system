/**
 * i18n Patch Script — Add missing analytics keys + vi translations for pricing namespaces
 * Run: node scripts/i18n-patch-pricing.js
 */
const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '..', 'messages');
const LANGS = ['en', 'vi', 'id', 'ms', 'th'];

// Missing analytics keys for LeadTimeBuckets
const ANALYTICS_PATCH = {
    en: { missingBookTime: "No booking time data available. Upload data with booking timestamps." },
    vi: { missingBookTime: "Không có dữ liệu thời gian đặt. Tải lên dữ liệu có mốc thời gian đặt phòng." },
    id: { missingBookTime: "Tidak ada data waktu pemesanan. Unggah data dengan cap waktu pemesanan." },
    ms: { missingBookTime: "Tiada data masa tempahan. Muat naik data dengan cap masa tempahan." },
    th: { missingBookTime: "ไม่มีข้อมูลเวลาจอง อัปโหลดข้อมูลพร้อมเวลาจอง" },
};

// Vietnamese translations for setupTab
const SETUP_TAB_VI = {
    title: "Cài đặt Giá",
    roomTypesTitle: "Loại Phòng",
    roomTypesDesc: "Cấu hình loại phòng và giá NET (giá gốc).",
    addRoomType: "Thêm Loại Phòng",
    editRoomType: "Sửa Loại Phòng",
    roomName: "Tên phòng",
    netPrice: "Giá NET (VND)",
    description: "Mô tả (tùy chọn)",
    save: "Lưu",
    saving: "Đang lưu...",
    cancel: "Hủy",
    delete: "Xóa",
    edit: "Sửa",
    noRoomTypes: "Chưa cấu hình loại phòng nào.",
    otaChannelsTitle: "Kênh OTA",
    otaChannelsDesc: "Cấu hình kênh phân phối và hoa hồng.",
    addChannel: "Thêm Kênh",
    editChannel: "Sửa Kênh",
    channelName: "Tên Kênh",
    channelCode: "Mã Kênh",
    commission: "Hoa hồng %",
    calcType: "Phương thức tính",
    progressive: "Lũy tiến",
    additive: "Cộng dồn",
    singleDiscount: "Giảm giá đơn",
    active: "Đang hoạt động",
    inactive: "Tạm ngưng",
    noChannels: "Chưa cấu hình kênh nào.",
    demoWarning: "Chế độ Demo — Thay đổi sẽ không được lưu.",
};

// Vietnamese translations for overviewTab
const OVERVIEW_TAB_VI = {
    title: "Ma trận Giá Tổng quan",
    subtitle: "Tất cả giá được tính tự động từ cài đặt.",
    loading: "Đang tải ma trận giá...",
    noSetup: "Vui lòng cấu hình loại phòng và kênh OTA trước.",
    goToSetup: "Đến tab Cài đặt",
    viewMode: "Chế độ xem:",
    netRevenue: "Doanh thu",
    barPrice: "Giá BAR",
    displayPrice: "Giá hiển thị",
    calculate: "Tính lại",
    exportCsv: "Xuất CSV",
    exportPdf: "Xuất PDF",
    thRoomType: "Loại Phòng",
    retention: "Tỷ lệ giữ lại",
    retentionGood: "Tốt",
    retentionLow: "Thấp",
    retentionCritical: "Nghiêm trọng",
    customPrice: "Giá tùy chỉnh",
    clickToTrace: "Di chuột xem chi tiết tính giá",
};

// Vietnamese translations for dynamicTab
const DYNAMIC_TAB_VI = {
    title: "Ma trận Giá Động",
    subtitle: "Giá tự động điều chỉnh theo tầng công suất.",
    loading: "Đang tải ma trận giá động...",
    noSetup: "Cấu hình loại phòng và kênh OTA trước.",
    viewMode: "Xem:",
    netView: "Doanh thu",
    barView: "BAR",
    displayView: "Hiển thị",
    exportCsv: "Xuất CSV",
    configTiers: "Cấu hình Tầng",
    thRoomType: "Loại Phòng",
    currentOcc: "Công suất hiện tại",
    activeTier: "Tầng đang áp dụng",
    violation: "Vi phạm",
    noData: "Không có dữ liệu",
    seasonLabel: "Mùa:",
    allSeasons: "Tất cả Mùa",
    guardrails: "Rào chắn giá",
};

// Vietnamese translations for promotionsTab
const PROMOTIONS_TAB_VI = {
    title: "Khuyến mãi & Giảm giá",
    selectChannel: "Chọn kênh để quản lý khuyến mãi",
    noChannels: "Chưa cấu hình kênh OTA. Đến tab Cài đặt trước.",
    addPromotion: "Thêm Khuyến mãi",
    discount: "Giảm giá",
    active: "Hoạt động",
    inactive: "Tạm ngưng",
    delete: "Xóa",
    stackable: "Có thể xếp chồng",
    noPromotions: "Chưa có khuyến mãi trong nhóm này. Nhấn để thêm.",
    clickToAdd: "Nhấn để thêm",
    totalDiscount: "Tổng Giảm giá",
    barPrice: "Giá BAR (Channel Manager)",
    displayPrice: "Giá KH nhìn thấy",
    netRevenue: "Doanh thu thực nhận",
    priceCalculator: "Máy tính Giá",
    pricingExplanation: "Giải thích Giá",
    step: "Bước",
    marketingPrograms: "Chương trình Marketing",
    seasonal: "Theo mùa",
    essential: "Thiết yếu",
    targeted: "Nhắm mục tiêu",
    genius: "Genius",
    portfolio: "Portfolio",
    campaign: "Chiến dịch",
};

function patchLang(lang) {
    const filePath = path.join(MESSAGES_DIR, `${lang}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // 1. Patch analytics namespace with missing keys
    if (data.analytics && ANALYTICS_PATCH[lang]) {
        Object.assign(data.analytics, ANALYTICS_PATCH[lang]);
    }

    // 2. Patch VI translations for pricing namespaces
    if (lang === 'vi') {
        if (data.setupTab) Object.assign(data.setupTab, SETUP_TAB_VI);
        if (data.overviewTab) Object.assign(data.overviewTab, OVERVIEW_TAB_VI);
        if (data.dynamicTab) Object.assign(data.dynamicTab, DYNAMIC_TAB_VI);
        if (data.promotionsTab) Object.assign(data.promotionsTab, PROMOTIONS_TAB_VI);
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`✅ Patched ${lang}.json`);
}

LANGS.forEach(patchLang);
console.log('\n🎉 All language files patched successfully!');
