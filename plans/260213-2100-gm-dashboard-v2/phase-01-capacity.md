# Phase 01: P0 Capacity Audit + Performance Indexes
Status: ⬜ Pending
Dependencies: None

## Objective
Đảm bảo `hotel.capacity` là single source of truth cho mọi KPI. Thêm indexes cho Phase A queries.

## Tasks

### 1. Capacity Audit
- [ ] Query DB: `SELECT hotel_id, name, capacity FROM hotels` → xác nhận capacity đúng
- [ ] Audit tất cả nơi dùng capacity trong code:
  - `dashboard/page.tsx` → `hotel.capacity` ✅ (đã đúng)
  - `KpiCards.tsx` → nhận `hotelCapacity` prop ✅
  - `RecommendationTable` → `remaining = hotelCapacity - rooms_otb` ✅
- [ ] Fix nếu có mismatch (update DB record nếu cần)

### 2. Performance Indexes
- [ ] Thêm indexes cho Phase A queries (nếu chưa có):
  ```sql
  -- Index cho Top Accounts (P2)
  CREATE INDEX IF NOT EXISTS idx_res_raw_account
    ON reservations_raw (hotel_id, account_name_norm, arrival_date);

  -- Index cho Room/LOS Mix (P4) — dùng room_code (raw, vì GROUP BY dùng raw)
  CREATE INDEX IF NOT EXISTS idx_res_raw_roomcode
    ON reservations_raw (hotel_id, room_code, arrival_date);

  -- Index cho Lead-time (P5)
  CREATE INDEX IF NOT EXISTS idx_res_raw_booktime
    ON reservations_raw (hotel_id, book_time, arrival_date);
  ```

> **Chốt:** Index dùng `room_code` (raw) vì UI GROUP BY room_code.
> `account_name_norm` đã là normalized field → index đúng.
> Existing: `idx_res_raw_segment` (hotel_id, segment, arrival_date) — đã có.

## Files to Modify
- `prisma/schema.prisma` — add @@index declarations
- DB migration via `prisma db push`

## Acceptance
- [ ] Mọi nơi hiển thị capacity = 1 giá trị từ `hotel.capacity`
- [ ] 3 indexes tồn tại trong DB
- [ ] `EXPLAIN ANALYZE` cho sample queries chạy < 100ms

---
Next Phase: [phase-02-api.md](./phase-02-api.md)
