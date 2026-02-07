# 📉 Technical Spec: Rate Shopper Module (v01.4.0)

**Status:** Final — Scope & Safety Review Applied
**Owner:** Engineering Team
**Date:** 2026-02-07
**Scope:** Phase 1 — Rule-based, audit được, kiểm soát chi phí, multi-tenant SaaS

---

## 1. Overview

Module cung cấp khả năng so sánh giá phòng của khách sạn (My Hotel) với bộ đối thủ (Compset) theo thời gian (định kỳ + refresh có kiểm soát).

Dữ liệu Compset lấy từ **Google Hotels** thông qua **SerpApi** để có độ phủ OTA rộng (Agoda, Booking, Expedia, Official…).

> [!WARNING]
> **KHÔNG giả định** "final price bao gồm thuế/phí". Cần lưu cả giá `before_taxes_fees` nếu có và gắn cờ `dataConfidence`.

### 🎯 Mục tiêu

| Goal | Mô tả |
|------|--------|
| **Monitor** | Theo dõi giá Compset theo horizon: 7 / 14 / 30 / 60 / 90 ngày tới |
| **Compare** | My Rate (BAR từ Pricing Engine) vs Market (Min / Median / Avg / Max) |
| **Alert** | Cảnh báo khi My Rate lệch thị trường quá ngưỡng theo horizon |
| **Recommend** | Kết hợp OTB/Pickup + Market → đề xuất điều chỉnh BAR (rule-based, guardrails) |

### 🔒 SaaS Constraint (bắt buộc)

- UI **KHÔNG** gọi SerpApi trực tiếp theo click.
- UI chỉ **đọc DB**; SerpApi chỉ gọi qua **job/scheduler** hoặc "manual scan" có **quota + lock**.

---

## 2. Architecture: Hybrid + Multi-layer Cache

### 2.1 Internal Data (My Hotel)

| | |
|---|---|
| **Nguồn** | DB nội bộ — Calculated BAR từ Pricing Engine |
| **Flow** | `PricingEngine.calculate(date)` → `MyRate` |
| **Đặc tính** | Real-time, free, audit được |

### 2.2 External Data (Compset) — SerpApi

| | |
|---|---|
| **Nguồn** | SerpApi `engine=google_hotels` |
| **Flow** | `RateShopperJob` → SerpApi → Parse → Global Cache → Tenant Views |

**Chiến lược truy vấn 2 tầng** (tối ưu chi phí + ổn định):

1. **Listing Search** theo khu vực → **discovery/batch only** (lấy `property_token` + metadata). Không dùng để lấy giá ổn định vì không đảm bảo trả đủ compset cố định.
2. **Property Details** theo `property_token` → **pricing snapshot "đúng competitor đã chọn"**. Đây là nguồn dữ liệu chính cho compset tier-1 (stable fetch).

### 2.3 Multi-layer Cache

| Layer | Mục đích | TTL |
|-------|----------|-----|
| **L0 — Vendor** | SerpApi cache nội bộ cho identical query | **~1 giờ** (SerpApi docs). Cached searches **không tính quota** nếu params identical. **Không bật `no_cache=true`** trừ debug. |
| **L1 — App DB** | `RateShopCache` table, SWR pattern | Theo horizon (mục 3.2) |
| **L2 — Global Shared** | Market rate = public → **dùng chung multi-tenant** | Matching L1 |

> [!NOTE]
> Tenant chỉ sở hữu riêng: competitor list + MyRate + OTB. Market rate data được chia sẻ qua `cacheKey`.

---

## 3. Scan Policy — Kiểm soát Chi phí

### 3.1 Horizons (Phase 1)

- **Offsets:** `[7, 14, 30, 60, 90]` — **5 điểm duy nhất** (5 check-in dates tương ứng)
- **Defaults:** LOS=1, adults=2, children=0, currency=VND, gl=vn, hl=vi *(configurable)*

> [!WARNING]
> **Phase 1 = 5 offset points.** Chart vẽ 5-node step-line (không phải 90 điểm daily).
> Full daily range (90 ngày) cần sampling strategy + budget model khác → **Phase 2**.
> Với 5 comps × 5 offsets = 25 cacheKeys/hotel. Cost = controllable.

### 3.2 TTL theo Horizon

| Horizon | Cache TTL | Stale Grace |
|---------|-----------|-------------|
| 0–14 ngày | 1–3 giờ | +2 giờ |
| 15–30 ngày | 6–12 giờ | +6 giờ |
| 31–90 ngày | 24 giờ | +12 giờ |

### 3.3 Priority Rules (refresh trước)

1. Cuối tuần / Lễ / Event
2. Competitor tier 1
3. Ngày đang "out-of-market" (gap vượt ngưỡng)
4. Ngày có pickup/OTB biến động mạnh

---

## 4. Database Schema

> [!IMPORTANT]
> **Convention alignment:** Existing schema uses `@db.Uuid` for all ID fields and `String @id @default(uuid()) @db.Uuid` pattern. New tables MUST follow this.
> Existing `Hotel` model field is `hotel_id` (not `id`). Foreign keys referencing Hotel must use `hotel_id @db.Uuid` → `references: [hotel_id]`.

### A. `Competitor` — Danh sách đối thủ

```prisma
model Competitor {
  id                   String   @id @default(uuid()) @db.Uuid
  hotel_id             String   @db.Uuid    // Tenant (My Hotel)
  name                 String
  google_place_id      String?              // Optional: Google Maps ID
  serpapi_property_token String?             // Preferred for stable fetch
  address              String?
  star_rating          Int?                 // Hạng sao (lọc apple-to-apple)
  distance_km          Float?               // Khoảng cách tới My Hotel
  tier                 Int      @default(1) // 1: Primary, 2: Secondary
  is_active            Boolean  @default(true)
  created_at           DateTime @default(now())

  rates                CompetitorRate[]
  hotel                Hotel    @relation(fields: [hotel_id], references: [hotel_id], onDelete: Cascade)

  @@unique([hotel_id, name])
  @@unique([hotel_id, serpapi_property_token])
  @@index([hotel_id])
  @@map("competitors")
}
```

### A.0 Prisma Enums (Type-safe statuses)

> [!NOTE]
> Dùng Prisma enum thay vì String để codegen type-safe, DB sạch, tránh lỗi dữ liệu rác (e.g. `"FAILED "` thừa space).

```prisma
enum CacheStatus {
  FRESH
  STALE
  REFRESHING
  FAILED
  FAILED_PERMANENT
}

enum AvailabilityStatus {
  AVAILABLE
  SOLD_OUT
  NO_RATE
}

enum DataConfidence {
  HIGH
  MED
  LOW
}

enum RequestStatus {
  PENDING
  SUCCESS
  FAILED
}

enum RecommendationStatus {
  DRAFT
  ACKNOWLEDGED
  APPLIED
  IGNORED
}

enum DemandStrength {
  WEAK
  NORMAL
  STRONG
}

enum QueryType {
  LISTING
  PROPERTY_DETAILS
}

enum Provider {
  SERPAPI
}
```

### B. `RateShopCache` — Global Cache (multi-tenant shared)

```prisma
model RateShopCache {
  id               String      @id @default(uuid()) @db.Uuid
  cache_key        String      @unique          // sha256(canonical_params_sorted)
  query_type       QueryType                    // LISTING | PROPERTY_DETAILS
  canonical_params Json                         // normalized params → SerpApi

  // ---- Materialized Columns (from canonical_params, for fast filtering) ----
  check_in_date    DateTime    @db.Date
  check_out_date   DateTime    @db.Date
  property_token   String?
  offset_days      Int                          // 7|14|30|60|90
  adults           Int         @default(2)
  children         Int         @default(0)
  currency         String      @default("VND")

  fetched_at       DateTime    @default(now())
  expires_at       DateTime
  stale_until      DateTime                     // SWR: serve stale until this

  status           CacheStatus @default(FRESH)
  is_vendor_cache_hit Boolean  @default(false)

  provider         Provider    @default(SERPAPI)
  serpapi_search_id String?
  http_status      Int?
  error_message    String?

  raw_response     Json?                        // Full JSON (nếu nhỏ)
  raw_response_ref String?                      // Object storage URL (nếu lớn)

  // ---- Lock & Backoff ----
  refresh_lock_until DateTime?                  // Anti-stampede lock
  refreshing_request_id String?  @db.Uuid       // Manual scan request that triggered current refresh (for coalesce audit)
  fail_streak      Int         @default(0)
  backoff_until    DateTime?

  rates            CompetitorRate[]
  requests         RateShopRequest[]

  @@index([expires_at])
  @@index([status])
  @@index([query_type, check_in_date])
  @@index([property_token, check_in_date])
  @@index([offset_days, expires_at])
  @@index([status, backoff_until, expires_at])   // Scheduler composite
  @@index([check_out_date])                      // Retention cleanup
  @@map("rate_shop_cache")
}
```

> [!NOTE]
> **Materialized columns:** canonical_params JSON vẫn giữ nguyên để cacheKey stable. Các cột materialized được populate cùng lúc insert/update, phục vụ query nhanh cho scheduler + retention cleanup. Không cần parse JSON ở runtime.

### B.1 CHECK Constraints (SQL Migration)

> [!CAUTION]
> Thêm CHECK constraints để tránh data bẩn. **Phải add trong migration SQL** (Prisma không hỗ trợ CHECK native):

