# SPEC-V01.1: Cancellation Bridge + OTB Accuracy (Final)

**Version:** 1.1.2 (Final)  
**Created:** 2026-02-04  
**Revised:** 2026-02-04 (PO Technical Review Round 2)  
**Status:** ✅ APPROVED - Ready for Dev  
**Priority:** 🔴 HIGH

---

## 1. Overview

### Problem Statement
Hiện tại dữ liệu cancellation được import và lưu vào `cancellations_raw` nhưng:
- ❌ Không sync vào `reservations_raw`
- ❌ `buildDailyOTB` vẫn đếm booking đã huỷ
- ❌ Pickup/Forecast/Pricing bị sai do OTB sai

### Solution (Final per PO Review)
1. **Cancellation Bridge** - Sync cancellation → reservations_raw (transactional)
2. **Re-Bridge Trigger** - Chạy bridge cả khi import Reservations
3. **Time-Travel OTB** - Logic chuẩn RMS dựa trên `asOfTs` (timestamp, NOT date)
4. **Normalization + Indexes** - Stable matching với normalized keys

---

## 2. Definitions (CRITICAL)

### 2.1. asOfTs vs snapshot_date

| Term | Type | Description |
|------|------|-------------|
| `asOfTs` | `timestamptz` | Thời điểm snapshot OTB chạy. VD: `2026-02-04T23:59:59+07:00` |
| `snapshot_date` | `date` | Nhãn ngày (chỉ để display). VD: `2026-02-04` |

> **Rule:** Mọi time-travel comparison PHẢI dùng `asOfTs`, không dùng date.

### 2.2. Book Time Fallback (Legacy Data)

```typescript
// If book_time is NULL (legacy data):
effective_book_time = book_time ?? 
  new Date(booking_date.setHours(0, 0, 0, 0)); // 00:00:00 hotel timezone

// Log DQ for monitoring:
if (book_time === null) {
  dqLog.push({ reservation_id, issue: 'book_time_fallback' });
}
```

### 2.3. Revenue Split Per Night (V01.1 Rule)

```typescript
// Even split with remainder to last night
const nights = diffDays(departure, arrival);
const revenuePerNight = Math.floor(total_revenue / nights);
const remainder = total_revenue - (revenuePerNight * nights);

// Night[0..n-2] = revenuePerNight
// Night[n-1] = revenuePerNight + remainder
```

---

## 3. Database Schema Changes

### 3.1. `reservations_raw` - Full Schema

```prisma
model ReservationsRaw {
  id             String            @id @default(uuid()) @db.Uuid
  hotel_id       String            @db.Uuid
  job_id         String            @db.Uuid
  reservation_id String            // folio_num / confirmation_number
  
  // === TIME FIELDS (CRITICAL for time-travel) ===
  booking_date   DateTime          @db.Date       // Legacy (for fallback)
  book_time      DateTime?         @db.Timestamptz // Preferred: Full timestamp
  
  arrival_date   DateTime          @db.Date
  departure_date DateTime          @db.Date
  rooms          Int
  revenue        Decimal           @db.Decimal
  
  // === CANCELLATION FIELDS ===
  status         ReservationStatus // 'booked' | 'cancelled' (UI display only)
  cancel_date    DateTime?         @db.Date       // Legacy
  cancel_time    DateTime?         @db.Timestamptz // Full timestamp from cancellation
  cancel_reason  String?           // Optional: QA & analytics
  cancel_source  String?           // 'guest' | 'hotel' | 'ota' | 'no_show'
  
  // === MODIFICATION TRACKING ===
  last_modified_time DateTime?     @db.Timestamptz // For picking latest version
  
  // === NORMALIZED KEYS (for stable matching) ===
  reservation_id_norm String?      // UPPER, TRIM, alphanumeric only
  room_code      String?
  room_code_norm String?           // Normalized
  
  loaded_at      DateTime          @default(now())

  // === RELATIONS ===
  hotel Hotel     @relation(fields: [hotel_id], references: [hotel_id])
  job   ImportJob @relation(fields: [job_id], references: [job_id])
  
  // === REVERSE RELATION from cancellations ===
  matched_cancellations CancellationRaw[] @relation("MatchedCancellation")

  // === INDEXES ===
  @@index([hotel_id, reservation_id_norm, arrival_date, room_code_norm], name: "idx_res_raw_match1")
  @@index([hotel_id, reservation_id_norm, arrival_date], name: "idx_res_raw_match2")
  @@index([hotel_id, book_time, cancel_time, arrival_date, departure_date], name: "idx_res_raw_otb")
  @@unique([hotel_id, reservation_id, job_id], name: "uq_res_job")
  @@map("reservations_raw")
}
```

