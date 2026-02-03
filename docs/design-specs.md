# Design Specifications (Dark Mode Professional) - V2 (Refined)

**Vibe**: Professional, Data-Dense, High Contrast.
**Reference**: TradingView, Linear, Vercel Dashboard.
**Primary Device**: Desktop/Laptop.

## 🎨 Color Palette (Tailwind Slate)

| Role | Tailwind Class | Hex Value | Usage |
|------|----------------|-----------|-------|
| **Background** | `bg-slate-950` | `#020617` | Main app background (Ultra dark) |
| **Surface** | `bg-slate-900` | `#0f172a` | Cards, Sidebar, Modals |
| **Border** | `border-slate-800` | `#1e293b` | Dividers, Borders |
| **Primary** | `text-blue-500` | `#3b82f6` | Active states, Primary buttons |
| **Secondary** | `text-slate-400` | `#94a3b8` | Secondary text, Icons |
| **Success** | `text-emerald-500` | `#10b981` | Positive trends, "Accept" button |
| **Danger** | `text-rose-500` | `#f43f5e` | Negative trends, "Override" button, Stop Sell |
| **Text Main** | `text-slate-50` | `#f8fafc` | Headings, Key data |
| **Text Muted** | `text-slate-400` | `#94a3b8` | Labels, Axis text |

## 📐 Layout & Spacing

**Grid System**: 12-column grid.
**Sidebar**: Fixed width `w-64` (256px).

## 🖼️ Component Wireframes

### 1. Dashboard Layout (Simplified V01)
```
+----------------+---------------------------------------------------+
|  SIDEBAR       |  HEADER (Breadcrumbs | Date Picker | User)      |
|  (Logo)        +---------------------------------------------------+
|  - Dashboard   |  STATS ROW (RMS Native KPIs)                      |
|  - Upload      |  [OTB]  [Rem. Supply]  [Pickup T7]  [Fcst Dmd]  |
|                +---------------------------------------------------+
|                |                                                   |
|                |  [ MAIN CHART: OTB vs Last Year ] (Height: 400px) |
|                |  Line 1: OTB This Year (Solid Blue)               |
|                |  Line 2: OTB Last Year (Dashed Gray)              |
|                |                                                   |
|                +---------------------------------------------------+
|                |                                                   |
|                |  [ TABLE: Pricing Recommendations ]               |
|                |  Date | OTB | Rem | Fcst | Curr | Rec | Action  |
|                |                                                   |
+----------------+---------------------------------------------------+
```

### 2. KPI Cards (Native RMS)
Focus on Booking Velocity & Supply, not Revenue.
1.  **Rooms OTB**: Total rooms sold for range (e.g. 185).
2.  **Remaining Supply**: Total rooms left (e.g. 42).
3.  **Avg Pickup T7**: Velocity last 7 days (e.g. +6.3).
4.  **Forecast Demand**: Predicted pickup (e.g. +18).

### 3. Main Chart (Pace Analysis)
- **Title**: "OTB vs Last Year (Rooms Sold)"
- **Series**:
    - **Current OTB**: Solid Blue line (`#3b82f6`).
    - **Last Year OTB**: Dashed Slate line (`#64748b`).
- **Tooltip**: Show OTB difference (Pace).

### 4. Recommendation Table
- **Style**: Dense, Sticky Header. Update columns order:
  1. `Date` (Sticky)
  2. `Rooms OTB` (int)
  3. `Remaining` (int) - *New*
  4. `Forecast` (int) - *Demand prediction*
  5. `Current Price` ($) - *Reference*
  6. `Recommended` ($) - *Target*
  7. `Action` (Buttons)

- **Special State: STOP SELL**
  - Trigger: Remaining Supply <= 0 (or Forecast > Remaining * Factor)
  - Visual: Row Background `bg-rose-900/20`.
  - Content: "STOP SELL" text in Recommended column.
  - Actions: Disabled or specific "Open" override.
