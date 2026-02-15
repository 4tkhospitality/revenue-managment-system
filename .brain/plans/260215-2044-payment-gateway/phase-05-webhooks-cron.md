# Phase 05: Webhook Handlers + Auto-activate + Cron
Status: ⬜ Pending
Dependencies: Phase 02, Phase 03
Updated: 2026-02-15 (P0 + P1 review applied)

## Objective
Đảm bảo webhooks an toàn, idempotent, có reconciliation, auto-deactivate khi hết hạn,
và PayPal sync trước khi downgrade.

## Implementation Steps

### 5.1. Webhook Security (cả 2 gateway)
- [ ] SePay: verify `SEPAY_WEBHOOK_API_KEY` header
- [ ] PayPal: verify webhook signature via PayPal API
- [ ] Rate limiting trên webhook routes (nếu cần)
- [ ] Both: return 200 OK cho mọi request sau verification (dù skip duplicate)

### 5.2. 3-Check Webhook Validation (P0 Critical)
Mỗi webhook PHẢI qua 3 bước:

```
Step 1: MATCH    → Tìm PaymentTransaction bằng order_id hoặc gateway_transaction_id
Step 2: VALIDATE → amount + currency + purchased_tier + purchased_room_band
Step 3: DEDUP    → Check unique(gateway, gateway_transaction_id) — skip nếu duplicate
```

### 5.3. Shared Activation Function ⭐
```typescript
// lib/payments/activation.ts
// P1: This function MUST be called inside a Prisma $transaction()
// The caller passes the transaction client (tx) to ensure atomicity
async function applySubscriptionChange(tx: PrismaTransactionClient, hotelId: string, params: {
  periodStart: Date;
  periodEnd: Date;
  provider: 'SEPAY' | 'PAYPAL' | 'ZALO_MANUAL';
  externalSubId?: string;
  plan: PlanTier;
  status: SubscriptionStatus;
}) {
  // 1. Upsert Subscription
  // 2. Set external_provider (single source of truth)
  // 3. Set current_period_start, current_period_end
  // 4. Set external_subscription_id (for PayPal)
  // 5. Update feature limits from tierConfig
  // 6. Log AuditLog (SUBSCRIPTION_CHANGED)
  // 7. Log PLG event (payment_success)
}
```

Callers:
- SePay webhook: `applySubscriptionChange(hotelId, { periodStart: now, periodEnd: now+30d, provider: 'SEPAY', plan })`
- PayPal activate: `applySubscriptionChange(hotelId, { periodStart: now, periodEnd: fromPayPal, provider: 'PAYPAL', ... })`
- PayPal webhook (renewal): extend period_end from PayPal response
- Admin Zalo: `applySubscriptionChange(hotelId, { periodStart: now, periodEnd: now+30d, provider: 'ZALO_MANUAL', plan })`

### 5.4. Subscription Expiry Cron
- [ ] `app/api/cron/check-subscription/route.ts` (Vercel cron)
- [ ] Chạy daily — **19:00 UTC = 02:00 VN** (P1: chạy đêm VN, không giờ GM check sáng)
- [ ] Logic:

```
FOR each subscription WHERE current_period_end < now:

  IF provider === 'PAYPAL':
    → SYNC with PayPal API first (getSubscriptionDetails)
    → If PayPal says ACTIVE + next_billing_time > now:
      → Update period_end from PayPal (cron was wrong, payment went through)
      → SKIP downgrade
    → If PayPal says CANCELLED/SUSPENDED:
      → Proceed with downgrade

  Grace period check:
    → If period_end + 3 days > now: set status = PAST_DUE
    → If period_end + 3 days < now: set status = CANCELLED, plan = STANDARD
```

- [ ] **P1**: Log cron execution results for monitoring

### 5.5. Manual Activation (Admin + Zalo)
- [ ] `app/api/admin/activate-subscription/route.ts`
- [ ] Auth: require admin role
- [ ] Input: `{ hotelId, tier, roomBand, durationDays? }`
- [ ] Default duration: 30 days
- [ ] Call `applySubscriptionChange(hotelId, { ..., provider: 'ZALO_MANUAL' })`
- [ ] Create `PaymentTransaction` with `gateway: ZALO_MANUAL`, `status: COMPLETED`

### 5.6. Concurrent Payment Lock (P1)
- [ ] Wrap create-checkout in Prisma `$transaction()` with:
  - Query existing PENDING for hotel — **SELECT ... FOR UPDATE** (hoặc `Serializable` isolation)
  - Auto-expire: nếu PENDING có `expires_at < now` → set FAILED trước, rồi cho tạo mới
  - Nếu PENDING chưa expire → reject "Bạn đã có giao dịch đang chờ xử lý"
- [ ] Đảm bảo 2 concurrent requests → chỉ 1 thành công (deterministic)

### 5.7. P2 — Self-serve Billing Page (deferred)
- [ ] `/settings/billing` page: current plan, expiry date, payment method
- [ ] Button "Xem lịch sử thanh toán" → list PaymentTransaction
- [ ] PayPal users: link "Manage subscription" (redirect to PayPal portal)
- [ ] Admin: "Mark refunded" endpoint + REFUNDED status

## Files to Create/Modify
| File | Action |
|------|--------|
| `lib/payments/activation.ts` | NEW (from Phase 01) |
| `app/api/cron/check-subscription/route.ts` | NEW |
| `app/api/admin/activate-subscription/route.ts` | NEW |
| `vercel.json` | MODIFY — add cron schedule |

## Test Criteria
- [ ] Duplicate webhooks don't double-activate
- [ ] Amount/tier mismatch is detected and logged
- [ ] Expired SePay subscriptions downgrade after grace
- [ ] Expired PayPal subscriptions sync with PayPal API before downgrade
- [ ] Admin can manually activate via API
- [ ] Concurrent PENDING transactions rejected
