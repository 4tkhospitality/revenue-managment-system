# 💡 BRIEF: RMS Internationalization (i18n)

**Ngày tạo:** 2026-02-19  
**Mục tiêu:** Đánh thị trường quốc tế — GM/DOSM nước ngoài + khách sạn ngoài VN

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT

RMS hiện 100% tiếng Việt hardcode (2,176 dòng text / 127 files). Không thể bán cho khách sạn quốc tế hoặc GM/DOSM người nước ngoài.

## 2. GIẢI PHÁP: `next-intl` + Cookie Locale

| Quyết định | Chọn | Lý do |
|------------|------|-------|
| **Thư viện** | `next-intl` | #1 cho Next.js App Router, type-safe, SSR/Client |
| **Locale detection** | Cookie / user setting | SaaS app (authenticated) — không cần SEO URL |
| **URL structure** | Giữ nguyên `/dashboard` | KHÔNG thêm `/[locale]/` — tiết kiệm refactor |
| **Default locale** | `vi` | Backwards-compatible |
| **Target locales** | `vi`, `en` | Mở rộng thêm sau (JP/KR/TH) |
| **Landing page** | i18n routing riêng (tách nhịp) | Nếu cần SEO quốc tế thì làm riêng |

## 3. NGUYÊN TẮC KIẾN TRÚC

### 3.1. Server trả `reason_code` + `params` — UI tự dịch

```
// ❌ SAI: duplicating text fields
{ reasonTextVi: "Demand cao hơn supply 20%", reasonTextEn: "Demand exceeds supply by 20%" }

// ✅ ĐÚNG: code + params → t() render theo locale
{ reason_code: "PRICING.OCC_LEVEL", params: { occ: 0.84, level: 4 } }
// UI: t("PRICING.OCC_LEVEL", { occ: "84%", level: 4 })
//  → VI: "Công suất 84% — mức 4, nhu cầu cao"
//  → EN: "Occupancy 84% — level 4, high demand"
```

> **🔒 IRON RULE:** Server **KHÔNG BAO GIỜ** trả sentence user-facing (kể cả tiếng Việt). Chỉ trả `reason_code` + `params` + (optional) `severity` / `confidence`. **UI là nơi duy nhất render text.** Thêm locale mới = thêm 1 file JSON, không đụng engine.

### 3.2. Locale ≠ Currency ≠ Timezone

| Dimension | Source | Standard | Ví dụ |
|-----------|--------|----------|-------|
| **UI language** | User preference (cookie) | **BCP-47** | `vi`, `en`, `th` |
| **Currency** | Hotel setting (`Hotel.currency`) | **ISO 4217** | `VND`, `USD`, `THB` |
| **Timezone** | Hotel setting (`Hotel.timezone`) | **IANA** | `Asia/Ho_Chi_Minh`, `Asia/Bangkok` |
| **Date/Number format** | Follows locale | per BCP-47 | `1.234,56` (vi) vs `1,234.56` (en) |

> UI English + VND + timezone Bangkok = hoàn toàn hợp lệ (GM nước ngoài quản lý KS Thái)

**Wrapper signatures:**
```ts
formatCurrency(amount: number, hotelCurrency: string)  // currency từ hotel, format theo locale
formatDate(date: Date, hotelTimezone: string)           // timezone từ hotel, locale từ user
formatNumber(value: number)                             // format theo locale
```

### 3.3. Standardization Rules

```ts
// Supported locales (BCP-47, lowercase)
// Phase 00–03: ["vi", "en"] only. Phase 04 adds "th".
const SUPPORTED_LOCALES = ["vi", "en"] as const;
type SupportedLocale = typeof SUPPORTED_LOCALES[number];

// Normalize: "en-US" → "en", "fr" → null (unsupported)
function normalizeLocale(raw: string): SupportedLocale | null;

// Validation: Zod schema + DB check
const localeSchema = z.enum(SUPPORTED_LOCALES);
const currencySchema = z.string().length(3).transform(s => s.toUpperCase()); // ISO 4217
```

> Tránh dữ liệu bẩn kiểu `"EN"` / `"english"` / `"thai"` — validate ở input layer.

### 3.4. Convention key theo domain

