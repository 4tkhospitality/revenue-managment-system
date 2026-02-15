# Go-Live Implementation Checklist
Created: 2026-02-15
Purpose: 7 guardrails dev MUST follow when implementing Phase 02/03/05

> **Rule**: Check each box BEFORE marking phase as complete.
> These are NOT plan changes — they are implementation discipline checks.

---

## ✅ GLC-01 — PayPal webhook: subscribe đúng event set

Khi tạo webhook trong PayPal Dashboard (sandbox + production), subscribe **tất cả** events sau:

```
BILLING.SUBSCRIPTION.ACTIVATED
BILLING.SUBSCRIPTION.CANCELLED
BILLING.SUBSCRIPTION.SUSPENDED
BILLING.SUBSCRIPTION.EXPIRED
PAYMENT.SALE.COMPLETED
PAYMENT.SALE.DENIED         ← optional nhưng nên có
```

- [ ] Sandbox webhook created with all events above
- [ ] Production webhook created with all events above
- [ ] AT-14~17 không bị "thiếu event"

---

## ✅ GLC-02 — PayPal webhook: raw body cho signature verify

PayPal yêu cầu CRC32 tính trên **raw payload** gốc — KHÔNG được `JSON.parse()` rồi `JSON.stringify()` lại.

```typescript
// Next.js App Router: disable auto body parsing
export const config = { api: { bodyParser: false } };

// Hoặc dùng route segment config:
export const runtime = 'nodejs';
// Read raw body manually
const rawBody = await request.text();
const parsedBody = JSON.parse(rawBody);

// Verify với raw, parse riêng
await verifyWebhookSignature({
  rawBody,
  headers: {
    'paypal-transmission-id': req.headers.get('paypal-transmission-id'),
    'paypal-transmission-sig': req.headers.get('paypal-transmission-sig'),
    'paypal-transmission-time': req.headers.get('paypal-transmission-time'),
    'paypal-cert-url': req.headers.get('paypal-cert-url'),
    'paypal-auth-algo': req.headers.get('paypal-auth-algo'),
  },
  webhookId: process.env.PAYPAL_WEBHOOK_ID,
});
```

- [ ] Webhook route reads raw body BEFORE parsing
- [ ] All 5 PayPal headers extracted
- [ ] `PAYPAL_WEBHOOK_ID` in env vars

---

## ✅ GLC-03 — SePay idempotency: đúng dedup field

SePay chống trùng bằng `id` (unique per transaction).

```typescript
// Khi parse SePay webhook:
gateway_transaction_id = sepayPayload.id;  // ← dùng field này
// KHÔNG dùng referenceCode (có thể trùng nếu reuse)
```

- [ ] `gateway_transaction_id` = `sepayPayload.id`
- [ ] Đã xác nhận `id` từ SePay docs là stable & unique

---

## ✅ GLC-04 — Unique index + NULL: handle webhook race

Postgres cho phép **nhiều NULL** trong unique composite `(gateway, gateway_transaction_id)`.

→ PENDING (chưa có `gateway_transaction_id`) vẫn tạo được nhiều record **NẾU bỏ lock**.
→ Anh đã có concurrent lock nên OK, nhưng khi webhook cập nhật `gateway_transaction_id`:

```typescript
try {
  await tx.paymentTransaction.update({
    where: { id: pendingTx.id },
    data: { gateway_transaction_id: webhookTxId, status: 'COMPLETED', ... }
  });
} catch (e) {
  if (e.code === 'P2002') {
    // Unique violation = webhook replay / race
    return NextResponse.json({ ok: true }, { status: 200 }); // Idempotent
  }
  throw e;
}
```

- [ ] Catch Prisma `P2002` (unique violation) → return 200
- [ ] Log "duplicate webhook detected" for monitoring

---

## ✅ GLC-05 — FOR UPDATE: transaction ngắn, không gọi external API

```
✅ Trong $transaction():
   - Check PENDING + expire old + create new PaymentTransaction
   - Return result

❌ KHÔNG trong $transaction():
   - Gọi SePay API (tạo checkout)
   - Gọi PayPal API (verify subscription)
```

Pattern đúng:
```typescript
// 1. DB transaction (ngắn)
const pendingTx = await prisma.$transaction(async (tx) => {
  // Expire old PENDING if exists
  // Create new PENDING
  return newTx;
});

// 2. External API call (ngoài transaction)
const checkoutUrl = await sepay.createCheckout(pendingTx.order_id, ...);

// 3. Return to client
return NextResponse.json({ checkoutUrl });
```

- [ ] No external HTTP calls inside `$transaction()`
- [ ] Transaction lock time < 100ms expected

---

## ✅ GLC-06 — Amount compare: normalize to minor units

```typescript
function compareAmount(
  dbAmount: Decimal,    // Decimal(12,2) from Prisma
  webhookAmount: number,
  currency: string
): boolean {
  // Normalize to minor units (integer compare, no float)
  if (currency === 'VND') {
    // VND has 0 decimal places
    return dbAmount.toNumber() === Math.round(webhookAmount);
  }
  if (currency === 'USD') {
    // Compare in cents (2 decimal places → integer)
    const dbCents = dbAmount.mul(100).toNumber();
    const webhookCents = Math.round(webhookAmount * 100);
    return dbCents === webhookCents;
  }
  return false;
}
```

- [ ] VND: integer compare (no decimals)
- [ ] USD: compare in cents (×100, round)
- [ ] Never use `===` on float values directly
- [ ] AT-07/AT-08 pass without false negatives

---

## ✅ GLC-07 — Provider switching: enforce at API layer

**Policy**: Option A — block khi đang có active subscription từ provider khác.

```typescript
// In create-checkout (SePay) and paypal/activate:
const currentSub = await prisma.subscription.findUnique({
  where: { hotel_id: hotelId }
});

if (currentSub?.status === 'ACTIVE'
    && currentSub.external_provider
    && currentSub.external_provider !== targetProvider) {
  return NextResponse.json({
    error: `Bạn đang có subscription qua ${currentSub.external_provider}. `
         + `Vui lòng hủy trước hoặc quản lý tại /settings/billing.`
  }, { status: 409 });
}
```

- [ ] SePay create-checkout checks for active PayPal → block
- [ ] PayPal activate checks for active SePay → block
- [ ] Error message includes guidance (link to billing/cancel)
- [ ] AT-24 passes: no ambiguous 2-provider state
