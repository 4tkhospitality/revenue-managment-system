# 📋 SRS: Revenue Management System (RMS)

**Ngày tạo:** 2026-02-05  
**Version:** 01.1 (MVP)  
**Production URL:** https://revenue-managment-system.vercel.app  
**GitHub:** https://github.com/4tkhospitality/revenue-managment-system

---

## 1. Tổng quan Hệ thống

### 1.1. Mục đích
**Revenue Management System (RMS)** là hệ thống quản lý doanh thu khách sạn, giúp:
1. **Thu thập dữ liệu** - Import booking từ PMS (CSV/XML)
2. **Phân tích OTB** - On-The-Books với time-travel (V01.1)
3. **Dự báo demand** - Heuristic forecasting
4. **Đề xuất giá** - Ladder Pricing Strategy
5. **Quản lý người dùng** - RBAC multi-tenant
6. **OTA Pricing Structure** - Tính BAR theo từng OTA để đảm bảo nhận đúng NET (V01.2)

### 1.2. Đối tượng sử dụng

| Role | Quyền hạn |
|------|-----------|
| **super_admin** | Toàn quyền - quản lý tất cả hotels, users |
| **hotel_admin** | Admin per-hotel - full access trong hotel được gán |
| **manager** | Manager - xem + một số quyền edit |
| **viewer** | Chỉ xem (read-only) |

### 1.3. Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16.1.6 (App Router + Turbopack) |
| **Styling** | Tailwind CSS, SaaS Pro Light Theme |
| **Charts** | Recharts |
| **Backend** | Next.js Server Actions + API Routes |
| **Auth** | NextAuth.js v5 (Google OAuth) |
| **Database** | PostgreSQL 16 (Supabase) |
| **ORM** | Prisma 5.10.2 |
| **Hosting** | Vercel (Git auto-deploy) |

---

## 2. Kiến trúc Hệ thống

### 2.1. Data Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA PIPELINE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: IMPORT                                                 │
│  ┌─────────┐    ┌─────────┐    ┌──────────────────┐            │
│  │ CSV     │ →  │ Parser  │ →  │ reservations_raw │            │
│  │ XML     │    │         │    │ (append-only)    │            │
│  └─────────┘    └─────────┘    └──────────────────┘            │
│                                                                 │
│  Step 1b: CANCELLATION BRIDGE (V01.1)                          │
│  ┌─────────┐    ┌─────────┐    ┌──────────────────┐            │
│  │ Cancel  │ →  │ Bridge  │ →  │ cancellations_raw│            │
│  │ XML     │    │ Match   │    │ + matched FK     │            │
│  └─────────┘    └─────────┘    └──────────────────┘            │
│                                                                 │
│  Step 2: BUILD OTB                                             │
│  ┌──────────────────┐    ┌─────────────────┐                   │
│  │ reservations_raw │ →  │ daily_otb       │                   │
│  │ (time-travel)    │    │ (fact table)    │                   │
│  └──────────────────┘    └─────────────────┘                   │
│                                                                 │
│  Step 3: BUILD FEATURES                                        │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ daily_otb       │ →  │ features_daily  │                    │
│  │                 │    │ (Pickup, Pace)  │                    │
│  └─────────────────┘    └─────────────────┘                    │
│                                                                 │
│  Step 4: RUN FORECAST                                          │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ features_daily  │ →  │ demand_forecast │                    │
│  │                 │    │ (Heuristic)     │                    │
│  └─────────────────┘    └─────────────────┘                    │
│                                                                 │
│  Step 5: PRICING ENGINE                                        │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ demand_forecast │ →  │ price_recommend │                    │
│  │ + ladder_config │    │ (on-the-fly)    │                    │
│  └─────────────────┘    └─────────────────┘                    │
│                                                                 │
│  Step 5b: OTA PRICING MATRIX (V01.2)                           │
│  ┌─────────────────────┐    ┌──────────────────────────┐       │
│  │ room_types + ota_*  │ →  │ ota_price_matrix (calc)  │       │
│  │ + campaigns         │    │ (on-demand / cached)     │       │
│  └─────────────────────┘    └──────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2. Application Structure

