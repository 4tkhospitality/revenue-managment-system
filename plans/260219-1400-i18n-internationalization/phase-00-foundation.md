# Phase 00: i18n Foundation & Infrastructure
Status: ⬜ Pending  
Dependencies: None  
Effort: 2–3 ngày

## Objective

Thiết lập toàn bộ i18n infrastructure: `next-intl` config, schema migration, locale detection middleware, format wrappers, CI gates, và feature flag. Sau phase này, 1 page demo (Dashboard) hoạt động end-to-end bằng `t()`.

## Requirements

### Functional
- [ ] App hỗ trợ 2 locale: `vi` (default), `en`
- [ ] Locale detection theo fallback chain 5 tầng
- [ ] User có thể đổi language → persist DB + cookie
- [ ] Format currency/date/number theo locale + hotel settings
- [ ] Feature flag `i18n_enabled` enable/disable toàn bộ

### Non-Functional
- [ ] Zero behavior change khi feature flag = `false`
- [ ] Middleware performance: không thêm DB query (dùng cookie cache)
- [ ] Type-safe: `t()` keys type-checked

## Implementation Steps

### Step 1: Install `next-intl`

```bash
cd apps/web
npm install next-intl
```

### Step 2: Schema Migration (Prisma)

#### [MODIFY] [schema.prisma](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/prisma/schema.prisma)

Add 10 fields + 2 enums to existing models:

```prisma
// NEW ENUMS
enum ResellerType {
  INDIVIDUAL    // Broker cá nhân, giới thiệu 1-2 KS
  GSA           // General Sales Agent — đại diện 1 thị trường
  AGENCY        // Đại lý du lịch
  AFFILIATE     // Online affiliate
}

enum OrgKind {
  CUSTOMER      // Hotel tenant (khách sạn / chuỗi)
  PARTNER       // GSA/Agency portal org
}

model User {
  // ... existing fields
  locale    String?     // BCP-47: "vi", "en" (Phase 04 adds "th") — user override
}

model Organization {
  // ... existing fields
  kind                 OrgKind   @default(CUSTOMER)  // Phân biệt hotel tenant vs partner portal
  default_locale       String    @default("vi")      // BCP-47
  billing_currency     String?                        // ISO 4217, nullable + runtime fallback
  primary_reseller_id  String?   @db.Uuid             // Reseller/GSA nào mang org này về?
  primary_reseller     Reseller? @relation("OrgReseller", fields: [primary_reseller_id], references: [id], onDelete: SetNull)

  @@index([primary_reseller_id])  // Query "all orgs under GSA X"
}

model Hotel {
  // ... existing fields
  default_locale    String?                    // BCP-47, override Org
}

model Reseller {
  // ... existing fields
  type              ResellerType @default(INDIVIDUAL)
  billing_currency  String?                    // ISO 4217, nullable + runtime fallback
  org_id            String?      @unique @db.Uuid  // "Home org" — portal cho GSA staff
  organization      Organization? @relation("ResellerHomeOrg", fields: [org_id], references: [id])
  managed_orgs      Organization[] @relation("OrgReseller")  // Customer orgs mà GSA quản lý
}
```

> **2 quan hệ riêng biệt:**
> - `Reseller.org_id` → "Nhà" của GSA (portal, staff login, billing settings)
> - `Organization.primary_reseller_id` → "Ai mang hotel org này về?" (attribution, commission)
>
> Individual reseller: `type=INDIVIDUAL`, `org_id=null` — chỉ earn commission
> GSA: `type=GSA`, `org_id=<partner_org>` — có portal + quản lý nhiều customer orgs

> **DB integrity:**
> - `@@index([primary_reseller_id])` — query tất cả orgs under 1 GSA
> - `onDelete: SetNull` — xóa reseller không làm "chết" hotel org
> - `@unique` trên `Reseller.org_id` — home org 1-1
> - `OrgKind` enum — guardrail: `Reseller.org_id` chỉ nên trỏ vào `PARTNER` org (enforce ở service layer)

> **Attribution lifecycle:**
> - `primary_reseller_id` = immutable sau khi set (chỉ Super Admin override)
> - Mọi thay đổi → bắt buộc `AuditAction.ATTRIBUTION_CHANGED` + reason
> - Service layer validate: không cho set `primary_reseller_id` nếu đã có giá trị (trừ role = SUPER_ADMIN)

Run migration:
```bash
npx prisma migrate dev --name add-i18n-locale-and-reseller-type
```

