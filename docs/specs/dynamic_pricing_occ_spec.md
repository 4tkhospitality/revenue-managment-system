# Dynamic Pricing by Occupancy — Feature Spec
Version: V01.8 (Rev.3 — All Blocking Issues Resolved)
Created: 2026-02-12
Updated: 2026-02-12 14:15

## 1. Executive Summary

Thêm tab "📈 Giá Linh Hoạt" vào OTA Pricing module, cho phép khách sạn cấu hình giá NET theo mùa (Season) và tự động áp dụng hệ số giá theo tỷ lệ lấp đầy (OCC%). Đây là bridge giữa dữ liệu OTB trên Dashboard và bộ tính giá OTA.

**Business Value:**
- Thay thế Excel "giá linh hoạt" mà khách sạn đang dùng thủ công
- Giảm thời gian ra quyết định giá từ 30 phút xuống real-time
- Tăng RevPAR bằng cách tối ưu giá theo demand

## 2. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| US-1 | Hotel Manager | Cấu hình 3 mùa (Normal/High/Holiday) với date ranges | Giá cơ bản tự động thay đổi theo mùa |
| US-2 | Hotel Manager | Set NET price riêng cho mỗi loại phòng trong mỗi mùa | Giá phản ánh đúng chiến lược kinh doanh |
| US-3 | Hotel Manager | Cấu hình OCC tiers (3-6 bậc) với multiplier | Giá tự tăng khi demand cao |
| US-4 | Revenue Manager | Xem ma trận giá theo Season × OCC tier per OTA channel | So sánh giá across scenarios |
| US-5 | Revenue Manager | Biết OCC% của stay_date cụ thể đang ở tier nào | Ra quyết định giá nhanh cho từng ngày |
| US-6 | Hotel Manager | Export ma trận giá ra CSV | Chia sẻ với team hoặc đối tác OTA |
| US-7 | Hotel Manager | Import bảng giá theo mùa từ CSV template | Onboarding nhanh từ spreadsheet hiện tại |

## 3. Core Logic

### 3.1. Calculation Flow

> **⚠️ CRITICAL RULE:** Dynamic tab PHẢI reuse cùng pricing engine (`calcBarFromNet`) và cùng post-processing (`display = bar × (1 - totalDiscount/100)`) như calc-matrix API. KHÔNG tạo logic tính riêng.

```
Input:
  - room_type → NET_base (from SeasonNetRate; fallback: room_type.net_price)
  - stay_date → Season (from SeasonConfig.date_ranges, priority-based)
  - OTB(stay_date) / capacity → OCC% → Tier (from OccTierConfig)
  - OTA channel → commission, calc_type, discounts, boosters

Calculate:
  // Step 1: Apply OCC multiplier
  NET_effective = Math.round(NET_base × OCC_multiplier)  // ← Rounded to integer VND

  // Step 2: Reuse core engine (same as calc-matrix net_to_bar)
  CalcResult = calcBarFromNet(
    NET_effective, channel.commission, discounts, channel.calc_type,
    roundingRule, vendor, boosters
  )

  // Step 3: Post-processing (same as calc-matrix line 155-156)
  bar     = CalcResult.bar         // Giá set lên Channel Manager (rounded)
  display = Math.round(bar × (1 - CalcResult.totalDiscount / 100))  // Giá khách thấy
  net     = CalcResult.net         // Tiền KS nhận (= NET_effective)
```

### 3.2. Price Field Contract (Locked — KHÔNG thay đổi)

Mapping chính xác 1:1 với calc-matrix API và OverviewTab hiện tại:

| Field | Meaning | Source | VN Label |
|-------|---------|--------|----------|
| `net` | Tiền KS nhận sau hoa hồng OTA | `CalcResult.net` | "Thu về" |
| `bar` | Giá nhập vào Channel Manager | `CalcResult.bar` (rounded) | "BAR" |
| `display` | Giá khách thấy trên OTA (sau KM) | `bar × (1 - totalDiscount%)` | "Hiển thị" |