```
apps/web/
├── app/
│   ├── auth/login/          # Login page (4TK brand)
│   ├── dashboard/           # Main dashboard
│   ├── upload/              # File upload
│   ├── data/                # Data inspector
│   ├── pricing/             # OTA Pricing Module (V01.2)
│   ├── settings/            # Hotel settings
│   ├── guide/               # User guide
│   ├── admin/               # Admin panel (users, hotels)
│   ├── api/                 # API routes
│   └── actions/             # Server actions
├── components/
│   ├── dashboard/           # Dashboard components
│   ├── pricing/             # Pricing components (V01.2)
│   └── ui/                  # Shared UI components
├── lib/
│   ├── prisma.ts            # Prisma client
│   ├── auth.ts              # NextAuth config
│   ├── normalize.ts         # Key normalization
│   ├── cancellationBridge.ts # V01.1 bridge logic
│   └── pricing/             # Pricing engine (V01.2)
└── prisma/
    └── schema.prisma        # Database schema
```

---

## 3. Database Schema

### 3.1. Tables Overview

| Table | Description | Multi-tenant |
|-------|-------------|--------------|
| `hotels` | Tenant root - metadata, capacity, pricing config | Root |
| `users` | System users - global role, is_active | Global |
| `hotel_users` | Junction table - user-hotel assignments | Per-hotel |
| `import_jobs` | File upload tracking | Per-hotel |
| `reservations_raw` | Raw booking data (append-only) | Per-hotel |
| `cancellations_raw` | Cancellation records | Per-hotel |
| `daily_otb` | OTB snapshots (fact table) | Per-hotel |
| `features_daily` | Computed features (Pickup, Pace) | Per-hotel |
| `demand_forecast` | Forecast outputs | Per-hotel |
| `price_recommendations` | Pricing suggestions | Per-hotel |
| `pricing_decisions` | Audit log (Accept/Override) | Per-hotel |
| `room_types` | Hạng phòng + NET (V01.2) | Per-hotel |
| `ota_channels` | OTA commission + calc mode (V01.2) | Per-hotel |
| `promotion_catalog` | Danh mục promotion seed (V01.2) | Global |
| `campaign_instances` | Promotion bật cho hotel/OTA (V01.2) | Per-hotel |
| `pricing_settings` | Rule cap/rounding (V01.2) | Per-hotel |

### 3.2. Key Tables Detail

#### hotels
```sql
- hotel_id: UUID (PK)
- name: String
- timezone: String (default: Asia/Ho_Chi_Minh)
- capacity: Int (số phòng)
- fiscal_start_day: Int (1-28)
- currency: String (VND, USD...)
- ladder_steps: JSON (pricing ladder config)
```

#### users
```sql
- user_id: UUID (PK)
- email: String (unique)
- name: String?
- image: String?
- role: UserRole (super_admin/hotel_admin/manager/viewer)
- is_active: Boolean (default: true)
- created_at: DateTime
```

#### hotel_users (V01)
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- hotel_id: UUID (FK → hotels)
- role: HotelUserRole (hotel_admin/manager/viewer)
- assigned_at: DateTime
- UNIQUE(user_id, hotel_id)
```

#### reservations_raw
```sql
- id: UUID (PK)
- hotel_id: UUID (FK)
- import_job_id: UUID (FK)
- reservation_id: String
- reservation_id_norm: String (V01.1 - normalized)
- guest_name: String?
- arrival_date: Date
- departure_date: Date
- room_code: String?
- room_code_norm: String? (V01.1)
- num_rooms: Int
- room_revenue: Float
- booking_date: Date
- book_time: DateTime? (V01.1)
- cancel_time: DateTime? (V01.1)
- cancel_reason: String?
- cancel_source: String?
- source: String (OTA channel)
- status: String
- loaded_at: DateTime
```

#### cancellations_raw (V01.1)
```sql
- id: UUID (PK)
- hotel_id: UUID (FK)
- import_job_id: UUID (FK)
- folio_num: String
- folio_num_norm: String (normalized)
- guest_name: String?
- arrival_date: Date
- departure_date: Date
- room_code: String?
- room_code_norm: String?
- cancel_time: DateTime
- cancel_reason: String?
- nights: Int
- revenue: Float
- matched_reservation_id: UUID? (FK → reservations_raw)
- matched_at: DateTime?
- match_status: String (matched/unmatched/ambiguous)
- match_notes: String?
- UNIQUE(hotel_id, folio_num_norm, arrival_date, cancel_time)
```

### 3.3. Indexes (V01.1)

```sql
-- Matching indexes
idx_res_raw_match1 (hotel_id, reservation_id_norm, arrival_date, room_code_norm)
idx_res_raw_match2 (hotel_id, reservation_id_norm, arrival_date)

