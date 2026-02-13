# Phase 02: Rewire Dashboard Tab 2
Status: ⬜ Pending
Dependencies: Phase 01 complete

## Objective
Replace current Tab 2 content with AnalyticsTabContent orchestrator that lazy-loads analytics data and renders all Phase 01 components.

## Requirements
### Functional
- [ ] `AnalyticsTabContent.tsx` — client orchestrator
- [ ] Dynamic import for bundle splitting (D2)
- [ ] Enrich rows with ADR/Occ%/RevPAR (client-side)
- [ ] 2-layer tier gate: SUPERIOR sections + free sections (D3)
- [ ] viewMode state scoped to Tab 2 only (D4)
- [ ] Tab label: "Chi tiết" → "Phân tích"
- [ ] PDF: export active tab only (D6)

### Non-Functional
- [ ] Fetch only when activeTab === 'analytics'
- [ ] Loading skeleton while data fetches

## Implementation Steps
1. [ ] Create `AnalyticsTabContent.tsx` with state management
2. [ ] Wire fetch to `/api/analytics/features` with lazy trigger
3. [ ] Implement enrichment: ADR, Occ%, RevPAR per row
4. [ ] Layout: SUPERIOR gate wrapping analytics sections
5. [ ] Free sections (TopAccounts, RoomLOS, LeadTime) below gate
6. [ ] Update `DashboardTabs.tsx`: rename tab, fix PDF rendering
7. [ ] Update `page.tsx`: swap analyticsContent to dynamic import

## Files to Create/Modify
- `components/dashboard/AnalyticsTabContent.tsx` — [NEW] Orchestrator
- `components/dashboard/DashboardTabs.tsx` — [MODIFY] Tab label + PDF
- `app/dashboard/page.tsx` — [MODIFY] Tab 2 content

## Test Criteria
- [ ] Tab 2 doesn't fetch data on initial page load (Tab 1 active)
- [ ] Clicking Tab 2 triggers fetch + shows loading → content
- [ ] viewMode toggle doesn't affect Tab 1 or Tab 3
- [ ] Non-SUPERIOR user sees blurred preview + CTA
- [ ] PDF includes only active tab content

---
Next Phase: phase-03-redirect.md
