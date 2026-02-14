# Software Requirements Specification (SRS)
# 4TK Hospitality — Revenue Management System
# Module: Analytics Layer

**Version:** 2.0 | **Updated:** 2026-02-14

---

## 1. System Overview

The Analytics Layer is a subsystem of the 4TK RMS that computes time-series booking metrics from raw reservation data. It operates as a batch processing pipeline: `reservations_raw → daily_otb → features_daily → API → Dashboard`.

## 2. System Interfaces

### 2.1 Internal APIs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/analytics/features` | GET | Session (hotel cookie) | Fetch analytics for dashboard |
| `/api/analytics/backfill` | POST | Session | Batch-build features with cursor |

### 2.2 Server Actions (Next.js)

| Action | Module | Description |
|--------|--------|-------------|
| `buildDailyOTB` | `app/actions/buildDailyOTB.ts` | Build OTB snapshot for a date |
| `rebuildAllOTB` | `app/actions/buildDailyOTB.ts` | Build all OTB per 3-tier policy |
| `buildFeaturesDaily` | `app/actions/buildFeaturesDaily.ts` | Build features for a snapshot |

### 2.3 Database Tables

| Table | Type | PK |
|-------|------|-----|
| `daily_otb` | Fact | `[hotel_id, as_of_date, stay_date]` |
| `features_daily` | Derived Fact | `[hotel_id, as_of_date, stay_date]` |
| `reservations_raw` | Source Fact | `[hotel_id, reservation_id, job_id]` |

## 3. Functional Specifications

### 3.1 OTB Build Algorithm

```
INPUT: hotelId, asOfTs, stayDateFrom, stayDateTo

1. Query reservations_raw WHERE:
   - hotel_id = hotelId
   - booking_date <= asOfTs
   - (cancel_date IS NULL OR cancel_date > asOfTs)
   - status = 'booked'
   
2. Deduplicate by reservation_id (latest version per job_id)

3. Expand each reservation to room-nights:
   FOR each night in [arrival_date, departure_date):
     revenue_per_night = floor(total_revenue / nights)
     last_night_adjustment = remainder
     
4. Aggregate by stay_date:
   rooms_otb = SUM(rooms)
   revenue_otb = SUM(revenue_per_night)
   
5. UPSERT into daily_otb ON CONFLICT (hotel_id, as_of_date, stay_date)
```

### 3.2 3-Tier Snapshot Policy

```
INPUT: hotelId, minBookingDate, latestBookingDate

Tier C (Monthly): generate_series(minBookingDate, latestBookingDate - 450d, '1 month')  
  → LEAST(end_of_month, latestBookingDate)
  
Tier B (Weekly): generate_series(latestBookingDate - 450d, latestBookingDate - 35d, '7 days')

Tier A (Daily): generate_series(latestBookingDate - 35d, latestBookingDate, '1 day')

DEDUP: Skip dates already in daily_otb for this hotel
MERGE: Union all tiers, sort ASC, build sequentially
```

### 3.3 Features Build SQL (Simplified)

```sql
WITH current_otb AS (
  -- OTB for this snapshot date, stay_date >= as_of_date
),
stly_data AS (
  -- LATERAL: nearest OTB at D-364 ±7d with DOW match
),
pace_data AS (
  -- LATERAL nearest-neighbor for T-30 (±5d), T-15 (±4d), 
  -- T-7 (±3d), T-5 (±2d), T-3 (±1d)
  -- deltaDays scaling: pickup = (current - reference) / deltaDays * targetDays
)
INSERT INTO features_daily (...)
SELECT ... FROM current_otb JOIN stly_data JOIN pace_data
ON CONFLICT (hotel_id, as_of_date, stay_date) DO UPDATE
```

### 3.4 Backfill Smart-Skip

```sql
-- For each as_of_date, compare OTB vs features:
SELECT COUNT(*)::int as cnt, SUM(revenue_otb)::text as rev_sum
FROM daily_otb WHERE hotel_id = $1 AND as_of_date = $2

SELECT COUNT(*)::int as cnt, SUM(revenue_otb)::text as rev_sum  
FROM features_daily WHERE hotel_id = $1 AND as_of_date = $2

-- If cnt match AND rev_sum match → SKIP (data is fresh)
-- If mismatch → REBUILD (partial build or data changed)
```

### 3.5 API Response Schema

```typescript
interface AnalyticsResponse {
  hotelName: string;
  capacity: number;
  asOfDate: string;           // ISO date
  asOfDates: string[];        // All available snapshot dates
  rows: AnalyticsRow[];       // Per stay_date metrics
  kpi: AnalyticsKpi;          // Aggregated KPIs
  quality: AnalyticsQuality;  // Data completeness metrics
  datesToWatch: DateToWatch[]; // Top 5 concerning dates
  warning?: 'NO_FEATURES_FOR_DATE';  // OTB-only fallback
  hint?: string;              // Human-readable explanation
  latestAvailable?: string;   // Latest date with features
}
```

## 4. Constraints

| Constraint | Value |
|------------|-------|
| Max batch size | 30 dates per API call |
| Cache TTL | 10 minutes |
| Max stay_date horizon | stay_date >= as_of_date only |
| Pickup NULL policy | Never coalesce to 0; NULL = missing reference |
| STLY DOW alignment | ±7 days from D-364, same day-of-week |
| Revenue precision | Decimal(15,2) in database, Number in API |

## 5. Error Handling

| Scenario | Behavior |
|----------|----------|
| No OTB data for hotel | 404 with hint to upload + build |
| No features for date | 200 with OTB-only fallback + warning |
| Build fails mid-batch | Skip date, continue batch, report skipped count |
| Concurrent builds | ON CONFLICT upsert (race-safe) |
| Browser abort during batch | Server completes current batch, UI stops polling |
