# 📋 SRS: Pricing Structure System

**Ngày tạo:** 2026-02-05  
**Version:** 1.0  
**Source:** https://github.com/4tkhospitality/pricing-structure-system

---

## 1. Tổng quan Hệ thống

### 1.1. Mục đích
Hệ thống **OTA Pricing Structure** giúp khách sạn:
1. **Quản lý giá gốc (NET)** - Giá khách sạn muốn nhận về sau commission
2. **Cấu hình OTA channels** - Commission và promotions của từng kênh (Agoda, Booking.com...)
3. **Tính toán giá bán (BAR)** - Tự động tính giá hiển thị trên OTA để đảm bảo thu về đúng NET

### 1.2. Luồng nghiệp vụ chính

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   KHÁCH SẠN muốn                 HỆ THỐNG tính                  │
│   nhận về NET                     giá BAR                       │
│                                                                  │
│   ┌─────────┐     ┌──────────────┐     ┌─────────┐             │
│   │  NET    │  →  │  Calculator  │  →  │   BAR   │             │
│   │ 1,000K  │     │  + Comm 20%  │     │ 1,600K  │             │
│   └─────────┘     │  + Promos    │     └─────────┘             │
│                   └──────────────┘                              │
│                                                                  │
│   Khách đặt trên OTA với giá 1,600K                             │
│   → OTA giữ commission 20% = 320K                               │
│   → Trừ khuyến mãi (nếu có)                                     │
│   → Khách sạn nhận về: 1,000K ✓                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Các Module chính

### 2.1. Tab "Hạng Phòng" (Room Types)

#### Mô tả
Quản lý danh sách hạng phòng của khách sạn với **giá NET** - giá khách sạn muốn nhận về.

#### Dữ liệu

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Tên hạng phòng (VD: Deluxe Ocean View) |
| `description` | String? | Mô tả |
| `basePrice` | Float | **Giá NET** (VD: 1,000,000 VND) |

#### Ví dụ

| Hạng phòng | Giá NET (VND) |
|------------|---------------|
| Superior | 800,000 |
| Deluxe | 1,200,000 |
| Suite | 2,500,000 |

#### Tính năng
- ✅ Thêm/Sửa/Xóa hạng phòng
- ✅ Nhập giá NET bằng input có thousands separator
- ✅ Hiển thị danh sách với pagination

---

### 2.2. Tab "Kênh OTA" (OTA Config)

#### Mô tả
Cấu hình **commission** và **promotions** cho từng kênh OTA.

#### Dữ liệu OTA Channel

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Tên kênh (Agoda, Booking.com, Expedia...) |
| `calcType` | Enum | Cách tính: `PROGRESSIVE` hoặc `ADDITIVE` |
| `defaultComm` | Float | Commission mặc định (%) |

#### Ví dụ cấu hình

| OTA | Commission | Calculation Mode |
|-----|------------|------------------|
| Agoda | 20% | Progressive |
| Booking.com | 18% | Progressive |
| Expedia | 15% | Additive |
| Traveloka | 15% | Progressive |
| Ctrip | 25% | Progressive |

---

## 3. Calculation Engine

### 3.1. Hai chế độ tính toán

#### 3.1.1. PROGRESSIVE Mode (Tính lũy tiến)

**Nguyên lý:** Mỗi khuyến mãi tính trên giá **đã giảm** của bước trước.

**Công thức:**
```
Giá sau discount = BAR × (1 - d₁) × (1 - d₂) × ... × (1 - dₙ)
                 = BAR × Π(1 - dᵢ)
```

**Ví dụ:** BAR = 1,000,000, có 2 promotions: 10% và 20%
```
Bước 1: 1,000,000 × (1 - 0.10) = 900,000
Bước 2:   900,000 × (1 - 0.20) = 720,000

Tổng giảm: 28% (không phải 30%)
```

#### 3.1.2. ADDITIVE Mode (Cộng dồn)

**Nguyên lý:** Tất cả khuyến mãi **cộng lại** rồi trừ một lần vào BAR.

**Công thức:**
```
Giá sau discount = BAR × (1 - Σdᵢ)
```

**Ví dụ:** BAR = 1,000,000, có 2 promotions: 10% và 20%
```
Tổng discount = 10% + 20% = 30%
Giá sau = 1,000,000 × (1 - 0.30) = 700,000
```

### 3.2. Tính ngược từ NET → BAR

**Bài toán:** Khách sạn muốn nhận về NET = 1,000,000. Tính BAR là bao nhiêu?

#### Progressive Mode:
```
BAR = NET / (1 - commission) / Π(1 - dᵢ)
```

#### Additive Mode:
```
BAR = NET / (1 - commission) / (1 - Σdᵢ)
```

### 3.3. Ví dụ chi tiết

**Input:**
- NET mong muốn: 1,000,000 VND
- Commission: 20%
- Promotions:
  - Early Bird: 10% (Progressive)
  - VIP Gold: 5% (Progressive)

