# KPI Definitions

## Financial Metrics

### 1. Revenue
- **Definition**: Total Rate Amount (Room Charge).
- **Inclusions**: Typically **Net** of Taxes/Service Charge (depends on CSV input).
- **Exclusions**: F&B, Spa, Other.
- **Cancelled**: **Excluded** from OTB (unless calculating Cancellation Fees, which is separate).

### 2. Room Nights
- **Definition**: Number of rooms occupied for a specific night.
- **Formula**: `Rooms * 1 Night`.
- **Multi-room**: A single booking for 2 rooms = 2 Room Nights per night.

### 3. ADR (Average Daily Rate)
- **Definition**: Average price per room sold.
- **Formula**: `Revenue / Room Nights`.
- **Granularity**: Can be calculated Daily, Monthly, or Total Span.

### 4. Occupancy (Occ %)
- **Definition**: Percentage of available inventory sold.
- **Formula**: `(Room Nights Sold / Total Capacity) * 100`.
- **Capacity Source**: `Hotel.capacity` (Fixed integer in DB).

## Performance Metrics

### 5. Pickup
- **Definition**: Net change in OTB between two snapshots.
- **Formula**: `OTB(Today) - OTB(Today-N)` for same stay_date.
- **Windows**: T-30 (±5d), T-15 (±4d), T-7 (±3d), T-5 (±2d), T-3 (±1d)
- **Nearest-neighbor**: If exact snapshot missing, use nearest within window and scale: `pickup_scaled = (curr - ref) / deltaDays × target`
- **NULL policy**: Never coalesce to 0. NULL = OTB reference snapshot not available.

### 6. Pace
- **Definition**: Comparison of OTB revenue/rooms for the *same stay date* vs a reference point.
- **Reference**:
    - **Same Time Last Year (STLY)**: OTB for Stay Date X calculated As-Of (X - 364) ±7d with DOW alignment.
    - **Budget**: Pre-defined budget target (Not implemented in V01).
- **STLY DOW Alignment**: D-364 ±7d, prefer same day-of-week for seasonal accuracy.
- **stly_is_approx**: Boolean flag when STLY source is not exact D-364 match.

### 7. DOD (Day-over-Day)
- **Definition**: Change from yesterday's OTB to today's.
- **Formula**: `OTB[today].rooms - OTB[yesterday].rooms` per stay_date.
- **Revenue variant**: `dod_delta_rev`

### 8. Remaining Supply
- **Definition**: Rooms still available for sale.
- **Formula**: `capacity - rooms_otb`

