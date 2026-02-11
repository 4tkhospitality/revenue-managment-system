# Database Schema (Prisma)

**Version**: V01.5 (Current)
**Type**: Multi-tenant SaaS (UUID-based)
**Last Updated**: 2026-02-11

## ER Diagram
*(See `docs/DESIGN.md` for Mermaid Diagram)*

## Tables

### 1. `Hotel` (Tenant Root)
- `hotel_id` (PK, UUID): Unique identifier.
- `name`, `timezone`, `currency`, `capacity` (int).
- `ladder_steps` (JSON): Pricing ladder configuration.
- `fiscal_start_day` (int): Fiscal calendar start day.

### 2. `User`
- `user_id` (PK, UUID).
- `email`, `name`, `phone`, `image`.
- `role`: super_admin / hotel_admin / manager / viewer.
- `is_active` (bool): Can be blocked.

### 3. `HotelUser` (Many-to-Many Junction)
- `hotel_id` (FK) + `user_id` (FK): Composite PK.
- `role`: Per-hotel role override.

### 4. `ImportJob`
- `job_id` (PK, CUID).
- `hotel_id` (FK → Hotel, onDelete: Cascade).
- `import_type`: csv / xml / cancellation.
- `file_name`, `file_hash` (MD5 for idempotency).
- `status`: pending / processing / completed / failed.
- `total_rows`, `error_summary`, `finished_at`.

### 5. `ReservationsRaw` (Append-only)
- Keys: `hotel_id`, `job_id`, `reservation_id`.
- Composite Unique: `[hotel_id, reservation_id, job_id]`.
- Fields: `rooms`, `revenue`, `status` (booked/cancelled).
- Normalization: `reservation_id_norm`, `room_code_norm`.
- Timestamps: `booking_date`, `book_time`, `cancel_time`, `loaded_at`.

### 6. `CancellationRaw` (V01.1)
- Cancellation records bridged to reservations.
- Fields: `folio_num_norm`, `matched_reservation_id` (FK).
- `match_status`: matched / unmatched / ambiguous / conflict.

### 7. `DailyOTB` (Core Fact Table)
- **Grain**: One row per `stay_date` per `as_of_date`.
- `rooms_otb`, `revenue_otb`.
- **as_of_date**: Set to `loaded_at` (upload date), NOT `booking_date`.
- Indexes: Optimized for Time-travel query.

### 8. `FeaturesDaily` (ML Features)
- **Purpose**: Stores computed features for forecasting.
- Keys: `hotel_id`, `stay_date`, `as_of_date`.
- Pickup: `pickup_t30`, `pickup_t15`, `pickup_t7`, `pickup_t5`, `pickup_t3`.
- STLY: `stly_revenue_otb`, `stly_is_approx`.
- Other: `pace_vs_ly`, `remaining_supply`, `dow`, `month`, `is_weekend`.
- Metadata: `pickup_source` (JSONB with src/delta/as_of per window).

### 9. `DemandForecast`
- Keys: `hotel_id`, `stay_date`, `as_of_date`.
- **as_of_date**: Uses `max(as_of_date)` from `features_daily`.
- Fields: `remaining_demand`, `model_version`.

### 10. `PriceRecommendations`
- Generated pricing suggestions.
- Unique constraint: `[hotel_id, stay_date, as_of_date]`.

### 11. `PricingDecisions` (Audit Log)
- Fields: `system_price`, `final_price`, `reason`, `action` (accept/override).

### 12. `Subscription` (V01.3)
- Tier: FREE / STARTER / GROWTH / PRO.
- Feature limits: `max_exports`, `max_team_seats`.
- `trial_ends_at`: Trial expiration timestamp.

### 13. `HotelInvite` (V01.3)
- Token-based team invites with role, expiration.
- Rate-limited: IP-based DB-backed limiting.

### 14. OTA Pricing Tables (V01.2)
- `RoomType`: CRUD room type management.
- `OTAChannel`: Commission, calc mode (PROGRESSIVE/ADDITIVE/ISOLATED).
- `PromotionCatalog`: 61 promotions across 5 OTAs.
- `CampaignInstance`: Links promotions to OTA channels per hotel.
- `PricingSettings`: Hotel-specific currency, rounding, max discount.

## as_of_date Semantics (Critical)
| Pipeline Step | as_of_date Source | Example |
|---|---|---|
| Build OTB | `loaded_at` (upload date) | 2026-02-10 |
| Build Features | `new Date()` (today) | 2026-02-11 |
| Run Forecast | `max(as_of_date)` from `features_daily` | 2026-02-11 |

## Enums
- `UserRole`: super_admin, hotel_admin, manager, viewer.
- `JobStatus`: pending, processing, completed, failed.
- `ReservationStatus`: booked, cancelled.
- `DecisionAction`: accept, override.
- `StackMode`: PROGRESSIVE, ADDITIVE, ISOLATED.
