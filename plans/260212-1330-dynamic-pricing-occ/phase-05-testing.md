# Phase 05: Testing
Status: ⬜ Pending
Dependencies: Phase 04

## Objective
Kiểm tra toàn bộ dynamic pricing flow — từ config tới matrix calculation tới UI display.

## Requirements
### Unit Tests
- [ ] OCC tier validation logic (gaps, overlap, min/max tiers)
- [ ] Season date matching logic (priority: Holiday > High > Normal)
- [ ] Dynamic NET calculation: NET × season_multiplier × occ_multiplier
- [ ] Edge cases: 0% OCC, 100% OCC, boundary values (exactly 35%)

### Integration Tests
- [ ] API: CRUD seasons → verify DB state
- [ ] API: Set OCC tiers → verify matrix output changes
- [ ] API: Dynamic matrix with real room types + channels

### E2E/Manual Tests
- [ ] Browser: Open Pricing → Giá Linh Hoạt tab
- [ ] Browser: Add season → verify it appears in dropdown
- [ ] Browser: Edit OCC tiers → matrix updates
- [ ] Browser: Current OCC tier highlights correctly
- [ ] Browser: Switch NET/BAR/Display view
- [ ] Browser: Export CSV → verify file content
- [ ] Browser: Mobile viewport → horizontal scroll works

## Test Files
- `apps/web/tests/dynamic-pricing.test.ts` — [NEW] Unit tests for calc logic
- `apps/web/tests/occ-tiers.test.ts` — [NEW] Validation logic tests

## Test Commands
```bash
# Unit tests
npx vitest run tests/dynamic-pricing.test.ts
npx vitest run tests/occ-tiers.test.ts

# Existing guardrails test (regression)
npx vitest run tests/guardrails.test.ts

# Dev server for manual testing
npm run dev
# → Navigate to http://localhost:3000/pricing → Tab "Giá Linh Hoạt"
```

## Notes
- Sử dụng data từ hình La Isla - Elyday 2026 làm test fixture
- Verify: 4BR Villa NET 4,320,000 × 1.10 (OCC 35-65%) = 4,752,000

---
End of Plan
