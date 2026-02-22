/**
 * i18n Patch: Pricing Components
 * Adds/merges translation keys for:
 *  - seasonConfigPanel (SeasonConfigPanel.tsx)
 *  - occTierEditor (OccTierEditor.tsx)
 *  - overviewTab (OverviewTab.tsx) — MERGE with existing
 *  - otaConfigTab (OTAConfigTab.tsx)
 *  - seasonRateEditor (SeasonRateEditor.tsx)
 *  - dynamicTab (DynamicPricingTab.tsx) — MERGE with existing
 */

const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '..', 'messages');
const LOCALES = ['en', 'vi', 'id', 'ms', 'th'];

// ── New keys per namespace ──────────────────────────────────────────

const KEYS = {
    seasonConfigPanel: {
        en: {
            title: "Seasons",
            createTooltip: "Create {name}",
            errorLabel: "Error:",
            noSeasons: "No seasons yet. Click buttons above to create.",
            multiplierLabel: "Multiplier (rack = base × multiplier):",
            dateRanges: "Date Ranges:",
            addDateRange: "Add",
            save: "Save",
            ranges: "{count} ranges",
            confirmDelete: "Delete this season? Related NET rate data will also be deleted.",
            createFailed: "Create failed",
            updateFailed: "Update failed",
            deleteFailed: "Delete failed",
        },
        vi: {
            title: "Mùa vụ",
            createTooltip: "Tạo {name}",
            errorLabel: "Lỗi:",
            noSeasons: "Chưa có mùa vụ. Nhấn nút phía trên để tạo.",
            multiplierLabel: "Hệ số nhân (giá rack = giá cơ sở × hệ số):",
            dateRanges: "Khoảng ngày:",
            addDateRange: "Thêm",
            save: "Lưu",
            ranges: "{count} khoảng ngày",
            confirmDelete: "Xoá mùa vụ này? Dữ liệu giá NET liên quan cũng sẽ bị xoá.",
            createFailed: "Tạo thất bại",
            updateFailed: "Cập nhật thất bại",
            deleteFailed: "Xoá thất bại",
        },
    },

    occTierEditor: {
        en: {
            title: "Occupancy Tiers (OCC Tiers)",
            unsaved: "Unsaved",
            addTier: "Add Tier",
            deleteLast: "Delete Last Tier",
            from: "From",
            to: "To",
            type: "Type",
            adjustment: "Adjustment",
            useMultiplierTooltip: "Using multiplier (×). Click to switch to amount (₫)",
            useAmountTooltip: "Using amount (₫). Click to switch to multiplier (×)",
            errMinGteMax: "min ≥ max",
            errMultiplierRange: "Multiplier outside 0.5–3.0",
            errNotContinuous: "not continuous — previous tier ends at {pct}%",
            errMustStartZero: "must start at 0%",
            errMustEndHundred: "must end at 100%",
            errNeedThreeTiers: "Need at least 3 tiers",
            errMaxSixTiers: "Maximum 6 tiers",
            errTierMinGteMax: "Tier {idx}: min ≥ max",
            errTierMultiplier: "Tier {idx}: multiplier outside 0.5–3.0",
            errTierNotContinuous: "Tier {idx}: not continuous with tier {prevIdx}",
            errFirstTierStart: "First tier must start at 0%",
            errLastTierEnd: "Last tier must end at 100%",
            savedSuccess: "Saved successfully!",
            saveButton: "Save OCC Tiers",
            saved: "Saved",
            saveFailed: "Save failed",
        },
        vi: {
            title: "Mức công suất (OCC Tiers)",
            unsaved: "Chưa lưu",
            addTier: "Thêm mức",
            deleteLast: "Xoá mức cuối",
            from: "Từ",
            to: "Đến",
            type: "Loại",
            adjustment: "Điều chỉnh",
            useMultiplierTooltip: "Đang dùng hệ số (×). Nhấn để chuyển sang số tiền (₫)",
            useAmountTooltip: "Đang dùng số tiền (₫). Nhấn để chuyển sang hệ số (×)",
            errMinGteMax: "min ≥ max",
            errMultiplierRange: "Hệ số ngoài khoảng 0.5–3.0",
            errNotContinuous: "không liên tục — mức trước kết thúc tại {pct}%",
            errMustStartZero: "phải bắt đầu từ 0%",
            errMustEndHundred: "phải kết thúc tại 100%",
            errNeedThreeTiers: "Cần ít nhất 3 mức",
            errMaxSixTiers: "Tối đa 6 mức",
            errTierMinGteMax: "Mức {idx}: min ≥ max",
            errTierMultiplier: "Mức {idx}: hệ số ngoài khoảng 0.5–3.0",
            errTierNotContinuous: "Mức {idx}: không liên tục với mức {prevIdx}",
            errFirstTierStart: "Mức đầu phải bắt đầu từ 0%",
            errLastTierEnd: "Mức cuối phải kết thúc tại 100%",
            savedSuccess: "Lưu thành công!",
            saveButton: "Lưu OCC Tiers",
            saved: "Đã lưu",
            saveFailed: "Lưu thất bại",
        },
    },

    seasonRateEditor: {
        en: {
            netRatesFor: "NET rates for {seasonName}:",
            ratesSaved: "Rates saved!",
            saveNetRates: "Save NET rates",
            failedToSaveRates: "Failed to save rates",
            saveFailed: "Save failed",
        },
        vi: {
            netRatesFor: "Giá NET cho {seasonName}:",
            ratesSaved: "Đã lưu giá!",
            saveNetRates: "Lưu giá NET",
            failedToSaveRates: "Lưu giá thất bại",
            saveFailed: "Lưu thất bại",
        },
    },

    otaConfigTab: {
        en: {
            title: "OTA Channels",
            addChannel: "Add OTA Channel",
            editChannel: "Edit OTA Channel",
            channelName: "Channel Name *",
            channelCode: "Channel Code *",
            commission: "Commission (%) *",
            calcMode: "Calculation Mode",
            progressive: "Progressive — Progressive",
            additive: "Additive — Additive",
            active: "Active",
            cancel: "Cancel",
            update: "Update",
            add: "Add",
            noChannels: "No OTA channels yet. Click \"Add OTA Channel\" to get started.",
            thOtaChannel: "OTA Channel",
            thCode: "Code",
            thCommission: "Commission",
            thCalcMode: "Calc Mode",
            thStatus: "Status",
            thActions: "Actions",
            confirmDelete: "Confirm delete this OTA channel?",
            progressiveLabel: "Progressive",
            additiveLabel: "Additive",
        },
        vi: {
            title: "Kênh OTA",
            addChannel: "Thêm kênh OTA",
            editChannel: "Sửa kênh OTA",
            channelName: "Tên kênh *",
            channelCode: "Mã kênh *",
            commission: "Hoa hồng (%) *",
            calcMode: "Chế độ tính",
            progressive: "Progressive — Nhân lũy tiến",
            additive: "Additive — Cộng dồn",
            active: "Hoạt động",
            cancel: "Huỷ",
            update: "Cập nhật",
            add: "Thêm",
            noChannels: "Chưa có kênh OTA. Nhấn \"Thêm kênh OTA\" để bắt đầu.",
            thOtaChannel: "Kênh OTA",
            thCode: "Mã",
            thCommission: "Hoa hồng",
            thCalcMode: "Chế độ tính",
            thStatus: "Trạng thái",
            thActions: "Thao tác",
            confirmDelete: "Xác nhận xoá kênh OTA này?",
            progressiveLabel: "Progressive",
            additiveLabel: "Additive",
        },
    },
};

