# 📋 Plan: Booking.com Promotion UI Restructuring + Free Nights X/Y

**Created:** 2026-02-11
**Status:** 🟡 Waiting for BA Review → Dev Ready
**Priority:** High
**Module:** OTA Pricing → PromotionsTab, catalog.ts, types.ts, schema.prisma

---

## 📌 Vấn đề BA đã phát hiện

### A. Trùng nhóm
UI hiện tại có **6 nhóm** cho Booking.com — gây nhầm lẫn:

| # | Nhóm hiện tại | Vấn đề |
|---|---------------|--------|
| 1 | Seasonal (Theo mùa) | ❌ Booking KHÔNG có nhóm này, trùng với Campaign |
| 2 | Essential (Cơ bản) | ❌ Trùng ý nghĩa với Portfolio Deals |
| 3 | Genius & Visibility | ❌ Chứa Mobile/Country Rate (là Targeted, không phải Genius) |
| 4 | Portfolio Deals | ✅ Đúng nhưng bị chồng với Essential |
| 5 | Campaign Deals | ✅ Đúng |
| 6 | Marketing Programs | ✅ Đúng |

### B. Popup Picker tabs sai
- Tab "Genius & Visibility" chứa cả Country Rate, Mobile Rate (sai nhóm)
- Tab "Campaign Deals" đúng nhưng không có "Deal of the Day" nổi bật

---

## ✅ Cấu trúc UI được BA chốt (4 nhóm + 1 Marketing)

### Main Page — Booking.com

```
┌─────────────────────────────────────────────┐
│ Booking.com ▼                               │
│                                             │
│ ☑ Kết hợp giảm giá (lũy tiến theo rules)   │
│                                             │
│ ● Targeted Rates (Nhắm theo thị trường)    │  ← Nhóm 1
│   Mobile Rate        10%  [ON]  STACKABLE   │
│   Country Rate       10%  [OFF] STACKABLE   │
│   → Rule: chỉ chọn 1 (radio exclusive)     │
│                                             │
│ ● Genius (Loyalty)                          │  ← Nhóm 2
│   Genius Level 2     15%  [ON]  STACKABLE   │
│   → Rule: chỉ chọn 1 level                 │
│                                             │
│ ● Portfolio Deals (Cơ bản)                  │  ← Nhóm 3
│   Basic Deal         10%  [ON]  STACKABLE   │
│   Secret Deal        10%  [OFF] STACKABLE   │
│   Free Nights Deal   Stay [4] Pay [3] →25%  │  ← BUG-2 fix
│   → Note: "Booking chỉ áp deal tốt nhất"   │
│                                             │
│ ● Campaign / Exclusive Deals               │  ← Nhóm 4
│   Getaway Deal       15%  [ON]  EXCLUSIVE   │
│   → Rule: exclusive, chặn targeted+portfolio│
│                                             │
│ ∿ Marketing Programs (Booking.com)          │  ← Giữ nguyên
│   Preferred Partner   0%  [OFF]             │
└─────────────────────────────────────────────┘
```

### Popup Picker — Booking.com (4 tabs)

```
┌─ Thêm Khuyến mãi Booking.com ──────────────────┐
│                                                   │
│ [Targeted] [Genius] [Portfolio] [Campaign]         │
│                                                   │
│ Tab Targeted:                                     │
│   Mobile Rate    TARGETED_RATE  STACKABLE  + Thêm │
│   Country Rate   TARGETED_RATE  STACKABLE  + Thêm │
│                                                   │
│ Tab Genius:                                       │
│   Genius L1      GENIUS        STACKABLE  + Thêm │
│   Genius L2      GENIUS        STACKABLE  + Thêm │
│   Genius L3      GENIUS        STACKABLE  + Thêm │
│                                                   │
│ Tab Portfolio:                                    │
│   Basic Deal                   STACKABLE  + Thêm │
│   Secret Deal                  STACKABLE  + Thêm │
│   Early Booker   TIMING        STACKABLE  + Thêm │
│   Last Minute    TIMING        STACKABLE  + Thêm │
│   Free Nights    FREE_NIGHTS   STACKABLE  + Thêm │
│                                                   │
│ Tab Campaign:                                     │
│   Getaway Deal                 EXCLUSIVE  + Thêm │
│   Late Escape                  EXCLUSIVE  + Thêm │
│   Black Friday                 EXCLUSIVE  + Thêm │
│   Deal of Day                  EXCLUSIVE  + Thêm │
└───────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Plan

### Phase 1: Schema + Types

#### [MODIFY] schema.prisma
- Add `GENIUS` to `PromotionGroup` enum

```diff
 enum PromotionGroup {
   SEASONAL
   ESSENTIAL
   TARGETED
+  GENIUS
   PORTFOLIO
   CAMPAIGN
 }
