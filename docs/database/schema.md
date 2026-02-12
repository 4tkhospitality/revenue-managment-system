# Database Schema (Prisma)

**Version**: V01.9 (Current)
**Type**: Multi-tenant SaaS (UUID-based)
**Last Updated**: 2026-02-13
**DB**: PostgreSQL 16 (Supabase, region: ap-northeast-2)
**ORM**: Prisma 5.10.2

## Tables

### 1. `Hotel` (Tenant Root)
- `hotel_id` (PK, UUID): Unique identifier.
- `name`, `slug` (unique), `timezone`, `currency`, `capacity` (int).
- `ladder_steps` (JSON): Pricing ladder configuration.
- `fiscal_start_day` (int): Fiscal calendar start day.
- `default_base_rate`, `max_rate`, `min_rate` (Decimal).
- `is_demo` (bool): Demo hotel flag.
- `demo_owner_id` (UUID, nullable): Owner of demo hotel.
- `expires_at` (DateTime, nullable): Demo expiration.
- `company_email` (string, nullable).

### 2. `User`
- `user_id` (PK, UUID).
- `email` (unique), `name`, `phone`, `image`.
- `role`: UserRole enum (super_admin / hotel_admin / manager / viewer).
- `is_active` (bool): Can be blocked (triggers auto sign-out).
- `emailVerified` (DateTime, nullable).

### 3. `HotelUser` (Many-to-Many Junction)
- `id` (PK, UUID).
- `hotel_id` (FK) + `user_id` (FK): Unique together.
- `role`: Per-hotel role override (UserRole enum).
- `is_primary` (bool): Primary hotel flag.
- `is_active` (bool).
- `last_seen_at` (DateTime, nullable).

### 4. `ImportJob`
- `job_id` (PK, UUID).
- `hotel_id` (FK → Hotel, onDelete: Cascade).
- `import_type`: ImportType enum (RESERVATION / CANCELLATION).
- `file_name`, `file_hash` (for idempotency, unique per hotel).
- `status`: JobStatus enum (pending / processing / completed / failed).
- `total_rows`, `error_summary`, `error_log` (JSON), `finished_at`.
- `snapshot_ts` (Timestamptz): For OTB dedup.

### 5. `ReservationsRaw` (Append-only)
- Keys: `hotel_id`, `job_id`, `reservation_id`.
- Composite Unique: `[hotel_id, reservation_id, job_id]`.
- Fields: `rooms`, `revenue`, `status` (booked/cancelled).
- Dates: `booking_date`, `arrival_date`, `departure_date`, `cancel_date`.
- Timestamps (V01.1): `book_time`, `cancel_time`, `last_modified_time` (all Timestamptz).
- Normalization: `reservation_id_norm`, `room_code`, `room_code_norm`.
- Other: `cancel_reason`, `cancel_source`, `company_name`, `loaded_at`.
- Indexes: `idx_res_raw_dedup`, `idx_res_raw_match1`, `idx_res_raw_match2`, `idx_res_raw_otb`.

### 6. `CancellationRaw` (V01.1)
- Cancellation records bridged to reservations.
- Fields: `folio_num`, `arrival_date`, `cancel_time` (Timestamptz), `as_of_date`.
- Revenue: `nights`, `rate_amount`, `total_revenue`.
- Details: `channel`, `sale_group`, `room_type`, `room_code`, `guest_name`.
- Bridge: `folio_num_norm`, `room_code_norm`, `matched_reservation_id` (FK → ReservationsRaw).
- `match_status`: matched / unmatched / ambiguous / conflict / dq_issue.
- `match_notes`, `matched_at` (Timestamptz).
- Unique: `[hotel_id, folio_num_norm, arrival_date, cancel_time]`.
- Indexes: `idx_cancel_as_of`, `idx_cancel_time`, `idx_cancel_arrival`, `idx_cancel_match_status`.

