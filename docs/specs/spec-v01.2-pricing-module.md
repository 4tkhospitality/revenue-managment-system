# Spec V01.2: OTA Pricing Module

**Ngày tạo:** 2026-02-05  
**Version:** V01.9 (Implemented)
**Module URL:** `/pricing`  
**Status:** Implemented + Phase 03 Unified Pricing Complete

---

## 1. Mục tiêu

Thêm module **"💰 Tính giá OTA"** vào RMS để:
- Tính **BAR** (Best Available Rate) hiển thị trên OTA từ **NET** mong muốn
- Áp dụng **commission** + **promotions** (progressive/additive)
- Validation rules + Overview matrix + Export

### 1.1. Business Context
- **GM/Owner** cần biết: Giá thu về (NET), Giá hiển thị (BAR), Đang áp khuyến mãi nào
- **Không cần** mapping với Rate Plans/Pricing Ladder (scope V01.2)

### 1.2. Business Flow

```
User chọn Active Hotel (cookie rms_active_hotel)
    ↓
Cấu hình trong hotel:
    • room_types.net_price (NET theo hạng phòng)
    • ota_channels.commission, calc_type
    • campaigns per OTA
    ↓
Hệ thống trả về:
    • Price Matrix: RoomType × OTAChannel = BAR
```

---

## 2. Data Pipeline Extension

### Step 5b: OTA PRICING MATRIX (V01.2)

```
┌─────────────────────┐    ┌──────────────────────────┐
│ room_types + ota_*  │ →  │ ota_price_matrix (calc)  │
│ + campaigns         │    │ (on-demand / cached)     │
└─────────────────────┘    └──────────────────────────┘
```

**Nguyên tắc MVP:**
- Matrix tính **on-the-fly** qua API/Server Action (nhanh, ít table)
- Cache theo `asOfDate` (optional, cho export nhiều lần)

---

## 3. Application Structure

### 3.1. Routes

```
apps/web/app/
  pricing/
    page.tsx        # Main page với 4 tabs
    layout.tsx      # Layout với Sidebar
```

### 3.2. Components

```
apps/web/components/pricing/
  RoomTypesTab.tsx          # Tab quản lý hạng phòng
  OTAConfigTab.tsx          # Tab cấu hình OTA
  PromotionsTab.tsx         # Tab chọn promotions
  OverviewTab.tsx           # Tab tổng hợp matrix
  AgodaPromotionPanel.tsx   # Panel promotions Agoda
  AgodaTracePanel.tsx       # Panel debug trace
  PromotionPickerModal.tsx  # Modal chọn promotion từ catalog
```

### 3.3. Lib Functions

```
apps/web/lib/pricing/
  engine.ts           # calcBarFromNet(), calcDiscount()
  validators/
    common.ts         # Validation rules chung
    agoda.ts          # Agoda-specific validation
  catalog/
    agoda.ts          # Static seed catalog (V01.2)
```

---

## 4. Database Schema

### 4.1. New Tables

| Table | Description | Multi-tenant |
|-------|-------------|--------------|
| `room_types` | Hạng phòng + NET | Per-hotel |
| `ota_channels` | OTA commission + calc mode | Per-hotel |
| `promotion_catalog` | Danh mục promotion (seed) | Global |
| `campaign_instances` | Promotion được bật cho hotel/OTA | Per-hotel |
| `pricing_settings` | Rule cap/rounding/currency | Per-hotel |

### 4.2. Prisma Models

```prisma
// ============ ENUMS ============
enum CalcType {
  PROGRESSIVE
  ADDITIVE
}

enum PromotionGroup {
  SEASONAL
  ESSENTIAL
  TARGETED
}

// ============ ROOM TYPES ============
model RoomType {
  id          String   @id @default(cuid())
  hotel_id    String
  hotel       Hotel    @relation(fields: [hotel_id], references: [hotel_id])
  
  name        String
  description String?
  net_price   Float    // NET base price
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@index([hotel_id])
  @@unique([hotel_id, name])
}

// ============ OTA CHANNELS ============
model OTAChannel {
  id          String   @id @default(cuid())
  hotel_id    String
  hotel       Hotel    @relation(fields: [hotel_id], references: [hotel_id])

  name        String
  code        String   // "agoda" | "booking" | ...
  calc_type   CalcType @default(PROGRESSIVE)
  commission  Float    // % (0-100)
  is_active   Boolean  @default(true)

  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  campaigns   CampaignInstance[]

  @@index([hotel_id])
  @@unique([hotel_id, code])
}

// ============ PROMOTION CATALOG (Global) ============
model PromotionCatalog {
  id            String         @id // "agoda-essential-early-bird"
  vendor        String         // "agoda" | "booking" | ...
  name          String
  group_type    PromotionGroup
  sub_category  String?
  default_pct   Float?
  allow_stack   Boolean        @default(true)

  // Validation rules
  max_one_in_group       Boolean @default(false) // seasonal
  max_one_per_subcategory Boolean @default(false) // targeted

  instances     CampaignInstance[]

  @@index([vendor, group_type])
}

// ============ CAMPAIGN INSTANCES (Per-hotel) ============
model CampaignInstance {
  id             String   @id @default(cuid())
  hotel_id       String

  ota_channel_id String
  ota_channel    OTAChannel @relation(fields: [ota_channel_id], references: [id])

  promo_id       String
  promo          PromotionCatalog @relation(fields: [promo_id], references: [id])

  discount_pct   Float
  allow_stack    Boolean  @default(true)
  is_active      Boolean  @default(true)

  start_date     DateTime?
  end_date       DateTime?

  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt

  @@index([hotel_id, ota_channel_id])
  @@index([promo_id])
}

// ============ PRICING SETTINGS (Per-hotel) ============
model PricingSetting {
  id               String @id @default(cuid())
  hotel_id         String @unique
  hotel            Hotel  @relation(fields: [hotel_id], references: [hotel_id])

  currency         String @default("VND")
  rounding_rule    String @default("CEIL_1000") // CEIL_1000 | ROUND_100 | NONE
  max_discount_cap Float  @default(80)

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}
```

