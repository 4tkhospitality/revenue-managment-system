# Phase 03: Redirect /analytics
Status: ⬜ Pending
Dependencies: Phase 02 complete

## Objective
Replace standalone /analytics page with smart redirect to /dashboard?tab=analytics, preserving all query params.

## Implementation Steps
1. [ ] Rewrite `/analytics/page.tsx` — parse searchParams, build redirect URL with `tab=analytics` + all existing params (D1)
2. [ ] Delete `/analytics/loading.tsx` — no longer needed
3. [ ] Verify: `/analytics?as_of_date=2026-02-10&view=revenue` → `/dashboard?tab=analytics&as_of_date=2026-02-10&view=revenue`

## Files to Modify
- `app/analytics/page.tsx` — [REWRITE] Smart redirect (~10 LOC)
- `app/analytics/loading.tsx` — [DELETE]

## Test Criteria
- [ ] Redirect preserves as_of_date, view, hotel_id params
- [ ] No 404 or flash of old page
- [ ] Browser back button works correctly

---
Next Phase: phase-04-uupm-polish.md
