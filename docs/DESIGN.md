# 🎨 DESIGN: RMS Version 01.7 - Production

> **Based on:** `docs/spec-v01.md` & iterative development (V01.0 → V01.7)
> **Goal:** Full-featured SaaS Revenue Management System with OTA Pricing, Time-Travel OTB, and Growth Playbook.

---

## 1. DATABASE SCHEMA (PostgreSQL 16)

**Critical Rules:**
- **Multi-tenancy**: All tables MUST have `hotel_id` (UUID).
- **Consistency**: UUID for all primary keys.
- **Audit**: `pricing_decisions` logs `system_price` and `as_of_date`.
- **Enums**: PostgreSQL enums for Status/Action/Role to prevent logic errors.

### ER Diagram (V01.7)
```mermaid
erDiagram
  HOTELS ||--o{ HOTEL_USERS : has
  HOTELS ||--o{ RESERVATIONS_RAW : owns
  HOTELS ||--o{ CANCELLATIONS_RAW : owns
  HOTELS ||--o{ DAILY_OTB : snapshots
  HOTELS ||--o{ FEATURES_DAILY : features
  HOTELS ||--o{ DEMAND_FORECAST : forecasts
  HOTELS ||--o{ PRICE_RECOMMENDATIONS : recommends
  HOTELS ||--o{ PRICING_DECISIONS : logs
  HOTELS ||--o{ IMPORT_JOBS : imports
  HOTELS ||--o{ ROOM_TYPES : "pricing"
  HOTELS ||--o{ OTA_CHANNELS : "pricing"
  HOTELS ||--o{ HOTEL_INVITES : "team"
  HOTELS ||--|| PRICING_SETTINGS : "config"
  HOTELS ||--|| SUBSCRIPTIONS : "billing"
  USERS  ||--o{ HOTEL_USERS : "belongs_to"
  USERS  ||--o{ PRICING_DECISIONS : makes
  OTA_CHANNELS ||--o{ CAMPAIGN_INSTANCES : activates
  PROMOTION_CATALOG ||--o{ CAMPAIGN_INSTANCES : instances
  RESERVATIONS_RAW ||--o{ CANCELLATIONS_RAW : matched

  HOTELS {
    uuid hotel_id PK
    text name
    text slug UK
    text timezone
    int capacity
    text currency
    int fiscal_start_day
    text ladder_steps
    boolean is_demo
    timestamp created_at
  }

  USERS {
    uuid user_id PK
    text email UK
    text name
    text phone
    text image
    boolean is_active
    enum role "super_admin|hotel_admin|manager|viewer"
    timestamp created_at
  }

  HOTEL_USERS {
    uuid id PK
    uuid user_id FK
    uuid hotel_id FK
    enum role
    boolean is_primary
    boolean is_active
    timestamp last_seen_at
  }

  IMPORT_JOBS {
    uuid job_id PK
    uuid hotel_id FK
    text file_name
    text file_hash
    enum status "pending|processing|completed|failed"
    enum import_type "RESERVATION|CANCELLATION"
    text error_summary
    timestamp created_at
    timestamp finished_at
  }

  RESERVATIONS_RAW {
    uuid id PK
    uuid hotel_id FK
    uuid job_id FK
    text reservation_id
    date booking_date
    date arrival_date
    date departure_date
    int rooms
    decimal revenue
    enum status "booked|cancelled"
    date cancel_date
    timestamptz book_time
    timestamptz cancel_time
    timestamptz last_modified_time
    text reservation_id_norm
    text room_code_norm
    text company_name
    timestamp loaded_at
  }

  CANCELLATIONS_RAW {
    uuid id PK
    uuid hotel_id FK
    uuid job_id FK
    text folio_num
    date arrival_date
    timestamptz cancel_time
    date as_of_date
    int nights
    decimal rate_amount
    decimal total_revenue
    text folio_num_norm
    text match_status
    uuid matched_reservation_id FK
  }

  DAILY_OTB {
    uuid hotel_id FK
    date as_of_date PK
    date stay_date PK
    int rooms_otb
    decimal revenue_otb
    timestamp created_at
  }

  FEATURES_DAILY {
    uuid hotel_id FK
    date as_of_date PK
    date stay_date PK
    int pickup_t30
    int pickup_t15
    int pickup_t7
    int pickup_t5
    int pickup_t3
    float pace_vs_ly
    int remaining_supply
    decimal revenue_otb
    decimal stly_revenue_otb
    boolean stly_is_approx
    json pickup_source
  }

  DEMAND_FORECAST {
    uuid hotel_id FK
    date as_of_date PK
    date stay_date PK
    int remaining_demand
    text model_version
  }

  PRICE_RECOMMENDATIONS {
    uuid hotel_id FK
    date as_of_date
    date stay_date PK
    decimal recommended_price
    decimal expected_revenue
    float uplift_pct
    text explanation
  }

  PRICING_DECISIONS {
    uuid decision_id PK
    uuid hotel_id FK
    uuid user_id FK
    date as_of_date
    date stay_date
    enum action "accept|override"
    decimal system_price
    decimal final_price
    text reason
    timestamp decided_at
  }

  ROOM_TYPES {
    cuid id PK
    uuid hotel_id FK
    text name
    float net_price
  }

  OTA_CHANNELS {
    cuid id PK
    uuid hotel_id FK
    text name
    text code
    enum calc_type "PROGRESSIVE|ADDITIVE|SINGLE_DISCOUNT"
    float commission
    boolean is_active
  }

  PROMOTION_CATALOG {
    text id PK
    text vendor
    text name
    text description
    enum group_type "SEASONAL|ESSENTIAL|TARGETED|GENIUS|PORTFOLIO|CAMPAIGN"
    float default_pct
    boolean allow_stack
    boolean max_one_in_group
  }

  CAMPAIGN_INSTANCES {
    cuid id PK
    uuid hotel_id
    text ota_channel_id FK
    text promo_id FK
    float discount_pct
    boolean is_active
    date start_date
    date end_date
  }

  PRICING_SETTINGS {
    cuid id PK
    uuid hotel_id FK UK
    text currency
    text rounding_rule
    float max_discount_cap
    float max_step_change_pct
    boolean enforce_guardrails_on_manual
  }

  SUBSCRIPTIONS {
    uuid id PK
    uuid hotel_id FK UK
    enum plan "STANDARD|SUPERIOR|DELUXE|SUITE"
    enum status "ACTIVE|TRIAL|PAST_DUE|CANCELLED"
    int max_users
    int max_imports_month
    int max_exports_day
  }

  HOTEL_INVITES {
    uuid invite_id PK
    uuid hotel_id FK
    text token_hash UK
    enum role
    int max_uses
    int used_count
    text status
    timestamp expires_at
  }
```

