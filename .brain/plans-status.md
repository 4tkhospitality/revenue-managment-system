# 📋 RMS Plans Status Report
**Updated:** 2026-02-09 20:16

---

## 📊 Tổng quan (5 Plans)

| # | Plan | Created | Status | Progress |
|---|------|---------|--------|----------|
| 1 | **RMS MVP v01** | 01/02 | 🟡 In Progress | 80% (4/6 phases) |
| 2 | **OTA Pricing Module** | 05/02 | 🟡 In Progress | ~90% (thực tế done, plan cũ) |
| 3 | **Rate Shopper** | 07/02 | ⬜ Pending | 0% (8 phases) |
| 4 | **OTB Data Integrity** | 07/02 | ✅ Approved | 0% (4 phases) |
| 5 | **Analytics Layer** | 07/02 | 🟡 Planning | 0% (5 phases) |
| 6 | **PDF Export** | 09/02 | 📋 Planned | 0% (1 session) |

---

## 🔥 ƯU TIÊN

### P0 - Critical
- [ ] **OTB Data Integrity** - Fix double-counting + ghost cancellations
- [ ] **RMS MVP Phase 5** - UI polish (Dashboard, Export)

### P1 - Important  
- [ ] **Analytics Layer Phase 0.5** - Data Validation Guardrails
- [ ] **Analytics Layer Phase 1** - buildFeaturesDaily (STLY + Pace)
- [ ] **PDF Export** - Dashboard, Analytics, Daily Actions

### P2 - Defer
- [ ] **Rate Shopper** - Cần SerpApi POC, ~11-17 sessions
- [ ] **RMS MVP Phase 6** - Release & Handover

---

## 📁 Chi tiết từng Plan

### 1. RMS MVP v01 (260201)
**Path:** `plans/260201-1515-rms-v01-mvp/plan.md`

| Phase | Name | Status |
|-------|------|--------|
| 01 | Foundation | ✅ Complete |
| 02 | Ingest & OTB | ✅ Complete |
| 03 | Features & Forecast | ✅ Complete |
| 04 | Pricing & Decisions | ✅ Complete |
| 05 | User Interface | 🟡 In Progress |
| 06 | Release & Handover | ⬜ Pending |

---

### 2. OTA Pricing Module (260205)
**Path:** `plans/260205-1222-ota-pricing-module/plan.md`

| Phase | Name | Status |
|-------|------|--------|
| 01 | Database Schema | ✅ Done (thực tế) |
| 02 | Lib Functions | ✅ Done |
| 03 | API Routes | ✅ Done |
| 04 | UI Components | ✅ Done |
| 05 | Pages & Layout | ✅ Done |
| 06 | Sidebar & Navigation | ✅ Done |
| 07 | Testing & Verification | ⬜ Pending |

> ⚠️ Plan chưa update status, thực tế đã code xong

---

### 3. Rate Shopper (260207)
**Path:** `plans/260207-0619-rate-shopper/plan.md`

| Phase | Name | Status | Tasks |
|-------|------|--------|-------|
| 01 | Setup + POC | ⬜ Pending | 9 |
| 02 | Database Schema | ⬜ Pending | 18 |
| 03 | Backend Services | ⬜ Pending | 22 |
| 04 | Backend Jobs | ⬜ Pending | 22 |
| 05 | Recommendation Engine | ⬜ Pending | 8 |
| 06 | Frontend UI | ⬜ Pending | 16 |
| 07 | Integration & Polish | ⬜ Pending | 10 |
| 08 | Testing & Verification | ⬜ Pending | 14 |

**Total:** 119 tasks | ~11-17 sessions

---

### 4. OTB Data Integrity (260207) ⚠️ CRITICAL
**Path:** `apps/web/plans/260207-2300-otb-data-integrity/plan.md`

| Phase | Name | Priority | Tasks |
|-------|------|----------|-------|
| 01 | Ingest Hardening | P0 | 6 |
| 02 | OTB Dedup + Cancel Fix | P0 | 5 |
| 03 | Pricing & Middleware Polish | P1 | 3 |
| 04 | Verify & Rebuild | P0 | 5 |

**Total:** 19 tasks | ~1 session

**Key Fixes:**
- Ghost cancellations (missing cancel_date mapping)
- Double-counting (duplicate reservation_id)
- Snapshot dedup (latest snapshot wins)

---

### 5. Analytics Layer (260207)
**Path:** `apps/web/plans/260207-2346-analytics-layer/plan.md`

| Phase | Name | Status | Tasks |
|-------|------|--------|-------|
| 0.5 | Data Validation Guardrails | ⬜ Pending | 6 |
| 01 | buildFeaturesDaily | ⬜ Pending | 10 |
| 02 | Guardrails in Pricing | ⬜ Pending | 6 |
| 03 | Dashboard UI | ⬜ Pending | 8 |
| 04 | Verify & Integration | ⬜ Pending | 6 |

**Total:** 35 tasks | ~3-4 sessions

---

### 6. PDF Export (260209) - NEW
**Path:** `implementation_plan.md` (artifact)

| Task | Status |
|------|--------|
| Install html2canvas + jspdf | ⬜ Pending |
| Create exportToPdf utility | ⬜ Pending |
| Create ExportPdfButton | ⬜ Pending |
| Integrate Dashboard | ⬜ Pending |
| Integrate Analytics | ⬜ Pending |
| Integrate Daily Actions | ⬜ Pending |

**Total:** ~1.5 hours

---

## 💡 Đề xuất thứ tự thực hiện

```
Week 1:
├── OTB Data Integrity (1 session) ← Critical bugs
├── RMS MVP Phase 5 (ongoing)
└── PDF Export (1.5 hours)

Week 2:
├── Analytics Layer Phase 0.5-01 (2 sessions)
└── Analytics Layer Phase 02-03 (2 sessions)

Later:
└── Rate Shopper (~2 weeks)
```

---

## 📍 Quick Commands

```bash
# Fix OTB bugs
/code phase-01  (trong context OTB Data Integrity)

# Tiếp tục UI
/code phase-05  (trong context RMS MVP)

# Code PDF Export
"Code PDF đi"

# Check progress
/next

# Save context
/save-brain
```
