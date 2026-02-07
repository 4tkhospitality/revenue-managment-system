# Phase 03: Backend Services — SerpApi + Cache + Parser + Quota

**Status:** ⬜ Pending
**Dependencies:** Phase 02 + POC answers (§18b)
**Milestone:** M1 — SerpApi client + canonical params + cacheKey + parser + `getVNDate()`

## Prerequisite Check

> [!IMPORTANT]
> Phase 03 KHÔNG bắt đầu cho đến khi 4 POC questions (§18b) đã trả lời:
> - POC-1: Vendor cache hit signal
> - POC-2: Sold-out mapping
> - POC-3: Prices schema path verification
> - POC-4: Source normalization

## Implementation Steps

### A. SerpApi Client (`lib/rate-shopper/serpapi-client.ts`)
1. [ ] `fetchAutocomplete(query)` — autocomplete → property_token
2. [ ] `fetchPropertyDetails(params)` — property details with property_token
3. [ ] Error handling: HTTP status, search_metadata.id extraction

### B. Cache Service (`lib/rate-shopper/cache-service.ts`)
4. [ ] `generateCacheKey(params)` — sha256(sortKeys(canonical_params))
5. [ ] `populateMaterializedColumns(params)` — 7 indexed fields
6. [ ] `getCache(cacheKey)` — SWR read (FRESH/STALE/EXPIRED)
7. [ ] `lockAndRefresh(cacheKey, requestId?)` — Atomic lock + set `refreshing_request_id`
8. [ ] `handleRefreshError(cacheKey)` — backoff escalation
9. [ ] On refresh done: clear `refreshing_request_id`

### C. Response Parser (`lib/rate-shopper/parser.ts`)
10. [ ] `parsePropertyDetails(json)` — extract prices as Decimal
11. [ ] `selectRepresentativePrice(prices)` — Tax/fee normalization (§9.6):
    - Priority 1: `before_taxes_fees`
    - Priority 2: `total_rate_lowest` + downgrade confidence
    - Priority 3: `rate_per_night * LOS`
12. [ ] `mapToCompetitorRate(parsed)` — enums: AvailabilityStatus, DataConfidence
13. [ ] `determineAvailability(prices)` — using POC-2 mapping
14. [ ] `roundVND(value)` — round half-up to 0 decimals
15. [ ] `computeBeforeTaxRatio(rates)` — for confidence + UI badge

### D. Quota Service (`lib/rate-shopper/quota-service.ts`)
16. [ ] `checkTenantQuota(hotelId)` — using `getVNMonth()`
17. [ ] `checkSystemBudget()` — using `getVNDate()`
18. [ ] `recordUsage(hotelId, creditConsumed, isScheduler)`:
    - Conservative billing: if POC-1 unresolved → all calls = credit
    - Atomic SQL increment
    - Scheduler → System Daily only

### E. Timezone Utility
19. [ ] `getVNDate()`, `getVNMonth()`, `vnTodayMinus(n)`

### F. Source Normalizer
20. [ ] `normalizeOTASource(source)` — using POC-4 results

## Test Criteria

- [ ] Tax/fee normalization: prefer before_tax when available
- [ ] before_tax_ratio computed + logged
- [ ] Rounding: VND integers only
- [ ] All enum values (no strings)
- [ ] Timezone: correct at UTC+7 boundary
- [ ] Atomic quota increment
- [ ] Conservative billing when vendor cache hit unknown
- [ ] lock sets `refreshing_request_id`, release clears it

---
**Next Phase:** [Phase 04 - Jobs & Actions](./phase-04-jobs-actions.md)
