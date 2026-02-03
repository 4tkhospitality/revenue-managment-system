'# Phase 03: RMS Brain (Features & Forecast – V01)
Status: 🟡 In Progress
Dependencies: Phase 02
Stack: Next.js Server Actions + Prisma + TypeScript

## Objective
Chuyển daily_otb thành:
➡️ Feature vectors (Pickup, Pace, Supply)
➡️ Dự báo Remaining Demand (Explainable) cho Pricing Engine

👉 Không ML nặng, không Python, không OTA.

## Requirements

### SCOPE LOCK (V01)
**✅ CÓ LÀM**
- [ ] Feature engineering từ `daily_otb`
- [ ] Forecast remaining demand (heuristic / regression)
- [ ] Lưu vào `demand_forecast`

**❌ KHÔNG LÀM**
- [ ] Không Random Forest
- [ ] Không deep learning
- [ ] Không realtime retraining
- [ ] Không Python
- [ ] Không multi-model ensemble

## Implementation Steps

### 1. Module C — Feature Engine (TS)
Input: `hotelId`, `as_of_date`

**Features (V01 – CHỐT):**
- `rooms_otb`: Phòng đã bán
- `pickup_t30`: Pickup 30 ngày
- `pickup_t15`: Pickup 15 ngày
- `pickup_t7`: Pickup 7 ngày (New)
- `pickup_t5`: Pickup 5 ngày
- `pace_vs_ly`: Pace so với năm ngoái (Guard: `1.0` if LY=0)
- `remaining_supply`: Capacity − rooms_otb
- `dow`, `is_weekend`, `month`

**Logic Notes:**
- **futureDates**: `stay_date` window is `[as_of_date, as_of_date + 365 days]`.
- **pace_vs_ly**: If `last_year_otb == 0`, default to `1.0` to avoid zero division.

### 2. Module D — Forecast Engine (V01 – NO PYTHON)
**Option A (Selected): Heuristic Forecast**

```javascript
// Heuristic Formula
lead_time_factor = 1.0; // V01 default
base_demand = max(avg(pickup_t30, pickup_t15, pickup_t5), pickup_t7);
remaining_demand = base_demand * lead_time_factor;
```

### 3. Output & Explainability
Store in `demand_forecast`: 
- Fields: `hotel_id`, `as_of_date`, `stay_date`, `remaining_demand`, `model_version` (heuristic_v01).
- **Explain (Log/JSON)**: 
  ```json
  {
    "pickup_t30": 10,
    "pickup_t15": 12,
    "pickup_t7": 15,
    "pace_vs_ly": 1.2,
    "lead_time_factor": 1.0
  }
  ```

## Files to Create/Modify
- `apps/web/app/actions/buildFeatures.ts`
- `apps/web/app/actions/runForecast.ts`
- `apps/web/lib/features.ts`
- `apps/web/lib/forecast.ts`
- `apps/web/lib/stats.ts`

## Test Criteria (V01)
### Correctness
- [ ] Không future leakage.
- [ ] `remaining_demand >= 0`.
- [ ] `remaining_demand <= remaining_supply * multiplier`.

### Performance
- [ ] Forecast 30 ngày < 1s.

### Explainability
- [ ] Có thể log ra: pickup → forecast.

---
Next Phase: [Phase 04](phase-04-pricing-ui.md)
'