# Phase 00: Engine/Service Refactor
Status: ⬜ Pending
Dependencies: None (can run in parallel with Phase 01/02)

## Objective
Consolidate all pricing math into `engine.ts` (pure) + `service.ts` (DB-aware).
Eliminate ~250 lines of duplicated pricing logic across PromotionsTab and calc-matrix route.

> **Architecture Rule:** All pricing math & promotion resolution must be executed
> server-side in `engine.ts` or `service.ts`. Frontend must NOT compute discounts,
> resolve conflicts, or calculate BAR/NET/Display. Overview & Dynamic must call
> the same service function(s).

## What Moves Where

### engine.ts — Pure functions (no DB, no side effects)
Already has:
- [x] `calcBarFromNet()` — NET → BAR
- [x] `calcNetFromBar()` — BAR → NET
- [x] `resolveTimingConflicts()` — Early Bird vs Last-Minute

New:
- [ ] `resolveVendorStacking(vendor, discounts)` — Move from PromotionsTab lines 1217-1271
  - Booking 3-tier exclusion engine
  - Expedia single-discount (highest wins)
  - Trip.com same-box dedup
  - Agoda subcategory dedup
- [ ] `computeDisplay(bar, totalDiscount)` — `Math.round(bar * (1 - totalDiscount / 100))`
  > **CRITICAL:** `totalDiscount` is the **vendor-specific effective discount %** after
  > applying `calc_type` rules — NOT a raw summation.
  > - PROGRESSIVE: `effective% = (1 - Π(1-dᵢ/100)) × 100`
  > - ADDITIVE: `effective% = Σ dᵢ` (capped if vendor requires)
  > - SINGLE_DISCOUNT: `effective% = max(dᵢ)`
  > `computeDisplay()` itself does NOT know about calc_type — it receives the already-resolved number.
- [ ] `applyOccMultiplier(netBase, multiplier)` — `Math.round(netBase * multiplier)`

### service.ts — NEW file (DB-aware orchestration)
- [ ] `calculateForChannel(channelConfig, netBase, roundingRule)`:
  1. Read active campaigns
  2. `resolveVendorStacking()` + `resolveTimingConflicts()`
  3. `calcBarFromNet()` + `computeDisplay()`
  4. Return `{ bar, display, net, totalDiscount, trace }`
- [ ] `calculateMatrix(hotelId, mode, displayPrices?)` — Used by Overview (calc-matrix)
- [ ] `calculateDynamicMatrix(hotelId, stayDate, channelId, ...)` — Used by Dynamic tab
- [ ] `calcPreview(channelId, netBase)` — Thin wrapper for PromotionsTab PriceCalculator

### Consumers (thin wrappers after refactor)
- [ ] `calc-matrix/route.ts` → `service.calculateMatrix()`
- [ ] `dynamic-matrix/route.ts` → `service.calculateDynamicMatrix()`
- [ ] PromotionsTab PriceCalculator → calls `/api/pricing/calc-preview` (or `calc-matrix`)

## Migration Checklist
1. [ ] Extract vendor stacking logic from PromotionsTab.tsx (lines 1186-1304)
2. [ ] Create `engine.resolveVendorStacking()` with same behavior
3. [ ] Create `engine.computeDisplay()`
4. [ ] Create `service.ts` with `calculateForChannel`
5. [ ] Refactor `calc-matrix/route.ts` to use `service.calculateMatrix()`
6. [ ] Refactor PromotionsTab: replace client-side math with API call
7. [ ] Run golden tests — output MUST NOT change
8. [ ] Visual regression: OverviewTab matrix numbers identical before/after

## Golden Test Cases
```
Test 1: Agoda progressive + 3 discounts + EarlyBird + LastMinute
Test 2: Booking exclusive deal + Genius → only 2 apply
Test 3: Expedia single-discount → highest only
Test 4: Trip.com additive + same-box dedup
Test 5: All above × OCC multiplier 1.20
Test 6: bar_to_net reverse calculation
```

## 3-Layer Guardrail (prevents future duplication)

### Layer 1: Architecture Doc
- [ ] Create `docs/ARCHITECTURE_PRICING.md` — canonical reference
- [ ] Add header comment to `engine.ts` and `service.ts` with the Architecture Rule
- [ ] Reference in `CONTRIBUTING.md` under "Pricing Changes"

### Layer 2: Golden Tests (CI gate)
- [ ] All 6 golden test cases above must pass before merge
- [ ] Any pricing algorithm change MUST update golden expected values
- [ ] CI runs `vitest run tests/pricing-golden.test.ts` on every PR

### Layer 3: Anti-duplication Lint (CI gate)
- [ ] `service.ts` starts with `import 'server-only'` → Next.js blocks client import
- [ ] CI script: fail if `components/**/*.tsx` or `app/**/page.tsx` contains:
  `calcBarFromNet`, `calcNetFromBar`, `resolveTimingConflicts`, `Math.round(bar *`
- [ ] CI script: ALSO fail if `app/api/**/route.ts` imports `engine.ts` directly
  - Routes must import `service.ts` only (thin wrappers)
  - Pattern: `from '@/lib/pricing/engine'` in route → CI red
- [ ] Exception: importing types from `lib/pricing/types.ts` is OK anywhere

## Files
- `lib/pricing/engine.ts` — [MODIFY] Add resolveVendorStacking, computeDisplay, applyOccMultiplier
- `lib/pricing/service.ts` — [NEW] DB-aware service layer (`import 'server-only'`)
- `app/api/pricing/calc-matrix/route.ts` — [MODIFY] Simplify to use service
- `components/pricing/PromotionsTab.tsx` — [MODIFY] Remove ~120 lines of inline math
- `docs/ARCHITECTURE_PRICING.md` — [NEW] Canonical pricing architecture reference

## Risk
- Low: engine functions are pure, easy to unit test
- Medium: PromotionsTab PriceCalculator switches from sync math to async API call
  - **PromotionsTab MUST call `/api/pricing/calc-preview` (service-backed)**
  - Frontend has NO legitimate path to compute pricing locally
  - Use debounced fetch + skeleton loader for perceived responsiveness

## Definition of Done (Phase 00 PR merge criteria)
- [ ] 6 golden tests pass
- [ ] PromotionsTab contains zero pricing math
- [ ] calc-matrix route only calls `service.calculateMatrix()` — no inline math
- [ ] CI anti-duplication lint passes (UI + routes)
- [ ] OverviewTab matrix numbers identical before/after (visual regression)

---
Next: Phase 03 (Dynamic UI) can start after this is complete
