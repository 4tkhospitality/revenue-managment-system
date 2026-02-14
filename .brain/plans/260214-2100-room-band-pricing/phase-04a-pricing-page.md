# Phase 04a: Frontend — Pricing Page
Status: ⬜ Pending
Dependencies: Phase 03 (API)

## Objective
Replace hardcoded PRICE_MATRIX with `getPrice()` from plan-config. Wire selected band → subscription API.

## Current State (from code audit)

```ts
// pricing-plans/page.tsx — current hardcoded prices (WRONG)
const PRICE_MATRIX = {
    SUPERIOR: { small: 990000, medium: 1490000, large: 1990000, xlarge: 2490000 },
    DELUXE:   { small: 1990000, medium: 2990000, large: 3990000, xlarge: 4990000 },
    SUITE:    { small: 3490000, medium: 4990000, large: 6990000, xlarge: 8990000 },
};
```

## Changes

1. **Remove `PRICE_MATRIX`** — replace with `getPrice(plan, band)` from plan-config
2. **Update `ROOM_BANDS`** — change ids from `small/medium/large/xlarge` to `R30/R80/R150/R300P`
3. **Import `RoomBand`** from Prisma
4. **STANDARD row** — lock to R30, disable band selector
5. **CTA button** — if logged in, POST to `/api/subscription` with `{ plan, roomBand }`
6. **Show current plan** — if user has subscription, highlight current plan+band

## Implementation Steps
1. [ ] Import `getPrice`, `RoomBand` from plan-config/Prisma
2. [ ] Replace PRICE_MATRIX with getPrice() calls
3. [ ] Update ROOM_BANDS array to use enum values
4. [ ] Lock STANDARD to R30
5. [ ] Wire CTA to subscription API (for logged-in users)
6. [ ] Highlight current plan+band if subscription exists

---
Next: [phase-04b-hotel-settings.md](file:///c:/Apps/Antigravity/revenue-management-system/.brain/plans/260214-2100-room-band-pricing/phase-04b-hotel-settings.md)
