# Phase 01: buildFeaturesDaily (STLY + Pace + RemSupply) — v2
Status: ⬜ Pending
Dependencies: Phase 0.5 (validation passes), daily_otb has data

## Objective
Server action `buildFeaturesDaily()` populates `features_daily` from `daily_otb`.
1 call = 1 as_of_date → features cho all stay_dates in range.

## Key Design Rules (from Auditor Review)

> [!CAUTION]
> **NEVER** `COALESCE(prev.rooms_otb, 0)` for pickup. Missing snapshot → **NULL**, not 0.
> COALESCE(0) creates phantom pickup numbers that corrupt analysis.

> [!IMPORTANT]
> **STLY fallback**: Don't hard-code `-364`. Find `closest as_of ≤ target` + DOW-aware window.
> PMS snapshots are often missing — rigid offset = lots of NULLs.

> [!IMPORTANT]
> **Batch SQL**: 1 query covers all stay_dates × all T-x offsets via self-join.
> N queries per stay_date will timeout on 2+ year backfill.

---

## 🔒 Locked Definitions (Phase 01)

| Term | Definition | Không làm lệch |
|------|------------|-------------|
| **STLY** | OTB của `stay_date - 364 days` tại `as_of_date - 364 days` (tương ứng) | Same as-of LY, không phải actual/final LY |
| **stly_rooms_otb** | `rooms_otb` của snapshot STLY (có fallback ±7 days DOW) | |
| **pace_vs_ly_rooms** | `rooms_otb - stly_rooms_otb` | Delta số phòng, không phải % |
| **pace_vs_ly_pct** | `(rooms_otb - stly_rooms_otb) / NULLIF(stly_rooms_otb, 0) * 100` | Optional, % change |

> [!NOTE]
> **STLY là "Same as-of Last Year"** — trong hệ time-travel, so sánh OTB snapshot cùng thời điểm năm trước,
> không phải kết quả cuối cùng (actual/final) năm trước.

---

## 🔒 Phase 01 Locked Decisions (D11-D15)

| # | Decision | Value | Lý do |
|---|----------|-------|-------|
| D11 | **STLY date casting** | Ép `::date` rõ ràng | Tránh `timestamp` vs `date` implicit cast sai index |
| D12 | **STLY ORDER BY** | `as_of_date DESC` trước, `ABS(stay_date-target)` sau | Ưu tiên snapshot đúng thời điểm trước, DOW sau |
| D13 | **Pace P0 strategy** | **Strict** — exact T-x, NULL nếu thiếu | V1.1 có thể chuyển nearest ≤ T-x sau nếu quá nhiều NULL |
| D14 | **Upsert strategy** | `ON CONFLICT ... DO UPDATE` | Race-safe, không cần advisory lock |
| D15 | **Backfill chunking** | 7 `as_of_date` per batch + resume via `last_processed_date` | Tránh timeout, có thể resume nếu gián đoạn |


## Implementation Steps

### 1. STLY Query (Nearest-Snapshot Fallback)
- [ ] Target stay_date_ly = `stay_date - 364 days` (same DOW)
- [ ] If no exact match: search `WHERE stay_date BETWEEN target-7 AND target+7 AND DOW = target.DOW` → pick closest
- [ ] Target as_of_ly = closest `as_of_date ≤ (as_of_date - 364 days)` — use MAX()
- [ ] Output: `stly_rooms_otb`, `stly_revenue_otb`, `stly_is_approx` flag

