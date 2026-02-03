# Phase 01: Foundation (Pivot to TS)
Status: 🟡 In Progress

## Objective
Chuyển đổi dự án sang Full-stack Next.js. Loại bỏ Python backend. Thiết lập Prisma ORM.

## Requirements
- [ ] **Cleanup**: Xóa/Archive folder `apps/api` (Python).
- [ ] **Setup Prisma**:
    - Install `prisma` & `@prisma/client`.
    - `npx prisma init`.
    - Port Schema từ `DESIGN.md` sang `schema.prisma`.
- [ ] **Config Monorepo**: Chỉ giữ `apps/web` (hoặc move code ra root nếu chỉ làm 1 app). -> Giữ `apps/web` là main app.
- [ ] **Environment**: Update `.env` kết nối DB.

## Implementation Steps
1. [ ] **Cleanup Python**
   - Xóa `apps/api`.
   - Update `docker-compose.yml` (chỉ chạy DB).

2. [ ] **Setup Prisma (in apps/web)**
   - `cd apps/web`
   - `npm install prisma --save-dev`
   - `npm install @prisma/client`
   - Defined `schema.prisma` với đầy đủ các bảng và quan hệ (UUID, HotelID).
   - `npx prisma migrate dev --name init_v01`

3. [ ] **Project Utils**
   - Setup `lib/prisma.ts` (Singleton).
   - Setup `lib/utils.ts` (Class names helper).

## Files to Create/Modify
- `apps/web/prisma/schema.prisma`
- `apps/web/lib/prisma.ts`
- `docker-compose.yml` (Update)

## Test Criteria
- [ ] `npx prisma studio` mở được DB và thấy các bảng.
- [ ] Connect từ Next.js page tới DB lấy data thành công.

---
Next Phase: [Phase 02](phase-02-data-pipeline.md)