-- Time-travel OTB
idx_res_raw_otb (hotel_id, book_time, cancel_time, arrival_date, departure_date)

-- Cancellation status
idx_cancel_match_status (hotel_id, match_status)
```

---

## 4. Tính năng Chi tiết

### 4.1. Module Dashboard

#### 4.1.1. KPI Cards
| Card | Metric | Formula |
|------|--------|---------|
| Rooms OTB (today) | Số phòng đã book | SUM(num_rooms) cho stay_date = today |
| Revenue OTB | Doanh thu OTB | SUM(room_revenue) |
| ADR | Average Daily Rate | revenue_otb ÷ rooms_otb |
| Occupancy | Công suất | rooms_otb ÷ capacity × 100% |
| Cancelled Nights (V01.1) | Room-nights bị hủy | SUM(nights) from cancellations |
| Lost Revenue (V01.1) | Doanh thu lost | SUM(revenue) from cancellations |

#### 4.1.2. OTB Chart
- Line chart hiển thị Rooms OTB theo ngày
- Range: 30 ngày (configurable)
- Color: Royal blue gradient

#### 4.1.3. Recommendations Table
| Column | Description |
|--------|-------------|
| Date | Stay date |
| Current ADR | Giá hiện tại |
| Recommended | Giá đề xuất |
| Confidence | Mức độ tin cậy |
| Actions | Accept / Override |

### 4.2. Module Upload

#### 4.2.1. Supported Formats

| Format | Parser | Use case |
|--------|--------|----------|
| CSV | Papaparse | Generic reservation export |
| XML (PMS) | fast-xml-parser | Crystal Reports format |
| XML (Cancel) | fast-xml-parser | Cancellation reports (V01.1) |

#### 4.2.2. Import Flow
1. User uploads file
2. Server validates format
3. Parser extracts rows
4. Normalize keys (V01.1)
5. Upsert to reservations_raw / cancellations_raw
6. Run bridge (V01.1) if cancellation
7. Return import summary

### 4.3. Module Data Inspector

#### 4.3.1. Import Jobs Table
- Pagination: 10 per page
- Columns: Filename, Type, Rows, Status, Date
- Actions: View details

#### 4.3.2. Action Buttons
| Button | Action | Description |
|--------|--------|-------------|
| Build OTB | buildDailyOTB() | Tính toán OTB snapshots |
| Build Features | buildFeatures() | Tính Pickup, Pace |
| Run Forecast | runForecast() | Chạy dự báo |
| Reset & Rebuild | resetDerived() | Xóa derived data, rebuild |

#### 4.3.3. Cancellation Stats (V01.1)
| Status | Description |
|--------|-------------|
| ✅ Matched | Đã link với reservation |
| ❌ Unmatched | Không tìm thấy reservation |
| ⚠️ Ambiguous | Nhiều reservation match |

### 4.4. Module Settings

#### 4.4.1. Hotel Configuration
| Setting | Type | Default |
|---------|------|---------|
| Timezone | Select | Asia/Ho_Chi_Minh |
| Fiscal Start Day | Number | 1 |
| Currency | Select | VND |
| Capacity | Number | 100 |

#### 4.4.2. Pricing Ladder
```json
{
  "steps": [
    { "occupancy_min": 0, "multiplier": 0.85 },
    { "occupancy_min": 50, "multiplier": 1.00 },
    { "occupancy_min": 70, "multiplier": 1.15 },
    { "occupancy_min": 85, "multiplier": 1.30 },
    { "occupancy_min": 95, "multiplier": 1.50 }
  ]
}
```

### 4.5. Module Admin (V01)

#### 4.5.1. User Management
- List all users with hotel assignments
- Create user with email, role, hotels
- Edit user role, is_active status
- Assign/Remove hotel access

#### 4.5.2. Hotel Management
- List all hotels with user counts
- Create new hotel
- Edit hotel settings

### 4.6. Module Pricing OTA (V01.2)

> Chi tiết: [spec-v01.2-pricing-module.md](spec-v01.2-pricing-module.md)

#### 4.6.1. Tab Room Types
- CRUD hạng phòng
- Nhập NET với thousand separator

#### 4.6.2. Tab OTA Config
- CRUD OTA channels
- Cấu hình commission, calc_type (Progressive/Additive)
- Bật/tắt channel

#### 4.6.3. Tab Promotions
- Chọn promotions theo catalog (Agoda V01.2)
- Tạo campaign_instances per OTA
- Validation rules (max 1 Seasonal, max 1 Targeted per subcategory)

#### 4.6.4. Tab Overview Matrix
- Hiển thị RoomType × OTAChannel = BAR
- Color-coded (cao = đỏ, thấp = xanh)
- Export CSV/Excel

---

## 5. Cancellation Bridge (V01.1)

### 5.1. Matching Algorithm

```typescript
// Matching Strategy: take:2 for ambiguity detection

