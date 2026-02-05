# Phase 03: API Routes

**Status:** ⬜ Pending  
**Dependencies:** Phase 01, Phase 02  
**Estimated Time:** 1 hour

---

## Objective

Tạo API endpoints cho CRUD Room Types, OTA Channels, Campaigns và Calculate Matrix.

---

## Tasks

### 3.1. Room Types API
- [ ] GET `/api/pricing/room-types` - List by hotel_id
- [ ] POST `/api/pricing/room-types` - Create
- [ ] PATCH `/api/pricing/room-types/[id]` - Update (partial)
- [ ] DELETE `/api/pricing/room-types/[id]` - Delete

### 3.2. OTA Channels API
- [ ] GET `/api/pricing/ota-channels` - List by hotel_id
- [ ] POST `/api/pricing/ota-channels` - Create
- [ ] PATCH `/api/pricing/ota-channels/[id]` - Update
- [ ] DELETE `/api/pricing/ota-channels/[id]` - Delete

### 3.3. Campaigns API
- [ ] GET `/api/pricing/campaigns` - List by hotel_id + ota_channel_id
- [ ] POST `/api/pricing/campaigns` - Create with validation
- [ ] PATCH `/api/pricing/campaigns/[id]` - Update
- [ ] DELETE `/api/pricing/campaigns/[id]` - Delete

### 3.4. Calculate Matrix API
- [ ] POST `/api/pricing/calc-matrix` - Calculate full RoomType × OTA matrix

---

## Files to Create

```
apps/web/app/api/pricing/
├── room-types/
│   ├── route.ts          # GET, POST
│   └── [id]/route.ts     # PATCH, DELETE
├── ota-channels/
│   ├── route.ts          # GET, POST
│   └── [id]/route.ts     # PATCH, DELETE
├── campaigns/
│   ├── route.ts          # GET, POST
│   └── [id]/route.ts     # PATCH, DELETE
└── calc-matrix/
    └── route.ts          # POST
```

---

## API Patterns

### Auth Check
```typescript
import { getActiveHotelId } from '@/lib/auth';

export async function GET(req: Request) {
  const hotelId = await getActiveHotelId();
  if (!hotelId) {
    return Response.json({ error: 'No active hotel' }, { status: 401 });
  }
  
  const items = await prisma.roomType.findMany({
    where: { hotel_id: hotelId },
    orderBy: { name: 'asc' }
  });
  
  return Response.json(items);
}
```

### PATCH Pattern
```typescript
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  
  const updated = await prisma.roomType.update({
    where: { id: params.id },
    data: body
  });
  
  return Response.json(updated);
}
```

### Calc Matrix Response
```typescript
{
  roomTypes: [{ id, name, net_price }],
  channels: [{ id, code, commission, calc_type }],
  matrix: {
    "roomTypeId:channelId": {
      bar: 1755000,
      net: 1200000,
      commission: 20,
      totalDiscount: 15,
      validation: { isValid: true, errors: [], warnings: [] },
      trace: [{ step: "Commission 20%", priceAfter: 1500000 }]
    }
  }
}
```

---

## Test Criteria

- [ ] GET room-types returns array
- [ ] POST room-types creates and returns new item
- [ ] PATCH updates only specified fields
- [ ] DELETE removes item
- [ ] calc-matrix returns correct BAR values
- [ ] All endpoints require auth

---

**Next Phase:** [phase-04-components.md](phase-04-components.md)

