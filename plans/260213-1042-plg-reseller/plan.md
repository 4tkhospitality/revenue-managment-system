# Plan: PLG Growth + Reseller + Auto Monetization
Created: 2026-02-13
Status: Planning
Source: [BRIEF-plg-growth.md](file:///c:/Apps/Antigravity/revenue-management-system/docs/BRIEF-plg-growth.md)

## Overview

Biến RMS từ "tool tốt nhưng không tự bán" thành **PLG engine tự vận hành**:
- Entitlements + feature gating → user gặp giới hạn đúng lúc
- Usage metering + upgrade nudges → tự động thúc đẩy upgrade
- Reseller attribution + commission ledger → kênh bán qua đối tác
- Promo codes + discount rules → tự động hóa ưu đãi

## Tech Stack (existing)
- **Framework**: Next.js 16 + TypeScript + Turbopack
- **DB**: Supabase (Postgres) via Prisma 5.10
- **Auth**: NextAuth + HotelUser RBAC
- **Deploy**: Vercel + Supabase
- **Existing models**: Hotel, User, HotelUser, Subscription (PlanTier + limits), ProductEvent

## Module Layout (namespaced by domain)

```
lib/
├── plg/              # S1: PLG Layer
│   ├── entitlements.ts
│   ├── guard.ts
│   ├── trial.ts
│   ├── usage.ts
│   └── events.ts
├── reseller/         # S2: Reseller
│   ├── reseller.ts
│   ├── attribution.ts
│   └── contracts.ts
├── promo/            # S2: Promo
│   └── promo.ts      # includes bestDiscountWins
├── commission/       # S3: Commission
│   └── commission.ts
├── payout/           # S4: Payout
│   └── payout.ts
├── audit/            # S4: Audit
│   └── audit.ts
└── shared/           # Cross-cutting
    ├── errors.ts     # PaywallError, QuotaExceededError
    ├── authz.ts      # requireHotelAccess (RBAC)
    └── idempotency.ts
```

## API Route Boundaries

| Scope | Path prefix | Auth guard | Sprint |
|-------|-------------|-----------|--------|
| **Hotel-tenant** | `/api/entitlements`, `/api/promo/*` | requireHotelAccess(userId, hotelId) | S1-S2 |
| **Admin** | `/api/admin/*` | requireRole('admin') | S2-S4 |
| **Reseller portal** | `/api/reseller/*` | requireResellerSession | S3 |
| **Cron** | `/api/cron/*` | CRON_SECRET header | S1 |

## Migration Strategy: Incremental per Sprint

| Sprint | Migration scope | Models |
|--------|----------------|--------|
| **S1** | PLG core | UsageMonthly, Subscription +trial fields, Hotel +active_promo_code_id |
| **S2** | Reseller + Promo | Reseller, Attribution, Contract, PromoCode, Redemption |
| **S3** | Ledger | CommissionLedger (+idempotency unique), Payout |

## Phases

| Phase | Name | Sprint | Status |
|-------|------|--------|--------|
| 01 | Schema Migration S1 (PLG models) | S1 | ⬜ Pending |
| 02 | Entitlements Service | S1 | ⬜ Pending |
| 03 | Guard + Gating Middleware | S1 | ⬜ Pending |
| 04 | Event Logging + Usage Roll-up | S1 | ⬜ Pending |
| 05 | PLG UI (PlanBadge, UsageMeter, UpgradeModal) | S1 | ⬜ Pending |
| 06 | Trial Policy (7+7 bonus) | S1 | ⬜ Pending |
| 07 | Schema Migration S2 + Reseller + Attribution | S2 | ⬜ Pending |
| 08 | PromoCode + Redemption | S2 | ⬜ Pending |
| 09 | Schema Migration S3 + Commission Ledger | S3 | ⬜ Pending |
| 10 | Reseller Portal | S3 | ⬜ Pending |
| 11 | Payout + Audit + PDF | S4 | ⬜ Pending |
| 12 | Admin Dashboard (Internal CRM) | S4 | ⬜ Pending |

## Sprint Go/No-Go Checklist

### S1 Done = PLG loop end-to-end ✅
- [ ] Entitlements returns correct flags/limits per plan
- [ ] Guard blocks features per gating matrix
- [ ] Events + rollup creates UsageMonthly correctly
- [ ] UI shows PlanBadge + UsageMeter + UpgradeModal
- [ ] Trial start + 7+7 bonus works (2/3 conditions)

### S2 Done = Attribution + promo auto + audit ✅
- [ ] Link/coupon/manual attach creates attribution
- [ ] Promo redeem atomic + rejects 2nd code
- [ ] Best discount wins + tie-breaker deterministic

### S3 Done = Ledger auto-calc + portal ✅
- [ ] Invoice paid → ledger entry (idempotent, no double-pay)
- [ ] Refund/chargeback → reversal row (negative)
- [ ] Reseller portal: hotels + commissions + CSV export

### S4 Done = Payout + CRM ✅
- [ ] Bulk approve → payout run → PDF/CSV statement
- [ ] Admin CRM: hotels, resellers, commissions, audit log

## Quick Commands
- Start Phase 1: `/code phase-01`
- Check progress: `/next`
- Save context: `/save-brain`