### 3.2. `cancellations_raw` - Full Schema

```prisma
model CancellationRaw {
  id            String   @id @default(uuid()) @db.Uuid
  hotel_id      String   @db.Uuid
  job_id        String   @db.Uuid
  folio_num     String
  arrival_date  DateTime @db.Date
  cancel_time   DateTime @db.Timestamptz  // ⚠️ MUST be Timestamptz
  as_of_date    DateTime @db.Date
  nights        Int
  rate_amount   Decimal  @db.Decimal(12, 2)
  total_revenue Decimal  @db.Decimal(12, 2)
  channel       String?
  sale_group    String?
  room_type     String?
  room_code     String?
  guest_name    String?
  created_at    DateTime @default(now())

  // === NORMALIZED KEYS ===
  folio_num_norm String?
  room_code_norm String?

  // === MATCH TRACKING (with proper relation) ===
  matched_reservation_id String?          @db.Uuid
  matched_reservation    ReservationsRaw? @relation("MatchedCancellation", fields: [matched_reservation_id], references: [id])
  matched_at             DateTime?        @db.Timestamptz
  match_status           String?          // 'matched' | 'unmatched' | 'ambiguous' | 'conflict' | 'dq_issue'
  match_notes            String?

  // === RELATIONS ===
  hotel Hotel     @relation(fields: [hotel_id], references: [hotel_id])
  job   ImportJob @relation(fields: [job_id], references: [job_id])

  // === UNIQUE CONSTRAINT (prevents duplicate imports) ===
  @@unique([hotel_id, folio_num_norm, arrival_date, cancel_time], name: "uq_cancel_event")
  
  @@index([hotel_id, as_of_date], name: "idx_cancel_as_of")
  @@index([hotel_id, cancel_time], name: "idx_cancel_time")
  @@index([hotel_id, match_status], name: "idx_cancel_match_status")
  @@map("cancellations_raw")
}
```

---

## 4. Cancellation Bridge Logic (Final)

### 4.1. Trigger Points

| Trigger | Action |
|---------|--------|
| Import Cancellation XML | Bridge cancellations → reservations |
| Import Reservation Report | Re-bridge pending unmatched cancellations |

### 4.2. Matching Algorithm (Final - with Ambiguity Detection)

```typescript
async function findMatchingReservation(
  cancellation: CancellationRaw
): Promise<MatchResult> {
  // Query TOP 2 candidates to detect ambiguity
  const candidates = await prisma.reservationsRaw.findMany({
    where: {
      hotel_id: cancellation.hotel_id,
      reservation_id_norm: cancellation.folio_num_norm,
      arrival_date: cancellation.arrival_date,
      // Optional: room_code_norm if available
    },
    orderBy: [
      { last_modified_time: 'desc' },
      { book_time: 'desc' },
      { loaded_at: 'desc' }
    ],
    take: 2  // ⚠️ MUST be 2 to detect ambiguity
  });

  if (candidates.length === 0) {
    return { status: 'unmatched', reservation: null };
  }
  
  if (candidates.length === 1) {
    return { status: 'matched', reservation: candidates[0] };
  }
  
  // 2 candidates: check if tie (ambiguous)
  const c0 = candidates[0];
  const c1 = candidates[1];
  
  const isTie = 
    c0.last_modified_time?.getTime() === c1.last_modified_time?.getTime() &&
    c0.book_time?.getTime() === c1.book_time?.getTime() &&
    c0.loaded_at.getTime() === c1.loaded_at.getTime();
  
  if (isTie) {
    return { 
      status: 'ambiguous', 
      reservation: null,
      notes: `Candidates: ${c0.id}, ${c1.id}`
    };
  }
  
  // Not a tie: pick first (highest priority)
  return { status: 'matched', reservation: candidates[0] };
}
```

