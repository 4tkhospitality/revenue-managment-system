# Design Specifications: OTA Pricing Module V01.9

**Created:** 2026-02-05
**Last Updated:** 2026-02-13
**Module:** `/pricing`
**Theme:** SaaS Pro Light (RMS)

---

## 🎨 Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| **Primary** | `#1E3A8A` | Header gradient start, buttons, links |
| **Primary Dark** | `#102A4C` | Header gradient end |
| **Background** | `#F5F7FB` | Page background (lavender gray) |
| **Surface** | `#FFFFFF` | Cards, modals |
| **Border** | `#E2E8F0` | Card borders (slate-200) |
| **Text** | `#1E293B` | Primary text (slate-800) |
| **Text Muted** | `#64748B` | Secondary text (slate-500) |
| **Success** | `#10B981` | Toggle ON, green badges |
| **Warning** | `#F59E0B` | Seasonal badge, warnings |
| **Danger** | `#EF4444` | Delete button, errors |
| **Info** | `#3B82F6` | Essential badge |
| **Purple** | `#8B5CF6` | Additive mode, Targeted badge |
| **Genius Blue** | `#1E3A8A` | Genius program badges |
| **Portfolio Indigo** | `#6366F1` | Portfolio group badges |
| **Campaign Teal** | `#14B8A6` | Campaign group badges |

---

## 📝 Typography

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| H1 (Header) | Inter | 18px | 600 | White |
| H2 (Section) | Inter | 16px | 600 | #1E293B |
| Body | Inter | 14px | 400 | #1E293B |
| Small | Inter | 12px | 400 | #64748B |
| Tab Label | Inter | 14px | 500 | #64748B / #1E3A8A |
| Button | Inter | 14px | 500 | White / #1E3A8A |
| Table Header | Inter | 12px | 600 | #64748B |
| Table Cell | Inter | 14px | 400 | #1E293B |
| Price | Inter Mono | 14px | 500 | #1E293B |

---

## 📐 Tab Structure (5 Tabs)

| # | Tab ID | Label (VI) | Component |
|---|--------|------------|-----------|
| 1 | room-types | Hạng phòng | `RoomTypesTab.tsx` |
| 2 | ota-channels | Kênh OTA | `OTAChannelsTab.tsx` |
| 3 | promotions | Khuyến mãi | `PromotionsTab.tsx` |
| 4 | overview | Bảng giá | `OverviewTab.tsx` |
| 5 | playbook | Tối ưu OTA | `OTAPlaybookGuide.tsx` |

---

## ✨ Key Components

### Header
```tsx
<header
  className="rounded-2xl px-6 py-4 text-white shadow-sm"
  style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
>
  <h1 className="text-lg font-semibold">💰 Tính giá OTA</h1>
  <p className="text-white/70 text-sm mt-1">Quản lý giá hiển thị trên 5 kênh OTA</p>
</header>
```

### Tab Navigation
```tsx
<button className={cn(
  "px-4 py-2 text-sm font-medium",
  active ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500"
)} />
```

### White Card
```tsx
<div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6" />
```

### Category Badges (V01.6 - 2-Layer Architecture)

**Engine Layer (source-of-truth for stacking rules):**
| PromotionGroup | Stack Behavior | Color |
|---------------|----------------|-------|
| SEASONAL | STACKABLE | `bg-amber-100 text-amber-700` |
| ESSENTIAL | STACKABLE | `bg-blue-100 text-blue-700` |
| TARGETED | STACKABLE | `bg-purple-100 text-purple-700` |
| GENIUS | STACKABLE (always passes through) | `bg-blue-100 text-blue-800` |
| PORTFOLIO | HIGHEST_WINS | `bg-indigo-100 text-indigo-700` |
| CAMPAIGN | EXCLUSIVE (blocks all except Genius) | `bg-teal-100 text-teal-700` |

**UI Layer (vendor-specific display labels):**
- Each vendor has custom display labels mapped from engine group types
- Example: Booking.com shows "Genius L1/L2/L3", "Early Deals", "Last Minute Deals"

### Stack Behavior Badges (V01.6)
```tsx
// Visual indicators per promotion
<span className="text-xs bg-green-100 text-green-700 px-1.5 rounded">STACKABLE</span>
<span className="text-xs bg-red-100 text-red-700 px-1.5 rounded">EXCLUSIVE</span>
<span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 rounded">HIGHEST_WINS</span>
<span className="text-xs bg-blue-100 text-blue-700 px-1.5 rounded">ONLY_WITH_GENIUS</span>
```

### Price Cell (Matrix Heatmap)
```tsx
<td className="px-4 py-3 font-mono bg-emerald-50 text-emerald-700">
  {formatVND(price)}  // Lower = green
</td>
<td className="px-4 py-3 font-mono bg-rose-50 text-rose-700">
  {formatVND(price)}  // Higher = red
</td>
```

---

## 🖩 Calculator Modes (V01.7 - 3 Tabs in OverviewTab)

### Tab Structure
| # | Tab Label | Input | Calculates |
|---|-----------|-------|-----------|
| 1 | Giá Thu về | NET price | → BAR + Display Price |
| 2 | Giá BAR | BAR price | → NET + Display Price |
| 3 | Giá Hiển thị | Display price | → BAR + NET |

### Formulas per Calc Type

**PROGRESSIVE (Booking.com 18%):**
```
net_to_bar:     BAR = NET / (1 - commission%)
                Display = BAR × Π(1 - dᵢ)
bar_to_net:     Display = BAR × Π(1 - dᵢ)
                NET = Display × (1 - commission%)
display_to_bar: BAR = Display / Π(1 - dᵢ)
                NET = Display × (1 - commission%)
```

