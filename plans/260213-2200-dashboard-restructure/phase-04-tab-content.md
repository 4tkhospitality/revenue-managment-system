# Phase 04: Tab Content Wiring + 7-Day Analytics Table
Status: ⬜ Pending
Dependencies: Phase 01, Phase 03

## Objective
Wire all existing components into correct tabs. Trim AnalyticsPanel to 7 days in Tab 1 with "Xem thêm" expansion. Ensure Tab 1 = "đủ để ra quyết định".

## Implementation Steps

### 1. Tab 1 "Tổng quan" content wiring
- [ ] KpiCards (5 cards, merged) — full width
- [ ] 2-column grid (60/40):
  - Left: OtbChart
  - Right: Insights cards (extracted from KpiCards into standalone display)
- [ ] AnalyticsPanel trimmed to `take: 7` (7 ngày tới only)
- [ ] "Xem thêm →" link at bottom → navigates to Tab 3 or expands inline

### 2. Tab 2 "Chi tiết" content wiring
- [ ] TopAccountsTable — full width
- [ ] 2-column grid:
  - Left: RoomLosMixPanel
  - Right: LeadTimeBuckets
- [ ] All components already exist; just move their Suspense wrappers into Tab 2 content

### 3. Tab 3 "Giá đề xuất" content wiring
- [ ] RecommendationTable — full width with Accept/Override actions
- [ ] Include full AnalyticsPanel (all 90 days) above RecommendationTable as context
- [ ] Tab badge: count of rows where `recommendedPrice !== currentPrice`

### 4. PDF export accommodation
- [ ] PDF export should capture ALL tabs' content (not just active tab)
- [ ] DashboardPdfWrapper wraps all 3 tabs for PDF
- [ ] Active view only shows current tab (CSS hide/show for non-active)

### 5. Time-travel sync
- [ ] All 3 tabs react to `?as_of_date` change
- [ ] Tab switch preserves `as_of_date` in URL

## Files to Modify
- `app/dashboard/page.tsx` [MODIFY] — Final wiring of all components into tabs
- `components/dashboard/AnalyticsPanel.tsx` [MODIFY] — Add `maxDays` prop for 7-day trim
- `components/dashboard/DashboardTabs.tsx` [MODIFY] — Badge counts, PDF mode

## Test Criteria
- [ ] Tab 1: GM sees KPI + chart + insights + 7d table in ≤1.5 screens
- [ ] Tab 2: TopAccounts + RoomLOS + LeadTime render correctly
- [ ] Tab 3: Full recommendation table with action buttons
- [ ] Time-travel: change as_of_date → all tabs update
- [ ] PDF: exports all content across all tabs

---
Next Phase: phase-05-testing.md
