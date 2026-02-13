# Phase 01: Schema Migration — S1 (PLG Core Only)
Status: ⬜ Pending
Sprint: S1
Dependencies: None

## Objective
Add PLG-core models only. Reseller/Promo/Ledger models will be added in S2/S3 migrations. This reduces migration risk and prevents scope leak.

## Migration Scope (S1 only)

### New Model
- [ ] `UsageMonthly` — hotel usage counters, roll-up monthly

### Modified Models
- [ ] `Subscription` → add `trial_ends_at` (DateTime?), `trial_bonus_granted` (Boolean @default(false))
- [ ] `Hotel` → add `active_promo_code_id` (String? @db.Uuid) — source of truth for "1 hotel = 1 promo"
- [ ] `ProductEvent` → add `session_id` (String?) + index for session dedup

> **Note**: `active_promo_code_id` is added in S1 (not S2) because it's the source of truth for promo gating, and UI components in S1 need to know if hotel has a promo.

## Implementation Steps

1. [ ] Add `UsageMonthly` model to schema.prisma
   ```prisma
   model UsageMonthly {
     id              String   @id @default(uuid()) @db.Uuid
     hotel_id        String   @db.Uuid
     month           DateTime // First day of month
     imports         Int      @default(0)
     exports         Int      @default(0)
     playbook_views  Int      @default(0)
     active_users    Int      @default(0)
     last_rollup_at  DateTime?
     hotel           Hotel    @relation(fields: [hotel_id], references: [hotel_id], onDelete: Cascade)
     @@unique([hotel_id, month])
     @@map("usage_monthly")
   }
   ```

2. [ ] Add trial fields to Subscription
   ```prisma
   trial_ends_at         DateTime?
   trial_bonus_granted   Boolean   @default(false)
   ```

3. [ ] Add active_promo_code_id to Hotel
   ```prisma
   active_promo_code_id  String?   @db.Uuid
   ```

4. [ ] Add `session_id` to ProductEvent
   ```prisma
   session_id  String?
   @@index([hotel_id, event_type, session_id])  // dedup index
   ```

5. [ ] Add Hotel relation to UsageMonthly

6. [ ] Migration strategy:
   - **Dev**: `npx prisma db push` (fast iteration)
   - **Staging/Prod**: `npx prisma migrate dev` → `npx prisma migrate deploy` (tracked migration files)

7. [ ] Run `npx prisma generate` to update client
8. [ ] Verify in Supabase dashboard

## NOT in this migration
- ❌ Reseller, ResellerAttribution, ResellerContract (→ S2)
- ❌ PromoCode, PromoRedemption (→ S2)
- ❌ CommissionLedger, Payout (→ S3)

## Files to Modify
- `prisma/schema.prisma` — Add UsageMonthly + modify Hotel, Subscription

## Test Criteria
- [ ] Migration succeeds (db push for dev)
- [ ] `npx tsc --noEmit` passes
- [ ] `usage_monthly` table visible in Supabase
- [ ] Subscription has trial fields
- [ ] Hotel has active_promo_code_id
- [ ] ProductEvent has session_id + index

---
Next Phase: [Phase 02 — Entitlements Service](./phase-02-entitlements.md)
