# Phase 02: Guardrails in Pricing Engine — v2
Status: ⬜ Pending
Dependencies: Phase 01 (features populated)

## Objective
Enforce min_rate / max_rate / step_change limits với **priority order rõ ràng** và **reason_codes** cho audit trail.

## Priority Order (Fixed Rule)

```
1. Raw recommendation (from engine / NET→BAR calc)
   ↓
2. Step-change cap (|Δ%| > max_step_change → capped)
   ↓
3. Min/Max clamp (BAR < min_rate → min_rate, BAR > max_rate → max_rate)
   ↓
4. Rounding (CEIL_1000 / ROUND_100 / NONE)
```

## Reason Codes

| Code | Meaning | When |
|------|---------|------|
| `PASS` | No guardrail triggered | Price within all limits |
| `STEP_CAP` | Step change exceeded | `|new - prev| / prev > step_pct` |
| `MIN_RATE` | Below floor | `price < Hotel.min_rate` |
| `MAX_RATE` | Above ceiling | `price > Hotel.max_rate` |
| `MISSING_BASE` | No previous price to compare | Step-change skipped |
| `INVALID_NET` | NET ≤ 0 | Engine returns 0 early |

## Implementation Steps

### 1. Add max_step_change_pct to PricingSetting
- [ ] Check if field exists, if not: `max_step_change_pct Float? @default(20)`
- [ ] This = max % change per pricing update (±20% default)

### 2. Guardrail trace object
- [ ] Create `GuardrailResult` type:
```typescript
type GuardrailResult = {
  reason_code: 'PASS' | 'STEP_CAP' | 'MIN_RATE' | 'MAX_RATE' | 'MISSING_BASE' | 'INVALID_NET';
  before_price: number;
  after_price: number;
  delta_pct: number;
  clamped: boolean;
};
```

### 3. Apply guardrails in engine.ts
- [ ] After raw calc: check step-change first (needs `current_price` from last decision)
- [ ] Then clamp min/max
- [ ] Then round
- [ ] Return `guardrails: GuardrailResult` in CalcResult

### 4. Log to trace
- [ ] Add guardrail step to existing `trace[]` array
- [ ] GM sees: "BAR was 380k → capped to 450k (MIN_RATE: floor=450,000 VND)"

### 5. UI feedback
- [ ] Show guardrail badge icon in pricing grid when `clamped === true`
- [ ] Tooltip with `reason_code` + `before_price` → `after_price` + `delta_pct`

### 6. Settings UI
- [ ] Add min_rate / max_rate / step_change inputs to Settings page
- [ ] Validate: `min_rate < max_rate`, `step_change > 0`
- [ ] Show current values from Hotel model

## Files to Create/Modify
- `lib/pricing/engine.ts` — [MODIFY] Add guardrail pipeline after calc
- `lib/pricing/types.ts` — [MODIFY] Add GuardrailResult type
- `prisma/schema.prisma` — [MODIFY] Add step_change to PricingSetting if needed
- `app/settings/page.tsx` — [MODIFY] Add guardrails config section
- `app/pricing/components/PricingGrid.tsx` — [MODIFY] Show guardrail badges

## Test Criteria
- [ ] BAR < min_rate → clamped to min_rate, reason_code = 'MIN_RATE'
- [ ] BAR > max_rate → clamped to max_rate, reason_code = 'MAX_RATE'
- [ ] Step change > 20% → capped, reason_code = 'STEP_CAP'
- [ ] No previous price → step-change skipped, reason = 'MISSING_BASE'
- [ ] trace[] includes guardrail step with before/after/delta

---
Next Phase: phase-03-dashboard.md
