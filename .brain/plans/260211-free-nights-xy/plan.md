# 📋 Plan: Free Nights X/Y Variable Input (BUG-2)

**Created:** 2026-02-11
**Status:** 🟡 Waiting for BA Review
**Priority:** Medium
**Module:** OTA Pricing → PromotionsTab

---

## 📌 Vấn đề

Free Nights Deal (`booking-free-nights`) hiện dùng **1 ô input % cố định** giống mọi promotion khác.

Thực tế Free Nights hoạt động theo model **"Stay X / Pay Y"** (VD: Stay 4 Pay 3).
% discount được tính tự động = `(1 - Y/X) × 100`.

**Hiện tại (sai):**
```
┌──────────────────────────────────────┐
│ Free Nights Deal            [25] %   │  ← User nhập % thủ công, dễ sai
└──────────────────────────────────────┘
```

**Mong muốn (đúng):**
```
┌──────────────────────────────────────────────────┐
│ Free Nights Deal      Stay [4] Pay [3]  → 25.0%  │  ← Hệ thống tự tính
└──────────────────────────────────────────────────┘
```

---

## ❓ Câu hỏi cho BA Team

### 1. Scope — OTA nào cần?
- **Booking.com** có `booking-free-nights` → chắc chắn cần
- **Agoda** có "Stay 3 Pay 2" tương tự không? Nếu có → thêm `agoda-free-nights` vào catalog
- **Expedia** có Free Nights model không?

### 2. Giá trị mặc định
- X = ? (Stay bao nhiêu đêm), Y = ? (Pay bao nhiêu đêm)
- Phổ biến nhất: **Stay 4 Pay 3** hay **Stay 3 Pay 2**?

### 3. Validation Rules
| Rule | Giá trị gợi ý | Confirm? |
|------|---------------|----------|
| X tối thiểu | 2 | |
| X tối đa | 14 (hay 7?) | |
| Y tối thiểu | 1 | |
| Y luôn < X | Bắt buộc | |
| Y ≥ 1 | Bắt buộc (không thể miễn phí hoàn toàn) | |

### 4. Hiển thị
- Khi user chọn X/Y, có cần hiện **ví dụ cụ thể** không?
  - VD: "Khách ở 4 đêm, trả 3 đêm → tiết kiệm 25%"
- Có cần warning nếu discount > 50% (VD: Stay 3 Pay 1 = 66%)?

---

## 🔧 Technical Plan (Sơ bộ)

### Files cần sửa
| File | Thay đổi |
|------|----------|
| `types.ts` | Thêm `freeNightsX?: number`, `freeNightsY?: number` vào Campaign interface |
| `catalog.ts` | Đánh dấu promo nào là `isFreeNights: true` |
| `PromotionsTab.tsx` | Render 2 ô X/Y thay vì ô % khi `isFreeNights = true` |
| `schema.prisma` | Thêm `free_nights_x`, `free_nights_y` vào `CampaignInstance` (optional) |
| DB Migration | `prisma db push` |

### Logic tính toán
```
discount_pct = (1 - Y / X) * 100

Ví dụ:
  Stay 4, Pay 3 → (1 - 3/4) * 100 = 25%
  Stay 3, Pay 2 → (1 - 2/3) * 100 = 33.3%
  Stay 7, Pay 5 → (1 - 5/7) * 100 = 28.6%
```

---

## ✅ Khi BA confirm, Dev sẽ:
1. Cập nhật plan này với câu trả lời
2. Code theo technical plan
3. Test + deploy

**BA vui lòng reply trực tiếp vào file này hoặc thông báo qua chat.**
