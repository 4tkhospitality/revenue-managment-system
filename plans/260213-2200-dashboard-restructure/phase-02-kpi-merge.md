# Phase 02: KPI Cards Merge + Color Polish
Status: ⬜ Pending
Dependencies: Phase 01

## Objective
Merge Cancellation cards vào KPI row thành 5-card layout. Apply color discipline rules. Replace emoji icons.

## Implementation Steps

### 1. Merge KPI + Cancellation into single row
- [ ] Combine into `grid-cols-5` (desktop), `grid-cols-2` (mobile, last card spans full)
- [ ] Card 5 = dual-stat card: "Hủy/Mất" with cancelled RN (red) + lost revenue (amber) stacked
- [ ] Remove separate `grid-cols-2` cancellation row from KpiCards

### 2. Color discipline
- [ ] Replace emoji icons in KPI formulas (`📐 📈`) with Lucide icons
- [ ] Amber backgrounds (`bg-amber-50`) only for genuine warnings
- [ ] Insights panel: reduce colorful backgrounds, use subtle left-border-color + neutral bg instead
- [ ] Text: ensure primary text = `slate-800`, muted = `slate-500` (minimum contrast)

### 3. Insights panel refinement
- [ ] Move Insights into side-by-side layout with OtbChart (Tab 1, right column 40%)
- [ ] Reduce card padding to fit narrower column
- [ ] Insight cards: neutral white bg + colored left border (4px) instead of full colored bg

## Files to Modify
- `components/dashboard/KpiCards.tsx` [MODIFY] — Merge cancellation, fix icons, color discipline
- `app/dashboard/page.tsx` [MODIFY] — OtbChart + Insights side-by-side grid

## Test Criteria
- [ ] 5 KPI cards in single row on desktop
- [ ] Mobile: 2 columns, last card spans
- [ ] No emoji icons remain in KPI area
- [ ] Amber used ONLY for warning states
- [ ] Insights panel renders beside OtbChart

---
Next Phase: phase-03-icon-cleanup.md
