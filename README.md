# Revenue Management System (RMS) - V01 MVP

Hệ thống RMS lõi, tập trung tạo Magic Moment sớm và hỗ trợ ra quyết định nhanh cho GM/RM.

## Status: ✅ V01 Deployed (Vercel + Supabase)

V01 MVP đã code xong và deploy lên Vercel. Đang trong giai đoạn review & hardening.

## Tech Stack
- **Frontend**: Next.js 16.1, React 19, TailwindCSS
- **Backend**: Next.js Server Actions, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Auth**: NextAuth.js v5 (Google OAuth)
- **Hosting**: Vercel

## Scope Lock (V01)
- ✅ PMS-agnostic CSV Import (with idempotency via file hash)
- ✅ Daily OTB Time-Travel (snapshot-based)
- ✅ RMS Feature Engine (Pickup/Pace)
- ✅ Forecast Remaining Demand (Heuristic V01)
- ✅ BAR/NET Pricing Calculator (Progressive + Additive)
- ✅ Rate Shopper (SerpApi integration)
- ✅ Multi-tenant RBAC (Viewer/Manager/Admin/Super Admin)
- ✅ Recommendation Dashboard
- ❌ No PMS 2-way sync, No Channel Manager, No Automated Rate Push

## Documentation
- [Review Pack (System Overview)](apps/web/docs/REVIEW_PACK.md)
- [📦 Intake Pack (Full Technical Review)](apps/web/docs/INTAKE_PACK.md)
- [Detailed Specs](apps/web/docs/specs/)
- [Audit Report](apps/web/docs/reports/audit_2026-02-07.md)

## Quick Start
```bash
cd apps/web
npm install
# Configure .env (DATABASE_URL, AUTH_SECRET, GOOGLE_CLIENT_ID/SECRET)
npx prisma migrate deploy
npm run dev
```
