# Phase 03: ROI Engine
Status: ✅ Complete
Dependencies: None

## Objective
Công cụ tính toán ROI và điểm hòa vốn (Breakeven) cho các chương trình OTA (Genius, Preferred, Visibility Booster, AGP).
Giúp GM ra quyết định: "Có nên tham gia chương trình này không?" dựa trên dữ liệu thật.

## Features (Locked from Plan v5)

### 1. Program Cost Calculator
- **Inputs:**
  - Base Commission (e.g., 15%)
  - Program Commission Add-on (e.g., +5% for Preferred, +10% for Genius discount)
  - Estimated Monthly Revenue (or ADR * Room Nights)
- **Outputs:**
  - Total Cost Analysis (Base vs Program)
  - "Cost of Distribution" %

### 2. Uplift & ROI Scenarios
- **Formula:** `ROI = (Incremental Margin - Incremental Cost) / Incremental Cost`
- **Inputs:**
  - Estimated Uplift % (User slider: 0% -> 100%) - Default based on benchmarks
- **Visualization:**
  - Breakeven Point: How much uplift is needed to cover the extra cost?
  - Simple Bar Chart: Net Revenue (Current) vs Net Revenue (With Program)

### 3. Recommendation Engine
- Simple logic:
  - If ROI > 5x: "Strongly Recommended" (Green)
  - If ROI > 2x: "Recommended" (Blue)
  - If ROI < 1x: "Not Recommended" (Red)

## Implementation Steps
1. [x] Create `ROICalculator` component
2. [x] Implement slider inputs for "Program Cost" and "Expected Uplift"
3. [x] Implement Breakeven calculation logic
4. [x] Visualize Net Revenue comparison (Bar chart or simple CSS bars)
5. [x] Integrate into `OTAPlaybookGuide` (New tab or section)

## Files to Create/Modify
- `components/guide/ROICalculator.tsx` — Main component [NEW]
- `components/guide/OTAPlaybookGuide.tsx` — Integrate ROI Engine

## Test Criteria
- [x] ROI calculation accurate based on formula
- [x] Breakeven point dynamic based on inputs
- [x] Sliders update chart in real-time
- [x] Recommendation text changes based on ROI value
