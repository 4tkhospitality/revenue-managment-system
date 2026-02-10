# Implementation Plan - Refactoring Pricing Tiers & Gating Rate Shopper

Refactor the **PlanTier** enum and configuration to match the new pricing structure (Standard, Superior, Deluxe, Suite) and implement the Rate Shopper gating.

## User Review Required

> [!WARNING]
> **Database Schema Change**: Renaming Enum values in Prisma (`FREE` -> `STANDARD`, `STARTER` -> `SUPERIOR`, `GROWTH` -> `DELUXE`, `PRO` -> `SUITE`) is a breaking change.
> - **Action**: Running `npx prisma db push` will likely reset the `plan` column data or require a migration script to map old values to new ones.
> - **Recommendation**: If this is a live production DB with real subscriptions, we need a SQL migration. If it's dev/staging, `db push` is fine but might data-loss on that column.

## Proposed Changes

### 1. Database Schema

#### [MODIFY] [apps/web/prisma/schema.prisma](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/prisma/schema.prisma)
- Rename `enum PlanTier` values:
    - `FREE` -> `STANDARD`
    - `STARTER` -> `SUPERIOR`
    - `GROWTH` -> `DELUXE`
    - `PRO` -> `SUITE`
- Update `Subscription` model default to `STANDARD`.

### 2. Tier Configuration & Logic

#### [MODIFY] [apps/web/lib/tier/tierConfig.ts](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/lib/tier/tierConfig.ts)
- Update `TIER_CONFIGS` keys and `TierConfig` logic.
- **Mapping**:
    - `STANDARD` (was FREE): Basic features.
    - `SUPERIOR` (was STARTER): + Export, Promo Stacking.
    - `DELUXE` (was GROWTH): + Analytics, Guardrails.
    - `SUITE` (was PRO): + **Rate Shopper** (Moved from Pro), Multi-property.
- **Rate Shopper Gating**: Move `rate_shopper_addon` feature to `SUITE` only.

#### [MODIFY] [apps/web/lib/tier/checkFeature.ts](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/lib/tier/checkFeature.ts)
- Update default fallback from `FREE` to `STANDARD`.

#### [MODIFY] [apps/web/lib/tier/useTier.ts](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/lib/tier/useTier.ts)
- Update default state to `STANDARD`.

#### [MODIFY] [apps/web/lib/demo/demoHotel.ts](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/lib/demo/demoHotel.ts)
- Update demo hotel creation to use `STANDARD` (or `SUITE` if demo needs full access? Demo usually has full access, so maybe `SUITE` or keep checking `isDemo` flag bypass).

### 3. UI Updates

#### [MODIFY] [apps/web/app/pricing-plans/page.tsx](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/app/pricing-plans/page.tsx)
- Update `TIERS` array IDs and `PRICING_MATRIX` keys to match new Enum.

#### [MODIFY] [apps/web/components/dashboard/Sidebar.tsx](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/components/dashboard/Sidebar.tsx)
- Update Rate Shopper link to check for `SUITE` tier or `rate_shopper_addon` feature.

#### [NEW] [apps/web/components/paywall/RateShopperPaywall.tsx](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/components/paywall/RateShopperPaywall.tsx)
- Create Paywall component.

#### [MODIFY] [apps/web/app/rate-shopper/page.tsx](file:///c:/Apps/Antigravity/revenue-management-system/apps/web/app/rate-shopper/page.tsx)
- Implement Paywall check.

## Verification Plan

### Automated
1.  Run `npx prisma generate`.
2.  Run type checking to catch any lingering `FREE`/`PRO` references.

### Manual
1.  **DB Check**: Verfiy schema update.
2.  **Pricing Page**: Verify tiers render correctly with new IDs.
3.  **Access Control**:
    - Verify `STANDARD` user cannot access Rate Shopper.
    - Verify `SUITE` user CAN access Rate Shopper.
