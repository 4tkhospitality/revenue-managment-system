# Phase 07: Schema Migration S2 + Reseller + Attribution
Status: ⬜ Pending
Sprint: S2
Dependencies: Phase 01

## Objective
Create reseller management and hotel attribution system. Support 3 methods of attribution (link, coupon, manual). Lifetime attribution with active condition + 60-day grace period.

## Attribution Rules (from BRIEF)
- **Lifetime**: Hotel gắn reseller A thì mãi thuộc A
- **Active condition**: Commission valid khi subscription ACTIVE + paid liên tục
- **Grace 60 ngày**: Gián đoạn > 60d → close attribution (CHURN_GT_60D)
- **Re-sub ≤ 60d**: Keep attribution
- **Re-sub > 60d**: Admin re-attach (new record)
- **History never deleted**

## Step 0: S2 Schema Migration

**Models to add in this migration:**
- [ ] `Reseller` (ref_code unique)
- [ ] `ResellerAttribution` (hotel → reseller lifecycle)
- [ ] `ResellerContract` (commission terms, effective dates)
- [ ] `PromoCode` (atomic counter, templates)
- [ ] `PromoRedemption` (usage audit)
- [ ] Add Prisma relations
- [ ] Run `npx prisma db push` + `npx prisma generate`

## Implementation Steps

### Reseller CRUD

1. [ ] Create `lib/reseller/reseller.ts`
   - `createReseller(data)` — admin only
   - `getReseller(id)` / `getResellerByCode(refCode)`
   - `updateReseller(id, data)` — admin only
   - `listResellers(filters)` — admin with pagination
   - `generateRefCode()` — unique 8-char alphanumeric

2. [ ] Create Reseller API routes
   - `GET /api/admin/resellers` — list
   - `POST /api/admin/resellers` — create
   - `PATCH /api/admin/resellers/[id]` — update
   - `GET /api/admin/resellers/[id]` — detail with hotels

### Attribution Service

3. [ ] Create `lib/reseller/attribution.ts`
   - `attributeHotel(hotelId, resellerId, method, attributedBy?)` → create ResellerAttribution
   - `getActiveAttribution(hotelId)` → current active attribution (effective_to IS NULL)
   - `closeAttribution(hotelId, reason)` → set effective_to + ended_reason
   - `checkAttributionGrace(hotelId)` → 60-day grace logic

4. [ ] Create referral link handler
   - URL pattern: `app.com/signup?ref=RES123`
   - Middleware: read `ref` param → store in cookie (30d expiry)
   - On hotel creation: check cookie → auto-attribute

5. [ ] Create coupon code handler (integrated with Phase 08 PromoCode)
   - When user redeems code with `reseller_id != null` → auto-attribute

6. [ ] Create manual attribution (admin)
   - Route: `POST /api/admin/attributions`
   - Requires: hotelId, resellerId, reason (text)
   - Logs: attributed_by = admin user_id

### Contract Management

7. [ ] Create `lib/reseller/contracts.ts`
   - `createContract(resellerId, data)` → new ResellerContract
   - `getActiveContract(resellerId)` → effective_to IS NULL
   - `endContract(contractId)` → set effective_to = now

8. [ ] Create Contract API
   - `POST /api/admin/resellers/[id]/contracts` — create
   - `GET /api/admin/resellers/[id]/contracts` — list

## Files to Create
- `lib/reseller/reseller.ts`
- `lib/reseller/attribution.ts`
- `lib/reseller/contracts.ts`
- `app/api/admin/resellers/route.ts`
- `app/api/admin/resellers/[id]/route.ts`
- `app/api/admin/resellers/[id]/contracts/route.ts`
- `app/api/admin/attributions/route.ts`

## Files to Modify
- `middleware.ts` — Handle ?ref= referral parameter
- `app/api/hotels/route.ts` — Check ref cookie on hotel creation

## Test Criteria
- [ ] Reseller CRUD works (create, read, update, list)
- [ ] Attribution via link/code/manual all create correct records
- [ ] Only 1 active attribution per hotel at a time
- [ ] Close attribution sets effective_to + reason
- [ ] Referral cookie persists 30 days

---
Next Phase: [Phase 08 — PromoCode + Redemption](./phase-08-promo.md)