### 7. `DailyOTB` (Core Fact Table)
- **Grain**: One row per `stay_date` per `as_of_date`.
- `rooms_otb`, `revenue_otb`.
- **as_of_date**: Set to `loaded_at` (upload date), NOT `booking_date`.
- PK: `[hotel_id, as_of_date, stay_date]`.
- Indexes: `idx_otb_as_of`, `idx_otb_stay`.

### 8. `FeaturesDaily` (ML Features)
- **Purpose**: Stores computed features for forecasting.
- PK: `[hotel_id, as_of_date, stay_date]`.
- Revenue: `revenue_otb`, `stly_revenue_otb`, `stly_is_approx`.
- Pickup: `pickup_t30`, `pickup_t15`, `pickup_t7`, `pickup_t5`, `pickup_t3`.
- Other: `pace_vs_ly`, `remaining_supply`, `dow`, `month`, `is_weekend`.
- Metadata: `pickup_source` (JSONB with src/delta/as_of per window).
- Index: `idx_features_stay_asof`.

### 9. `DemandForecast`
- PK: `[hotel_id, as_of_date, stay_date]`.
- **as_of_date**: Uses `max(as_of_date)` from `features_daily`.
- Fields: `remaining_demand`, `model_version`.

### 10. `PriceRecommendations`
- PK: `[hotel_id, as_of_date, stay_date]`.
- Unique constraint: `[hotel_id, stay_date, as_of_date]`.
- Fields: `current_price`, `recommended_price`, `expected_revenue`, `uplift_pct`, `explanation`.

### 11. `PricingDecision` (Audit Log)
- `decision_id` (PK, UUID).
- Fields: `system_price`, `final_price`, `reason`, `action` (accept/override).
- FKs: `hotel_id`, `user_id`.

---

### 12. OTA Pricing Tables (V01.2+)

#### `RoomType`
- `id` (PK, CUID), `hotel_id` (FK, cascade).
- `name` (unique per hotel), `description`, `net_price` (Float).

#### `OTAChannel`
- `id` (PK, CUID), `hotel_id` (FK, cascade).
- `name`, `code` (unique per hotel).
- `calc_type`: CalcType enum (PROGRESSIVE / ADDITIVE / SINGLE_DISCOUNT).
- `commission` (Float), `is_active` (bool).

#### `PromotionCatalog`
- `id` (PK, string — vendor-prefixed).
- `vendor` (agoda/booking/traveloka/ctrip/expedia).
- `name`, `description`.
- `group_type`: PromotionGroup enum (SEASONAL / ESSENTIAL / TARGETED / GENIUS / PORTFOLIO / CAMPAIGN).
- `sub_category`, `default_pct` (Float).
- `allow_stack` (bool), `max_one_in_group` (bool), `max_one_per_subcategory` (bool).
- **61 promotions total**: Agoda(17), Booking(15), Traveloka(10), Trip.com(11), Expedia(8).

#### `CampaignInstance`
- `id` (PK, CUID).
- `hotel_id`, `ota_channel_id` (FK → OTAChannel), `promo_id` (FK → PromotionCatalog).
- `discount_pct` (Float), `is_active` (bool).
- `start_date`, `end_date` (optional Date).

#### `PricingSetting`
- `id` (PK, CUID), `hotel_id` (FK, unique — one per hotel).
- `currency` (default: "VND"), `rounding_rule` (default: "CEIL_1000").
- `max_discount_cap` (Float, default: 80).
- `max_step_change_pct` (Float, default: 0.2 = 20%).
- `enforce_guardrails_on_manual` (bool, default: false).

---

### 13. SaaS Infrastructure (V01.3+)

#### `HotelInvite`
- `invite_id` (PK, UUID), `hotel_id` (FK, cascade).
- `token_hash` (unique), `short_code`.
- `email` (optional), `role` (UserRole enum).
- `max_uses`, `used_count`, `status`, `is_default`.
- `expires_at`, `created_by` (UUID), `used_by`, `used_at`.

#### `ProductEvent`
- `id` (PK, UUID), `user_id`, `hotel_id` (optional).
- `event_type`, `event_data` (JSON).
- Indexes: by user+type+time, by hotel+type+time.

