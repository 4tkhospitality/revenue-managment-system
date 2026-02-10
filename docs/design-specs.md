# 4TK Hospitality - Design Specifications

## 🏢 Brand Identity

**Company:** 4TK Hospitality  
**Tagline:** Hotel & Resort Management in Vietnam  
**Logo File:** `/public/logo.png`

---

## 🎨 Color Palette

### Brand Colors (from Logo)
| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Royal Blue** | `#2B4690` | `--brand-primary` | Primary brand color, buttons |
| **Bright Blue** | `#4169E1` | `--brand-secondary` | Active states, links |
| **Light Blue** | `#6B8DD6` | `--brand-accent` | Accents, subtle highlights |

### UI Colors (Dark Theme)
| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Background | `#0a1628` | `--background` | Page background |
| Surface | `#142140` | `--surface` | Cards, modals, sidebar |
| Surface Alt | `#1a2d54` | `--surface-alt` | Hover states |
| Border | `#1e3a5f` | `--border` | Dividers, borders |

### Functional Colors
| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Success | `#10b981` | `--success` | Positive values, confirmed |
| Warning | `#f59e0b` | `--warning` | Warnings, attention needed |
| Danger | `#ef4444` | `--danger` | Errors, decreases |
| Muted | `#64748b` | `--muted` | Secondary text, disabled |

### Text Colors
| Name | Hex | Usage |
|------|-----|-------|
| Primary Text | `#f8fafc` | Main content |
| Secondary Text | `#94a3b8` | Descriptions, labels |
| Muted Text | `#64748b` | Placeholders, disabled |

---

## 📝 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Inter | 32px | 700 |
| H2 | Inter | 24px | 600 |
| H3 | Inter | 20px | 600 |
| Body | Inter | 16px | 400 |
| Small | Inter | 14px | 400 |
| Caption | Inter | 12px | 400 |

---

## 📐 Spacing System

| Name | Value |
|------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |

---

## 🔲 Border Radius

| Name | Value | Usage |
|------|-------|-------|
| sm | 6px | Buttons, inputs |
| md | 8px | Cards |
| lg | 12px | Modals |
| full | 9999px | Avatars, pills |

---

## 📱 Logo Usage

**Primary Logo File:** `public/logo.png`

### Placement Guidelines:
1. **Sidebar Header:** 180x60px, centered
2. **Login Page:** 240x80px, centered
3. **Reports/Exports:** 120x40px, top-left corner

### Supported Formats:
- PNG (preferred, with transparency)
- JPG (fallback)
- SVG (for scalable uses)

---

## 🎯 Component Styles

### Buttons
```css
/* Primary Button */
.btn-primary {
  background-color: var(--brand-primary);
  color: white;
  border-radius: 6px;
  padding: 8px 16px;
}
.btn-primary:hover {
  background-color: var(--primary-hover);
}

/* Secondary Button */
.btn-secondary {
  background-color: transparent;
  border: 1px solid var(--brand-primary);
  color: var(--brand-secondary);
}
```

### Cards
```css
.card {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
}
```

### Tables
```css
table {
  background-color: var(--surface);
}
th {
  background-color: var(--background);
  color: var(--muted);
}
tr:hover {
  background-color: var(--surface-alt);
}
```

---

## ✨ Usage Notes

1. **Keep Dark Theme** - The app uses a dark theme that matches the royal blue background in the logo
2. **Contrast Matters** - Ensure text has sufficient contrast against dark backgrounds
3. **Consistent Blues** - Use `--brand-primary` for all primary actions
4. **Accent Colors** - Use success/warning/danger only for semantic meanings

---

## 🚀 OTA Growth Playbook Design

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

### Component Layout
- **Tab bar**: Horizontal scroll on mobile, fixed on desktop
- **Cards**: Light theme, rounded-2xl, subtle shadow
- **Headers**: Gradient background `linear-gradient(to right, #1E3A8A, #102A4C)`
- **Typography**: Inter font, consistent with main app
- **Currency**: VND formatted with `Intl.NumberFormat`, 2 decimal places
