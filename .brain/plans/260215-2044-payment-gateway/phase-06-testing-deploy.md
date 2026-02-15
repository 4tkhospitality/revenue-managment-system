# Phase 06: Testing + Deploy
Status: ⬜ Pending
Dependencies: Phase 01-05
Updated: 2026-02-15 (P0 review applied)

## Objective
Test toàn bộ flow E2E, cả sandbox + edge cases, deploy production.

## Implementation Steps

### 6.1. SePay Sandbox Testing
- [ ] Đăng ký tài khoản sandbox `my.dev.sepay.vn`
- [ ] Liên hệ SePay kích hoạt sandbox
- [ ] Test: tạo checkout → webhook giả lập → auto-activate
- [ ] Test: amount mismatch → PaymentTransaction status = FAILED
- [ ] Test: duplicate webhook → no double-activate (idempotent)

### 6.2. PayPal Sandbox Testing
- [ ] Tạo sandbox accounts tại PayPal Developer
- [ ] Test: create subscription → approve → activate
- [ ] Test: `period_end` comes from PayPal response (not +30d)
- [ ] Test: webhook PAYMENT.SALE.COMPLETED → extend period
- [ ] Test: webhook CANCELLED → downgrade to STANDARD
- [ ] Test: auto-renewal cycle (simulate recurring payment)

### 6.3. Zalo Flow Testing
- [ ] Verify deep link `https://zalo.me/0778602953` on mobile + desktop
- [ ] Test: admin manual activation via API
- [ ] Verify `ZALO_MANUAL` logged in PaymentTransaction + AuditLog

### 6.4. Edge Cases (P0)
- [ ] Concurrent payment: 2 tabs → only 1 PENDING allowed
- [ ] Webhook timeout → SePay/PayPal retry → idempotent
- [ ] Partial payment (SePay — amount < expected) → FAILED
- [ ] User already ACTIVE → upgrade to higher tier
- [ ] User already ACTIVE via PayPal → tries SePay for different tier
- [ ] Cron downgrade → PayPal sync first → avoid false downgrade
- [ ] PENDING transaction > 30 min → auto-expire
- [ ] Session expires during payment redirect

### 6.5. PLG Event Verification
- [ ] `pricing_viewed` fires on page load
- [ ] `upgrade_clicked` fires with correct tier
- [ ] `payment_method_selected` fires for each method
- [ ] `payment_success` fires via webhook callback
- [ ] `payment_failed` fires on failure
- [ ] `zalo_clicked` fires with tier data

### 6.6. Deploy
- [ ] Set production env vars (SePay live + PayPal live credentials)
- [ ] Configure Vercel cron: daily `check-subscription`
- [ ] Update `vercel.json` with cron config
- [ ] Git commit + push
- [ ] Verify webhook URLs reachable from SePay + PayPal
- [ ] Test first real transaction (small amount) in production

## Test Matrix

| Scenario | SePay | PayPal | Zalo |
|----------|-------|--------|------|
| Happy path | ✅ | ✅ | ✅ |
| Duplicate webhook | ✅ | ✅ | N/A |
| Amount mismatch | ✅ | N/A | N/A |
| Auto-renew | N/A | ✅ | N/A |
| Cancellation | N/A | ✅ | ✅ Admin |
| Cron expiry | ✅ SePay | ✅ (sync first) | ✅ |
| Concurrent lock | ✅ | ✅ | N/A |
