# Phase 02: Guardrails in Pricing Engine — v4 (Final Dev-Ready)
Status: ⬜ Pending
Dependencies: Phase 01 (features populated)

## Objective
Enforce `min_rate` / `max_rate` / `step_change` limits với **priority order rõ ràng**, **reason_codes thống nhất**, và **audit trail**.

---

## 🔒 Phase 02 Locked Decisions (D25-D36)

| # | Decision | Value | Lý do |
|---|----------|-------|-------|
| D25 | **Manual override policy** | `enforce_guardrails_on_manual = false` (default) | GM có quyền, nhưng UI cảnh báo |
| D26 | **Scope P0** | Hotel-level `min_rate`/`max_rate` | Đúng schema, không scope leak |
| D27 | **prev_price source P0** | `decision_log` (lần Accept/Override gần nhất) | Rate_calendar = P0.1 |
| D28 | **reason_codes format** | `reason_codes: ReasonCode[]` (array) | 1 giá có thể trigger nhiều guardrails |
| D29 | **UI badge scope** | Badge cho `STEP_CAP`, `MIN_RATE`, `MAX_RATE` | Không chỉ min/max |
| D30 | **Tooltip format** | `before → after`, `%delta`, `threshold đang áp` | Transparency cho GM |
| D31 | **step_pct unit** | Float 0–1 (store 0.2, UI show "20%") | Code không cần chia 100 |
| D32 | **Clamp-after-rounding** | Luôn clamp lại sau rounding | Tránh rounding phá max_rate |
| D33 | **Min/Max = hard constraint** | Luôn đúng cuối cùng qua mọi bước | Step-cap = soft |
| D34 | **Warning field** | `warnings: ('OUTSIDE_MIN' \| 'OUTSIDE_MAX' \| 'OUTSIDE_STEP')[]` | Manual bypass không thêm code mới |
| D35 | **MISSING_BASE severity** | Info (không primary nếu giá không đổi) | Tránh UI nhầm "có vấn đề" |
| D36 | **INVALID_NET severity** | Hard stop (return error, không đi qua clamp) | Tránh "0 → min_rate" sai bản chất |

---

## Pipeline Logic (Final — D31-D36 Applied)

```typescript
function applyGuardrails(
  base: number,           // Engine suggestion OR manual override
  prev: number | null,    // From decision_log (D27)
  min: number,            // Hotel.min_rate
  max: number,            // Hotel.max_rate
  stepPct: number,        // 0.2 = 20% (D31)
  isManual: boolean,
  enforceOnManual: boolean
): GuardrailResult {
  
  const result: GuardrailResult = {
    reason_codes: [],
    warnings: [],
    before_price: base,
    after_price: base,
    delta_pct: 0,
    clamped: false,
    thresholds: { min, max, max_step_pct: stepPct }
  };

  let candidate = base;

  // D36: INVALID_NET = hard stop
  if (base <= 0) {
    return { ...result, reason_codes: ['INVALID_NET'], after_price: 0 };
  }

  // D25: Manual bypass check
  if (isManual && !enforceOnManual) {
    // Check violations for warnings only (D34)
    if (candidate < min) result.warnings.push('OUTSIDE_MIN');
    if (candidate > max) result.warnings.push('OUTSIDE_MAX');
    if (prev && Math.abs(candidate - prev) / prev > stepPct) {
      result.warnings.push('OUTSIDE_STEP');
    }
    result.reason_codes = ['MANUAL_OVERRIDE'];
    result.after_price = candidate;
    return result;
  }

  // === PIPELINE START ===

  // Step 1: Initial clamp (D33: min/max = hard constraint first)
  candidate = Math.max(min, Math.min(max, candidate));

  // Step 2: Step-cap (soft constraint within min/max bounds)
  if (prev !== null) {
    const maxDelta = prev * stepPct;
    const lower = Math.max(min, prev - maxDelta); // D33: respect min
    const upper = Math.min(max, prev + maxDelta); // D33: respect max
    
    if (candidate < lower) {
      candidate = lower;
      result.reason_codes.push('STEP_CAP');
    } else if (candidate > upper) {
      candidate = upper;
      result.reason_codes.push('STEP_CAP');
    }
  } else {
    result.reason_codes.push('MISSING_BASE'); // D35: info only
  }

  // Step 3: Re-clamp after step-cap (ensure within bounds)
  if (candidate < min) {
    candidate = min;
    if (!result.reason_codes.includes('MIN_RATE')) {
      result.reason_codes.push('MIN_RATE');
    }
  }
  if (candidate > max) {
    candidate = max;
    if (!result.reason_codes.includes('MAX_RATE')) {
      result.reason_codes.push('MAX_RATE');
    }
  }

  // Step 4: Rounding
  candidate = applyRounding(candidate, roundingMode);

  // Step 5: D32 — Clamp AGAIN after rounding
  if (candidate < min) {
    candidate = min;
    if (!result.reason_codes.includes('MIN_RATE')) {
      result.reason_codes.push('MIN_RATE');
    }
  }
  if (candidate > max) {
    candidate = max;
    if (!result.reason_codes.includes('MAX_RATE')) {
      result.reason_codes.push('MAX_RATE');
    }
  }

  // === PIPELINE END ===

  // D35: If only MISSING_BASE and no price change → primary = PASS
  result.clamped = candidate !== base;
  result.after_price = candidate;
  result.delta_pct = base > 0 ? (candidate - base) / base : 0;

  // Determine primary_reason
  const nonInfoCodes = result.reason_codes.filter(c => c !== 'MISSING_BASE');
  if (nonInfoCodes.length === 0) {
    result.reason_codes = ['PASS'];
  }
  result.primary_reason = nonInfoCodes[0] || 'PASS';

  return result;
}
```

