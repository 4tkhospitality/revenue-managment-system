# Phase 04: Review Score Calculator
Status: 🟡 In Progress
Dependencies: None

## Objective
Công cụ mô phỏng tác động của review mới đến điểm số tổng thể.
Giúp GM đặt mục tiêu: "Cần bao nhiêu review 10 điểm để lên được 9.0?".

## Features

### 1. Impact Simulator (Mode 1)
- **Inputs:**
  - Current Score (e.g., 8.5)
  - Current Review Count (e.g., 150)
  - New Reviews Simulation:
    - Number of new reviews (e.g., 5)
    - Average score of new reviews (e.g., 10.0)
- **Outputs:**
  - New Score (Weighted Average)
  - Change visualization (+0.05, etc.)

### 2. Target Score Calculator (Mode 2)
- **Inputs:**
  - Current Score
  - Current Count
  - Target Score (e.g., 9.0)
  - Assumed Score of Future Reviews (e.g., 10.0)
- **Outputs:**
  - "Requires X reviews of 10.0 to reach 9.0"
  - Feasibility warning (e.g., if needed > 500 reviews, show "Very Hard")

### 3. Review Quality Breakdown (Bonus/Optional)
- Input: Sub-scores (Staff, Cleanliness, etc.)
- Output: Average Score calculation (Booking.com style)

## Implementation Steps
1. [ ] Create `ReviewCalculator` component
2. [ ] Implement logic for "Impact Simulator" (Weighted Avg)
3. [ ] Implement logic for "Target Score" (Reverse Calc)
4. [ ] Add toggle between modes
5. [ ] Integrate into `OTAPlaybookGuide` (New tab)

## Files to Create/Modify
- `components/guide/ReviewCalculator.tsx` — Main component [NEW]
- `components/guide/OTAPlaybookGuide.tsx` — Integrate Review Calculator

## Test Criteria
- [ ] Impact calculation correct: `(Old*Count + New*NewCount) / TotalCount`
- [ ] Target calculation correct: `(Target*Count - Old*Count) / (NewScore - Target)` (Wait, formula is trickier)
- [ ] Target Calc Formula: `NewScore = (OldScore*OldCount + FutureScore*X) / (OldCount + X)`
  - `NewScore(OldCount + X) = OldScore*OldCount + FutureScore*X`
  - `NewScore*OldCount + NewScore*X = OldScore*OldCount + FutureScore*X`
  - `NewScore*X - FutureScore*X = OldScore*OldCount - NewScore*OldCount`
  - `X(NewScore - FutureScore) = OldCount(OldScore - NewScore)`
  - `X = OldCount(OldScore - NewScore) / (NewScore - FutureScore)`
  - `X = OldCount(NewScore - OldScore) / (FutureScore - NewScore)`
- [ ] Visual feedback for feasible targets