### Step 3: Create i18n Library

#### [NEW] `lib/i18n/config.ts`
Core configuration — supported locales, default locale, types.

```ts
import { z } from 'zod';

// Phase 00–03: ["vi", "en"] only. Phase 04 adds "th".
export const SUPPORTED_LOCALES = ["vi", "en"] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];
export const DEFAULT_LOCALE: SupportedLocale = "vi";

export const localeSchema = z.enum(SUPPORTED_LOCALES);
export const currencySchema = z.string().length(3).transform(s => s.toUpperCase());

// Normalize browser locale: "en-US" → "en"
export function normalizeLocale(raw: string): SupportedLocale | null {
  const base = raw.split('-')[0].toLowerCase();
  const parsed = localeSchema.safeParse(base);
  return parsed.success ? parsed.data : null;
}

// Feature flag
export function isI18nEnabled(): boolean {
  return process.env.NEXT_PUBLIC_I18N_ENABLED === 'true';
}

// Cookie name
export const LOCALE_COOKIE = 'rms_locale';
```

#### [NEW] `lib/i18n/format.ts`
Wrapper functions for currency, date, number.

```ts
import { SupportedLocale } from './config';

export function formatCurrency(
  amount: number,
  hotelCurrency: string,
  locale: SupportedLocale = 'vi'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: hotelCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: hotelCurrency === 'VND' ? 0 : 2,
  }).format(amount);
}

export function formatDate(
  date: Date | string,
  hotelTimezone: string,
  locale: SupportedLocale = 'vi',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    timeZone: hotelTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  }).format(d);
}

export function formatNumber(
  value: number,
  locale: SupportedLocale = 'vi',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}
```

#### [NEW] `lib/i18n/resolve-locale.ts`
Fallback chain logic (for server-side use).

```ts
import { normalizeLocale, DEFAULT_LOCALE, LOCALE_COOKIE, isI18nEnabled } from './config';
import type { SupportedLocale } from './config';

interface LocaleContext {
  userLocale?: string | null;
  hotelDefaultLocale?: string | null;
  orgDefaultLocale?: string | null;
  acceptLanguage?: string | null;
}

export function resolveLocale(ctx: LocaleContext): SupportedLocale {
  if (!isI18nEnabled()) return DEFAULT_LOCALE;

  // 1. User override (highest priority)
  if (ctx.userLocale) {
    const norm = normalizeLocale(ctx.userLocale);
    if (norm) return norm;
  }

  // 2. Hotel default
  if (ctx.hotelDefaultLocale) {
    const norm = normalizeLocale(ctx.hotelDefaultLocale);
    if (norm) return norm;
  }

  // 3. Org default
  if (ctx.orgDefaultLocale) {
    const norm = normalizeLocale(ctx.orgDefaultLocale);
    if (norm) return norm;
  }

  // 4. Accept-Language header
  if (ctx.acceptLanguage) {
    const langs = ctx.acceptLanguage.split(',');
    for (const lang of langs) {
      const norm = normalizeLocale(lang.trim().split(';')[0]);
      if (norm) return norm;
    }
  }

  // 5. System default
  return DEFAULT_LOCALE;
}
```

#### [NEW] `lib/i18n/index.ts`
Barrel export.

```ts
export * from './config';
export * from './format';
export * from './resolve-locale';
```

### Step 4: Create Message Files

#### [NEW] `messages/en.json`
Skeleton with initial Dashboard demo keys.

#### [NEW] `messages/vi.json`
Mirror of en.json with Vietnamese translations.

Key namespaces:
```json
{
  "common": {
    "save": "Save / Lưu",
    "cancel": "Cancel / Huỷ",
    "loading": "Loading... / Đang tải...",
    "delete": "Delete / Xoá",
    "edit": "Edit / Sửa",
    "confirm": "Confirm / Xác nhận",
    "back": "Back / Quay lại",
    "next": "Next / Tiếp"
  },
  "nav": { /* sidebar labels */ },
  "dashboard": { /* KPI cards, table headers */ },
  "pricing": { /* pricing tab */ },
  "settings": { /* settings labels */ },
  "errors": { /* error messages */ },
  "glossary": { /* RM terms with tooltips */ },
  "reasons": { /* pricing engine reason_code translations */ }
}
```

### Step 5: Configure `next-intl` (cookie-based, no URL routing)

