# Plan: Room Band Pricing (Tier × Size) — V3.1 (Organization Model)
Created: 2026-02-14
Updated: 2026-02-14 21:30 — GO conditions locked
Status: 🟡 Planning Complete → Ready to Code
BRIEF: [BRIEF-room-band-pricing.md](file:///c:/Apps/Antigravity/revenue-management-system/docs/BRIEF-room-band-pricing.md)

## Overview

Thêm chiều "room band" (R30/R80/R150/R300P) vào hệ thống subscription + Organization tenant model cho multi-hotel. Giá & quota scale theo band. Feature gating giữ nguyên theo tier. Subscription thuộc Organization (không phải Hotel).

## Kiến trúc Mới (3 Lớp)

```
Organization (tenant)
├── Subscription (plan + room_band + quotas)
├── Hotels[]     (capacity → KPI, derived band → compliance)
└── Members[]    (user ↔ org, has org_role)
      └── HotelUser[] (user ↔ hotel, has hotel_role — existing table)
```

## ✅ GO Conditions (all locked in specs)

| Condition | Status | Where |
|---|---|---|
| DB: `gen_random_uuid()` available | ✅ pgcrypto preflight | [phase-01](file:///c:/Apps/Antigravity/revenue-management-system/.brain/plans/260214-2100-room-band-pricing/phase-01-db-migration.md) |
| DB: Script idempotent (safe rerun) | ✅ `WHERE org_id IS NULL` guards | [phase-01](file:///c:/Apps/Antigravity/revenue-management-system/.brain/plans/260214-2100-room-band-pricing/phase-01-db-migration.md) |
| DB: org_id NOT NULL enforced post-migration | ✅ Phase 01b separate migration | [phase-01](file:///c:/Apps/Antigravity/revenue-management-system/.brain/plans/260214-2100-room-band-pricing/phase-01-db-migration.md) |
| Auth: ALL routes use `canAccessHotel()` | ✅ 6 entry points listed | [phase-02](file:///c:/Apps/Antigravity/revenue-management-system/.brain/plans/260214-2100-room-band-pricing/phase-02-backend-logic.md) |
| Seats: count OrgMembers, not HotelUsers | ✅ Counting note added | [phase-04c](file:///c:/Apps/Antigravity/revenue-management-system/.brain/plans/260214-2100-room-band-pricing/phase-04c-user-management.md) |

## Quyết định Kiến trúc

| Quyết định | Chọn | Lý do |
|---|---|---|
| Multi-Hotel model | **Cách 2 (Organization)** | Đúng mô hình SaaS, quota "Properties" enforcement đúng, không nợ kiến trúc |
| Subscription ownership | `Subscription.org_id` (thay vì hotel_id) | 1 org = 1 subscription, N hotels |
| Hotel permission | Giữ `HotelUser` + Suite guard Rule 2 | Không refactor RBAC, Suite OrgMember access all hotels |
| API compatibility | Server resolve `hotelId → orgId` | Giảm breaking change phía client |
| Seat counter | Giữ **hard block**, count **OrgMembers** | Chính xác cho multi-hotel |
| Config source of truth | **plan-config.ts** | `tierConfig.ts` chỉ 2 file import |

## Phases

| Phase | Name | Status | Est. | Scope |
|-------|------|--------|------|-------|
| 01 | DB Migration | ⬜ | 25m | RoomBand + Organization + data migration + Phase 01b NOT NULL |
| 02 | Backend Logic | ⬜ | 35m | getScaledLimits + entitlements via org + Suite access guard |
| 03 | API Updates | ⬜ | 20m | Subscription resolve hotel→org + compliance + /api/organization |
| 04a | FE — Pricing Page | ⬜ | 20m | Replace PRICE_MATRIX → getPrice() |
| 04b | FE — Hotel Settings | ⬜ | 25m | Badge, capacity, compliance panel, quota bars + org context |
| 04c | FE — User Management | ⬜ | 15m | Org members (count OrgMembers), seat counter, helper text |
| 05 | Compliance Checks | ⬜ | 20m | Banners + STANDARD guard |
| 06 | Harmonize Config | ⬜ | 10m | Replace 2 tierConfig imports |
| 07 | Testing | ⬜ | 20m | Build + API + UI + org multi-hotel regression |

**Tổng:** ~3h 10min

## Dependencies

```
Phase 01 (DB: RoomBand + Organization)
  ├→ Phase 01b (Enforce NOT NULL)
  └→ Phase 02 (Backend: entitlements via org + Suite guard)
       └→ Phase 03 (API: resolve hotel→org)
            ├→ Phase 04a (Pricing Page)
            ├→ Phase 04b (Hotel Settings + org context)
            ├→ Phase 04c (User/Org Members)
            └→ Phase 05 (Compliance)
Phase 06 (Harmonize) — independent
Phase 07 (Testing) — after all
```

## Migration Strategy (ít breaking change)

1. ⚡ Preflight: ensure pgcrypto + backup
2. Schema migration: create Organization + OrgMember + RoomBand + FK changes
3. Data migration: hotel_org_map temp table (deterministic via hotel_id)
4. Verify: 0 orphan hotels, 0 orphan subs
5. Phase 01b: enforce org_id NOT NULL
6. Server resolves `hotelId → org_id` internally → client code ít đổi

## Quick Commands
- Start Phase 1: `/code phase-01`
- Check progress: `/next`
