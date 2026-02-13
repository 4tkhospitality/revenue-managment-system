# Phase 05: Testing & Verification
Status: ⬜ Pending
Dependencies: Phase 04

## Objective
Verify dashboard restructure works correctly across all dimensions: functionality, responsiveness, performance, accessibility.

## Test Checklist

### Functional
- [ ] Tab 1 "Tổng quan" loads by default
- [ ] Tab 2 "Chi tiết" shows all analytics widgets
- [ ] Tab 3 "Giá đề xuất" shows recommendation table with actions
- [ ] Tab URL shareable: `?tab=analytics` opens correct tab
- [ ] Sticky tab bar pinned during scroll
- [ ] Badge counts accurate on tabs
- [ ] 7-day analytics table in Tab 1 with "Xem thêm" link
- [ ] "Xem thêm" navigates to full table view

### Responsiveness
- [ ] Desktop (1440px): 5 KPI cards in row, OtbChart+Insights side-by-side
- [ ] Tablet (768px): KPI cards wrap to 2 columns, charts stack
- [ ] Mobile (375px): Everything single column, tabs horizontally scrollable
- [ ] No horizontal scrollbar on any viewport

### Performance
- [ ] `next build` passes with no TypeScript errors
- [ ] Tab switch feels instant (<100ms perceived)
- [ ] All analytics APIs respond <200ms
- [ ] No layout shift during tab transitions

### Visual QA
- [ ] Zero emoji icons remaining as UI elements in dashboard
- [ ] All Lucide icons consistent size and opacity
- [ ] Color discipline: amber only on warnings
- [ ] PDF export captures all tabs' content

### Accessibility
- [ ] Tab navigation works with keyboard (Arrow keys + Enter)
- [ ] `aria-selected` on active tab
- [ ] Focus visible on interactive elements
- [ ] Color contrast ≥4.5:1 on all text

## Verification Method
1. Run `next build` → verify 0 errors
2. Open localhost:3000/dashboard → visual inspection
3. Test each tab + URL params
4. Resize browser for responsive check
5. Keyboard-only navigation test
