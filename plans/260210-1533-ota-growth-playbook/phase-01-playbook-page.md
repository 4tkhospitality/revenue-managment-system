# Phase 01: Playbook Checklist Page
Status: ✅ Complete
Dependencies: None

## Objective
Tab mới "OTA Growth" trong `/guide` — checklist tương tác Booking.com + Agoda, premium-only.

## Implementation Steps
1. [x] Add "OTA Growth" tab to Guide page (premium-only, hide for non-paid + demo)
2. [x] Build `OTAPlaybookGuide` component with Booking.com + Agoda sub-tabs
3. [x] Create Booking.com checklist (15 items, 5 categories: Content, Pricing, Availability, Reputation, Programs)
4. [x] Create Agoda checklist (10 items: Content Score, Reviews, Rates, Programs)
5. [x] Add interactive checkboxes with localStorage persistence (Phase A — DB in Phase B)
6. [x] Add progress bar + completion percentage
7. [x] Add KPI linkage labels (CTR/Conv/Net) and funnel position per item
8. [x] Add personalization disclaimer for Booking rank
9. [x] Add benchmark disclaimers ("not guaranteed") for uplift claims

## Files to Create/Modify
- `app/guide/page.tsx` — Add OTA Growth tab
- `components/guide/OTAPlaybookGuide.tsx` — New component [NEW]
- `components/guide/BookingChecklist.tsx` — Booking.com checklist [NEW]
- `components/guide/AgodaChecklist.tsx` — Agoda checklist [NEW]

## Test Criteria
- [x] Tab visible only for premium users (hide for demo hotel)
- [x] Checklist items render with correct categories
- [x] Checkboxes toggle and persist
- [x] Progress bar updates correctly
