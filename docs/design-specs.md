# 4TK Hospitality - Design Specifications

**Version:** V01.7 (Current)
**Last Updated:** 2026-02-12
**Theme:** SaaS Pro Light

---

## 🏢 Brand Identity

**Company:** 4TK Hospitality
**Tagline:** Hotel & Resort Management in Vietnam
**Logo:** Inline SVG (white circle + "4TK" text) — NOT PNG
**Logo Note:** PNG with transparent bg is invisible on dark backgrounds → use inline SVG

---

## 🎨 Color Palette

### Brand Colors (from Logo)
| Name | Hex | Usage |
|------|-----|-------|
| **Navy (Primary)** | `#204184` | Sidebar, logo bg, extracted from actual 4TK logo |
| **Royal Blue** | `#1E3A8A` | Header gradient start, primary buttons |
| **Deep Blue** | `#102A4C` | Header gradient end |
| **Bright Blue** | `#4169E1` | Active states, links |

### UI Colors (SaaS Pro Light Theme)
| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Background** | `#F5F7FB` | `--background` | Page background (lavender gray) |
| **Surface** | `#FFFFFF` | `--surface` | Cards, modals |
| **Surface Hover** | `#F8FAFC` | `--surface-hover` | Card hover states |
| **Border** | `#E2E8F0` | `--border` | Dividers, borders (slate-200/80) |
| **Sidebar** | `#204184` | `--sidebar` | Fixed sidebar background |
| **Sidebar Dark** | `#0f1d36` | `--sidebar-dropdown` | HotelSwitcher dropdown |

### Functional Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#10B981` | Positive values, confirmed, toggle ON |
| **Warning** | `#F59E0B` | Warnings, seasonal badges, amber styling |
| **Danger** | `#EF4444` | Errors, decreases, delete buttons |
| **Info** | `#3B82F6` | Essential badges, info alerts |
| **Purple** | `#8B5CF6` | Additive mode, Targeted badges |
| **Emerald** | `#10b981` | Landing page accent |
| **Gold** | `#d4a24e` | Landing page secondary accent |

### Text Colors
| Name | Hex | Usage |
|------|-----|-------|
| Primary Text | `#1E293B` | Main content (slate-800) |
| Secondary Text | `#64748B` | Descriptions, labels (slate-500) |
| Muted Text | `#94A3B8` | Placeholders, disabled |
| White Text | `#FFFFFF` | On dark backgrounds (header, sidebar) |

---

## 📝 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Inter | 18px | 600 |
| H2 | Inter | 16px | 600 |
| H3 | Inter | 14px | 600 |
| Body | Inter | 14px | 400 |
| Small | Inter | 12px | 400 |
| Caption | Inter | 11px | 400 |
| Price | Inter (Mono) | 14px | 500 |
| Tab Label | Inter | 14px | 500 |
| Button | Inter | 14px | 500 |
| Table Header | Inter | 12px | 600 |

**Font Source:** Google Fonts — `Inter`

---

## 📐 Spacing System

| Name | Value | Tailwind |
|------|-------|----------|
| xs | 4px | `gap-1` |
| sm | 8px | `gap-2` |
| md | 16px | `gap-4` |
| lg | 24px | `gap-6` |
| xl | 32px | `gap-8` |
| 2xl | 48px | `gap-12` |

---

## 🔲 Border Radius

| Name | Value | Tailwind | Usage |
|------|-------|----------|-------|
| sm | 4px | `rounded` | Badges, pills |
| md | 8px | `rounded-lg` | Buttons, inputs |
| lg | 12px | `rounded-xl` | Cards |
| xl | 16px | `rounded-2xl` | Header, modals |
| full | 9999px | `rounded-full` | Avatars |

---

## 📱 Logo Usage

**Primary:** Inline SVG (white circle + "4TK" text)
**Reason:** PNG with dark content is invisible on dark navbar → always use inline SVG

