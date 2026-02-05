# Phase 07: Testing & Verification

**Status:** ⬜ Pending  
**Dependencies:** All previous phases  
**Estimated Time:** 1 hour

---

## Objective

Kiểm tra toàn bộ module hoạt động đúng, deploy lên Vercel.

---

## Tasks

### 7.1. Database Verification
- [ ] All tables exist in Supabase
- [ ] PromotionCatalog seeded (17 Agoda records)
- [ ] Indexes created

### 7.2. API Testing
- [ ] Test CRUD room-types (Postman/curl)
- [ ] Test CRUD ota-channels
- [ ] Test CRUD campaigns
- [ ] Test calc-matrix with sample data

### 7.3. UI Testing
- [ ] Room Types: Add, Edit, Delete
- [ ] OTA Config: Add, Edit, Toggle active
- [ ] Promotions: Pick from catalog, validate rules
- [ ] Overview: Matrix displays, Export CSV

### 7.4. Calculation Verification
- [ ] Test Progressive mode with example
- [ ] Test Additive mode with example
- [ ] Verify trace shows correct steps

### 7.5. Permission Testing
- [ ] super_admin: full access
- [ ] hotel_admin: full access
- [ ] manager: limited edit
- [ ] viewer: read-only

### 7.6. Deploy & Verify
- [ ] `git add . && git commit -m "feat: Add OTA Pricing Module V01.2"`
- [ ] `git push origin main`
- [ ] Verify Vercel builds successfully
- [ ] Test on production URL

---

## Test Cases

### Calculation Test Cases

| Test | NET | Comm | Promos | Mode | Expected BAR |
|------|-----|------|--------|------|--------------|
| No promos | 1,000,000 | 20% | [] | PROG | 1,250,000 |
| 1 promo | 1,000,000 | 20% | [10%] | PROG | 1,388,889 |
| 2 promos | 1,000,000 | 20% | [10%, 5%] | PROG | 1,461,988 |
| Additive | 1,000,000 | 20% | [10%, 5%] | ADD | 1,470,588 |

### Validation Test Cases

| Test | Promos | Expected |
|------|--------|----------|
| 2 Seasonal | [Double Day, Payday] | Error |
| 2 VIP same | [VIP Gold, VIP Platinum] | Error |
| Different subcat | [VIP Gold, Mobile] | OK |
| Total > 80% | [10%, 30%, 50%] | Error |

---

## Checklist

- [ ] Build passes: `npm run build`
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Mobile responsive
- [ ] All CRUD operations work
- [ ] Calculation correct
- [ ] Export CSV works
- [ ] Permissions enforced
- [ ] Deployed to Vercel

---

## Post-Deploy

- [ ] Update `.brain/brain.json` with new feature
- [ ] Update `.brain/session.json` with changes
- [ ] Update `srs-rms-full.md` status to ✅

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Build time | < 2 mins |
| Load time (/pricing) | < 2 secs |
| Calc time (matrix) | < 500ms |
| Zero errors | ✅ |

