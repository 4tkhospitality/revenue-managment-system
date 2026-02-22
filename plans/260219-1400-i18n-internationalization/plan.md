# Plan: RMS Internationalization (i18n)
Created: 2026-02-19  
Status: 🟡 Planning  
BRIEF: [BRIEF-i18n.md](file:///c:/Apps/Antigravity/revenue-management-system/docs/BRIEF-i18n.md)

## Overview

Thêm multi-language support cho RMS để đánh thị trường quốc tế (GM/DOSM nước ngoài + khách sạn ngoài VN). Sử dụng `next-intl` với cookie-based locale (không đổi URL), tách biệt locale/currency/timezone.

## Tech Stack

- **i18n Library:** `next-intl` (Next.js App Router native)
- **Locale Storage:** Cookie `rms_locale` + `User.locale` in DB
- **Validation:** Zod (BCP-47 / ISO 4217)
- **Test:** Vitest (existing)
- **CI:** Custom scripts (`i18n-parity.js`, Vietnamese hardcode detector)

## Architecture Principles

1. 🔒 **Server trả `reason_code` + `params`** — UI tự dịch (IRON RULE)
2. 🌐 **Locale ≠ Currency ≠ Timezone** — 3 dimensions độc lập
3. 📏 **BCP-47 / ISO 4217 / IANA** — chuẩn hoá data
4. 🔄 **5-level fallback:** `User.locale → Hotel.default_locale → Org.default_locale → Accept-Language → "vi"`
5. 🍪 **DB = source of truth**, cookie = cache
6. 🚩 **Feature flag** `i18n_enabled` — safe rollout + instant rollback

## Phases

| Phase | Name | Status | Progress | Effort |
|-------|------|--------|----------|--------|
| 00 | Foundation & Infrastructure | ⬜ Pending | 0% | 2–3 ngày |
| 01 | International-ready Surfaces | ⬜ Pending | 0% | 5–7 ngày |
| 02 | Long Tail UI | ⬜ Pending | 0% | 5–8 ngày |
| 03 | Server-generated Text | ⬜ Pending | 0% | 3–5 ngày |
| 04 | Thai Locale Expansion | ⬜ Pending | 0% | 1–2 ngày |

**Tổng:** ~85 tasks | Ước tính: 16–25 ngày

## Key Files

| File | Purpose |
|------|---------|
| `apps/web/middleware.ts` | Locale detection + cookie |
| `apps/web/next.config.ts` | next-intl plugin |
| `apps/web/app/layout.tsx` | NextIntlClientProvider |
| `apps/web/app/providers.tsx` | Provider wrapper |
| `apps/web/lib/i18n/` | Config, formatters, types |
| `apps/web/messages/` | vi.json, en.json |
| `apps/web/prisma/schema.prisma` | locale/billing fields |
| `apps/web/scripts/i18n-parity.js` | CI gate script |

## Quick Commands

- Start Phase 0: `/code phase-00`
- Check progress: `/next`
- Save context: `/save-brain`
