# Phase 02: OTB Dedup + Cancel Fix
Status: ⬜ Pending
Dependencies: Phase 01 (cancel_time must be populated, snapshot_ts column must exist)

## Objective
Rewrite `buildDailyOTB` query to: (1) deduplicate by `reservation_id` using latest *snapshot* (not `created_at`), (2) add overlap filter for performance, and (3) harden tenant join. This eliminates double-counting and ensures cancelled bookings are correctly excluded.

## Implementation Steps

### 1. [ ] Replace `prisma.findMany` with Raw SQL + `DISTINCT ON` (P0)
**File:** `app/actions/buildDailyOTB.ts` L91-119
Replace the entire Prisma query with:
```typescript
const reservations = await prisma.$queryRaw<Array<{
    reservation_id: string;
    booking_date: Date;
    book_time: Date | null;
    arrival_date: Date;
    departure_date: Date;
    rooms: number;
    revenue: any; // Decimal from Postgres
}>>`
    SELECT DISTINCT ON (r.reservation_id)
        r.reservation_id,
        r.booking_date,
        r.book_time,
        r.arrival_date,
        r.departure_date,
        r.rooms,
        r.revenue
    FROM reservations_raw r
    JOIN import_jobs j
      ON j.job_id = r.job_id
      AND j.hotel_id = r.hotel_id     -- 🔒 Tenant hardening (point 4)
    WHERE r.hotel_id = ${hotelId}::uuid
      -- Time-travel: booked before snapshot
      AND COALESCE(r.book_time, r.booking_date::timestamp) <= ${asOfTs}
      -- Time-travel: not cancelled before snapshot
      AND (r.cancel_time IS NULL OR r.cancel_time > ${asOfTs})
      -- Performance: overlap filter (point 2c)
      AND r.arrival_date < ${stayDateTo}::date
      AND r.departure_date > ${stayDateFrom}::date
    ORDER BY r.reservation_id,
             COALESCE(j.snapshot_ts, j.created_at) DESC  -- 🔒 snapshot_ts wins (point 3)
`;
```

**Why `snapshot_ts` instead of `created_at`:**
- If a user imports a *historical* snapshot (old data uploaded today), `created_at` would be today, making old data "win" over genuinely newer snapshots.
- `snapshot_ts` defaults to `created_at` (no change for existing data), but can be overridden when importing backfill data.
- `COALESCE(j.snapshot_ts, j.created_at)` is backward-compatible with existing jobs that have no `snapshot_ts`.

### 2. [ ] Add DB index for dedup query performance (P1)
**File:** `prisma/schema.prisma` — `ReservationsRaw` model
```diff
+  @@index([hotel_id, reservation_id], map: "idx_res_raw_dedup")
```

### 3. [ ] Handle Raw SQL Decimal type casting (P1)
**File:** `app/actions/buildDailyOTB.ts` — in the expand loop
```typescript
// Raw SQL returns Decimal as string in some drivers
const revenueNum = Number(res.revenue);
const roomsNum = Number(res.rooms);  // Also may need casting
```

### 4. [ ] Update `rebuildAllOTB` to pass proper date range (P1)
**File:** `app/actions/buildDailyOTB.ts` — `rebuildAllOTB` function
```typescript
const today = new Date();
const stayDateFrom = new Date(today);
stayDateFrom.setMonth(stayDateFrom.getMonth() - 3); // 3 months back
const stayDateTo = new Date(today);
stayDateTo.setMonth(stayDateTo.getMonth() + 12); // 12 months forward
return buildDailyOTB({ hotelId, asOfTs, stayDateFrom, stayDateTo });
```

### 5. [ ] Add `snapshot_ts` field to ImportJob model (P1 — from point 3)
**File:** `prisma/schema.prisma` — already added in Phase 01 step 4
Verify the column exists and has correct type. In `ingestCSV`, optionally set `snapshot_ts` if the UI provides it:
```typescript
// In job creation:
data: {
    ...
    snapshot_ts: formData.get('snapshotDate')
        ? new Date(formData.get('snapshotDate') as string)
        : new Date()  // default = now (= created_at behavior)
}
```

## Test Criteria
- [ ] Same `reservation_id` in 2 jobs → OTB counts it ONCE (latest `snapshot_ts` version)
- [ ] Cancelled booking with `cancel_time` before `asOfTs` → excluded
- [ ] Cancelled booking with `cancel_time` after `asOfTs` → included
- [ ] **Amendment test**: Job 1 has RES-1 (arrival=Mar 1-3), Job 2 has RES-1 (arrival=Mar 5-7) → OTB only shows Mar 5-7
- [ ] **Out-of-order import**: Upload old snapshot (Jan data) AFTER new snapshot (Feb data) → OTB uses Feb data
- [ ] Performance: query completes < 2s for 50K reservations

---
Next Phase: [phase-03-polish.md](./phase-03-polish.md)
