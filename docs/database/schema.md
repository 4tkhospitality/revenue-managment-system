# Database Schema (Prisma)

**Version**: V01 (MVP)
**Type**: Multi-tenant SaaS (UUID-based)

## ER Diagram
*(See `docs/DESIGN.md` for Mermaid Diagram)*

## Tables

### 1. `Hotel` (Tenant Root)
- `hotel_id` (PK, UUID): Unique identifier.
- `name`, `timezone`, `currency`.

### 2. `User`
- `user_id` (PK, UUID).
- `hotel_id` (FK): Links user to hotel.
- `role`: 'manager' etc.

### 3. `ImportJob`
Tracks specific CSV upload sessions.
- `id` (PK, UUID).
- `hotel_id` (FK).
- `file_hash`: MD5 hash to prevent duplicates.
- `status`: PENDING, PROCESSING, COMPLETED, FAILED.
- `created_at`: Upload timestamp.
- `total_rows`: Metadata.
- `error_log`: JSON field for errors.

### 4. `ReservationsRaw`
- **Append-only** storage for booking data.
- Keys: `hotel_id`, `job_id`, `reservation_id`.
- Composite Unique: `[hotel_id, reservation_id, job_id]`.
- Stores: `rooms` (per night?), `revenue`, `status`.

### 5. `DailyOTB` (Core Fact Table)
- **Grain**: One row per `stay_date` per `as_of_date`.
- `rooms_otb`, `revenue_otb`.
- Indexes: Optimized for Time-travel query.

### 6. `FeaturesDaily` (ML Features)
- **Purpose**: Stores computed features for forecasting.
- Keys: `hotel_id`, `stay_date`, `as_of_date`.
- Columns: `pickup_t30`, `pickup_t15`, `pickup_t7`, `pickup_t5`, `pickup_t3`, `pace_vs_ly`, `remaining_supply`, `dow`, `month`, `is_weekend`.

### 7. `DemandForecast`
- Stores forecasted demand.
- Keys: `hotel_id`, `stay_date`, `as_of_date`.
- Columns: `remaining_demand`, `model_version`.

### 8. `PriceRecommendations`
- Generated pricing suggestions.
- Unique constraint: `[hotel_id, stay_date, as_of_date]`.

### 7. `PricingDecisions`
- Audit log.
- Fields: `system_price` (what we suggested), `final_price` (what user picked), `reason`.

## Enums
- `JobStatus`: pending, processing, completed, failed.
- `ReservationStatus`: booked, cancelled.
- `DecisionAction`: accept, override.
