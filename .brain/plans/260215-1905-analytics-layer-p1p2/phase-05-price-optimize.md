# Phase 05: Price Optimization Engine
Status: ⬜ Pending
Dependencies: Phase 04

## Objective

Build a **revenue-maximizing price recommender** that uses `remaining_demand` + `net_remaining` to suggest optimal BAR per stay_date. Replaces the current ladder pricing with data-driven recommendations.

> [!IMPORTANT]
> **C5 FIX (BA Review)**: Includes net_lens (channel commission cost) + comp_set hook (for future Rate Shopper). Recalibrated demand pressure zones per BA feedback.

## How It Works

### Current (Ladder Strategy)
Static tiered pricing based on occupancy bands. No demand forecast input, no elasticity.

### New (Demand-Responsive Optimization)

```
For each stay_date:
  // Step 1: Net supply (already correct from Phase 02)
  net_remaining = remaining_supply + expected_cxl      // rooms that WILL open up
  
  // Step 2: Demand pressure (drives zone/multiplier)
  demand_pressure = remaining_demand / NULLIF(net_remaining, 0)
     - > 1.2 → more demand than supply (seller's market)
     - < 0.6 → soft demand (buyer's market)
  
  // Step 3: Expected final rooms (FIX #3 — no double-count)
  expected_final_rooms = (rooms_otb - expected_cxl)    // rooms that WILL stay
                       + min(remaining_demand, net_remaining)  // new bookings (capped by supply)
  
  // Step 4: Projected occupancy
  projected_occ = expected_final_rooms / capacity      // ∈ [0, 1]
  
  // Step 5: Price multiplier (from zones table)
  price_multiplier = getMultiplier(demand_pressure)    // RECALIBRATED zones
  
  // Step 6: Recommended price
  recommended_price = base_rate × price_multiplier × season_multiplier
  Apply guardrails: clamp(min_rate, max_rate), max_step_change
  
  // Step 7: Revenue projections
  expected_gross_revenue = recommended_price × expected_final_rooms
  expected_net_revenue   = expected_gross_revenue × (1 - channel_commission)  // C5 net lens
  uplift_pct = (expected_gross_revenue - current_revenue) / current_revenue
```

### Comp Set Hook (C5 — optional, prepared for Rate Shopper)
```typescript
// comp_position: null (no data) | 'UNDERCUT' | 'MATCH' | 'PREMIUM'
// When Rate Shopper connected, adjusts multiplier:
if (comp_position === 'UNDERCUT') multiplier *= 1.03; // hold stronger
if (comp_position === 'PREMIUM') multiplier *= 0.98;  // slight ease
// Default null = no adjustment
```

### Zone Interpolation
Instead of hard buckets, use smooth interpolation:
```typescript
function getMultiplier(pressure: number): number {
  // Piecewise linear interpolation (RECALIBRATED zones)
  const curve = [
    { pressure: 0.0,  mult: 0.85 },
    { pressure: 0.25, mult: 0.90 },   // was 0.2
    { pressure: 0.60, mult: 0.95 },   // was 0.5
    { pressure: 1.20, mult: 1.00 },   // was 1.0
    { pressure: 2.00, mult: 1.15 },
    { pressure: 3.00, mult: 1.25 },
  ];
  return interpolate(curve, pressure);
}
```

> Future: calibrate per-hotel using histogram percentiles (p20=DISTRESS, p80=SURGE) from 90-180 days of data.

## Implementation Steps

### 1. Price Optimization Engine

```
File: apps/web/lib/engine/priceOptimizer.ts
```

Pure function:
```typescript
export function optimizePrice(input: {
  baseRate: number;
  roomsOtb: number;
  remainingDemand: number;
  remainingSupply: number;
  expectedCxl: number;
  capacity: number;
  seasonMultiplier: number;
  guardrails: { minRate: number; maxRate: number; maxStepPct: number };
  currentRate?: number;
  confidence: ForecastConfidence;
  channelCommission?: number;    // C5: net lens (from ota_channels.commission_rate)
  compPosition?: 'UNDERCUT' | 'MATCH' | 'PREMIUM' | null;  // C5: comp set hook
}): {
  recommendedPrice: number;
  multiplier: number;
  zone: string;  // SURGE | STRONG | NORMAL | SOFT | DISTRESS
  expectedFinalRooms: number;       // (rooms_otb - expected_cxl) + min(demand, net_remaining)
  projectedOcc: number;             // expectedFinalRooms / capacity
  expectedGrossRevenue: number;     // price × expectedFinalRooms
  expectedNetRevenue?: number;      // C5: gross × (1 - commission)
  upliftPct: number;
  trace: string[];
  confidenceAdjusted: boolean;
}
```

Confidence dampening:
- `high/medium` → full multiplier
- `low` → dampen multiplier toward 1.0 by 50%
- `fallback` → dampen by 75% (almost neutral)

### 2. Update `runPricingEngine.ts`

```
File: apps/web/app/actions/runPricingEngine.ts
```

- Load `features_daily` + `demand_forecast` for the hotel
- For each stay_date, call `optimizePrice()`
- Save to `price_recommendations` table (already exists)
- Add `zone` and `confidence` to recommendation explanation

### 3. Enhance RecommendationTable

```
File: apps/web/components/dashboard/RecommendationTable.tsx
```

- Add zone indicator (color-coded: red=SURGE, green=STRONG, blue=NORMAL, amber=SOFT, gray=DISTRESS)
- Show confidence badge
- Tooltip with full trace
- "Tại sao?" expand section showing demand_pressure calculation

### 4. Golden Tests

```
File: apps/web/tests/price-optimizer.test.ts
```

Test cases:
- SURGE zone → price increases 15-25%
- SOFT zone → price decreases 5-10%
- DISTRESS zone → price at/near min_rate
- Guardrails respected
- Low confidence → dampened multiplier
- Season multiplier applied correctly

## Files to Create/Modify

- `[NEW] apps/web/lib/engine/priceOptimizer.ts` — Pure optimization engine
- `[MODIFY] apps/web/app/actions/runPricingEngine.ts` — Wire in optimizer
- `[MODIFY] apps/web/components/dashboard/RecommendationTable.tsx` — Zone indicators, confidence
- `[NEW] apps/web/tests/price-optimizer.test.ts` — Golden tests

## Test Criteria

- [ ] Golden tests pass with expected multiplier ranges
- [ ] Guardrails prevent extreme prices
- [ ] Low-confidence forecasts are dampened
- [ ] Zone labels correctly assigned
- [ ] Recommendation table shows zone + confidence

---
Next Phase: [phase-06-harmonize.md](./phase-06-harmonize.md)
