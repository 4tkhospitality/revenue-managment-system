# Phase 04: Pickup-based Demand Model
Status: ⬜ Pending
Dependencies: Phase 01-03 (P1 complete)

## Objective

Replace heuristic `runForecast.ts` with a **weighted pickup model** that uses multi-window pickup rates and STLY ratios to predict `remaining_demand` (unconstrained) more accurately.

> [!NOTE]
> This is NOT a full ML model (no XGBoost/scikit-learn). It's a **statistical demand model** using weighted pickup with STLY normalization — the industry-standard "semi-ML" approach that doesn't need Python or model training.

> [!IMPORTANT]
> **C2 enforced**: `remaining_demand` = **unconstrained demand** from pickup extrapolation only. Cancel impact is on supply side (`net_remaining`) only. NO cancel factor in demand calculation.

## How It Works

### Current (Heuristic V02)
```
avg_rate = mean(pickup_t30/30, pickup_t15/15, pickup_t7/7, pickup_t5/5, pickup_t3/3)
remaining_demand = avg_rate × lead_time_factor × days_to_arrival
```
**Problem**: Treats all pickup windows equally. T-3 should matter more for short lead, T-30 for long lead.

### New (Weighted Pickup V03)
```
For each stay_date:
  1. Compute per-window pickup rates: r_30 = t30/30, r_15 = t15/15, ...
  2. Apply lead-time-dependent weights:
     - days_to_arrival < 7:  weights = [0.05, 0.10, 0.20, 0.25, 0.40]  (T3 dominates)
     - days_to_arrival 7-14: weights = [0.10, 0.20, 0.30, 0.25, 0.15]  (T7 dominates)
     - days_to_arrival 15-30: weights = [0.15, 0.30, 0.25, 0.20, 0.10] (T15 dominates)
     - days_to_arrival > 30:  weights = [0.40, 0.25, 0.15, 0.10, 0.10] (T30 dominates)
  
  3. weighted_rate = Σ(weight_i × r_i) for non-null windows (re-normalize)
  
  4. STLY adjustment:
     pace_vs_ly = current_rooms_otb / stly_rooms_otb
     stly_factor = clamp(pace_vs_ly, 0.5, 2.0)  // Don't let STLY swing too much
  
  5. remaining_demand = weighted_rate × days_to_arrival × stly_factor
     // NOTE (C2): NO cancel re-capture. remaining_demand = unconstrained demand.
     // Cancel impact shows in net_remaining (supply side) only.
```

### Confidence Scoring
```typescript
type ForecastConfidence = 'high' | 'medium' | 'low' | 'fallback';

// Based on:
// - Number of non-null pickup windows (≥3 = high, 2 = medium, 1 = low)
// - STLY availability (boosts confidence by 1 level)
```

## Implementation Steps

### 1. New Engine: `demandModelV03.ts`

```
File: apps/web/lib/engine/demandModelV03.ts
```

Pure function (no DB calls), fully testable:
```typescript
export function forecastDemand(input: {
  stayDate: Date;
  asOfDate: Date;
  roomsOtb: number;
  capacity: number;
  pickups: { t30: number | null; t15: number | null; t7: number | null; t5: number | null; t3: number | null };
  paceVsLy: number | null;
}): {
  remainingDemand: number;
  confidence: ForecastConfidence;
  modelVersion: string;  // 'weighted_pickup_v03'
  trace: string[];       // Human-readable trace for debugging
}
```

### 2. Update `runForecast.ts`

Replace heuristic with call to `forecastDemand()`:
- Fall back to heuristic_v02 if all pickups are null
- Store model_version in `demand_forecast` table
- Add trace to a new `forecast_trace` column (JSON)

### 3. Add columns to `DemandForecast`

```prisma
// Add to DemandForecast model:
confidence      String?  // 'high' | 'medium' | 'low' | 'fallback'
forecast_trace  Json?    // Array of trace strings for debugging
```

### 4. Golden Tests

```
File: apps/web/tests/demand-model.test.ts
```

Test cases:
- Short lead (<7d) → T3 dominates
- Long lead (>30d) → T30 dominates
- STLY factor clamped at 0.5 and 2.0
- **Cancel does NOT directly increase remaining_demand** (C2 invariant)
- All nulls → fallback mode
- Single pickup → low confidence

## Files to Create/Modify

- `[NEW] apps/web/lib/engine/demandModelV03.ts` — Pure demand model
- `[MODIFY] apps/web/app/actions/runForecast.ts` — Use new model
- `[MODIFY] apps/web/prisma/schema.prisma` — Add confidence + trace columns
- `[NEW] apps/web/tests/demand-model.test.ts` — Golden tests

## Test Criteria

- [ ] All golden tests pass
- [ ] Model produces higher demand for dates with strong STLY
- [ ] Model clamps STLY factor between 0.5 and 2.0
- [ ] Short-lead dates are dominated by T3 pickup
- [ ] Fallback to heuristic when no pickup data

---
Next Phase: [phase-05-price-optimize.md](./phase-05-price-optimize.md)
