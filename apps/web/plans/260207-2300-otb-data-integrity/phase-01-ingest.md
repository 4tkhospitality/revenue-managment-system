# Phase 01: Ingest Hardening
Status: ⬜ Pending
Dependencies: None

## Objective
Fix `ingestCSV.ts` to ensure clean data enters the system. Populate timestamp fields (`book_time`, `cancel_time`) using **Option A timezone** (local midnight Asia/Ho_Chi_Minh → UTC). Add DB-level idempotency with retry support.

## 🔒 Timezone Rule (Option A)
All `book_time`/`cancel_time` = local midnight (Asia/Ho_Chi_Minh) converted to UTC.
- `booking_date = 2026-01-15` → `book_time = 2026-01-14T17:00:00Z` (UTC = local - 7h)
- This matches `Hotel.timezone = 'Asia/Ho_Chi_Minh'`.

## Implementation Steps

### 1. [ ] Reject cancelled rows missing `cancel_date` (P0)
**File:** `app/actions/ingestCSV.ts` L95-98
```diff
 if (status === 'cancelled' && !cancelDate) {
-    console.warn(`Line ${line}: Cancelled booking missing cancel_date`);
-    // Allow? Plan says warn.
+    throw new Error(`Line ${line}: Cancelled booking MUST have cancel_date`);
 }
```

### 2. [ ] Populate `book_time` and `cancel_time` — Option A timezone (P0)
**File:** `app/actions/ingestCSV.ts` L100-111

Use hotel timezone to compute correct UTC timestamp:
```typescript
// Option A: Local midnight (Asia/Ho_Chi_Minh) → UTC
// For VN (UTC+7): local midnight = UTC 17:00 previous day
function toLocalMidnightUTC(date: Date, tzOffsetHours: number = 7): Date {
    const utc = new Date(date);
    utc.setUTCHours(-tzOffsetHours, 0, 0, 0); // midnight local = UTC - offset
    return utc;
}

const bookTime = toLocalMidnightUTC(bookingDate);
const cancelTime = cancelDate ? toLocalMidnightUTC(cancelDate) : null;

validRows.push({
    // ... existing fields ...
    book_time: bookTime,       // NEW: local midnight as UTC
    cancel_time: cancelTime,   // NEW: local midnight as UTC
});
```

### 3. [ ] Detect duplicate `reservation_id` within same CSV (P1)
**File:** `app/actions/ingestCSV.ts` — add before validation loop
```typescript
const seenResIds = new Set<string>();
// Inside loop, after status normalization:
if (seenResIds.has(row.reservation_id)) {
    throw new Error(`Line ${line}: Duplicate reservation_id '${row.reservation_id}' in same file`);
}
seenResIds.add(row.reservation_id);
```

### 4. [ ] Add `@@unique([hotel_id, file_hash])` + retry policy (P1)
**File:** `prisma/schema.prisma` — `ImportJob` model

Schema change:
```diff
 model ImportJob {
   ...
+  snapshot_ts   DateTime?       @db.Timestamptz(6)  // For Phase 02 dedup
   file_hash     String?
   ...
+  @@unique([hotel_id, file_hash])
   @@map("import_jobs")
 }
```

**Retry policy** in `ingestCSV.ts` — replace existing idempotency check:
```typescript
if (existingJob) {
    if (existingJob.status === 'completed') {
        return { success: false, message: "File already processed", error: "DUPLICATE_FILE" };
    }
    if (existingJob.status === 'processing') {
        return { success: false, message: "File is still being processed", error: "STILL_PROCESSING" };
    }
    if (existingJob.status === 'failed') {
        // Retry: clean up old data, reuse job
        await prisma.reservationsRaw.deleteMany({ where: { job_id: existingJob.job_id } });
        await prisma.importJob.update({
            where: { job_id: existingJob.job_id },
            data: { status: 'processing', error_summary: null, finished_at: null }
        });
        // Continue with existingJob instead of creating new
        job = existingJob;
        // Skip job creation below
    }
}
```
> This ensures failed jobs can be retried with the same file without hitting the unique constraint.

### 5. [ ] Add `Math.round()` guardrail for revenue (P1-lite)
**File:** `app/actions/ingestCSV.ts` L90
```diff
-const revenue = parseFloat(row.revenue || '0');
+const revenue = Math.round(parseFloat(row.revenue || '0')); // VND integer guardrail
```

### 6. [ ] Remove `skipDuplicates: true` from createMany (P1)
**File:** `app/actions/ingestCSV.ts` L116-122
```diff
 await prisma.reservationsRaw.createMany({
     data: validRows,
-    skipDuplicates: true
 });
```
> Step 3 (Set check) now catches duplicates explicitly. Silent skip is no longer needed.

## Test Criteria
- [ ] CSV with cancelled row missing `cancel_date` → job FAILS with clear error
- [ ] CSV with valid data → `book_time` = local midnight in UTC, `cancel_time` ditto
- [ ] CSV with duplicate `reservation_id` → job FAILS
- [ ] Upload same file twice (first completed) → "File already processed"
- [ ] Upload same file after first FAILED → retries successfully
- [ ] Revenue stored as integer in DB

---
Next Phase: [phase-02-otb-dedup.md](./phase-02-otb-dedup.md)