### 4.3. Data Quality Check (Cancel Before Book)

```typescript
// If cancel_time < book_time → data quality issue
if (cancellation.cancel_time < reservation.book_time) {
  return {
    status: 'dq_issue',
    notes: `cancel_time (${cancellation.cancel_time}) < book_time (${reservation.book_time})`
  };
}
```

### 4.4. Transactional Bridge Update (CRITICAL)

```typescript
// Both updates MUST be in same transaction
await prisma.$transaction([
  // 1. Update reservation
  prisma.reservationsRaw.update({
    where: { id: reservation.id },
    data: {
      cancel_time: cancellation.cancel_time,
      cancel_reason: cancellation.cancel_reason,
      cancel_source: 'import',
      status: 'cancelled'
    }
  }),
  
  // 2. Update cancellation match tracking
  prisma.cancellationRaw.update({
    where: { id: cancellation.id },
    data: {
      matched_reservation_id: reservation.id,
      matched_at: new Date(),
      match_status: 'matched'
    }
  })
]);
```

### 4.5. Conflict Resolution

```typescript
// If reservation.cancel_time already set with DIFFERENT value:
if (reservation.cancel_time !== null) {
  if (reservation.cancel_time.getTime() === cancellation.cancel_time.getTime()) {
    // Same value → idempotent, no-op
    return { status: 'already_matched' };
  } else {
    // Different value → conflict, do NOT overwrite
    return { 
      status: 'conflict',
      notes: `Existing: ${reservation.cancel_time}, Incoming: ${cancellation.cancel_time}`
    };
  }
}
```

---

## 5. Time-Travel OTB Logic (Final)

### 5.1. buildDailyOTB Signature

```typescript
interface BuildOTBParams {
  hotelId: string;
  asOfTs: Date;           // ⚠️ timestamptz, NOT date
  stayDateFrom: Date;     // Start of range
  stayDateTo: Date;       // End of range
}

interface OTBResult {
  snapshot_date: Date;    // Label only
  snapshot_generated_at: Date;  // asOfTs used
  rows: DailyOTB[];
}

async function buildDailyOTB(params: BuildOTBParams): Promise<OTBResult>;
```

### 5.2. Core Query (Time-Travel Logic)

```typescript
// Get effective book_time with fallback
const getEffectiveBookTime = (r: ReservationsRaw) => 
  r.book_time ?? new Date(r.booking_date.setHours(0, 0, 0, 0));

// Active as-of query
const activeReservations = await prisma.reservationsRaw.findMany({
  where: {
    hotel_id: hotelId,
    // Must be booked before or at asOfTs
    OR: [
      { book_time: { lte: asOfTs } },
      { book_time: null, booking_date: { lte: asOfTs } }  // Fallback for legacy
    ],
    // Must NOT be cancelled before or at asOfTs
    AND: {
      OR: [
        { cancel_time: null },
        { cancel_time: { gt: asOfTs } }
      ]
    }
  }
});

// Expand to stay_dates and aggregate
for (const res of activeReservations) {
  for (let d = res.arrival_date; d < res.departure_date; d = addDays(d, 1)) {
    if (d >= stayDateFrom && d <= stayDateTo) {
      const revenuePerNight = calculateRevPerNight(res, d);
      otbMap[d] += { rooms: res.rooms, revenue: revenuePerNight };
    }
  }
}
```

