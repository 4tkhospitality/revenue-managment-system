# Phase 02: OTA Health Scorecard
Status: ✅ Complete
Dependencies: Phase 01 (Checklist components)

## Objective
Xây dựng thẻ điểm sức khỏe (Scorecard) cho Booking.com và Agoda để GM theo dõi hiệu quả hàng tháng.
Dữ liệu nhập thủ công (do chưa có API) + dữ liệu từ Checklist (Phase 1).

## Weights & Metrics (Locked from Plan v5)

### Booking.com Scorecard (Total 100%)
| Metric | Weight | Source | Input Type |
|--------|--------|--------|------------|
| **CTR** (Click-Through Rate) | 15% | Extranet Analytics | Manual % |
| **Conversion Rate** | 15% | Extranet Analytics | Manual % |
| **Price Quality Score** | 15% | Rate Shopper / Extranet | Manual (1-10) |
| **Cancellation Rate** | 10% | Extranet Analytics | Manual % |
| **Net Bookings Growth** | 10% | Extranet Analytics | Manual % |
| **Booking Pace** (vs STLY) | 10% | RMS Dashboard | Auto/Manual |
| **Content Score** | 15% | Extranet Property Page | Manual % |
| **Checklist Completion** | 10% | RMS Phase 1 | Auto (from localStorage) |

### Agoda Scorecard (Total 100%)
| Metric | Weight | Source | Input Type |
|--------|--------|--------|------------|
| **Content Score** | 25% | YCS (Photos, Desc, etc.) | Manual % |
| **CTR** (Funnel View) | 10% | YCS Analytics | Manual % |
| **Conversion Rate** | 10% | YCS Analytics | Manual % |
| **Price Competitiveness** | 15% | YCS Rate Intel | Manual (1-10) |
| **Review Score** | 15% | YCS Reviews | Manual (1-10) |
| **Cancellation Rate** | 10% | YCS Analytics | Manual % |
| **Checklist Completion** | 10% | RMS Phase 1 | Auto (from localStorage) |
| **Program Participation** | 5% | AGP/Sponsored | Manual (Yes/No) |

## Implementation Steps
1. [x] Create `OTAHealthScorecard` component
2. [x] Create input modal for monthly data entry (persist to localStorage for Phase A)
3. [x] Implement weighted score calculation logic for Booking.com
4. [x] Implement weighted score calculation logic for Agoda
5. [x] Visualize score with existing `CircularProgress` or similar UI
6. [x] Show "Gap Analysis" (Previous Month vs Current Month)
7. [x] Integrate into `OTAPlaybookGuide` (add new section or tab)

## Files to Create/Modify
- `components/guide/OTAHealthScorecard.tsx` — Main component [NEW]
- `components/guide/ScorecardInputModal.tsx` — Data entry [NEW]
- `components/guide/OTAPlaybookGuide.tsx` — Integrate Scorecard
- `lib/ota-score-calculator.ts` — Calculation logic [NEW]

## Test Criteria
- [x] Input modal saves data correctly
- [x] Weights sum to 100% for both OTAs
- [x] Score updates individually when inputs change
- [x] Checklist completion % flows from Phase 1 components
