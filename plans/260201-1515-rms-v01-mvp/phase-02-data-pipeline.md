# Phase 02: Data Pipeline Core (FINAL – TS Full-stack)
Status: 🟡 In Progress
Dependency: Phase 01 (Foundation – DONE)
Stack: Next.js Server Actions + Prisma + PostgreSQL

## Objective
Xây dựng trái tim RMS V01:
➡️ CSV → reservations_raw → daily_otb (Time-Travel, Stay-date grain)

Không UI đẹp, không ML, không pricing.
Chỉ tập trung: DỮ LIỆU ĐÚNG.

## Requirements

### SCOPE LOCK (RẤT QUAN TRỌNG)
**CÓ LÀM**
- [ ] CSV ingestion (Server Action)
- [ ] Import job tracking
- [ ] Explode booking → stay_date
- [ ] Time-travel OTB logic
- [ ] Upsert daily_otb

**❌ KHÔNG LÀM**
- [ ] Không Feature calculation
- [ ] Không Forecast
- [ ] Không Pricing
- [ ] Không UI dashboard
- [ ] Không OTA / PMS integration

## Implementation Steps

### 1. Module A — Ingestion (CSV Import)
Input: `POST /ingest/csv` (or Server Action)

**Logic:**
1. Nhận file CSV.
2. Calculate `file_hash`.
   - Nếu hash exists & status = completed → Reject (409).
   - Nếu hash exists & status = failed → Retry (create new job).
3. Parse CSV (PapaParse).
4. **Validation & Normalization (Row-level):**
   - **Strict Mode (Default)**: Unexpected `status` (not `booked` or `cancelled`) → Reject Job.
   - Validate `arrival_date < departure_date`.
   - Validate `rooms > 0`.
   - Validate `revenue >= 0`.
   - Logic: `status=cancelled` implies checking `cancel_date` (warn if null).
5. Insert into `reservations_raw` (append-only).
6. Update `IMPORT_JOBS` → completed or failed.

**Idempotency Rule (V01):**
- Reject duplicate file hash if completed.
- Allow retry if failed.

### 2. Module B — Daily OTB Builder (Time-Travel Core)
Input: `hotelId`, `as_of_date` (optional, default = today in hotel timezone)

**Business Logic (CHỐT):**
- **Timezone**: `as_of_date` normalized to hotel timezone midnight.
- **Active Rule (V01)**:
  `booking_date <= as_of_date` 
  AND (`cancel_date IS NULL` OR `cancel_date > as_of_date`)
  *(Note: cancel_date == as_of_date -> INACTIVE)*
- **Output Window**: only generate `stay_date` in range `[as_of_date, as_of_date + 365 days]`.

**Explode Nights Rule (V01):**
- `arrival_date` inclusive.
- `departure_date` exclusive.
- `nights = diffDays(departure, arrival)`. Guards: `nights > 0`.
- `revenue_per_night = revenue / nights`.
- `rooms = rooms_per_night`.

**Snapshot Write Strategy (Batch):**
- `deleteMany({ hotelId, asOfDate })`
- `createMany([...])`
- This ensures deterministic output and handles re-runs cleanly.

### 3. Module C — Runner / Orchestration
Input: `runDailyOTB(hotelId, fromDate, toDate)`

**Behavior:**
- **Max Range**: 90 days (prevent DB lockup).
- Loop through dates and call `buildDailyOTB`.

## Files to Create/Modify
- `apps/web/app/actions/ingestCSV.ts`
- `apps/web/app/actions/buildDailyOTB.ts`
- `apps/web/app/actions/runDailyOTB.ts`
- `apps/web/lib/csv.ts`
- `apps/web/lib/date.ts`
- `apps/web/lib/hash.ts`

## Test Criteria (MUST PASS)
### Performance
- [ ] Import CSV 1,000 rows < 5s.
- [ ] Build OTB 30 ngày < 3s.

### Correctness & Edge Cases
- [ ] **TC-Extra-01**: `Cancel_date == as_of_date` → Inactive (Cancelled status prevails).
- [ ] **TC-Extra-02**: `booking_date == as_of_date` → Active.
- [ ] Booking hủy sau `as_of_date` vẫn active.
- [ ] Booking hủy trước `as_of_date` bị loại.
- [ ] Explode nights đúng via `deleteMany` + `createMany`.

### Data Integrity
- [ ] Không ghi đè OTB của hotel khác.
- [ ] Chạy 2 lần cùng `as_of_date` → output y hệt.

---
Next Phase: [Phase 03](phase-03-features-forecast.md)