```

#### [MODIFY] types.ts
- Add `GENIUS` to `PromotionGroup` type
- Add `isFreeNights?: boolean` to `PromotionCatalogItem`
- Add `stackBehavior: 'STACKABLE' | 'EXCLUSIVE' | 'ONLY_WITH_GENIUS'` to `PromotionCatalogItem`
- Add `freeNightsX?: number`, `freeNightsY?: number` to Campaign interface

---

### Phase 2: Catalog Data — Re-map Booking.com promotions

#### [MODIFY] catalog.ts

**Current → New mapping:**

| Promotion | Current groupType | New groupType | stackBehavior |
|-----------|-------------------|---------------|---------------|
| Mobile Rate | TARGETED | TARGETED | STACKABLE |
| Country Rate | TARGETED | TARGETED | STACKABLE |
| Business Bookers | TARGETED | TARGETED | EXCLUSIVE |
| Genius L1/L2/L3 | TARGETED | **GENIUS** | STACKABLE |
| Basic Deal | PORTFOLIO | PORTFOLIO | STACKABLE |
| Secret Deal | PORTFOLIO | PORTFOLIO | STACKABLE |
| Early Booker | PORTFOLIO | PORTFOLIO | STACKABLE |
| Last Minute | PORTFOLIO | PORTFOLIO | STACKABLE |
| Free Nights | PORTFOLIO | PORTFOLIO | STACKABLE |
| Getaway Deal | CAMPAIGN | CAMPAIGN | EXCLUSIVE |
| Late Escape | CAMPAIGN | CAMPAIGN | EXCLUSIVE |
| Black Friday | CAMPAIGN | CAMPAIGN | EXCLUSIVE |
| Limited-time | CAMPAIGN | CAMPAIGN | EXCLUSIVE |
| Deal of Day | CAMPAIGN | CAMPAIGN | EXCLUSIVE |

**Label changes:**

```diff
 booking: {
-    SEASONAL: 'Tactical (Thời điểm)',
-    ESSENTIAL: 'Basic Deals',
-    TARGETED: 'Genius & Visibility',
-    PORTFOLIO: 'Portfolio Deals',
-    CAMPAIGN: 'Campaign Deals',
+    TARGETED: 'Targeted Rates (Nhắm theo thị trường)',
+    GENIUS: 'Genius (Loyalty)',
+    PORTFOLIO: 'Portfolio Deals (Cơ bản)',
+    CAMPAIGN: 'Campaign / Exclusive Deals',
 },
```

**Picker tabs:**

```diff
 booking: {
-    tabs: ['TARGETED', 'PORTFOLIO', 'CAMPAIGN']
+    tabs: ['TARGETED', 'GENIUS', 'PORTFOLIO', 'CAMPAIGN']
 }
```

---

### Phase 3: UI Components

#### [MODIFY] PromotionsTab.tsx

**3a. Main page groups for Booking.com:**
- Remove: SEASONAL, ESSENTIAL groups for Booking
- Show: TARGETED → GENIUS → PORTFOLIO → CAMPAIGN
- Add explanatory note under Portfolio: "Booking chỉ áp dụng deal tốt nhất trong nhóm"

**3b. Free Nights X/Y input (BUG-2):**
- When campaign's promo has `isFreeNights: true` → render Stay/Pay inputs instead of % input
- Auto-calculate: `discount_pct = (1 - Y/X) * 100`
- Validation: `X >= 2`, `1 <= Y < X`, soft warning if `X > 14`

**3c. Stack behavior badges:**
- Each promotion row shows a badge: `STACKABLE` (green) or `EXCLUSIVE` (red)

**3d. Toggle label rename:**
```diff
- "Cộng dồn khuyến mãi"
+ "Kết hợp giảm giá (lũy tiến theo Booking rules)"
```

**3e. Portfolio "highest wins" note:**
```
📌 "Trong nhóm Portfolio Deals, Booking chỉ áp dụng deal tốt nhất."
```

---

### Phase 4: Engine Logic Updates

#### [MODIFY] PromotionsTab.tsx — validate() + totalDiscount calc

- Portfolio promos: engine picks highest discount only (not additive)
- Campaign/Exclusive: blocks Targeted + Portfolio when active
- Genius: always stacks with everything (except Business Bookers)

---

### Phase 5: DB Seed + Migration

#### [RUN] prisma db push
- Sync new GENIUS enum value

#### [MODIFY] seed-expedia-catalog.ts (or new seed script)
- Re-seed Booking.com promotions with correct groupType for Genius items

---

## 📊 Files Changed Summary

| File | Changes |
|------|---------|
| `schema.prisma` | +GENIUS to PromotionGroup enum |
| `types.ts` | +GENIUS, +stackBehavior, +isFreeNights, +freeNightsX/Y |
| `catalog.ts` | Remap Genius promos, update labels/tabs, add stackBehavior |
| `PromotionsTab.tsx` | 4-group layout, Free Nights X/Y input, badges, toggle label |
| `seed-*.ts` | Update Genius promos in DB |

---

## ✅ Acceptance Criteria

- [ ] Booking.com shows exactly 4 groups + Marketing Programs
- [ ] Popup picker has 4 tabs: Targeted, Genius, Portfolio, Campaign
- [ ] Free Nights shows Stay X / Pay Y input with auto-calculated %
- [ ] Each promo shows STACKABLE or EXCLUSIVE badge
- [ ] Portfolio note: "Booking chỉ áp deal tốt nhất"
- [ ] Toggle label: "Kết hợp giảm giá (lũy tiến theo Booking rules)"
- [ ] Engine: Portfolio picks highest, Campaign blocks others
- [ ] Agoda + Expedia UI unchanged (no regression)
- [ ] TypeScript build: 0 errors
