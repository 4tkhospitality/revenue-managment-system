# Phase 08: Testing & Verification

**Status:** ⬜ Pending
**Dependencies:** Phase 07
**Milestone:** M5 — Test suite pass + verification checklist pass

## Objective

End-to-end verification của toàn bộ Rate Shopper module against Acceptance Criteria (§18 in spec).

## Implementation Steps

### A. POC Scripts
1. [ ] `scripts/test-serpapi.ts` — verify API key + property details response structure
2. [ ] `scripts/test-cache.ts` — verify cache hit/miss/SWR behavior + atomic lock

### B. E2E Verification (Manual)
3. [ ] **DB Migration:** Verify 6 tables exist, `snapshot_date` default = `CURRENT_DATE`, FK `cache_key`
4. [ ] **Competitor CRUD:**
   - Autocomplete search at `/pricing/competitors` → add → verify saved
   - Edit tier → verify. Toggle active → verify.
5. [ ] **Manual Scan:**
   - Click "Scan Now" at `/pricing/rate-shopper` → verify RateShopRequest (FK to cache)
   - Wait → verify cache + CompetitorRate populated
   - Verify intraday view updates immediately
6. [ ] **Cache SWR:**
   - Immediate re-scan → hit cache (0 API calls)
   - Wait TTL → STALE badge → auto-refresh on next scheduler
7. [ ] **Atomic Lock:**
   - Simulate concurrent scans → verify only 1 refresh (SQL-level lock)
   - Second request → "already refreshing" response
8. [ ] **Error Backoff:**
   - Simulate SerpApi 429 → verify 5m backoff → no retry within window
   - 3x fail → verify FAILED_PERMANENT + admin alert
9. [ ] **Batch Selection:**
   - Create mix of FAILED/STALE/FRESH keys
   - Run scheduler → verify FAILED picked first, then by expires_at ASC
   - Verify batch limit (env: `RATE_SHOPPER_BATCH_LIMIT`)
10. [ ] **Quota Enforcement:**
    - Exceed `max_searches_per_month` → "Scan Now" disabled
11. [ ] **Spike Detection (Day-over-Day):**
    - Create 2 snapshots consecutive days → verify spike alert at ≥ 8% median change
12. [ ] **Data Retention:**
    - Run cleanup → verify `check_in_date < CURRENT_DATE - 7d` purged (including latest)
    - Verify non-latest snapshots > 3d purged
    - Verify latest snapshots within [-7d, +120d] kept
13. [ ] **Cron Security:**
    - Call cron without CRON_SECRET → 401/403
    - Call with valid CRON_SECRET → 200 + job runs

### C. Acceptance Criteria Check (§18)

- [ ] ✅ UI không phát sinh SerpApi call trực tiếp
- [ ] ✅ Cùng params trong TTL → 0 API call mới
- [ ] ✅ Lock chống stampede hoạt động (atomic SQL)
- [ ] ✅ Quota tenant + system budget cap + safe mode
- [ ] ✅ Dashboard hiển thị "as-of timestamp" + status badges
- [ ] ✅ Dashboard hỗ trợ 2 data layer: Intraday + Daily
- [ ] ✅ MarketSnapshot cho offsets 7/14/30/60/90 với day-over-day spike
- [ ] ✅ Alert rules hoạt động đúng
- [ ] ✅ Recommendation có reason_codes và guardrails
- [ ] ✅ Data retention cleanup hoạt động (purge by check_in_date + age)
- [ ] ✅ Observability logging emitted (structured logs + RateShopRequest)
- [ ] ✅ Cron endpoints protected by CRON_SECRET + rate limit

---
**All phases complete! 🎉**
