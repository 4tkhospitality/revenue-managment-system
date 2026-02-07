# Phase 02: Database Schema

**Status:** ⬜ Pending
**Dependencies:** Phase 01 (POC answers needed for enum mapping)

## Objective

Tạo 8 Prisma enums + 8 models + 2 usage metering tables + partial unique index + utility helpers.

## Implementation Steps

### A. Prisma Enums
1. [ ] Define 8 enums: `CacheStatus`, `AvailabilityStatus`, `DataConfidence`, `RequestStatus`, `RecommendationStatus`, `DemandStrength`, `QueryType`, `Provider`

### B. Prisma Models
2. [ ] `Competitor` — compset CRUD (google_place_id, property_token, tier)
3. [ ] `RateShopCache` — global cache:
   - `query_type` = `QueryType` enum, `provider` = `Provider` enum
   - Materialized columns (7 fields)
   - `refreshing_request_id String? @db.Uuid` — coalesce audit (set when lock acquired, clear on done/fail)
   - 7 indexes (incl. composite scheduler, check_out_date)
4. [ ] `RateShopRequest` — tenant audit log:
   - `requested_date @db.Date` — set by `getVNDate()` for max_scans_per_day
   - `credit_consumed Boolean @default(false)`
   - `coalesced_to_request_id String? @db.Uuid`
5. [ ] `CompetitorRate` — parsed prices **Decimal(14,0)** (VND)
6. [ ] `MarketSnapshot` — daily snapshot **Decimal(14,0)**
   - `snapshot_date` set by code — **NO** `dbgenerated("CURRENT_DATE")`
   - Transactional upsert required for `is_latest` flip
7. [ ] `RateShopRecommendation` — decision support
8. [ ] `RateShopUsageDaily` — system daily budget
9. [ ] `RateShopUsageTenantMonthly` — tenant monthly quota
10. [ ] Hotel model update — add relations

### C. SQL Migration
11. [ ] Partial unique index on MarketSnapshot
12. [ ] Verify all indexes created

### D. Utility Helpers
13. [ ] `lib/rate-shopper/timezone.ts` — `getVNDate()`, `getVNMonth()`, `vnTodayMinus(n)`
14. [ ] Verify all `@db.Date` columns use string insertion

### E. Schema Verification
15. [ ] `npx prisma migrate dev` runs clean
16. [ ] All 10 tables + 8 enums + 7 indexes verified

## Key Rules

| Rule | Detail |
|------|--------|
| Money | `Decimal(14,0)` VND |
| Rounding | `comp_avg` round half-up 0 dec |
| Enums | 8 total, all Prisma-native |
| Timezone | String `"YYYY-MM-DD"` only |
| Coalesce | `refreshing_request_id` on Cache + `coalesced_to_request_id` on Request |
| Snapshot | Transactional upsert for `is_latest` |

---
**Next Phase:** [Phase 03 - Backend Services](./phase-03-services.md)
