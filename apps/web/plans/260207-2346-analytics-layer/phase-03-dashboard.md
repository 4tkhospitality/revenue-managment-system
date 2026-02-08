# Phase 03: Dashboard UI (Analytics Panel) — v3 (Dev-Ready)
Status: ⬜ Pending
Dependencies: Phase 01 (features_daily has data)

## Objective
Hiển thị STLY, Pace, RemSupply trên dashboard **với as-of date selector** (RMS time-travel DNA).

---

## 🔒 Phase 03 Locked Decisions (D18-D24)

| # | Decision | Value | Lý do |
|---|----------|-------|-------|
| D18 | **hotelId từ session** | Derive từ `getActiveHotelId()`, không nhận từ client | RBAC security |
| D19 | **Default window** | `from = asOf`, `to = asOf + 180 days` | Khớp D8 completeness |
| D20 | **Response shape** | `{ series[], kpis{} }` — 1 API call | Giảm latency, ít bug |
| D21 | **Toggle Rooms/Revenue** | D16 đã có `revenue_otb` + `stly_revenue_otb` | P0 ready |
| D22 | **Completeness = strict** | `has pickup value` (khớp D13 Pace strict) | Nhất quán |
| D23 | **Grand total scope** | "Total in range" (from/to) | Ghi label rõ |
| D24 | **Limit + virtualization** | Server `maxDays=180`, UI scroll container | Performance |

---

## Implementation Steps

### 1. As-of Date Selector (Critical)
- [ ] Date picker hoặc slider: chọn as_of_date bất kỳ
- [ ] Default = latest as_of_date trong `daily_otb` của hotel hiện tại
- [ ] All charts/tables re-query khi user thay đổi as_of_date
- [ ] URL param: `?asOf=2026-02-07` để shareable
- [ ] Khi đổi asOf, URL param phải update + refresh page giữ đúng state

### 2. OTB vs STLY Chart
- [ ] Line chart: 2 lines (TY OTB vs STLY OTB) per stay_date
- [ ] X = stay_date, Y = rooms_otb hoặc revenue_otb (toggle)
- [ ] STLY line: dashed, muted color
- [ ] Mark `stly_is_approx` points với marker style khác
- [ ] **D21 Toggle:** "Rooms vs Revenue" (dùng `revenue_otb` + `stly_revenue_otb`)
- [ ] STLY missing → line STLY đứt đoạn (không nối ảo)

### 3. Pace Table
- [ ] Columns: stay_date | DOW | OTB | T-30 | T-15 | T-7 | T-5 | T-3 | vs LY
- [ ] NULL values show as "—" (not 0, not blank)
- [ ] Approx values show with `~` prefix (e.g., `~12`)
- [ ] Color: positive pickup = green, negative = red, NULL = gray
- [ ] Pace negative (cancel) hiển thị âm rõ ràng, không format "( )"
- [ ] **D23 Grand total:** "Total pickup (stay_date in range)" — chỉ sum trong window
- [ ] **D24 Performance:** scroll container, limit maxDays=180

### 4. RemSupply / ProjOcc Card
- [ ] Card: "Remaining Supply: X rooms (Y% projected occupancy)"
- [ ] Bar chart: capacity vs rooms_otb vs remaining_supply per stay_date
- [ ] Color zones: <60% = 🔴, 60-80% = 🟡, >80% = 🟢
- [ ] remaining_supply âm → hiển thị rõ "Overbooking"
- [ ] projected occ có thể >100% (show raw, không clamp)

### 5. KPI Cards (Quick Glance)
- [ ] Occ next 7 / 14 / 30 days (average ProjOcc)
- [ ] Pace vs LY: 7d / 30d average
- [ ] Pickup last 1 / 7 days total
- [ ] ADR implied: `revenue_otb / rooms_otb` (nếu có revenue)

### 6. Data Completeness Indicator (D22)
- [ ] Badge: `85% complete` — % stay_dates **có pickup value** (strict)
- [ ] % with STLY data
- [ ] Count of `stly_is_approx` / `pickup approx` rows
- [ ] Click → drawer showing detailed gaps
- [ ] Số "gaps" phải khớp đúng với count thực trong dataset

### 7. API Endpoint (D18-D20)
- [ ] `GET /api/analytics/features?asOf=...&from=...&to=...`
- [ ] **D18:** hotelId derive từ session (không nhận từ client)
- [ ] **D19:** Default from=asOf, to=asOf+180
- [ ] **D20:** Response shape:
```typescript
interface AnalyticsFeaturesResponse {
  series: Array<{
    stay_date: string;
    dow: number;
    rooms_otb: number;
    revenue_otb: number | null;
    stly_rooms_otb: number | null;
    stly_revenue_otb: number | null;
    pickup_t30: number | null;
    pickup_t15: number | null;
    pickup_t7: number | null;
    pickup_t5: number | null;
    pickup_t3: number | null;
    pace_vs_ly: number | null;
    remaining_supply: number | null;
    stly_is_approx: boolean;
  }>;
  kpis: {
    occ_7d: number;
    occ_14d: number;
    occ_30d: number;
    pickup_1d: number | null;
    pickup_7d: number | null;
    pace_vs_ly_7d: number | null;
    pace_vs_ly_30d: number | null;
    completeness_pct: number;
    stly_coverage_pct: number;
  };
  meta: {
    asOf: string;
    from: string;
    to: string;
    totalDays: number;
  };
}
```

### 8. Integration
- [ ] Add "Analytics" tab to dashboard hoặc separate `/analytics` page
- [ ] Responsive layout: cards → chart → table

---

## Files to Create/Modify
- `app/api/analytics/features/route.ts` — [NEW] API endpoint
- `app/analytics/page.tsx` — [NEW] Analytics page
- `app/analytics/components/AsOfSelector.tsx` — [NEW] Date picker
- `app/analytics/components/PaceTable.tsx` — [NEW] Pace table
- `app/analytics/components/STLYChart.tsx` — [NEW] STLY chart
- `app/analytics/components/SupplyCard.tsx` — [NEW] RemSupply card
- `app/analytics/components/KPICards.tsx` — [NEW] Quick-glance KPIs
- `app/analytics/components/DataQualityBadge.tsx` — [NEW] Completeness indicator

---

## Test Criteria

### Core Functionality
- [ ] Changing as_of_date re-renders all components
- [ ] NULL pickup shows "—", not 0
- [ ] STLY approx points visually distinct
- [ ] Data quality badge matches actual completeness %

### Additional (từ Auditor Review)
- [ ] asOf mặc định = max(as_of_date) của hotel hiện tại (không lẫn hotel khác)
- [ ] Khi đổi asOf, URL param update và refresh page giữ đúng state
- [ ] remaining_supply âm → UI hiển thị rõ (overbooking), projected occ có thể >100%
- [ ] STLY missing → line STLY đứt đoạn (không nối ảo)
- [ ] Pace negative hiển thị âm rõ ràng, không format "(x)" khó đọc
- [ ] Data Quality drawer: số "gaps" khớp đúng với count thực trong dataset

---
Next Phase: phase-02-guardrails.md
