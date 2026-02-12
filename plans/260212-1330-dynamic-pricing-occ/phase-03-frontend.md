# Phase 03: Frontend UI (Rev.3)
Status: ⬜ Pending (⛔ After Rev.3 approval)
Dependencies: Phase 02

## Objective
Tab thứ 6: DynamicPricingTab. All blocking issues resolved.

## UI Layout (with blocking fixes applied)
```
┌───────────────────────────────────────────────────────────────────────────┐
│ 📅 Stay Date: [15/06/2026]  Season: [Normal ▼]  OTA: [Agoda ▼]          │
│ View: [Thu về ▼]  [⚙️ Config] [📥 Export] [📤 Import]                    │
├───────────────────────────────────────────────────────────────────────────┤
│ ⚡ OCC ngày 15/06: 58% (source: OTB) — Tier: 35-65% (×1.10)             │
│ (nếu occSource="unavailable": [Nhập OCC%: ____%])                        │
├──────────────┬──────────┬──────────┬──────────┬──────────────────────────┤
│  Hạng phòng  │ 0-35%    │ 35-65%   │ 65-85%   │ >85%                    │
│              │ ×1.00    │ ×1.10 ✓  │ ×1.20    │ ×1.30                   │
├──────────────┼──────────┼──────────┼──────────┼──────────────────────────┤
│  4BR Villa   │ 4,320K   │ 4,752K ★ │ 5,184K   │ 5,616K                  │
│  Luxury 4BR  │ 4,600K   │ 5,060K ★ │ 5,520K   │ 5,980K                  │
└──────────────┴──────────┴──────────┴──────────┴──────────────────────────┘
```

## Controls (blocking fixes applied)
- [ ] **Stay Date picker** — change → full API call (backend computes everything)
- [ ] **Season dropdown** — default from `response.season` (autoDetected=true)
  - Manual override → pass `seasonIdOverride` to API (FIX #1)
  - Show "(auto)" tag when auto-detected
- [ ] **OTA Channel dropdown** — commission + calc_type context (FIX #4 from Rev.2)
- [ ] **View toggle** — Thu về (net) / BAR (bar) / Hiển thị (display)
  - Same labels as OverviewTab: "Thu về", "BAR", "Hiển thị"
- [ ] **OCC display** — from `response.occPct` + `response.occSource` (FIX #3)
  - `"otb"` → show badge "OCC 58% (OTB)"
  - `"unavailable"` → show input field for `occOverride`
  - `"override"` → show badge "OCC 58% (thủ công)"
- [ ] **Warning banner** — when any cell's `netEffective < hotel.min_rate` (FIX #6)

## Sub-Components
- [ ] `SeasonConfigPanel.tsx` — CRUD seasons, NO bar_multiplier
- [ ] `OccTierEditor.tsx` — boundary + multiplier, validation
- [ ] `SeasonRateEditor.tsx` — inline NET per room type per season

## Import/Export
- [ ] Export CSV: current matrix
- [ ] Import CSV: key=`room_type_id` (FIX #5), template with room_type_id + tên + seasons

## Files
- `components/pricing/DynamicPricingTab.tsx` — [NEW]
- `components/pricing/SeasonConfigPanel.tsx` — [NEW]
- `components/pricing/OccTierEditor.tsx` — [NEW]
- `components/pricing/SeasonRateEditor.tsx` — [NEW]
- `components/pricing/index.ts` — [MODIFY] add export
- `app/pricing/page.tsx` — [MODIFY] add 6th tab

---
Next: [phase-04-integration.md](./phase-04-integration.md)