```sql
-- Property token bắt buộc khi PROPERTY_DETAILS
ALTER TABLE rate_shop_cache
  ADD CONSTRAINT chk_property_token_required
  CHECK (query_type != 'PROPERTY_DETAILS' OR property_token IS NOT NULL);

-- Offset chỉ nhận whitelist values
ALTER TABLE rate_shop_cache
  ADD CONSTRAINT chk_offset_days_valid
  CHECK (offset_days IN (7, 14, 30, 60, 90));
```

### B.2 Raw Response Storage Security

> [!CAUTION]
> `raw_response_ref` (object storage URL) **phải là signed URL** (expiring, 1h max) hoặc chỉ trả qua admin endpoint.
> Không bao giờ embed URL chiếu thẳng vào FE response. Nếu dùng Supabase Storage: `createSignedUrl(path, 3600)`.

### C. `RateShopRequest` — Tenant Audit Log

> [!NOTE]
> `cache_key` là FK relation tới `RateShopCache.cache_key` → cho phép Prisma join trực tiếp.

```prisma
model RateShopRequest {
  id                    String        @id @default(uuid()) @db.Uuid
  hotel_id              String        @db.Uuid
  cache_key             String                  // FK → RateShopCache.cache_key
  check_in_date         DateTime      @db.Date
  length_of_stay        Int           @default(1)
  adults                Int           @default(2)
  status                RequestStatus @default(PENDING)
  requested_at          DateTime      @default(now())
  requested_date        DateTime      @db.Date  // getVNDate() — for max_scans_per_day enforcement

  provider              Provider      @default(SERPAPI)
  estimated_searches    Int           @default(1)
  credit_consumed       Boolean       @default(false) // true chỉ khi actual vendor call
  coalesced_to_request_id String?     @db.Uuid         // nếu coalesced → ID request đã trigger refresh
  query_type            QueryType?
  http_status           Int?
  error_message         String?

  cache                 RateShopCache @relation(fields: [cache_key], references: [cache_key], onDelete: Restrict)

  @@index([hotel_id, check_in_date])
  @@index([cache_key])
  @@index([hotel_id, requested_date])     // Quota: manual scans per day
  @@map("rate_shop_requests")
}
```

> [!IMPORTANT]
> **Hai loại quota khác nhau:**
>
> | Quota | Đếm gì | Mục đích |
> |-------|---------|--------|
> | **`max_manual_scans_per_day`** | Mọi `RateShopRequest` được tạo (kể cả coalesced) | Chặn spam UI click |
> | **`quota_cap` (monthly searches)** | Chỉ khi `credit_consumed=true` (tenant acquire lock + vendor call) | Kiểm soát cost thật |
>
> ```typescript
> // Manual scan check (trước khi tạo request):
> const todayScans = await prisma.rateShopRequest.count({
>   where: { hotel_id, requested_date: getVNDate() },
> });
> if (todayScans >= MAX_MANUAL_SCANS_PER_DAY) throw new Error('daily scan limit');
> ```

> [!IMPORTANT]
> **Metering rule:** Update usage tables chỉ khi `credit_consumed=true`. Set `credit_consumed` sau khi refresh:
> - `is_vendor_cache_hit=true` → `credit_consumed=false` (không tính quota)
> - else → `credit_consumed=true` + atomic increment usage:
>   ```sql
>   UPDATE rate_shop_usage_daily SET searches_used = searches_used + 1 WHERE usage_date = $vn_date;
>   UPDATE rate_shop_usage_tenant_monthly SET searches_used = searches_used + 1 WHERE hotel_id = $hid AND billing_month = $month;
>   ```
>
> **Conservative billing fallback (v01.3.9):** Nếu POC chưa xác định được tín hiệu vendor cache hit từ SerpApi response → mặc định `credit_consumed=true` cho mọi vendor call. `is_vendor_cache_hit` vẫn log để quan sát, nhưng **không** quyết định charge cho đến khi POC xác minh.

### D. `CompetitorRate` — Parsed Prices

```prisma
model CompetitorRate {
  id                       String             @id @default(uuid()) @db.Uuid
  competitor_id            String             @db.Uuid
  cache_id                 String             @db.Uuid
  shop_request_id          String?            @db.Uuid   // Optional tenant audit link

  check_in_date            DateTime           @db.Date
  length_of_stay           Int

  currency                 String

  // ---- Nightly ---- (Decimal(14,0) cho VND — không có phần lẻ)
  rate_per_night_lowest    Decimal?           @db.Decimal(14,0)
  rate_per_night_before_tax Decimal?          @db.Decimal(14,0)

  // ---- Total (LOS) ----
  total_rate_lowest        Decimal?           @db.Decimal(14,0)
  total_rate_before_tax    Decimal?           @db.Decimal(14,0)

  price_str                String?              // Raw text: "₫2,500,000"

  source                   String
  room_name                String?
  rate_description         String?

  availability_status      AvailabilityStatus @default(AVAILABLE)
  data_confidence          DataConfidence     @default(MED)

  is_lowest                Boolean            @default(false)
  scraped_at               DateTime           @default(now())

  competitor               Competitor    @relation(fields: [competitor_id], references: [id], onDelete: Cascade)
  cache                    RateShopCache @relation(fields: [cache_id], references: [id], onDelete: Cascade)
  request                  RateShopRequest? @relation(fields: [shop_request_id], references: [id], onDelete: SetNull)

  @@index([competitor_id, check_in_date])
  @@index([cache_id])
  @@map("competitor_rates")
}
```

> [!IMPORTANT]
> **Dedup Strategy (Phase 1):** Mỗi refresh theo `cache_id` → **delete old rows** của `(competitor_id, check_in_date, length_of_stay)` rồi insert mới.

> [!CAUTION]
> **Fan-out Rule:** `RateShopCache` là global. Sau khi parse response, phải **fan-out** tới **tất cả** competitors có cùng `property_token`:
> ```
> RateShopperRefreshJob(cacheKey):
>   1. Parse SerpApi response
>   2. Query: Competitor WHERE serpapi_property_token = property_token AND is_active = true
>   3. For EACH matched competitor: delete-then-insert CompetitorRate rows
> ```
> Nếu không fan-out → chỉ tenant gọi manual scan mới có data → shared cache mất ý nghĩa.

### E. `MarketSnapshot` — Aggregated View (per Hotel × Date)

> [!NOTE]
> **Tích hợp OTB:** Bảng này kết hợp dữ liệu Market (external) + OTB/Pickup (internal) thành 1 snapshot để Recommendation Engine đọc nhanh.
> **Lưu ý:** Bảng hiện tại `features_daily` đã có `pickup_t7`, `pickup_t3`. MarketSnapshot sẽ **reference** dữ liệu đó, không duplicate.

> [!IMPORTANT]
> **Option A — Daily Snapshot (Phase 1):** Mỗi ngày chỉ tạo **1 snapshot** per key (upsert). Cache có thể refresh nhiều lần/ngày nhưng MarketSnapshot chỉ build 1 lần/ngày (cuối ngày hoặc sau refresh cuối cùng). Spike detection = **day-over-day** (so hôm nay vs hôm qua), không phải rolling 24h.
>
> **Lý do:** TTL 1-3h → nhiều refreshes/ngày, nhưng tạo nhiều snapshot/ngày gây phình DB + spike noise. Daily snapshot đủ cho Phase 1 rule-based engine.

```prisma
model MarketSnapshot {
  id                  String          @id @default(uuid()) @db.Uuid
  hotel_id            String          @db.Uuid
  check_in_date       DateTime        @db.Date
  snapshot_date       DateTime        @db.Date   // Set bằng code: getVNDate() — KHAM  dùng DB default
  length_of_stay      Int             @default(1)
  adults              Int             @default(2)
  currency            String

  // ---- My Hotel (VND = Decimal(14,0), no cents) ----
  my_rate             Decimal         @db.Decimal(14,0)

  // ---- Compset Aggregates ----
  comp_min            Decimal?        @db.Decimal(14,0)
  comp_median         Decimal?        @db.Decimal(14,0)
  comp_avg            Decimal?        @db.Decimal(14,0)
  comp_max            Decimal?        @db.Decimal(14,0)
  comp_available_count Int            @default(0)

  // ---- Quality ----
  market_confidence   DataConfidence  @default(MED)
  sold_out_count      Int             @default(0)
  no_rate_count       Int             @default(0)

  // ---- Derived Metrics ----
  price_index         Decimal?        @db.Decimal(6,4)
  price_gap_pct       Decimal?        @db.Decimal(6,4)

  // ---- OTB Context (from features_daily) ----
  otb_rooms           Int?
  pickup_1d           Int?
  pickup_3d           Int?
  pickup_7d           Int?
  pace_index          Decimal?        @db.Decimal(6,4)

  // ---- Demand & Compression ----
  demand_strength     DemandStrength?
  compression_flag    Boolean         @default(false)

  // ---- Lifecycle ----
  is_latest           Boolean         @default(true)
  calculated_at       DateTime        @default(now())

  hotel               Hotel           @relation(fields: [hotel_id], references: [hotel_id], onDelete: Cascade)
  recommendations     RateShopRecommendation[]

  @@unique([hotel_id, check_in_date, length_of_stay, adults, snapshot_date])
  @@index([hotel_id, check_in_date])
  @@index([hotel_id, check_in_date, is_latest])
  @@map("market_snapshots")
}
```

