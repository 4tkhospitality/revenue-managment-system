# Phase 03: Icon Cleanup (Emoji → Lucide SVG)
Status: ⬜ Pending
Dependencies: Phase 02

## Objective
Replace ALL emoji icons used as UI elements with Lucide React SVG icons. Ensure consistent sizing (w-4 h-4 or w-5 h-5) and opacity.

## Scope — Files with emoji icons

| File | Emojis Found | Replacement |
|------|-------------|-------------|
| `KpiCards.tsx` | 📐 📈 📉 ➡️ 🔥 ✅ ⚠️ 🎯 📊 💡 | Lucide: `Calculator`, `TrendingUp/Down`, `Flame`, `CheckCircle`, `AlertTriangle`, `Target`, `BarChart3`, `Lightbulb` |
| `LeadTimeBuckets.tsx` | 📅 | Lucide: `CalendarDays` |
| `TopAccountsTable.tsx` | 🏢 | Lucide: `Building2` |
| `RoomLosMixPanel.tsx` | 🏨 | Lucide: `Hotel` or `BedDouble` |
| `DataStatusBadge.tsx` | ✓ ⚠ ⊘ | Lucide: `CheckCircle2`, `AlertTriangle`, `Ban` |
| `page.tsx` | 📊 ⚠️ | Lucide: `BarChart3`, `AlertTriangle` |
| `DashboardToolbarCard.tsx` | Check for emojis | Replace as found |
| `AnalyticsPanel.tsx` | Check for emojis | Replace as found |

## Rules
- Icon size: `w-4 h-4` for inline, `w-5 h-5` for card headers
- Icon opacity: use `text-{color}-500` (not full 600/700 for icons)
- All icons from `lucide-react` (already installed in project)
- `cursor-pointer` on all clickable elements
- Hover transitions: `transition-colors duration-200`

## Implementation Steps
- [ ] Audit each file for emoji usage (text content vs UI icon)
- [ ] **Keep** emojis that are content labels displayed to user (e.g., in tooltip text)
- [ ] **Replace** emojis that serve as visual icons (section headers, badges, card icons)
- [ ] Ensure consistent import: `import { IconName } from 'lucide-react'`
- [ ] Add `aria-hidden="true"` to decorative icons
- [ ] Verify no visual regression (icon sizes, alignment)

## Test Criteria
- [ ] `grep -r "📊\|📈\|📉\|📐\|🔥\|⚠️\|✅\|🎯\|💡\|📅\|🏢\|🏨"` returns zero hits in dashboard components
- [ ] All icons render at consistent size
- [ ] Hover states smooth on all interactive elements

---
Next Phase: phase-04-tab-content.md