### Table Specifications & Logic

#### 1. `reservations_raw`
- **Purpose**: Append-only storage for each import.
- **Idempotency**: `file_hash` in ImportJob prevents duplicate files.
- **Unique**: `(hotel_id, reservation_id, job_id)` for history tracking.
- **V01.1 Fields**: `book_time`, `cancel_time` (timestamptz) for time-travel accuracy.

#### 2. `daily_otb` (Time-Travel Core)
- **Concept**: Snapshot of booking state at each `as_of_date`.
- **Logic** (V01.1+):
  - Active if: `book_time < as_of_date+1 00:00` AND (`cancel_time IS NULL` OR `cancel_time >= as_of_date+1 00:00`)
  - Half-open cutoff semantics (V01.4)
  - Revenue split per night, remainder to last night
- **as_of_date**: Set to `loaded_at` (upload date), NOT `booking_date`
- **Advisory Lock**: `pg_try_advisory_lock` prevents concurrent builds (V01.4)

#### 3. `cancellations_raw` (V01.1)
- **Bridge**: Auto-matched to reservations via normalized keys
- **Match Algorithm**: `reservation_id_norm` + `arrival_date` + optional `room_code_norm`
- **Statuses**: matched / unmatched / ambiguous / conflict / dq_issue

#### 4. `pricing_decisions` (Audit Log)
- **Fields**: `system_price` (for accept rate comparison), `user_id`, `reason` (required on override)

---

## 2. SYSTEM ARCHITECTURE (Next.js 16.1.6 Full-stack)

### A. Ingestion Module (Server Actions)
- `ingestCSV(formData)`: Auto-detects CSV vs Excel, validates hotel_id, parses with Papaparse/exceljs
- `ingestXML(formData)`: Crystal Reports format, aggregates by ConfirmNum
- `ingestCancellationXml(formData)`: Parses cancellation XML, runs bridge (V01.1)

### B. Core RMS Jobs (Server Actions)
- `buildDailyOTB(hotelId, asOfTs)`: Time-travel with book_time fallback, advisory lock
- `backfillOTB(hotelId)`: Batch backfill with generate_series, chunked (limit 3) (V01.4)
- `buildFeaturesDaily(hotelId)`: Pickup T-30/15/7/5/3, STLY, pace
- `generateForecast(hotelId)`: Uses max(as_of_date) from features_daily
- `runPricingEngine(hotelId)`: Ladder Strategy

### C. OTA Pricing Module (API Routes) (V01.2+)
- CRUD: room-types, ota-channels, campaigns
- `POST /api/pricing/calc-matrix`: Full price matrix (Rooms × Channels)
- Calc types: `PROGRESSIVE` (Booking), `ADDITIVE` (Agoda/Traveloka/CTRIP), `SINGLE_DISCOUNT` (Expedia)
- 3 calculator modes: net_to_bar, bar_to_net, display_to_bar (V01.7)
- Timing conflict resolution: Early Bird vs Last-Minute (V01.7)

### D. Dashboard Interfaces (Server Components)
- `/dashboard`: KPI cards, OTB chart, recommendations, cancellation stats
- `/data`: Data Inspector with Build OTB/Features/Forecast buttons
- `/pricing`: 5-tab module (Hạng phòng, Kênh OTA, Khuyến mãi, Bảng giá, Tối ưu OTA)
- `/admin/users`, `/admin/hotels`: User and Hotel management
- `/guide`: Comprehensive help with OTA pricing documentation

---

