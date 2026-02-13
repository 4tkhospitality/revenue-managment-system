# Phase 03: UI — Dashboard Widgets
Status: ⬜ Pending
Dependencies: Phase 02 (APIs)

## Objective
3 widget components + 1 drill-down modal, tất cả fetch data từ Phase 02 APIs.

---

### Task 1: DataStatusBadge (shared component)
```
[OK ✓]  [Missing cancel ⚠]  [Missing STLY ⚠]  [Missing snapshots ⚠]
```
- [ ] Create `components/shared/DataStatusBadge.tsx`
- Props: `status: 'ok' | 'missing_cancel' | 'missing_stly' | 'missing_snapshots' | 'missing_booktime'`
- Color: green/amber/red

---

### Task 2: TopAccountsTable
```
┌─────────────────────────────────────────────────────────┐
│  🏢 Top Accounts (90 ngày)            [DataStatus]      │
├──────┬──────┬─────────────┬─────────┬────────┬─────────┤
│ #    │ Tên  │ Room-nights │ Revenue │ ADR    │ Cancel  │
├──────┼──────┼─────────────┼─────────┼────────┼─────────┤
│ 1    │ AGOD │ 156         │ 450M    │ 2.88M  │ 8%      │
│ 2    │ BOOK │ 120         │ 380M    │ 3.16M  │ 12% ⚠  │
│ ...  │      │             │         │        │         │
└──────┴──────┴─────────────┴─────────┴────────┴─────────┘
  Click row → Modal drill-down
```
- [ ] Create `components/dashboard/TopAccountsTable.tsx` (Client Component)
- [ ] Fetch from `/api/analytics/top-accounts`
- [ ] Sort by room_nights DESC, show Top 10
- [ ] Highlight cancel > 15% with amber badge
- [ ] Click row → open AccountDetailModal

---

### Task 3: AccountDetailModal
```
┌─────────────────────────────────────────┐
│  📋 AGODA — Chi tiết            [✕]    │
├─────────────────────────────────────────┤
│  Summary: 156 RN | 450M rev | 8% cancel│
├─────────────────────────────────────────┤
│  By Stay Date:                          │
│  Feb 15: 12 RN | Feb 16: 8 RN | ...    │
├─────────────────────────────────────────┤
│  By Room Type:                          │
│  SBD: 45% | STW: 30% | SGD: 25%        │
└─────────────────────────────────────────┘
```
- [ ] Create `components/dashboard/AccountDetailModal.tsx`
- [ ] Fetch from `/api/analytics/account-detail`
- [ ] Show stay_date breakdown table + room_type mini-bars

---

### Task 4: RoomLosMixPanel
```
┌─────────────────────────────────────────┐
│  🏨 Room Mix & LOS      [DataStatus]   │
├───────────────────┬─────────────────────┤
│  Room Type Share  │  Length of Stay      │
│  [DONUT CHART]    │  [HORIZONTAL BARS]  │
│   SBD 35%         │  1N  ████ 15%       │
│   STW 30%         │  2N  ████████ 34%   │
│   SGD 20%         │  3-5N ████████ 38%  │
│   Other 15%       │  6N+ ███ 13%        │
└───────────────────┴─────────────────────┘
```
- [ ] Create `components/dashboard/RoomLosMixPanel.tsx` (Client Component)
- [ ] Donut chart: Recharts `PieChart` for room type share
- [ ] Horizontal bars: Recharts `BarChart` (horizontal) for LOS buckets
- [ ] Responsive: stack vertically on mobile

---

### Task 5: LeadTimeBuckets
```
┌─────────────────────────────────────────┐
│  📅 Lead-time (Booking Window)  [Data]  │
├─────────────────────────────────────────┤
│  0-3d   ████████ 22%                    │
│  4-7d   ██████ 19%                      │
│  8-14d  ███████ 21%                     │
│  15-30d ████████ 24%                    │
│  31d+   █████ 14%                       │
│                                          │
│  Avg: 14.5 ngày                          │
└─────────────────────────────────────────┘
```
- [ ] Create `components/dashboard/LeadTimeBuckets.tsx` (Client Component)
- [ ] Recharts `BarChart` horizontal with percentage labels
- [ ] Show average lead-time as KPI pill

## Files to Create
- `components/shared/DataStatusBadge.tsx`
- `components/dashboard/TopAccountsTable.tsx`
- `components/dashboard/AccountDetailModal.tsx`
- `components/dashboard/RoomLosMixPanel.tsx`
- `components/dashboard/LeadTimeBuckets.tsx`

## Acceptance
- [ ] All widgets render with loading skeletons
- [ ] Data status badges show correct status
- [ ] Modal opens/closes cleanly
- [ ] Responsive layout on mobile

---
Next Phase: [phase-04-integration.md](./phase-04-integration.md)
