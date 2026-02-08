# Plan: RMS Analytics Layer (STLY + Pace + RemSupply + Guardrails)
Created: 2026-02-07 23:46
Status: 🟡 Planning (v2 — Auditor-Refined)

## Overview
Xây dựng Analytics Layer cho RMS — tầng tính toán giữa OTB data và Pricing Engine.
Tận dụng **bảng `features_daily` đã có sẵn trong schema** (hiện đang rỗng) để populate:
`pickup_t30/t15/t7/t5/t3`, `pace_vs_ly`, `remaining_supply`.

## Discovery: Schema Assets Đã Có

| Table | Columns | Status |
|-------|---------|--------|
| `daily_otb` | hotel_id, as_of_date, stay_date, rooms_otb, revenue_otb | ✅ Has data |
| `features_daily` | pickup_t30/t15/t7/t5/t3, pace_vs_ly, remaining_supply | ⚠️ Empty |
| `demand_forecast` | remaining_demand, model_version | ⚠️ Empty (P2) |
| `price_recommendations` | current/recommended price, uplift_pct | ⚠️ Empty (P2) |
| `Hotel` | capacity, min_rate, max_rate, default_base_rate | ✅ Has data |

→ **Migration nhỏ cần thiết**: thêm `stly_is_approx Boolean?`, `pickup_source Jsonb?` vào `features_daily` + index `(hotel_id, stay_date, as_of_date)`. Còn lại chỉ viết pipeline code.

## Phases

| Phase | Name | Status | Tasks | Exec Order |
|-------|------|--------|-------|------------|
| 0.5 | Data Validation Guardrails | ⬜ Pending | 6 | 1️⃣ |
| 01 | buildFeaturesDaily (STLY + Pace + RemSupply) | ⬜ Pending | 10 | 2️⃣ |
| 03 | Dashboard UI (Analytics Panel) | ⬜ Pending | 8 | 3️⃣ |
| 02 | Guardrails in Pricing Engine | ⬜ Pending | 6 | 4️⃣ |
| 04 | Verify & Integration Test | ⬜ Pending | 6 | 5️⃣ |


**Tổng:** 35 tasks | Ước tính: 3-4 sessions

## 🔒 Locked Decisions (Chốt cứng — dev không cần hỏi lại)

| # | Decision | Default |
|---|----------|---------|
| D1 | Schema Hướng B: migration nhỏ (`stly_is_approx` + `pickup_source` + index) | ✅ Làm migration |
| D2 | `stay_date < as_of_date` = **WARNING** + exclude khỏi runtime build (không exclude backfill) | ✅ Warning, không fail |
| D3 | Missing pickup snapshot = **NULL** (tuyệt đối không COALESCE 0) | ✅ NULL |
| D4 | STLY fallback = nearest `as_of ≤ target` + DOW window ±7d | ✅ Đúng SQL mẫu |
| D5 | RemSupply V1 = `capacity - rooms_otb` (ooo_rooms để V1.1) | ✅ V1 trước |
| D6 | Weekend default = Fri/Sat (configurable per hotel sau) | ✅ Fri/Sat |
| D7 | Duplicate key = `(hotel_id, as_of_date, stay_date)` — snapshot identity | ✅ PK |
| D8 | Completeness window = `as_of_date` → `as_of_date + 180 days` | ✅ 6 tháng |
| D9 | Outlier: overbooking > 120% capacity, ADR > P99_30d | ✅ Concrete thresholds |
| D10 | Field name = `revenue_otb` (đúng schema daily_otb) | ✅ Đồng bộ |
| D11 | STLY date casting = `::date` explicit | ✅ Tránh implicit cast |
| D12 | STLY ORDER BY = `as_of_date DESC` trước, stay_date sau | ✅ Snapshot đúng thời điểm |
| D13 | Pace P0 = Strict exact T-x, NULL nếu thiếu | ✅ V1.1 nearest sau |
| D14 | Upsert = `ON CONFLICT ... DO UPDATE` (race-safe) | ✅ Không cần advisory lock |
| D15 | Backfill = 7 as_of_date/batch + resume | ✅ Tránh timeout |
| D16 | Revenue trong features_daily = `revenue_otb` + `stly_revenue_otb` | ✅ P0 |
| D17 | Pickup revenue = P1 (không làm P0) | ✅ Rooms only cho pace |
| D25 | Manual override policy = `enforce_guardrails_on_manual = false` (default) | ✅ GM có quyền, UI cảnh báo |
| D26 | Guardrails scope P0 = Hotel-level `min_rate`/`max_rate` | ✅ Đúng schema |
| D27 | prev_price = Previous FINAL price (sau guardrails + rounding) | ✅ Tránh double-cap |
| D28 | reason_codes = Array (không single string) | ✅ Multi-trigger support |
| D29 | Badge cho STEP_CAP, MIN_RATE, MAX_RATE | ✅ Không chỉ min/max |
| D30 | Tooltip = before → after + %delta + thresholds | ✅ Transparency |
| D31 | step_pct unit = Float 0–1 (store 0.2, UI show 20%) | ✅ Code không chia 100 |
| D32 | Clamp-after-rounding = luôn clamp lại sau rounding | ✅ Tránh phá max_rate |
| D33 | Min/Max = hard constraint (luôn đúng cuối cùng) | ✅ Step-cap = soft |
| D34 | warnings[] cho manual bypass (không thêm code mới) | ✅ Giữ 7 reason codes |
| D35 | MISSING_BASE = info (không primary nếu giá không đổi) | ✅ Tránh UI nhầm |
| D36 | INVALID_NET = hard stop (return error, không clamp) | ✅ Tránh 0→min sai |


## 🔧 Technical Rules (bắt buộc)

1. Pickup joins: `(cur.as_of_date - INTERVAL 'N days')::date` — phải cast `::date`
2. STLY ORDER BY: `ABS(EXTRACT(EPOCH FROM (stay_date - target)))` — không `ABS(interval)`
3. UI: NULL pickup → "—", approx → prefix "~"
4. buildFeaturesDaily: atomic `DELETE + INSERT` trong transaction

## 📋 Dev Handoff — Thứ tự thực thi

```
 1. Phase 0.5  → validateOTBData.ts + badge UI
 2. Migration  → features_daily: +stly_is_approx, +pickup_source, +index
 3. Phase 01   → buildFeaturesDaily (batch SQL, NULL-safe, STLY fallback)
 4. Phase 03   → Analytics API + Dashboard (as-of selector + quality badge)
 5. Phase 02   → Guardrails trong engine.ts (priority order + trace)
 6. Phase 04   → Golden dataset + edge tests + build verification
```

## ✅ Acceptance Criteria (pass/fail)

| Test | Expected | Pass? |
|------|----------|-------|
| Missing T-7 snapshot | `pickup_t7 = NULL`, UI hiện "—" | ⬜ |
| STLY thiếu đúng ngày | Nearest DOW ±7d, `stly_is_approx = true` | ⬜ |
| As-of selector đổi ngày | Toàn bộ chart/table re-render | ⬜ |
| Guardrail clamp/cap | `reason_code` đúng + trace before/after/delta | ⬜ |
| `stay_date < as_of_date` | Warning + excluded, pipeline không fail | ⬜ |
| `rooms_otb > capacity` | Flagged, không crash | ⬜ |
| `next build` | Exit 0 | ⬜ |

## Quick Commands
- Start Phase 0.5: `/code phase-00`
- Check progress: `/next`

