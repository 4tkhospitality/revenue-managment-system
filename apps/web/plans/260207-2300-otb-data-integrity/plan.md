# Plan: OTB & Data Integrity Critical Fix
Created: 2026-02-07T23:00
Updated: 2026-02-07T23:10 (Auditor feedback incorporated)
Status: ✅ Approved

## Overview
Fix 2 critical OTB bugs (double-counting + ghost cancellations) and harden `ingestCSV`, `engine.ts`, and `middleware.ts` based on external audit.

## 🔒 Policy Decisions (Signed Off)

| Policy | Decision | Rationale |
|--------|----------|-----------|
| **Timezone** | **Option A**: Local midnight (`Asia/Ho_Chi_Minh`) → UTC | Consistent with `Hotel.timezone` field. All `book_time`/`cancel_time` represent "start of local day" stored as UTC. |
| **Revenue** | NET (VND integer) | Signed off in Audit Bundle. |
| **Amendments** | Latest **snapshot** wins (by `snapshot_ts`, NOT `created_at`) | Handles out-of-order imports correctly. |
| **Missing Cancel Date** | **Reject row** | Strict mode. No ghost bookings. |

## Audit Verdict (Accept / Reject / Defer)

### 1. `ingestCSV.ts`

| # | Level | Proposal | Verdict | Rationale |
|---|-------|----------|---------|-----------|
| 1a | P0 | Reject cancelled rows missing `cancel_date` | ✅ **ACCEPT** | Policy signed off. Currently `warn` only → data corruption. |
| 1b | P0 | Map `cancel_date` → `cancel_time`, `booking_date` → `book_time` | ✅ **ACCEPT** | Root cause of ghost bookings. **Timezone: Option A (local midnight).** |
| 1c | P1 | Unique constraint `@@unique([hotel_id, file_hash])` on `ImportJob` | ✅ **ACCEPT** | + **Retry policy**: failed job → allow re-upload (clear + retry). |
| 1d | P1 | Detect duplicate `reservation_id` within same CSV | ✅ **ACCEPT** | `Set` check + throw. |
| 1e | P1 | Money as integer (VND) or Decimal end-to-end | 🔶 **DEFER** | Add `Math.round()` guardrail only. |

### 2. `buildDailyOTB.ts`

| # | Level | Proposal | Verdict | Rationale |
|---|-------|----------|---------|-----------|
| 2a | P0 | Unify cancel filter (event-time: `cancel_time`) | ✅ **ACCEPT** | Chuẩn A (event-time). |
| 2b | P0 | Dedupe by `reservation_id` (latest **snapshot** wins) | ✅ **ACCEPT** | `DISTINCT ON` + `ORDER BY j.snapshot_ts DESC`. |
| 2c | P1 | Add overlap filter in SQL | ✅ **ACCEPT** | Performance. |
| 2d | P1 | Keep `as_of_date` as daily cut-off | ✅ **ACCEPT** | MVP. |
| 2e | P2 | Date-only arithmetic for nights | 🔶 **DEFER** | No DST in VN. |
| 2f | P2 | Revenue split floor for USD | 🔶 **DEFER** | VND-only. |
| 2g | P1 | Add `snapshot_ts` to `ImportJob` | ✅ **ACCEPT** (new) | Prevents out-of-order import from overwriting newer data. Default = `created_at`. |
| 2h | P1 | Tenant join hardening (`j.hotel_id = r.hotel_id`) | ✅ **ACCEPT** (new) | Defense-in-depth for cross-tenant safety. |

### 3. `engine.ts`

| # | Level | Proposal | Verdict | Rationale |
|---|-------|----------|---------|-----------|
| 3a | P1 | `NONE` rounding = no rounding | ✅ **ACCEPT** | Bug confirmed. |
| 3b | P1 | Enforce `validatePromotions()` | ✅ **ACCEPT** | Early return on `!isValid`. |

### 4. `middleware.ts`

| # | Level | Proposal | Verdict | Rationale |
|---|-------|----------|---------|-----------|
| 4a | P1 | Return 401 JSON for `/api/*` | ✅ **ACCEPT** | Currently breaks API clients. |
| 4b | P1 | Per-route hotel_id validation | 🔶 **DEFER** | Separate task. |

---

## Phases

| Phase | Name | Files | Priority | Tasks |
|-------|------|-------|----------|-------|
| 01 | Ingest Hardening | `ingestCSV.ts`, `schema.prisma` | P0 | 6 |
| 02 | OTB Dedup + Cancel Fix | `buildDailyOTB.ts`, `schema.prisma` | P0 | 5 |
| 03 | Pricing & Middleware Polish | `engine.ts`, `middleware.ts` | P1 | 3 |
| 04 | Verify & Rebuild | All + DB | P0 | 5 |

**Total**: 19 tasks | Estimate: 1 session

## Quick Commands
- Start: `/code phase-01`
- Check: `/next`
