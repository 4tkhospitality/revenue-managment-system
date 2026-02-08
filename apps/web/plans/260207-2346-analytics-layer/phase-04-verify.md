# Phase 04: Verify & Integration Test — v2
Status: ⬜ Pending
Dependencies: Phase 01-03

## Objective
Xác nhận pipeline + UI chính xác, bao gồm edge cases thực tế.

## Golden Dataset
- [ ] Create `tests/fixtures/golden-otb.ts`: 2 as_of_dates × 10 stay_dates
- [ ] Known values: rooms_otb, revenue_otb for deterministic assertions
- [ ] Include: 1 stay_date with missing T-7, 1 with STLY data, 1 without STLY

## Edge Case Tests

### 1. Missing snapshot (most common bug)
- [ ] T-7 missing, T-6 exists → pickup_t7 = **NULL** (not rooms_otb - 0)
- [ ] All T-x missing → all pickups = NULL

### 2. STLY gaps
- [ ] STLY exact date missing → fallback finds nearest DOW within ±7
- [ ] No STLY data at all → pace_vs_ly = NULL, chart shows gap

### 3. Negative pickup (cancellation effect)
- [ ] rooms_otb today < rooms_otb 7 days ago → pickup_t7 = **negative** (correct!)
- [ ] UI shows red, not error

### 4. Leap year / week-shift
- [ ] stay_date around 2026-02-28 → STLY 2025-02-28 exists, 2025-02-29 does not
- [ ] 364-day offset correctly lands on same DOW

### 5. Multi-hotel isolation
- [ ] Run buildFeaturesDaily for Hotel A
- [ ] Verify Hotel B features_daily untouched
- [ ] No cross-join between hotel_ids

### 6. Capacity edge cases
- [ ] rooms_otb > capacity → validation catches, remaining_supply negative = flagged
- [ ] rooms_otb = 0 → remaining_supply = capacity

## Guardrails Tests

### 7. Min/Max clamp
- [ ] NET produces BAR = 300k, min_rate = 450k → clamped to 450k, reason = 'MIN_RATE'
- [ ] trace includes before_price, after_price, delta_pct

### 8. Step change
- [ ] Previous BAR = 1M, new BAR = 1.5M (50% change), step_limit = 20%
- [ ] Capped to 1.2M, reason = 'STEP_CAP'

## Build & Deploy

### 9. Build verification
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npx next build` — exit 0
- [ ] `git push` → Vercel deploy success

---
End of plan.
