# Phase 01: Cancel Rate Statistics Engine
Status: ⬜ Pending
Dependencies: P0 complete (✅)

## Objective

Build a **statistical cancel rate model** using historical data in `reservations_raw`. Output: `expected_cxl_rooms` per (stay_date, segment) that feeds into RemSupply and forecast.

> [!IMPORTANT]
> **C1 FIX (BA Review)**: All cancel rates computed in **rooms** (not room_nights) to match existing pipeline unit. `buildFeatures.ts` L288 uses `rooms_otb` per stay_date.
> 
> **C3 FIX**: Bayesian smoothing for low-sample buckets. Rate clamped [0, 0.8].
> 
> **C4 FIX**: `DIRECT` segment added. HOSTELWORLD → OTA. UNKNOWN% monitoring.

## How It Works

### Data Source
- `reservations_raw` already has: `book_time`, `cancel_time`, `arrival_date`, `segment`, `rooms`
- Cancel event = when `cancel_time IS NOT NULL`
- **Unit = rooms per reservation** (not room_nights — aligned with `daily_otb.rooms_otb`)
- `booking_lead_days` = `arrival_date - book_time::date` (days between booking and check-in)

> [!NOTE]
> **Terminology (Polish #1)**: Two distinct "lead-time" concepts exist. They are NOT interchangeable:
> - `booking_lead_days` = `arrival_date - book_time::date` — used for **cancel stats bucketing** (how far before arrival was it booked?)
> - `days_to_stay` = `stayDate - asOfDate` — used at **runtime** by `getExpectedCancelRooms()` (how far from today is this stay_date?)
> 
> Both are valid dimensions. P1 uses `booking_lead_days` for building stats (because cancellation patterns correlate with booking lead). Runtime lookup uses `days_to_stay` to pick the right bucket (because the relevant question at decision-time is "how far out is this date?").

### Bucketing Dimensions
For each hotel, compute cancel rates grouped by:

| Dimension | Buckets | Rationale |
|-----------|---------|-----------|
| **booking_lead_days** | 0-3d, 4-7d, 8-14d, 15-30d, 31-60d, 61d+ | Short-notice vs far-out booking patterns |
| **DOW** | Mon-Sun (0-6) | Weekend stays cancel differently |
| **Season** | Peak/Shoulder/Off-Peak (from `seasons` table) | Seasonal patterns |
| **Segment** | OTA/AGENT/DIRECT/UNKNOWN | OTA cancels more than direct |

### Formula (C1: rooms-weighted, stay_date-exploded)
```sql
-- Explode reservations to per-stay-date grain (matching daily_otb)
WITH exploded AS (
  SELECT
    r.hotel_id, r.rooms, r.segment, r.book_time, r.cancel_time,
    r.arrival_date, d.stay_date,
    (r.arrival_date - r.book_time::date) AS booking_lead_days,
    CASE WHEN r.cancel_time IS NOT NULL THEN r.rooms ELSE 0 END AS cancelled_rooms
  FROM reservations_raw r
  CROSS JOIN generate_series(r.arrival_date, r.departure_date - INTERVAL '1 day', '1 day') AS d(stay_date)
  WHERE r.book_time IS NOT NULL
)
SELECT
  booking_lead_bucket, dow, season_label, segment,
  SUM(rooms) AS total_rooms,
  SUM(cancelled_rooms) AS cancelled_rooms,
  SUM(cancelled_rooms)::float / NULLIF(SUM(rooms), 0) AS raw_cancel_rate
FROM exploded
GROUP BY booking_lead_bucket, dow, season_label, segment;
```

**Why explode?** `reservations_raw` stores 1 row per reservation spanning `arrival_date → departure_date`. But `daily_otb.rooms_otb` counts rooms **per stay_date**. Without explosion, a 3-night booking counts as 1 unit instead of 3 room-dates — causing unit mismatch with the rest of the pipeline.

### Bayesian Smoothing (C3)
```typescript
function smoothRate(bucketRate: number, bucketN: number, parentRate: number): number {
  const MAX_RATE = 0.8;  // Hard cap
  const PRIOR_WEIGHT = 20; // Bayesian prior
  const blended = (bucketRate * bucketN + parentRate * PRIOR_WEIGHT) / (bucketN + PRIOR_WEIGHT);
  return Math.min(MAX_RATE, Math.max(0, blended));
}
```

Fallback hierarchy: `segment+season+dow+leadtime → segment+season+leadtime → segment+leadtime → ALL+leadtime → global 15%`

### Output
```typescript
interface CancelRateBucket {
  hotel_id: string;
  booking_lead_bucket: string;  // '0-3d' | '4-7d' | ... (arrival - book_time)
  dow: number;                  // 0-6
  season_label: string;         // 'Peak' | 'Shoulder' | 'Off-Peak'
  segment: string;              // 'OTA' | 'AGENT' | 'DIRECT' | 'UNKNOWN'
  cancel_rate: number;          // 0.0 - 0.8 (smoothed + clamped)
  raw_rate: number;             // before smoothing
  total_rooms: number;          // SUM(rooms) in this bucket (stay_date-exploded)
  cancelled_rooms: number;      // SUM(rooms where cancel_time IS NOT NULL)
  confidence: 'high' | 'medium' | 'low';  // based on total_rooms
  mapping_version: string;      // segment mapping audit trail
  computed_at: Date;
}
```

Confidence levels (based on `total_rooms` not booking count):
- `high`: total_rooms ≥ 200
- `medium`: total_rooms 50-199
- `low`: total_rooms < 50

## Implementation Steps

### 1. New DB Table: `cancel_rate_stats`

```prisma
model CancelRateStats {
  id                String   @id @default(uuid()) @db.Uuid
  hotel_id          String   @db.Uuid
  booking_lead_bucket String   // '0-3d', '4-7d', '8-14d', '15-30d', '31-60d', '61d+'
  dow               Int      // 0=Sun, 1=Mon, ... 6=Sat
  season_label      String   // 'peak', 'shoulder', 'off_peak', 'default'
  segment           String   // 'OTA', 'AGENT', 'DIRECT', 'UNKNOWN', 'ALL'
  cancel_rate       Float    // 0.0 - 0.8 (smoothed + clamped)
  raw_rate          Float    // before Bayesian smoothing
  total_rooms       Int      // SUM(rooms) — stay_date-exploded grain
  cancelled_rooms   Int      // SUM(cancelled rooms)
  confidence        String   // 'high', 'medium', 'low'
  mapping_version   String   @default("v1") // segment mapping version
  // Training window metadata (Fix #4)
  window_start      DateTime @db.Date       // earliest book_time in training set
  window_end        DateTime @db.Date       // latest book_time in training set
  data_row_count    Int                     // total exploded rows in training set
  unknown_pct       Float    @default(0)    // % UNKNOWN segment rows
  computed_at       DateTime @default(now())
  hotel             Hotel    @relation(fields: [hotel_id], references: [hotel_id])

  @@unique([hotel_id, booking_lead_bucket, dow, season_label, segment])
  @@index([hotel_id])
  @@map("cancel_rate_stats")
}
```

### 2. Server Action: `buildCancelStats(hotelId)`

```
File: apps/web/app/actions/buildCancelStats.ts
```

- Query `reservations_raw` with `generate_series()` explosion per stay_date
- `SUM(rooms)` per bucket — NOT `COUNT(reservations)` (rooms-weighted)
- GROUP BY booking_lead_bucket × dow × season × segment
- Apply Bayesian smoothing: `smoothRate(raw, N, parentRate)` with PRIOR_WEIGHT=20
- Clamp all rates to [0, 0.8]
- Calculate cancel rate per bucket
- Upsert into `cancel_rate_stats`
- Compute parent aggregates for fallback hierarchy
- Log UNKNOWN% per batch — warn if >20% (C4)
- Store `mapping_version = 'v1'` for audit trail
- **Store training window**: `window_start`, `window_end`, `data_row_count`, `unknown_pct` per batch

### 3. Pure Function: `getExpectedCancelRooms()`

```
File: apps/web/lib/engine/cancelForecast.ts
```

```typescript
function getExpectedCancelRooms(
  stayDate: Date,
  asOfDate: Date,
  roomsOtb: number,
  segment: string,
  stats: CancelRateBucket[],
  hotelSeasons: Season[]
): { expectedCxl: number; rate: number; confidence: string }
```

- Compute `days_to_stay` = stayDate - asOfDate (runtime dimension, NOT booking_lead_days)
- Map `days_to_stay` → closest `booking_lead_bucket` for lookup
- Determine DOW from stayDate
- Determine season from hotelSeasons
- Look up cancel_rate from stats (fallback: segment→ALL, season→default)
- Return `expectedCxl = Math.round(roomsOtb * cancel_rate)`

## Files to Create/Modify

- `[NEW] apps/web/app/actions/buildCancelStats.ts` — Build cancel rate stats
- `[NEW] apps/web/lib/engine/cancelForecast.ts` — Pure function for expected cancel rooms
- `[MODIFY] apps/web/prisma/schema.prisma` — Add `CancelRateStats` model
- `[NEW] apps/web/tests/cancel-forecast.test.ts` — Unit tests for pure function

## Test Criteria

- [ ] `buildCancelStats()` produces >0 rows for hotel with cancel data
- [ ] All rates clamped [0, 0.8] (no outliers)
- [ ] Bayesian smoothing: bucket with N=5, raw=0.6, parent=0.2 → blended closer to parent
- [ ] `getExpectedCancelRooms()` returns `0 ≤ expected ≤ roomsOtb` (acceptance test #1)
- [ ] Fallback chain works: specific → parent → ALL → global 15% (acceptance test #6)
- [ ] Empty company_name → DIRECT segment (not UNKNOWN)
- [ ] HOSTELWORLD → OTA segment
- [ ] UNKNOWN% logged and warned if >20%

---
Next Phase: [phase-02-integrate-pipeline.md](./phase-02-integrate-pipeline.md)
