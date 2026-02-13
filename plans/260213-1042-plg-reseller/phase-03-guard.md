# Phase 03: Guard + Gating Middleware
Status: ⬜ Pending
Sprint: S1
Dependencies: Phase 02

## Objective
Create `guard.ts` with helper functions for soft/hard gating. Every API route and UI component can call `requireFeature()` or `requireQuota()` to enforce plan limits.

## Gating Types

| Type | Behavior | Example |
|------|----------|---------|
| **Soft** | Allow read, block write/export/apply | Matrix: view but can't export |
| **Hard** | Block access entirely | Multi-hotel: can't create 2nd |
| **Preview** | Show demo/sample data | Analytics: demo snapshot |
| **Quota** | Allow until limit hit | Import: max 3/month |

## Implementation Steps

### Backend Guards (API routes)

1. [ ] Create `lib/plg/guard.ts`
   - `requireFeature(hotelId, featureKey)` → throws `PaywallError` if not entitled
   - `requireQuota(hotelId, quotaKey)` → checks UsageMonthly vs limits, throws `QuotaExceededError`
   - `checkFeature(hotelId, featureKey)` → returns boolean (non-throwing)
   - `getGateType(hotelId, featureKey)` → returns 'free' | 'soft' | 'hard' | 'preview'

2. [ ] Create `lib/shared/errors.ts` — custom error classes
   - `PaywallError` — has `featureKey`, `currentPlan`, `requiredPlan`, `reason_codes[]`
   - `QuotaExceededError` — has `quotaKey`, `current`, `limit`, `reason_codes[]`

3. [ ] Create `lib/shared/authz.ts` — RBAC guard
   - `requireHotelAccess(userId, hotelId)` → check HotelUser membership
   - **MANDATORY**: every hotel-scoped route MUST call this before any query
   - Prevents cross-tenant data leaks in multi-tenant system

3. [ ] Create API error handler
   - Catch `PaywallError` → 403 with upgrade info
   - Catch `QuotaExceededError` → 429 with usage info

5. [ ] Integrate into existing API routes
   - `POST /api/data/import` → `requireHotelAccess()` + `requireQuota('imports')`
   - `POST /api/pricing/export` → `requireHotelAccess()` + `requireQuota('exports')`
   - `POST /api/hotels` (create) → `requireFeature('multiHotel')`
   - `GET /api/playbook/*` → `requireHotelAccess()` + `requireFeature('playbook')`
   - `POST /api/team/invite` → `requireHotelAccess()` + `requireQuota('users')`

### Frontend Guards (React)

6. [ ] Create `hooks/useEntitlements.ts`
   - `useEntitlements()` → fetches entitlements for current hotel
   - `useFeatureGate(featureKey)` → returns `{ allowed, gateType, upgradeInfo }`
   - `useQuota(quotaKey)` → returns `{ used, limit, remaining, isNearLimit }`

7. [ ] Create `components/gates/` folder
   - `FeatureGate` — wrapper that shows content or paywall
   - `SoftGate` — shows content + disabled CTA + upgrade badge
   - `QuotaWarning` — banner when approaching limit (80%)

8. [ ] Create `GET /api/entitlements` endpoint
   - Returns entitlements for current hotel (used by frontend hook)
   - Guarded by `requireHotelAccess()`

## Files to Create
- `lib/plg/guard.ts` — Feature/quota guards
- `lib/shared/errors.ts` — PaywallError, QuotaExceededError
- `lib/shared/authz.ts` — requireHotelAccess RBAC
- `hooks/useEntitlements.ts` — React hook
- `components/gates/FeatureGate.tsx`
- `components/gates/SoftGate.tsx`
- `components/gates/QuotaWarning.tsx`
- `app/api/entitlements/route.ts`

## Files to Modify
- `app/api/data/import/route.ts` — Add import quota check
- `app/api/pricing/export*/route.ts` — Add export quota check

## Test Criteria
- [ ] `requireFeature('playbook')` throws for STANDARD, passes for DELUXE+
- [ ] `requireQuota('imports')` blocks when count ≥ max_imports_month
- [ ] Frontend `FeatureGate` renders paywall for gated features
- [ ] `QuotaWarning` shows at 80% usage
- [ ] API returns 403/429 with upgrade info

---
Next Phase: [Phase 04 — Event Logging + Usage](./phase-04-events.md)
