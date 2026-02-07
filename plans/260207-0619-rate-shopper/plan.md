# Plan: Rate Shopper Module (v01.4.0)

**Created:** 2026-02-07
**Status:** 🟡 In Progress
**Spec:** [spec-rate-shopper.md](file:///c:/Apps/Antigravity/revenue-management-system/docs/specs/spec-rate-shopper.md)

## Overview

Module so sánh giá khách sạn (My Hotel) với đối thủ (Compset) qua SerpApi Google Hotels.
Kiến trúc: Hybrid Data (Internal BAR + External SerpApi) + Multi-layer Cache + SWR + SaaS Cost Guardrails.

**Phase 1 scope:** Market benchmarking có kiểm soát chi phí. **5 offset points** (7/14/30/60/90 ngày) — chỉ Property Details. Cost: 5 comps × 5 offsets = **25 cacheKeys/hotel**.

## Tech Stack

- **Backend:** Next.js Server Actions + API Routes
- **Database:** PostgreSQL (Supabase) via Prisma
- **External API:** SerpApi (`google_hotels` + `google_hotels_autocomplete`)
- **Charts:** Recharts (5-node step-line)
- **Caching:** DB-based SWR (Stale-While-Revalidate)

## Phases

| Phase | Name | Status | Tasks | Est. |
|-------|------|--------|-------|------|
| 01 | Setup + POC + SerpApi Fixtures | ⬜ Pending | 9 | 1 session |
| 02 | Database Schema + CHECK Constraints | ⬜ Pending | 18 | 1-2 sessions |
| 03 | Backend Services (Parser + Cache + Quota) | ⬜ Pending | 22 | 2 sessions |
| 04 | Backend Jobs & Server Actions | ⬜ Pending | 22 | 2-3 sessions |
| 05 | Recommendation Engine | ⬜ Pending | 8 | 1-2 sessions |
| 06 | Frontend UI | ⬜ Pending | 16 | 2-3 sessions |
| 07 | Integration & Polish | ⬜ Pending | 10 | 1-2 sessions |
| 08 | Testing & Verification | ⬜ Pending | 14 | 1-2 sessions |

**Tổng:** ~119 tasks | Ước tính: 11-17 sessions

## Key Decisions

1. **SerpApi** — nguồn compset duy nhất Phase 1
2. **Global cache** shared giữa tenants — UI data scoped qua `hotel_id`
3. **MarketSnapshot = daily upsert** — transactional, 5 offsets per hotel
4. **Horizon = 5 offset points** (not 90 daily). Chart = 5-node step-line. Full range = Phase 2
5. **Data retention**: "90d" = future dates. Past stays purge 7d. History → MarketSnapshot
6. **FK audit**: `RateShopRequest.cache_key` → `RateShopCache.cache_key`
7. **Dual quota**: `max_manual_scans_per_day` (all requests) vs `quota_cap` (monthly, vendor calls only)
8. **Job schedule**: offsets 7/14 mỗi 30m; 30 mỗi 2h; 60/90 mỗi 6h
9. **Security**: `CRON_SECRET` + rate limit. `raw_response_ref` = signed URL
10. **Timezone**: VN date via `getVNDate()`, string `"YYYY-MM-DD"`, no `CURRENT_DATE`/`new Date()`
11. **VND: Decimal(14,0)** — Rounding: `comp_avg` round half-up. Derived = Decimal(6,4)
12. **Representative price 4-level priority**: total_before_tax → total_lowest → nightly_before_tax×LOS → nightly_lowest×LOS
13. **Tax/fee normalization**: `before_taxes_fees` preferred. `before_tax_ratio ≥ 60%` for HIGH confidence
14. **Fan-out**: refresh → all competitors with same `property_token`
15. **8 Prisma enums** (CacheStatus, AvailabilityStatus, DataConfidence, RequestStatus, RecommendationStatus, DemandStrength, QueryType, Provider)
16. **Coalesce audit**: `refreshing_request_id` on Cache ↔ `coalesced_to_request_id` on Request
17. **Billing**: Scheduler = System Daily always. Coalesce = triggering tenant only. Conservative fallback until POC
18. **Cache seeding**: Scheduler upserts rows for active competitors before selection query
19. **Data access hardening**: `hotel_id` filter everywhere. `raw_response` never to FE
20. **POC checklist**: 4 mandatory questions before Phase 03
21. **CHECK constraints**: `property_token NOT NULL` when PROPERTY_DETAILS + `offset_days IN (7,14,30,60,90)`
22. **IntradayViewModel**: Backend trả view model tenant-scoped (§11.0)

## Milestones

| Milestone | End of | Deliverable |
|-----------|--------|-------------|
| **M0** | Phase 01 | SerpApi POC: sample responses + 4 POC questions answered |
| **M1** | Phase 03 | Parser (4-level price, tax normalize) + Cache + Quota (dual) |
| **M2** | Phase 04 | Seeding + RefreshJob + Snapshot (5 offsets, transactional) + billing |
| **M3** | Phase 06 | UI: 5-node chart + IntradayViewModel + data access hardening |
| **M4** | Phase 07 | Daily snapshot + recommendation + retention cleanup |
| **M5** | Phase 08 | Full test suite |

## Quick Commands

```
Start Phase 1:  /code phase-01
Check progress: /next
Save context:   /save-brain
```
