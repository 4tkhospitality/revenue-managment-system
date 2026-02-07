# Phase 01: Setup & Dependencies

**Status:** ⬜ Pending
**Dependencies:** None

## Objective

Cài đặt dependencies, cấu hình environment, chuẩn bị folder structure cho Rate Shopper module.

## Implementation Steps

1. [ ] Thêm `SERPAPI_API_KEY` vào `.env.example` và `.env.local`
2. [ ] Tạo folder structure:
   - `lib/rate-shopper/` (services)
   - `app/actions/rate-shopper/` (server actions)
   - `app/api/rate-shopper/` (API routes)
   - `app/pricing/competitors/` (UI page)
   - `components/pricing/` (UI components)
3. [ ] Tạo `lib/rate-shopper/types.ts` — shared TypeScript interfaces
4. [ ] Tạo `lib/rate-shopper/constants.ts` — horizons, TTL, thresholds defaults
5. [ ] Tạo `lib/rate-shopper/index.ts` — barrel export

## Files to Create

| File | Purpose |
|------|---------|
| `lib/rate-shopper/types.ts` | CanonicalParams, SerpApiResponse, CacheStatus, etc. |
| `lib/rate-shopper/constants.ts` | HORIZONS, TTL_MAP, ALERT_THRESHOLDS, QUOTA_DEFAULTS |
| `lib/rate-shopper/index.ts` | Barrel exports |

## Test Criteria

- [ ] `npm run dev` vẫn chạy bình thường
- [ ] Folder structure đã tạo xong
- [ ] Env var `SERPAPI_API_KEY` documented

---
**Next Phase:** [Phase 02 - Database Schema](./phase-02-database.md)
