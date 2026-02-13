# Phase 09: Schema Migration S3 + Commission Ledger (Auto-calc)
Status: ⬜ Pending
Sprint: S3
Dependencies: Phase 07, 08

## Objective
Automatically calculate commissions when invoices are paid. Append-only ledger with snapshot of contract rate. Clawback on refund/chargeback. Never UPDATE amount — only REVERSAL or ADJUSTMENT.

## Commission Flow

```
Invoice PAID
  → Find active attribution for hotel
  → Find active contract for reseller
  → commission = invoice.amount_net * contract.commission_rate
  → Create CommissionLedger { status: PENDING }

Invoice REFUNDED (within 30d) or CHARGEBACK
  → Create CommissionLedger REVERSAL (negative amount)

Monthly admin review
  → Bulk approve PENDING → APPROVED
  → Run payout (Phase 11)
```

## Step 0: S3 Schema Migration

### Billing Core (prerequisite for commission)

> **Issue D fix**: Commission auto-calc requires a standard Invoice/Payment source.
> Phase 09 includes Billing Core models if they don't already exist.

- [ ] `Invoice` model (if not already existing):
  ```prisma
  model Invoice {
    id              String    @id @default(uuid()) @db.Uuid
    hotel_id        String    @db.Uuid
    subscription_id String    @db.Uuid
    period_start    DateTime
    period_end      DateTime
    amount_gross    Decimal   @db.Decimal(12, 2)
    discount_amount Decimal   @default(0) @db.Decimal(12, 2)
    amount_net      Decimal   @db.Decimal(12, 2)  // gross - discount
    currency        String    @default("VND")
    status          InvoiceStatus @default(PENDING)
    paid_at         DateTime?
    refunded_at     DateTime?
    created_at      DateTime  @default(now())
    hotel           Hotel     @relation(fields: [hotel_id], references: [hotel_id])
    commission_entries CommissionLedger[]
    @@index([hotel_id, status])
    @@map("invoices")
  }

  enum InvoiceStatus {
    PENDING
    PAID
    REFUNDED
    CHARGEBACKED
    VOIDED
  }
  ```

- [ ] `PaymentReceipt` model (bank transfer proof):
  ```prisma
  model PaymentReceipt {
    id          String   @id @default(uuid()) @db.Uuid
    invoice_id  String   @db.Uuid
    method      String   // "BANK_TRANSFER" | "SEPAY" | "STRIPE"
    reference   String?  // transfer ref / transaction id
    amount      Decimal  @db.Decimal(12, 2)
    verified_at DateTime?
    verified_by String?  @db.Uuid  // admin user_id
    created_at  DateTime @default(now())
    @@map("payment_receipts")
  }
  ```

### Commission + Payout Models

- [ ] `CommissionLedger` with idempotency constraint:
  ```prisma
  @@unique([invoice_id, contract_id, rule_version, entry_type])
  // entry_type: "NORMAL" | "REVERSAL" | "ADJUSTMENT"
  ```
  This prevents double-pay if invoice paid event fires twice.
- [ ] `Payout`
- [ ] Add field `entry_type String @default("NORMAL")` to CommissionLedger
- [ ] Add `Hotel ↔ Invoice` relation

### Migration
- [ ] Dev: `npx prisma db push`
- [ ] Staging/Prod: `npx prisma migrate dev` → `npx prisma migrate deploy`
- [ ] `npx prisma generate`

## Implementation Steps

1. [ ] Create `lib/commission/commission.ts`
   - `calculateCommission(invoiceId)` → find attribution + contract → create ledger entry
   - `reverseCommission(invoiceId, reason)` → create reversal entry (negative)
   - `getCommissionSummary(resellerId, period)` → aggregate by status
   - `getHotelCommissions(hotelId)` → all commission entries for hotel
   - `bulkApprove(ledgerIds[])` → set status PENDING → APPROVED

2. [ ] Create commission trigger
   - When invoice `status` changes to PAID (`paid_at` set) → auto-call `calculateCommission()`
   - When invoice `status` changes to REFUNDED/CHARGEBACKED → auto-call `reverseCommission()`
   - Implementation: explicit call in payment verification flow (not Prisma middleware)
   - Admin marks PaymentReceipt as verified → Invoice becomes PAID → commission triggers

3. [ ] Ledger immutability contract
   - No UPDATE on amount, rate, or status (except PENDING → APPROVED/PAID)
   - Reversal = new row with negative amount
   - Every row snapshots: contract_id, rate, rule_version

4. [ ] Create admin commission API
   - `GET /api/admin/commissions` — list with filters (reseller, status, period)
   - `POST /api/admin/commissions/approve` — bulk approve
   - `GET /api/admin/commissions/summary` — aggregate per reseller

5. [ ] Create commission report queries
   - Reseller monthly statement: SUM(amount) GROUP BY status
   - Hotel commission history: all entries for hotel
   - Overall commission liability: SUM(amount) WHERE status IN (PENDING, APPROVED)

## Files to Create
- `lib/commission/commission.ts`
- `app/api/admin/commissions/route.ts`
- `app/api/admin/commissions/approve/route.ts`
- `app/api/admin/commissions/summary/route.ts`

## Test Criteria
- [ ] Commission calculated correctly on invoice payment
- [ ] Reversal creates negative entry (not an update)
- [ ] Rate snapshots from contract at time of calculation
- [ ] Bulk approve changes status correctly
- [ ] Commission = 0 when subscription is past_due

---
Next Phase: [Phase 10 — Reseller Portal](./phase-10-portal.md)