> **Note:** Engine `CalcResult` KHÔNG có field `display`. `display` được tính post-engine, giống calc-matrix API line 155-162.

### 3.3. Season Logic
**Priority:** Khi stay_date match nhiều season:
```
Holiday (priority=3) > High (priority=2) > Normal (priority=1)
```

**SeasonConfig chỉ chứa:** name, code, date_ranges, priority.
- **KHÔNG có `bar_multiplier`** — Season không tự nhân hệ số.
- NET phân biệt theo season qua `SeasonNetRate`.
- Fallback: nếu thiếu `SeasonNetRate` cho room type → dùng `room_type.net_price`.

**Date range semantics:**
- `date_ranges` dùng **date-only strings** (ISO format: `"2026-05-01"`)
- **End date inclusive** (e.g., `start: "2026-05-01", end: "2026-10-31"` = cả ngày 31/10 thuộc season này)
- Timezone: theo `hotel.timezone` cho date matching

### 3.4. OCC Tier Rules
- Tiers phải cover 0% → 100% liên tục, không gap, không overlap
- Minimum 3 tiers, maximum 6 tiers
- Boundary: inclusive lower, exclusive upper (trừ tier cuối)
  - 0-35%: [0, 0.35)
  - 35-65%: [0.35, 0.65)
  - 65-85%: [0.65, 0.85)
  - >85%: [0.85, 1.00]

### 3.5. OCC% Source of Truth (Backend Only)

> **⛔ BLOCKING FIX #3:** Backend là single source-of-truth cho OCC%. UI chỉ hiển thị.

- **Backend `/dynamic-matrix`** tự fetch `daily_otb` latest snapshot → tính `occPct = rooms_otb / capacity`
- Response trả `occPct` + `activeTier` cho UI hiển thị
- **UI KHÔNG tự fetch OTB** — chỉ nhận từ response
- `occOverride` chỉ dùng khi backend detect "no OTB data" → UI hiện input, user nhập → gửi lại

Validation: `occOverride ∈ [0, 1]`

### 3.6. OTA Channel Context
Dynamic tab **PHẢI biết đang tính cho OTA nào** vì commission, calc_type, promotions khác nhau per OTA.

**R01:** UI hiển thị OTA Channel dropdown (từ tab "Kênh OTA"). Default = OTA đầu tiên. Chuyển OTA → toàn bộ matrix recalculate.

### 3.7. Season Override on UI

> **⛔ BLOCKING FIX #1:** Thêm `seasonIdOverride` vào API request.

- Season dropdown auto-detect từ `stayDate`
- User có thể manual override → pass `seasonIdOverride` trong request
- Backend: nếu có `seasonIdOverride` → dùng trực tiếp, bỏ qua auto-detect

### 3.8. Rounding & Money Rule

> **⛔ BLOCKING FIX #4:** Tránh sai số Float × Decimal.

- `NET_effective = Math.round(NET_base × multiplier)` → **integer VND** trước khi vào `calcBarFromNet`
- OCC `multiplier` (Float): precision 2 decimal places (e.g., 1.10, 1.25)
- `occOverride`: validate `0 ≤ value ≤ 1`
- Engine `calcBarFromNet` nhận integer VND → xử lý rounding theo `roundingRule` (CEIL_1000/ROUND_100/NONE)

### 3.9. Default Configuration
```json
{
  "seasons": [
    { "code": "NORMAL", "name": "Normal Season", "priority": 1 },
    { "code": "HIGH", "name": "High Season", "priority": 2 },
    { "code": "HOLIDAY", "name": "Holiday", "priority": 3 }
  ],
  "occTiers": [
    { "tierIndex": 0, "label": "0-35%", "occMin": 0, "occMax": 0.35, "multiplier": 1.0 },
    { "tierIndex": 1, "label": "35-65%", "occMin": 0.35, "occMax": 0.65, "multiplier": 1.10 },
    { "tierIndex": 2, "label": "65-85%", "occMin": 0.65, "occMax": 0.85, "multiplier": 1.20 },
    { "tierIndex": 3, "label": ">85%", "occMin": 0.85, "occMax": 1.0, "multiplier": 1.30 }
  ]
}
```