**Calculation (Progressive):**
```
Step 1: Gross cần để đạt NET
        Gross = NET / (1 - comm) = 1,000,000 / 0.80 = 1,250,000

Step 2: BAR cần để đạt Gross sau promotions
        Multiplier = (1 - 0.10) × (1 - 0.05) = 0.90 × 0.95 = 0.855
        BAR = 1,250,000 / 0.855 = 1,461,988 ≈ 1,462,000

Verification:
        BAR = 1,462,000
        - Early Bird 10% = -146,200 → 1,315,800
        - VIP Gold 5%  =  -65,790 → 1,250,010
        - Commission 20% = -250,002 → 1,000,008 ✓ (≈ NET)
```

---

## 4. Agoda Promotion Catalog

### 4.1. Phân loại (3 Groups)

#### A) SEASONAL - Khuyến mãi theo mùa

| ID | Tên | Mô tả |
|----|-----|-------|
| `agoda-seasonal-double-day` | Double Day Sale | Chiến dịch ngày đôi (10/10, 11/11...) |
| `agoda-seasonal-payday` | Payday Sale | Khuyến mãi cuối tháng |
| `agoda-seasonal-night-owl` | Night Owl Sale | Đặt phòng đêm muộn |
| `agoda-seasonal-summer` | Summer Vibes | Chiến dịch mùa hè |
| `agoda-seasonal-abroad` | Deals Abroad | Ưu đãi thị trường nước ngoài |

> ⚠️ **Quy tắc:** Chỉ được chọn **1 Seasonal promotion** cùng lúc

#### B) ESSENTIAL - Khuyến mãi cơ bản

| ID | Tên | Mô tả |
|----|-----|-------|
| `agoda-essential-early-bird` | Early Bird | Đặt sớm (14+ ngày) |
| `agoda-essential-last-minute` | Last-Minute | Phút chót |
| `agoda-essential-long-stay` | Long Stay | Lưu trú dài ngày |
| `agoda-essential-occupancy` | Occupancy Promotion | Theo công suất phòng |
| `agoda-essential-customized` | Customized | Tùy chỉnh, có tùy chọn stacking |

> ⚠️ **Quy tắc:** Essential có thể stack với nhau, **TRỪ KHI** Customized có cờ `allowStackWithOtherEssential = false`

#### C) TARGETED - Khuyến mãi nhắm mục tiêu

| ID | Tên | SubCategory | Mô tả |
|----|-----|-------------|-------|
| `agoda-targeted-vip-silver` | VIP Silver | LOYALTY | Khách VIP Bạc |
| `agoda-targeted-vip-gold` | VIP Gold | LOYALTY | Khách VIP Vàng |
| `agoda-targeted-vip-platinum` | VIP Platinum | LOYALTY | Khách VIP Bạch Kim |
| `agoda-targeted-mobile` | Mobile Users | PLATFORM | App di động |
| `agoda-targeted-geo` | Country/Geo Target | GEOGRAPHY | Theo vùng lãnh thổ |
| `agoda-targeted-package` | Package / Bundle | PRODUCT | Mua kèm gói dịch vụ |
| `agoda-targeted-beds` | Beds Network | BEDS_NETWORK | Liên minh |

> ⚠️ **Quy tắc:** Mỗi SubCategory chỉ được chọn **1 promotion**

---

## 5. Validation Rules

### 5.1. Quy tắc kiểm tra

```typescript
// 1. Seasonal: Max 1
if (seasonalCount > 1) {
    error("Chỉ được chọn 1 chiến dịch Seasonal");
}

// 2. Targeted: Max 1 per subCategory
if (sameSubCategoryCount > 1) {
    error("Targeted cùng nhóm không stack với nhau");
}

// 3. Total discount <= 80%
if (totalAdditive > 80) {
    error("Tổng giảm giá không được vượt quá 80%");
}

// 4. Commission < 100%
if (commission >= 100) {
    error("Hoa hồng phải nhỏ hơn 100%");
}
```

### 5.2. Validation Output

```typescript
interface ValidationResult {
    isValid: boolean;
    errors: string[];   // Lỗi nghiêm trọng, không cho tính
    warnings: string[]; // Cảnh báo, vẫn cho tính
}
```

---

## 6. Tab "Tổng quan" (Overview)

### 6.1. Mô tả
Bảng tổng hợp hiển thị giá BAR cho **tất cả hạng phòng** trên **tất cả kênh OTA**.

### 6.2. Ma trận giá

| Hạng phòng | NET | Agoda (20%) | Booking (18%) | Expedia (15%) |
|------------|-----|-------------|---------------|---------------|
| Superior | 800K | 1,170K | 1,110K | 1,060K |
| Deluxe | 1,200K | 1,755K | 1,665K | 1,590K |
| Suite | 2,500K | 3,656K | 3,469K | 3,313K |

### 6.3. Tính năng
- ✅ Hiển thị ma trận giá Room Type × OTA Channel
- ✅ Export Excel
- ✅ Color-coded: Giá cao = đỏ, giá thấp = xanh

---

## 7. Data Management

### 7.1. CRUD Operations