> [!NOTE]
> **Partial unique index (SQL migration):** Để đảm bảo không có 2 bản `is_latest=true` cho cùng key, thêm tại SQL migration:
> ```sql
> CREATE UNIQUE INDEX market_snapshots_latest_unique
> ON market_snapshots (hotel_id, check_in_date, length_of_stay, adults)
> WHERE is_latest = true;
> ```

### F. `RateShopRecommendation` — Decision Support (Phase 1)

> [!IMPORTANT]
> Bảng hiện tại `price_recommendations` phục vụ Pricing Engine (forecasting-based). Bảng mới `rate_shop_recommendations` phục vụ chuyên cho **Market-based recommendations**. Hai bảng **bổ sung** lẫn nhau: GM có thể xem cả hai.

```prisma
model RateShopRecommendation {
  id                    String               @id @default(uuid()) @db.Uuid
  hotel_id              String               @db.Uuid
  check_in_date         DateTime             @db.Date
  length_of_stay        Int                  @default(1)
  adults                Int                  @default(2)

  current_rate          Decimal              @db.Decimal(14,0)
  recommended_rate      Decimal              @db.Decimal(14,0)
  delta_pct             Decimal              @db.Decimal(6,4)

  demand_strength       DemandStrength
  reason_codes          Json                 // ["OUT_OF_MARKET_HIGH","WEAK_PICKUP_7D",...]

  market_snapshot_id    String?              @db.Uuid
  market_snapshot       MarketSnapshot?      @relation(fields: [market_snapshot_id], references: [id], onDelete: SetNull)

  created_at            DateTime             @default(now())
  status                RecommendationStatus @default(DRAFT)

  hotel                 Hotel                @relation(fields: [hotel_id], references: [hotel_id], onDelete: Cascade)

  @@index([hotel_id, check_in_date])
  @@map("rate_shop_recommendations")
}
```

### G. Hotel Model Update

```diff
model Hotel {
  ...
+ competitors             Competitor[]
+ market_snapshots        MarketSnapshot[]
+ rate_shop_recommendations RateShopRecommendation[]
}
```

> [!CAUTION]
> **Timezone trap:** Supabase/PG thường chạy UTC. `CURRENT_DATE` = UTC date. Ở 23:00 VN (16:00 UTC) → CURRENT_DATE vẫn là đúng. Nhưng ở 00:30 VN (17:30 UTC ngày hôm trước) → LệCH NGÀY.
> **Rule:** **KHAM dùng `dbgenerated("CURRENT_DATE")`** cho `usage_date` và `snapshot_date`. Thay vào đó, set explicit bằng code:
> ```typescript
> const vnDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
> // Output: "2026-02-07" (ISO format, VN timezone)
> ```

```prisma
model RateShopUsageDaily {
  id               String   @id @default(uuid()) @db.Uuid
  usage_date       DateTime @db.Date             // Set bằng code: getVNDate()
  searches_used    Int      @default(0)
  budget_cap       Int      @default(1000)
  safe_mode_on     Boolean  @default(false)

  @@unique([usage_date])
  @@map("rate_shop_usage_daily")
}

model RateShopUsageTenantMonthly {
  id               String   @id @default(uuid()) @db.Uuid
  hotel_id         String   @db.Uuid
  billing_month    String                        // "2026-02" (YYYY-MM, VN timezone)
  searches_used    Int      @default(0)
  quota_cap        Int      @default(500)

  hotel            Hotel    @relation(fields: [hotel_id], references: [hotel_id], onDelete: Cascade)

  @@unique([hotel_id, billing_month])
  @@map("rate_shop_usage_tenant_monthly")
}
```

**Enforce rules:**
| Check | When | Block if |
|-------|------|----------|
| Tenant monthly quota | Manual scan | `searches_used ≥ quota_cap` |
| System daily budget | Manual scan + Scheduler | `searches_used ≥ budget_cap` → Safe Mode |

> [!NOTE]
> Usage increment phải **atomic** (SQL `SET searches_used = searches_used + 1` trong transaction), vì refresh jobs chạy song song.

### I. Prisma Date Implementation Note

> [!CAUTION]
> **Cột `@db.Date`** (`check_in_date`, `check_out_date`, `snapshot_date`, `usage_date`): **luôn insert/compare bằng string `"YYYY-MM-DD"`**, không dùng `new Date()` object.
>
> Lý do: Prisma serialize `Date` object thành ISO timestamp có timezone → PostgreSQL có thể interpret sai ngày. Prisma hỗ trợ truyền string trực tiếp cho `@db.Date`.

```typescript
// ✅ Đúng:
await prisma.marketSnapshot.create({
  data: { snapshot_date: getVNDate(), ... }  // "2026-02-07"
});

// ❌ Sai (có thể lệch ngày):
await prisma.marketSnapshot.create({
  data: { snapshot_date: new Date(), ... }   // timezone shift risk
});
```

---

## 5. Canonical Params & Cache Key

### 5.1 Canonical Params (chuẩn hoá 100%)

Mọi request phải explicit đầy đủ defaults → tăng cache-hit:

```typescript
interface CanonicalParams {
  engine: "google_hotels";
  check_in_date: string;   // YYYY-MM-DD
  check_out_date: string;  // YYYY-MM-DD
  adults: number;          // default: 2
  children: number;        // default: 0
  children_ages?: number[]; // Phase 2: family pricing (e.g., [5, 10])
  currency: string;        // default: "VND"
  gl: string;              // default: "vn"
  hl: string;              // default: "vi"
  // --- Conditional ---
  property_token?: string; // PROPERTY_DETAILS
  q?: string;              // LISTING (lat,lng or location string)
}
```

### 5.2 CacheKey Generation

```typescript
cacheKey = sha256(JSON.stringify(sortKeys(canonicalParams)))
```

### 5.3 Cache Read Rule (SWR)

| Condition | Action |
|-----------|--------|
| `now < expiresAt` | **FRESH** → read DB, 0 API call |
| `expiresAt ≤ now < staleUntil` | **STALE** → serve cache + enqueue refresh (if not locked) |
| `now ≥ staleUntil` | **EXPIRED** → must refresh (lock-aware) |

---

## 6. Anti-Spam & Stampede Control

### 6.1 Refresh Lock (Atomic Semantics)

- `refresh_lock_until` per `cacheKey` trên `RateShopCache`
- Lock duration: 5 phút (configurable)

**`lockAndRefresh(cacheKey)` phải:**
```sql
-- Atomic: chỉ acquire khi lock hết hạn hoặc chưa có
UPDATE rate_shop_cache
SET    refresh_lock_until = now() + interval '5 min',
       status = 'REFRESHING'
WHERE  cache_key = $1
  AND  (refresh_lock_until IS NULL OR refresh_lock_until < now())
RETURNING id;

-- Nếu 0 rows returned → lock đã bị giữ → return "already refreshing"
-- Nếu 1 row → proceed fetch → sau khi fetch xong:
--   SET fetched_at, expires_at, stale_until (theo TTL policy), status = 'FRESH',
--       refresh_lock_until = NULL
```

> [!NOTE]
> Dùng Prisma `$executeRaw` hoặc `$transaction` với isolation level để đảm bảo atomic. Không dùng read-then-write pattern (race condition).

### 6.2 Coalescing & Billing Rules

- N tenant cùng request cùng `cacheKey` → **chỉ 1 refresh job**
- Các request khác join trạng thái `REFRESHING`
- UI hiển thị "Refreshing…" + last snapshot

> [!IMPORTANT]
> **Billing rules cho 3 tình huống:**
>
> | Scenario | credit_consumed | System Daily | Tenant Monthly |
> |----------|----------------|--------------|----------------|
> | **(A) Scheduler refresh** (no manual request) | N/A (no RateShopRequest) | **+1 luôn** (nếu vendor call thật — không phụ thuộc `is_vendor_cache_hit` cho đến khi POC) | Không tính |
> | **(B) Manual scan → coalesce** (2+ tenants cùng cacheKey) | Request acquire lock = `true`. Requests coalesced = `false` + set `coalesced_to_request_id` | +1 lần duy nhất | +1 cho tenant gây trigger. Tenants coalesced = 0 |
> | **(C) Manual scan → cache FRESH/STALE** (no vendor call) | `false` | 0 | 0 |
>
> **Rule đơn giản Phase 1:** Ai trigger refresh (acquire lock) thì bị charge. Ai được "đi nhờ" (coalesced) thì không. `is_vendor_cache_hit=true` → không ai bị charge.
>
> **Scheduler đặc biệt:** không tạo RateShopRequest, nhưng **vẫn phải tăng** `RateShopUsageDaily.searches_used` khi vendor call → để enforce system budget cap. Job log phải ghi `search_id`, `cache_key`, `duration` cho observability.

### 6.3 Error Handling & Backoff

> [!CAUTION]
> Không có backoff → SerpApi fail liên tục → spam retry → "đốt" quota.

| Condition | Action |
|-----------|--------|
| **HTTP 429 (Rate Limit)** | Backoff 5m → 15m → 60m. Set `status=FAILED`, `error_message`. Không refresh lại trong backoff window. |
| **HTTP 5xx (Server Error)** | Backoff 5m → 15m → 60m. Tương tự 429. |
| **HTTP 200 nhưng NO_RATE** | Giữ stale data + retry nhẹ (backoff 1h → 3h → 6h). Không spam refresh. (đã ghi ở §9.3) |
| **Timeout** | Treat như 5xx. |
| **`status=FAILED` quá 3 lần liên tiếp** | Alert admin + Safe Mode cho cacheKey đó (không retry nữa cho đến khi manual reset). |

