# ImportJob Specification

## Job Definition
- **Entity**: `ImportJob`
- **Fields**:
    - `job_id` (UUID): Unique identifier.
    - `file_hash` (String): SHA-256 hash of file content for idempotency.
    - `status`: `pending` -> `processing` -> `completed` | `failed`.
    - `created_at` / `finished_at`: Timestamps.

## Idempotency Logic
1.  **Compute Hash**: On upload, calculate SHA-256 of strict file content.
2.  **Check DB**: Query `ImportJob` for matching `hotel_id` and `file_hash`.
3.  **Result**:
    - If found and `status=completed`: **REJECT** (`error: DUPLICATE_FILE`).
    - If found and `status=failed`: **ALLOW RETRY** (Create new job).
    - If not found: **PROCEED**.

## Validation Rules
- **Status Normalization**:
    - `booked`, `confirmed` -> **`booked`**
    - `cancelled`, `canceled` -> **`cancelled`**
    - Others -> **FAIL** (Strict Mode) or Left as-is (Permissive).
- **Date Checks**:
    - `arrival_date` < `departure_date`.
    - `booking_date` exists.
- **Data Integrity**:
    - `rooms > 0`.
    - `revenue >= 0`.

## Transaction & Rollback
- **Mechanism**: Atomic batch insert via `prisma.reservationsRaw.createMany`.
- **Flow**:
    1. Parse & Validate all rows in memory.
    2. If ANY row is invalid (Strict Mode), **ABORT** entire job.
    3. If all valid, **INSERT** all rows in one transaction.
    4. Update Job Status to `completed`.
- **Failure State**: If DB insert fails, Job Status = `failed`, no rows are inserted.