---

## Reason Codes (Unified — D28)

| Code | Meaning | Severity | When |
|------|---------|----------|------|
| `PASS` | No guardrail triggered | ✅ | Final price OK |
| `MANUAL_OVERRIDE` | Manual price by GM | ℹ️ | `is_manual === true` |
| `STEP_CAP` | Step change exceeded | ⚠️ | `\|new - prev\| / prev > step_pct` |
| `MIN_RATE` | Below floor | ⚠️ | `price < min_rate` |
| `MAX_RATE` | Above ceiling | ⚠️ | `price > max_rate` |
| `MISSING_BASE` | No prev price | ℹ️ Info | Step-cap skipped (D35) |
| `INVALID_NET` | NET ≤ 0 | ❌ Hard stop | Return error immediately (D36) |

---

## Types (D28 + D34 + D35)

```typescript
type ReasonCode = 
  | 'PASS' 
  | 'MANUAL_OVERRIDE' 
  | 'STEP_CAP' 
  | 'MIN_RATE' 
  | 'MAX_RATE' 
  | 'MISSING_BASE' 
  | 'INVALID_NET';

type WarningCode = 'OUTSIDE_MIN' | 'OUTSIDE_MAX' | 'OUTSIDE_STEP';

type GuardrailResult = {
  reason_codes: ReasonCode[];      // Array (D28)
  primary_reason: ReasonCode;      // First non-info code, else PASS (D35)
  warnings: WarningCode[];         // For manual bypass (D34)
  before_price: number;
  after_price: number;
  delta_pct: number;
  clamped: boolean;
  thresholds: {
    min?: number;
    max?: number;
    max_step_pct?: number;         // 0.2 = 20% (D31)
  };
};
```

---

## Implementation Steps

### 1. Schema (D26 + D31)
- [ ] Verify `Hotel` has `min_rate` + `max_rate`
- [ ] Add `max_step_change_pct Float? @default(0.2)` (D31: store 0.2, not 20)
- [ ] Add `enforce_guardrails_on_manual Boolean @default(false)`

### 2. prev_price source (D27)
- [ ] Create/use `decision_log` table for P0
- [ ] Query: `WHERE hotel_id = ? AND stay_date = ? AND channel = ? ORDER BY created_at DESC LIMIT 1`
- [ ] Return `final_price` (after guardrails + rounding of that decision)

### 3. GuardrailResult type
- [ ] Implement full type as above
- [ ] Export from `lib/pricing/types.ts`

### 4. Apply guardrails in engine.ts
- [ ] Implement `applyGuardrails()` function
- [ ] D32: Clamp-after-rounding
- [ ] D33: Min/Max always wins
- [ ] D36: INVALID_NET = hard stop (return error, no clamp)
- [ ] D35: MISSING_BASE = info (not primary if no change)

### 5. Log to trace
- [ ] Add guardrail step to `trace[]`
- [ ] Format: `"BAR 380k → 450k (MIN_RATE: floor=450k)"`

### 6. UI feedback (D29-D30)
- [ ] Badge for `STEP_CAP`, `MIN_RATE`, `MAX_RATE`
- [ ] Tooltip: `before → after`, `%delta`, thresholds
- [ ] Manual with warnings → Yellow warning icon (không block)

### 7. Settings UI (D31 UI)
- [ ] Input: "Max step change: ___%" (UI shows %, stores 0.x)
- [ ] Input: min_rate, max_rate
- [ ] Toggle: enforce_guardrails_on_manual
- [ ] Validate: min < max, step > 0

---

## Files to Create/Modify
- `lib/pricing/engine.ts` — [MODIFY] Add guardrail pipeline
- `lib/pricing/types.ts` — [MODIFY] Add types
- `prisma/schema.prisma` — [MODIFY] Add step_pct, enforce_manual
- `app/settings/page.tsx` — [MODIFY] Guardrails config
- `app/pricing/components/PricingGrid.tsx` — [MODIFY] Badges

---

## Test Criteria

### Core Pipeline (D32-D33)
- [ ] Rounding 499k → 500k with max=499k → final = 499k (clamp wins)
- [ ] Step-cap cannot push outside min/max bounds
- [ ] Multiple codes: STEP_CAP + MAX_RATE both in array

### Severity (D35-D36)
- [ ] MISSING_BASE alone + no change → primary = PASS
- [ ] INVALID_NET (base ≤ 0) → return error, no clamp to min

### Manual Override (D25 + D34)
- [ ] Manual bypass → warnings array populated, not reason_codes
- [ ] Manual with enforce=true → goes through pipeline

### UI
- [ ] Badge for STEP_CAP, MIN_RATE, MAX_RATE
- [ ] Tooltip shows thresholds
- [ ] step_pct setting: input "20" → store 0.2

---

## P0.1 Future Scope
- Per room type guardrails
- prev_price from rate_calendar
- Seasonal min/max overrides

---
Next Phase: phase-04-verify.md
