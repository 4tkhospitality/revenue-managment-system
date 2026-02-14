# Product Requirements & Functional Requirements Document
# 4TK Hospitality — Revenue Management System
# Module: Analytics Layer

**Version:** 2.0 | **Updated:** 2026-02-14

---

## 1. Product Vision

Enable hotel operators to trust historically backfilled analytics by providing transparent, accurate time-series metrics that work from the moment data is uploaded, even for bulk historical imports.

## 2. Target Users

| Persona | Role | Key Need |
|---------|------|----------|
| **GM** | General Manager | Quick overview of booking health — occ, pickup, pace trends |
| **DOSM** | Director of Sales & Marketing | Detailed pace vs LY, channel performance, booking curves |
| **Revenue Manager** | Pricing Analyst | Data quality signals, supply management, pricing recommendations |

## 3. Business Requirements

### BR1: Retroactive Analytics
- Upload historical CSV data → system auto-generates OTB snapshots and analytics features
- KS should see "complete" analytics dashboard after upload + single click ("Build All")

### BR2: Data Trust
- Metrics must be NULL (not zero) when reference data is missing
- UI must explain WHY a metric is empty (e.g., "Thiếu OTB snapshot tại D-7")
- Stale detection prevents serving outdated features after data re-import

### BR3: Performance
- Batch processing with progress feedback
- No request timeouts (cursor-based pagination)
- Cache common queries (10-min TTL)

## 4. Functional Requirements

### FR1: OTB Snapshot Generation
| ID | Requirement | Priority |
|----|-------------|----------|
| FR1.1 | Build OTB for any `as_of_date` within data range | P0 |
| FR1.2 | 3-tier snapshot policy: daily 35d + weekly 450d + monthly older | P0 |
| FR1.3 | Skip existing dates for idempotency | P0 |
| FR1.4 | Retention ≥ 15 months (no auto-purge within STLY window) | P0 |

### FR2: Features Build
| ID | Requirement | Priority |
|----|-------------|----------|
| FR2.1 | Pickup T-3/T-5/T-7/T-15/T-30 with nearest-neighbor fallback | P0 |
| FR2.2 | STLY with DOW alignment (D-364 ±7d) | P0 |
| FR2.3 | Pace vs LY = rooms_otb - stly_rooms_otb | P0 |
| FR2.4 | DOD delta (day-over-day room/revenue change) | P0 |
| FR2.5 | Remaining supply = capacity - rooms_otb | P0 |

### FR3: Backfill API
| ID | Requirement | Priority |
|----|-------------|----------|
| FR3.1 | Smart-skip mode: COUNT + SUM(revenue_otb) stale detection | P0 |
| FR3.2 | Force mode: rebuild all regardless of existing data | P0 |
| FR3.3 | Stateless cursor pagination (ISO date string) | P0 |
| FR3.4 | Batch size configurable (default 7, max 30) | P0 |

### FR4: UI
| ID | Requirement | Priority |
|----|-------------|----------|
| FR4.1 | Inline banner when features missing for selected date | P0 |
| FR4.2 | "Build single date" instant action | P0 |
| FR4.3 | "Build all" with progress bar and stop button | P0 |
| FR4.4 | "Force rebuild" in overflow menu | P0 |
| FR4.5 | Auto-refetch analytics after build completes | P0 |

## 5. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR1 | Build single date response time | < 3 seconds |
| NFR2 | Backfill batch (7 dates) response time | < 10 seconds |
| NFR3 | Total OTB volume per hotel (all tiers) | < 50K rows |
| NFR4 | API cache TTL | 10 minutes |
| NFR5 | No data purge within STLY window | 450 days / 15 months |

## 6. Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| AC1 | Old snapshot no features | Banner + OTB data shown, Pickup = null |
| AC2 | Build single date | Features appear with pickup/pace values |
| AC3 | Backfill batched | Progress `n/total`, can Stop |
| AC4 | Re-upload + force | Numbers update, not skipped |
| AC5 | Weekly OTB created | Pickup T-7 not null |
| AC6 | Backtrack D-60 | Pickup T-30 not null |
| AC7 | STLY available | Pace vs LY not null (weekly 450d covers D-364) |
