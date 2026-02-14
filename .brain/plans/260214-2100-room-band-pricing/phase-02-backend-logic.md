# Phase 02: Backend Logic
Status: ⬜ Pending
Dependencies: Phase 01 (DB)

## Objective
Add room band awareness to PLG quota system. Entitlements now resolve via Organization.

## Files to Modify

### [MODIFY] [plan-config.ts](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/lib/plg/plan-config.ts)

1. Add `BAND_MULTIPLIER` map:
```ts
import { RoomBand } from '@prisma/client';

const BAND_MULTIPLIER: Record<RoomBand, number> = {
    R30: 1.0,  R80: 1.3,  R150: 1.6,  R300P: 2.0,
};
```

2. Add `getScaledLimits(plan, band)` function:
```ts
export function getScaledLimits(plan: PlanTier, band: RoomBand): PlanLimits {
    const base = LIMIT_MAP[plan];
    const mult = BAND_MULTIPLIER[band];
    return {
        ...base,
        maxImportsMonth: base.maxImportsMonth === 0 ? 0 : Math.ceil(base.maxImportsMonth * mult),
        maxExportsDay: base.maxExportsDay === 0 ? 0 : Math.ceil(base.maxExportsDay * mult),
        maxExportRows: base.maxExportRows === 0 ? 0 : Math.ceil(base.maxExportRows * mult),
        includedRateShopsMonth: base.includedRateShopsMonth === 0 ? 0 : Math.ceil(base.includedRateShopsMonth * mult),
        dataRetentionMonths: base.dataRetentionMonths === 0 ? 0 : Math.ceil(base.dataRetentionMonths * mult),
        // NOT scaled: maxUsers, maxProperties, maxScenarios
    };
}
```

3. Add helpers:
```ts
export function getBandMultiplier(band: RoomBand): number { return BAND_MULTIPLIER[band]; }

export function deriveBand(capacity: number): RoomBand {
    if (capacity <= 30) return 'R30';
    if (capacity <= 80) return 'R80';
    if (capacity <= 150) return 'R150';
    return 'R300P';
}

const BASE_PRICE: Record<PlanTier, number> = {
    STANDARD: 0, SUPERIOR: 990_000, DELUXE: 1_990_000, SUITE: 3_490_000,
};

export function getPrice(plan: PlanTier, band: RoomBand): number {
    const raw = BASE_PRICE[plan] * BAND_MULTIPLIER[band];
    return Math.round(raw / 10_000) * 10_000;
}
```

### [MODIFY] [types.ts](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/lib/plg/types.ts)

Add `roomBand` and `orgId` to Entitlements:
```ts
import { RoomBand } from '@prisma/client';

export interface Entitlements {
    // ... existing fields
    roomBand: RoomBand;
    orgId: string | null;
}
```

### [MODIFY] [entitlements.ts](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/lib/plg/entitlements.ts)

**Key change:** `getEntitlements(hotelId)` now resolves `hotel → org → subscription`:

```ts
export async function getEntitlements(hotelId: string): Promise<Entitlements> {
    // Check cache first (unchanged)
    
    // Step 1: Find hotel's org
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { org_id: true },
    });
    
    // Step 2: Load subscription via org_id (or fallback to hotel_id for migration)
    let subscription;
    if (hotel?.org_id) {
        subscription = await prisma.subscription.findUnique({
            where: { org_id: hotel.org_id },
        });
    } else {
        // Fallback for hotels not yet migrated to org
        subscription = await prisma.subscription.findFirst({
            where: { hotel_id: hotelId },
        });
    }
    
    // Step 3: Build entitlements with scaled limits
    const roomBand = subscription?.room_band ?? 'R30';
    const defaultLimits = getScaledLimits(effectivePlan, roomBand);
    
    // Step 4: Apply admin overrides (same as before)
    const limits: PlanLimits = {
        maxUsers: subscription.max_users ?? defaultLimits.maxUsers,
        // ... rest same, but base from getScaledLimits() not getDefaultLimits()
    };
    
    // Include roomBand + orgId in return
    const entitlements: Entitlements = {
        // ... existing fields
        roomBand,
        orgId: hotel?.org_id ?? null,
    };
}
```

