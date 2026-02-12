# Phase 02: Backend API (Rev.3) ✅
Status: ✅ Complete (2026-02-12)
Dependencies: Phase 01

## Objective
API routes + engine integration. All blocking issues resolved.

## API Routes (✅ CRUD — approved to start)

### Seasons CRUD
```
POST   /api/pricing/seasons         → Create season (name, code, date_ranges, priority)
GET    /api/pricing/seasons         → List by hotel
PUT    /api/pricing/seasons/[id]    → Update
DELETE /api/pricing/seasons/[id]    → Delete
```
Date range: date-only strings, end inclusive.

### OCC Tiers
```
GET    /api/pricing/occ-tiers       → List by hotel
PUT    /api/pricing/occ-tiers       → Bulk upsert (validate: boundaries 0–1 decimal, contiguous, no gaps, 3-6 tiers)
```

### Season NET Rates
```
GET    /api/pricing/season-rates?seasonId=xxx
PUT    /api/pricing/season-rates     → Bulk upsert
POST   /api/pricing/season-rates/import → CSV upload (key: room_type_id, NOT name)
```

## Dynamic Matrix (⛔ After Rev.3 approval)

```
POST   /api/pricing/dynamic-matrix
Body: { stayDate, channelId, seasonIdOverride?, occOverride? }
```

### Implementation rules (blocking fixes locked):
```typescript
// 1. Season resolution (FIX #1)
const season = seasonIdOverride
  ? await prisma.seasonConfig.findUnique({ where: { id: seasonIdOverride } })
  : autoDetectSeason(stayDate, hotelSeasons);

// 2. OCC — backend is single source (FIX #3)
let occPct: number;
let occSource: 'otb' | 'override' | 'unavailable';
const otb = await prisma.dailyOTB.findFirst({
  where: { hotel_id: hotelId, stay_date: stayDate },
  orderBy: { as_of_date: 'desc' }
});
if (otb) {
  occPct = otb.rooms_otb / hotel.capacity;
  occSource = 'otb';
} else if (occOverride !== undefined) {
  occPct = Math.max(0, Math.min(1, occOverride)); // validate [0,1]
  occSource = 'override';
} else {
  occPct = 0;
  occSource = 'unavailable';
}

// 3. Loop tiers — reuse engine (FIX #2 + #4)
for (const tier of occTiers) {
  const netEffective = Math.round(netBase * tier.multiplier); // FIX #4: integer VND

  const result = calcBarFromNet(
    netEffective, channel.commission, discounts,
    channel.calc_type, roundingRule, channel.vendor, channel.boosters
  );

  const display = Math.round(result.bar * (1 - result.totalDiscount / 100)); // FIX #2

  perTier.push({ tierIndex, netEffective, bar: result.bar, display, net: result.net });
}
```

## Files
- `app/api/pricing/seasons/route.ts` — [NEW]
- `app/api/pricing/seasons/[id]/route.ts` — [NEW]
- `app/api/pricing/occ-tiers/route.ts` — [NEW]
- `app/api/pricing/season-rates/route.ts` — [NEW]
- `app/api/pricing/season-rates/import/route.ts` — [NEW]
- `app/api/pricing/dynamic-matrix/route.ts` — [NEW] (after approval)
- `lib/pricing/engine.ts` — [MODIFY]
- `lib/pricing/types.ts` — [MODIFY]

---
Next: [phase-03-frontend.md](./phase-03-frontend.md)
