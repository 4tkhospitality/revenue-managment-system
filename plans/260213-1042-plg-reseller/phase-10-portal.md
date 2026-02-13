# Phase 10: Reseller Portal
Status: ⬜ Pending
Sprint: S3
Dependencies: Phase 07, 08, 09

## Objective
Self-service portal for resellers (thầy OTA). They can view their attributed hotels, track commissions, generate promo codes, and download statements. Reduces admin overhead and prevents disputes.

## Portal Pages

### 10.1 Dashboard
- Total hotels attributed
- This month commission (pending/approved/paid)
- Quick stats: active hotels, churned, new this month

### 10.2 Hotels List
- Table: hotel name, plan, status, attributed date, method
- Filter: active / churned / all
- Search by hotel name

### 10.3 Commission Statement
- Monthly breakdown: gross invoices → commission → status
- Line items per hotel per invoice
- Export CSV/PDF

### 10.4 Promo Code Management
- List reseller's own codes (from assigned templates)
- Create new code (from available templates)
- View redemption count per code
- Deactivate own codes

## Implementation Steps

1. [ ] Create reseller auth flow
   - **Magic link login** (no password management)
   - Implementation: **custom token table** (NOT NextAuth provider)
     ```prisma
     model ResellerSession {
       id          String   @id @default(uuid()) @db.Uuid
       reseller_id String   @db.Uuid
       token       String   @unique  // magic link token (one-time)
       expires_at  DateTime
       created_at  DateTime @default(now())
       reseller    Reseller @relation(fields: [reseller_id], references: [id])
       @@map("reseller_sessions")
     }
     ```
   - Flow: admin creates reseller → reseller gets email with magic link → link validates token → sets `reseller_session` HTTP-only cookie
   - Cookie contains signed JWT with `{ reseller_id, exp }`
   - Why NOT NextAuth: reseller auth is completely separate from hotel user auth; mixing them adds complexity
   - `lib/reseller/reseller-auth.ts` handles: `sendMagicLink()`, `validateToken()`, `getResellerFromCookie()`

2. [ ] Create portal layout
   - `app/reseller/layout.tsx` — portal shell with sidebar
   - Protected by reseller auth middleware

3. [ ] Create portal pages
   - `app/reseller/dashboard/page.tsx` — overview stats
   - `app/reseller/hotels/page.tsx` — attributed hotels
   - `app/reseller/commissions/page.tsx` — monthly statements
   - `app/reseller/promo-codes/page.tsx` — code management

4. [ ] Create portal API routes
   - `GET /api/reseller/dashboard` — stats
   - `GET /api/reseller/hotels` — attributed hotels
   - `GET /api/reseller/commissions` — commission entries
   - `GET /api/reseller/commissions/export` — CSV/PDF
   - `GET /api/reseller/promo-codes` — own codes
   - `POST /api/reseller/promo-codes` — create from template

5. [ ] Reseller auth middleware
   - Validate reseller session
   - Inject reseller_id into request

## Files to Create
- `app/reseller/layout.tsx`
- `app/reseller/dashboard/page.tsx`
- `app/reseller/hotels/page.tsx`
- `app/reseller/commissions/page.tsx`
- `app/reseller/promo-codes/page.tsx`
- `app/api/reseller/dashboard/route.ts`
- `app/api/reseller/hotels/route.ts`
- `app/api/reseller/commissions/route.ts`
- `app/api/reseller/commissions/export/route.ts`
- `app/api/reseller/promo-codes/route.ts`
- `lib/reseller/reseller-auth.ts` — magic link + cookie auth

## Test Criteria
- [ ] Reseller can login via magic link
- [ ] Dashboard shows correct stats
- [ ] Hotels list shows only attributed hotels
- [ ] Commission statement matches ledger data
- [ ] CSV export downloads correctly
- [ ] Reseller can only see their own data (no cross-reseller leaks)

---
Next Phase: [Phase 11 — Payout + Audit](./phase-11-payout.md)
