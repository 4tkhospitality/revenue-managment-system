# Phase 01: Componentize + P0 Metrics
Status: ⬜ Pending
Dependencies: Phase B complete (Dashboard tabbed layout)

## Objective
Extract 6 sections from /analytics/page.tsx (734 LOC) into reusable components with P0 metrics baked in.

## Requirements
### Functional
- [ ] 9 new components in `components/analytics/`
- [ ] PaceTable with GM-scan column order (D7)
- [ ] ADR/Occ%/RevPAR computed client-side (D9: N/A when rooms=0)
- [ ] SupplyChart with color thresholds (D8)
- [ ] Summary row in PaceTable header
- [ ] All emoji replaced with Lucide SVG

### Non-Functional
- [ ] No backend/API changes
- [ ] Tree-shakeable barrel exports

## Implementation Steps
1. [ ] Create `components/analytics/` folder
2. [ ] `AnalyticsKpiRow.tsx` — 6 KPI cards (Occ 7/14/30, Pace 7/30, Pickup) + ADR avg
3. [ ] `DodChips.tsx` — Net DOD chip + Top Change Day chip (Lucide ArrowUpDown, Flame)
4. [ ] `DatesToWatchPanel.tsx` — ranked list with category icons + maxItems prop
5. [ ] `StlyComparisonChart.tsx` — line chart "OTB vs STLY (60d)" with rooms/rev toggle
6. [ ] `SupplyChart.tsx` — bar chart with color zones (green/yellow/red/black per D8)
7. [ ] `PaceTable.tsx` — GM-scan columns, summary row, collapsible, maxRows prop
8. [ ] `AnalyticsControls.tsx` — As-Of dropdown + Rooms/Rev toggle + DataQualityBadge
9. [ ] `DataQualityBadge.tsx` — completeness indicator with Lucide icons
10. [ ] `index.ts` — barrel re-exports

## Files to Create
- `components/analytics/AnalyticsKpiRow.tsx` — KPI display
- `components/analytics/DodChips.tsx` — Day-over-day indicators
- `components/analytics/DatesToWatchPanel.tsx` — Priority dates
- `components/analytics/StlyComparisonChart.tsx` — STLY chart
- `components/analytics/SupplyChart.tsx` — Supply visualization
- `components/analytics/PaceTable.tsx` — Main pace table
- `components/analytics/AnalyticsControls.tsx` — Controls bar
- `components/analytics/DataQualityBadge.tsx` — Data quality
- `components/analytics/index.ts` — Barrel exports

## PaceTable Column Spec
### Rooms mode (default):
`Ngày | DOW | OTB | Occ% | Supply | T-3 | T-7 | T-15 | T-30 | vs STLY | DOD`

### Revenue mode:
`Ngày | DOW | OTB(Rev) | Occ% | Supply | T-3 | T-7 | T-15 | T-30 | vs STLY(Rev) | ADR | RevPAR | DOD`

## Test Criteria
- [ ] Each component renders in isolation with mock data
- [ ] ADR shows "N/A" when rooms_otb === 0
- [ ] SupplyChart colors match D8 thresholds
- [ ] PaceTable hides columns with 100% null data
- [ ] No emoji in any component (grep check)

---
Next Phase: phase-02-rewire-tab2.md
