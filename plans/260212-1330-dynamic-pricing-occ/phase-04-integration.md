# Phase 04: Integration & Polish (Rev.4)
Status: ⬜ Pending (⛔ After Phase 00)
Dependencies: Phase 03 + Phase 00

## Objective
Connect data, polish UX, implement CSV import/export.
**All pricing math goes through `service.ts` — no client-side computation.**

## Steps

### OCC Auto-detection (backend source-of-truth)
- [ ] `dynamic-matrix` route fetches `daily_otb` for `stayDate`
- [ ] Backend returns `occPct`, `occSource`, `activeTier` in response
- [ ] UI displays response values — **does NOT fetch OTB itself**
- [ ] If `occSource = "unavailable"` → UI shows manual input → passes `occOverride`

### Season Auto-detection
- [ ] Backend matches `stayDate` against `season_configs.date_ranges`
- [ ] Date-only strings, end date **inclusive**, timezone = `hotel.timezone`
- [ ] Priority: Holiday(3) > High(2) > Normal(1)
- [ ] Fallback to Normal if no match
- [ ] `seasonIdOverride` in request skips auto-detect

### OTA Channel Integration
- [ ] UI fetches channels from existing `/api/pricing/ota-channels`
- [ ] Passes `channelId` to `dynamic-matrix` API
- [ ] Matrix auto-recalculates on channel change

### Guardrail Warnings (FIX D)
- [ ] After calc, check: `NET_effective < hotel.min_rate` → ⚠️ "Dưới guardrail min"
- [ ] Check: `result.bar > hotel.max_rate` → ⚠️ "Vượt guardrail max"
- [ ] **DO NOT** compare vs `room_type.net_price` (SeasonNetRate can be lower for low season)
- [ ] Multiplier ≥ 1.0 is recommended but not enforced. If < 1.0, guardrail catches it.

### CSV Export
- [ ] Export current matrix (Season + Channel + all OCC tiers)
- [ ] Format: `room_type_id, room_type_name, net_base, net_tier_0, bar_tier_0, ...`

### CSV Import (FIX C)
- [ ] Template download format:
  ```csv
  room_type_id,room_type_name,season_code,net_rate
  uuid-4br-villa,4BR Villa,NORMAL,4320000
  ```
- [ ] Key for matching: **`room_type_id`** (stable across renames)
- [ ] `room_type_name` column is for human readability only, not used for matching
- [ ] Upload → parse → validate → preview (show mismatches) → confirm → bulk upsert
- [ ] Route: `POST /api/pricing/season-rates/import`

### Loading & Error States
- [ ] Skeleton loaders for matrix
- [ ] Error boundary for API failures
- [ ] Toast notifications for save/delete

## Files
- `components/pricing/DynamicPricingTab.tsx` — [MODIFY] Display OCC from response
- `lib/pricing/service.ts` — [MODIFY] calculateDynamicMatrix handles OTB fetch
- `lib/pricing/dynamic-export.ts` — [NEW] CSV export
- `app/api/pricing/season-rates/import/route.ts` — [NEW] CSV import

---
Next: [phase-05-testing.md](./phase-05-testing.md)
