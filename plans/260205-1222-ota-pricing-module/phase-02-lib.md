# Phase 02: Lib Functions

**Status:** ⬜ Pending  
**Dependencies:** Phase 01 (Database)  
**Estimated Time:** 30 mins

---

## Objective

Tạo calculation engine và validation functions cho pricing module.

---

## Tasks

### 2.1. Create Pricing Engine
- [ ] Create `lib/pricing/engine.ts`
- [ ] Implement `calcBarFromNet(net, commission, discounts[], calcType)`
- [ ] Implement `calcNetFromBar(bar, commission, discounts[], calcType)`
- [ ] Implement `generateTrace(steps)`

### 2.2. Create Validators
- [ ] Create `lib/pricing/validators.ts`
- [ ] Implement `validatePromoStack(promos)` - check Seasonal/Targeted rules
- [ ] Implement `validateDiscountCap(totalDiscount, cap)`
- [ ] Return `ValidationResult { isValid, errors[], warnings[] }`

### 2.3. Create Promotion Catalog
- [ ] Create `lib/pricing/catalog.ts`
- [ ] Export `AGODA_PROMOTIONS` array (17 items)
- [ ] Include group, subcategory, rules

### 2.4. Create Types
- [ ] Create `lib/pricing/types.ts`
- [ ] Export `CalcType`, `PromotionGroup`, `CalcResult`, `ValidationResult`

---

## Files to Create

| File | Description |
|------|-------------|
| `lib/pricing/engine.ts` | Core calculation functions |
| `lib/pricing/validators.ts` | Validation rules |
| `lib/pricing/catalog.ts` | Agoda promotion catalog |
| `lib/pricing/types.ts` | TypeScript interfaces |
| `lib/pricing/index.ts` | Re-exports |

---

## Code Snippets

### Calculation Engine
```typescript
// lib/pricing/engine.ts
export function calcBarFromNet(
  net: number,
  commission: number,  // % (0-100)
  discounts: { percent: number; calcType: CalcType }[],
  mode: CalcType
): CalcResult {
  // Step 1: Gross before discounts
  const gross = net / (1 - commission / 100);
  
  // Step 2: Apply discounts reverse
  let bar = gross;
  const trace: TraceStep[] = [];
  
  if (mode === 'PROGRESSIVE') {
    // BAR = gross / Π(1 - dᵢ)
    let multiplier = 1;
    discounts.forEach(d => {
      multiplier *= (1 - d.percent / 100);
    });
    bar = gross / multiplier;
  } else {
    // BAR = gross / (1 - Σdᵢ)
    const totalDiscount = discounts.reduce((sum, d) => sum + d.percent, 0);
    bar = gross / (1 - totalDiscount / 100);
  }
  
  return {
    bar: Math.round(bar),
    net,
    commission,
    totalDiscount: /* calculate */,
    trace,
    validation: { isValid: true, errors: [], warnings: [] }
  };
}
```

### Validator
```typescript
// lib/pricing/validators.ts
export function validatePromoStack(promos: PromotionInstance[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Rule 1: Max 1 Seasonal
  const seasonals = promos.filter(p => p.group === 'SEASONAL' && p.isActive);
  if (seasonals.length > 1) {
    errors.push('Chỉ được chọn 1 Seasonal promotion');
  }
  
  // Rule 2: Max 1 Targeted per subcategory
  const targeteds = promos.filter(p => p.group === 'TARGETED' && p.isActive);
  const subcats = groupBy(targeteds, 'subCategory');
  Object.entries(subcats).forEach(([subcat, items]) => {
    if (items.length > 1) {
      errors.push(`Chỉ được chọn 1 Targeted trong nhóm ${subcat}`);
    }
  });
  
  return { isValid: errors.length === 0, errors, warnings };
}
```

---

## Test Criteria

- [ ] `calcBarFromNet(1000000, 20, [], 'PROGRESSIVE')` returns 1250000
- [ ] `calcBarFromNet(1000000, 20, [{percent: 10}], 'PROGRESSIVE')` returns ~1388889
- [ ] `validatePromoStack()` catches 2 Seasonals
- [ ] Types properly exported

---

**Next Phase:** [phase-03-api.md](phase-03-api.md)

