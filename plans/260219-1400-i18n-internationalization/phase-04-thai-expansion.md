# Phase 04: Thai Locale Expansion
Status: ⬜ Pending  
Dependencies: Phase 01 (International Surfaces), Phase 03 (Server Text)  
Effort: 1–2 ngày

## Objective

Khi GSA Thái Lan được onboard, thêm tiếng Thái làm locale thứ 3. Đây là validation test cho kiến trúc i18n — nếu kiến trúc đúng, phase này chỉ cần thêm 1 file JSON + config font.

## Requirements

### Functional
- [ ] `th` thêm vào `SUPPORTED_LOCALES`
- [ ] `messages/th.json` đầy đủ keys (dịch từ `en.json`)
- [ ] Thai font renders correctly (Noto Sans Thai fallback)
- [ ] GSA Thái set `Org.default_locale = "th"`
- [ ] Staff KS Thái thấy UI Thai + THB (T1 scenario)
- [ ] GM nước ngoài ở KS Thái thấy UI English + THB (T6 scenario)

### Non-Functional
- [ ] Không cần code change ngoài config
- [ ] Không cần migration ngoài Org data update
- [ ] CI parity check updated cho 3-way (vi/en/th)

## Implementation Steps

### Step 1: Update Locale Config

#### [MODIFY] `lib/i18n/config.ts`

```ts
export const SUPPORTED_LOCALES = ["vi", "en", "th"] as const;
```

One-line change. Everything else auto-follows.

### Step 2: Create Thai Message File

#### [NEW] `messages/th.json`

- Copy structure from `en.json`
- Translate all keys to Thai
- Keep RM acronyms (OTB, STLY, Pace, etc.) as-is

### Step 3: Add Thai Font Fallback

#### [MODIFY] `app/layout.tsx`

```tsx
import { Plus_Jakarta_Sans, Noto_Sans_Thai } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// In body className:
// `${plusJakarta.variable} ${notoSansThai.variable} antialiased`
```

#### [MODIFY] `app/globals.css`

```css
body {
  font-family: var(--font-inter), var(--font-thai), sans-serif;
}
```

### Step 4: Update CI Parity Script

#### [MODIFY] `scripts/i18n-parity.js`

Check 3-way parity: `vi.json` vs `en.json` vs `th.json`

### Step 5: GSA Thai Org Setup

When onboarding the Thai GSA:

```sql
-- Set Thai GSA org defaults
UPDATE organizations SET default_locale = 'th' WHERE id = '<thai_gsa_org_id>';

-- Set billing currency (if different from hotel currency)
UPDATE organizations SET billing_currency = 'USD' WHERE id = '<thai_gsa_org_id>';

-- Thai hotels already have currency = 'THB', timezone = 'Asia/Bangkok'
```

### Step 6: Verification

Manual test checklist:
1. Login as Thai hotel staff → see Thai UI + THB prices
2. Login as foreign GM at Thai hotel → switch to EN → see English UI + THB prices
3. Login as Thai GSA reseller → see commission in billing_currency
4. Check all pages for Thai text rendering (no missing glyphs)
5. Check Telegram notifications for Thai templates

## Files to Create/Modify

| File | Change |
|------|--------|
| `lib/i18n/config.ts` | Add `"th"` to `SUPPORTED_LOCALES` |
| `messages/th.json` | [NEW] Full Thai translations |
| `app/layout.tsx` | Add Noto Sans Thai font |
| `app/globals.css` | Add font fallback |
| `scripts/i18n-parity.js` | 3-way parity check |

## Test Criteria

- [ ] Thai staff login: UI = Thai, currency = THB ✅
- [ ] Foreign GM login: can switch to EN, currency still = THB ✅
- [ ] CI parity: all 3 files (vi/en/th) have identical key sets ✅
- [ ] No missing Thai glyphs on any page ✅
- [ ] Feature flag off → Thai user sees Vietnamese (fallback) ✅

## Notes

- **Translation quality:** Consider professional translator for Thai. Machine translation may miss RM-specific nuances.
- **Font size:** Thai script may render slightly larger — check for layout overflow.
- **Date format:** Thai calendar (Buddhist Era) — `Intl.DateTimeFormat('th', ...)` handles this automatically.
- **This phase validates the architecture:** If it takes more than 1-2 days, something in the foundation is wrong.

---
End of Plan. Return to [plan.md](file:///c:/Apps/Antigravity/revenue-management-system/plans/260219-1400-i18n-internationalization/plan.md)
