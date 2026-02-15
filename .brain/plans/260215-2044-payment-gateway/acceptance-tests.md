# Acceptance Test Script — Payment Gateway Integration
Created: 2026-02-15
Version: v1.0 (P0 + P1 coverage)

> **Format**: Given / When / Then
> **Coverage**: 24 test cases across 6 categories
> **Pass criteria**: DB state, AuditLog, PLG events, idempotency, concurrency, cron sync

---

## 0. Preconditions (bắt buộc cho MỌI test)

| Item | Value |
|------|-------|
| SePay sandbox | `SEPAY_*` env vars set |
| PayPal sandbox | `PAYPAL_*` + `NEXT_PUBLIC_PAYPAL_CLIENT_ID` set |
| Hotel H1 | Exists in DB |
| User U1 | Belongs to H1 |
| Subscription H1 | `plan=STANDARD`, `status=ACTIVE` (hoặc TRIAL) |
| Pricing constants | Configured (tier × roomBand × currency) |
| Admin A1 | Exists, `isAdmin=true` |

**Pre-verify:**
- [ ] `/pricing-plans` loads OK
- [ ] `TierPaywall` CTA links to payment modal

---

## A. UI + PLG (Pricing Page / Paywall)

### AT-01 — Pricing page load + event `pricing_viewed`
- **Given**: U1 logged in
- **When**: Open `/pricing-plans`
- **Then**:
  - [ ] Display 4 tiers: STANDARD / SUPERIOR / DELUXE / SUITE
  - [ ] Event `pricing_viewed` logged (userId, currentTier)

### AT-02 — Click upgrade + event `upgrade_clicked`
- **Given**: On `/pricing-plans`
- **When**: Click "Nâng cấp" on DELUXE, select roomBand BAND_1
- **Then**:
  - [ ] Event `upgrade_clicked` logged (targetTier=DELUXE, roomBand=BAND_1)
  - [ ] Payment modal opens (not a page redirect)

### AT-03 — Method select + event `payment_method_selected`
- **Given**: Payment modal open
- **When**: Select SePay / PayPal / Zalo sequentially
- **Then**:
  - [ ] Each selection logs `payment_method_selected` (method, tier, roomBand)

### AT-04 — Currency routing (VND → SePay, USD → PayPal)
- **Given**: Currency toggle/logic exists
- **When**: Currency = VND → SePay is primary, PayPal hidden/disabled
- **When**: Currency = USD → PayPal is primary, SePay hidden/disabled
- **Then**:
  - [ ] No VND transaction creates USD flow
  - [ ] No USD transaction creates VND flow

---

## B. SePay (VND) — Checkout → Webhook → Auto-activate

### AT-05 — Create checkout (happy path)
- **Given**: H1 has no PENDING tx
- **When**: `POST /api/payments/sepay/create-checkout` {hotelId:H1, tier:SUPERIOR, roomBand:BAND_1}
- **Then**:
  - [ ] Response: checkout URL/form data
  - [ ] DB `PaymentTransaction`: status=PENDING, gateway=SEPAY, order_id unique
  - [ ] hotel_id=H1, user_id=U1, currency='VND'
  - [ ] purchased_tier=SUPERIOR, purchased_room_band=BAND_1
  - [ ] amount matches constants
  - [ ] expires_at = created_at + 30min

### AT-06 — Webhook valid → COMPLETED + activate
- **Given**: AT-05 PENDING tx exists
- **When**: SePay webhook POST with valid payload (match order_id, amount + currency + tier OK)
- **Then**:
  - [ ] PaymentTransaction: status=COMPLETED, completed_at set, raw_payload saved
  - [ ] gateway_transaction_id stored
  - [ ] Subscription H1: plan=SUPERIOR, status=ACTIVE, external_provider='SEPAY'
  - [ ] current_period_start=now, current_period_end=now+30d
  - [ ] AuditLog: SUBSCRIPTION_CHANGED
  - [ ] Event: `payment_success` (gateway=SEPAY, tier, amount)
  - [ ] All above in SAME Prisma $transaction