---

## 7. Cost Guardrails (SaaS)

### 7.1 Tenant Quota

| Config | Default |
|--------|---------|
| `max_manual_scans_per_day` | 5 |
| `max_searches_per_month` | 500 (1 search = 1 SerpApi credit) |

Vượt quota → chỉ đọc cache (không manual refresh).

### 7.2 System Budget Cap

- Giới hạn tổng credits/ngày toàn hệ thống
- Khi vượt → **Safe Mode:**
  - Tăng TTL horizon xa (31–90) lên 48h
  - Chỉ refresh horizon gần (7/14) theo lịch

### 7.3 Query Whitelist

UI chỉ cho chọn preset:

| Param | Allowed Values |
|-------|---------------|
| Offsets | 7 / 14 / 30 / 60 / 90 |
| LOS | 1 (Phase 1), 2 (optional config) |
| Adults | 2 (config) |

→ **Cấm date-range tự do** để tránh nổ cost.

---

## 8. SerpApi Integration

### 8.1 Competitor Onboarding (Autocomplete → property_token)

> [!IMPORTANT]
> **Đây là bước bắt buộc** khi thêm competitor mới. Dùng `engine=google_hotels_autocomplete` để lấy `property_token` ổn định, **không** dựa vào text search.

**Flow:**
1. User nhập tên khách sạn đối thủ
2. Backend gọi Autocomplete API → trả về danh sách gợi ý + `property_token`
3. User chọn đúng KS → save `serpapi_property_token` vào `Competitor` table
4. Từ đó, mọi rate fetch dùng Property Details (stable)

```
GET https://serpapi.com/search
  engine=google_hotels_autocomplete
  q=Vinpearl+Phu+Quoc
  currency=VND
  gl=vn
  hl=vi
```

**Response chứa:**
- `suggestions[].property_token` — dùng cho Property Details fetch
- `suggestions[].name`, `address`, `star_rating`

### 8.2 Property Details (ưu tiên — stable fetch)

```
GET https://serpapi.com/search
  engine=google_hotels
  property_token=<token>
  check_in_date=2026-03-01
  check_out_date=2026-03-02
  adults=2
  currency=VND
  gl=vn
  hl=vi
```

### 8.3 Listing Search (discovery/batch only)

> [!NOTE]
> Listing Search chỉ dùng cho **discovery** (tìm competitor mới, lấy metadata khu vực). **Không dùng** làm nguồn giá ổn định vì không đảm bảo trả đủ compset cố định.

```
GET https://serpapi.com/search
  engine=google_hotels
  q=Hotels+near+Phu+Quoc+Beach
  check_in_date=2026-03-01
  check_out_date=2026-03-02
  adults=2
  currency=VND
```

### 8.4 Response Size Control

- Small JSON (< 500KB) → lưu `raw_response` trực tiếp
- Large JSON → lưu `raw_response_ref` (S3/Supabase Storage URL)

---

## 9. Parser Rules (RMS-grade)

### 9.1 Price Extraction

| Field | Source |
|-------|--------|
| `rate_per_night_lowest` | `prices[].rate_per_night.lowest` |
| `rate_per_night_before_tax` | `prices[].rate_per_night.before_taxes_fees` |
| `total_rate_lowest` | `prices[].total_rate.lowest` |
| `total_rate_before_tax` | `prices[].total_rate.before_taxes_fees` |

### 9.2 Availability

| Condition | `availability_status` | `data_confidence` |
|-----------|-----------------------|-------------------|
| Có `prices[]` với giá hợp lệ | `AVAILABLE` | `MED+` |
| Không có `prices[]` hoặc rỗng | `NO_RATE` | `LOW` |
| SerpApi trả explicit sold-out | `SOLD_OUT` | `MED` |

### 9.3 Missing Price Anomaly Handling

> [!CAUTION]
> Google Hotels đôi khi missing price tạm thời (OTA lag, cache miss) rồi xuất hiện lại ở lần scrape sau.

| Condition | Action |
|-----------|--------|
| `NO_RATE` nhưng lần trước có rate (< 24h) | Giữ stale data lâu hơn + retry theo backoff (không spam refresh) |
| `NO_RATE` kéo dài > 24h | Đánh `data_confidence = LOW` + gắn `reasonCode: MISSING_PRICE_ANOMALY` |
| `SOLD_OUT` nhưng lần trước `AVAILABLE` | Log transition + kiểm tra compression signal |

### 9.4 Confidence Scoring

| Level | Điều kiện |
|-------|-----------|
| **HIGH** | Tier-1 competitor + có `total_rate` + ≥ 3 OTA sources |
| **MED** | Có rate nhưng ít sources hoặc thiếu `before_taxes` |
| **LOW** | Missing price / sold-out ambiguous / parse error / `MISSING_PRICE_ANOMALY` |

### 9.5 Aggregation Contract (MarketSnapshot)

> [!IMPORTANT]
> Chốt rõ cách tính aggregates để team không tự đoán.

**Rule: 1 competitor = 1 giá đại diện** (per `check_in_date`):

| Step | Logic |
|------|-------|
| 1. Chọn giá | **4-level priority:** (1) `total_rate_before_tax` (nếu có) → (2) `total_rate_lowest` → (3) `rate_per_night_before_tax × LOS` → (4) `rate_per_night_lowest × LOS`. Không đảo thứ tự (Google Hotels đôi khi `total ≠ nightly×LOS` do fee/rounding) |
| 2. Loại bỏ | SOLD_OUT và NO_RATE không tham gia aggregates (nhưng giữ `sold_out_count`, `no_rate_count`) |
| 3. Aggregate | Tính `comp_min / comp_median / comp_avg / comp_max` trên tập giá đại diện |
| 4. comp_available_count | = số competitor có giá đại diện (không tính SOLD_OUT/NO_RATE) |
| 5. market_confidence | `comp_available_count ≥ 3` AND `≥ 2 unique sources` AND `before_tax_ratio ≥ 60%` → HIGH. Else MED. `comp_available_count = 0` → LOW |

**Rounding rule (VND = Decimal(14,0)):**
| Field | Rule |
|-------|------|
| `comp_avg` | `ROUND(tổng / n)` — round half-up tới VND (0 decimals) |
| `comp_median` | median của tập integer → integer (OK, trường hợp chẵn: average 2 giữa → round) |
| `my_rate`, `recommended_rate` | integer |
| `price_index`, `gap_pct`, `delta_pct` | Decimal(6,4) — giữ nguyên precision |

### 9.6 Tax/Fee Normalization Rule (Representative Price)

> [!WARNING]
> Compset A có `total_rate_lowest` = "đã gồm thuế", Compset B = "chưa gồm" → median/avg bị lệch. Phase 1 chốt 1 rule normalize:

| Priority | Field | Condition |
|----------|-------|-----------|
| 1 | `before_taxes_fees` | Nếu tồn tại → dùng làm **representative price** (apple-to-apple hơn) |
| 2 | `total_rate_lowest` | Fallback nếu không có `before_taxes_fees` → **downgrade confidence** (HIGH → MED, MED → MED) |
| 3 | `rate_per_night * LOS` | Final fallback |

**Confidence impact:**
- `market_confidence = HIGH` chỉ khi ≥3 comps **và** tỷ lệ comps có `before_taxes_fees` ≥ 60%
- Nếu tỷ lệ `before_taxes_fees` < 60% → cap confidence ở MED
- UI badge: "⚠️ Tax/fee mixed" khi có hỗn hợp sources
- Log `before_tax_ratio` trong structured logging (observability)

---

## 10. Jobs & Services

### 10.1 Services

| Service | Trách nhiệm |
|---------|-------------|
| `SerpApiService.fetchAutocomplete(query)` | Autocomplete → lấy `property_token` khi onboard competitor |
| `SerpApiService.fetchListing(params)` | Gọi SerpApi listing search (discovery) |
| `SerpApiService.fetchPropertyDetails(params)` | Gọi SerpApi property details (pricing) |
| `CacheService.get(cacheKey)` | Read cache (SWR logic) |
| `CacheService.lockAndRefresh(cacheKey)` | Idempotent refresh with lock |

### 10.2 Jobs

| Job | Trigger | Mô tả |
|-----|---------|--------|
| `RateShopperSchedulerJob` | Cron (fixed interval) | Iterate horizons → check cache status → enqueue refresh for STALE/EXPIRED |
| `RateShopperRefreshJob(cacheKey)` | Queue/trigger | Acquire lock (set `refreshing_request_id`) → call SerpApi → write cache + fan-out rates → release (clear `refreshing_request_id`) |
| `MarketSnapshotJob` | Daily cron (end of day) hoặc manual trigger | Build/upsert snapshot cho **5 offsets per hotel** (không phải 120 ngày). Loop: `for offset of [7,14,30,60,90]` → upsert. **Transactional** (xem note dưới). |
| `DataCleanupJob` | Daily cron (off-peak) | Purge expired data theo retention policy (§15) |