### [NO CHANGE] [guard.ts](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/lib/plg/guard.ts)

`getQuotaInfo()` reads limits from `getEntitlements()` which now returns scaled limits automatically. ✅

### ⚠️ [CRITICAL] Suite Hotel Access Guard Rule

> **BA đã chỉ ra:** Nếu giữ HotelUser as-is mà không thêm rule, Suite user sẽ
> "thấy list hotels" nhưng click vào bị 403 vì không có HotelUser record.

**Rules khi user mở 1 hotel:**

```ts
// In auth middleware or hotel access check function:
async function canAccessHotel(userId: string, hotelId: string): Promise<boolean> {
    // Rule 1: Direct HotelUser record exists (existing behavior)
    const hotelUser = await prisma.hotelUser.findUnique({
        where: { user_id_hotel_id: { user_id: userId, hotel_id: hotelId } },
    });
    if (hotelUser?.is_active) return true;
    
    // Rule 2: OrgMember of org that owns this hotel + org has Suite plan
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { org_id: true },
    });
    if (!hotel?.org_id) return false;
    
    const orgMember = await prisma.orgMember.findUnique({
        where: { org_id_user_id: { org_id: hotel.org_id, user_id: userId } },
    });
    if (!orgMember) return false;
    
    // Check org subscription is Suite
    const subscription = await prisma.subscription.findUnique({
        where: { org_id: hotel.org_id },
        select: { plan: true },
    });
    
    return subscription?.plan === 'SUITE';
}
```

**Where to add — ALL entry points must use this rule:**
- `middleware.ts` or `getActiveHotelId()` — primary hotel context resolver
- `getHotelSubscription()` — subscription access check
- `/api/subscription` route — GET/POST
- `/api/subscription/compliance` route
- `/api/organization` route
- Any other route that takes `hotelId` param

> ⚠️ **BA warning:** If ANY entry point still checks "HotelUser only" without Rule 2,
> Suite users will get 403 on that route. Audit ALL routes during Phase 02 implementation.

**Auto-create HotelUser (optional optimization):**
When Suite OrgMember accesses hotel via Rule 2, auto-create a HotelUser record with role=viewer so subsequent checks are fast (Rule 1 hit).

## Implementation Steps
1. [ ] Add BAND_MULTIPLIER, getScaledLimits(), deriveBand(), getPrice() to plan-config.ts
2. [ ] Add roomBand + orgId to Entitlements in types.ts
3. [ ] Update getEntitlements() to resolve hotel→org→subscription
4. [ ] Update buildEntitlements() to accept roomBand param
5. [ ] **Add Suite access guard rule** — canAccessHotel() with OrgMember+Suite fallback
6. [ ] Export new functions
7. [ ] Build test

## Test Criteria
- [ ] `getScaledLimits('SUPERIOR', 'R80')` → `{ maxImportsMonth: 20, maxExportsDay: 13 }`
- [ ] `getScaledLimits('SUITE', 'R300P')` → all ∞ (0) unchanged
- [ ] `deriveBand(45)` → `'R80'`
- [ ] `getPrice('DELUXE', 'R80')` → `2_590_000`
- [ ] `getEntitlements(hotelId)` → resolves via org_id, returns roomBand
- [ ] **Suite OrgMember can access any hotel in org** (Rule 2)
- [ ] **Non-Suite OrgMember without HotelUser gets 403** (only Rule 1 applies)
- [ ] **Suite user with no OrgMember for that org → 403** (must be member)

---
Next Phase: [phase-03-api-updates.md](file:///c:/Apps/Antigravity/revenue-management-system/.brain/plans/260214-2100-room-band-pricing/phase-03-api-updates.md)
