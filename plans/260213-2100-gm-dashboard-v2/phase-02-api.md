# Phase 02: API — Analytics Endpoints
Status: ⬜ Pending
Dependencies: Phase 01 (indexes)

## Objective
3 API endpoints + 1 drill-down. Tất cả query `reservations_raw`, time-travel safe.

## ⚠️ Common Rules (CRITICAL)

### Rule 1: Stay window bám asOfDate (KHÔNG dùng CURRENT_DATE)
```
stayFrom = asOfDate         -- hoặc UI truyền
stayTo   = asOfDate + days
→ arrival_date BETWEEN $stayFrom AND $stayTo
```

### Rule 2: Cutoff thống nhất (strict < / >=)
```
cutoffTs = asOfDate::date + interval '1 day'

book_time < cutoffTs                              -- booked BEFORE end-of-day
(cancel_time IS NULL OR cancel_time >= cutoffTs)  -- NOT cancelled as-of snapshot
```

### Rule 3: Revenue source
```
reservations_raw.revenue  ← Decimal field, đã ingest từ XML/CSV
Dùng trực tiếp: SUM(revenue)
Khi revenue NULL → fallback: net_rate_per_room_night * room_nights
```

### Rule 4: Room-nights per-row COALESCE
```sql
SUM(
  COALESCE(room_nights, rooms * GREATEST(1, departure_date - arrival_date))
) AS total_rn
```

---

### Task 1: GET /api/analytics/top-accounts

**Request:** `?hotelId=X&asOfDate=YYYY-MM-DD&days=90`

**Response:**
```json
{
  "accounts": [
    {
      "account": "AGODA",
      "segment": "OTA",
      "bookings": 42,
      "roomNights": 156,
      "revenue": 450000000,
      "adr": 2884615,
      "cancelRate": 0.08,
      "cancelDataStatus": "ok"
    }
  ],
  "dataStatus": { "hasCancelData": true, "snapshotCount": 12 }
}
```

**SQL:**
```sql
WITH cutoff AS (
  SELECT $2::date + interval '1 day' AS ts
)
SELECT
  account_name_norm AS account,
  segment,
  COUNT(*) AS bookings,
  SUM(COALESCE(room_nights, rooms * GREATEST(1, departure_date - arrival_date))) AS room_nights,
  SUM(COALESCE(revenue, net_rate_per_room_night * COALESCE(room_nights, rooms))) AS revenue,
  SUM(COALESCE(revenue, net_rate_per_room_night * COALESCE(room_nights, rooms)))
    / NULLIF(SUM(COALESCE(room_nights, rooms * GREATEST(1, departure_date - arrival_date))), 0) AS adr
FROM reservations_raw, cutoff
WHERE hotel_id = $1
  AND book_time < cutoff.ts
  AND arrival_date BETWEEN $2::date AND $2::date + $3
  AND (cancel_time IS NULL OR cancel_time >= cutoff.ts)
GROUP BY account_name_norm, segment
ORDER BY room_nights DESC
LIMIT 10;
```

**Cancel rate:** Separate query. Show **N/A** if 0 cancel records exist.

- [ ] Create `app/api/analytics/top-accounts/route.ts`
- [ ] Handle `cancelDataStatus`: if 0 cancel records → `"missing_cancel"`

---

### Task 2: GET /api/analytics/room-los-mix

**Request:** `?hotelId=X&asOfDate=YYYY-MM-DD&days=90`

**Response:**
```json
{
  "roomMix": [
    { "roomCode": "SBD", "roomNights": 80, "share": 0.35, "adr": 2500000 }
  ],
  "losMix": [
    { "bucket": "1N", "count": 20, "share": 0.15 },
    { "bucket": "2N", "count": 45, "share": 0.34 },
    { "bucket": "3-5N", "count": 50, "share": 0.38 },
    { "bucket": "6N+", "count": 15, "share": 0.13 }
  ],
  "dataStatus": { "hasRoomCode": true, "hasNights": true }
}
```

