# Data Contract: Reservations CSV

## Column Specifications

| Column | Type | Required | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `reservation_id` | String | **Yes** | Unique per Hotel | PMS Booking ID. |
| `booking_date` | Date | **Yes** | YYYY-MM-DD | Date booking was created. |
| `arrival_date` | Date | **Yes** | YYYY-MM-DD | Check-in date. |
| `departure_date` | Date | **Yes** | `> arrival_date` | Check-out date. |
| `rooms` | Int | **Yes** | `> 0` | Number of rooms. |
| `revenue` | Float | **Yes** | `>= 0` | Total revenue (Gross/Net depends on PMS). |
| `status` | Enum | **Yes** | `booked`, `cancelled` | Normalized status. |
| `cancel_date` | Date | Cond. | Req if `cancelled` | Date of cancellation. |

## Validation Logic (`ingestCSV.ts`)
1.  **Date Logic**: `arrival < departure`.
2.  **Status Normalization**:
    - `confirmed`, `booked` → `booked`
    - `canceled`, `cancelled` → `cancelled`
    - Others → Strict Mode Error (or Warn/Skip).
3.  **Cancellation Integrity**:
    - If `status=cancelled` and `cancel_date` is missing -> Warn (currently allows import but OTB logic may treat as active if specific logic isn't tight). *Correction: Plan implementation strictness varies.*

## Edge Cases
- **0 Night Stay**: Rejected (`arrival >= departure`).
- **Amendments**: Handled as new row with same `reservation_id` in a NEW Import Job.
    - *Note*: Current logic is append-only raw. OTB Builder uses `last_modified` if available, or typically latest job. In V01, we treat duplicates by `unique_key`.
    - **Current Implementation**: `skipDuplicates: true`. Re-importing same ID in same job is skipped. Re-importing same ID in NEW job creates new row? No, `reservation_id` + `hotel_id` + `job_id` is unique. Logic relies on "Latest Job" or "Snapshot" to pick version. *Review*: `buildDailyOTB` selects *all* reservations active at `as_of`. If multiple versions exist across jobs, deduplication logic is required in OTB builder or `ReservationsRaw` layout. currently `buildDailyOTB` fetches from `ReservationsRaw`.

## Timezone & Granularity
- **Granularity**: Daily (Date only). 
- **Cut-off**: Systems treated as **Midnight Local Time**.
- **As-Of Date**: `DateTime` (Timestamp) supported in V01.1 for precise cut-off.

# Source of Truth & Recompute

## Storage Strategy
- **Source of Truth**: `ReservationsRaw` (Immutable log of imports).
- **Derived View**: `DailyOTB` (Aggregated performance table).
    - *Why?* Fast querying for Dashboards/Charts without re-calculating thousands of bookings on the fly.

## Recompute Strategy
- **Trigger**: `ImportJob` completion.
- **Process**:
    1.  Ingest CSV to `ReservationsRaw`.
    2.  Trigger `buildDailyOTB` (for relevant date range).
    3.  Wipe `DailyOTB` for affected dates.
    4.  Re-insert aggregated rows.
- **Idempotency**: Rerunning `buildDailyOTB` is safe (Delete, then Insert).