> [!CAUTION]
> **MarketSnapshot transactional upsert:** Để không vi phạm partial unique index (`is_latest=true`), upsert PHẢI chạy trong transaction:
> ```typescript
> await prisma.$transaction(async (tx) => {
>   // 1. Set is_latest=false cho mọi rows cùng key đang latest
>   await tx.marketSnapshot.updateMany({
>     where: { hotel_id, check_in_date, length_of_stay, adults, is_latest: true },
>     data: { is_latest: false },
>   });
>   // 2. Upsert row của snapshot_date = vnToday với is_latest=true
>   await tx.marketSnapshot.upsert({ where: uniqueKey, create: {...}, update: {...} });
> });
> ```
> Nếu không transactional → race condition giữa job retry có thể tạo 2 latest rows.

### 10.3 Job Schedule (Phase 1 defaults)

> [!IMPORTANT]
> **Timezone:** Tất cả giờ cron được ghi theo Asia/Ho_Chi_Minh (UTC+7). Nếu hệ thống chỉ hỗ trợ UTC, dùng mapping bên dưới.

| Offsets | Cron Interval | VN Time | UTC Equivalent | Batch Limit |
|---------|--------------|---------|----------------|-------------|
| 7, 14 | Mỗi 30 phút | 24/7 | 24/7 | Max 20 cacheKeys/run |
| 30 | Mỗi 2 giờ | 24/7 | 24/7 | Max 20 cacheKeys/run |
| 60, 90 | Mỗi 6 giờ | 00:00, 06:00, 12:00, 18:00 | 17:00, 23:00, 05:00, 11:00 | Max 30 cacheKeys/run |
| **MarketSnapshotJob** | 1x/ngày | **23:00 VN** | 16:00 UTC | All hotels |
| **DataCleanupJob** | 1x/ngày | **03:00 VN** | 20:00 UTC (ngày trước) | All tables |

> [!NOTE]
> **Batch limit** để tránh Vercel function timeout (max 10–60s). Nếu còn keys chưa xử lý → scheduler tự pick up ở lần chạy kế tiếp.

### 10.4 Cron Endpoint Security

> [!CAUTION]
> Cron/Cleanup endpoints **bắt buộc** có bảo mật. Không bảo mật = ai cũng gọi được = "đốt" SerpApi quota.

| Method | Rule |
|--------|------|
| **CRON_SECRET** | Header `Authorization: Bearer <CRON_SECRET>` hoặc Vercel `x-vercel-cron-secret`. Secret lưu trong `.env`. |
| **Allowlist** | *(Optional hardening)* Chỉ chấp nhận từ Vercel Cron IP range. Không bắt buộc vì IP có thể thay đổi. |
| **Rate Limit** | Max 1 call/endpoint/10s (đề phòng retry storm). |

### 10.5 Batch Selection Algorithm

Khi scheduler chạy cho 1 offset bucket, query `RateShopCache` theo thứ tự ưu tiên:

```sql
SELECT cache_key FROM rate_shop_cache
WHERE query_type = 'PROPERTY_DETAILS'
  AND offset_days = ANY($offsets)           -- materialized column, fast index
  AND (
    status IN ('FAILED', 'STALE')
    OR expires_at < now()
    OR (status = 'REFRESHING' AND refresh_lock_until < now())  -- stuck self-heal
  )
  AND (backoff_until IS NULL OR backoff_until < now())         -- respect backoff
ORDER BY
  CASE WHEN status = 'FAILED' THEN 0 ELSE 1 END,
  expires_at ASC
LIMIT $RATE_SHOPPER_BATCH_LIMIT;
```

> [!NOTE]
> - `RATE_SHOPPER_BATCH_LIMIT` configurable via env var. Default 20, tăng dần per env.
> - **Stuck self-heal:** Nếu `status='REFRESHING'` nhưng `refresh_lock_until < now()` → coi như STALE, scheduler pick lại.
> - **Backoff respect:** Keys đang trong backoff window không được pick.

### 10.6 Cache Seeding (Scheduler Pre-population)

> [!IMPORTANT]
> Scheduler query chỉ pick từ `rate_shop_cache` đã có row. Nếu chưa có row → scheduler không refresh được. **Phải seed trước.**

**Option A (Phase 1 — khuyến nghị):** Scheduler tự seed

```typescript
// Mỗi lần scheduler chạy cho offset bucket:
// 1. Lấy danh sách property_token active
const tokens = await prisma.competitor.findMany({
  where: { is_active: true, serpapi_property_token: { not: null } },
  select: { serpapi_property_token: true },
  distinct: ['serpapi_property_token'],
});

// 2. Với mỗi token + offset: build canonical params → cacheKey
for (const { serpapi_property_token } of tokens) {
  const params = buildCanonicalParams(serpapi_property_token, offset);
  const cacheKey = generateCacheKey(params);

  // 3. Upsert RateShopCache (status=STALE) nếu chưa có
  await prisma.rateShopCache.upsert({
    where: { cache_key: cacheKey },
    create: {
      cache_key: cacheKey,
      query_type: 'PROPERTY_DETAILS',
      canonical_params: params,
      status: 'STALE',
      expires_at: new Date(0), // force refresh
      stale_until: new Date(0),
      ...populateMaterializedColumns(params),
    },
    update: {}, // no-op if exists
  });
}

// 4. SAU seed mới chạy selection query
```

> [!NOTE]
> Seed chỉ upsert (no-op nếu đã có row). Không gây duplicate. Không cần manual traffic để module bắt đầu monitor.

---

## 11. UI/UX Plan

### 11.0 Data Layers (Intraday vs Daily)

> [!IMPORTANT]
> **Trade-off Option A:** MarketSnapshot build 1x/ngày → Recommendation/KPI/Spike chỉ update daily. Để bù, UI hiển thị **2 lớp dữ liệu**:

| Layer | Nguồn | Mục đích | Refresh |
|-------|--------|----------|--------|
| **Intraday View** | `RateShopCache` + `CompetitorRate` (latest `scraped_at`) | Chart/Table "real-time-ish" — GM thấy giá đối thủ mới nhất sau mỗi cache refresh | Mỗi 30m–6h (theo horizon TTL) |
| **Daily Snapshot View** | `MarketSnapshot` (`is_latest=true`) | Lịch sử, KPI benchmark, Spike day-over-day, Recommendation | 1x/ngày (23:00 VN) |

**Intraday View Model (backend trả về cho FE, tenant-scoped):**

```typescript
interface IntradayViewModel {
  offset: number;               // 7|14|30|60|90
  check_in_date: string;        // YYYY-MM-DD
  my_rate: number;              // Decimal → integer
  competitors: {
    competitor_id: string;
    name: string;
    representative_price: number | null;
    availability_status: AvailabilityStatus;
    data_confidence: DataConfidence;
    source: string;              // normalized OTA name
    scraped_at: string;          // ISO timestamp
  }[];
  cache_status: CacheStatus;    // FRESH|STALE|REFRESHING|FAILED
  cache_fetched_at: string;     // ISO timestamp ("as-of")
  tax_fee_mixed: boolean;       // badge "Tax/fee mixed"
  before_tax_ratio: number;     // 0–1
}
```

> [!NOTE]
> FE không đọc `RateShopCache` trực tiếp. Backend build view model từ:
> `CompetitorRate (qua competitor.hotel_id)` + `RateShopCache (qua rate.cache_id)` + `cache.status/fetched_at`.
> Response không chứa `raw_response`.

**Phase 1 chart:** 5-node step-line (5 offsets). Không phải 90 điểm daily.

**Rule cho Recommendation Engine (Phase 1):** Chạy theo daily snapshot (ít nhiễu). Nếu cần, có thể thêm **Intraday Alert** (chỉ flag, không kem) khi price gap vượt ngưỡng ngay lúc refresh cache.

### 11.1 Dashboard

**Line Chart** (horizon 7–90):
- 🟢 My Price
- 🔴 Comp Min
- ⚪ Comp Median
- Toggle: "Intraday" (latest cache) / "Daily" (snapshots)

**Status Badges:** `FRESH` / `STALE` / `REFRESHING` / `FAILED`
**Timestamp:** "Data as of: {scraped_at}" (intraday) hoặc "Snapshot: {calculated_at}" (daily)

### 11.2 Detailed Table

| Date | My Rate | Comp Min | Comp Median | Comp Max | Gap% | Confidence | Alert | Recommendation |
|------|---------|----------|-------------|----------|------|------------|-------|---------------|

- 🔴 Highlight: Out-of-market HIGH
- 🟢 Highlight: Out-of-market LOW
- ⚪ Gray: LOW confidence (no strong recommendation)

### 11.3 Manual Refresh

Nút **"Scan Now":**
1. Tạo `RateShopRequest` (audit)
2. Enqueue `RateShopperRefreshJob`
3. **KHÔNG** gọi SerpApi trực tiếp từ FE
4. Check quota trước khi cho phép

### 11.4 Config Panel

- CRUD Competitor: search by name dùng **`engine=google_hotels_autocomplete`** → chọn từ gợi ý → save `property_token`
- Chỉnh tần suất quét (Auto/Manual)
- Xem API usage / quota remaining
- Xem data retention status (dung lượng cache, snapshot count)

### 11.5 Route Structure

| Route | Mục đích |
|-------|---------|
| `/pricing/rate-shopper` | Dashboard chính (chart + table + intraday/daily toggle + scan + alerts) |
| `/pricing/competitors` | Compset config (autocomplete → add/edit/delete competitors + quota) |

