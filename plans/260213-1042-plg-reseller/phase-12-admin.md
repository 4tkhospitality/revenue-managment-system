# Phase 12: Admin Dashboard (Internal CRM)
Status: ⬜ Pending
Sprint: S4
Dependencies: Phase 01-11

## Objective
Admin SuperPanel for managing hotels, subscriptions, resellers, commissions, and promo codes. Single place to monitor the PLG engine and take action.

## Admin Pages

### 12.1 Hotels Overview
- All hotels with: plan, status, trial status, reseller, promo code
- Quick actions: change plan, extend trial, attach reseller
- Usage metrics per hotel

### 12.2 Subscriptions Management
- Override limits per hotel (max_users, max_imports, etc.)
- Change plan tier
- Extend/end trials
- Payment receipt verification (Phase 1 bank transfer)

### 12.3 Reseller Management
- Reseller list with: name, status, hotel count, commission total
- Create/edit resellers
- Create/edit contracts
- Manual attribution

### 12.4 Promo Code Management
- All promo codes with: type, usage, reseller, status
- Create from templates
- Activate/deactivate
- View redemption history

### 12.5 Commission & Payout
- Commission overview: pending/approved/paid totals
- Monthly payout run interface
- Statement generation
- Audit log viewer

### 12.6 PLG Analytics (bonus)
- Conversion funnel: Free → Trial → Paid
- Upgrade trigger distribution (which triggers are most effective)
- Usage patterns: most used features per plan
- Churn indicators

## Implementation Steps

1. [ ] Create admin layout
   - `app/admin/layout.tsx` — admin shell
   - Protected by admin role check (existing RBAC)

2. [ ] Hotels admin page
   - `app/admin/hotels/page.tsx` — list + filters
   - `app/admin/hotels/[id]/page.tsx` — detail + actions

3. [ ] Subscriptions admin
   - Inline in hotel detail page
   - Quick plan change, limit override, trial management

4. [ ] Reseller admin pages
   - `app/admin/resellers/page.tsx` — list
   - `app/admin/resellers/[id]/page.tsx` — detail + contracts + attribution

5. [ ] Promo admin pages
   - `app/admin/promo-codes/page.tsx` — list + create
   - Inline redemption history

6. [ ] Commission admin pages
   - `app/admin/commissions/page.tsx` — overview + approve
   - `app/admin/payouts/page.tsx` — payout management

7. [ ] Audit log page
   - `app/admin/audit/page.tsx` — searchable log

## Files to Create
- `app/admin/layout.tsx`
- `app/admin/hotels/page.tsx`
- `app/admin/hotels/[id]/page.tsx`
- `app/admin/resellers/page.tsx`
- `app/admin/resellers/[id]/page.tsx`
- `app/admin/promo-codes/page.tsx`
- `app/admin/commissions/page.tsx`
- `app/admin/payouts/page.tsx`
- `app/admin/audit/page.tsx`

## Test Criteria
- [ ] Admin can view and filter all hotels
- [ ] Admin can change hotel plan and override limits
- [ ] Admin can manage resellers and contracts
- [ ] Admin can create and deactivate promo codes
- [ ] Admin can approve commissions and run payouts
- [ ] Only admin role can access admin pages
