# Pricing Engine Specification

## Core Formula: BAR Calculation
The engine calculates **Best Available Rate (BAR)** from a target **NET** price, accounting for Commission and Discounts.

### Order of Operations

1.  **Gross Up (Commission)**:
    - `Gross = NET / (1 - Commission%)`
    - *Example*: Net $80, Comm 20% -> Gross = 80 / 0.8 = $100.

2.  **Apply Discounts (Reverse)**:
    - **Progressive (Multiplicative)**: `BAR = Gross / Π(1 - Discount%)`
    - **Additive (Sum)**: `BAR = Gross / (1 - ΣDiscount%)`

3.  **Rounding**:
    - **Rule**: `CEIL_1000` (Round up to nearest 1,000 VND).
    - *Alternative*: `ROUND_100`, `NONE`.

## Examples

### Case 1: Simple (Agoda)
- **Input**: Net **800,000**, Comm **20%**.
- **Calc**: `800,000 / (1 - 0.20) = 1,000,000`.
- **Result BAR**: **1,000,000**.

### Case 2: Progressive Stacking
- **Input**: Net **800,000**, Comm **20%**.
- **Discounts**: EarlyBird (**10%**), Mobile (**5%**).
- **Step 1 (Gross)**: `800,000 / 0.8 = 1,000,000`.
- **Step 2 (Discounts)**: `1,000,000 / ((1-0.10) * (1-0.05))`
    - `1,000,000 / (0.9 * 0.95) = 1,000,000 / 0.855 = 1,169,590`.
- **Step 3 (Rounding)**: CEIL_1000 -> **1,170,000**.

### Case 3: Additive Stacking
- **Input**: Net **800,000**, Comm **15%**.
- **Discounts**: Promo A (**10%**), Promo B (**5%**).
- **Step 1 (Gross)**: `800,000 / 0.85 = 941,176`.
- **Step 2 (Discounts)**: `941,176 / (1 - (0.10 + 0.05))`
    - `941,176 / 0.85 = 1,107,265`.
- **Step 3 (Rounding)**: CEIL_1000 -> **1,108,000**.