```
messages/
├── vi.json
├── en.json
└── th.json   (Phase 04 mới thêm)

Key structure:
  common.*          # Button, label chung (Lưu, Huỷ, Tải, Xoá)
  nav.*             # Sidebar, tabs
  dashboard.*       # KPI cards, overview
  pricing.*         # Pricing tab, recommendations
  analytics.*       # Charts, metrics
  settings.*        # Settings pages
  errors.*          # Error messages, validation
  notifications.*   # Telegram, email templates
  glossary.*        # RM terms (OTB, STLY, Pace, Pickup, BAR, NET)
  reasons.*         # Pricing Engine reason_code translations
```

### 3.5. Locale Fallback Chain (cho GSA model)

```
User.locale            (user tự chọn, highest priority)
  ↓ null?
Hotel.default_locale   (override Org nếu cần, optional)
  ↓ null?
Org.default_locale     (GSA Thái set = "th", tất cả KS dưới dùng mặc định)
  ↓ null?
Accept-Language         (browser header, normalize → match SUPPORTED_LOCALES)
  ↓ no match?
"vi"                    (system default)
```

> **Tại sao cần `Org.default_locale`?** Nếu chỉ dựa Accept-Language, GM Thái dùng Chrome tiếng Anh sẽ thấy English thay vì Thai. GSA muốn staff KS thấy tiếng Thái ngay lần đầu — cần override ở cấp Org.

**Schema hiện tại vs cần thêm:**

| Model | Field hiện có | Cần thêm |
|-------|--------------|----------|
| `User` (L86) | — | `locale String?` (user override) |
| `Organization` (L723) | — | `kind OrgKind @default(CUSTOMER)` |
| `Organization` (L723) | — | `default_locale String @default("vi")` |
| `Organization` (L723) | — | `primary_reseller_id String? @db.Uuid` (attribution) |
| `Hotel` (L11) | `currency`, `country`, `timezone` | `default_locale String?` (override Org, optional) |
| `Reseller` (L808) | — | `type ResellerType @default(INDIVIDUAL)` |
| `Reseller` (L808) | — | `org_id String? @unique @db.Uuid` (home org) |

### 3.6. Billing Currency ≠ Hotel Currency (cho Reseller invoicing)

| Currency | Source | Ví dụ |
|----------|--------|-------|
| **Operational** (giá phòng, OTA, BAR) | `Hotel.currency` | THB |
| **Billing** (invoice, commission) | `Org.billing_currency` hoặc `Reseller.billing_currency` | USD |

> **Use-case:** GSA Thái muốn nhận commission report bằng USD dù các KS operate bằng THB.

**Schema cần thêm (nullable + runtime fallback):**

| Model | Cần thêm | Fallback runtime |
|-------|----------|------------------|
| `Organization` (L723) | `billing_currency String?` (nullable) | `Org.billing_currency ?? Hotel.currency ?? "VND"` |
| `Reseller` (L808) | `billing_currency String?` (nullable) | `Reseller.billing_currency ?? Org.billing_currency ?? "VND"` |

> ⚠️ **Không default cứng `"VND"`** — nếu onboard org Thái mà quên edit default thì invoice sẽ sai currency. Nullable + runtime fallback an toàn hơn.

### 3.7. GSA = Reseller + Organization (Option A — dual relations)

**GSA không phải entity riêng.** GSA = `Reseller` có `type=GSA` + link tới 1 `Organization` (home org/portal).

```
Reseller (GSA Thai)
├── type: GSA
├── org_id → Thai Partners Org (portal, staff login, billing settings)
└── managed_orgs:
    ├── Hotel Org A (Bangkok)      ← primary_reseller_id → GSA
    ├── Hotel Org B (Phuket)       ← primary_reseller_id → GSA
    └── Hotel Org C (Chiang Mai)   ← primary_reseller_id → GSA
```

**2 quan hệ, mỗi cái 1 ý nghĩa:**

| Relation | Ý nghĩa | Scope |
|----------|---------|-------|
| `Reseller.org_id` | "Nhà" của GSA (portal, staff, settings) | 1 GSA → 1 home org |
| `Organization.primary_reseller_id` | "Ai mang hotel org này về?" | 1 GSA → nhiều customer orgs |

| Loại | `type` | `org_id` | Admin UI |
|------|--------|----------|----------|
| Individual reseller | `INDIVIDUAL` | `null` | Tab: Commission only |
| GSA | `GSA` | → Partner Org | Tab: Commission + Org Settings + Hotels |
| Agency | `AGENCY` | → Agency Org | Tab: Commission + Org Settings |

## 4. PHÂN PHASE

