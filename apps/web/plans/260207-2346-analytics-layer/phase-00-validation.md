# Phase 0.5: Data Validation Guardrails (v2 — Dev-Ready)
Status: ⬜ Pending
Dependencies: daily_otb must have data (✅)

## Objective
Chạy validation trước `buildFeaturesDaily` để phát hiện data bẩn sớm.
Không cần UI phức tạp — chỉ log + badge "Data issues found".

---

## 🔒 Locked Rules (Dev không cần hỏi lại)

| Rule | Definition |
|------|------------|
| **Duplicate Key** | `(hotel_id, as_of_date, stay_date)` — đây là snapshot identity |
| **Exclude Rule** | `stay_date < as_of_date` → exclude khỏi **runtime build** (build features cho tương lai) |
| **Backfill Rule** | `stay_date < as_of_date` → **KHÔNG exclude** khi backfill historical features |
| **Completeness Window** | `as_of_date` → `as_of_date + 180 days` (6 tháng horizon) |
| **Field Name** | Dùng `revenue_otb` (đúng theo schema `daily_otb`) |

---

## Implementation Steps

### 1. RBAC + Active Hotel Guard
- [ ] Validate chỉ chạy khi user có quyền trên hotel hiện tại (viewer trở lên)
- [ ] Không cho validate cross-hotel nếu không phải super_admin
- [ ] Dùng `getActiveHotelId()` để lấy hotel context

### 2. Validate OTB Invariants
- [ ] `rooms_otb >= 0` (negative = data corruption) → **FAIL**, set `valid=false`
- [ ] `revenue_otb >= 0` → **FAIL**, set `valid=false`
- [ ] `stay_date < as_of_date` → **WARNING** + exclude from runtime features build
  - Lý do: PMS export hay có in-house/actualized/late postings → hard-fail sẽ block pipeline
  - Hành vi: flag warning, exclude khỏi build tương lai, nhưng **không** set `valid=false`
  - Backfill: vẫn build historical features bình thường

### 3. Duplicate Detection
- [ ] Check `(hotel_id, as_of_date, stay_date)` uniqueness — đây là PK trong schema
- [ ] Nếu có duplicate → **FAIL** (data corruption, không nên xảy ra với UPSERT đúng)

### 3b. Mass Jump Detection (thay cho 10% diff rule cũ)
- [ ] **Mass jump**: Nếu tại cùng 1 `as_of_date`, có > 30% stay_dates thay đổi `rooms_otb` vượt ngưỡng ±20% so với `as_of_date` trước đó → **WARNING** "Nghi re-import/data reset"
- [ ] **Total OTB jump**: Tổng `rooms_otb` của toàn horizon tăng/giảm > 50% so với snapshot trước → **WARNING**
- [ ] Đây chỉ là warning, không block — nhưng flag rõ để GM kiểm tra

### 4. Outlier Detection (Concrete Thresholds)
- [ ] `rooms_otb > capacity * 1.2` → **WARNING** "Overbooking bất thường (>120% capacity)"
- [ ] `implied_adr > P99_30d` → **WARNING** "ADR cao bất thường"
  - `implied_adr = revenue_otb / GREATEST(rooms_otb, 1)`
  - **P99_30d definition**: `PERCENTILE_CONT(0.99)` của `implied_adr` trong:
    - `as_of_date ∈ [current_as_of - 30, current_as_of]` (30 ngày snapshot gần nhất)
    - `stay_date ∈ [current_as_of, current_as_of + 180]` (trong horizon 180 ngày)
  - → Benchmark dựa trên lịch sử 30 ngày snapshot cho cùng horizon
- [ ] Outliers chỉ WARNING, không block → GM vẫn xem được data

### 5. Completeness Check (với Window cụ thể)
- [ ] **Horizon**: từ `as_of_date` đến `as_of_date + 180 days`
- [ ] **% completeness** = count(stay_dates có OTB data) / 180 * 100
- [ ] **Gap list**: list stay_dates trong window mà không có OTB row
- [ ] Badge hiển thị: "85% complete (27 missing days)"

### 6. Return Summary
```typescript
type ValidationResult = {
  valid: boolean;  // false nếu có FAIL issue
  issues: Array<{
    type: 'FAIL' | 'WARNING';
    code: 'NEGATIVE_ROOMS' | 'NEGATIVE_REVENUE' | 'DUPLICATE' | 'OVERBOOKING' | 'ADR_OUTLIER' | 'PAST_DATE';
    message: string;
    affectedRows: number;
  }>;
  stats: {
    totalRows: number;
    failCount: number;
    warnCount: number;
    completeness: number;  // 0-100
    missingDays: number;
  };
};
```

---

## 🚨 Gated Validation (Bắt buộc)

> [!IMPORTANT]
> **`buildFeaturesDaily()` PHẢI gọi `validateOTBData()` trước.**
> Nếu `valid = false` → abort + trả issue list (UI show).
> Badge chỉ là UX preview, không thay thế gate.

```typescript
// Trong buildFeaturesDaily.ts
export async function buildFeaturesDaily(hotelId: string, asOfDate: Date) {
  const validation = await validateOTBData(hotelId, asOfDate);
  if (!validation.valid) {
    return { success: false, issues: validation.issues };
  }
  // ... proceed with build
}
```

---

## Files to Create/Modify
- `app/actions/validateOTBData.ts` — [NEW] Validation logic với RBAC guard
- `app/data/page.tsx` — [MODIFY] Show validation badge trước "Build Features" button

---

## Test Criteria
- [ ] Inject `rooms_otb = -1` → valid = false, issue code = 'NEGATIVE_ROOMS'
- [ ] Inject `rooms_otb = capacity * 1.5` → valid = true, có WARNING 'OVERBOOKING'
- [ ] Inject duplicate `(hotel, as_of, stay)` → valid = false, issue code = 'DUPLICATE'
- [ ] Completeness với 180 ngày window → đúng %
- [ ] Non-super_admin không thể validate hotel khác

---
Next Phase: phase-01-features.md
