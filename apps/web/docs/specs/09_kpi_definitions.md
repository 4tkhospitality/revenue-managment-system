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
- **Formula**: `OTB(Today) - OTB(Yesterday)`.
- **Components**: New Bookings + Amends - Cancellations.

### 6. Pace
- **Definition**: Comparison of OTB revenue/rooms for the *same stay date* vs a reference point.
- **Reference**:
    - **Same Time Last Year (STLY)**: OTB for Stay Date X calculated As-Of (X - 365).
    - **Budget**: Pre-defined budget target (Not implemented in V01).
