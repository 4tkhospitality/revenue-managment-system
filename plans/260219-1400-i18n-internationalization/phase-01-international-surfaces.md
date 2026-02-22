# Phase 01: International-ready Surfaces
Status: ⬜ Pending  
Dependencies: Phase 00 (Foundation)  
Effort: 5–7 ngày

## Objective

Extract hardcoded Vietnamese strings từ các surfaces GM/DOSM dùng hằng ngày: Sidebar/Nav, Dashboard, Pricing tab, Settings. Đây là "mặt ngoài" mà user quốc tế sẽ thấy đầu tiên.

## Requirements

### Functional
- [ ] Tất cả text trên Nav/Sidebar dùng `t()`
- [ ] Dashboard KPI cards, table headers, tooltips dùng `t()`
- [ ] Pricing tab (Quick + Detailed mode) dùng `t()`
- [ ] Auth pages (login, blocked, welcome) dùng `t()`
- [ ] Settings page labels dùng `t()`
- [ ] Language switcher visible in sidebar/header

### Non-Functional
- [ ] Không thay đổi UI layout — chỉ swap text
- [ ] RM acronyms giữ nguyên: OTB, STLY, Pace, Pickup, BAR, NET
- [ ] Missing key → fallback VI + log telemetry

## Implementation Steps

### Step 1: Nav & Sidebar

#### Target Files:
- `components/shared/Sidebar.tsx` (nếu có) hoặc layout component
- Navigation labels: "Tổng quan", "Phân tích", "Giá", "Dữ liệu", "Cài đặt"...

#### Message keys:
```json
{
  "nav": {
    "dashboard": "Dashboard / Tổng quan",
    "analytics": "Analytics / Phân tích",
    "pricing": "Pricing / Giá",
    "data": "Data / Dữ liệu",
    "settings": "Settings / Cài đặt",
    "guide": "Guide / Hướng dẫn",
    "rate_shopper": "Rate Shopper",
    "upload": "Upload / Tải lên"
  }
}
```

### Step 2: Auth Pages

#### Target Files:
- `app/auth/login/page.tsx`
- `app/blocked/page.tsx`
- `app/welcome/page.tsx`
- `app/no-hotel-access/page.tsx`
- `app/unauthorized/page.tsx`

### Step 3: Dashboard KPI Cards & Overview

#### Target Files:
- `app/dashboard/page.tsx` (expand from Phase 00 demo)
- `components/dashboard/` — 18 components

#### Priority components:
| Component | Key strings |
|-----------|------------|
| KPI cards | "Công suất", "ADR", "RevPAR", "Tổng doanh thu" |
| DashboardTabs | "Tổng quan", "Phân tích", "Giá" |
| QuickModePanel | Badge labels, action buttons |
| QuickModePricingWrapper | Mode toggle, accept buttons |
| RecommendationTable | Column headers, action labels |
| DatePickerSnapshot | Date labels, picker text |

### Step 4: Pricing Tab

#### Target Files:
- `components/pricing/` — 10 components
- `app/pricing/page.tsx`

#### Key strings:
- Column headers: "Ngày lưu trú", "Phòng OTB", "Còn lại", "Giá hiện tại", "Giá đề xuất"
- Action labels: "Chấp nhận", "Huỷ", "Ghi đè"
- Status badges: "Tăng giá", "Giảm giá", "Giữ giá", "Stop Sell"
- Tooltips: pricing reason explanations

### Step 5: Settings Pages

#### Target Files:
- `app/settings/` — 3 pages
- `components/settings/` — 4 components

### Step 6: OTA Calculator

#### Target Files:
- Components related to OTA pricing calculations
- Commission labels, platform names (giữ nguyên Booking.com, Agoda...)

### Step 7: Language Switcher Integration

#### Target:
- Add `LanguageSwitcher` component to sidebar or header
- Wire to `/api/user/locale` from Phase 00

### Step 8: Update Message Files

#### [MODIFY] `messages/en.json`
Add all keys from Steps 1-6.

#### [MODIFY] `messages/vi.json`
Mirror all keys with Vietnamese text.

### Step 9: Onboarding Locale Inheritance (GSA → Customer Org)

