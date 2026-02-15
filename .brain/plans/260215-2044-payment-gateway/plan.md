# Plan: Tích hợp Cổng Thanh Toán (SePay + PayPal + Zalo)
Created: 2026-02-15
Updated: 2026-02-15 (P0 + P1 review applied)
Status: 🟡 In Progress

## Overview
Tích hợp 3 phương thức thanh toán/nâng cấp cho hệ thống RMS:
1. **SePay.vn** — QR Banking cho khách VN, thanh toán **VND** (phí ~200-500đ/tx)
2. **PayPal** — Subscription cho khách quốc tế, thanh toán **USD** (phí ~4.5%, auto-renew)
3. **Zalo** — Liên hệ trực tiếp qua Zalo `0778602953` trước khi đăng ký/nâng cấp gói

## Currency Routing Rule
```
VND → SePay  (QR Banking nội địa VN)
USD → PayPal (Subscription quốc tế, concurrent recurring monthly)
```

## Tech Stack
- Frontend: Next.js App Router + `@paypal/react-paypal-js`
- Backend: Next.js API Routes + SePay HMAC-SHA256 (manual helper)
- Database: Prisma (Subscription model đã có sẵn)
- Webhooks: SePay webhook + PayPal webhook

## Existing Infrastructure (đã có)
- ✅ `Subscription` model: `external_provider`, `external_subscription_id`, `current_period_start/end`
- ✅ `PlanTier` enum: STANDARD, SUPERIOR, DELUXE, SUITE
- ✅ `SubscriptionStatus`: ACTIVE, TRIAL, PAST_DUE, CANCELLED
- ✅ `/pricing-plans` page + `/api/subscription` route
- ✅ `TierPaywall` + `SubscriptionBadge` components

## Key Design Decisions (P0)

### Single Source of Truth
- Dùng `external_provider` field trong `Subscription` model — **KHÔNG** thêm field mới
- Values: `'SEPAY'` | `'PAYPAL'` | `'ZALO_MANUAL'`

### Amount Model
- `Decimal(12, 2)` + `currency` field — hỗ trợ cả VND (0 decimal) và USD (2 decimal)

### Shared Activation Function
- `applySubscriptionChange(hotelId, { periodStart, periodEnd, provider, externalSubId?, plan, status })`
- SePay webhook gọi với `(now, now + 30d, 'SEPAY')`
- PayPal webhook gọi với `(fromPayPal.start, fromPayPal.end, 'PAYPAL')`
- Admin Zalo gọi với `(now, now + 30d, 'ZALO_MANUAL')`

### Idempotency
- Unique index `(gateway, gateway_transaction_id)` trên `PaymentTransaction`
- Unique `order_id` cho mỗi giao dịch
- Webhook handler check duplicate trước khi activate

### Atomicity (P1)
- ALL webhook handlers use Prisma `$transaction()` for PaymentTransaction + Subscription updates
- `applySubscriptionChange()` receives `tx: PrismaTransactionClient` as first arg
- Concurrent lock uses `SELECT ... FOR UPDATE` inside transaction

## Phases

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 01 | Database + Payment lib | ⬜ Pending | 0% |
| 02 | SePay Checkout (VND) | ⬜ Pending | 0% |
| 03 | PayPal Subscription (USD) | ⬜ Pending | 0% |
| 04 | Pricing Plans Page (3 options UI) | ⬜ Pending | 0% |
| 05 | Webhook Handlers + Auto-activate | ⬜ Pending | 0% |
| 06 | Testing + Deploy | ⬜ Pending | 0% |

### Guardrails — Must complete before moving on
- **After Phase 01**: schema migrated, `activation.ts` works, pricing constants match acceptance tests
- **Before Phase 02/03**: 24 acceptance tests documented (see `acceptance-tests.md`)
- **During Phase 02/03/05**: follow `go-live-checklist.md` (7 implementation guardrails) ⭐
- **After Phase 06**: all AT-01 to AT-24 pass + all GLC-01~07 checked off

## 3 Phương thức nâng cấp gói

```
┌──────────────────────────────────────────────────────┐
│          CHỌN PHƯƠNG THỨC THANH TOÁN                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  💳 Chuyển khoản / QR     🌍 PayPal        💬 Zalo  │
│  ┌──────────────────┐   ┌──────────────┐   ┌──────┐ │
│  │ SePay QR Banking │   │ PayPal       │   │ Zalo │ │
│  │ Phí: 200-500đ    │   │ Phí: ~4.5%   │   │ Free │ │
│  │ Tự động kích hoạt│   │ Auto-renew   │   │ Tư   │ │
│  │ VND only         │   │ USD only     │   │ vấn  │ │
│  └──────────────────┘   └──────────────┘   └──────┘ │
│                                                      │
│  Zalo: 0778602953 (liên hệ trước khi đăng ký)       │
└──────────────────────────────────────────────────────┘
```

## P1 — Operational Hardening (applied to phases)
- ✅ `expires_at`, `completed_at`, `failed_at`, `failed_reason` on PaymentTransaction
- ✅ `gateway_event_id`, `provider_customer_ref` for reconciliation
- ✅ Prisma `$transaction()` for ALL webhook handlers (atomicity)
- ✅ `SELECT ... FOR UPDATE` for concurrent payment lock
- ✅ PayPal webhook: re-fetch subscription from API (don't trust payload)
- ✅ Cron: 19:00 UTC = 02:00 VN (night run)

## P2 — Conversion & Self-serve (deferred)
- `/settings/billing` page (current plan, history, manage PayPal)
- Admin "mark refunded" endpoint
- Telemetry funnel KPIs: view→click rate, click→success rate, time-to-activate

## PLG Event Tracking
Log tối thiểu: `pricing_viewed`, `upgrade_clicked`, `payment_method_selected`,
`payment_success`, `payment_failed`, `zalo_clicked`

## Quick Commands
- Start Phase 1: `/code phase-01`
- Check progress: `/next`
- Save context: `/save-brain`