### 🚀 Phase 0 — i18n Foundation (2–3 ngày)
- [ ] Install + config `next-intl` (cookie-based, no URL routing)
- [ ] Middleware locale detection: `User.locale → Hotel.default_locale → Org.default_locale → Accept-Language → "vi"`
- [ ] Locale normalization: `normalizeLocale()` + Zod validation
- [ ] **Schema migration:** add `User.locale`, `Organization.default_locale`, `Hotel.default_locale`
- [ ] **Schema reservation** (nullable placeholder): `Org.billing_currency?`, `Reseller.billing_currency?`
- [ ] Wrapper functions: `formatCurrency(amount, hotelCurrency)`, `formatNumber()`, `formatDate(date, hotelTimezone)`
- [ ] Create `messages/vi.json` + `messages/en.json` skeletons
- [ ] ESLint rule: warn on Vietnamese hardcode in `.tsx`
- [ ] Language switcher: save to `User.locale` + cookie

#### Phase 0 — Acceptance Tests (8 tests)

| # | Test | Expected |
|---|------|----------|
| T1 | First login, no cookie, `User.locale=null`, `Org.default_locale="en"` | UI = English (Org default wins) |
| T2 | User changes language to EN → persist `User.locale="en"` + cookie, refresh | UI = English (sticky) |
| T3 | `Hotel.default_locale="en"`, `Org.default_locale="vi"`, `User.locale=null` | UI = English (Hotel overrides Org) |
| T4 | All null, browser `Accept-Language: en-US` | UI = English (`en-US` → `en`) |
| T5 | All null, browser `Accept-Language: fr` (unsupported) | UI = Vietnamese (fallback `vi`) |
| T6 | `User.locale="en"`, `Hotel.currency="THB"` | UI English, prices show `฿` |
| T7 | Same timestamp, Hotel A (`Asia/Bangkok`), Hotel B (`Asia/Ho_Chi_Minh`) | `formatDate()` shows correct local date for each |
| T8 | EN locale, page has missing translation key | Fallback to VI text + log `missing_translation` event |

### 🌏 Phase 1 — International-ready surfaces (5–7 ngày)
- [ ] Sidebar / Nav / Auth / Settings cơ bản
- [ ] Dashboard KPI cards + table
- [ ] Pricing tab (Quick + Detailed mode)
- [ ] OTA Calculator
- [ ] Language switcher dropdown (header hoặc settings)

### 📝 Phase 2 — Long tail UI (5–8 ngày)
- [ ] Admin pages
- [ ] Data / Upload pages
- [ ] Guide / Playbook / Onboarding
- [ ] Rate Shopper
- [ ] Error messages, tooltips, empty states

### 🔧 Phase 3 — Server-generated text (3–5 ngày)
- [ ] Pricing Engine: refactor `reasonTextVi` → `reason_code` + `params`
- [ ] Telegram notifications: template theo locale
- [ ] Email templates: locale-aware
- [ ] API error responses: `code` + `message` chuẩn hoá

### 🌏 Phase 4 — Thai locale expansion (khi có GSA Thái)
- [ ] `messages/th.json` — dịch từ `en.json`
- [ ] Font: thêm Noto Sans Thai vào font fallback stack
- [ ] GSA Thái: set `Org.default_locale = "th"`, `Org.billing_currency = "USD"` (hoặc THB)
- [ ] Verify: Staff KS Thái thấy Thai+THB, GM nước ngoài thấy EN+THB

## 5. RỦI RO + MITIGATION

| Rủi ro | Giải pháp |
|--------|-----------|
| Inconsistent UX (nửa Việt nửa Anh) | "Coverage gate": page chưa đủ key EN → fallback VI + log `missing_translation` telemetry |
| Hardcode text tái xuất hiện | ESLint rule + **CI fail** phát hiện Vietnamese string trong `.tsx` |
| Thuật ngữ RM không dịch literal | Giữ acronym (OTB, STLY, Pace, Pickup, BAR, NET) + tooltip EN chuẩn theo Glossary |
| Format conflict (VND vs USD) | Currency theo `hotel.currency`, KHÔNG theo locale |
| Locale data bẩn | BCP-47 + Zod validation + `normalizeLocale()` (§3.3) |
| Notification sai ngôn ngữ | Recipient locale rule (§6.6) |

## 6. IMPLEMENTATION GOVERNANCE

### 6.1. Locale Persistence Contract

| Item | Quy ước |
|------|---------|
| **Cookie name** | `rms_locale` |
| **Source of truth** | `User.locale` trong DB |
| **Cookie role** | Cache only — tránh query DB mỗi request |
| **Sync timing** | Login → read DB → set cookie · Đổi language → update DB + set cookie · Logout → clear cookie |
| **Cookie options** | `httpOnly: true`, `sameSite: 'lax'`, `maxAge: 365 days`, `path: '/'` |

