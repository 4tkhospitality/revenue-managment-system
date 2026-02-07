# Phase 06: Frontend UI

**Status:** ⬜ Pending
**Dependencies:** Phase 05
**Milestone:** M3 — UI dashboard hiển thị intraday market (latest cache) + badge trạng thái + route split

## Objective

Xây dựng 2 route UI: Rate Shopper Dashboard (market view) và Competitors Config (compset management).

## Implementation Steps

### A. Route Structure (§11.5)
1. [ ] Create `/pricing/rate-shopper/page.tsx` — main dashboard
2. [ ] Create `/pricing/competitors/page.tsx` — compset config

### B. Rate Shopper Dashboard (`/pricing/rate-shopper`)
3. [ ] **Line Chart** (Recharts) — My Price vs Comp Min/Median/Max
4. [ ] **Data Layer Toggle**: "Intraday" (latest cache) / "Daily" (snapshots)
   - Intraday → fetch `getIntraday()` server action
   - Daily → fetch `getDailySnapshot()` server action
5. [ ] **Detailed Table** — per check_in_date row with Gap%, Confidence, Alerts
6. [ ] **Status Badges** — FRESH/STALE/REFRESHING/FAILED per cache entry
7. [ ] **Timestamp** — "Data as of: {scraped_at}" (intraday) or "Snapshot: {calculated_at}" (daily)
8. [ ] **"Scan Now" Button** — with quota check + loading state
9. [ ] **Alert Panel** — out-of-market / compression / spike alerts
10. [ ] **Recommendation Panel** — suggested rate + reason codes + guardrails
11. [ ] **Horizon Selector** — tabs or dropdown for 7/14/30/60/90

### C. Competitors Config (`/pricing/competitors`)
12. [ ] **Autocomplete Search** — input + debounce → `searchCompetitor()` → suggestion dropdown
13. [ ] **Competitor List** — table with name, tier badge, star rating, active toggle, actions
14. [ ] **Add/Edit/Delete** — modal or inline editing
15. [ ] **Quota Display** — searches used this month / max

### D. Empty & Error States
16. [ ] No competitors → onboarding prompt "Add your first competitor"
17. [ ] No data yet → "Run first scan" CTA
18. [ ] API key missing → admin-only alert

## Files to Create

| File | Purpose |
|------|---------|
| `app/(dashboard)/pricing/rate-shopper/page.tsx` | Dashboard page |
| `app/(dashboard)/pricing/competitors/page.tsx` | Compset config page |
| `components/rate-shopper/market-chart.tsx` | Line chart (Recharts) |
| `components/rate-shopper/market-table.tsx` | Detailed table |
| `components/rate-shopper/alert-panel.tsx` | Alerts display |
| `components/rate-shopper/recommendation-card.tsx` | Recommendation display |
| `components/rate-shopper/competitor-search.tsx` | Autocomplete search |
| `components/rate-shopper/competitor-list.tsx` | Competitor CRUD table |
| `components/rate-shopper/status-badge.tsx` | FRESH/STALE/etc badges |
| `components/rate-shopper/data-layer-toggle.tsx` | Intraday/Daily toggle |

## Test Criteria

- [ ] Dashboard loads with intraday view by default
- [ ] Toggle switches between intraday and daily data
- [ ] Status badges correctly reflect cache status
- [ ] Scan Now button shows loading → updates data → shows success
- [ ] Competitor autocomplete returns suggestions from SerpApi
- [ ] Add/remove competitor updates the list
- [ ] Empty states render correctly

---
**Next Phase:** [Phase 07 - Integration & Polish](./phase-07-integration.md)
