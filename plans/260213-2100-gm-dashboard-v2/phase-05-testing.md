# Phase 05: Testing & Verification
Status: ⬜ Pending
Dependencies: Phase 04

## Objective
Verify data accuracy, time-travel semantics, and UX quality.

## Tasks

### 1. Data Accuracy
- [ ] Top Accounts: verify room-nights sum matches raw data
- [ ] Room Mix: verify share % adds up to 100%
- [ ] LOS: verify bucket counts match total bookings
- [ ] Lead-time: verify avg lead-time calculation
- [ ] Cancel rate: N/A shown when cancel data insufficient

### 2. Time-Travel Verification
- [ ] Change as_of_date → Top Accounts data changes
- [ ] Change as_of_date → Lead-time distribution changes
- [ ] Lead-time query respects `book_time <= cutoff` and `cancel_time > cutoff`

### 3. Edge Cases
- [ ] Hotel with no reservations → empty state with helper text
- [ ] Hotel with no `room_code` data → "Unknown" group
- [ ] Hotel with no `book_time` data → Lead-time shows "Missing data" badge
- [ ] All cancel data missing → Cancel rate shows "N/A"

### 4. Performance
- [ ] All API endpoints respond < 200ms (with indexes)
- [ ] Dashboard page load < 3s total

### 5. Visual QA
- [ ] Desktop (1440px): 2-column grid for RoomMix + LeadTime
- [ ] Mobile (375px): stacked single column
- [ ] PDF export: all charts render correctly

## Acceptance
- [ ] All data accuracy tests pass
- [ ] Time-travel works end-to-end
- [ ] No console errors
- [ ] Production build (`next build`) passes
