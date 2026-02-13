# Phase 11: Payout + Audit + PDF
Status: ⬜ Pending
Sprint: S4
Dependencies: Phase 09, 10

## Objective
Admin can run monthly payout, generate statements, and maintain full audit trail. Every attribution change, commission, and payout is logged and traceable.

## Payout Flow

```
Monthly close (admin trigger):
1. Admin reviews PENDING commissions → bulk approve
2. Admin clicks "Run Payout" for period
3. System aggregates APPROVED commissions per reseller
4. Creates Payout record with total_amount
5. Admin transfers money (bank transfer)
6. Admin marks Payout as paid (paid_at + reference)
7. All APPROVED commissions → PAID
8. Reseller can see in portal
```

## Implementation Steps

### Payout Management

1. [ ] Create `lib/payout.ts`
   - `createPayout(resellerId, periodStart, periodEnd)` → aggregate approved commissions
   - `markPaid(payoutId, paidAt, method, reference)` → update + cascade commission status
   - `listPayouts(filters)` → admin list
   - `getPayoutDetail(payoutId)` → with commission line items

2. [ ] Create payout API
   - `GET /api/admin/payouts` — list
   - `POST /api/admin/payouts` — create payout run
   - `PATCH /api/admin/payouts/[id]` — mark as paid

### PDF Statement Generator

3. [ ] Create `lib/pdf/commission-statement.ts`
   - Generate PDF with: reseller info, period, line items, total
   - Use @react-pdf/renderer or jsPDF
   - Include: hotel name, invoice date, amount, rate, commission

4. [ ] Create statement API
   - `GET /api/reseller/commissions/statement/[period]` — PDF download
   - `GET /api/admin/payouts/[id]/statement` — admin PDF

### Audit Trail

5. [ ] Create `lib/audit.ts`
   - Log all attribution changes (create, close, re-attach)
   - Log all commission events (calculate, reverse, approve, pay)
   - Log all admin actions (create reseller, change contract, override)
   - Store in ProductEvent with `event_type: 'audit_*'`

6. [ ] Create admin audit view
   - `GET /api/admin/audit` — searchable audit log
   - Filter by: hotel, reseller, action type, date range

## Files to Create
- `lib/payout.ts`
- `lib/pdf/commission-statement.ts`
- `lib/audit.ts`
- `app/api/admin/payouts/route.ts`
- `app/api/admin/payouts/[id]/route.ts`
- `app/api/admin/payouts/[id]/statement/route.ts`
- `app/api/reseller/commissions/statement/[period]/route.ts`
- `app/api/admin/audit/route.ts`

## Test Criteria
- [ ] Payout aggregates correct total from approved commissions
- [ ] Mark paid cascades status to commission ledger entries
- [ ] PDF generates correctly with all line items
- [ ] Audit log captures all attribution/commission/payout events
- [ ] Admin can search audit by hotel/reseller/date

---
Next Phase: [Phase 12 — Admin Dashboard](./phase-12-admin.md)
