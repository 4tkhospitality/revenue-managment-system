# Design Specifications: OTA Pricing Module V01.2

**Created:** 2026-02-05  
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

## 📐 Spacing System

| Name | Value | Class |
|------|-------|-------|
| xs | 4px | `gap-1` |
| sm | 8px | `gap-2` |
| md | 16px | `gap-4` |
| lg | 24px | `gap-6` |
| xl | 32px | `gap-8` |

---

## 🔲 Border Radius

| Name | Value | Class | Usage |
|------|-------|-------|-------|
| sm | 4px | `rounded` | Badges |
| md | 8px | `rounded-lg` | Buttons, inputs |
| lg | 12px | `rounded-xl` | Cards |
| xl | 16px | `rounded-2xl` | Header |

---

## ✨ Key Components

### Header
```tsx
<header 
  className="rounded-2xl px-6 py-4 text-white shadow-sm"
  style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
>
  <h1 className="text-lg font-semibold">💰 Tính giá OTA</h1>
  <p className="text-white/70 text-sm mt-1">Quản lý giá hiển thị</p>
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

### Category Badges
```tsx
// Seasonal (orange), Essential (blue), Targeted (purple)
<span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
  Seasonal
</span>
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

## 🖼️ Mockups

### Tab 1: Room Types
![Room Types Tab](file:///C:/Users/ngocp/.gemini/antigravity/brain/d75b56db-b0be-435f-9606-9fc32a483a4c/pricing_room_types_tab_1770269352935.png)

### Tab 2: OTA Channels
![OTA Config Tab](file:///C:/Users/ngocp/.gemini/antigravity/brain/d75b56db-b0be-435f-9606-9fc32a483a4c/pricing_ota_config_tab_1770269270456.png)

### Tab 3: Promotions
![Promotions Tab](file:///C:/Users/ngocp/.gemini/antigravity/brain/d75b56db-b0be-435f-9606-9fc32a483a4c/pricing_promotions_tab_1770269292326.png)

### Tab 4: Overview Matrix
![Overview Matrix](file:///C:/Users/ngocp/.gemini/antigravity/brain/d75b56db-b0be-435f-9606-9fc32a483a4c/pricing_overview_matrix_1770269315462.png)

---

## 🎯 Interactions

| Element | Behavior |
|---------|----------|
| Tab click | Switch content, blue underline |
| Add button | Open modal form |
| Toggle switch | Animate on/off with color change |
| Matrix cell hover | Show trace tooltip |
| Export button | Download CSV file |