## 4. Database Design

### 4.1. New Models
```
SeasonConfig    (hotel_id, name, code, date_ranges, priority, is_active)
OccTierConfig   (hotel_id, tier_index, label, occ_min, occ_max, multiplier)
SeasonNetRate   (hotel_id, season_id, room_type_id, net_rate)
```

### 4.2. Constraints
```
UNIQUE: SeasonConfig    (hotel_id, code)
UNIQUE: OccTierConfig   (hotel_id, tier_index)
UNIQUE: SeasonNetRate   (season_id, room_type_id)
INDEX:  All 3 tables on hotel_id
```

### 4.3. Relationships
```
Hotel 1──N SeasonConfig 1──N SeasonNetRate N──1 RoomType
Hotel 1──N OccTierConfig
```

## 5. API Contract

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/api/pricing/seasons` | List/Create seasons |
| PUT/DELETE | `/api/pricing/seasons/[id]` | Update/Delete season |
| GET/PUT | `/api/pricing/occ-tiers` | List/Bulk-upsert tiers |
| GET/PUT | `/api/pricing/season-rates` | List/Bulk-upsert NET rates |
| POST | `/api/pricing/season-rates/import` | CSV template upload |
| POST | `/api/pricing/dynamic-matrix` | Calculate full matrix |

### 5.1. Dynamic Matrix — Request/Response
```json
// Request
{
  "stayDate": "2026-06-15",           // Required. Determines season + OCC
  "channelId": "uuid-agoda",          // Required. OTA for calc_type + commission
  "seasonIdOverride": "uuid-high",    // Optional. Override auto-detected season (BLOCKING FIX #1)
  "occOverride": 0.58                 // Optional. Override OCC if no OTB data. Validated [0,1]
}

