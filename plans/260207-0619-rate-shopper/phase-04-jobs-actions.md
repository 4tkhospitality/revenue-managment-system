# Phase 04: Backend Jobs & Server Actions

**Status:** ⬜ Pending
**Dependencies:** Phase 03
**Milestone:** M2 — Cron refresh + seeding + fan-out + billing + coalesce audit

## Implementation Steps

### A. Jobs (`lib/rate-shopper/jobs/`)
1. [ ] `RateShopperRefreshJob(cacheKey, triggeringRequestId?)`:
   - Acquire lock + set `refreshing_request_id = triggeringRequestId`
   - Call SerpApi → parse → set `is_vendor_cache_hit`
   - Fan-out CompetitorRate to all matching competitors
   - Billing:
     - `credit_consumed=true` on triggering RateShopRequest (if manual)
     - Coalesced requests: `coalesced_to_request_id` + `credit_consumed=false`
     - Vendor cache hit → all `credit_consumed=false`
     - Conservative fallback: if POC-1 unresolved → all = credit
   - On done: clear `refreshing_request_id`, reset `fail_streak`
   - On error: backoff + clear `refreshing_request_id`

2. [ ] `RateShopperSchedulerJob()`:
   - **Cache seeding (§10.6):** Upsert cache rows for active competitors before selection
   - Selection query (§10.5)
   - Check `safe_mode_on` via `getVNDate()`
   - No RateShopRequest → billing = System Daily only

3. [ ] `MarketSnapshotJob(hotelId, checkInDate)`:
   - **Transactional upsert** (§10.2 CAUTION):
     ```
     $transaction: set is_latest=false → upsert is_latest=true
     ```
   - Tax/fee normalization (§9.6): representative price selection
   - Rounding: `roundVND()` for comp_avg
   - `snapshot_date = getVNDate()` string
   - Confidence: factor in before_tax_ratio

4. [ ] `DataCleanupJob()`:
   - VN timezone cutoffs via `vnTodayMinus(N)`
   - Retention rules per §15 (clarified: 90d = future dates only)

### B. Server Actions
5. [ ] `app/actions/rate-shopper/competitors.ts` — CRUD
6. [ ] `app/actions/rate-shopper/scan.ts`:
   - `triggerManualScan(hotelId)`:
     - Check quota (using `getVNMonth()`)
     - Check `max_scans_per_day` using `requested_date`
     - Create RateShopRequest with `QueryType` enum
     - If cacheKey REFRESHING → set `coalesced_to_request_id` from `refreshing_request_id`
     - Enqueue refresh
   - `getIntraday(hotelId)` — **filter hotel_id** (§11.6)
   - `getDailySnapshot(hotelId)` — **filter hotel_id** (§11.6)
7. [ ] `app/api/rate-shopper/cron/route.ts` — CRON_SECRET + rate limit

### C. Spike Detection
8. [ ] `detectSpike(hotelId, checkInDate)` — using `vnTodayMinus(1)` for day-over-day

### D. Data Access Hardening
9. [ ] All read actions filter `hotel_id` from session
10. [ ] `raw_response` never returned to client
11. [ ] RateShopCache not directly queryable from FE

## Test Criteria

- [ ] Cache seeding: scheduler creates rows for new active competitors
- [ ] `refreshing_request_id` lifecycle: set on lock → cleared on done/fail
- [ ] Coalesced request links correctly via `refreshing_request_id`
- [ ] Transactional snapshot: no duplicate `is_latest=true`
- [ ] Tax normalization in snapshot aggregation
- [ ] Data access hardened: hotel_id filter everywhere
- [ ] Retention cutoffs use VN timezone

---
**Next Phase:** [Phase 05 - Recommendation Engine](./phase-05-recommendation.md)