// Step 1: Normalize keys
reservation_id_norm = UPPER(TRIM(alphanumeric_only(reservation_id)))
room_code_norm = UPPER(TRIM(alphanumeric_only(room_code)))

// Step 2: Find candidates
candidates = reservations.where(
  reservation_id_norm == cancellation.folio_num_norm
  AND arrival_date == cancellation.arrival_date
  AND (room_code_norm == cancellation.room_code_norm OR room_code_norm IS NULL)
).orderBy([
  last_modified_time DESC,
  book_time DESC,
  loaded_at DESC
]).take(2)

// Step 3: Determine match status
if (candidates.length === 0) → "unmatched"
if (candidates.length === 1) → "matched"
if (candidates.length > 1) → "ambiguous"
```

### 5.2. Match Statuses

| Status | Description | Action |
|--------|-------------|--------|
| `matched` | 1 reservation found | Link FK, update cancel_time |
| `unmatched` | 0 reservations | Log, manual review needed |
| `ambiguous` | 2+ reservations | Log, pick first or manual |
| `conflict` | Already cancelled | Log conflict |
| `dq_issue` | Data quality issue | Log for review |
| `unsupported_partial` | Partial cancel | Not supported yet |

### 5.3. Time-Travel OTB

```sql
-- Active reservations at a point in time
SELECT * FROM reservations_raw
WHERE hotel_id = :hotel_id
  AND book_time <= :asOfTs
  AND (cancel_time IS NULL OR cancel_time > :asOfTs)
  AND arrival_date <= :stay_date
  AND departure_date > :stay_date
