# Phase 06: Dashboard & Controls
Status: ⬜ Pending
Dependencies: Phase 04, 05

## Objective

Build the unified "Forecast & Optimize" experience: model controls, forecast vs actual visualization, and one-click pipeline execution.

## Implementation Steps

### 1. Forecast Accuracy Tracker

```
File: apps/web/components/analytics/ForecastAccuracyChart.tsx
```

Chart comparing forecast vs actual:
- Line: `remaining_demand` (forecast) per stay_date
- Line: `actual_rooms` (from OTB at stay_date when it arrives)
- MAPE% metric displayed as KPI badge
- Filter by model_version to compare v02 heuristic vs v03 weighted

### 2. Model Config Panel

```
File: apps/web/components/analytics/ModelConfigPanel.tsx
```

- Show current model version
- Tunable parameters (per hotel):
  - STLY weight (default 1.0)
  - Confidence dampening (default 50%/75%)
  - Demand pressure zone overrides (per-hotel percentile calibration)
- ~~Re-capture rate~~ **Removed from engine** (C2). Available only in What-If Scenario panel (see below)
- "Run Forecast" button with progress indicator
- "Compare Models" toggle to show v02 vs v03 side-by-side

#### What-If Scenario Tool (UI-only, NOT in engine)
- "If X rooms cancel, market absorbs Y%" slider
- Shows projected revenue impact without modifying actual forecast
- Re-capture rate slider (default 30%) for scenario exploration only

### 3. One-Click Pipeline

In Data Inspector, add "Full Analytics Pipeline" button:
```
Build Cancel Stats → Build Features → Run Forecast → Run Pricing
```
With progress stepper showing each stage.

### 4. InsightsPanel Integration

Update `insightsV2Engine.ts` to use demand model output:
- New insight type: `demand_surge` — "Ngày X có nhu cầu gấp đôi phòng trống, nên tăng giá"
- New insight type: `soft_demand` — "Ngày X bán chậm, cân nhắc giảm giá/kích cầu"
- Replace heuristic-based "compression" insight with data-driven version

### 5. API Route: Forecast Data

```
File: apps/web/app/api/analytics/forecast/route.ts
```

Returns forecast data with confidence, model_version, trace for UI consumption.

## Files to Create/Modify

- `[NEW] apps/web/components/analytics/ForecastAccuracyChart.tsx`
- `[NEW] apps/web/components/analytics/ModelConfigPanel.tsx`
- `[NEW] apps/web/app/api/analytics/forecast/route.ts`
- `[MODIFY] apps/web/app/data/page.tsx` — Full pipeline button
- `[MODIFY] apps/web/lib/insights/insightsV2Engine.ts` — Demand-based insights
- `[MODIFY] apps/web/components/analytics/AnalyticsTabContent.tsx` — Add forecast chart

## Test Criteria

- [ ] Forecast accuracy chart renders with real data
- [ ] Model config panel saves preferences
- [ ] Full pipeline runs sequentially without errors
- [ ] New insight types generated when demand pressure exists
- [ ] Compare toggle shows both model versions

---
End of Analytics Layer P1 + P2 Plan
