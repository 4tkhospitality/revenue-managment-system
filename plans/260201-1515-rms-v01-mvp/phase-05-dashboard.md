# Phase 05: User Interface (Dashboard – V01 FINAL)
Status: 🟡 In Progress
Dependencies: Phase 04
Stack: Next.js App Router + Server Components + Tailwind + Recharts

## Objective
Cung cấp Decision Dashboard cho GM:
➡️ Nhìn nhanh Pickup
➡️ Xem giá gợi ý
➡️ Accept / Override
➡️ Xuất file upload PMS

## Requirements

### SCOPE LOCK (V01)
**✅ CÓ LÀM**
- [ ] 1 trang dashboard duy nhất (`/dashboard`)
- [ ] Pickup chart (This Year vs Last Year)
- [ ] Recommendation table (14–30 ngày)
- [ ] Accept / Override inline
- [ ] Export Excel / CSV (SheetJS)

**❌ KHÔNG LÀM**
- [ ] Không React Query / SWR
- [ ] Không phân quyền phức tạp
- [ ] Không settings
- [ ] Không mobile optimization
- [ ] Không real-time websocket

## Implementation Steps

### 1. Module G — Dashboard UI
**Layout Strategy:**
- Header: Hotel Name | As-of Date
- [Row 1] Pickup Chart (OTB vs LY)
- [Row 2] Recommendation Table
- [Row 3] Export Button

### 2. Components (Next.js Style)
**6.1 app/dashboard/page.tsx (Server Component)**
- Fetch: pickup data (`daily_otb`), `price_recommendations`.
- Pass `asOfDate` context to children for sync.
- No client state at page level.

**6.2 PickupChart.tsx**
- `Recharts` LineChart.
- Lines: OTB This Year (Active), OTB Last Year (Gray/Dashed).
- X: `stay_date`, Y: `rooms_otb`.

**6.3 RecommendationTable.tsx**
- Columns: Stay Date, OTB, Forecast, Current Price, Recommended Price, Action.
- **Rules**:
  - STOP SELL (`rec=null`): Highlight Red, Disable Actions (Text: "STOP SELL").
  - Uplift: Highlight Green.
  - Action: Button triggers Server Action.
  - **Badge**: Show `▲ +10%` or `▼ -5%` inline.

**6.4 DecisionModal.tsx (Client Component)**
- Render on "Override" click.
- Input: Final Price, Reason.
- Submit -> `submitDecision`.

### 3. Data Fetching
- **Read**: Direct Prisma in Server Component.
- **Write**: Server Actions (`submitDecision`, `exportPricing`).

### 4. Export (V01)
- **Library**: `xlsx` (SheetJS) or simple CSV string.
- **Format**: `Date | Final Price | Currency | Note`.
- **Logic**:
  - Ignore STOP SELL days.
  - Include `"Prices as of: YYYY-MM-DD"` header.
- **Type**: `ExportRow`.

## Files to Create/Modify
- `apps/web/app/dashboard/page.tsx`
- `apps/web/components/PickupChart.tsx`
- `apps/web/components/RecommendationTable.tsx`
- `apps/web/components/DecisionModal.tsx`
- `apps/web/app/actions/exportPricing.ts`

## Test Criteria (MUST PASS)
### Performance
- [ ] Page load < 2s.
- [ ] No flicker.

### UX
- [ ] GM hiểu dashboard < 30s.
- [ ] Accept/Override updates UI immediately (`revalidatePath`).
- [ ] Export file correct format.

---
Next Phase: [Phase 06](phase-06-testing-deployment.md)
