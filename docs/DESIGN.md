# 🎨 DESIGN: RMS Version 01 (MVP) - Final

> **Based on:** `docs/spec-v01.md` & **User Feedback (Critical Fixes + Fine-tuning)**
> **Goal:** Executable Design for 14-day Pilot (SaaS-ready, Audit-ready).

---

## 1. DATABASE SCHEMA (PostgreSQL)

**Critical Rules:**
- **Multi-tenancy**: Mọi bảng quan trọng BẮT BUỘC có `hotel_id` (UUID).
- **Consistency**: Sử dụng `UUID` cho ID (`hotel_id`, `user_id`, `job_id`).
- **Audit**: `pricing_decisions` phải log đầy đủ `system_price` và `as_of_date`.
- **Enums**: Sử dụng Enum cho Status / Action để tránh lỗi logic.

### ER Diagram (Corrected V01)
```mermaid
erDiagram
  HOTELS ||--o{ USERS : has
  HOTELS ||--o{ RESERVATIONS_RAW : owns
  HOTELS ||--o{ DAILY_OTB : snapshots
  HOTELS ||--o{ FEATURES_DAILY : features
  HOTELS ||--o{ DEMAND_FORECAST : forecasts
  HOTELS ||--o{ PRICE_RECOMMENDATIONS : recommends
  HOTELS ||--o{ PRICING_DECISIONS : logs
  HOTELS ||--o{ IMPORT_JOBS : imports
  USERS  ||--o{ PRICING_DECISIONS : makes

  HOTELS {
    uuid hotel_id PK
    text name
    text timezone
    int capacity
    text currency
    timestamp created_at
  }

  USERS {
    uuid user_id PK
    uuid hotel_id FK
    text email
    text role
    timestamp created_at
  }

  IMPORT_JOBS {
    uuid job_id PK
    uuid hotel_id FK
    text file_name
    text file_hash
    text status "pending|processing|completed|failed"
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
    numeric revenue
    text status
    date cancel_date
    timestamp loaded_at
  }

  DAILY_OTB {
    uuid hotel_id FK
    date as_of_date PK
    date stay_date PK
    int rooms_otb
    numeric revenue_otb
    timestamp created_at
  }

  FEATURES_DAILY {
    uuid hotel_id FK
    date as_of_date PK
    date stay_date PK
    int dow
    boolean is_weekend
    int month
    int pickup_t30
    int pickup_t7
    int pickup_t3
    float pace_vs_ly
    int remaining_supply
    timestamp created_at
  }

  DEMAND_FORECAST {
    uuid hotel_id FK
    date as_of_date PK
    date stay_date PK
    int remaining_demand
    text model_version
    timestamp created_at
  }

  PRICE_RECOMMENDATIONS {
    uuid hotel_id FK
    date as_of_date
    date stay_date PK
    numeric current_price
    numeric recommended_price
    numeric expected_revenue
    float uplift_pct
    text explanation
    timestamp created_at
    constraint unique_rec UNIQUE (hotel_id, stay_date, as_of_date)
  }

  PRICING_DECISIONS {
    uuid decision_id PK
    uuid hotel_id FK
    uuid user_id FK
    date as_of_date
    date stay_date
    text action "accept|override"
    numeric system_price
    numeric final_price
    text reason
    timestamp decided_at
  }
```

### Table Specifications & Logic

#### 1. `reservations_raw`
- **Purpose**: Append-only storage cho mỗi lần import.
- **Idempotency**: Sử dụng `hash` hoặc check tồn tại trong `IMPORT_JOBS` để tránh duplicate file.
- **Unique Strategy**: `(hotel_id, reservation_id, job_id)` để cho phép history tracking (nếu booking thay đổi ở file sau).

#### 2. `daily_otb` (Time-Travel Core)
- **Concept**: Snapshot trạng thái booking tại từng ngày `as_of_date`.
- **Logic**:
  - `status = 'booked'` nếu `booking_date <= as_of_date` VÀ (`cancel_date IS NULL` OR `cancel_date > as_of_date`).
  - **Explode Night**: Revenue và Rooms phải được chia đều (hoặc theo rate plan nếu có) cho từng đêm `stay_date`.