### AT-07 — Webhook amount mismatch → FAILED
- **Given**: PENDING tx exists
- **When**: Webhook with transferAmount ≠ expected amount
- **Then**:
  - [ ] PaymentTransaction: status=FAILED, failed_at set, failed_reason='amount_mismatch'
  - [ ] Subscription NOT modified
  - [ ] Event: `payment_failed` (gateway=SEPAY, reason=amount_mismatch)

### AT-08 — Webhook currency mismatch
- **Given**: PENDING with currency=VND
- **When**: Webhook sends currency=USD (or missing)
- **Then**:
  - [ ] PaymentTransaction: status=FAILED
  - [ ] Subscription NOT activated

### AT-09 — Duplicate webhook → idempotent
- **Given**: AT-06 already COMPLETED
- **When**: Replay same webhook (same gateway_transaction_id)
- **Then**:
  - [ ] Return 200 OK
  - [ ] No new PaymentTransaction created
  - [ ] No additional AuditLog "activate"
  - [ ] current_period_end NOT extended again

### AT-10 — Concurrent payment lock (2 tabs)
- **Given**: Tab 1 creates PENDING for H1
- **When**: Tab 2 calls create-checkout for H1
- **Then**:
  - [ ] Tab 2 rejected: "Bạn đã có giao dịch đang chờ xử lý"
  - [ ] DB has exactly 1 PENDING for H1

### AT-11 — PENDING auto-expire after 30 min
- **Given**: PENDING tx with expires_at < now (set created_at 31min ago)
- **When**: New create-checkout call for H1
- **Then**:
  - [ ] Old PENDING set to FAILED (auto-expired)
  - [ ] New PENDING created successfully
  - [ ] No 2 active PENDING for same hotel

---

## C. PayPal (USD) — Subscription → Activate → Webhook

### AT-12 — PayPal button render + PENDING created
- **Given**: Currency=USD, payment modal open
- **When**: Select PayPal
- **Then**:
  - [ ] PayPalCheckout.tsx renders sandbox PayPal button
  - [ ] DB creates PaymentTransaction PENDING before user approves
  - [ ] Event `payment_method_selected` logged

### AT-13 — Approve → activate with period_end from PayPal
- **Given**: User approves PayPal subscription in sandbox
- **When**: `POST /api/payments/paypal/activate` with paypalSubscriptionId
- **Then**:
  - [ ] Server verifies with PayPal API: status=ACTIVE
  - [ ] PaymentTransaction: status=COMPLETED, gateway=PAYPAL, currency=USD
  - [ ] completed_at set, provider_customer_ref = payer email
  - [ ] Subscription: external_provider='PAYPAL', external_subscription_id=subId
  - [ ] plan=purchased tier, current_period_end = `billing_info.next_billing_time` (**NOT** now+30d)
  - [ ] AuditLog: SUBSCRIPTION_CHANGED
  - [ ] Event: `payment_success` (gateway=PAYPAL)
  - [ ] All in Prisma $transaction

### AT-14 — PayPal webhook PAYMENT.SALE.COMPLETED → extend period
- **Given**: PAYPAL subscription ACTIVE
- **When**: Webhook `PAYMENT.SALE.COMPLETED`
- **Then**:
  - [ ] Signature verified OK
  - [ ] Re-fetch subscription details from PayPal API (not trust payload)
  - [ ] PaymentTransaction COMPLETED (or new renewal record)
  - [ ] current_period_end updated from PayPal response
  - [ ] Idempotent if replayed

### AT-15 — PayPal webhook CANCELLED → downgrade
- **Given**: PAYPAL subscription ACTIVE
- **When**: Webhook `BILLING.SUBSCRIPTION.CANCELLED`
- **Then**:
  - [ ] Subscription: plan=STANDARD, status=CANCELLED
  - [ ] AuditLog: SUBSCRIPTION_CHANGED
  - [ ] (Policy): external_provider kept as 'PAYPAL' for trace, or cleared — must be consistent