// Keys to MERGE into existing overviewTab namespace
const OVERVIEW_TAB_MERGE = {
    en: {
        calculating: "Calculating...",
        eachCellShows: "Each cell shows:",
        guestPriceDisplay: "Guest Price (Display)",
        netRevenueLabel: "Net Revenue",
        barPriceInput: "BAR Price (input CM)",
        retentionRate: "Retention rate:",
        retHigh: ">75%",
        retMid: "50–75%",
        retLow: "<50%",
        enterDisplayPrice: "Enter display price",
        baseNetPrice: "Base Net price",
        noPriceSet: "No price set",
        guestSees: "Guest Sees",
        revenue: "Revenue",
        noDetails: "No details",
        tooltipBar: "BAR:",
        tooltipDisplay: "Display:",
        tooltipRevenue: "Revenue:",
        tooltipKm: "KM:",
        demoExportPdf: "This feature is not available for Demo Hotel",
        exportPdf: "Export PDF",
        demoExportCsv: "This feature is not available for Demo Hotel",
        exportCsv: "Export CSV",
    },
    vi: {
        calculating: "Đang tính...",
        eachCellShows: "Mỗi ô hiển thị:",
        guestPriceDisplay: "Giá khách (Hiển thị)",
        netRevenueLabel: "Doanh thu thuần",
        barPriceInput: "Giá BAR (nhập CM)",
        retentionRate: "Tỷ lệ giữ lại:",
        retHigh: ">75%",
        retMid: "50–75%",
        retLow: "<50%",
        enterDisplayPrice: "Nhập giá hiển thị",
        baseNetPrice: "Giá NET cơ sở",
        noPriceSet: "Chưa đặt giá",
        guestSees: "Khách thấy",
        revenue: "Doanh thu",
        noDetails: "Không có chi tiết",
        tooltipBar: "BAR:",
        tooltipDisplay: "Hiển thị:",
        tooltipRevenue: "Doanh thu:",
        tooltipKm: "KM:",
        demoExportPdf: "Tính năng không khả dụng cho khách sạn Demo",
        exportPdf: "Xuất PDF",
        demoExportCsv: "Tính năng không khả dụng cho khách sạn Demo",
        exportCsv: "Xuất CSV",
    },
};

