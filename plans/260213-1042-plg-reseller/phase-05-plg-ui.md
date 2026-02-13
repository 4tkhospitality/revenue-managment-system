# Phase 05: PLG UI Components
Status: ⬜ Pending
Sprint: S1
Dependencies: Phase 02, 03

## Objective
Build UI components for plan awareness, usage tracking, and upgrade nudges. User sees their plan status everywhere + gets prompted to upgrade at the right moment.

## Components

### 5.1 PlanBadge
Small badge showing current plan. Appears in sidebar + settings.
```
[🟢 Starter] | [🔵 Superior] | [🟣 Deluxe] | [🟡 Suite]
```

### 5.2 UsageMeter
Progress bar showing usage vs limit. Shows in Settings > Billing.
```
Imports: ████████░░ 8/10 tháng này
Exports: ██░░░░░░░░ 2/30 hôm nay
Users:   █████░░░░░ 2/3 seats
```
Warning state at 80%. Blocked state at 100% + upgrade CTA.

### 5.3 UpgradeModal
Modal triggered by paywall/quota events. Shows:
- Current plan vs recommended plan
- Why upgrade (reason_codes → human-readable)
- Feature comparison table
- CTA: "Upgrade" or "Start Trial"
Variants: FEATURE_PAYWALL, QUOTA_EXCEEDED, SCENARIO_PERSIST_PAYWALL

### 5.4 Billing Card (Settings page)
Full billing overview in hotel settings:
- Current plan + status + trial countdown
- Usage meters (imports, exports, users)
- Upgrade/Change plan button
- Payment history (Phase 2)

### 5.5 TrialBanner
Top banner during trial period:
```
🎯 Trial: còn 5 ngày | Bonus: đạt 2/3 điều kiện | [Xem chi tiết] [Upgrade]
```

## Implementation Steps

1. [ ] Create `components/billing/PlanBadge.tsx`
   - Props: plan, status, size ('sm' | 'md')
   - Color per plan tier

2. [ ] Create `components/billing/UsageMeter.tsx`
   - Props: label, used, limit, showUpgrade
   - Progress bar with warning/blocked states

3. [ ] Create `components/billing/UpgradeModal.tsx`
   - Props: variant, currentPlan, recommendedPlan, reasonCodes
   - Feature comparison table
   - CTA button actions

4. [ ] Create `components/billing/BillingCard.tsx`
   - Composed of PlanBadge + UsageMeter(s) + upgrade CTA
   - Fetches entitlements + usage

5. [ ] Create `components/billing/TrialBanner.tsx`
   - Shows trial countdown + bonus progress
   - Dismissible per session

6. [ ] Integrate PlanBadge into Sidebar
   - Show below hotel name

7. [ ] Add BillingCard to Settings page
   - New "Billing & Plan" section

8. [ ] Add TrialBanner to main layout
   - Top of page during TRIAL status

## Files to Create
- `components/billing/PlanBadge.tsx`
- `components/billing/UsageMeter.tsx`
- `components/billing/UpgradeModal.tsx`
- `components/billing/BillingCard.tsx`
- `components/billing/TrialBanner.tsx`
- `components/billing/index.ts` — barrel export

## Files to Modify
- `components/layout/Sidebar.tsx` — Add PlanBadge
- `app/settings/page.tsx` — Add BillingCard
- `components/layout/MainLayout.tsx` — Add TrialBanner

## Test Criteria
- [ ] PlanBadge renders correctly for each tier
- [ ] UsageMeter shows warning at 80%, blocked at 100%
- [ ] UpgradeModal displays correct reason and comparison
- [ ] BillingCard fetches and displays real data
- [ ] TrialBanner shows countdown and bonus progress

---
Next Phase: [Phase 06 — Trial Policy](./phase-06-trial.md)
