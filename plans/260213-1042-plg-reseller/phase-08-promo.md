# Phase 08: PromoCode + Redemption
Status: ⬜ Pending
Sprint: S2
Dependencies: Phase 01, 07

## Objective
Implement promo code system with admin-controlled offer templates. Resellers select from templates — they never set their own %. Atomic redemption with race-condition protection.

## Template Types (from BRIEF)

| Type | Created by | Used by | Example |
|------|-----------|---------|---------|
| GLOBAL | Admin | All customers (auto/code) | PREPAY_6M_10, PREPAY_12M_15 |
| RESELLER | Admin | Reseller picks for code gen | RES10_3M, NO_DISCOUNT_ATTR_ONLY |
| CAMPAIGN | Admin | Time-limited, cap on uses | TET2026_20OFF |

## Discount Rules
- **Best discount wins** (no stacking)
- **Attribution always attaches** if code has reseller_id
- **Tie-breaker**: highest percent_off → CAMPAIGN > GLOBAL > RESELLER → oldest created_at
- **1 hotel = 1 active promo code** (MVP: reject 2nd)
- **Commission base** = invoice.amount_net (after discount)

## Implementation Steps

### PromoCode Service

1. [ ] Create `lib/promo/promo.ts`
   - `createPromoCode(data)` — admin creates code from template
   - `validateCode(code)` → check active, not expired, not full, plan eligible
   - `redeemCode(code, hotelId)` → **transactional** redemption (see below)
   - `getActivePromo(hotelId)` → current promo for hotel
   - `voidPromo(hotelId, reason)` → mark redemption VOIDED (admin)

2. [ ] Transactional redemption (prisma.$transaction):
   ```
   a. SELECT Hotel FOR UPDATE (row-level lock → prevents concurrent redeem)
   b. Check Hotel.active_promo_code_id IS NULL (reject 2nd code)
   c. Atomic increment current_redemptions (SQL WHERE < max)
   d. Insert PromoRedemption { status: ACTIVE }
   e. Update Hotel.active_promo_code_id = promo_code_id
   f. If promo has reseller_id → auto attributeHotel() (Phase 07)
   ```
   Any step fails → entire tx rolls back.
   **Key**: Step (a) locks the Hotel row first to serialize concurrent redemption attempts.

2. [ ] Atomic redemption SQL
   ```sql
   UPDATE promo_codes
   SET current_redemptions = current_redemptions + 1
   WHERE code = $1 AND is_active = true
     AND (max_redemptions IS NULL OR current_redemptions < max_redemptions)
     AND (expires_at IS NULL OR expires_at > NOW())
   ```
   If 0 rows affected → reject

3. [ ] Create `bestDiscountWins(hotelId, applicableDiscounts)` logic
   - Collect: hotel's active promo + any global prepay discounts
   - Sort by percent_off DESC → template_type priority → created_at ASC
   - Return winner (for invoice calculation)

### PromoCode API

4. [ ] Create admin routes
   - `GET /api/admin/promo-codes` — list all codes
   - `POST /api/admin/promo-codes` — create code
   - `PATCH /api/admin/promo-codes/[id]` — toggle is_active
   - `GET /api/admin/promo-codes/[id]/redemptions` — who used it

5. [ ] Create public routes
   - `POST /api/promo/validate` — validate code (no redeem)
   - `POST /api/promo/redeem` — validate + redeem + attribute

### UI Components

6. [ ] Create `components/billing/PromoCodeInput.tsx`
   - Text input + "Áp dụng" button
   - Validate on submit → show discount preview
   - Error: "Mã không hợp lệ" / "Bạn đã có mã giảm giá"

7. [ ] Integrate into checkout/settings flow
   - Show PromoCodeInput in Billing settings
   - Show active promo badge if hotel has one

## Files to Create
- `lib/promo/promo.ts` — includes bestDiscountWins()
- `app/api/admin/promo-codes/route.ts`
- `app/api/admin/promo-codes/[id]/route.ts`
- `app/api/admin/promo-codes/[id]/redemptions/route.ts`
- `app/api/promo/validate/route.ts`
- `app/api/promo/redeem/route.ts`
- `components/billing/PromoCodeInput.tsx`

## Files to Modify
- `app/settings/page.tsx` — Add promo code section
- `lib/reseller/attribution.ts` — Auto-attribute when reseller code redeemed

## Test Criteria
- [ ] Code validation: active, not expired, not full
- [ ] Atomic redemption prevents oversell (concurrent test)
- [ ] Best discount wins logic correct with tie-breaker
- [ ] 1 hotel = 1 active code enforced
- [ ] Reseller code auto-triggers attribution
- [ ] Admin can create/deactivate codes

---
Next Phase: [Phase 09 — Commission Ledger](./phase-09-commission.md)