#### `RateLimitHit`
- `id` (PK, UUID), `ip`, `key` (e.g., "invite_redeem", "export").
- Index: `[ip, key, created_at]`.

#### `Subscription`
- `id` (PK, UUID), `hotel_id` (FK, unique — one per hotel).
- `plan`: PlanTier enum (STANDARD / SUPERIOR / DELUXE / SUITE).
- `status`: SubscriptionStatus enum (ACTIVE / TRIAL / PAST_DUE / CANCELLED).
- External payment: `external_provider`, `external_customer_id`, `external_subscription_id`.
- Period: `current_period_start`, `current_period_end`.
- Limits: `max_users`, `max_properties`, `max_imports_month`, `max_exports_day`, `max_export_rows`, `included_rate_shops_month`, `data_retention_months`.

---

### 14. Rate Shopper Tables (Schema Ready, Implementation Deferred)

#### `Competitor`
- `id` (PK), `hotel_id` (FK), `name`, `google_place_id`, `serpapi_property_token`.
- `star_rating`, `tier` (1=primary, 2=secondary), `is_active`.

#### `RateShopCache`
- Single-flight cache with lock/backoff. `cache_key` (unique), `query_type`, `provider`.
- Materialized: `property_token`, `check_in_date`, `check_out_date`, `adults`, `offset_days`.
- State: `status` (FRESH/STALE/EXPIRED/REFRESHING/FAILED), `raw_response`, `expires_at`.

#### `CompetitorRate`
- Rate data per competitor per check-in date. Multiple price levels.
- `availability_status` (AVAILABLE/SOLD_OUT/NO_RATE), `data_confidence` (HIGH/MED/LOW).

#### `RateShopRequest`, `MarketSnapshot`, `RateShopRecommendation`
- Request tracking, market aggregates, and recommendations.

#### `RateShopUsageDaily`, `RateShopUsageTenantMonthly`
- Usage tracking with daily budget limits and monthly tenant quotas.

---

## as_of_date Semantics (Critical)
| Pipeline Step | as_of_date Source | Example |
|---|---|---|
| Build OTB | `loaded_at` (upload date) | 2026-02-10 |
| Build Features | `new Date()` (today) | 2026-02-11 |
| Run Forecast | `max(as_of_date)` from `features_daily` | 2026-02-11 |

## Enums
| Enum | Values | Source |
|------|--------|--------|
| `UserRole` | super_admin, hotel_admin, manager, viewer | Auth/RBAC |
| `JobStatus` | pending, processing, completed, failed | Import pipeline |
| `ImportType` | RESERVATION, CANCELLATION | Import pipeline |
| `ReservationStatus` | booked, cancelled | Reservation data |
| `DecisionAction` | accept, override | Pricing audit |
| `CalcType` | PROGRESSIVE, ADDITIVE, SINGLE_DISCOUNT | OTA Pricing |
| `PromotionGroup` | SEASONAL, ESSENTIAL, TARGETED, GENIUS, PORTFOLIO, CAMPAIGN | OTA Pricing (V01.6) |
| `PlanTier` | STANDARD, SUPERIOR, DELUXE, SUITE | Subscription |
| `SubscriptionStatus` | ACTIVE, TRIAL, PAST_DUE, CANCELLED | Subscription |
| `RateShopCacheStatus` | FRESH, STALE, EXPIRED, REFRESHING, FAILED | Rate Shopper |
| `RateShopAvailabilityStatus` | AVAILABLE, SOLD_OUT, NO_RATE | Rate Shopper |
| `RateShopDataConfidence` | HIGH, MED, LOW | Rate Shopper |
| `RateShopRequestStatus` | PENDING, PROCESSING, COMPLETED, FAILED, COALESCED | Rate Shopper |
| `RateShopRecommendationStatus` | PENDING, ACCEPTED, REJECTED, EXPIRED | Rate Shopper |
| `RateShopDemandStrength` | WEAK, NORMAL, STRONG | Rate Shopper |
| `RateShopQueryType` | PROPERTY_DETAILS, LISTING | Rate Shopper |
| `RateShopProvider` | SERPAPI | Rate Shopper |
