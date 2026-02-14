# Phase 07: Testing & Verification
Status: ⬜ Pending
Dependencies: All phases

## Test Plan

### Build
- [ ] `npx next build` passes with 0 errors

### Unit (manual)
- [ ] `getScaledLimits('SUPERIOR', 'R30')` = base limits (1.0×)
- [ ] `getScaledLimits('SUPERIOR', 'R80')` = imports 20, exports 13, rows 117
- [ ] `getScaledLimits('SUITE', 'R300P')` = all ∞ unchanged
- [ ] `deriveBand(25)` = R30, `deriveBand(50)` = R80, `deriveBand(100)` = R150, `deriveBand(200)` = R300P
- [ ] `getPrice('DELUXE', 'R80')` = 2,590,000

### API
- [ ] GET /api/subscription returns `roomBand`, `orgId` fields
- [ ] POST /api/subscription with `roomBand: 'R80'` saves via org
- [ ] POST STANDARD + R80 → 400 error
- [ ] GET /api/subscription/compliance returns correct `isCompliant`
- [ ] GET /api/organization returns org info + counts

### Organization (NEW for Cách 2)
- [ ] Data migration: each hotel has an auto-created org
- [ ] Subscription belongs to org (not hotel directly)
- [ ] `getEntitlements(hotelId)` resolves via org → subscription
- [ ] Suite org can have multiple hotels
- [ ] Non-Suite org blocked from adding 2nd hotel
- [ ] OrgMember count matches seat quota

### UI
- [ ] Pricing page shows correct prices per band (BRIEF values)
- [ ] Band selector updates prices dynamically
- [ ] STANDARD locked to R30
- [ ] Hotel Settings: org context badge, subscription badge, capacity field
- [ ] Hotel Settings: compliance panel shows when capacity > band
- [ ] Hotel Settings: quota usage bars correct
- [ ] Team page: org members with roles
- [ ] Team page: seat counter shows plan/band
- [ ] Team page: hotel list for Suite orgs

### Regression
- [ ] Existing paywall (TierPaywall, FeatureGate) still works
- [ ] `useTierAccess` still works
- [ ] Demo hotel sees STANDARD tier
- [ ] Trial users get DELUXE features
- [ ] Invite flow works with hard block at limit

---
✅ After all tests pass: commit, push, deploy