**ADDITIVE (Agoda 20%, Traveloka 15%, CTRIP 18%):**
```
net_to_bar:     BAR = NET / (1 - commission%)
                Display = BAR × (1 - Σdᵢ)
bar_to_net:     Display = BAR × (1 - Σdᵢ)
                NET = Display × (1 - commission%)
display_to_bar: BAR = Display / (1 - Σdᵢ)
                NET = Display × (1 - commission%)
```

**SINGLE_DISCOUNT (Expedia 17%):**
```
Each promotion creates separate rate plan, no stacking.
net_to_bar:     BAR = NET / (1 - commission%)
                Display = BAR × (1 - d)
```

### Timing Conflict Resolution (V01.7 → V01.9)
- **Rule**: Early Bird + Last-Minute are mutually exclusive
- **Logic**: `resolveTimingConflicts()` applied **server-side only** in:
  - `engine.ts` (core resolution)
  - `service.ts → calculatePreview()` (merged into `validation.warnings`)
- Client (`PromotionsTab.tsx`) reads `validation.warnings` from API response
- If both active, only the highest discount is applied

### Unified Pricing Architecture (V01.9 / Phase 03)
- **Single Source of Truth**: All pricing math in `engine.ts` + `service.ts`
- **Client Hook**: `usePricingPreview` ({AbortController, debounce 250ms, isRefreshing})
- **PromotionsTab.tsx**: Zero pricing math — only builds payload and renders API response
- **Loading UI**: `Loader2` spinner + opacity transition during refresh

### Input UX (V01.7 Fix)
- Controlled input pattern: `value={customInput}` (no fallback)
- Default value set via `useEffect` on mode/room change
- Allows clearing and retyping prices without snap-back

---

## 🔧 Free Nights Deal (V01.6)

**Input:** Stay X nights / Pay Y nights
**Formula:** `discount_pct = round((1 - Y/X) × 100)`
**Example:** Stay 7 / Pay 6 → discount = round((1 - 6/7) × 100) = 14%

---

## 🛡️ OTA-Specific Validation Rules

| OTA | Calc Mode | Commission | Max Discount | Stacking Rules |
|-----|-----------|-----------|-------------|----------------|
| **Agoda** | ADDITIVE | 20% | 80% cap | Σdᵢ sums all active |
| **Booking.com** | PROGRESSIVE | 18% | No limit | Π(1-dᵢ) compounds; Deep Deals no-stack |
| **Traveloka** | ADDITIVE | 15% | 80% cap | Channel Rate applied before campaigns |
| **Trip.com (CTRIP)** | ADDITIVE | 18% | 80% cap | Same box pick 1, different boxes stack |
| **Expedia** | SINGLE_DISCOUNT | 17% | N/A | Each promo = separate rate plan (ISOLATED) |

### Booking.com Special Rules (V01.6)
- **Genius L1/L2/L3**: Always stackable with everything (GENIUS group)
- **Campaign EXCLUSIVE**: Blocks everything EXCEPT Genius
- **Business Bookers**: EXCLUSIVE — blocks ALL including Genius
- **Portfolio HIGHEST_WINS**: Only best deal in portfolio group applied
- **Deep Deals** (Limited-time, Deal of the Day): `allow_stack = false`

---

## 🖼️ Mockups

### Tab 1: Room Types
![Room Types Tab](file:///C:/Users/ngocp/.gemini/antigravity/brain/d75b56db-b0be-435f-9606-9fc32a483a4c/pricing_room_types_tab_1770269352935.png)

### Tab 2: OTA Channels
![OTA Config Tab](file:///C:/Users/ngocp/.gemini/antigravity/brain/d75b56db-b0be-435f-9606-9fc32a483a4c/pricing_ota_config_tab_1770269270456.png)

### Tab 3: Promotions
![Promotions Tab](file:///C:/Users/ngocp/.gemini/antigravity/brain/d75b56db-b0be-435f-9606-9fc32a483a4c/pricing_promotions_tab_1770269292326.png)

### Tab 4: Overview Matrix
![Overview Matrix](file:///C:/Users/ngocp/.gemini/antigravity/brain/d75b56db-b0be-435f-9606-9fc32a483a4c/pricing_overview_matrix_1770269315462.png)

### Tab 5: OTA Growth Playbook
*(See `docs/DESIGN.md` Section 5 for component architecture)*

---

## 🎯 Interactions

| Element | Behavior |
|---------|----------|
| Tab click | Switch content, blue underline indicator |
| Add button | Open modal form |
| Toggle switch | Animate on/off with color change |
| Matrix cell hover | Show trace tooltip |
| Export button | Download CSV file |
| Calculator tab switch | Switch between NET/BAR/Display input modes |
| Stack badge | Visual indicator of stacking behavior |
| Free Nights input | Stay X / Pay Y → auto-calc discount % |
| Timing conflict | Auto-resolve Early Bird vs Last-Minute (highest wins) |

---

## ⚠️ Critical Gotchas

1. **bar_to_net mode**: Do NOT use `calcNetFromBar()` — compute `NET = display × (1 - commission%)` directly
2. **Timing conflicts**: `resolveTimingConflicts()` is server-side only (engine.ts). Client reads `validation.warnings`
3. **PromotionGroup enum**: Must be synced across `schema.prisma`, `types.ts`, `catalog.ts`
4. **Catalog vs DB**: `catalog.ts` constants are NOT used by API — API reads from DB. Must run `seed-pricing.ts` after updating
5. **Free Nights rounding**: Stay 7 / Pay 6 = 14.28% → rounds to 14%
6. **Controlled input**: `value={input || fallback}` prevents clearing — use `value={input}` directly
7. **Client pricing math forbidden**: `PromotionsTab.tsx` must NOT compute `totalDiscount`, `discountMultiplier`, or call any engine functions. Use `usePricingPreview` hook only.