```sql
-- STLY with nearest-snapshot fallback (batch for all stay_dates)
-- D11: Explicit ::date casting to avoid timestamp/date mismatch
WITH stly_targets AS (
  SELECT
    stay_date,
    (stay_date - 364)::date AS target_stay_ly,   -- date arithmetic, not interval
    (as_of_date - 364)::date AS target_asof_ly   -- explicit date cast
  FROM daily_otb
  WHERE hotel_id = $1 AND as_of_date = $2::date
)
SELECT
  t.stay_date,
  ly.rooms_otb AS stly_rooms_otb,
  ly.revenue_otb AS stly_revenue_otb,
  ly.stay_date AS stly_actual_date,
  (ly.stay_date != t.target_stay_ly) AS stly_is_approx
FROM stly_targets t
LEFT JOIN LATERAL (
  SELECT rooms_otb, revenue_otb, stay_date, as_of_date
  FROM daily_otb
  WHERE hotel_id = $1
    AND stay_date BETWEEN t.target_stay_ly - 7 AND t.target_stay_ly + 7
    AND EXTRACT(DOW FROM stay_date) = EXTRACT(DOW FROM t.target_stay_ly)
    AND as_of_date <= t.target_asof_ly
  -- D12: ORDER BY as_of closeness FIRST, then stay_date closeness
  ORDER BY as_of_date DESC, ABS(EXTRACT(EPOCH FROM (stay_date - t.target_stay_ly))) ASC
  LIMIT 1
) ly ON TRUE;
```


### 2. Pace Pickup (Batch Self-Join, NULL-safe)
- [ ] Single query: self-join daily_otb at offsets [30, 15, 7, 5, 3]
- [ ] **D13 (P0 Strict)**: Exact T-x match → NULL if missing (no nearest fallback)
- [ ] V1.1 (Later): nearest snapshot ≤ T-x with `is_approx` flag nếu P0 quá nhiều NULL


```sql
-- Batch pickup: all T-x offsets in 1 query
SELECT
  cur.stay_date,
  cur.rooms_otb,
  cur.rooms_otb - t30.rooms_otb AS pickup_t30,
  cur.rooms_otb - t15.rooms_otb AS pickup_t15,
  cur.rooms_otb - t7.rooms_otb  AS pickup_t7,
  cur.rooms_otb - t5.rooms_otb  AS pickup_t5,
  cur.rooms_otb - t3.rooms_otb  AS pickup_t3
FROM daily_otb cur
LEFT JOIN daily_otb t30 ON t30.hotel_id = cur.hotel_id
  AND t30.stay_date = cur.stay_date
  AND t30.as_of_date = (cur.as_of_date - INTERVAL '30 days')::date
LEFT JOIN daily_otb t15 ON t15.hotel_id = cur.hotel_id
  AND t15.stay_date = cur.stay_date
  AND t15.as_of_date = (cur.as_of_date - INTERVAL '15 days')::date
LEFT JOIN daily_otb t7 ON t7.hotel_id = cur.hotel_id
  AND t7.stay_date = cur.stay_date
  AND t7.as_of_date = (cur.as_of_date - INTERVAL '7 days')::date
LEFT JOIN daily_otb t5 ON t5.hotel_id = cur.hotel_id
  AND t5.stay_date = cur.stay_date
  AND t5.as_of_date = (cur.as_of_date - INTERVAL '5 days')::date
LEFT JOIN daily_otb t3 ON t3.hotel_id = cur.hotel_id
  AND t3.stay_date = cur.stay_date
  AND t3.as_of_date = (cur.as_of_date - INTERVAL '3 days')::date
WHERE cur.hotel_id = $1 AND cur.as_of_date = $2;
```

