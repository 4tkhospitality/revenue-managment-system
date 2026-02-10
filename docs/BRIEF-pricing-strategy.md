# 💰 BRIEF: Chiến Lược Định Giá RMS — Freemium × Số Phòng (Final v4)

**Ngày tạo:** 2026-02-10  
**Cập nhật:** 2026-02-10 (v4 — Final Matrix & Reseller Logic)  
**Brainstorm cùng:** 4TK Hospitality

---

## 1. MÔ HÌNH ĐỊNH GIÁ

### Feature tiers × Room bands = Pricing Matrix

**Anchor:** Superior ≤30 phòng = **990.000₫/tháng**

```
              ≤30P        31-80P       81-150P      151-300P
           ┌──────────┬──────────┬──────────┬──────────┐
Tiêu Chuẩn │   FREE   │   FREE   │   FREE   │   FREE   │
           ├──────────┼──────────┼──────────┼──────────┤
Superior   │   990K   │  1.490K  │  1.990K  │  2.490K  │
           ├──────────┼──────────┼──────────┼──────────┤
Deluxe     │  1.990K  │  2.990K  │  3.990K  │  4.990K  │
           ├──────────┼──────────┼──────────┼──────────┤
Suite      │  3.490K  │  4.990K  │  6.990K  │  8.990K  │
           └──────────┴──────────┴──────────┴──────────┘
                                              * VND/tháng
```

---

## 2. BẢNG GIÁ CHI TIẾT

### 2.1 Pricing Matrix & So Sánh

#### 🏠 Tiêu Chuẩn — MIỄN PHÍ

| | ≤ 30P | 31-80P | 81-150P | 151-300P |
|--|:---:|:---:|:---:|:---:|
| **Giá/tháng** | **FREE** | **FREE** | **FREE** | **FREE** |

**Bao gồm:** Tính giá OTA cơ bản (NET→BAR, 5 OTAs), 1 user, 1 KS

---

#### 🌿 Superior (Tối ưu OTA)

| | ≤ 30P | 31-80P | 81-150P | 151-300P |
|--|:---:|:---:|:---:|:---:|
| **Giá/tháng** | **990K** | **1.490K** | **1.990K** | **2.490K** |
| **Giá/năm** (−15%) | 840K/th | 1.265K/th | 1.690K/th | 2.115K/th |
| Giá/phòng/th | ~33K | ~19-27K | ~13-24K | ~8-16K |

**Bao gồm:** Full Tính giá OTA + **Full Tối ưu OTA (6 tools)** + 2 users

---

#### 🌟 Deluxe (Analytics & Data)

| | ≤ 30P | 31-80P | 81-150P | 151-300P |
|--|:---:|:---:|:---:|:---:|
| **Giá/tháng** | **1.990K** | **2.990K** | **3.990K** | **4.990K** |
| **Giá/năm** (−15%) | 1.690K/th | 2.540K/th | 3.390K/th | 4.240K/th |
| Giá/phòng/th | ~66K | ~37-58K | ~27-49K | ~16-33K |

**Bao gồm:** Mọi thứ Superior + **Dashboard, Analytics, Upload, Daily Actions, PDF**, 3 users

---

#### 👑 Suite (Enterprise)

| | ≤ 30P | 31-80P | 81-150P | 151-300P |
|--|:---:|:---:|:---:|:---:|
| **Giá/tháng** | **3.490K** | **4.990K** | **6.990K** | **8.990K** |
| **Giá/năm** (−15%) | 2.965K/th | 4.240K/th | 5.940K/th | 7.640K/th |
| Giá/phòng/th | ~116K | ~62-96K | ~46-86K | ~30-60K |

**Bao gồm:** Mọi thứ Deluxe + **Multi-hotel, Unlimited Users, RBAC, Hotline**

---

## 3. PHÂN TÍCH RESELLER & KHUYẾN MÃI

### 3.1 Kịch bản: Reseller (30%) + KH Prepay 3 tháng (-50%)

Đây là kịch bản "xấu nhất" về margin cho 4TK, nhưng tốt nhất để grab market.

**Ví dụ: Gói Superior ≤30P (List price: 990K)**
1.  **Khách hàng trả:** 990K × 3 tháng × 50% = **1.485.000₫** (Tương đương 495K/tháng)
2.  **Reseller nhận:** 1.485.000₫ × 30% = **445.500₫**
3.  **4TK nhận:** 1.485.000₫ − 445.500₫ = **1.039.500₫** (Tương đương 346.5K/tháng)

**Kết luận:**
- 4TK vẫn thu về **35% giá niêm yết** (~346K/tháng) → Vẫn dương margin (cost server ~10K)
- Reseller kiếm **~5.5M/tháng** nếu bán được 10 KS (mix gói) → Động lực cao
- KH mua được RMS với giá **chỉ bằng 50% PMS cơ bản** → Dễ chốt sale

### 3.2 Roadmap Khuyến Mãi

| Giai đoạn | Chương trình | 4TK thực nhận (sau Reseller) | Mục tiêu |
|-----------|--------------|------------------------------|----------|
| **Launch (0-6 tháng)** | **Giảm 50% khi thanh toán 3 tháng** | **35%** | **Land Grab**: Chiếm thị phần tối đa, chấp nhận margin thấp |
| **Growth (6-12 tháng)** | **Giảm 30% khi thanh toán 6 tháng** | **49%** | **Balance**: Bắt đầu tối ưu revenue |
| **Stable (12+ tháng)** | **Giảm 15% khi thanh toán 1 năm** | **59.5%** | **Profit**: Mô hình bền vững |

---

## 4. IMPLEMENTATION PLAN

### 4.1 Database Updates

```sql
ALTER TABLE "Hotel" ADD COLUMN "roomCount" INTEGER DEFAULT 30;
ALTER TABLE "User" ADD COLUMN "subscriptionTier" TEXT DEFAULT 'standard'; -- standard, superior, deluxe, suite
```

### 4.2 Pricing Page UI (`/pricing`)

- **Header**: "Bảng giá phần mềm Quản lý Doanh thu 4TK"
- **Toggle**: "Thanh toán tháng" vs "Thanh toán 3 tháng (Tiết kiệm 50% 🔥)"
- **Room Count Selector**: Slider hoặc Tabs [≤30] [31-80] [81-150] [151-300]
- **Pricing Cards**: 4 cột (Tiêu chuẩn, Superior, Deluxe, Suite)
- **Feature Comparison Table**: Bảng chi tiết bên dưới

### 4.3 Call to Action (CTA)

- **Tiêu chuẩn**: "Dùng miễn phí ngay"
- **Superior/Deluxe/Suite**: "Dùng thử 14 ngày" hoặc "Liên hệ tư vấn" (đối với gói lớn)

---

## 5. BƯỚC TIẾP THEO

✅ **Đã chốt bảng giá & chính sách**
□ **Code Pricing Page** (`apps/web/app/pricing/page.tsx`)
□ **Cập nhật Content Landing Page**
□ **Triển khai Reseller Dashboard** (Future)
