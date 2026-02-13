# Phase 04: UUPM Polish
Status: ⬜ Pending
Dependencies: Phase 03 complete

## Objective
Apply UUPM design system across all new analytics components.

## Implementation Steps
1. [ ] Verify all emoji → Lucide SVG (w-4 h-4 inline, w-5 h-5 headers)
2. [ ] UUPM card style: `rounded-xl border-slate-200 shadow-sm bg-white`
3. [ ] Hardcoded hex → Tailwind semantic classes
4. [ ] Chart labels: Tab 1 "OTB & Forecast (30d)" vs Tab 2 "OTB vs STLY (60d)" (D5)
5. [ ] Build verification: `npm run build` exit code 0
6. [ ] Grep verification: 0 emoji hits in `components/analytics/`

## Test Criteria
- [ ] Build passes
- [ ] No emoji in analytics components
- [ ] Consistent card styling across Tab 2

---
Next Phase: phase-05-gross-net-cancel.md