---

## 6. Partial Cancellation Scope

### V01.1 Limitation

> ⚠️ **V01.1 chỉ hỗ trợ FULL CANCELLATION**

```typescript
if (cancellation.nights < reservation.nights) {
  return {
    status: 'unsupported_partial',
    notes: `Partial: ${cancellation.nights}/${reservation.nights} nights`
  };
}
```

---

## 7. Acceptance Criteria (Final - 12 ACs)

| AC | Description | Priority |
|----|-------------|----------|
| AC-1 | Normalization on Import | P0 |
| AC-2 | Cancellation Import triggers Bridge | P0 |
| AC-3 | Reservation Import triggers Re-Bridge | P0 |
| AC-4 | Match Tracking with FK Relation | P0 |
| AC-5 | Ambiguous Match Detection (take:2) | P0 |
| AC-6 | Conflict Handling (no overwrite) | P0 |
| AC-7 | DQ Check (cancel < book) | P1 |
| AC-8 | Time-Travel OTB uses asOfTs | P0 |
| AC-9 | Stay Date Filter [arrival, departure) | P0 |
| AC-10 | Revenue Split = total/nights + remainder | P1 |
| AC-11 | Transactional Bridge Update | P0 |
| AC-12 | Unique Constraint prevents duplicates | P0 |

---

## 8. Test Cases (Final - 14 TCs)

### TC-1 to TC-6: (Previous - unchanged)

### TC-7: Duplicate Reservation - Pick Latest
```
Given: 2 rows same folio+arrival, Row B has later last_modified_time
When: Bridge
Then: Row B selected
```

### TC-8: Ambiguous Match
```
Given: 2 rows identical (same timestamps)
When: Bridge
Then: match_status = 'ambiguous'
```

### TC-9: Cancel Before Book (DQ Issue)
```
Given: cancel_time < book_time
When: Bridge
Then: match_status = 'dq_issue'
```

### TC-10: Timezone Handling
```
Given: cancel_time = "2026-02-02 08:30" local
When: Parse and store
Then: Stored as timestamptz with TZ offset
```

### TC-11: Stay Date Filter
```
Given: arrival=Feb 5, departure=Feb 8
When: OTB for Feb 1-10
Then: Only Feb 5,6,7 counted
```

### TC-12: book_time Fallback
```
Given: Reservation with book_time = null, booking_date = Feb 1
When: OTB as-of Feb 2
Then: Uses booking_date 00:00:00 as effective book_time
```

### TC-13: Duplicate Import Blocked
```
Given: Same cancellation XML imported twice
When: Second import
Then: Unique constraint prevents duplicate
```

### TC-14: Transaction Atomicity
```
Given: Network error during bridge
When: Update reservation succeeds but cancellation update fails
Then: Both rolled back (no partial state)
```

---

## 9. Implementation Files

| File | Action | Priority |
|------|--------|----------|
| `prisma/schema.prisma` | MODIFY: Full schema update | P0 |
| `lib/normalize.ts` | NEW | P0 |
| `lib/cancellationBridge.ts` | NEW | P0 |
| `app/actions/ingestXML.ts` | MODIFY: Normalize + re-bridge | P0 |
| `app/actions/ingestCancellationXml.ts` | MODIFY: Normalize + bridge | P0 |
| `app/actions/buildDailyOTB.ts` | MODIFY: asOfTs + time-travel | P0 |

---

## 10. Definition of Done

- [ ] Schema migration complete (all fields + indexes + unique)
- [ ] All 12 AC passed
- [ ] All 14 TC passed
- [ ] OTB reconciliation shows ±0.5% accuracy
- [ ] 30-day backfill complete
- [ ] Code reviewed
- [ ] Deployed to staging
- [ ] PO sign-off
