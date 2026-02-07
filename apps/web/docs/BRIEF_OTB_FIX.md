# 💡 BRIEF: Repair Critical OTB Bugs (Double-Count & Missed Cancels)

**Ngày tạo:** 2026-02-07
**Context:** Fix critical logic flaws identified in Audit.

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT
Hệ thống OTB hiện tại đếm sai doanh thu và công suất phòng do 2 lỗi nghiêm trọng:
1.  **Double-Counting**: Một booking (`reservation_id`) xuất hiện trong nhiều bản import (snapshot hàng ngày) được cộng dồn thay vì lấy bản mới nhất.
2.  **Ghost Bookings**: Booking đã hủy (`status=cancelled`) nhưng import thiếu `cancel_date` hoặc không map sang `cancel_time`, dẫn đến việc hệ thống coi là vẫn active.

## 2. GIẢI PHÁP ĐỀ XUẤT

### A. Deduplication Strategy (Canonical View)
Thay vì sửa code JavaScrip (dễ tràn RAM), dùng **Raw SQL** trong `buildDailyOTB.ts` hoặc View:
- **Rule**: `DISTINCT ON (reservation_id, hotel_id) ORDER BY job.created_at DESC`.
- **Logic**: Chỉ lấy bản ghi mới nhất của booking đó tính đến thời điểm `asOfTs`.

### B. Strict Cancellation Handling
Sửa `ingestCSV.ts`:
- **Strict Validation**: Nếu `status == 'cancelled'` mà thiếu `cancel_date` -> **REJECT ROW** (hoặc Job). Không cho phép dữ liệu rác vào hệ thống.
- **Map Field**: Bắt buộc map `cancel_date` (CSV) sang `cancel_time` (DB Timestamp) để `buildDailyOTB` query được.
    - Quy ước: `cancel_time = cancel_date` @ 00:00:00 UTC (đầu ngày).

## 3. TÍNH NĂNG & THAY ĐỔI (Scope)

### 🚀 MVP Fix (Bắt buộc):
- [ ] **DB Migration**: Thêm index cho `reservation_id`, `job.created_at` để query nhanh.
- [ ] **Code Fix (`ingestCSV`)**:
    - Reject row cancelled thiếu date.
    - Populate `cancel_time`.
- [ ] **Code Fix (`buildDailyOTB`)**:
    - Chuyển từ `prisma.findMany` sang `prisma.$queryRaw` với `DISTINCT ON`.
    - Update query `WHERE` để support dedupe.

### 🎁 Nice-to-have (Làm sau):
- [ ] UI cảnh báo khi import file có row bị reject.
- [ ] Cơ chế "Merge" thông minh hơn (chỉ update field thay đổi).

## 4. ƯỚC TÍNH SƠ BỘ
- **Độ phức tạp**: Trung bình (cần viết Raw SQL cẩn thận).
- **Rủi ro**:
    - Query Raw có thể lệch type với Prisma Client -> cần type casting kỹ.
    - Cần reset toàn bộ data cũ (`rebuildAllOTB`) sau khi deploy fix.

## 5. BƯỚC TIẾP THEO
→ Chạy `/plan` để lên checklist sửa lỗi chi tiết.
