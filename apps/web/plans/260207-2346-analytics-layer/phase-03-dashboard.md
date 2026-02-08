# Phase 03: Dashboard UI (Analytics Panel) — v2
Status: ⬜ Pending
Dependencies: Phase 01 (features_daily has data)

## Objective
Hiển thị STLY, Pace, RemSupply trên dashboard **với as-of date selector** (RMS time-travel DNA).

## Implementation Steps

### 1. As-of Date Selector (Critical)
- [ ] Date picker or slider: chọn as_of_date bất kỳ
- [ ] Default = latest as_of_date in `daily_otb`
- [ ] All charts/tables re-query khi user thay đổi as_of_date
- [ ] URL param: `?asOf=2026-02-07` để shareable

### 2. OTB vs STLY Chart
- [ ] Line chart: 2 lines (TY OTB vs STLY OTB) per stay_date
- [ ] X = stay_date, Y = rooms_otb
- [ ] STLY line: dashed, muted color
- [ ] Mark `stly_is_approx` points with different marker style
- [ ] Toggle: "Rooms vs Revenue" (rooms_otb vs revenue_otb)

### 3. Pace Table
- [ ] Columns: stay_date | DOW | OTB | T-30 | T-15 | T-7 | T-5 | T-3 | vs LY
- [ ] NULL values show as "—" (not 0, not blank)
- [ ] Approx values show with `~` prefix (e.g., `~12`)
- [ ] Color: positive pickup = green, negative = red, NULL = gray
- [ ] Grand total row at bottom

### 4. RemSupply / ProjOcc Card
- [ ] Card: "Remaining Supply: X rooms (Y% projected occupancy)"
- [ ] Bar chart: capacity vs rooms_otb vs remaining_supply per stay_date
- [ ] Color zones: <60% = 🔴, 60-80% = 🟡, >80% = 🟢

### 5. KPI Cards (Quick Glance)
- [ ] Occ next 7 / 14 / 30 days (average ProjOcc)
- [ ] Pace vs LY: 7d / 30d average
- [ ] Pickup last 1 / 7 days total

### 6. Data Completeness Indicator
- [ ] Badge: `85% complete` — % stay_dates with full T-30/T-15/T-7 snapshots
- [ ] % with STLY data
- [ ] Count of `stly_is_approx` / `pickup approx` rows
- [ ] Click → drawer showing detailed gaps

### 7. API Endpoint
- [ ] `GET /api/analytics/features?hotelId=...&asOf=...&from=...&to=...`
- [ ] JOIN `features_daily` + `daily_otb` for combined response
- [ ] Include STLY, pickup, remaining_supply, approx flags

### 8. Integration
- [ ] Add "Analytics" tab to dashboard or separate `/analytics` page
- [ ] Responsive layout: cards → chart → table

## Files to Create/Modify
- `app/api/analytics/features/route.ts` — [NEW] API endpoint
- `app/dashboard/components/AsOfSelector.tsx` — [NEW] Date picker
- `app/dashboard/components/PaceTable.tsx` — [NEW] Pace table
- `app/dashboard/components/STLYChart.tsx` — [NEW] STLY chart
- `app/dashboard/components/SupplyCard.tsx` — [NEW] RemSupply card
- `app/dashboard/components/KPICards.tsx` — [NEW] Quick-glance KPIs
- `app/dashboard/components/DataQualityBadge.tsx` — [NEW] Completeness indicator
- `app/dashboard/page.tsx` — [MODIFY] Add analytics section

## Test Criteria
- [ ] Changing as_of_date re-renders all components
- [ ] NULL pickup shows "—", not 0
- [ ] STLY approx points visually distinct
- [ ] Data quality badge matches actual completeness %

---
Next Phase: phase-04-verify.md
