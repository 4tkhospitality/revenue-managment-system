# Plan: OTA Pricing Module V01.2

**Created:** 2026-02-05 12:22  
**Status:** 🟡 In Progress  
**Spec:** [spec-v01.2-pricing-module.md](../docs/specs/spec-v01.2-pricing-module.md)

---

## Overview

Thêm module **"💰 Tính giá OTA"** vào RMS để tính BAR (Best Available Rate) hiển thị trên OTA từ NET mong muốn.

**Business Value:**
- GM/Owner thấy được: Giá thu về (NET), Giá hiển thị (BAR), Khuyến mãi đang áp
- Không cần Excel, không sai sót công thức

---

## Tech Stack

- **Database:** Prisma 5.10.2 + Supabase (PostgreSQL)
- **Backend:** Next.js API Routes
- **Frontend:** React + Tailwind CSS (SaaS Pro Light theme)
- **Charts:** None (table-based matrix)

---

## Phases

| Phase | Name | Status | Tasks | Est. Time |
|-------|------|--------|-------|-----------|
| 01 | Database Schema | ⬜ Pending | 5 | 30 mins |
| 02 | Lib Functions | ⬜ Pending | 4 | 30 mins |
| 03 | API Routes | ⬜ Pending | 8 | 1 hour |
| 04 | UI Components | ⬜ Pending | 8 | 2 hours |
| 05 | Pages & Layout | ⬜ Pending | 3 | 30 mins |
| 06 | Sidebar & Navigation | ⬜ Pending | 2 | 15 mins |
| 07 | Testing & Verification | ⬜ Pending | 6 | 1 hour |

**Total:** 36 tasks | Estimated: **~6 hours**

---

## Quick Commands

```bash
# Start Phase 1
/code phase-01

# Check progress
/next

# Save context
/save-brain
```

---

## Files to Create/Modify

### New Files
```
apps/web/
├── app/
│   ├── pricing/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   └── api/pricing/
│       ├── room-types/route.ts
│       ├── room-types/[id]/route.ts
│       ├── ota-channels/route.ts
│       ├── ota-channels/[id]/route.ts
│       ├── campaigns/route.ts
│       ├── campaigns/[id]/route.ts
│       └── calc-matrix/route.ts
├── components/pricing/
│   ├── RoomTypesTab.tsx
│   ├── OTAConfigTab.tsx
│   ├── PromotionsTab.tsx
│   ├── OverviewTab.tsx
│   ├── PromotionPickerModal.tsx
│   └── AgodaTracePanel.tsx
├── lib/pricing/
│   ├── engine.ts
│   ├── validators.ts
│   └── catalog.ts
└── prisma/
    ├── schema.prisma (MODIFY)
    └── seed-pricing.ts (NEW)
```

### Modify Files
```
apps/web/
├── prisma/schema.prisma          # Add 5 models + 2 enums
└── components/dashboard/Sidebar.tsx  # Add pricing menu item
```

---

## Dependencies

```
Phase 01 (Database) ──┬── Phase 02 (Lib)
                      │
                      └── Phase 03 (API) ── Phase 04 (UI) ── Phase 05 (Pages)
                                                              │
                                    Phase 06 (Sidebar) ───────┘
                                              │
                                    Phase 07 (Testing) ───────┘
```

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Prisma migration fails | Backup before migrate, test on dev first |
| Calculation precision | Use Math.round(), verify with examples |
| UI complexity | Keep tabs simple, progressive disclosure |

---

## Success Criteria

- [ ] `/pricing` route accessible
- [ ] CRUD Room Types works
- [ ] CRUD OTA Channels works
- [ ] BAR calculation correct (Progressive & Additive)
- [ ] Overview Matrix displays correctly
- [ ] Export CSV works
- [ ] All roles can access (with proper permissions)

