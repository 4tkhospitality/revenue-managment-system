# Plan: Dynamic Pricing by OCC (Giá Linh Hoạt theo Occupancy) — Rev.4
Created: 2026-02-12 13:30
Updated: 2026-02-12 14:33
Status: 🟡 In Progress

## Overview
Thêm tab thứ 6 "📈 Giá Linh Hoạt" vào OTA Pricing module, cho phép khách sạn cấu hình giá NET theo mùa (Season) và tự động nhân hệ số giá theo tỷ lệ lấp đầy (OCC%).

**Logic cốt lõi:**
```
NET_effective = NET_base(season, roomType) × OCC_multiplier(tier)
→ BAR = calcBarFromNet(NET_effective, commission, discounts)
→ Display = BAR × (1 - totalDiscount/100)
```

## Architecture Rule (LOCKED)
> All pricing math & promotion resolution must be executed server-side in
> `lib/pricing/engine.ts` (pure) or `lib/pricing/service.ts` (DB-aware).
> Frontend must NOT compute discounts, resolve conflicts, or calculate BAR/NET/Display.
> Đổi thuật toán = sửa engine + tests → UI routes không đổi.

## Decisions (đã chốt)
- ✅ Option A: Tab mới (core) → Option C (dashboard snippet) → Option B (embed) sau
- ✅ Season data: Manual config + Template import
- ✅ OCC tiers: Default 4 tiers, user-configurable (min 3, max 6)
- ✅ OCC tier boundaries: DB lưu 0–1 decimal (0.35, 0.65...), UI hiển thị %
- ✅ CSV key: `room_type_id` (stable), kèm `room_type_name` cho readability
- ✅ Guardrail warning: so với `hotel.min_rate` / `hotel.max_rate`, KHÔNG vs `net_price`
- ✅ Phase 00 refactor trước Phase 03/04 → single source-of-truth

## Tech Stack
- Frontend: React component (DynamicPricingTab.tsx)
- Backend: Next.js API routes
- Database: PostgreSQL (Prisma) — new models: SeasonConfig, SeasonNetRate, OccTierConfig
- Engine: `lib/pricing/engine.ts` + NEW `lib/pricing/service.ts`

## Phases

| Phase | Name | Status | Dependencies | Progress |
|-------|------|--------|-------------|----------|
| 00 | Engine/Service Refactor | 🟡 Core Done | None | 70% |
| 01 | Database Schema | ✅ Complete | None | 100% |
| 02 | Backend CRUD API | ✅ Complete | Phase 01 | 100% |
| 03 | Frontend UI | ⬜ Pending | Phase 00 + 02 | 0% |
| 04 | Integration & Polish | ⬜ Pending | Phase 00 + 03 | 0% |
| 05 | Testing | ⬜ Pending | Phase 04 | 0% |

> **Phase 00, 01, 02 can run in parallel.** Phase 03/04 blocked on Phase 00.

## Quick Commands
- Start Phase 0: `/code phase-00`
- Start Phase 1: `/code phase-01`
- Check progress: `/next`
- Save context: `/save-brain`
