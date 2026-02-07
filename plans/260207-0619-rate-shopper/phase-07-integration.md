# Phase 07: Integration & Polish

**Status:** ⬜ Pending
**Dependencies:** Phase 06
**Milestone:** M4 — Daily snapshot job + recommendation persisted + retention cleanup + observability logging

## Objective

Kết nối tất cả components, cấu hình cron jobs, thêm observability logging, và polish UX.

## Implementation Steps

### A. Cron Endpoints Configuration
1. [ ] `app/api/rate-shopper/cron/route.ts` — finalize all schedules:
   - Scheduler: offset buckets 7/14 (30m), 30 (2h), 60/90 (6h)
   - Snapshot: 23:00 VN (16:00 UTC)
   - Cleanup: 03:00 VN (20:00 UTC)
   - All protected by `CRON_SECRET` (§10.4)

### B. Observability Logging (§16.1)
2. [ ] `lib/rate-shopper/logger.ts` — structured logging helper:
   ```typescript
   logger.info('rate_shopper.refresh', {
     cache_key, hotel_id, query_type,
     cache_hit, vendor_cache_hit,
     duration_ms, serpapi_search_id,
     http_status, error_message, result_count
   });
   ```
3. [ ] Add logging to refresh job, snapshot job, cleanup job
4. [ ] Phase 1: Vercel function logs + RateShopRequest table as audit trail
5. [ ] Metrics queries: `getCacheHitRate()`, `getSearchesUsage()`, `getRefreshStats()`, `getStampedeCoalesceRate()`

### C. Dashboard Overview Widget
6. [ ] Add Rate Shopper summary card to main `/dashboard`:
   - "My Rate vs Market" mini indicator
   - Active alerts count
   - Link to `/pricing/rate-shopper`

### D. Permissions
7. [ ] Update `lib/permissions.ts` — viewer can read rate shopper, manager+ can scan/config

### E. Polish
8. [ ] Loading states, error boundaries
   - Graceful degradation when SerpApi key missing
   - Connection error handling with retry

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `lib/rate-shopper/logger.ts` | **NEW:** Structured logging |
| `lib/rate-shopper/metrics.ts` | **NEW:** Observability queries |
| `app/api/rate-shopper/cron/route.ts` | **MODIFY:** finalize schedules |
| `lib/permissions.ts` | **MODIFY:** add rate-shopper permissions |

## Test Criteria

- [ ] Cron endpoints trigger correct jobs at correct VN times
- [ ] Cron rejects requests without valid CRON_SECRET
- [ ] Structured logs emitted on every refresh (with all required fields)
- [ ] Metrics queries return meaningful data from RateShopRequest table
- [ ] Dashboard widget shows summary
- [ ] Permission checks work (viewer vs manager)

---
**Next Phase:** [Phase 08 - Testing & Verification](./phase-08-testing.md)