## 3. FRONTEND DESIGN (Next.js App Router)
- **Stack**: Tailwind CSS, Custom components, Lucide Icons, Recharts
- **Theme**: SaaS Pro Light (`#F5F7FB` background, white cards)
- **State**: React Server Components (RSC) for data, minimal client state
- **Loading**: Skeleton loaders via Next.js `loading.tsx` convention

---

## 4. DATA FLOW & LOGIC

### 4.1. Time-Travel OTB Logic (V01.1+)
```typescript
// Server Action: buildDailyOTB
async function buildDailyOTB(hotelId: string, asOfTs: Date) {
  // 1. Advisory lock to prevent concurrent builds
  const locked = await prisma.$queryRaw`SELECT pg_try_advisory_lock(...)`;

  // 2. Fetch valid bookings with time-travel
  const bookings = await prisma.reservationsRaw.findMany({
    where: {
      hotel_id: hotelId,
      book_time: { lt: nextDayMidnight(asOfTs) }  // Half-open cutoff
    }
  });

  const dailyStats = new Map();

  for (const b of bookings) {
    // Active if: book_time < D+1 00:00 AND (cancel_time IS NULL OR cancel_time >= D+1 00:00)
    const isActive = !b.cancel_time || b.cancel_time >= nextDayMidnight(asOfTs);

    if (isActive) {
      const nights = differenceInDays(b.departure_date, b.arrival_date);
      if (nights <= 0) continue;

      // Revenue split: total/nights per night, remainder to last night
      const baseRevPerNight = Math.floor(Number(b.revenue) / nights);
      const remainder = Number(b.revenue) - baseRevPerNight * nights;

      for (let i = 0; i < nights; i++) {
        const date = addDays(b.arrival_date, i);
        const rev = i === nights - 1 ? baseRevPerNight + remainder : baseRevPerNight;
        // Accumulate to Map
      }
    }
  }
  // Batch Upsert to DB
}
```

### 4.2. OTA Pricing Calc Types (V01.2+)
```typescript
// PROGRESSIVE (Booking.com 18%)
// BAR = NET / (1 - commission) / Π(1 - dᵢ)  — compounds discounts
displayPrice = BAR × Π(1 - dᵢ)
net = displayPrice × (1 - commission)

// ADDITIVE (Agoda 20%, Traveloka 15%, CTRIP 18%)
// BAR = NET / (1 - commission) / (1 - Σdᵢ)  — sums discounts
displayPrice = BAR × (1 - Σdᵢ)
net = displayPrice × (1 - commission)

// SINGLE_DISCOUNT (Expedia 17%)
// Each promotion creates separate rate plan, no stacking
displayPrice = BAR × (1 - d)
net = displayPrice × (1 - commission)
```

---

## 5. OTA GROWTH PLAYBOOK (Premium Module)

**Location:** Pricing page → Tab "Tối ưu OTA" (5th tab)

### 5.1 Component Architecture
```
/pricing (page)
  └── PricingPage.tsx
        ├── Tab: Hạng phòng          → RoomTypesTab.tsx
        ├── Tab: Kênh OTA            → OTAChannelsTab.tsx
        ├── Tab: Khuyến mãi          → PromotionsTab.tsx
        ├── Tab: Bảng giá            → OverviewTab.tsx (3 calculator modes)
        └── Tab: Tối ưu OTA          → OTAPlaybookGuide.tsx
              ├── Kiểm tra chỉ số OTA  → OTAHealthScorecard.tsx
              ├── Booking.com           → BookingChecklist
              ├── Agoda                 → AgodaChecklist
              ├── Hiệu quả chương trình → ROICalculator.tsx
              ├── Điểm Review           → ReviewCalculator.tsx
              └── Cách tăng Ranking     → WhenToBoost.tsx

/lib
  └── ota-score-calculator.ts  ← Scoring engine
```

### 5.2 Access Control
- **Gated by** `OTAGrowthPaywall` component
- **Free users**: See paywall with feature preview
- **Paid users**: Full access to all 6 tabs
- **Demo hotel**: Hidden from playbook
- **Super Admin**: Bypasses Demo Hotel restrictions

---

## 6. TEST SCENARIOS

All tests run in context of `hotel_id`.

- [ ] **TC-01 Multi-tenant**: User Hotel A cannot see Hotel B data.
- [ ] **TC-02 Import Job**: Upload file → ImportJob status `processing` → `completed`.
- [ ] **TC-03 Explode Nights**: Booking 2 nights, 200$. OTB day 1 = 100$, day 2 = 100$.
- [ ] **TC-04 Audit Decision**: Override must save `system_price` for comparison.
- [ ] **TC-05 Unique Recommendations**: Running job twice same day = no duplicates.
- [ ] **TC-06 Time-Travel**: OTB at as_of=Feb 10 shows bookings made before Feb 11 00:00.
- [ ] **TC-07 Cancellation Bridge**: Cancel record auto-matches reservation by normalized keys.
- [ ] **TC-08 OTA Pricing**: NET→BAR→Display calculation consistent across all 3 tabs.
- [ ] **TC-09 Timing Conflict**: Early Bird + Last-Minute → only highest discount applied.