> **Rule:** Nếu cookie ≠ DB (stale) → DB wins. Middleware đọc cookie cho speed, nhưng bất kỳ write nào đều update DB first.

### 6.2. Role & Audit cho Org/Hotel Defaults

| Setting | Ai được sửa | Audit log |
|---------|-------------|-----------|
| `Org.default_locale` | Org OWNER / ADMIN | ✅ `AuditAction.SETTING_CHANGED` |
| `Org.billing_currency` | Org OWNER only | ✅ `AuditAction.SETTING_CHANGED` |
| `Hotel.default_locale` | Hotel Admin + Org Admin | ✅ `AuditAction.SETTING_CHANGED` |
| `User.locale` | User tự đổi (self-service) | ❌ không cần audit |
| `Org.primary_reseller_id` | Super Admin only (immutable rule) | ✅ `AuditAction.ATTRIBUTION_CHANGED` + reason |

#### 6.2.1. Attribution Lifecycle (`primary_reseller_id`)

| Rule | Chi tiết |
|------|----------|
| **Immutability** | Sau khi set, chỉ Super Admin mới được override |
| **Audit** | Mọi thay đổi → `AuditAction.ATTRIBUTION_CHANGED` + `reason` field |
| **Service guard** | `if (org.primary_reseller_id && role !== 'SUPER_ADMIN') throw ForbiddenError` |
| **Lý do** | Commission attribution dính tranh chấp → phải audit trail |

#### 6.2.2. OrgKind Guardrail

| Rule | Chi tiết |
|------|----------|
| **Enum** | `Organization.kind`: `CUSTOMER` (hotel tenant) / `PARTNER` (GSA portal) |
| **Guardrail** | `Reseller.org_id` chỉ được trỏ vào org có `kind = PARTNER` |
| **Enforce** | Service layer validate + Admin UI filter org list by kind |
| **Default** | `kind = CUSTOMER` (backward-compatible, existing orgs = hotel tenants) |

#### 6.2.3. GSA Access Control (chốt policy cho Phase 1+)

> ⚠️ **Phase 0 chỉ tạo schema.** Access control logic implement ở Phase 1+ khi build Admin → Partners UI.

| GSA staff role | Được phép | Không được |
|----------------|-----------|------------|
| `GSA_VIEWER` | Xem dashboard/analytics của customer orgs | Chỉnh pricing, upload data |
| `GSA_MANAGER` | Tất cả GSA_VIEWER + chỉnh org/hotel defaults | Chỉnh pricing, quản lý hotel staff |
| Hotel staff (thuộc customer org) | Full access hotel mình | Không thấy GSA portal |

> **Rule:** User thuộc `Reseller.org_id` (home org) → có thể "nhìn" customer orgs có `primary_reseller_id = reseller.id` — phạm vi tuỳ role.

### 6.3. Translation Workflow

| Rule | Chi tiết |
|------|----------|
| **Source locale** | `en.json` là source — key mới luôn bắt đầu từ EN |
| **Parity rule** | Thêm key ở `en.json` → **bắt buộc** thêm ở `vi.json` (CI check) |
| **Ownership** | Dev thêm key EN · BA/PM review + dịch VI · Translator cho TH (khi mở) |
| **Key naming** | `namespace.component.element` — VD: `dashboard.kpi.occupancy_label` |
| **No orphan keys** | CI check: key có trong JSON nhưng không được import ở đâu → warn |

### 6.4. CI Gates (2 fail conditions)

```yaml
# CI Pipeline — i18n checks
- name: Message parity check
  run: node scripts/i18n-parity.js  # en.json vs vi.json key diff → FAIL if missing
  
- name: Hardcode Vietnamese detector
  run: grep -rn '[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]' \
       --include='*.tsx' apps/web/app apps/web/components && exit 1 || exit 0
```

> **Local dev:** ESLint warn (không chặn workflow). **CI/CD:** FAIL (chặn merge).

### 6.5. `reason_code` Registry

| Rule | Chi tiết |
|------|----------|
| **Namespace** | Tất cả reason codes nằm trong `reasons.*` — VD: `reasons.PRICING.OCC_LEVEL` |
| **Catalog** | File `messages/reason-codes.ts` export tất cả codes (single source) |
| **Validation** | Engine chỉ được trả code có trong catalog — unknown code → log error |
| **Params contract** | Mỗi code document params cần thiết — VD: `OCC_LEVEL: { occ: number, level: number }` |

