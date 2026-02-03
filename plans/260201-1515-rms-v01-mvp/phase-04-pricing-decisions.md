# Phase 04: Pricing & Decisions (V01 – FINAL)
Status: 🟡 In Progress
Dependencies: Phase 03
Stack: Next.js Server Actions + Prisma + TypeScript

## Objective
Chuyển Forecast → Giá gợi ý → Quyết định của GM, với audit log bất biến.

## Requirements

### SCOPE LOCK (V01)
**✅ CÓ LÀM**
- [ ] Rule-based pricing engine
- [ ] Price ladder (±20%)
- [ ] Doanh thu tối ưu đơn giản
- [ ] Accept / Override decision
- [ ] Audit log bất biến (Immutable)

**❌ KHÔNG LÀM**
- [ ] Không ML pricing
- [ ] Không OTA sync
- [ ] Không competitor pricing
- [ ] Không auto-publish giá

## Implementation Steps

### 1. Module E — Pricing Engine (Rule-based)
Input: `hotelId`, `as_of_date`

**Price Ladder (V01 – CHỐT):**
`ladder = [-20%, -10%, -5%, 0%, +5%, +10%, +20%]`

**Core Logic:**
1. **Current Price Source (V01)**: `hotel.base_price` (via config/metadata, default 100).
2. **Optimization**:
   - `expected_sales = min(remaining_demand, max(0, remaining_supply))`
   - `revenue = price * expected_sales`
   - Select price with max revenue.
3. **Price Rounding**: Round to nearest logical step (e.g. 100 for integer currencies).
4. **Calculations**:
   - `uplift_pct = (recommended_price - current_price) / current_price`

**Guards:**
- `remaining_supply <= 0` → **STOP SELL** (Rec: `null`, Explain: `stop_sell: true`)
- `price > 0`
- `remaining_demand` capped at 0 (non-negative).

**Output:** `price_recommendations` table.

### 2. Module F — Decision Log (Human-in-the-loop)
Input: `submitDecision(hotelId, stayDate, action, finalPrice, reason)`

**Business Rules (CHỐT):**
- **Action**: `accept` | `override`
- **Accept**: `final_price` = `system_price`
- **Override**: User inputs `final_price`, `reason` required.
- **Link**: Store `recommendation_id` (or look up via date context) if possible.
- **Immutable**: Always insert new record.

**Table:** `pricing_decisions`.

## Files to Create/Modify
- `apps/web/app/actions/runPricingEngine.ts`
- `apps/web/app/actions/submitDecision.ts`
- `apps/web/lib/pricing.ts` (Ladder Logic)
- `apps/web/lib/ladder.ts` (Config)

## Test Criteria (MUST PASS)
### Pricing Logic
- [ ] Recommended price ∈ ladder
- [ ] `remaining_supply <= 0` → no recommendation
- [ ] `uplift_pct` tính đúng

### Decision
- [ ] Accept → `final_price` = `system_price`
- [ ] Override → `reason` required
- [ ] Không overwrite decision cũ

### Audit
- [ ] Có thể replay lại lịch sử decision theo ngày

---
Next Phase: [Phase 05](phase-05-release.md)
