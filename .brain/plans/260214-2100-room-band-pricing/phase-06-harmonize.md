# Phase 06: Harmonize tierConfig → plan-config (Single Source of Truth)
Status: ⬜ Pending
Dependencies: Phase 02 (need plan-config updates first)

## Objective

Deprecate `lib/tier/tierConfig.ts` and move all consumers to `lib/plg/plan-config.ts`.

## Current Usage (from code audit)

**Only 2 files import tierConfig:**

| File | Import | Used for |
|---|---|---|
| `components/UpgradeBanner.tsx` | `FeatureKey`, `getUpgradeTierName`, `TIER_CONFIGS` | Showing upgrade prompt with tier display name |
| `app/admin/hotels/page.tsx` | `TIER_CONFIGS` | Admin hotel list — showing tier label |

## Changes

### [MODIFY] `UpgradeBanner.tsx`
```diff
- import { FeatureKey, getUpgradeTierName, TIER_CONFIGS } from '@/lib/tier/tierConfig';
+ import { getPlanLabel, getMinimumPlan, getPlanColor } from '@/lib/plg/plan-config';
+ import type { FeatureKey } from '@/lib/plg/types';
```
Replace `getUpgradeTierName(feature)` → `getPlanLabel(getMinimumPlan(feature))`
Replace `TIER_CONFIGS[plan].displayName` → `getPlanLabel(plan)`

### [MODIFY] `admin/hotels/page.tsx`
```diff
- import { TIER_CONFIGS } from '@/lib/tier/tierConfig';
+ import { getPlanLabel, getPlanColor } from '@/lib/plg/plan-config';
```
Replace `TIER_CONFIGS[plan].displayName` → `getPlanLabel(plan)`

### [DEPRECATE] `lib/tier/tierConfig.ts`
After replacing the 2 imports:
- Add `@deprecated` JSDoc comment
- Or delete the file entirely (only 2 usages)

### Verify: no other consumers
```bash
grep -r "tierConfig" apps/web/ --include="*.ts" --include="*.tsx" -l
# Expected: 0 results after fix
```

## Implementation Steps
1. [ ] Update UpgradeBanner.tsx imports → plan-config
2. [ ] Update admin/hotels/page.tsx imports → plan-config
3. [ ] Verify grep returns 0 results
4. [ ] Delete or deprecate tierConfig.ts
5. [ ] Build verify

---
Next: [phase-07-testing.md](file:///c:/Apps/Antigravity/revenue-management-system/.brain/plans/260214-2100-room-band-pricing/phase-07-testing.md)