### 4.3. Indexes (SQL)

```sql
CREATE INDEX idx_campaign_hotel_channel ON campaign_instances(hotel_id, ota_channel_id, is_active);
CREATE INDEX idx_ota_hotel_code ON ota_channels(hotel_id, code);
```

---

## 5. Calculation Engine

### 5.1. Inputs

| Input | Source |
|-------|--------|
| NET | `room_types.net_price` |
| Commission | `ota_channels.commission` |
| Discounts[] | `campaign_instances` (active) |
| Calc Type | `ota_channels.calc_type` |

### 5.2. Formulas

**Progressive Mode:**
```
BAR = NET / (1 - commission) / Π(1 - dᵢ)
```

**Additive Mode:**
```
BAR = NET / (1 - commission) / (1 - Σdᵢ)
```

### 5.3. Example

```
NET = 1,000,000 VND
Commission = 20%
Promotions = [Early Bird 10%, VIP Gold 5%]
Mode = Progressive

Calculation:
  Gross = 1,000,000 / (1 - 0.20) = 1,250,000
  Multiplier = (1 - 0.10) × (1 - 0.05) = 0.855
  BAR = 1,250,000 / 0.855 = 1,461,988 ≈ 1,462,000
```

### 5.4. Validation Rules

```typescript
// 1. Seasonal: max 1
if (seasonalCount > 1) error("Chỉ được chọn 1 Seasonal")

// 2. Targeted: max 1 per sub_category
if (sameSubCategoryCount > 1) error("Targeted cùng nhóm không stack")

// 3. Total discount <= cap
if (totalDiscount > pricing_settings.max_discount_cap) 
  error("Tổng giảm giá vượt quá " + cap + "%")

// 4. Commission < 100
if (commission >= 100) error("Commission phải < 100%")
```

### 5.5. Output Types

```typescript
interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

interface CalcResult {
  bar: number
  net: number
  display: number                  // V01.9: BAR × (1 - totalDiscount%)
  commission: number
  totalDiscount: number
  totalDiscountEffective: number   // V01.9: Alias for API consumers
  calc_version: string             // V01.9: 'v3.0.0'
  breakdown: {                     // V01.9: Per-group detail
    group: string
    chosenPromotionId: string
    chosenPercent: number
    amountDelta: number
    stackRule: string
  }[]
  resolvedPromotions: {            // V01.9: Applied vs ignored
    applied: string[]
    ignored: { id: string; name: string; reason: string }[]
  }
  validation: ValidationResult
  trace: {
    step: string
    description: string            // V01.9: Added
    priceAfter: number
  }[]
}
```

---

## 6. API Endpoints

### 6.1. Room Types

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/pricing/room-types` | List room types |
| POST | `/api/pricing/room-types` | Create |
| PATCH | `/api/pricing/room-types/[id]` | Update |
| DELETE | `/api/pricing/room-types/[id]` | Delete |

### 6.2. OTA Channels

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/pricing/ota-channels` | List |
| POST | `/api/pricing/ota-channels` | Create |
| PATCH | `/api/pricing/ota-channels/[id]` | Update |
| DELETE | `/api/pricing/ota-channels/[id]` | Delete |

### 6.3. Campaigns

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/pricing/campaigns` | List campaigns |
| POST | `/api/pricing/campaigns` | Create |
| PATCH | `/api/pricing/campaigns/[id]` | Update |
| DELETE | `/api/pricing/campaigns/[id]` | Delete |

### 6.4. Calculate Matrix

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/pricing/calc-matrix` | Calculate full matrix |

**Response:**
```json
{
  "roomTypes": [
    { "id": "...", "name": "Deluxe", "net": 1200000 }
  ],
  "channels": [
    { "id": "...", "code": "agoda", "commission": 20 }
  ],
  "matrix": {
    "roomTypeId:channelId": {
      "bar": 1755000,
      "net": 1200000,
      "commission": 20,
      "totalDiscount": 15,
      "validation": { "isValid": true, "errors": [], "warnings": [] },
      "trace": [
        { "step": "Commission 20%", "priceAfter": 1500000 },
        { "step": "Early Bird 10%", "priceAfter": 1666667 }
      ]
    }
  }
}
```