```ts
// messages/reason-codes.ts — Single source of truth
export const REASON_CODES = {
  'reasons.PRICING.OCC_LEVEL':    { params: ['occ', 'level'] },
  'reasons.PRICING.COMP_RATE':    { params: ['competitor', 'delta'] },
  'reasons.PRICING.STLY_PATTERN': { params: ['stlyOcc', 'direction'] },
  'reasons.PRICING.STOP_SELL':    { params: ['reason'] },
  // ...
} as const;
```

### 6.6. Notification Locale (Email/Telegram)

| Scenario | Locale source |
|----------|--------------|
| Gửi cho user cụ thể | `recipientUser.locale` (fallback chain §3.5) |
| Gửi cho org channel (Telegram group) | `Org.default_locale` |
| Gửi cho admin/super_admin | `User.locale` of recipient |
| Không xác định recipient | Fallback `"vi"` |

> Rule: **Notification luôn theo locale của NGƯỜI NHẬN**, không phải người trigger action.

### 6.7. Backfill & Rollout Safety

**Migration script (Phase 0):**

```sql
-- Backfill existing data
ALTER TABLE users ADD COLUMN locale VARCHAR(5) NULL;           -- all existing = null
ALTER TABLE organizations ADD COLUMN default_locale VARCHAR(5) DEFAULT 'vi';
ALTER TABLE organizations ADD COLUMN billing_currency VARCHAR(3) NULL;
ALTER TABLE hotels ADD COLUMN default_locale VARCHAR(5) NULL;  -- all existing = null
ALTER TABLE resellers ADD COLUMN billing_currency VARCHAR(3) NULL;
```

**Rollout strategy:**

| Step | Detail |
|------|--------|
| Feature flag | `i18n_enabled` — khi `false`, app hardcode `vi` (zero behavior change) |
| Phase 0 deploy | Flag `false` — chỉ schema + infra, user không thấy gì khác |
| Internal test | Flag `true` cho super_admin only — verify T1-T8 |
| Gradual rollout | Flag `true` cho 1 org → all orgs |
| Rollback | Flag `false` → instant revert, không cần redeploy |

### 6.8. Definition of Done — Phase 0

| # | Criteria | Verify |
|---|----------|--------|
| ✅ | T1–T8 acceptance tests pass | Automated / manual |
| ✅ | 1 page demo (Dashboard) dùng `t()` end-to-end | Visual check |
| ✅ | `formatCurrency()` dùng ở ≥2 chỗ thực tế | Code review |
| ✅ | `formatDate(date, hotelTz)` dùng ở ≥2 chỗ thực tế | Code review |
| ✅ | `formatNumber()` dùng ở ≥1 chỗ thực tế | Code review |
| ✅ | CI gate bật: parity check + hardcode detector | CI green |
| ✅ | Schema migration deployed (all 5 fields) | DB check |
| ✅ | Feature flag `i18n_enabled` works (on/off) | Toggle test |
| ✅ | Language switcher saves to DB + cookie | E2E |

### 6.9. Onboarding Locale Inheritance (Phase 01)

| Rule | Chi tiết |
|------|----------|
| **Trigger** | Tạo customer org có `primary_reseller_id` |
| **Logic** | `customerOrg.default_locale = input.default_locale ?? partnerOrg.default_locale ?? "vi"` |
| **One-time** | Chỉ set lúc tạo org. Sau đó org admin đổi tự do — **không sync ngược** từ GSA |
| **Guardrail** | Validate `partnerOrg.kind == PARTNER` trước khi inherit |
| **Audit** | `AuditAction.ORG_CREATED` + `inherited_default_locale_from_reseller` flag |

## 7. ƯỚC TÍNH TỔNG

| | Effort | Risk |
|--|--------|------|
| **Phase 0** | 2–3 ngày | Low |
| **Phase 1** | 5–7 ngày | Medium |
| **Phase 2** | 5–8 ngày | Low |
| **Phase 3** | 3–5 ngày | Medium (reason_code refactor) |
| **Phase 4** | 1–2 ngày | Low (chỉ thêm JSON + font) |
| **Tổng** | **~16–25 ngày** | |

## 8. BƯỚC TIẾP THEO

→ `/plan` để thiết kế chi tiết Phase 0 (foundation)  
→ Hoặc `/code` luôn nếu anh muốn bắt tay vào Phase 0
