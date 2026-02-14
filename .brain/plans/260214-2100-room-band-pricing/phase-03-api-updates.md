# Phase 03: API Updates
Status: ⬜ Pending
Dependencies: Phase 02 (Backend Logic)

## Objective
Update subscription API to resolve hotel→org, accept room_band, and add compliance endpoint.

## Files to Modify

### [MODIFY] [subscription/route.ts](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/app/api/subscription/route.ts)

**GET** — resolve hotelId → orgId, return org subscription with band fields:
```ts
// 1. Get hotelId from query or active hotel (same as before)
// 2. Resolve org_id
const hotel = await prisma.hotel.findUnique({
    where: { hotel_id: hotelId },
    select: { org_id: true },
});

// 3. Load subscription via org (or fallback hotel_id)
const subscription = hotel?.org_id
    ? await prisma.subscription.findUnique({ where: { org_id: hotel.org_id } })
    : await prisma.subscription.findFirst({ where: { hotel_id: hotelId } });

// 4. Return with band fields
return NextResponse.json({
    ...subscription,
    roomBand: subscription?.room_band ?? 'R30',
    capacitySnapshot: subscription?.capacity_snapshot ?? 0,
    priceMultiplier: subscription?.price_multiplier ?? 1.0,
    orgId: hotel?.org_id,
    usage: { ... },
});
```

**POST** — accept roomBand, resolve to org, enforce STANDARD+R30:
```ts
const { hotelId, plan, roomBand, capacitySnapshot, ...limits } = body;

// Validate STANDARD only R30
if (plan === 'STANDARD' && roomBand && roomBand !== 'R30') {
    return NextResponse.json({ error: 'STANDARD plan only available for ≤30 rooms' }, { status: 400 });
}

// Resolve org_id
const hotel = await prisma.hotel.findUnique({
    where: { hotel_id: hotelId },
    select: { org_id: true },
});

// Upsert subscription via org_id
const subscription = await prisma.subscription.upsert({
    where: { org_id: hotel.org_id },
    create: {
        org_id: hotel.org_id,
        hotel_id: hotelId, // backward compat
        plan, room_band: roomBand ?? 'R30',
        capacity_snapshot: capacitySnapshot ?? 0,
        price_multiplier: BAND_MULTIPLIER[roomBand ?? 'R30'],
        // ... limits
    },
    update: {
        ...(plan && { plan }),
        ...(roomBand && { room_band: roomBand }),
        ...(capacitySnapshot !== undefined && { capacity_snapshot: capacitySnapshot }),
        // ... limits
    },
});
```

### [NEW] [api/subscription/compliance/route.ts](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/app/api/subscription/compliance/route.ts)

GET: Compare hotel capacity vs billing band.

```ts
export async function GET(request: Request) {
    const hotelId = /* from query or session */;
    
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { capacity: true, org_id: true },
    });
    
    const subscription = await prisma.subscription.findUnique({
        where: { org_id: hotel.org_id },
    });
    
    const derivedBand = deriveBand(hotel.capacity);
    const subscriptionBand = subscription?.room_band ?? 'R30';
    
    const BAND_ORDER = { R30: 0, R80: 1, R150: 2, R300P: 3 };
    const isCompliant = BAND_ORDER[derivedBand] <= BAND_ORDER[subscriptionBand];
    
    return NextResponse.json({
        hotelCapacity: hotel.capacity,
        derivedBand,
        subscriptionBand,
        isCompliant,
        requiresUpgrade: !isCompliant,
        suggestedBand: isCompliant ? subscriptionBand : derivedBand,
        plan: subscription?.plan ?? 'STANDARD',
    });
}
```

### [NEW] [api/organization/route.ts](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/app/api/organization/route.ts)

GET: Get org info via **active hotelId** (not ambiguous "current user").

> **BA note:** User có thể thuộc nhiều org (sau migration mỗi hotel tạo 1 org).
> Endpoint phải nhận context hotelId để xác định đúng org.

```ts
export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Resolve org via active hotel (avoids multi-org ambiguity)
    const url = new URL(request.url);
    const queryHotelId = url.searchParams.get('hotelId');
    const hotelId = queryHotelId || (await getActiveHotelId());
    
    if (!hotelId) return NextResponse.json({ error: 'No hotel context' }, { status: 400 });
    
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { org_id: true },
    });
    if (!hotel?.org_id) return NextResponse.json({ error: 'Hotel not in org' }, { status: 404 });
    
    const [org, hotelCount, memberCount, subscription] = await Promise.all([
        prisma.organization.findUnique({ where: { id: hotel.org_id } }),
        prisma.hotel.count({ where: { org_id: hotel.org_id } }),
        prisma.orgMember.count({ where: { org_id: hotel.org_id } }),
        prisma.subscription.findUnique({ where: { org_id: hotel.org_id } }),
    ]);
    
    const limits = getScaledLimits(subscription?.plan ?? 'STANDARD', subscription?.room_band ?? 'R30');
    
    return NextResponse.json({
        org: { id: org.id, name: org.name, slug: org.slug },
        hotels: { count: hotelCount, maxProperties: limits.maxProperties },
        members: { count: memberCount, maxUsers: limits.maxUsers },
        subscription: {
            plan: subscription?.plan ?? 'STANDARD',
            roomBand: subscription?.room_band ?? 'R30',
            status: subscription?.status ?? 'ACTIVE',
        },
    });
}
```

## Implementation Steps
1. [ ] Update GET /api/subscription to resolve via org_id
2. [ ] Update POST /api/subscription to upsert via org_id
3. [ ] Add STANDARD+R30 validation
4. [ ] Create compliance endpoint
5. [ ] Create organization info endpoint
6. [ ] Test APIs

---
Next Phase: [phase-04a-pricing-page.md](file:///c:/Apps/Antigravity/revenue-management-system/.brain/plans/260214-2100-room-band-pricing/phase-04a-pricing-page.md)