### AT-16 — PayPal webhook SUSPENDED → PAST_DUE
- **Given**: PAYPAL subscription ACTIVE
- **When**: Webhook `BILLING.SUBSCRIPTION.SUSPENDED`
- **Then**:
  - [ ] Subscription: status=PAST_DUE (plan kept per policy)

### AT-17 — PayPal duplicate webhook → idempotent
- **Given**: Same event_id / gateway_transaction_id already processed
- **When**: Replay webhook
- **Then**:
  - [ ] No double-extend period
  - [ ] No double AuditLog
  - [ ] Return 200 OK

---

## D. Zalo Manual (Admin Activate)

### AT-18 — Zalo deep link + event `zalo_clicked`
- **Given**: Payment modal open
- **When**: Click Zalo button
- **Then**:
  - [ ] Desktop: opens `https://zalo.me/0778602953`
  - [ ] Mobile: opens Zalo app at 0778602953
  - [ ] Event: `zalo_clicked` (tier, roomBand)

### AT-19 — Admin manual activation
- **Given**: Admin A1 logged in
- **When**: `POST /api/admin/activate-subscription` {hotelId:H1, tier:DELUXE, roomBand:BAND_1, durationDays:30}
- **Then**:
  - [ ] Subscription: plan=DELUXE, status=ACTIVE, period=30 days
  - [ ] external_provider='ZALO_MANUAL'
  - [ ] PaymentTransaction COMPLETED (gateway=ZALO_MANUAL)
  - [ ] AuditLog: SUBSCRIPTION_CHANGED

### AT-20 — Non-admin blocked
- **Given**: U1 is NOT admin
- **When**: Calls admin activation endpoint
- **Then**:
  - [ ] Response: 401 or 403
  - [ ] DB unchanged

---

## E. Cron Expiry + PayPal Sync

### AT-21 — SePay expiry: grace 3 days → PAST_DUE → CANCELLED
- **Given**: SEPAY subscription, current_period_end < now
- **When**: Cron runs
- **Then**:
  - [ ] If `now < period_end + 3d` → status=PAST_DUE
  - [ ] If `now > period_end + 3d` → status=CANCELLED, plan=STANDARD

### AT-22 — PayPal sync prevents false downgrade
- **Given**: PAYPAL subscription, current_period_end < now in DB (stale/wrong)
- **When**: Cron runs
- **Then**:
  - [ ] Cron re-fetches from PayPal API
  - [ ] If PayPal says ACTIVE + next_billing_time > now → update period_end, SKIP downgrade
  - [ ] If PayPal says CANCELLED/SUSPENDED → proceed with downgrade/past_due

---

## F. Cross-scenario (Upgrade Path, Switching Method)

### AT-23 — Upgrade from ACTIVE to higher tier
- **Given**: H1 is ACTIVE SUPERIOR
- **When**: User purchases DELUXE (via SePay or PayPal)
- **Then**:
  - [ ] Subscription: plan=DELUXE, period reset/extended (per policy)
  - [ ] AuditLog: oldPlan=SUPERIOR → newPlan=DELUXE

### AT-24 — ACTIVE PAYPAL but tries SePay for different tier
- **Given**: H1 ACTIVE via PAYPAL
- **When**: Creates SePay checkout for different tier
- **Then** (policy decision — pick one):
  - [ ] **Option A (recommended)**: Block + message "Đang có PayPal subscription — hãy đổi plan trong PayPal"
  - [ ] **Option B**: Allow but define precedence (avoid 2-provider conflict)
  - [ ] **Pass**: No ambiguous state (2 providers active simultaneously)

---

## Pass/Fail Summary

A test **PASSES** when ALL of:
- [ ] DB state correct (PaymentTransaction + Subscription)
- [ ] AuditLog entries correct
- [ ] PLG events fired (6 events)
- [ ] Webhook idempotent (no double-activate/extend)
- [ ] Concurrent lock prevents 2 PENDING/hotel
- [ ] Cron PayPal sync prevents false downgrade
- [ ] All mutations in Prisma $transaction (atomicity)
