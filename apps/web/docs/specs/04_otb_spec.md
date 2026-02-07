# OTB (On-The-Books) Business Glossary

## Definitions

### 1. Snapshot Date (`as_of_date`)
The "viewpoint" date. Data is filtered to show what was known on this specific date.
- **Logic**: A reservation is considered "Existing" if:
    - `booking_date <= as_of_date`
    - AND (`cancel_date` is NULL OR `cancel_date > as_of_date`).

### 2. Stay Date
The actual calendar date the guest sleeps in the room.
- A single booking (Arr: Jan 1, Dep: Jan 3) covers 2 Stay Dates: Jan 1, Jan 2.

### 3. Room Nights (`rooms_otb`)
Sum of rooms for a specific Stay Date.
- Formula: `Σ (Reservations overlapping StayDate * Rooms)`

### 4. Revenue Allocation
How total booking revenue is distributed across stay dates.
- **Method**: Even Split.
- **Algorithm**:
    - `DailyRate = Floor(TotalRevenue / TotalNights)`
    - `Remainder = TotalRevenue - (DailyRate * TotalNights)`
    - **Last Night rule**: The last night of the stay receives `DailyRate + Remainder` to ensure total matches exactly.

### 5. Time-Travel
The ability to reconstruct the OTB state for any past date.
- **Usage**: Calculating **Pickup** (e.g., OTB Today - OTB Yesterday).