```

---

## 6. Authentication & Authorization

### 6.1. Auth Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     AUTH FLOW                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User clicks "Sign in with Google"                       │
│     └→ NextAuth.js OAuth flow                              │
│                                                             │
│  2. Google returns user info (email, name, image)          │
│     └→ NextAuth signIn callback                            │
│                                                             │
│  3. Check user in DB                                        │
│     ├─ Not exists? → Create with role=viewer, is_active=true│
│     ├─ is_active=false? → Redirect to /blocked             │
│     └─ OK? → Continue                                       │
│                                                             │
│  4. Get hotel assignments                                   │
│     ├─ No hotels? → Redirect to /no-hotel-access           │
│     ├─ 1 hotel? → Set active hotel                         │
│     └─ Multiple? → Redirect to /select-hotel               │
│                                                             │
│  5. JWT session includes:                                   │
│     - user.id, email, name, image                          │
│     - user.role (global)                                   │
│     - user.isAdmin (super_admin check)                     │
│     - user.accessibleHotels[]                              │
│                                                             │
│  6. Active hotel stored in httpOnly cookie: rms_active_hotel│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2. Permission Matrix

| Page | super_admin | hotel_admin | manager | viewer |
|------|-------------|-------------|---------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Upload | ✅ | ✅ | ✅ | ❌ |
| Data Inspector | ✅ | ✅ | ✅ | ✅ (view) |
| Pricing OTA | ✅ | ✅ | ✅ (edit limited) | ✅ (view) |
| Settings | ✅ | ✅ | ❌ | ❌ |
| Admin Users | ✅ | ❌ | ❌ | ❌ |
| Admin Hotels | ✅ | ❌ | ❌ | ❌ |

---

## 7. UI/UX Design

### 7.1. Theme: SaaS Pro Light

| Element | Value |
|---------|-------|
| Background | `#F5F7FB` (lavender gray) |
| Surface | `#FFFFFF` (white cards) |
| Primary | `#1E3A8A` (royal blue) |
| Sidebar | `#204184` (logo blue) |
| Text | `#1e293b` (dark gray) |
| Border | `slate-200/80` |

### 7.2. Brand Colors (4TK)

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#204183` | Logo, accents |
| Dark | `#0B1E3A` | Deep backgrounds |
| Mid | `#16325F` | Gradients |
| Light | `#AABAD1` | Hover states |

### 7.3. Component Patterns

```css
/* Surface (cards) */
.surface {
  @apply rounded-2xl bg-white border border-slate-200/80;
  box-shadow: 0 1px 2px rgba(16,24,40,0.06);
}

/* Header */
.header {
  @apply rounded-2xl px-6 py-4 text-white shadow-sm;
  background: linear-gradient(to right, #1E3A8A, #102A4C);
}

/* Container */
.container {
  @apply mx-auto max-w-[1400px] px-8 py-6 space-y-6;
}
```

### 7.4. Responsive Design

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<1024px) | Hamburger menu, sidebar hidden |
| Desktop (≥1024px) | Fixed sidebar, ml-64 content |

---

## 8. API Endpoints

### 8.1. Server Actions

| Action | Description |
|--------|-------------|
| `ingestCSV` | Parse CSV, save to reservations_raw |
| `ingestXML` | Parse PMS XML, aggregate by ConfirmNum |
| `ingestCancellationXml` | Parse cancel XML, run bridge (V01.1) |
| `buildDailyOTB` | Time-travel OTB with asOfTs (V01.1) |
| `buildFeatures` | Compute Pickup T30/15/7/5, Pace |
| `runForecast` | Heuristic demand forecasting |
| `backfillOTB` | Backfill historical OTB (V01.1) |

### 8.2. API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/user/switch-hotel` | Set active hotel (cookie) |
| GET | `/api/admin/users` | List users (super_admin) |
| POST | `/api/admin/users` | Create user |
| PUT | `/api/admin/users/[id]` | Update user |
| PUT | `/api/admin/users/[id]/hotels` | Update hotel assignments |
| GET | `/api/admin/hotels` | List hotels |
| POST | `/api/admin/hotels` | Create hotel |
| PUT | `/api/admin/hotels/[id]` | Update hotel |

### 8.3. Pricing Module API (V01.2)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/pricing/room-types` | List/Create room types |
| PATCH/DELETE | `/api/pricing/room-types/[id]` | Update/Delete |
| GET/POST | `/api/pricing/ota-channels` | List/Create OTA channels |
| PATCH/DELETE | `/api/pricing/ota-channels/[id]` | Update/Delete |
| GET/POST | `/api/pricing/campaigns` | List/Create campaigns |
| PATCH/DELETE | `/api/pricing/campaigns/[id]` | Update/Delete |
| POST | `/api/pricing/calc-matrix` | Calculate full BAR matrix |