// Keys to MERGE into existing dynamicTab namespace
const DYNAMIC_TAB_MERGE = {
    en: {
        drilldownTier: "Tier:",
        netBaseSeason: "NET base ({season})",
        addFixed: "+ Add (Fixed) (+{amount})",
        xMultiplier: "× Multiplier (×{value})",
        barChannel: "BAR ({channel} {pct}%)",
        displayKm: "Display (KM -{pct}%)",
        guardrailMin: "Min:",
        guardrailMax: "Max:",
        guardrailOk: "OK",
        guardrailMinMax: "min {min} / max {max}",
        adjustmentFixed: "Adjustment: +{amount}",
        adjustmentMultiplier: "Multiplier: ×{value}",
        adjustmentUnchanged: "(unchanged)",
        averageDiscount: "Average: {pct}%",
        demoExport: "This feature is not available for Demo Hotel",
        exportCsvTitle: "Export CSV",
    },
    vi: {
        drilldownTier: "Mức:",
        netBaseSeason: "NET cơ sở ({season})",
        addFixed: "+ Cộng thêm (Cố định) (+{amount})",
        xMultiplier: "× Hệ số (×{value})",
        barChannel: "BAR ({channel} {pct}%)",
        displayKm: "Hiển thị (KM -{pct}%)",
        guardrailMin: "Tối thiểu:",
        guardrailMax: "Tối đa:",
        guardrailOk: "OK",
        guardrailMinMax: "tối thiểu {min} / tối đa {max}",
        adjustmentFixed: "Điều chỉnh: +{amount}",
        adjustmentMultiplier: "Hệ số: ×{value}",
        adjustmentUnchanged: "(không đổi)",
        averageDiscount: "Trung bình: {pct}%",
        demoExport: "Tính năng không khả dụng cho khách sạn Demo",
        exportCsvTitle: "Xuất CSV",
    },
};

// ── Main logic ──────────────────────────────────────────────────────

function patchLocale(locale) {
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    let addedCount = 0;

    // 1) Add new namespaces
    for (const [ns, locales] of Object.entries(KEYS)) {
        const keys = locales[locale] || locales['en'];
        if (!data[ns]) {
            data[ns] = {};
        }
        for (const [key, value] of Object.entries(keys)) {
            if (!data[ns][key]) {
                data[ns][key] = value;
                addedCount++;
            }
        }
    }

    // 2) Merge into existing overviewTab
    const ovKeys = OVERVIEW_TAB_MERGE[locale] || OVERVIEW_TAB_MERGE['en'];
    if (!data.overviewTab) data.overviewTab = {};
    for (const [key, value] of Object.entries(ovKeys)) {
        if (!data.overviewTab[key]) {
            data.overviewTab[key] = value;
            addedCount++;
        }
    }

    // 3) Merge into existing dynamicTab
    const dyKeys = DYNAMIC_TAB_MERGE[locale] || DYNAMIC_TAB_MERGE['en'];
    if (!data.dynamicTab) data.dynamicTab = {};
    for (const [key, value] of Object.entries(dyKeys)) {
        if (!data.dynamicTab[key]) {
            data.dynamicTab[key] = value;
            addedCount++;
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`  ${locale}.json → +${addedCount} keys`);
}

console.log('Patching pricing component i18n keys...\n');
for (const locale of LOCALES) {
    patchLocale(locale);
}
console.log('\nDone! Run `npx tsc --noEmit` to verify.');
