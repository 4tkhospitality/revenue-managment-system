# 📋 Plan: Booking.com Promotion UI Restructuring + Free Nights X/Y

**Created:** 2026-02-11
**Updated:** 2026-02-11T20:05 (v2 — 2-layer architecture per BA feedback)
**Status:** 🟢 BA Approved → Ready for Dev
**Priority:** High
**Module:** OTA Pricing → catalog.ts, PromotionsTab.tsx, types.ts

---

## 🏗️ Kiến trúc 2 tầng (Core Concept)

> **Nguyên tắc:** Engine và UI tách riêng, không trộn lẫn.

```
┌──────────────────────────────────────────────────────┐
│  TẦNG 2: UI LAYER (GM-friendly labels)               │
│  ┌──────────┐ ┌──────┐ ┌──────────┐ ┌──────────┐    │
│  │Targeted  │ │Genius│ │Portfolio │ │Campaign  │    │
│  │Rates     │ │      │ │Deals     │ │/Exclusive│    │
│  └────┬─────┘ └──┬───┘ └────┬─────┘ └────┬─────┘    │
│       │           │          │             │          │
├───────┼───────────┼──────────┼─────────────┼──────────┤
│  TẦNG 1: ENGINE LAYER (stacking source-of-truth)     │
│       │           │          │             │          │
│       ▼           ▼          ▼             ▼          │
│  groupType:   groupType:  groupType:   groupType:    │
│  TARGETED     GENIUS      PORTFOLIO    CAMPAIGN      │
│  ┌─────────┐  ┌────────┐  ┌─────────┐  ┌──────────┐ │
│  │stack:   │  │stack:  │  │stack:   │  │stack:    │ │
│  │YES w/   │  │YES w/  │  │highest  │  │EXCLUSIVE │ │
│  │Genius+  │  │all     │  │wins     │  │blocks    │ │
│  │Portfolio │  │(except │  │(no add) │  │others    │ │
│  │         │  │Biz.Bk) │  │         │  │          │ │
│  └─────────┘  └────────┘  └─────────┘  └──────────┘ │
└──────────────────────────────────────────────────────┘
```

**Tầng 1 (ENGINE):** `groupType` trong DB/catalog = source-of-truth. Validator/engine đọc field này để quyết stack/exclusion. **Không đổi tên theo marketing.**

**Tầng 2 (UI):** `uiGroup` = label hiển thị cho GM. Có thể đổi tên thoải mái mà không ảnh hưởng engine logic.

---

## 📊 Mapping Table: Engine ↔ UI

### Booking.com

| Promotion | Engine `groupType` | Engine `stackBehavior` | UI Group Label |
|-----------|-------------------|----------------------|----------------|
| Mobile Rate | `TARGETED` | STACKABLE | Targeted Rates |
| Country Rate | `TARGETED` | STACKABLE | Targeted Rates |
| Business Bookers | `TARGETED` | EXCLUSIVE | Targeted Rates |
| Genius L1 | `GENIUS` | STACKABLE | Genius (Loyalty) |
| Genius L2 | `GENIUS` | STACKABLE | Genius (Loyalty) |
| Genius L3 | `GENIUS` | STACKABLE | Genius (Loyalty) |
| Basic Deal | `PORTFOLIO` | HIGHEST_WINS | Portfolio Deals |
| Secret Deal | `PORTFOLIO` | HIGHEST_WINS | Portfolio Deals |
| Early Booker | `PORTFOLIO` | HIGHEST_WINS | Portfolio Deals |
| Last Minute | `PORTFOLIO` | HIGHEST_WINS | Portfolio Deals |
| Free Nights | `PORTFOLIO` | HIGHEST_WINS | Portfolio Deals |
| Getaway Deal | `CAMPAIGN` | EXCLUSIVE | Campaign / Exclusive |
| Late Escape | `CAMPAIGN` | EXCLUSIVE | Campaign / Exclusive |
| Black Friday | `CAMPAIGN` | EXCLUSIVE | Campaign / Exclusive |
| Deal of Day | `CAMPAIGN` | EXCLUSIVE | Campaign / Exclusive |