> [!NOTE]
> Tách route để BA/UX rõ ràng: "rate-shopper" = market data, "competitors" = quản lý danh sách đối thủ.

### 11.6 Multi-tenant Data Access Hardening

> [!CAUTION]
> Cache là **shared** nhưng UI data là **tenant-scoped**. Luôn enforce:

| Rule | Detail |
|------|--------|
| **API read filter** | Mọi query trả dữ liệu cho FE phải filter `hotel_id` (từ session). Không bao giờ query RateShopCache trực tiếp bằng `cacheKey` tùy ý |
| **CompetitorRate** | Scoped qua `competitor_id` thuộc hotel của tenant |
| **MarketSnapshot** | Scoped qua `hotel_id` |
| **raw_response** | **Không** expose cho FE. Chỉ admin/debug. Không gửi về client |
| **RateShopCache** | FE không đọc trực tiếp. Dữ liệu flow qua CompetitorRate/MarketSnapshot |
| **Usage tables** | Tenant chỉ thấy quota của hotel mình |

---

## 12. Pricing Logic Integration — RMS Decision Support (Phase 1)

### 12.1 Metrics (per hotel × checkInDate × LOS × adults)

**From OTB (Internal):**
- `otb_rooms`, `otb_revenue`
- `pickup_1d`, `pickup_3d`, `pickup_7d`
- `pace_index` (from `features_daily.pace_vs_ly` nếu có, else rolling baseline)

**From Market (External):**
- `comp_min`, `comp_median`, `comp_avg`, `comp_max`
- `comp_available_count`, `market_confidence`

**Combined:**
- `price_index = my_rate / comp_median`
- `price_gap_pct = (my_rate - comp_median) / comp_median`

### 12.2 Alert Rules

**Thresholds theo horizon (default, configurable):**

| Horizon | HIGH threshold | LOW threshold |
|---------|---------------|---------------|
| 0–14 ngày | +6% | -6% |
| 15–30 ngày | +8% | -8% |
| 31–90 ngày | +10% | -10% |

**Alert conditions:**

| Alert | Condition |
|-------|-----------|
| `OUT_OF_MARKET_HIGH` | `price_gap_pct > high_threshold` AND `confidence ≠ LOW` |
| `OUT_OF_MARKET_LOW` | `price_gap_pct < low_threshold` AND `confidence ≠ LOW` |
| `MARKET_DATA_LOW_CONFIDENCE` | `confidence = LOW` OR `comp_available_count < 3` |

### 12.3 Demand Strength

| Strength | Condition |
|----------|-----------|
| **STRONG** | `pace_index > 1.1` OR `pickup_7d` vượt band cao |
| **NORMAL** | `pace_index ~ 0.9–1.1` |
| **WEAK** | `pace_index < 0.9` OR pickup thấp kéo dài |

### 12.4 Recommendation Engine (Phase 1 — Rule-based)

**Target band theo horizon:**

| Horizon | Target Band (±median) |
|---------|----------------------|
| 0–14 ngày | ±2% |
| 15–30 ngày | ±3% |
| 31–90 ngày | ±4% |

**Guardrails:**

| Param | 0–14d | 15–30d | 31–90d |
|-------|-------|--------|--------|
| `step_pct` | 1–2% | 1–2% | 1–2% |
| `max_change_pct` | ±5% | ±7% | ±10% |

- `floor_rate` / `ceiling_rate`: từ Pricing Engine
- `cool_down`: chỉ adjust tiếp nếu gap vẫn vượt ngưỡng + demand không cải thiện
- `confidence = LOW` → **no strong recommendation**, chỉ cảnh báo

**Decision Matrix:**

| Demand | OUT_OF_MARKET_HIGH | OUT_OF_MARKET_LOW | In-Market |
|--------|-------------------|-------------------|-----------|
| **WEAK** | Giảm → gần `median*(1+band)` | Giữ | Giữ hoặc giảm nhẹ (horizon gần) |
| **NORMAL** | Giảm nhẹ 1–2 step | Tăng nhẹ 1 step | Giữ |
| **STRONG** | Watch flag (pickup mạnh) | Tăng 1–3 step (horizon gần) | Tăng nhẹ 1 step |

---

## 13. Advanced Signals (Phase 1)

### 13.1 Compression Signal (Market Tightening)

Phát hiện khi thị trường "siết cung" → tránh underpricing.

**Rule (default):**
```
IF (sold_out_ratio ≥ 0.4 OR (sold_out_ratio + no_rate_ratio) ≥ 0.5)
   AND demand_strength IN {NORMAL, STRONG}
→ Alert: MARKET_COMPRESSION
```

**Impact:**
- `COMPRESSION + STRONG`: cho phép tăng thêm +1 step (trong guardrail)
- `COMPRESSION + NORMAL`: giữ hoặc tăng nhẹ
- `confidence = LOW`: chỉ cảnh báo, không tăng

### 13.2 Event Spike / Market Shock

Phát hiện biến động bất thường **day-over-day** (so sánh snapshot hôm nay vs hôm qua cho cùng `check_in_date`).

**Rule:**
```
const vnToday = getVNDate();       // "2026-02-07"
const vnYesterday = vnDateMinus(1); // "2026-02-06"

market_spike_up:   comp_median_today ≥ comp_median_yesterday * 1.08
market_spike_down: comp_median_today ≤ comp_median_yesterday * 0.92

// "yesterday" = snapshot có snapshot_date = vnYesterday AND cùng check_in_date
// KHÔNG dùng CURRENT_DATE (DB timezone = UTC → lệch ngày)
```

**Impact:**
- `Spike UP + STRONG`: tăng 1–2 step
- `Spike DOWN + WEAK`: giảm 1–2 step (horizon gần)
- `Spike + NORMAL`: watch + small step

---

## 14. Configuration Defaults

| Category | Param | Default |
|----------|-------|---------|
| Scan | `offsets` | `[7,14,30,60,90]` |
| Scan | `los` | 1 |
| Scan | `adults` | 2 |
| Scan | `children` | 0 |
| Cache | TTL policy | Theo horizon (mục 3.2) |
| Alert | Out-of-market thresholds | Theo horizon (mục 12.2) |
| Signal | Compression thresholds | sold_out ≥ 0.4 (mục 13.1) |
| Signal | Spike thresholds | ±8% (mục 13.2) |
| Quota | `max_manual_scans_per_day` | 5 |
| Quota | `max_searches_per_month` | 500 (1 search = 1 SerpApi credit) |
| Cron | `CRON_SECRET` | Required in `.env` (see §10.4) |
| Cron | Timezone | `Asia/Ho_Chi_Minh` (UTC+7) |

---

## 15. Data Retention & Storage Policy

> [!WARNING]
> Không có retention policy → DB phình không kiểm soát. Bắt buộc từ Phase 1.

| Data | Retention | Cleanup |
|------|-----------|---------|
| `RateShopCache.raw_response` | 7 ngày (DB) hoặc 14 ngày (object storage ref). Purge theo `check_out_date < vnTodayMinus(7)` (materialized column, indexed) | Cron job SET `raw_response = null` khi quá TTL, giữ `raw_response_ref` nếu cần audit |
| `CompetitorRate` | Purge theo `check_in_date < vnTodayMinus(7)` (stay đã qua xa) HOẶC `scraped_at < now() - 90d` (data quá cũ cho future dates) | Cron job. **Lưu ý:** `check_in_date` purge xảy ra sớm (7d sau stay) — "90d" chỉ áp dụng cho dữ liệu future dates chưa tới check-in |
| `MarketSnapshot` | `is_latest=true`: giữ cho `check_in_date` trong range `[vnTodayMinus(7), +120d]`. Ngoài range → purge. `is_latest=false`: giữ 3 ngày (đủ spike day-over-day + buffer) | Cron job xoá both out-of-range latest + old non-latest |
| `RateShopRequest` | 90 ngày | Audit log cleanup |
| `RateShopRecommendation` | Purge theo `check_in_date < vnTodayMinus(7)` | Cleanup cùng MarketSnapshot |

> [!NOTE]
> **Retention clarification:** "90 ngày" cho CompetitorRate là fallback cho **future dates** (data cũ nhưng check_in chưa xảy ra). Dữ liệu có `check_in_date` trong quá khứ được purge sớm hơn (7d). Nếu GM muốn xem **lịch sử compset 3 tháng** → dùng MarketSnapshot (daily aggregates), không phải raw CompetitorRate.
>
> **Cutoff tính bằng VN timezone:**
> ```typescript
> const vnCutoff7d = vnTodayMinus(7);
> ```

---

## 16. Observability & KPIs

Các metric bắt buộc để quản lý cost và chất lượng dữ liệu:

| KPI | Mô tả | Target |
|-----|--------|--------|
| **Cache Hit Rate (DB)** | % requests served from cache (FRESH + STALE) | > 80% |
| **Vendor Cache Hit Rate** | % responses có `is_vendor_cache_hit=true` | Monitor only |
| **Searches/Day** | Tổng SerpApi searches / ngày toàn hệ thống | < budget cap |
| **Searches/Tenant** | Searches / tenant / tháng | < tenant quota |
| **Refresh Success Rate** | % refresh jobs hoàn thành SUCCESS | > 95% |
| **Refresh Latency (p50/p95)** | Thời gian từ enqueue → cache updated | p50 < 5s, p95 < 15s |
| **% Days Market Confidence LOW** | % ngày trong horizon có `market_confidence=LOW` | < 20% |
| **Compset Coverage** | % tier-1 competitors có rate data per horizon | > 80% |
| **Stampede Coalesce Rate** | `coalesced_count / total_refresh_requests` | Monitor only |