- **Indexes**:
  - `idx_otb_as_of` (`hotel_id`, `as_of_date`) -> Cho Time-travel query.
  - `idx_otb_stay` (`hotel_id`, `stay_date`) -> Cho Pickup Chart / OTB curve.

#### 3. `pricing_decisions` (Audit Log)
- **Goal**: Human-in-the-loop tracking.
- **Critical Fields**:
  - `system_price`: Để so sánh hiệu quả sau này (Accept Rate).
  - `user_id`: Ai ra quyết định?
  - `reason`: Bắt buộc nếu Override.
  - `action`: Enum `accept` | `override`.

---

## 2. SYSTEM ARCHITECTURE (Next.js Full-stack)

### A. Ingestion Module (Server Actions)
- `ingestCSV(formData)`:
    - Parse CSV using `papaparse` (Stream).
    - Validate rows.
    - Insert to `ReservationsRaw` via Prisma (`createMany`).
    - Trigger `rebuildOTB` via internal queue/cron or direct await (MVP).

### B. Core RMS Jobs (Server Actions / Cron)
- `rebuildOTB(hotelId, range)`:
    - Fetch `ReservationsRaw`.
    - Client-side logic (in Server Action) to "Time-Travel" & "Explode Nights".
    - `upsert` to `DailyOTB`.
- `generateForecast(hotelId)`:
    - Fetch `DailyOTB`.
    - Calculate Features (JS Math).
    - Predict Demand (Heuristic/LinearRegression).
    - Save to `DemandForecast`.
- `runPricingEngine(hotelId)`:
    - Fetch Forecast & Supply.
    - Simulate Price Ladder.
    - Save to `PriceRecommendations`.

### C. Dashboard Interfaces (Server Components)
- **Pages**:
    - `/dashboard`: Direct DB fetch via Prisma.
    - `/dashboard/upload`: Upload Client Component.
- **Actions**:
    - `submitDecision(id, action, reason)`: Update `PricingDecisions`.

---

## 3. FRONTEND DESIGN (Next.js App Router)
- **Stack**: Tailwind, Shadcn/UI, Recharts.
- **State**: React Server Components (RSC) for data, minimal client state.

---

## 4. DATA FLOW & LOGIC

### 4.1. Time-Travel OTB Logic (TypeScript)
```typescript
// Pseudo-code for Server Action
async function rebuildOTB(hotelId: string, asOfDate: Date) {
  // 1. Fetch valid bookings
  const bookings = await prisma.reservationsRaw.findMany({
    where: {
      hotelId,
      bookingDate: { lte: asOfDate }
    }
  });

  const dailyStats = new Map();

  for (const b of bookings) {
     const isCancelled = b.status === 'cancelled';
     const cancelDate = b.cancelDate ? new Date(b.cancelDate) : null;
     
     // Logic: Active if booked OR (cancelled AFTER asOfDate)
     const isActive = !isCancelled || (cancelDate && cancelDate > asOfDate);

     if (isActive) {
        // Explode Nights Logic in JS
        const nights = differenceInDays(b.departureDate, b.arrivalDate);
        if (nights <= 0) continue;
        
        const dailyRev = b.revenue / nights;
        const dailyRooms = b.rooms; // usually rooms/stay, need verification if rooms is per night or total. Spec implies Total.

        for (let i = 0; i < nights; i++) {
            const date = addDays(b.arrivalDate, i);
            // Accumulate to Map
        }
     }
  }
  // Batch Upsert to DB
}
```

---

## 4. TEST SCENARIOS (Updated)

Toàn bộ test phải chạy trong context của `hotel_id`.

- [ ] **TC-01 Multi-tenant**: User Hotel A không thấy dữ liệu Hotel B.
- [ ] **TC-02 Import Job**: Upload file -> Tạo `IMPORT_JOB` status `processing` -> `completed`.
- [ ] **TC-03 Explode Nights**: Booking 2 đêm, 200$. OTB ngày 1 = 100$, ngày 2 = 100$. Guard `num_nights <= 0`.
- [ ] **TC-04 Audit Decision**: Khi Override, phải lưu `system_price` cũ để so sánh.
- [ ] **TC-05 Unique Recommendations**: Chạy job 2 lần cùng ngày, không sinh duplicates.