### Placement Guidelines:
1. **Sidebar Header:** 180x60px, centered, white on navy
2. **Login Page:** 240x80px, centered on glassmorphism card
3. **Landing Page Navbar:** Inline SVG, white on dark navbar
4. **Reports/Exports:** 120x40px, top-left corner

---

## 🎯 Component Styles

### Page Header (Gradient)
```tsx
<header
  className="rounded-2xl px-6 py-4 text-white shadow-sm"
  style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
>
  <h1 className="text-lg font-semibold">Page Title</h1>
  <p className="text-white/70 text-sm mt-1">Subtitle</p>
</header>
```

### White Card
```tsx
<div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.06)] p-6" />
```

### Sidebar (Fixed)
```tsx
// Desktop: fixed left, always visible
<aside className="fixed left-0 w-64 h-screen bg-[#204184] text-white">
  {/* Nav items */}
  {/* HotelSwitcher (dark dropdown bg-[#0f1d36]) */}
  {/* Logout button + user info in footer */}
</aside>
// Mobile: hamburger menu in fixed header, sidebar slides from left with overlay
```

### Login Page
```tsx
// Background: gradient from #0B1E3A → #16325F → #204183
// Card: glassmorphism (bg-white/10 backdrop-blur-xl border-white/20)
// Google OAuth button
```

### Buttons
```css
/* Primary */
.btn-primary {
  background-color: #1E3A8A;
  color: white;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 500;
}

/* Secondary (outline) */
.btn-secondary {
  background: transparent;
  border: 1px solid #E2E8F0;
  color: #1E3A8A;
  border-radius: 8px;
}

/* Danger */
.btn-danger {
  background-color: #EF4444;
  color: white;
}
```

### Tables
```css
table { background-color: #ffffff; }
th { color: #64748B; font-size: 12px; font-weight: 600; }
tr:hover { background-color: #F8FAFC; }
td { color: #1E293B; font-size: 14px; }
```

---

## 📱 Responsive Design

| Breakpoint | Layout |
|------------|--------|
| **Desktop (≥1024px)** | Fixed sidebar (w-64), main content with `ml-64`, max-w-[1400px] |
| **Mobile (<1024px)** | Hamburger menu in fixed header, sidebar slides from left, overlay backdrop for close |

**Container:** `mx-auto max-w-[1400px] px-8 py-6 space-y-6`

---

## 🚀 OTA Growth Playbook Design

**Location:** Pricing page → Tab "Tối ưu OTA" (5th tab)

### Tab Navigation
| Tab | Label (VI) | Icon |
|-----|------------|------|
| scorecard | Kiểm tra chỉ số OTA | BarChart |
| booking | Booking.com | ExternalLink |
| agoda | Agoda | ExternalLink |
| roi | Hiệu quả chương trình | Calculator |
| review | Điểm Review | Star |
| boost | Cách tăng Ranking | Zap |

### Scorecard Color Scale
| Score Range | Color | Hex | Meaning |
|-------------|-------|-----|--------|
| 80-100% | Green | `#10B981` | Tốt |
| 60-79% | Yellow | `#F59E0B` | Cần cải thiện |
| 0-59% | Red | `#EF4444` | Yếu |

### Access Control
- **Gated by** `OTAGrowthPaywall` component
- **Free users**: See paywall with feature preview
- **Paid users**: Full access to all 6 tabs
- **Demo hotel**: Hidden from playbook
- **Super Admin**: Bypasses all restrictions

---

## ✨ Usage Notes

1. **Light Theme** — App uses SaaS Pro Light theme (`#F5F7FB` bg, white cards)
2. **Dark Sidebar** — Only the sidebar is dark (`#204184`)
3. **Gradient Headers** — All page headers use `linear-gradient(to right, #1E3A8A, #102A4C)`
4. **Consistent Blues** — Use `#1E3A8A` for primary actions
5. **Accent Colors** — Use success/warning/danger only for semantic meanings
6. **Currency Format** — VND with `Intl.NumberFormat`, thousands separator (e.g., "495.000")
7. **Inline SVG Logo** — Never use PNG for logo on dark backgrounds