### 16.1 Implementation (Phase 1)

**Structured logging** (tối thiểu cho Phase 1, không cần event table riêng):

```typescript
// Mỗi refresh job log:
logger.info('rate_shopper.refresh', {
  cache_key, hotel_id, query_type,
  cache_hit: boolean,          // DB cache hit?
  vendor_cache_hit: boolean,   // SerpApi cache hit?
  duration_ms: number,         // Refresh duration
  serpapi_search_id: string,
  http_status: number,
  error_message?: string,
  result_count: number,        // Số rates parsed
});
```

**Nơi lưu:**
- **Phase 1:** Vercel function logs + Prisma query từ `RateShopRequest` table (vốn đã log mỗi request)
- **Phase 2+:** Optional dedicated `rate_shopper_events` table hoặc external (Datadog/Grafana)

---

## 17. Open Questions

- [ ] **Sold-out vs no-rate**: Tiêu chí phân loại từ SerpApi response cụ thể (cần thống nhất sau POC)
- [ ] **Apple-to-apple room type mapping**: Phase 2
- [ ] **Multi-currency & tax display**: Phase 2 (hiện khóa cứng currency=VND → multi-currency cần Decimal(14,2) + locale format)
- [ ] **Competitor không xuất hiện trong listing**: ✅ Resolved — Fallback → Property Details qua `serpapi_property_token`
- [ ] **MarketSnapshot strategy**: ✅ Resolved — Option A (daily snapshot, upsert). `snapshot_date` set bằng code `getVNDate()` — **không** dùng `dbgenerated("CURRENT_DATE")` (DB UTC → lệch). Spike = day-over-day.
- [ ] **Retention by `check_in_date`**: ✅ Resolved — Purge tất cả records có `check_in_date < vnTodayMinus(7)` (quá khứ xa). Future check_in giữ theo retention policy. Cutoff tính bằng VN timezone.
- [ ] **Global PropertyRate dedup (multi-tenant)**: Phase 1 giữ `CompetitorRate` per tenant (đơn giản). Phase 2 cân nhắc bảng `PropertyRate` global (key: `cache_id + serpapi_property_token`) để tránh duplicate khi N tenant cùng theo dõi 1 KS. → **BA ghi nhận Data Retention** để tránh DB phình.

---

## 18. Acceptance Criteria (DoD)

- [ ] UI không phát sinh SerpApi call trực tiếp; mọi refresh đi qua job + cache
- [ ] Cùng params trong TTL → 0 API call mới, chỉ đọc DB cache
- [ ] Lock chống stampede: nhiều user/tenant cùng lúc → chỉ 1 refresh job per `cacheKey`
- [ ] Có quota tenant + system budget cap + safe mode
- [ ] Dashboard hiển thị "as-of timestamp" + Fresh/Stale/Refreshing/Failed
- [ ] Dashboard hỗ trợ 2 data layer: Intraday (latest cache) + Daily (snapshot)
- [ ] MarketSnapshot tạo được cho offsets 7/14/30/60/90 với day-over-day spike detection
- [ ] Alert out-of-market + compression + spike xuất hiện đúng rule
- [ ] RateShopRecommendation có `reason_codes` và guardrails hoạt động
- [ ] Data retention cron job xoá dữ liệu cũ theo policy (mục 15)
- [ ] Observability metrics có thể query được (mục 16)
- [ ] Cron endpoints được bảo vệ bởi `CRON_SECRET` + rate limit (§10.4)
- [ ] Cache seeding chạy đúng (scheduler tự tạo cache rows cho active competitors)
- [ ] Coalesce audit: `refreshing_request_id` + `coalesced_to_request_id` link đúng
- [ ] Tax/fee normalization: representative price dùng `before_taxes_fees` khi có

---

## 18b. POC Checklist (Bắt buộc trước khi dev triển khai full)

> [!IMPORTANT]
> 4 câu hỏi PHẢI được trả lời bằng sample response thật trước khi code Phase 03-04:

| # | Câu hỏi | Output |
|---|---------|--------|
| **POC-1** | **Vendor cache hit signal:** SerpApi response có field/metadata nào xác định cached? (`search_metadata.cached`? `search_information.time_taken_displayed`?) | Nếu không có tín hiệu chắc chắn → dùng conservative billing (mọi call = credit) |
| **POC-2** | **Sold-out vs no-rate:** SerpApi `google_hotels` trả dấu hiệu sold_out cụ thể ở đâu? (field `availability`? empty `prices[]`? explicit flag?) | Chốt mapping `AvailabilityStatus` enum |
| **POC-3** | **Prices schema path:** Xác nhận đúng path `prices[].total_rate.before_taxes_fees` cho engine `google_hotels` property details | Verify bằng sample response thật |
| **POC-4** | **Source normalization:** Tên OTA trong `prices[].source` có ổn định không? ("Agoda" vs "Agoda.com"? "Booking.com" vs "Booking"?) | Normalize map nếu cần, đếm unique sources chính xác |

**Phase-01 setup phải:**
- [ ] Call SerpApi thật với 2-3 property_tokens đã biết
- [ ] Lưu sample responses vào `tests/fixtures/`
- [ ] Trả lời 4 POC questions trước khi code parser

### Listing Search Scope (Phase 1)

> [!NOTE]
> Phase 1 chỉ dùng **Property Details** (stable, per `property_token`). `QueryType.LISTING` enum đã có sẵn nhưng **listing search flows/tables/jobs không cần implement Phase 1** — để giảm nhiễu. Listing chỉ dùng cho autocomplete (onboard competitor) và future discovery.

---

## 19. Enhancements Log

> [!NOTE]
> Changelog các điểm bổ sung qua các vòng review.

### v01.3.9 → v01.4.0 (Scope & Safety)

| # | Fix/Enhancement | Mục |
|---|----------------|-----|
| F1 | **Horizon = 5 offset points** — Chart = 5-node step-line. Full daily range = Phase 2. Cost: 5 comps × 5 offsets = 25 cacheKeys/hotel | 3.1 |
| F2 | **Dual quota** — `max_manual_scans_per_day` (đếm mọi request, chặn spam) vs `quota_cap` (monthly, chỉ vendor calls). Code example + index | 4.C |
| F3 | **Scheduler always increments** System Daily budget khi vendor call + job log observability | 6.2 |
| F4 | **IntradayViewModel** interface — Backend trả view model tenant-scoped kèm cache_status + tax_fee_mixed badge | 11.0 |
| F5 | **Representative price 4-level priority** — total_before_tax → total_lowest → nightly_before_tax×LOS → nightly_lowest×LOS. `before_tax_ratio` trong confidence rule | 9.5 |
| F6 | **CHECK constraints** — property_token NOT NULL khi PROPERTY_DETAILS + offset_days whitelist {7,14,30,60,90} | 4.B.1 |
| F7 | **Signed URL** cho `raw_response_ref` — expiring 1h, admin-only | 4.B.2 |
| F8 | **MarketSnapshotJob scoped** to 5 offsets per hotel (không phải 120 ngày) | 10.2 |
| F9 | **Index `@@index([hotel_id, requested_date])`** trên RateShopRequest cho quota query | 4.C |
| F10 | **Confidence rule updated** — HIGH cần `before_tax_ratio ≥ 60%` ngoài ≥3 comps + ≥2 sources | 9.5 |

### v01.3.8 → v01.3.9 (Architecture Hardening)

| # | Fix/Enhancement | Mục |
|---|----------------|-----|
| H1 | **`refreshing_request_id`** trên RateShopCache — coalesce audit link đến request trigger refresh. Set khi lock, clear khi done/fail | 4.B |
| H2 | **`requested_date`** trên RateShopRequest — `@db.Date` set bằng `getVNDate()` cho max_scans_per_day enforcement | 4.C |
| H3 | **Cache seeding (§10.6)** — Scheduler tự upsert RateShopCache rows cho active competitors trước khi chạy selection query | 10.6 |
| H4 | **Tax/fee normalization (§9.6)** — Ưu tiên `before_taxes_fees`, fallback `total_rate_lowest` + downgrade confidence. `market_confidence=HIGH` cần ≥60% comps có before_tax | 9.6 |
| H5 | **Conservative billing fallback** — Nếu POC chưa detect vendor cache hit → mọi call = credit. `is_vendor_cache_hit` chỉ log | 4.C |
| H6 | **Data access hardening (§11.6)** — Mọi API read filter `hotel_id`. Không expose `raw_response` cho FE. RateShopCache không query trực tiếp | 11.6 |
| H7 | **Transactional snapshot upsert** — `is_latest` flip phải trong transaction (đề phòng race/retry) | 10.2 |
| H8 | **Retention clarification** — "90d" chỉ cho future dates. Past stays purge 7d. Lịch sử 3 tháng → MarketSnapshot | 15 |
| H9 | **POC checklist (§18b)** — 4 câu hỏi bắt buộc trước Phase 03: vendor cache hit, sold-out, prices path, source normalization | 18b |
| H10 | **Listing scope deferral** — Phase 1 chỉ Property Details. Listing flows/jobs không implement | 18b |
| H11 | **RefreshJob description** updated: set/clear `refreshing_request_id` trong job flow | 10.2 |