---

## 7. Permission Matrix

| Page | super_admin | hotel_admin | manager | viewer |
|------|-------------|-------------|---------|--------|
| /pricing | ✅ | ✅ | ✅ (edit limited) | ✅ (view) |

**Edit Rules:**
- **hotel_admin:** Full CRUD room_types, channels, campaigns
- **manager:** CRUD campaigns + view room_types + view channels
- **viewer:** Read-only matrix + export

---

## 8. Module Features

### 8.1. Tab Room Types
- CRUD hạng phòng
- Nhập NET với thousand separator
- List với pagination

### 8.2. Tab OTA Config
- CRUD OTA channels
- Cấu hình commission, calc_type
- Bật/tắt channel

### 8.3. Tab Promotions
- Chọn promotions theo catalog (Agoda V01.2)
- Tạo campaign_instances per OTA
- Validation theo rules

### 8.4. Tab Overview Matrix
- Hiển thị RoomType × OTAChannel = BAR
- Color-coded (cao = đỏ, thấp = xanh)
- Export CSV/Excel

---

## 9. UI/UX

Áp dụng theme RMS:

```css
/* Container */
.container { @apply mx-auto max-w-[1400px] px-8 py-6 space-y-6; }

/* Surface */
.surface { @apply rounded-2xl bg-white border border-slate-200/80 shadow-sm; }

/* Header */
.header {
  @apply rounded-2xl px-6 py-4 text-white shadow-sm;
  background: linear-gradient(to right, #1E3A8A, #102A4C);
}
```

---

## 10. Sidebar Menu

```typescript
const navItems = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/upload', label: 'Tải lên', icon: Upload },
  { href: '/data', label: 'Dữ liệu', icon: Database },
  { href: '/pricing', label: 'Tính giá OTA', icon: Calculator }, // NEW
  { href: '/settings', label: 'Cài đặt', icon: Settings },
  { href: '/guide', label: 'Hướng dẫn', icon: BookOpen },
];
```

---

## 11. Agoda Promotion Catalog (Seed Data)

### 11.1. SEASONAL (Max 1)

| ID | Name | Description |
|----|------|-------------|
| `agoda-seasonal-double-day` | Double Day Sale | Ngày đôi (10/10, 11/11...) |
| `agoda-seasonal-payday` | Payday Sale | Cuối tháng |
| `agoda-seasonal-night-owl` | Night Owl Sale | Đặt đêm muộn |
| `agoda-seasonal-summer` | Summer Vibes | Mùa hè |
| `agoda-seasonal-abroad` | Deals Abroad | Thị trường nước ngoài |

### 11.2. ESSENTIAL (Stackable)

| ID | Name | Description |
|----|------|-------------|
| `agoda-essential-early-bird` | Early Bird | Đặt sớm 14+ ngày |
| `agoda-essential-last-minute` | Last-Minute | Phút chót |
| `agoda-essential-long-stay` | Long Stay | Lưu trú dài ngày |
| `agoda-essential-occupancy` | Occupancy Promotion | Theo công suất |
| `agoda-essential-customized` | Customized | Tùy chỉnh |

### 11.3. TARGETED (Max 1 per subcategory)

| ID | Name | SubCategory |
|----|------|-------------|
| `agoda-targeted-vip-silver` | VIP Silver | LOYALTY |
| `agoda-targeted-vip-gold` | VIP Gold | LOYALTY |
| `agoda-targeted-vip-platinum` | VIP Platinum | LOYALTY |
| `agoda-targeted-mobile` | Mobile Users | PLATFORM |
| `agoda-targeted-geo` | Country/Geo Target | GEOGRAPHY |
| `agoda-targeted-package` | Package / Bundle | PRODUCT |
| `agoda-targeted-beds` | Beds Network | BEDS_NETWORK |

---

## 12. Implementation Checklist

### Phase 1: Database (30 mins)
- [ ] Add models to schema.prisma
- [ ] Run prisma migrate
- [ ] Seed PromotionCatalog

### Phase 2: API (1 hour)
- [ ] /api/pricing/room-types
- [ ] /api/pricing/ota-channels
- [ ] /api/pricing/campaigns
- [ ] /api/pricing/calc-matrix

### Phase 3: Components (2 hours)
- [ ] RoomTypesTab
- [ ] OTAConfigTab
- [ ] PromotionsTab
- [ ] OverviewTab

### Phase 4: Pages (30 mins)
- [ ] /pricing/page.tsx
- [ ] /pricing/layout.tsx

### Phase 5: Sidebar (15 mins)
- [ ] Add "Tính giá OTA" menu item

### Phase 6: Testing (1 hour)
- [ ] CRUD operations
- [ ] Calc engine
- [ ] Validation rules
- [ ] Export CSV

---

## 13. Future (V01.3+)

- [ ] Booking.com catalog
- [ ] Expedia catalog
- [ ] Date-based pricing factor
- [ ] Connect parity/compset to matrix

