# Phase 0.5: Data Validation Guardrails
Status: ⬜ Pending
Dependencies: daily_otb must have data (✅)

## Objective
Chạy validation trước `buildFeaturesDaily` để phát hiện data bẩn sớm.
Không cần UI phức tạp — chỉ log + badge "Data issues found".

## Implementation Steps

### 1. Validate OTB invariants
- [ ] `rooms_otb >= 0` (negative = data corruption) → **FAIL**
- [ ] `revenue_otb >= 0` → **FAIL**
- [ ] `stay_date < as_of_date` → **WARNING** + exclude from buildFeaturesDaily
  - Lý do: PMS export hay có in-house/actualized/late postings → hard-fail sẽ block pipeline
  - Hành vi: flag warning, exclude khỏi features build, nhưng **không** set `valid=false`

### 2. Duplicate detection
- [ ] Check `(hotel_id, as_of_date, stay_date)` PK uniqueness — should never fail if schema correct
- [ ] Flag if same stay_date has wildly different rooms_otb across close as_of_dates (possible re-import issue)

### 3. Outlier detection
- [ ] `pickup_t1 > 0.3 * capacity` → flag "unusual single-day pickup"
- [ ] `rooms_otb > capacity` → flag "OTB exceeds hotel capacity" (overbooking or data error)

### 4. Completeness check
- [ ] For given as_of_date range: % of stay_dates that have OTB data
- [ ] For given stay_date: list missing as_of_dates (gaps in snapshot history)

### 5. Return summary
- [ ] Return `{ valid: boolean, issues: Issue[], stats: { totalRows, flagged, completeness } }`
- [ ] Call this from UI "Rebuild Features" button with preview before proceeding

## Files to Create/Modify
- `app/actions/validateOTBData.ts` — [NEW] Validation logic
- `app/data/page.tsx` — [MODIFY] Show validation badge

## Test Criteria
- [ ] Detects rooms_otb < 0 if injected
- [ ] Detects rooms_otb > capacity
- [ ] Returns completeness % accurately

---
Next Phase: phase-01-features.md
