# 📋 Plan: Booking.com Promotion UI Restructuring + Free Nights X/Y

**Created:** 2026-02-11
**Updated:** 2026-02-11T20:10 (v3 — BA corrections applied)
**Status:** 🟢 BA Approved → Ready for Dev
**Module:** OTA Pricing → catalog.ts, PromotionsTab.tsx, types.ts, schema.prisma

---

## 🏗️ Kiến trúc 2 tầng (Core Architecture)

```
TẦNG 2 (UI):     Targeted │ Genius │ Portfolio │ Campaign
                     ↕          ↕         ↕          ↕         ← display labels
TẦNG 1 (ENGINE):  TARGETED   GENIUS   PORTFOLIO   CAMPAIGN    ← groupType (source-of-truth)
                  stack:✅   stack:✅  highest     exclusive
```

- `groupType` = engine source-of-truth → validator/engine đọc để quyết stack/exclusion
- UI labels = thoải mái rename, không ảnh hưởng logic

---

## 📊 Mapping: Engine ↔ UI

| Promotion | `groupType` | `stackBehavior` | UI Group |
|-----------|-------------|-----------------|----------|
| Mobile Rate | TARGETED | STACKABLE | Targeted Rates |
| Country Rate | TARGETED | STACKABLE | Targeted Rates |
| Business Bookers | TARGETED | EXCLUSIVE | Targeted Rates |
| Genius L1/L2/L3 | **GENIUS** | STACKABLE | Genius (Loyalty) |
| Basic Deal | PORTFOLIO | HIGHEST_WINS | Portfolio Deals |
| Secret Deal | PORTFOLIO | HIGHEST_WINS | Portfolio Deals |
| Early Booker | PORTFOLIO | HIGHEST_WINS | Portfolio Deals |
| Last Minute | PORTFOLIO | HIGHEST_WINS | Portfolio Deals |
| Free Nights | PORTFOLIO | HIGHEST_WINS | Portfolio Deals |
| Getaway Deal | CAMPAIGN | EXCLUSIVE | Campaign / Exclusive |
| Late Escape | CAMPAIGN | EXCLUSIVE | Campaign / Exclusive |
| Black Friday | CAMPAIGN | EXCLUSIVE | Campaign / Exclusive |
| Early 2026 | CAMPAIGN | **ONLY_WITH_GENIUS** | Campaign / Exclusive |
| Deal of Day | CAMPAIGN | EXCLUSIVE | Campaign / Exclusive |

### Stacking Matrix (Engine)

```
              Targeted  Genius  Portfolio  Campaign
Targeted         —       ✅       ✅         ❌
Genius           ✅       —       ✅       ✅(only_w_genius)
Portfolio        ✅      ✅     Highest      ❌
Campaign         ❌    ✅(owg)    ❌          —
```

---

## 🔧 Implementation Steps

### Step 1: Schema
- Add `GENIUS` to `PromotionGroup` enum
- `prisma db push`

### Step 2: Types
```typescript
// PromotionCatalogItem — add:
stackBehavior: 'STACKABLE' | 'HIGHEST_WINS' | 'EXCLUSIVE' | 'ONLY_WITH_GENIUS';
isFreeNights?: boolean;

// PromotionInstance / Campaign — Free Nights fields:
// ⚠️ BA FIX A: freeNightsX/Y thuộc về promotion config, không phải "campaign"
freeNightsX?: number;  // Stay X nights
freeNightsY?: number;  // Pay Y nights
```

### Step 3: Catalog
- Genius L1/L2/L3: change `groupType: 'TARGETED'` → `'GENIUS'`
- Add `stackBehavior` to every promo
- Add `isFreeNights: true` to `booking-free-nights`
- Mark `booking-early-2026` (or similar) as `ONLY_WITH_GENIUS`
- Update `VENDOR_GROUP_LABELS` (UI tầng 2 only)
- Update `VENDOR_PICKER_TABS` → `['TARGETED', 'GENIUS', 'PORTFOLIO', 'CAMPAIGN']`

### Step 4: UI (PromotionsTab.tsx)
- Main groups for Booking: TARGETED → GENIUS → PORTFOLIO → CAMPAIGN
- Remove SEASONAL, ESSENTIAL for Booking
- Free Nights: Stay X / Pay Y input + auto-calc `(1−Y/X)×100`
- Badges: STACKABLE (green) / EXCLUSIVE (red) / HIGHEST_WINS (blue) / ONLY_WITH_GENIUS (purple)
- Toggle label: "Kết hợp giảm giá (lũy tiến theo Booking rules)"
- Portfolio note: "Booking chỉ áp dụng deal tốt nhất trong nhóm"

### Step 5: Engine/Validator

> ⚠️ **BA FIX C: Validation pipeline phải check trên *applied*, không phải *enabled*.**

```
Pipeline: enabled promos
  → 1) Resolve conflicts (groupType + stackBehavior)
  → 2) Select applied promos (Portfolio = highest wins, Campaign = exclusive, etc.)
  → 3) Validate max_discounts trên applied.length (KHÔNG phải enabled.length)
  → 4) Calculate totalDiscount
```

**Engine rules (đọc từ groupType + stackBehavior):**
- `PORTFOLIO`: pick highest discount → 1 applied
- `CAMPAIGN` + `EXCLUSIVE`: blocks Targeted + Portfolio
- `CAMPAIGN` + `ONLY_WITH_GENIUS`: blocks Targeted + Portfolio, but allows Genius
- `GENIUS`: always stacks (except with Business Bookers EXCLUSIVE)
- `Free Nights`: `discount_pct = (1 - Y/X) * 100` (readonly)

---

## 🛏️ Free Nights X/Y

```
┌──────────────────────────────────────────────────┐
│ Free Nights Deal    Stay [4] Pay [3]  → 25.0%    │
└──────────────────────────────────────────────────┘
```
- X ≥ 2, 1 ≤ Y < X, soft warn if X > 14
- `discount_pct = (1 - Y/X) × 100` (readonly)

---

## ✅ Acceptance Criteria

- [ ] 2-layer: engine groupType ≠ UI label
- [ ] GENIUS enum in schema
- [ ] Booking.com: 4 groups + Marketing
- [ ] Popup picker: 4 tabs
- [ ] stackBehavior on every promo (STACKABLE / HIGHEST_WINS / EXCLUSIVE / ONLY_WITH_GENIUS)
- [ ] Free Nights: Stay X / Pay Y + readonly %
- [ ] freeNightsX/Y on promotion config (not campaign)
- [ ] Engine: Portfolio = highest wins, Campaign = exclusive
- [ ] Validator: check max_discounts on *applied*, not *enabled*
- [ ] Badges per promo
- [ ] Agoda + Expedia: no regression
- [ ] TypeScript: 0 errors