**LOS Bucket SQL:**
```sql
CASE
  WHEN COALESCE(nights, departure_date - arrival_date) = 1 THEN '1N'
  WHEN COALESCE(nights, departure_date - arrival_date) = 2 THEN '2N'
  WHEN COALESCE(nights, departure_date - arrival_date) BETWEEN 3 AND 5 THEN '3-5N'
  ELSE '6N+'
END AS bucket
```

- [ ] Create `app/api/analytics/room-los-mix/route.ts`
- [ ] Missing `room_code` → group as `"Unknown"`
- [ ] Missing `nights` → fallback `departure_date - arrival_date`

---

### Task 3: GET /api/analytics/lead-time

**Request:** `?hotelId=X&asOfDate=YYYY-MM-DD&days=90`

**Response:**
```json
{
  "buckets": [
    { "bucket": "0-3d", "count": 30, "share": 0.22, "roomNights": 35 },
    { "bucket": "4-7d", "count": 25, "share": 0.19, "roomNights": 40 },
    { "bucket": "8-14d", "count": 28, "share": 0.21, "roomNights": 55 },
    { "bucket": "15-30d", "count": 32, "share": 0.24, "roomNights": 70 },
    { "bucket": "31d+", "count": 18, "share": 0.14, "roomNights": 60 }
  ],
  "avgLeadTime": 14.5,
  "dataStatus": { "hasBookTime": true }
}
```

**Lead-time SQL (time-travel safe):**
```sql
WITH cutoff AS (
  SELECT $2::date + interval '1 day' AS ts
)
SELECT
  CASE
    WHEN (arrival_date - book_time::date) BETWEEN 0 AND 3 THEN '0-3d'
    WHEN (arrival_date - book_time::date) BETWEEN 4 AND 7 THEN '4-7d'
    WHEN (arrival_date - book_time::date) BETWEEN 8 AND 14 THEN '8-14d'
    WHEN (arrival_date - book_time::date) BETWEEN 15 AND 30 THEN '15-30d'
    ELSE '31d+'
  END AS bucket,
  COUNT(*) AS count,
  SUM(COALESCE(room_nights, rooms * GREATEST(1, departure_date - arrival_date))) AS room_nights
FROM reservations_raw, cutoff
WHERE hotel_id = $1
  AND book_time < cutoff.ts
  AND arrival_date BETWEEN $2::date AND $2::date + $3
  AND (cancel_time IS NULL OR cancel_time >= cutoff.ts)
  AND book_time IS NOT NULL
GROUP BY bucket
ORDER BY MIN(arrival_date - book_time::date);
```

- [ ] Create `app/api/analytics/lead-time/route.ts`
- [ ] Missing `book_time` → badge `"missing_booktime"`

---

### Task 4: GET /api/analytics/account-detail (Drill-down)

**Request:** `?hotelId=X&account=AGODA&asOfDate=YYYY-MM-DD&days=90`

**Response:** Breakdown by stay_date + room_type for selected account.

- [ ] Create `app/api/analytics/account-detail/route.ts`
- [ ] Same cutoff/window rules as above

## Files to Create
- `app/api/analytics/top-accounts/route.ts`
- `app/api/analytics/room-los-mix/route.ts`
- `app/api/analytics/lead-time/route.ts`
- `app/api/analytics/account-detail/route.ts`

## Acceptance
- [ ] All endpoints use `asOfDate` for stay window (NOT `CURRENT_DATE`)
- [ ] All endpoints use `< cutoffTs` / `>= cutoffTs` (no off-by-one)
- [ ] Time-travel: changing `asOfDate` changes results
- [ ] Revenue fallback to `net_rate * room_nights` when `revenue` is NULL
- [ ] Performance: all queries < 200ms with indexes

---
Next Phase: [phase-03-ui.md](./phase-03-ui.md)
