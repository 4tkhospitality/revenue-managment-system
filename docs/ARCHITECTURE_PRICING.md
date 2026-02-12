# Pricing Architecture — Single Source of Truth

> **This document is the canonical reference for all pricing calculation rules.**
> Any change to pricing math MUST follow these constraints.

## Architecture Rule (LOCKED — Rev.4, 2026-02-12)

```
All pricing math & promotion resolution must be executed server-side in:
  • lib/pricing/engine.ts  (pure functions, no DB, no side effects)
  • lib/pricing/service.ts (DB-aware orchestration, imports 'server-only')

Frontend (components/, app/**/page.tsx) must NOT:
  ✗ Compute discounts or discount factors
  ✗ Resolve timing/vendor stacking conflicts
  ✗ Calculate BAR, NET, or Display prices
  ✗ Import engine.ts functions (only types.ts is allowed)
  ✗ Keep "local preview" math as fallback — preview MUST use /api/pricing/calc-preview

API Routes (app/api/**/route.ts) must NOT:
  ✗ Import engine.ts directly — must import service.ts
  ✗ Contain inline pricing math — routes are thin wrappers around service

UI tabs are "consumers":
  • OverviewTab      → renders response from /api/pricing/calc-matrix
  • DynamicPricingTab → renders response from /api/pricing/dynamic-matrix
  • PromotionsTab     → renders response from /api/pricing/calc-preview
```

## Engine Layer: `lib/pricing/engine.ts`

Pure functions — receive inputs, return outputs. No database, no fetch, no side effects.

| Function | Purpose |
|----------|---------|
| `calcBarFromNet(net, commission, discounts, calcType, ...)` | NET → BAR |
| `calcNetFromBar(bar, commission, discounts, calcType, ...)` | BAR → NET |
| `resolveTimingConflicts(discounts)` | Early Bird vs Last-Minute: keep larger |
| `resolveVendorStacking(vendor, discounts)` | Booking exclusion, Expedia single, Trip.com box dedup |
| `computeDisplay(bar, totalDiscount)` | `Math.round(bar * (1 - totalDiscount / 100))` |
| `applyOccMultiplier(netBase, multiplier)` | `Math.round(netBase * multiplier)` |

### Critical: `totalDiscount` Definition

`totalDiscount` passed to `computeDisplay()` is the **effective discount percentage**
after applying vendor-specific `calc_type` rules:

| calc_type | Formula | Example |
|-----------|---------|---------|
| PROGRESSIVE | `(1 - Π(1 - dᵢ/100)) × 100` | 10% + 5% → 14.5% |
| ADDITIVE | `Σ dᵢ` | 10% + 5% → 15.0% |
| SINGLE_DISCOUNT | `max(dᵢ)` | 10% + 5% → 10.0% |

`computeDisplay()` does NOT know about calc_type — it receives the already-resolved number.

## Service Layer: `lib/pricing/service.ts`

DB-aware orchestration. Starts with `import 'server-only'` to prevent client import.

| Function | Used By |
|----------|---------|
| `calculateForChannel(channelConfig, netBase, roundingRule)` | Both Matrix and Dynamic |
| `calculateMatrix(hotelId, mode, displayPrices?)` | `/api/pricing/calc-matrix` |
| `calculateDynamicMatrix(hotelId, stayDate, channelId, ...)` | `/api/pricing/dynamic-matrix` |
| `calcPreview(channelId, netBase)` | `/api/pricing/calc-preview` |

## Changing Pricing Algorithm

1. **Modify** `engine.ts` only (or `service.ts` if DB logic changes)
2. **Update** golden test expected values in `tests/pricing-golden.test.ts`
3. **Run** `vitest run tests/pricing-golden.test.ts` — all 6 cases must pass
4. **Do NOT** touch OverviewTab, DynamicPricingTab, or PromotionsTab
5. **PR reviewer** checks: no pricing math leaked to UI components

## Anti-Duplication CI Checks

- `service.ts` has `import 'server-only'` → Next.js blocks client bundle import
- CI script fails if `components/**/*.tsx` or `app/**/page.tsx` contains:
  `calcBarFromNet`, `calcNetFromBar`, `resolveTimingConflicts`, `Math.round(bar *`
- CI script fails if `app/api/**/route.ts` imports `engine.ts` directly:
  Pattern `from '@/lib/pricing/engine'` in any route → CI red
  Routes must import `service.ts` only
- Exception: importing **types** from `lib/pricing/types.ts` is always OK
