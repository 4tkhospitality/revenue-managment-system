# Functional Specification Document (FSD)
# 4TK Hospitality — Revenue Management System
# Module: Analytics Layer (OTB, Features, Backfill)

**Version:** 2.0 | **Updated:** 2026-02-14

---

## 1. Overview

The Analytics Layer transforms raw reservation data into actionable time-series metrics for hotel General Managers and Directors of Sales & Marketing. It operates on the principle of **time-travel semantics**: every metric is computed relative to an `as_of_date` (snapshot date), enabling historical comparison of "what we knew then."

## 2. Core Concepts

### 2.1 OTB (On-The-Books) Snapshot

An OTB snapshot represents the hotel's booking state **as known on a specific date**. For each `(as_of_date, stay_date)` pair, we store:
- `rooms_otb`: Total rooms booked for that stay date
- `revenue_otb`: Total allocated revenue

**Time-travel rule:** A reservation is "active" at snapshot `T` if `booking_date <= T` AND (`cancel_date IS NULL` OR `cancel_date > T`).

### 2.2 Features Daily

Derived analytics built from multiple OTB snapshots:

| Feature | Formula | Source |
|---------|---------|--------|
| **Pickup T-N** | `OTB[today].rooms - OTB[today-N].rooms` for same stay_date | 2 OTB snapshots |
| **STLY** | Same-time-last-year OTB comparison (D-364 ±7d DOW match) | OTB snapshot ~1yr ago |
| **Pace vs LY** | `rooms_otb - stly_rooms_otb` | Current OTB + STLY |
| **DOD** | Day-over-day change (OTB today vs yesterday) | 2 consecutive snapshots |
| **Remaining Supply** | `capacity - rooms_otb` | Hotel config + OTB |

### 2.3 OTB Snapshot Policy (3-Tier)

To ensure all metrics have reference data, snapshots are created at 3 frequencies:

| Tier | Cadence | Window | Purpose |
|------|---------|--------|---------|
| A | **Daily** | 35 days from latest booking | T-3/T-5/T-7 exact match |
| B | **Weekly** | 450 days (~15 months) | T-15/T-30 + STLY (D-364 ±7d) |
| C | **Monthly** EOM | Before 450-day window | Long-range STLY fallback |

**Retention:** No purge within 15 months. STLY requires snapshot data near D-364.

## 3. Functional Requirements

### 3.1 OTB Build (`buildDailyOTB`)
- **Input:** hotelId, asOfTs (snapshot date), stayDateFrom/To
- **Process:** Deduplicate reservations → expand to room-nights → aggregate by stay_date → upsert into `daily_otb`
- **Output:** { success, daysBuilt, totalRoomsOtb }

### 3.2 Features Build (`buildFeaturesDaily`)
- **Input:** hotelId, asOfDate, skipValidation
- **Process:** SQL CTEs joining current OTB with historical snapshots via LATERAL nearest-neighbor
- **Pickup windows:** T-7 (±3d), T-5 (±2d), T-3 (±1d), T-15 (±4d), T-30 (±5d)
- **STLY:** D-364 ±7d with DOW (day-of-week) alignment
- **Output:** Upserts into `features_daily` via ON CONFLICT

### 3.3 Backfill API (`POST /api/analytics/backfill`)
- **Input:** `{ cursor?, batchSize?, mode: "smart"|"force" }`
- **Smart-skip:** Compare `COUNT(stay_date) + SUM(revenue_otb)` between `daily_otb` and `features_daily`. Mismatch → rebuild.
- **Cursor:** Stateless `lastAsOfDate` ISO string. Server: `WHERE as_of_date > cursor ORDER ASC LIMIT batchSize`.
- **Output:** `{ built, skipped, total, nextCursor, done }`

### 3.4 Rebuild All OTB (`rebuildAllOTB`)
- Generates snapshots per 3-tier policy
- Skips existing dates (idempotent)
- One-click pipeline for onboarding

### 3.5 Analytics API (`GET /api/analytics/features`)
- Returns rows + KPIs + quality metrics + dates-to-watch
- Fallback: if no `features_daily` for requested date, returns OTB-only data with `warning: 'NO_FEATURES_FOR_DATE'`
- Caching: 10-min in-memory TTL, skip cache for fallback data

### 3.6 Inline Build UI (`BuildFeaturesInline`)
- Banner shown when warning detected
- 3 actions: Build single date, Build all (smart), Rebuild (force) in overflow menu
- Progress bar with batch progress + Stop button

## 4. User Stories

| # | As a... | I want to... | So that... |
|---|---------|--------------|------------|
| US1 | GM | See pickup for any historical date | I can track booking momentum over time |
| US2 | GM | Upload bulk historical data and see full analytics | I can evaluate the RMS before purchasing |
| US3 | DOSM | Compare OTB vs same time last year | I can identify pace issues early |
| US4 | GM | Click "Build" from the analytics page | I don't need to navigate to a separate page |
| US5 | GM | See progress when building features | I know the system is working, not stuck |