> **Rule:** Khi tạo customer org mới qua GSA, auto-inherit `default_locale` từ partner org của GSA.
> Chỉ set 1 lần lúc tạo org. Sau đó org admin đổi tự do (không sync ngược từ GSA).

#### [MODIFY] Onboarding service (nơi create Organization + assign `primary_reseller_id`)

```ts
// In onboarding service — when creating customer org:
async function createCustomerOrg(input: CreateOrgInput) {
  let inheritedLocale: string | null = null;

  if (input.primary_reseller_id) {
    const reseller = await prisma.reseller.findUnique({
      where: { id: input.primary_reseller_id },
      include: { organization: true },
    });

    if (reseller?.org_id && reseller.organization) {
      // Validate: partner org must be kind=PARTNER (OrgKind guardrail)
      if (reseller.organization.kind !== 'PARTNER') {
        throw new BadRequestError('Reseller org_id must point to PARTNER org');
      }
      inheritedLocale = reseller.organization.default_locale;
    }
  }

  const org = await prisma.organization.create({
    data: {
      ...input,
      kind: 'CUSTOMER',
      // Inherit only if customer didn't explicitly set
      default_locale: input.default_locale ?? inheritedLocale ?? 'vi',
    },
  });

  // Audit
  await auditLog({
    action: 'ORG_CREATED',
    entityId: org.id,
    metadata: {
      inherited_default_locale_from_reseller: !!inheritedLocale,
      primary_reseller_id: input.primary_reseller_id ?? null,
    },
  });

  return org;
}
```

#### Acceptance Tests

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| AT-P1-01 | Onboard qua GSA | `Reseller.type=GSA`, `partnerOrg.default_locale="en"` | Tạo customerOrg, `default_locale=null` | `customerOrg.default_locale == "en"` |
| AT-P1-02 | Individual reseller (no home org) | `Reseller.type=INDIVIDUAL`, `org_id=null` | Tạo customerOrg | `customerOrg.default_locale == "vi"` (system default) |
| AT-P1-03 | Direct onboard (no reseller) | `primary_reseller_id=null` | Tạo customerOrg | `customerOrg.default_locale == "vi"` |
| AT-P1-04 | Explicit locale input | `partnerOrg.default_locale="en"` | Tạo customerOrg với `default_locale="vi"` | `customerOrg.default_locale == "vi"` (input wins) |

#### Guardrails
- Validate `partnerOrg.kind == PARTNER` (đúng BRIEF §6.2.2 OrgKind guardrail)
- Audit: `AuditAction.ORG_CREATED` + `inherited_default_locale_from_reseller` flag
- Telemetry: `org_onboarded` event payload includes `primary_reseller_id` + `inherited_locale`

## Files to Create/Modify

### Estimated File Count: ~40 files

| Area | Files | Priority |
|------|-------|----------|
| Nav/Sidebar | 2-3 | P0 |
| Auth pages | 5 | P0 |
| Dashboard components | 10-12 | P0 |
| Pricing components | 8-10 | P0 |
| Settings | 4-5 | P1 |
| OTA Calculator | 3-4 | P1 |
| Message files | 2 | P0 |

## Test Criteria

- [ ] Switch to EN: all Nav labels in English
- [ ] Dashboard: KPI card titles in English, values formatted correctly
- [ ] Pricing table: column headers in English
- [ ] RM acronyms (OTB, STLY, etc.) remain unchanged in both locales
- [ ] Switch back to VI: everything returns to Vietnamese
- [ ] No broken layout or overflow from longer English strings
- [ ] CI parity check: all new keys exist in both vi.json and en.json

## Notes

- **String length:** English tends to be shorter than Vietnamese, but some labels may be longer. Check for overflow.
- **Glossary terms:** OTB, STLY, Pace, Pickup, BAR, NET — keep as-is with EN tooltips in `glossary.*` namespace.
- **Format strings:** Replace remaining `Intl.NumberFormat('vi-VN')` calls with `formatCurrency()/formatNumber()` wrappers.
- **Server Components:** Use `useTranslations()` in client components, `getTranslations()` in server components.

---
Next Phase: [phase-02-long-tail-ui.md](file:///c:/Apps/Antigravity/revenue-management-system/plans/260219-1400-i18n-internationalization/phase-02-long-tail-ui.md)
