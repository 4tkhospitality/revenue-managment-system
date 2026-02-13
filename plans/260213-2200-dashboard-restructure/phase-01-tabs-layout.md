# Phase 01: DashboardTabs Component + Layout Restructure
Status: ⬜ Pending
Dependencies: None

## Objective
Tạo `DashboardTabs` component (client) với 3 tabs, sticky tab bar + context bar. Restructure `page.tsx` để wiring tab content.

## Implementation Steps

### 1. Create `DashboardTabs.tsx`
- [ ] Client component with `useState` for active tab
- [ ] 3 tabs: "Tổng quan", "Chi tiết", "Giá đề xuất"
- [ ] URL sync via `searchParams` (`?tab=overview|analytics|pricing`) for shareable links
- [ ] **Sticky behavior**: tab bar + context bar (as-of date + data status) stays pinned on scroll
- [ ] **Tab badges**: 
  - "Giá đề xuất (N)" → count of days needing action
  - Warning dot on "Chi tiết" if data missing (book_time, room_code)
- [ ] Smooth tab transition (no page reload, content swap via conditional render)

### 2. Update `page.tsx` layout
- [ ] Wrap DashboardPdfWrapper content in DashboardTabs
- [ ] Pass tab-specific children as props or slots
- [ ] **Tab 1 "Tổng quan"**: KpiCards → OtbChart+Insights (side-by-side 60/40) → AnalyticsPanel (7d only)
- [ ] **Tab 2 "Chi tiết"**: TopAccountsTable → RoomLosMixPanel + LeadTimeBuckets (2-col)
- [ ] **Tab 3 "Giá đề xuất"**: RecommendationTable (full)

### 3. Sticky context bar
- [ ] Move data status indicators (last reservation, last cancellation, OTB as-of) INTO tab bar area
- [ ] Time-travel picker stays sticky alongside tabs
- [ ] Use `position: sticky; top: 0; z-index: 10`

## Files to Create/Modify
- `components/dashboard/DashboardTabs.tsx` [NEW] — Tab navigation component
- `app/dashboard/page.tsx` [MODIFY] — Restructure layout into tab slots

## Test Criteria
- [ ] Tab 1 loads by default (URL has no ?tab param)
- [ ] Click tab 2 → content swaps without full page reload
- [ ] Tab URL shareable (?tab=analytics opens tab 2)
- [ ] Sticky bar pinned when scrolling in any tab
- [ ] Badge shows count for "Giá đề xuất"
- [ ] Mobile: tabs horizontally scrollable

---
Next Phase: phase-02-kpi-merge.md
