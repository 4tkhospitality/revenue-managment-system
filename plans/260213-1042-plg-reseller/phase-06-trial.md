# Phase 06: Trial Policy (7 + 7 Bonus)
Status: ⬜ Pending
Sprint: S1
Dependencies: Phase 02, 04

## Objective
Implement 7-day trial triggered on first real data upload, with +7 bonus days if user hits 2/3 adoption milestones. This encourages deep exploration before asking for payment.

## Trial Flow

```
User creates hotel + uploads real data
  → Subscription created: plan=STANDARD, status=TRIAL, trial_ends_at=now+7d
  → 7 days of full feature access

During trial, system tracks:
  ✅ IMPORT_SUCCESS ≥ 1          (data ownership)
  ✅ DASHBOARD_VIEW_SESSION ≥ 3   (engagement)
  ✅ PRICING_TAB_SESSION_VIEW ≥ 2 (core adoption)

If 2/3 conditions met within 7 days:
  → trial_bonus_granted = true
  → trial_ends_at += 7 days
  → Show celebration toast

After trial expires:
  → status changes to ACTIVE (effectivePlan reverts to actual plan)
  → Gating kicks in naturally (Starter limits apply)
```

## Implementation Steps

1. [ ] Create `lib/plg/trial.ts`
   - `startTrial(hotelId)` → set TRIAL + trial_ends_at + 7d
   - `checkTrialBonus(hotelId)` → count bonus conditions, grant if 2/3
   - `getTrialProgress(hotelId)` → returns { conditions: [{name, met, current, target}], bonusGranted }
   - `isTrialExpired(subscription)` → check trial_ends_at vs now

2. [ ] Create trial bonus check cron (or inline check)
   - Option A: Check on every `getEntitlements()` call (simpler)
   - Option B: Daily cron job (less latency)
   - **Recommended: Option A** (inline, real-time)

3. [ ] Create bonus condition queries
   - `IMPORT_SUCCESS ≥ 1` → COUNT events WHERE event_type='import_success' AND hotel_id AND created_at ≥ trial_start
   - `DASHBOARD_VIEW_SESSION ≥ 3` → COUNT(DISTINCT session_id) WHERE event_type='dashboard_view_session' **AND created_at ≥ trial_start**
   - `PRICING_TAB_SESSION_VIEW ≥ 2` → COUNT(DISTINCT session_id) WHERE event_type='pricing_tab_session_view' **AND created_at ≥ trial_start**
   - **Anti-abuse**: cap at max 3 distinct sessions/day per event type (prevent tab-spam farming)

4. [ ] Integrate trial start into hotel creation flow
   - When user uploads real data → call `startTrial(hotelId)`

5. [ ] Add trial handling to `getEntitlements()`
   - If TRIAL && trial_ends_at > now → `effectivePlan = DELUXE` (full feature access)
   - If TRIAL && trial_ends_at < now → `effectivePlan = subscription.plan` (expired, revert)

6. [ ] Create trial progress UI component
   - Part of TrialBanner (Phase 05)
   - Shows 3 conditions with ✅/⬜ status

## Files to Create
- `lib/plg/trial.ts` — Trial logic

## Session Multi-tab Behavior
- sessionStorage is per-tab → each tab = unique session_id
- This is "strict" counting (more sessions = easier to hit bonus)
- Acceptable for MVP: bonus is meant to reward engagement, not punish

## Files to Modify
- `lib/entitlements.ts` — Add trial handling
- `app/api/data/import/route.ts` — Trigger trial start on first import
- `components/billing/TrialBanner.tsx` — Add progress display

## Test Criteria
- [ ] Trial starts on first real data upload
- [ ] Bonus conditions checked correctly
- [ ] Bonus granted when 2/3 conditions met (not 1/3)
- [ ] trial_ends_at extended by exactly 7 days
- [ ] Expired trial falls back to STANDARD limits

---
Next Phase: [Phase 07 — Reseller + Attribution](./phase-07-reseller.md)
