# Phase 04b: Frontend — Hotel Settings
Status: ⬜ Pending
Dependencies: Phase 03 (API)

## Objective
Add subscription/band visibility + compliance + org context to Hotel Settings.

## UI Blocks

### Block 1: Organization Context (NEW for Cách 2)
```
┌─────────────────────────────────────────┐
│ 🏢 Organization: Sunset Hotels          │
│    Hotels: 2/∞ (Suite) | Members: 4/999 │
│    [Quản lý Organization →]             │
└─────────────────────────────────────────┘
```
- Org name from `/api/organization`
- Hotels count / maxProperties
- Members count / maxUsers
- Non-Suite: "Hotels: 1/1" + "Add hotel" disabled
- Suite: "Hotels: x/∞" + "Add hotel" enabled

### Block 2: Subscription Badge (read-only)
```
┌─────────────────────────────────────────┐
│ 📋 Gói hiện tại                         │
│                                         │
│  [🟣 Deluxe]  •  Band: R80 (31–80 phòng) │
│  Giá: 2.590.000₫/tháng                 │
│                                         │
│  [Nâng cấp gói →]                       │
└─────────────────────────────────────────┘
```
- Plan label + color from `getPlanLabel()` / `getPlanColor()`
- Band from subscription
- Price from `getPrice(plan, band)`
- CTA → `/pricing-plans`

### Block 3: Operational Capacity Field
```
┌─────────────────────────────────────────┐
│ 🏨 Số phòng (KPI)                      │
│                                         │
│  [  65  ] phòng   ℹ️                   │
│  ↳ Dùng để tính Occ%, RevPAR…          │
│  ↳ Band suy ra: R80 (31–80 phòng)      │
│                                         │
│  ⚠️ Nếu khác band gói hiện tại,        │
│     quota có thể bị giới hạn           │
└─────────────────────────────────────────┘
```
- Input bound to `Hotel.capacity`
- Tooltip: "Dùng để tính KPI. Không ảnh hưởng billing."
- On change → `deriveBand()` → compare with subscription.room_band

### Block 4: Compliance Panel (conditional)
Only shows when `derivedBand > subscription.room_band`:
```
┌─────────────────────────────────────────┐
│ ⚠️ Band không khớp                     │
│                                         │
│  Khách sạn: 65 phòng → Band R80        │
│  Gói hiện tại: Band R30                │
│                                         │
│  Quota đang bị giới hạn theo R30.       │
│  [Nâng cấp band →]                      │
└─────────────────────────────────────────┘
```

### Block 5: Quota Usage Panel
```
┌─────────────────────────────────────────┐
│ 📊 Hạn mức sử dụng (tháng này)         │
│                                         │
│  Imports:    ██████░░░░  12/20          │
│  Exports:    ███░░░░░░░   4/13 per day  │
│  Rate shops: █░░░░░░░░░   1/7           │
│  Retention:  16 tháng | Users: 2/3      │
└─────────────────────────────────────────┘
```
- Progress bars (green → yellow → red at 80% → red at 100%)
- Limits from scaled entitlements (API response)

## Components to Create
- `components/settings/OrgContextBadge.tsx` — Block 1
- `components/settings/SubscriptionBadge.tsx` — Block 2
- `components/settings/QuotaUsagePanel.tsx` — Block 5

## Implementation Steps
1. [ ] Create OrgContextBadge component (calls /api/organization)
2. [ ] Create SubscriptionBadge component
3. [ ] Add capacity field with deriveBand() inline check
4. [ ] Create compliance panel (conditional)
5. [ ] Create QuotaUsagePanel with progress bars
6. [ ] Wire to API responses
7. [ ] Build verify

---
Next: [phase-04c-user-management.md](file:///c:/Apps/Antigravity/revenue-management-system/.brain/plans/260214-2100-room-band-pricing/phase-04c-user-management.md)
