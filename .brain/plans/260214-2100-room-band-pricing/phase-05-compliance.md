# Phase 05: Compliance Checks & Banners
Status: ⬜ Pending
Dependencies: Phase 04 (Frontend)

## Objective
Prevent "gaming" the system. Auto-detect capacity/band mismatch and warn or restrict.

## Components

### 1. KPI Sanity Banner (Dashboard)
**Trigger:** Any day where `rooms_sold > Hotel.capacity`
**UI:** Red banner at top of dashboard:
> "⚠️ Số phòng bán ra vượt quá cấu hình (XX phòng). Vui lòng cập nhật trong Cài đặt."

**Files:** `apps/web/app/dashboard/page.tsx` — add capacity check to existing data flow.

### 2. Billing Compliance Banner (Dashboard + Settings)
**Trigger:** `deriveBand(Hotel.capacity) > subscription.room_band`
**UI:** Yellow banner:
> "📊 Khách sạn của bạn có XX phòng (band R80) nhưng gói hiện tại là R30. Một số quota có thể bị giới hạn."
> [Nâng cấp band →]

**Logic:** Call `/api/subscription/compliance` on dashboard load.

### 3. STANDARD Guard
**Trigger:** `Hotel.capacity > 30` AND `subscription.plan === 'STANDARD'`
**UI:** Upgrade modal:
> "Gói Tiêu chuẩn chỉ dành cho khách sạn ≤ 30 phòng. Vui lòng nâng cấp."

## Implementation Steps
1. [ ] Create `useComplianceCheck()` hook (calls compliance API)
2. [ ] Add KPI sanity banner to dashboard
3. [ ] Add billing compliance banner to dashboard + settings
4. [ ] Add STANDARD guard modal
5. [ ] Test with different capacity values

---
Next Phase: [phase-06-harmonize.md](file:///c:/Apps/Antigravity/revenue-management-system/.brain/plans/260214-2100-room-band-pricing/phase-06-harmonize.md)