### Stacking Matrix (Engine Rules)

```
           Targeted  Genius  Portfolio  Campaign
Targeted      —       ✅       ✅         ❌
Genius        ✅       —       ✅         ❌*
Portfolio     ✅      ✅     Highest      ❌
Campaign      ❌      ❌*      ❌          —

❌* = Some campaigns "only stack with Genius" (future exception)
```

---

## 🔧 Implementation (5 Changes)

### 1. Schema: Add GENIUS enum
```diff
 enum PromotionGroup {
   SEASONAL     // Agoda only
   ESSENTIAL    // Agoda only
   TARGETED     // All vendors
+  GENIUS       // Booking.com Genius loyalty program
   PORTFOLIO    // Booking.com portfolio deals
   CAMPAIGN     // Booking.com campaigns + Expedia
 }
```

### 2. Types: Add `stackBehavior` + Free Nights fields
```typescript
// catalog item
stackBehavior: 'STACKABLE' | 'HIGHEST_WINS' | 'EXCLUSIVE';
isFreeNights?: boolean;

// campaign instance
freeNightsX?: number;  // Stay X nights
freeNightsY?: number;  // Pay Y nights
```

### 3. Catalog: Re-map Genius promos + add stackBehavior
- Change Genius L1/L2/L3 from `groupType: 'TARGETED'` → `'GENIUS'`
- Add `stackBehavior` to every promo
- Add `isFreeNights: true` to `booking-free-nights`
- Update `VENDOR_GROUP_LABELS` (UI labels only)
- Update `VENDOR_PICKER_TABS` → `['TARGETED', 'GENIUS', 'PORTFOLIO', 'CAMPAIGN']`

### 4. PromotionsTab UI Changes
- **Main groups for Booking:** TARGETED → GENIUS → PORTFOLIO → CAMPAIGN (remove SEASONAL, ESSENTIAL)
- **Free Nights input:** Stay X / Pay Y with auto-calc % when `isFreeNights`
- **Badges:** Show `STACKABLE` / `EXCLUSIVE` / `HIGHEST_WINS` per promo
- **Toggle label:** "Cộng dồn khuyến mãi" → "Kết hợp giảm giá (lũy tiến theo Booking rules)"
- **Portfolio note:** "Booking chỉ áp dụng deal tốt nhất trong nhóm"

### 5. Engine/Validator
- **Portfolio logic:** Pick highest discount only (not additive)
- **Campaign logic:** When active, block Targeted + Portfolio
- **Genius logic:** Always stacks (except with Business Bookers exclusive)
- **Free Nights calc:** `discount_pct = (1 - Y/X) * 100`

---

## 🛏️ Free Nights X/Y Spec

**Input UI:**
```
┌──────────────────────────────────────────────────────┐
│ Free Nights Deal    Stay [4] Pay [3]  → 25.0%   [ON]│
└──────────────────────────────────────────────────────┘
```

**Validation:**
- X ≥ 2
- 1 ≤ Y < X
- Soft warning if X > 14

**Calc:** `(1 - Y/X) × 100`

---

## ✅ Acceptance Criteria

- [ ] 2 layers clearly separated: engine groupType ≠ UI label
- [ ] Booking.com shows 4 UI groups + Marketing
- [ ] Popup picker has 4 tabs
- [ ] Genius promos use `GENIUS` groupType (not TARGETED)
- [ ] Free Nights: Stay X / Pay Y input
- [ ] Badges: STACKABLE / EXCLUSIVE / HIGHEST_WINS
- [ ] Portfolio engine: highest wins (not additive)
- [ ] Campaign engine: exclusive (blocks others)
- [ ] Agoda + Expedia: no regression
- [ ] TypeScript: 0 errors
