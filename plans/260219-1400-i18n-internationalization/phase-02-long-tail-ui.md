# Phase 02: Long Tail UI
Status: ⬜ Pending  
Dependencies: Phase 01 (International Surfaces)  
Effort: 5–8 ngày

## Objective

Extract tất cả remaining Vietnamese strings: Admin pages, Data/Upload, Guide/Playbook, Rate Shopper, Onboarding, Error messages, Tooltips, Empty states. Sau phase này, 100% UI text đều qua `t()`.

## Requirements

### Functional
- [ ] Admin pages dùng `t()`
- [ ] Data/Upload pages dùng `t()`
- [ ] Guide/Playbook pages dùng `t()`
- [ ] Rate Shopper pages dùng `t()`
- [ ] Onboarding flow dùng `t()`
- [ ] All error messages, validation text, and tooltips dùng `t()`
- [ ] Empty states and loading states dùng `t()`
- [ ] Billing/Payment pages dùng `t()`

### Non-Functional
- [ ] CI hardcode check passes: 0 Vietnamese strings in .tsx files
- [ ] Message parity: en.json and vi.json have identical key sets

## Implementation Steps

### Step 1: Admin Pages

#### Target Files:
- `app/admin/` — 4 files
- `components/admin/` — 2 components

#### Key strings:
- User management labels
- Hotel management labels
- System settings labels

### Step 2: Data & Upload Pages

#### Target Files:
- `app/data/` — 14 files
- `app/upload/` — 2 files

#### Key strings:
- Upload instructions, file format requirements
- Data table headers
- Import/export labels
- Status messages (success, error, processing)

### Step 3: Guide & Playbook

#### Target Files:
- `app/guide/` — 2 files
- `components/guide/` — 8 components

#### Key strings:
- Guide content headings and descriptions
- Playbook step labels
- Help text, tips

### Step 4: Rate Shopper

#### Target Files:
- `app/rate-shopper/` — 4 files

#### Key strings:
- Competitor labels
- Rate comparison headers
- Market analysis terms

### Step 5: Onboarding Flow

#### Target Files:
- `app/onboarding/` — 1 file (multi-step)

#### Key strings:
- Welcome messages
- Setup instructions
- Form labels, validation messages
- Completion messages

### Step 6: Billing & Payment

#### Target Files:
- `app/payment/` — 2 files
- `app/pricing-plans/` — 2 files
- `components/billing/` — 7 components
- `components/payments/` — 2 components
- `components/paywall/` — 2 components

#### Key strings:
- Plan names, descriptions
- Payment form labels
- Invoice text
- Upgrade/downgrade messages

### Step 7: Shared Components

#### Target Files:
- `components/HotelSwitcher.tsx`
- `components/DatePickerSnapshot.tsx`
- `components/AuditTeaser.tsx`
- `components/PaywallModal.tsx`
- `components/UpgradeBanner.tsx`
- `components/gates/` — 2 components
- `components/compliance/` — 1 component

### Step 8: Analytics Components

#### Target Files:
- `components/analytics/` — 15 components

#### Key strings:
- Chart titles and labels
- Metric names
- Period labels (Hôm nay, Hôm qua, 7 ngày, 30 ngày...)

### Step 9: Error & Validation Messages

#### Scope:
- Scan all `toast()`, `alert()`, error display strings
- Form validation messages (Zod schemas with Vietnamese messages)
- 404/500/error boundary pages

### Step 10: Final Sweep & CI Gate

- Run Vietnamese hardcode detector on entire codebase
- Fix any remaining hardcoded strings
- Verify CI parity check passes

## Files to Create/Modify

### Estimated File Count: ~60-70 files

| Area | Files | Priority |
|------|-------|----------|
| Admin | 6 | P1 |
| Data/Upload | 16 | P1 |
| Guide/Playbook | 10 | P2 |
| Rate Shopper | 4 | P1 |
| Onboarding | 1 | P1 |
| Billing/Payment | 13 | P1 |
| Shared components | 7 | P1 |
| Analytics | 15 | P1 |
| Message files | 2 | P0 |

## Test Criteria

- [ ] CI hardcode check: `grep` returns 0 Vietnamese characters in `.tsx` files
- [ ] CI parity check: `i18n-parity.js` passes (0 missing keys)
- [ ] All pages render correctly in both EN and VI
- [ ] No layout breaks from text length differences
- [ ] Empty states display correctly in both languages
- [ ] Error messages display in user's locale
- [ ] Onboarding flow works end-to-end in EN

## Notes

- **Volume:** This is the largest phase by file count (~60-70 files). Consider batching by area.
- **Tone:** Keep SaaS professional tone in EN — avoid overly casual translations.
- **Date formats:** Ensure all date displays use `formatDate()` wrapper, not raw `toLocaleDateString()`.
- **Guide content:** Long-form guide text may need professional translation — consider using placeholder English first.

---
Next Phase: [phase-03-server-text.md](file:///c:/Apps/Antigravity/revenue-management-system/plans/260219-1400-i18n-internationalization/phase-03-server-text.md)
