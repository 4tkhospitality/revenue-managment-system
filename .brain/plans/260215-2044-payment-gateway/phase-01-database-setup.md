# Phase 01: Database + Payment Library Setup
Status: ⬜ Pending
Dependencies: None
Updated: 2026-02-15 (P0 + P1 review applied)

## Objective
Mở rộng Prisma schema cho payment transactions (chuẩn multi-tenancy + enum) và tạo payment helper library.

## Implementation Steps

### 1.1. Prisma Schema — PaymentTransaction model

```prisma
enum PaymentGateway {
  SEPAY
  PAYPAL
  ZALO_MANUAL
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

model PaymentTransaction {
  id                      String          @id @default(uuid()) @db.Uuid

  // Multi-tenancy (bắt buộc)
  hotel_id                String          @db.Uuid
  user_id                 String?         @db.Uuid

  // Link to subscription
  subscription_id         String?         @db.Uuid
  subscription            Subscription?   @relation(fields: [subscription_id], references: [id])

  // Gateway info
  gateway                 PaymentGateway
  gateway_transaction_id  String?
  order_id                String          @unique  // RMS-{hotelId.slice(0,8)}-{timestamp}

  // Amount — Decimal(12,2) để hỗ trợ cả VND (0 decimal) và USD (2 decimal)
  amount                  Decimal         @db.Decimal(12, 2)
  currency                String          @default("VND")  // "VND" | "USD"

  // Status — dùng enum, KHÔNG dùng String
  status                  PaymentStatus   @default(PENDING)

  // Tier/roomBand snapshot tại thời điểm purchase (để validate webhook)
  purchased_tier          PlanTier?
  purchased_room_band     RoomBand?

  // Timestamps (P1 — operational debugging)
  expires_at              DateTime?       // PENDING auto-expire (created_at + 30min)
  completed_at            DateTime?       // When status changed to COMPLETED
  failed_at               DateTime?       // When status changed to FAILED
  failed_reason           String?         // Why it failed (amount_mismatch, timeout, etc.)

  // Gateway event tracking (P1 — reconciliation)
  gateway_event_id        String?         // PayPal event.id (vs resource.id)
  provider_customer_ref   String?         // PayPal payer email/id

  // Meta
  description             String?
  raw_payload             Json?           // Webhook payload gốc
  created_at              DateTime        @default(now())

  // Indexes
  @@unique([gateway, gateway_transaction_id])  // Chống webhook duplicate
  @@index([status, expires_at])                // P1: fast query for PENDING auto-expire
  @@index([hotel_id])
  @@index([status])
  @@map("payment_transactions")
}
```

### 1.2. Subscription model — Single Source of Truth
- [ ] **KHÔNG thêm** `payment_gateway` field mới
- [ ] Giữ nguyên `external_provider` làm source of truth duy nhất
- [ ] Values: `'SEPAY'` | `'PAYPAL'` | `'ZALO_MANUAL'`
- [ ] Add relation: `payments PaymentTransaction[]`

```diff
model Subscription {
  // ... existing fields ...
  external_provider         String?     // 'SEPAY' | 'PAYPAL' | 'ZALO_MANUAL'
  external_customer_id      String?
  external_subscription_id  String?
  current_period_start      DateTime?
  current_period_end        DateTime?
+ payments                  PaymentTransaction[]
}
```

### 1.3. Run migration
- [ ] `prisma db push` hoặc `prisma migrate dev --name add-payment-transactions`

### 1.4. Install SDKs
- [ ] `npm install @paypal/react-paypal-js`
- [ ] SePay: implement manual helper (no npm package needed — chỉ dùng `crypto` cho HMAC-SHA256)

### 1.5. Environment Variables
- [ ] Add to `.env.local` and `.env.example`:
  ```env
  # SePay (VND)
  SEPAY_MERCHANT_ID=
  SEPAY_SECRET_KEY=
  SEPAY_WEBHOOK_API_KEY=
  SEPAY_API_URL=https://my.sepay.vn

  # PayPal (USD)
  PAYPAL_CLIENT_ID=
  PAYPAL_SECRET=
  PAYPAL_API_URL=https://api-m.sandbox.paypal.com
  PAYPAL_WEBHOOK_ID=
  NEXT_PUBLIC_PAYPAL_CLIENT_ID=
  ```

### 1.6. Create payment lib

#### `lib/payments/constants.ts`
- [ ] Pricing config per tier × roomBand × currency
- [ ] `TIER_PRICES_VND` + `TIER_PRICES_USD` maps
- [ ] `getPrice(tier, roomBand, currency)` helper

#### `lib/payments/sepay.ts`
- [ ] `createCheckoutForm(params)` — generate form data + HMAC-SHA256 signature
- [ ] `verifyWebhookApiKey(req)` — check API key header
- [ ] `parseSepayWebhook(body)` — typed parsing of SePay webhook payload

#### `lib/payments/paypal.ts`
- [ ] `getAccessToken()` — OAuth2 client credentials flow
- [ ] `getSubscriptionDetails(subId)` — verify subscription status
- [ ] `verifyWebhookSignature(req)` — verify PayPal webhook

#### `lib/payments/activation.ts` ⭐ (Shared — P0 Critical)
- [ ] `applySubscriptionChange(hotelId, { periodStart, periodEnd, provider, externalSubId?, plan, status })`
- [ ] Single function used by ALL gateways to activate/modify subscription
- [ ] Logs to `AuditLog` (SUBSCRIPTION_CHANGED)
- [ ] Validates: hotel exists, no concurrent PENDING transaction for same hotel

## Files to Create/Modify
| File | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | MODIFY | Add PaymentTransaction, enums, relation |
| `lib/payments/constants.ts` | NEW | Tier pricing config |
| `lib/payments/sepay.ts` | NEW | SePay helper functions |
| `lib/payments/paypal.ts` | NEW | PayPal helper functions |
| `lib/payments/activation.ts` | NEW | Shared activation logic |
| `.env.example` | MODIFY | Add payment env vars |

## Atomicity Rule (P1)
> All webhook handlers MUST wrap `PaymentTransaction.update + applySubscriptionChange()` 
> inside a **Prisma `$transaction()`** to prevent partial state:
> - tx = COMPLETED but subscription unchanged (or vice versa)
> - Critical because webhooks retry on failure

## Test Criteria
- [ ] `prisma db push` succeeds
- [ ] `tsc --noEmit` clean
- [ ] Unique indexes exist on `order_id` and `(gateway, gateway_transaction_id)`
- [ ] Index exists on `(status, expires_at)`
- [ ] SePay HMAC-SHA256 produces correct signature
- [ ] `applySubscriptionChange()` correctly updates Subscription + logs AuditLog
- [ ] `applySubscriptionChange()` runs inside Prisma `$transaction()`
