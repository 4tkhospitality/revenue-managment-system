# Phase 02: Entitlements Service
Status: ⬜ Pending
Sprint: S1
Dependencies: Phase 01

## Objective
Create central `getEntitlements(hotel_id)` service that resolves plan, limits, and feature flags from Subscription. Every API route/server action asks ONE question: "does this hotel have entitlement X?"

## Architecture

```
getEntitlements(hotel_id)
  → reads Subscription (plan, status, limits)
  → returns: { plan, status, limits, features, isTrialExpired }

features = {
  canBulkPricing: boolean      // SUPERIOR+
  canPlaybook: boolean         // DELUXE+
  canAnalytics: boolean        // DELUXE+
  canMultiHotel: boolean       // SUITE only
  canRateShopper: boolean      // SUITE only
  canPersistScenarios: boolean // false (Starter) | true
  // NOTE: Export matrix is QUOTA, not feature flag
  // All plans CAN export, but with different daily limits
}
```

## Plan → Feature Mapping

| Feature | STANDARD | SUPERIOR | DELUXE | SUITE |
|---------|----------|----------|--------|-------|
| OTA Calculator | ✅ | ✅ | ✅ | ✅ |
| **Export matrix** | **Quota: 1/day** | **Quota: 10/day** | **Unlimited** | **Unlimited** |
| Bulk pricing | ❌ | ✅ | ✅ | ✅ |
| Playbook | Preview | Preview | ✅ | ✅ |
| Analytics | Preview | Preview | ✅ | ✅ |
| Multi-hotel | ❌ | ❌ | ❌ | ✅ |
| Rate Shopper | ❌ | ❌ | ❌ | ✅ (credits) |
| Max users | 1 | 3 | 10 | Unlimited |
| Max imports/month | 3 | 15 | 50 | Unlimited |
| Max scenarios (session) | 3 | Unlimited | Unlimited | Unlimited |
| Persist scenarios | ❌ | ✅ | ✅ | ✅ |

> **Decision**: Export matrix is a **quota** (all plans can export, with different daily limits), NOT a feature flag. This avoids the contradiction of "feature blocked but quota = 1".

## Implementation Steps

1. [ ] Create `lib/plg/entitlements.ts`
   - `getEntitlements(hotelId: string)` → reads Subscription from DB
   - `getFeatureFlags(plan: PlanTier)` → static feature map
   - `getPlanLimits(subscription)` → extract limits
   - `isTrialActive(subscription)` → check trial_ends_at
   - `getPlanLabel(plan: PlanTier)` → UI display name mapping (STANDARD → "Starter")

2. [ ] Create `lib/plg/plan-config.ts` — static config (no DB)
   - Plan → feature mapping (table above)
   - Plan → default limits
   - Plan → UI label mapping
   - Plan → pricing info (for upgrade modal)

3. [ ] Create type definitions
   - `Entitlements` interface
   - `FeatureFlags` interface
   - `PlanLimits` interface
   - `FeatureKey` enum

4. [ ] Add caching layer
   - Cache entitlements per hotel_id for 60s (avoid repeated DB hits)
   - Invalidate on subscription change

5. [ ] Write unit tests
   - Each plan returns correct features
   - Trial expired returns correct status
   - Missing subscription defaults to STANDARD

## Files to Create
- `lib/plg/entitlements.ts` — Core service
- `lib/plg/plan-config.ts` — Static config
- `lib/plg/types.ts` — Entitlements, FeatureFlags, PlanLimits, FeatureKey

## Test Criteria
- [ ] `getEntitlements()` returns correct flags for each plan
- [ ] Missing subscription → defaults to STANDARD
- [ ] Trial logic: active vs expired
- [ ] Cache invalidation works

---
Next Phase: [Phase 03 — Guard + Gating](./phase-03-guard.md)