| Entity | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| RoomType | ✅ | ✅ | ✅ PATCH | ✅ |
| OTAChannel | ✅ | ✅ | ✅ PATCH | ✅ |
| CampaignInstance | ✅ | ✅ | ✅ PATCH | ✅ |
| RatePlan | ✅ | ✅ | ✅ PATCH | ✅ |

### 7.2. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/room-types` | List/Create hạng phòng |
| PATCH/DELETE | `/api/room-types/[id]` | Update/Delete hạng phòng |
| GET/POST | `/api/ota-channels` | List/Create OTA channel |
| PATCH/DELETE | `/api/ota-channels/[id]` | Update/Delete OTA channel |
| GET/POST | `/api/campaigns` | List/Create campaigns |
| PATCH/DELETE | `/api/campaigns/[id]` | Update/Delete campaign |

---

## 8. UI Components

### 8.1. Danh sách Components

| Component | Description |
|-----------|-------------|
| `RoomTypesTab.tsx` | Tab quản lý hạng phòng |
| `OTAConfigTab.tsx` | Tab cấu hình OTA + promotions |
| `OverviewTab.tsx` | Tab tổng hợp ma trận giá |
| `TabContainer.tsx` | Container chứa 3 tabs |
| `DataManagementModal.tsx` | Modal CRUD data |
| `AgodaPricingTab.tsx` | Tab riêng cho Agoda |
| `AgodaPromotionPanel.tsx` | Panel chọn promotions |
| `AgodaTracePanel.tsx` | Panel hiển thị chi tiết tính toán |
| `PromotionPickerModal.tsx` | Modal chọn promotion từ catalog |
| `PromotionRow.tsx` | Row hiển thị 1 promotion |

---

## 9. Đánh giá Tính năng

### 9.1. Tính năng PHÙ HỢP cho RMS

| Tính năng | Lý do phù hợp |
|-----------|---------------|
| ✅ Room Types với giá NET | Bổ sung cho pricing engine hiện tại |
| ✅ OTA Channel config | Quản lý commission từng kênh |
| ✅ Calculation Engine | Logic tính toán chính xác |
| ✅ Overview Matrix | Nhìn tổng quan giá các kênh |
| ✅ Agoda Promotions | Catalog đầy đủ promotions Agoda |

### 9.2. Tính năng CẦN CÂN NHẮC

| Tính năng | Câu hỏi |
|-----------|---------|
| ❓ Rate Plans | RMS đã có pricing ladder - có cần thêm? |
| ❓ PricingSheet history | Có cần lưu lịch sử pricing? |
| ❓ Multi-hotel | Pricing Structure chưa có multi-tenant - cần thêm hotel_id |

### 9.3. Tính năng THIẾU (cần bổ sung)

| Tính năng | Mô tả |
|-----------|-------|
| ⚠️ Booking.com Promotions | Chưa có catalog cho Booking.com |
| ⚠️ Expedia Promotions | Chưa có catalog cho Expedia |
| ⚠️ Date-based pricing | Giá theo ngày (weekday/weekend, mùa) |
| ⚠️ Inventory-based pricing | Giá theo số phòng còn trống |

---

## 10. Câu hỏi cho User

### 10.1. Về Calculation Mode
```
❓ Agoda của anh đang dùng Progressive hay Additive?
   - Progressive: KM tính lũy tiến (phổ biến hơn)
   - Additive: KM cộng dồn rồi trừ 1 lần
```

### 10.2. Về Promotions
```
❓ Anh có đang dùng các loại promotion nào?
   - Seasonal (Double Day, Payday...)?
   - Essential (Early Bird, Last Minute...)?
   - Targeted (VIP, Mobile, Geo...)?
```

### 10.3. Về Multi-hotel
```
❓ Pricing có khác nhau giữa các hotel không?
   - Cần quản lý riêng từng hotel?
   - Hay dùng chung 1 bộ cấu hình?
```

### 10.4. Về Rate Plans
```
❓ RMS đã có pricing ladder (BAR, Non-Ref...).
   Có cần thêm Rate Plans từ Pricing Structure không?
   - Có: Merge thêm RatePlan model
   - Không: Bỏ qua, dùng ladder hiện tại
```

---

## 11. Sơ đồ Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    PRICING MODULE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Room Types  │  │ OTA Config  │  │  Overview   │        │
│  │    Tab      │  │    Tab      │  │    Tab      │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │
│         └────────────────┼────────────────┘                │
│                          │                                  │
│                 ┌────────▼────────┐                        │
│                 │  Calc Engine    │                        │
│                 │  - Progressive  │                        │
│                 │  - Additive     │                        │
│                 └────────┬────────┘                        │
│                          │                                  │
│         ┌────────────────┼────────────────┐                │
│         │                │                │                │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐        │
│  │   Agoda     │  │  Booking    │  │  Expedia    │        │
│  │  Validator  │  │  (TODO)     │  │  (TODO)     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     DATABASE                                │
│  RoomType | OTAChannel | CampaignInstance | PricingSetting │
└─────────────────────────────────────────────────────────────┘
```