### v01.3.7 → v01.3.8 (Billing & Consistency)

| # | Fix/Enhancement | Mục |
|---|----------------|-----|
| B1 | **Billing rules cho 3 tình huống**: Scheduler (System only), Coalesce (chỉ triggering tenant bị charge), Cache hit (không charge). Thêm `coalesced_to_request_id` | 6.2 |
| B2 | **Rounding rule cho VND**: `comp_avg` round half-up 0 decimals. `comp_median` chẵn = average 2 giữa → round. `price_index/gap_pct` giữ Decimal(6,4) | 9.5 |
| B3 | **Prisma Date note**: Cột `@db.Date` insert bằng string `"YYYY-MM-DD"`, không dùng `new Date()` (đề phòng timezone serialize) | 4.I |
| B4 | **QueryType + Provider enums**: `QueryType { LISTING, PROPERTY_DETAILS }`, `Provider { SERPAPI }` thay String | 4.A.0, 4.B, 4.C |
| B5 | **§17 + §15 consistency**: Xóa tất cả `CURRENT_DATE` còn trong Open Questions, Retention, Spike → `getVNDate()` / `vnTodayMinus(N)` | 13.2, 15, 17 |
| B6 | **Multi-currency note**: Ghi rõ Phase 1 = VND only (14,0). Phase 2 multi-currency cần Decimal(14,2) + locale format | 17 |

### v01.3.6 → v01.3.7 (Operational Safety)

| # | Fix/Enhancement | Mục |
|---|----------------|-----|
| S1 | **Timezone: CURRENT_DATE → explicit VN date** — `snapshot_date` và `usage_date` set bằng code `getVNDate()`, không dùng `dbgenerated("CURRENT_DATE")` (DB thường chạy UTC → lệch ngày) | 4.E, 4.H |
| S2 | **Credit metering: `credit_consumed`** — boolean trên RateShopRequest. Vendor cache hit → `false` (không tính quota). Atomic increment usage chỉ khi `true` | 4.C |
| S3 | **Fan-out Rule** — Sau khi parse SerpApi response, fan-out CompetitorRate tới **tất cả** competitors cùng `property_token` (không chỉ tenant gọi manual scan) | 4.D |
| S4 | **FK relations** — `RateShopRecommendation.market_snapshot` → MarketSnapshot (SetNull). `CompetitorRate.request` → RateShopRequest (SetNull). Audit trail sạch hơn. | 4.D, 4.F |
| S5 | **Prisma enums** — 6 enums: CacheStatus, AvailabilityStatus, DataConfidence, RequestStatus, RecommendationStatus, DemandStrength (type-safe, no dirty data) | 4.A.0 |
| S6 | **Additional indexes** — `@@index([status, backoff_until, expires_at])` composite cho scheduler. `@@index([check_out_date])` cho retention cleanup | 4.B |
| S7 | **VND Decimal(14,0)** — Money fields dùng `Decimal(14,0)` thay vì `(14,2)` vì VND không có phần lẻ. UI không hiện ".00" | 4.D, 4.E, 4.F |

### v01.3.5 → v01.3.6 (Production Readiness)

| # | Fix/Enhancement | Mục |
|---|----------------|-----|
| R1 | **Money type: Float → Decimal** `@db.Decimal(14,2)` trên CompetitorRate, MarketSnapshot, RateShopRecommendation. Derived metrics dùng `Decimal(6,4)`. | 4.D, 4.E, 4.F |
| R2 | **Materialized columns + indexes** trên RateShopCache (`check_in_date`, `offset_days`, `property_token`...) — no JSONB scan | 4.B |
| R3 | **Stuck REFRESHING self-heal**: scheduler pick keys với `status='REFRESHING' AND lock expired` | 10.5 |
| R4 | **Partial unique index** `is_latest=true` trên MarketSnapshot (SQL migration) | 4.E |
| R5 | **Usage metering tables**: `RateShopUsageDaily` + `RateShopUsageTenantMonthly` với enforce rules | 4.H |
| R6 | **Aggregation contract**: 1 comp = 1 giá đại diện, SOLD_OUT không tham gia, confidence rules | 9.5 |
| R7 | **CompetitorRate dedup**: delete-then-insert per refresh (không phình bảng) | 4.D |
| R8 | **estimated_searches**: `Float?` → `Int @default(1)` | 4.C |
| R9 | **Backoff fields**: `fail_streak`, `backoff_until` trên RateShopCache + `FAILED_PERMANENT` status | 4.B, 6.3 |
| R10 | **Cron allowlist**: softened to "optional hardening" | 10.4 |

### v01.3.4 → v01.3.5 (Team Implementation Review)

| # | Fix/Enhancement | Mục |
|---|----------------|-----|
| T1 | **Batch Selection Algorithm**: priority ordering (FAILED → STALE → expired, ASC expires_at) + `RATE_SHOPPER_BATCH_LIMIT` env var | 10.5 |
| T2 | **Atomic Lock Semantics**: SQL-level `lockAndRefresh()` — no read-then-write race | 6.1 |
| T3 | **Error Handling & Backoff**: exponential backoff (5m→15m→60m), 3x fail → admin alert + Safe Mode per cacheKey | 6.3 |
| T4 | **Observability Implementation**: structured logging spec + Phase 1 = Vercel logs + RateShopRequest table | 16.1 |
| T5 | **Route Structure**: `/pricing/rate-shopper` (dashboard) + `/pricing/competitors` (compset config) | 11.5 |
| T6 | **Config fix**: `max_search_credits_per_month` → `max_searches_per_month` trong §7.1 | 7.1 |

### v01.3.3 → v01.3.4 (Production Hygiene)

| # | Fix/Enhancement | Mục |
|---|----------------|-----|
| P1 | **Intraday vs Daily UI**: thêm §11.0 Data Layers — UI đọc 2 lớp (Intraday từ cache, Daily từ snapshot) | 11.0 |
| P2 | **VN Timezone**: Snapshot 23:00 VN (16:00 UTC), Cleanup 03:00 VN (20:00 UTC) | 10.3 |
| P3 | **Offset-to-bucket mapping**: offsets 7/14 → 30m, 30 → 2h, 60/90 → 6h + batch limit (20–30 keys/run) | 10.3 |
| P4 | **Cron Security**: §10.4 CRON_SECRET + Allowlist + Rate Limit | 10.4 |
| P5 | **Config defaults**: thêm CRON_SECRET + Timezone vào §14 | 14 |
| P6 | **Acceptance Criteria**: +2 items (intraday view, cron security) | 18 |

### v01.3.2 → v01.3.3 (QA Patch #2 — DB Safety)

| # | Fix/Enhancement | Mục |
|---|----------------|-----|
| B1 | **`snapshot_date` default**: sửa `@default(now())` → `@default(dbgenerated("CURRENT_DATE"))` (tránh DATE/TIMESTAMP cast) | 4.E |
| B2 | **Daily snapshot pattern**: chốt Option A (1 snapshot/ngày, upsert). Cache refresh nhiều lần/ngày nhưng snapshot = daily | 4.E, 10.2 |
| B3 | **Retention by `check_in_date`**: purge quá khứ xa (`< CURRENT_DATE - 7d`) cho snapshot + recommendation + rate | 15 |
| B4 | **RateShopRequest FK**: `cache_key` → relation tới `RateShopCache.cache_key` | 4.C |
| B5 | **Terminology**: `credits` → `searches` (1 search = 1 SerpApi credit) | 4.C, 14, 16 |
| B6 | **CompetitorRate.source**: wording mở rộng (OTA/Official/Partner label từ Google Hotels) | 4.D |
| B7 | **Job Schedule**: chốt cron intervals cho scheduler (30m/2h/6h by horizon) + snapshot 23:00 + cleanup 03:00 | 10.3 |
| B8 | **Spike detection**: sửa "24h" → "day-over-day" cho khớp daily snapshot | 13.2 |
| B9 | **Stampede KPI formula**: `coalesced_count / total_refresh_requests` | 16 |

### v01.3.1 → v01.3.2 (QA Patch #1)

| # | Fix/Enhancement | Mục |
|---|----------------|-----|
| C1 | **L0 Vendor cache TTL**: sửa "~vài phút" → "~1 giờ" (SerpApi docs) | 2.3 |
| C2 | **Competitor Onboarding Flow**: thêm mục 8.1 Autocomplete API | 8.1 |
| C3 | **MarketSnapshot history**: thêm `snapshot_date` + `is_latest` flag cho spike detection | 4.E |
| E1 | **Data Retention Policy**: thêm mục 15 | 15 |
| E2 | **Missing Price Anomaly**: thêm mục 9.3 | 9.3 |
| E3 | **`children_ages` future-proof**: thêm vào CanonicalParams | 5.1 |
| E4 | **Observability KPIs**: thêm mục 16 | 16 |
| E5 | **Global PropertyRate dedup**: ghi nhận cho Phase 2 | 17 |

### v01.3 → v01.3.1 (Engineering Alignment)

1. Schema Convention Alignment (`@db.Uuid`, snake_case, `hotel_id` FK)
2. Tách `RateShopRecommendation` (không đụng `price_recommendations`)
3. OTB data reference (không duplicate `features_daily`)
4. `star_rating` trên `Competitor`
5. `sold_out_count` + `no_rate_count` pre-computed trên `MarketSnapshot`
6. `compression_flag` pre-computed