---

## 9. Formulas & Calculations

### 9.1. OTB Metrics

```
Rooms OTB = SUM(num_rooms) WHERE stay_date in range
Revenue OTB = SUM(room_revenue) WHERE stay_date in range
ADR = Revenue OTB ÷ Rooms OTB
Occupancy = Rooms OTB ÷ Capacity × 100%
Remaining Supply = Capacity − Rooms OTB
```

### 9.2. Time-Travel OTB (V01.1)

```typescript
// Active reservation at timestamp asOfTs
isActive = book_time <= asOfTs 
        && (cancel_time IS NULL || cancel_time > asOfTs)

// Revenue per night (split evenly, remainder to last night)
revenue_per_night = Math.floor(total_revenue / nights)
last_night_revenue = total_revenue - (revenue_per_night * (nights - 1))
```

### 9.3. Pricing Ladder

```typescript
function getMultiplier(occupancy: number, ladder: LadderStep[]): number {
  // Sort descending by occupancy_min
  const sorted = ladder.sort((a, b) => b.occupancy_min - a.occupancy_min);
  
  // Find first step where occupancy >= min
  for (const step of sorted) {
    if (occupancy >= step.occupancy_min) {
      return step.multiplier;
    }
  }
  return 1.0; // default
}

recommendedPrice = ADR × getMultiplier(occupancy, ladder)
```

### 9.4. OTA BAR Calculation (V01.2)

**Progressive Mode:**
```
BAR = NET / (1 - commission) / Π(1 - dᵢ)
```

**Additive Mode:**
```
BAR = NET / (1 - commission) / (1 - Σdᵢ)
```

**Validation Rules:**
- Seasonal: max 1
- Targeted: max 1 per sub_category
- Total discount ≤ max_discount_cap (default 80%)
- Commission < 100%

---

## 10. Deployment

### 10.1. Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase connection (pooler) |
| `DIRECT_URL` | Supabase direct connection |
| `DEFAULT_HOTEL_ID` | Fallback hotel UUID |
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth secret |
| `ADMIN_EMAIL` | Auto-super_admin email |
| `NEXTAUTH_SECRET` | Session encryption |

### 10.2. Vercel Config

```
Root Directory: apps/web
Framework: Next.js
Build: npm run build
Output: .next (default)
```

### 10.3. Database (Supabase)

```
Region: Southeast Asia (Singapore)
Plan: Free tier
Connection: Transaction Pooler (port 6543)
```

---

## 11. Known Issues & Gotchas

| Issue | Solution |
|-------|----------|
| DOMParser is browser-only | Use fast-xml-parser for Node.js |
| Prisma generate file lock | Restart dev server |
| PrismaClient in Edge | Use API routes, not middleware |
| Vercel monorepo | Set Root Directory to apps/web |
| Date comparison | Normalize to midnight |

---

## 12. Roadmap

### V01 (Done) ✅
- [x] Google OAuth + RBAC
- [x] Multi-hotel support
- [x] Admin panel

### V01.1 (Done) ✅
- [x] Cancellation Bridge
- [x] Time-travel OTB
- [x] Dashboard cancel stats

### V01.2 (Planned)
- [ ] Add DB tables: room_types, ota_channels, promotion_catalog, campaign_instances, pricing_settings
- [ ] Add /pricing route + sidebar menu "Tính giá OTA"
- [ ] Implement pricing engine (progressive/additive) + validator
- [ ] Agoda catalog seed
- [ ] Overview matrix + export CSV
- [ ] 4 tabs: Room Types, OTA Config, Promotions, Overview

> Chi tiết: [spec-v01.2-pricing-module.md](spec-v01.2-pricing-module.md)

### V01.3 (Future)
- [ ] Booking.com / Expedia catalog
- [ ] Date-based pricing factor
- [ ] Connect parity/compset to matrix

### V02 (Future)
- [ ] Machine Learning forecasting
- [ ] Real-time PMS integration
- [ ] Mobile app