// Response
{
  "season": { "id": "...", "name": "Normal Season", "code": "NORMAL", "autoDetected": true },
  "stayDate": "2026-06-15",
  "occPct": 0.58,                     // Backend-computed, single source-of-truth (FIX #3)
  "occSource": "otb",                 // "otb" | "override" | "unavailable"
  "activeTier": { "tierIndex": 1, "label": "35-65%", "multiplier": 1.10 },
  "channel": { "name": "Agoda", "commission": 20, "calcType": "PROGRESSIVE" },
  "tiers": [...],
  "matrix": [
    {
      "roomType": { "id": "...", "name": "4BR Villa" },
      "netBase": 4320000,
      "perTier": [
        {
          "tierIndex": 0,
          "netEffective": 4320000,    // Math.round(4320000 × 1.0) (FIX #4)
          "bar": 5400000,             // CalcResult.bar
          "display": 5400000,         // bar × (1 - totalDiscount%) (FIX #2)
          "net": 4320000,             // CalcResult.net
          "isActive": false
        },
        {
          "tierIndex": 1,
          "netEffective": 4752000,    // Math.round(4320000 × 1.10)
          "bar": 5940000,
          "display": 5940000,
          "net": 4752000,
          "isActive": true
        }
      ]
    }
  ]
}
```

### 5.2. CSV Import — Template & Key (Non-blocking Fix #5)
```csv
room_type_id,season_code,net_rate
uuid-4br-villa,NORMAL,4320000
uuid-4br-villa,HIGH,4752000
uuid-luxury-4br,NORMAL,4600000
```
- Key: `room_type_id` (stable, không thay đổi khi đổi tên phòng)
- Template download kèm room_type_id + tên phòng + season codes hiện có

## 6. UI Specification

### 6.1. Tab "Giá Linh Hoạt" — Tab thứ 6
```
Pricing Page Tabs:
[Hạng phòng] [Kênh OTA] [Khuyến mãi] [Bảng giá] [Tối ưu OTA] [📈 Giá Linh Hoạt]
```

### 6.2. Main View
```
┌───────────────────────────────────────────────────────────────────────────┐
│ 📅 Stay Date: [15/06/2026]  Season: [Normal ▼]  OTA: [Agoda ▼]          │
│ View: [Thu về ▼]  [⚙️ Config] [📥 Export] [📤 Import]                    │
├───────────────────────────────────────────────────────────────────────────┤
│ ⚡ OCC ngày 15/06: 58% (source: OTB) — Tier: 35-65% (×1.10)             │
│ (nếu occSource = "unavailable": [Nhập OCC%: ____%] )                     │
├──────────────┬──────────┬──────────┬──────────┬──────────────────────────┤
│  Hạng phòng  │ 0-35%    │ 35-65%   │ 65-85%   │ >85%                    │
│              │ ×1.00    │ ×1.10 ✓  │ ×1.20    │ ×1.30                   │
├──────────────┼──────────┼──────────┼──────────┼──────────────────────────┤
│  4BR Villa   │ 4,320K   │ 4,752K ★ │ 5,184K   │ 5,616K                  │
│  Luxury 4BR  │ 4,600K   │ 5,060K ★ │ 5,520K   │ 5,980K                  │
└──────────────┴──────────┴──────────┴──────────┴──────────────────────────┘
```

### 6.3. Controls
- **Stay Date picker** — default hôm nay. Change → API call → OCC% + Season auto-update
- **Season dropdown** — auto-detected (response.season.autoDetected). Manual override → pass `seasonIdOverride`
- **OTA Channel dropdown** — from existing OTA configs. Quyết định commission + calc_type + promo set
- **View toggle** — Thu về (net) / BAR (bar) / Hiển thị (display) — exact same labels as OverviewTab
- **OCC manual input** — visible ONLY when `response.occSource = "unavailable"`

### 6.4. Config Panel (drawer/modal)
- Season Management: CRUD seasons (name, code, date ranges, priority)
- OCC Tier Config: Boundary + multiplier inputs, validation
- Season NET Rates: Inline table per room type per season

### 6.5. Import/Export
- **Export CSV:** Matrix hiện tại (Room Type × OCC Tiers), includes NET + BAR + Display
- **Import CSV:** Template download → fill → upload → preview → bulk upsert
- Template key: `room_type_id` (not name) — stable across renames (Fix #5)

## 7. Edge Cases & Gotchas

| Case | Handling |
|------|----------|
| No seasons configured | "Thêm mùa đầu tiên" CTA |
| No NET rates for a season | Fallback `room_type.net_price` |
| Stay date not in any season | Fall back to Normal season |
| OCC = exactly boundary (35%) | Goes to HIGHER tier [0.35, 0.65) |
| OCC > 100% (overbooking) | Clamp to last tier |
| No OTB data for stay_date | `occSource: "unavailable"`, show manual input |
| No OTA channels configured | "Cấu hình kênh OTA trước" CTA |
| NET_effective < hotel.min_rate | ⚠️ Warning "Dưới guardrail min_rate" (Fix #6) |

> **Fix #6:** Warning so sánh với `hotel.min_rate` (guardrail), KHÔNG so sánh với `room_type.net_price` (vì SeasonNetRate có thể cố tình thấp hơn cho low season).

## 8. Known Limitations (V01.8)

> [!WARNING]
> **Per-season OCC tiers chưa hỗ trợ.** Excel thực tế (La Isla) dùng Holiday tiers khác (2 tiers: 0-50/50-100, multiplier 1.30/1.40) so với Normal/High (4 tiers: 0-35/35-65/65-85/85+). V01.8 OCC tiers dùng chung toàn hotel cho mọi season. Per-season tier override → V01.9/V02.

## 9. Roadmap
- **V01.8 (this):** Tab A — full matrix + config + CSV import/export
- **V01.9:** Option C — Dashboard snippet + per-season tier override
- **V02.0:** Option B — OCC slider embedded in Overview tab