#### [MODIFY] [next.config.ts](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/next.config.ts)
Add `next-intl` plugin.

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
};

export default withNextIntl(nextConfig);
```

#### [NEW] `lib/i18n/request.ts`
`next-intl` request configuration (reads cookie, resolves locale).

```ts
import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { LOCALE_COOKIE, DEFAULT_LOCALE, isI18nEnabled, normalizeLocale } from './config';

export default getRequestConfig(async () => {
  let locale = DEFAULT_LOCALE;

  if (isI18nEnabled()) {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
    if (cookieLocale) {
      locale = normalizeLocale(cookieLocale) ?? DEFAULT_LOCALE;
    } else {
      // Fallback to Accept-Language
      const headerStore = await headers();
      const acceptLang = headerStore.get('accept-language');
      if (acceptLang) {
        const langs = acceptLang.split(',');
        for (const lang of langs) {
          const norm = normalizeLocale(lang.trim().split(';')[0]);
          if (norm) { locale = norm; break; }
        }
      }
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    onError(error) {
      // Log missing translation telemetry
      if (error.code === 'MISSING_MESSAGE') {
        console.warn(`[i18n] Missing translation: ${error.originalMessage}`);
        // TODO: Send to telemetry service
      }
    },
    getMessageFallback({ namespace, key }) {
      // Fallback to key path for missing translations
      return `${namespace}.${key}`;
    },
  };
});
```

#### [MODIFY] [layout.tsx](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/app/layout.tsx)
Wrap with `NextIntlClientProvider`.

```tsx
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={...}>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### Step 6: Middleware — Set Locale Cookie

#### [MODIFY] [middleware.ts](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/middleware.ts)

Add locale cookie detection in middleware (after referral, before auth):

```ts
// After referral capture, before auth check:
// Read locale from cookie, or resolve from Org/Accept-Language
import { LOCALE_COOKIE, DEFAULT_LOCALE, normalizeLocale, isI18nEnabled } from '@/lib/i18n/config';

// In middleware function:
if (isI18nEnabled()) {
  const localeCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (!localeCookie) {
    // Set default from Accept-Language for first visit
    const acceptLang = request.headers.get('accept-language');
    if (acceptLang) {
      const langs = acceptLang.split(',');
      for (const lang of langs) {
        const norm = normalizeLocale(lang.trim().split(';')[0]);
        if (norm) {
          response.cookies.set(LOCALE_COOKIE, norm, {
            httpOnly: true, sameSite: 'lax',
            maxAge: 365 * 24 * 60 * 60, path: '/'
          });
          break;
        }
      }
    }
  }
}
```

### Step 6b: Locale Cookie Sync on Login / Hotel Switch

> **Lý do:** Middleware chạy ở Edge (không query DB), nên chỉ đọc cookie/Accept-Language. Nhưng fallback chain (T1-T3) yêu cầu Org/Hotel defaults. Giải pháp: **set cookie từ DB context** khi user login hoặc switch hotel.

#### [MODIFY] Login flow (auth callback / session handler)

```ts
// On successful login:
const resolvedLocale = resolveLocale({
  userLocale: user.locale,
  hotelDefaultLocale: activeHotel?.default_locale,
  orgDefaultLocale: org?.default_locale,
  acceptLanguage: request.headers.get('accept-language'),
});

// Set cookie from resolved DB context
response.cookies.set(LOCALE_COOKIE, resolvedLocale, {
  httpOnly: true, sameSite: 'lax',
  maxAge: 365 * 24 * 60 * 60, path: '/'
});
```

#### [MODIFY] Hotel switch handler (select-hotel / HotelSwitcher)

```ts
// On hotel switch:
// Re-resolve locale because Hotel.default_locale may differ
const resolvedLocale = resolveLocale({
  userLocale: user.locale,
  hotelDefaultLocale: newHotel.default_locale,
  orgDefaultLocale: org?.default_locale,
  acceptLanguage: null, // already authenticated, DB wins
});
response.cookies.set(LOCALE_COOKIE, resolvedLocale, ...);
```

> **Flow:** Login/Switch hotel → server has DB context → `resolveLocale()` → set `rms_locale` cookie → subsequent requests read cookie (fast, no DB). Khớp với governance §6.1: "DB = source of truth, cookie = cache".
```

### Step 7: Language Switcher API

#### [NEW] `app/api/user/locale/route.ts`
API endpoint to update user locale preference.

```ts
// PATCH /api/user/locale
// Body: { locale: "en" }
// → Update User.locale in DB
// → Set cookie rms_locale
// → Return { success: true, locale }
```

### Step 8: Language Switcher Component

#### [NEW] `components/shared/LanguageSwitcher.tsx`
Dropdown component for language selection.

### Step 9: CI Gate Scripts

#### [NEW] `scripts/i18n-parity.js`
Check en.json vs vi.json key parity — exit 1 if any missing keys.

#### [MODIFY] `eslint.config.mjs`
Add custom rule warning for Vietnamese hardcode strings.

### Step 10: Feature Flag Configuration

#### [MODIFY] `.env`
```
NEXT_PUBLIC_I18N_ENABLED=false
```

### Step 11: Dashboard Demo Page

#### [MODIFY] Dashboard page
Replace 5-10 hardcoded Vietnamese strings with `t()` calls as proof of concept.

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `lib/i18n/config.ts` | Supported locales, types, validation, normalizer |
| `lib/i18n/format.ts` | `formatCurrency()`, `formatDate()`, `formatNumber()` |
| `lib/i18n/resolve-locale.ts` | 5-level fallback chain |
| `lib/i18n/request.ts` | `next-intl` request config (cookie-based) |
| `lib/i18n/index.ts` | Barrel export |
| `messages/en.json` | English translations skeleton |
| `messages/vi.json` | Vietnamese translations (source mirror) |
| `app/api/user/locale/route.ts` | User locale preference API |
| `components/shared/LanguageSwitcher.tsx` | Language dropdown |
| `scripts/i18n-parity.js` | CI: message key parity check |

### Modified Files
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add 10 fields + 2 enums (locale, default_locale, billing_currency, OrgKind, ResellerType, primary_reseller_id, org_id) |
| `next.config.ts` | Add `next-intl` plugin |
| `app/layout.tsx` | Wrap with `NextIntlClientProvider` |
| `middleware.ts` | Add locale cookie detection |
| `eslint.config.mjs` | Add Vietnamese hardcode warning rule |
| `.env` | Add `NEXT_PUBLIC_I18N_ENABLED=false` |
| `app/dashboard/page.tsx` | Demo: replace 5-10 strings with `t()` |

## Acceptance Tests (T1–T8)

| # | Test | Expected | Type |
|---|------|----------|------|
| T1 | First login, `User.locale=null`, `Org.default_locale="en"` | UI follows Org default (English) | Unit (resolve-locale) |
| T2 | User changes language EN → persist → refresh | UI = English (sticky) | E2E |
| T3 | `Hotel.default_locale="en"`, `Org.default_locale="vi"` | Hotel wins over Org | Unit (resolve-locale) |
| T4 | All null, `Accept-Language: en-US` | `en-US` → `en` | Unit (normalizeLocale) |
| T5 | All null, `Accept-Language: fr` | Fallback to `vi` | Unit (normalizeLocale) |
| T6 | `locale="en"`, `Hotel.currency="THB"` | EN text + `฿` prices | Unit (formatCurrency) |
| T7 | Same timestamp, 2 timezones | Correct local date each | Unit (formatDate) |
| T8 | Missing key in EN | Fallback + log `missing_translation` | Unit (request.ts) |

### Test Commands
```bash
# Run all i18n tests
npx vitest run tests/i18n/

# Run specific test
npx vitest run tests/i18n/resolve-locale.test.ts
npx vitest run tests/i18n/format.test.ts
npx vitest run tests/i18n/normalize.test.ts

# CI gate: message parity
node scripts/i18n-parity.js

# CI gate: Vietnamese hardcode
grep -rn '[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]' --include='*.tsx' apps/web/app apps/web/components && echo "FAIL: Vietnamese hardcode found" || echo "PASS"
```

## Notes

- `next-intl` in non-URL-routing mode reads locale from `getRequestConfig()` — no `[locale]` folder needed
- Font: Plus_Jakarta_Sans already includes `vietnamese` subset — keep it, add `thai` when needed
- Edge middleware: `lib/i18n/config.ts` must be Edge-compatible (no Prisma, no heavy imports)
- Middleware locale detection is "best effort" — full Org/Hotel fallback requires auth context (handled in request.ts via server components)

---
Next Phase: [phase-01-international-surfaces.md](file:///c:/Apps/Antigravity/revenue-management-system/plans/260219-1400-i18n-internationalization/phase-01-international-surfaces.md)
