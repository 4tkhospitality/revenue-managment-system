# Phase 05: Gross/Net Pickup + Cancel Trend (P1)
Status: ⬜ Pending
Dependencies: Tab 2 P0 stable + QA feedback

## Objective
Add Gross vs Net pickup separation and cancel trend visualization to complete the "wash story" for GM.

## Requirements
### Functional
- [ ] Gross pickup = new bookings in pickup window
- [ ] Net pickup = gross - cancellations
- [ ] Cancel trend line overlay on SupplyChart
- [ ] PaceTable: Gross/Net column pair

### Backend
- [ ] Check `pickup_source` JSON field — if already has gross/net, parse it
- [ ] Else: extend build-features to compute gross/net from ReservationsRaw
- [ ] Cancel trend: aggregate CancellationRaw by arrival_date + time window

## Implementation Steps
1. [ ] Investigate `pickup_source` JSON structure
2. [ ] Extend API or add `/api/analytics/pickup-breakdown`
3. [ ] Add Gross/Net columns to PaceTable
4. [ ] Add cancel count line to SupplyChart (dual Y-axis)
5. [ ] Build + test verification

## Test Criteria
- [ ] Gross + Cancels = Net (numbers add up)
- [ ] Cancel trend correlates with Net DOD drops
- [ ] Missing cancellation data shows N/A (not zero)
