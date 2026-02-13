# Plan: GM Dashboard V2 — Phase A (Quick Wins)
Created: 2026-02-13
Status: 🟡 Ready to Start
Brief: [gm_dashboard_brief.md](file:///C:/Users/ngocp/.gemini/antigravity/brain/d7cae06b-8036-45f8-b231-020f387b3c96/gm_dashboard_brief.md)

## Overview
Nâng cấp Dashboard cho GM đọc trong 5 phút — thêm Top Accounts, Room/LOS Mix, Lead-time Buckets. Không đụng OTB pipeline.

## Tech Stack
- **Frontend:** React Server Components + Client Components (Recharts)
- **Backend:** Next.js API Routes (Server Actions)
- **Database:** PostgreSQL (Prisma) — query `reservations_raw` trực tiếp
- **Charts:** Recharts (đã có trong project)

## Phases

| Phase | Name | Status | Tasks |
|-------|------|--------|-------|
| 01 | P0: Capacity Audit + Indexes | ⬜ Pending | 4 |
| 02 | API: Analytics Endpoints | ⬜ Pending | 6 |
| 03 | UI: Dashboard Widgets | ⬜ Pending | 8 |
| 04 | Integration + Polish | ⬜ Pending | 5 |
| 05 | Testing & Verification | ⬜ Pending | 5 |

**Tổng:** ~28 tasks | Ước tính: ~8-10 ngày

## Quick Commands
- Start Phase 1: `/code phase-01`
- Check progress: `/next`
