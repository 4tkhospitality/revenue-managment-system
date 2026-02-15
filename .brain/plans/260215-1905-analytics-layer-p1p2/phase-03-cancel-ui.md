# Phase 03: Cancel Forecast Dashboard UI
Status: ⬜ Pending
Dependencies: Phase 02

## Objective

Show cancel forecast data on Dashboard's "Phân tích" tab and enhance SupplyChart to visualize projected availability.

## Implementation Steps

### 1. CancelForecastChart component

```
File: apps/web/components/analytics/CancelForecastChart.tsx
```

- Recharts BarChart showing per-day:
  - `rooms_otb` (blue bar)
  - `expected_cxl` (red/amber stacked, represents expected cancel rooms)
  - `net_remaining` (green line overlay, projected available supply)
- X-axis: next 30 days (stay_dates)
- Toggle: "Có CXL dự báo" / "Không CXL" to compare

### 2. Enhance SupplyChart

Add `expected_cxl` data to existing SupplyChart:
- Dotted line for `net_remaining` (supply + expected cancels)
- Tooltip shows: "Projected available: X rooms (+Y expected cancel)"
- Legend entry: "Dự báo phòng trống thực tế"

### 3. Cancel Stats Summary Card

Small KPI card showing:
- Avg cancel rate (overall hotel)
- Top cancelling segment (e.g., "OTA: 28%")
- Sample size / confidence indicator
- Last computed date

### 4. API Route

```
File: apps/web/app/api/analytics/cancel-forecast/route.ts
```

Returns `expected_cxl`, `net_remaining`, `cxl_rate_used`, `cxl_confidence` for each stay_date (from `features_daily`).

### 5. Wire into AnalyticsTabContent

Add `CancelForecastChart` to Tab "Phân tích", placed after SupplyChart.

## Files to Create/Modify

- `[NEW] apps/web/components/analytics/CancelForecastChart.tsx`
- `[MODIFY] apps/web/components/analytics/SupplyChart.tsx` — Add net_remaining line
- `[NEW] apps/web/app/api/analytics/cancel-forecast/route.ts`
- `[MODIFY] apps/web/components/analytics/AnalyticsTabContent.tsx` — Wire new chart

## Test Criteria

- [ ] CancelForecastChart renders when cancel stats exist
- [ ] Shows empty state / "Chưa có dữ liệu cancel" when no stats
- [ ] SupplyChart dotted line appears with tooltip
- [ ] API returns correct data matching features_daily
- [ ] Responsive layout on mobile

---
Next Phase: [phase-04-demand-model.md](./phase-04-demand-model.md)