### 3. Pace vs LY (Công thức chốt)
- [ ] `pace_vs_ly_rooms = rooms_otb - stly_rooms_otb` (đơn vị: phòng)
- [ ] `pace_vs_ly_pct = (rooms_otb - stly_rooms_otb) / NULLIF(stly_rooms_otb, 0) * 100` (optional)
- [ ] NULL if STLY not available (don't force 0)
- [ ] UI hiển thị: `+15` (xanh), `-10` (đỏ), `—` (null)

### 4. Remaining Supply
- [ ] V1: `remaining_supply = Hotel.capacity - rooms_otb` (expected_cxl = 0)
- [ ] V1.1: Add `ooo_rooms` field to Hotel or per-stay-date override
- [ ] V2: `remaining_supply = capacity_effective - rooms_otb + expected_cxl`
- [ ] `capacity_effective = Hotel.capacity - ooo_rooms`

### 5. DOW / Weekend / Month
- [ ] Extract from stay_date in SQL: `EXTRACT(DOW ...)`, `EXTRACT(MONTH ...)`
- [ ] `is_weekend`: configurable per hotel (Fri/Sat or Sat/Sun)

### 6. Upsert to features_daily (D14: ON CONFLICT)
- [ ] Use `INSERT ... ON CONFLICT (hotel_id, as_of_date, stay_date) DO UPDATE`
- [ ] Race-safe without advisory lock
- [ ] Bulk insert (1 query per as_of_date, not row-by-row)

```sql
-- D14: ON CONFLICT upsert instead of DELETE+INSERT
INSERT INTO features_daily (hotel_id, as_of_date, stay_date, rooms_otb, ...)
SELECT ... 
ON CONFLICT (hotel_id, as_of_date, stay_date)
DO UPDATE SET
  rooms_otb = EXCLUDED.rooms_otb,
  stly_rooms_otb = EXCLUDED.stly_rooms_otb,
  -- ... other columns
  updated_at = NOW();
```


### 7. Index optimization for joins
- [ ] Verify index `(hotel_id, as_of_date, stay_date)` — already PK ✅
- [ ] Add index `(hotel_id, stay_date, as_of_date)` for STLY LATERAL join

### 8. Integration with OTB rebuild
- [ ] Call `buildFeaturesDaily()` after `buildDailyOTB()` completes
- [ ] Add "Rebuild Features" button with validation preview (Phase 0.5)

### 9. Backfill historical features (D15: Chunking + Resume)
- [ ] Chunk: 7 `as_of_date` per batch (configurable)
- [ ] Resume: save `last_processed_as_of_date` to DB or session
- [ ] Progress: `${processed}/${total} as_of_dates (${chunkIndex}/${totalChunks} chunks)`
- [ ] On failure: log failed chunk, resume from there

```typescript
// D15: Backfill with chunking
const CHUNK_SIZE = 7;
const asOfDates = await getDistinctAsOfDates(hotelId);
let lastProcessed = await getLastProcessedDate(hotelId); // resume point

for (let i = 0; i < asOfDates.length; i += CHUNK_SIZE) {
  const chunk = asOfDates.slice(i, i + CHUNK_SIZE);
  if (lastProcessed && chunk[0] <= lastProcessed) continue; // skip processed
  
  for (const asOfDate of chunk) {
    await buildFeaturesDaily(hotelId, asOfDate);
  }
  await saveLastProcessedDate(hotelId, chunk[chunk.length - 1]);
}
```


### 10. Add `features_daily` columns for approx flags
- [ ] `stly_is_approx Boolean?` — true if STLY used nearest snapshot
- [ ] `pickup_source Json?` — trace which T-x used nearest vs exact

## Files to Create/Modify
- `app/actions/buildFeaturesDaily.ts` — [NEW] Main pipeline
- `app/actions/buildDailyOTB.ts` — [MODIFY] Call features after OTB
- `prisma/schema.prisma` — [MODIFY] Add stly_is_approx, index, optional ooo_rooms
- `app/data/page.tsx` — [MODIFY] Add "Rebuild Features" button

## Test Criteria
- [ ] Missing T-7 snapshot → pickup_t7 = NULL (not inflated number)
- [ ] STLY fallback finds nearest DOW-matching date within ±7 window
- [ ] remaining_supply = capacity - rooms_otb for V1
- [ ] Batch query handles 365+ stay_dates in < 2s
- [ ] pace_vs_ly = NULL when no STLY data (not 0)

---
Next Phase: phase-02-guardrails.md
