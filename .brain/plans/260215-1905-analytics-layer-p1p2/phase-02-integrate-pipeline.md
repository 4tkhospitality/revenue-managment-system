# Phase 02: Integrate Cancel Forecast into Pipeline
Status: ⬜ Pending
Dependencies: Phase 01

## Objective

Wire `getExpectedCancelRooms()` into existing pipeline: `buildFeaturesDaily`, `runForecast`, and `dailyAction`. This **upgrades RemSupply** from `capacity - rooms_otb` to `capacity - rooms_otb + expected_cxl`.

> [!IMPORTANT]
> **C2 FIX (BA Review)**: `remaining_demand` = **unconstrained demand** (pickup extrapolation only). NO re-capture added to demand. Cancel effect appears ONLY in supply side via `net_remaining`.
>
> **Definition**:
> - `remaining_demand` := what the market wants to book (from pickup model)
> - `net_remaining` := projected available supply = `remaining_supply + expected_cxl`
> - `demand_pressure` := `remaining_demand / net_remaining`

## Implementation Steps

### 1. Add columns to `features_daily`

```prisma
// Add to FeaturesDaily model:
expected_cxl       Int?     // Expected cancellation rooms
net_remaining      Int?     // remaining_supply + expected_cxl (projected available)
cxl_rate_used      Float?   // The cancel rate applied
cxl_confidence     String?  // 'high' | 'medium' | 'low'
```

### 2. Update `buildFeaturesDaily.ts`

In `buildForSingleAsOf()`, after computing `remaining_supply`:
1. Load `cancel_rate_stats` for the hotel
2. For each stay_date row, call `getExpectedCancelRooms()`
3. Set `expected_cxl`, `net_remaining = remaining_supply + expected_cxl`
4. Persist `cxl_rate_used`, `cxl_confidence`

### 3. Update `runForecast.ts`

Currently uses `remaining_supply` for fallback. Upgrade:
```diff
- const supply = Math.max(0, f.remaining_supply || 0);
+ const supply = Math.max(0, f.net_remaining || f.remaining_supply || 0);
```

~~Also add `expected_cxl` as a signal~~ **REMOVED per C2**: No re-capture added to demand. Cancel effect is observable through pickup windows naturally (rooms freed → new bookings show in T-3/T-7 pickup).

### 4. Update `dailyAction.ts`

Use `net_remaining` instead of `remaining_supply` for OCC calculation:
```diff
- const occ = supply > 0 ? (supply - remainSupply) / supply : 0;
+ const netRemaining = f.net_remaining || f.remaining_supply;
+ const projected_occ = capacity > 0 ? (capacity - netRemaining) / capacity : 0;
```

### 5. Add "Build Cancel Stats" button to Data Inspector

In the Data Inspector page, add a button alongside "Build Features" and "Run Forecast":
- Label: "Build Cancel Stats"  
- Action: call `buildCancelStats(hotelId)`
- Shows toast with result count

### 6. Auto-run in pipeline

Update the Build Features flow to auto-run `buildCancelStats()` if stats are stale (>7 days old):
```typescript
// In buildFeaturesDaily, before building features:
const statsAge = await getStatsAge(hotelId);
if (!statsAge || statsAge > 7) {
    await buildCancelStats(hotelId);
}
```

## Files to Modify

- `[MODIFY] apps/web/prisma/schema.prisma` — Add 4 columns to FeaturesDaily
- `[MODIFY] apps/web/app/actions/buildFeaturesDaily.ts` — Integrate cancel forecast
- `[MODIFY] apps/web/app/actions/runForecast.ts` — Use net_remaining
- `[MODIFY] apps/web/lib/engine/dailyAction.ts` — Use net_remaining for OCC
- `[MODIFY] apps/web/app/data/page.tsx` — Add Build Cancel Stats button
- `[MODIFY] apps/web/app/actions/buildCancelStats.ts` — Add staleness check helper

## Test Criteria

- [ ] `features_daily` rows have non-null `expected_cxl` after build
- [ ] `net_remaining >= remaining_supply` AND `net_remaining <= capacity` (acceptance test #2)
- [ ] `runForecast` uses `net_remaining` for fallback path
- [ ] `remaining_demand` does NOT include re-capture (C2 — verify no cancel boost)
- [ ] `dailyAction` projects higher OCC when cancel forecast is favorable
- [ ] Build Cancel Stats button works in Data Inspector
- [ ] Auto-rebuild when stats >7 days stale

---
Next Phase: [phase-03-cancel-ui.md](./phase-03-cancel-ui.md)
