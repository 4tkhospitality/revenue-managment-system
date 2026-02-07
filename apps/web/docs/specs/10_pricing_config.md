# Pricing Engine Configuration

## Calculation Logic: Progressive vs Additive

### 1. Promotion Stacking Policy
- **Progressive (Multiplicative)**: 
    - Discounts are applied sequentially on the *remaining* amount.
    - Used by: Booking.com, Expedia, Traveloka.
    - *Formula*: `Price * (1 - d1) * (1 - d2)...`
- **Additive (Sum)**:
    - Discounts are summed up before applying.
    - Used by: Agoda (typically).
    - *Formula*: `Price * (1 - (d1 + d2))`

### 2. Order of Operations (Standard)
1. **Commission**: Gross up NET price to Sell Rate.
2. **Discounts**: Apply promotional discounts (Reverse calc to find BAR).
3. **Taxes/Fees**: (Not handled in engine, assumed post-calculation or included in Net).
4. **Rounding**: Final step.

## Rounding Policy
- **VND**: `CEIL_1000` (Round up to nearest 1,000).
- **USD/Others**: `ROUND_100` or `NONE`.
- **Config**: stored in `PricingSetting` table.

## Guardrails (Planned)
- **Min Rate**: Absolute floor (e.g., $50). Stop optimization if `Rec < Min`.
- **Max Rate**: Ceiling.
- **Step Change**: Max % change allowed per update (e.g., +/- 20%).

## Sample Configuration
```json
{
  "hotel_id": "...",
  "currency": "VND",
  "rounding": "CEIL_1000",
  "channels": [
    { "code": "agoda", "commission": 15, "calc_type": "ADDITIVE" },
    { "code": "booking", "commission": 18, "calc_type": "PROGRESSIVE" }
  ],
  "campaigns": [
    { "id": "early_bird", "pct": 10, "stackable": true },
    { "id": "mobile", "pct": 5, "stackable": true }
  ]
}
```
