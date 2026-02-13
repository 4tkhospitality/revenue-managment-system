# Phase 04: Integration + Polish
Status: ⬜ Pending
Dependencies: Phase 03 (UI components)

## Objective
Integrate widgets vào `/dashboard` page, pass as_of_date cho time-travel, polish layout.

## Tasks

### 1. Dashboard Layout Update
- [ ] Add 3 widgets below AnalyticsPanel, above RecommendationTable:
  ```
  KPI Cards
  OTB Chart
  Analytics Panel (existing)
  ─── NEW SECTION: "Phân tích chi tiết" ───
  [TopAccountsTable]  ← full width
  [RoomLosMixPanel] [LeadTimeBuckets]  ← 2-col grid
  ─── END NEW ───
  Recommendation Table (existing)
  ```
- [ ] Pass `hotelId` + `asOfDate` (from time-travel DatePicker) to all new widgets

### 2. Time-Travel Integration
- [ ] New widgets react to `as_of_date` URL param (same as existing OTB chart)
- [ ] When GM changes date picker → all widgets refresh

### 3. Section Header
- [ ] Add "📊 Phân tích chi tiết" section divider with subtitle "Top accounts, room mix, booking window"
- [ ] Collapsible on mobile (accordion)

### 4. PDF Export
- [ ] Include new widgets in `DashboardPdfWrapper` scope
- [ ] Set `isAnimationActive={false}` on all Recharts Pie/Bar components (so html2canvas captures final state)
- [ ] Verify charts render correctly in exported PDF

### 5. Loading States
- [ ] Skeleton loaders for all 3 new widgets (match existing dashboard style)
- [ ] Error boundary with friendly message

## Files to Modify
- `app/dashboard/page.tsx` — add new section with widgets
- `components/dashboard/DashboardPdfWrapper.tsx` — include new content

## Acceptance
- [ ] New section visible on dashboard below Analytics Panel
- [ ] Time-travel changes all widget data
- [ ] PDF export includes all new widgets
- [ ] Mobile layout stacks correctly

---
Next Phase: [phase-05-testing.md](./phase-05-testing.md)
