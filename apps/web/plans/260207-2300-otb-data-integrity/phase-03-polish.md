# Phase 03: Pricing & Middleware Polish
Status: ⬜ Pending
Dependencies: None (independent of Phase 01-02)

## Objective
Fix `NONE` rounding bug in pricing engine and return proper 401 JSON for API routes in middleware.

## Implementation Steps

### 1. [ ] Fix `NONE` rounding to truly not round (P1)
**File:** `lib/pricing/engine.ts` L114-116
```diff
 case 'NONE':
 default:
-    bar = Math.round(bar);
+    // NONE = no rounding at all, preserve raw float
+    break;
```

### 2. [ ] Enforce `validatePromotions` result (P1)
**File:** `lib/pricing/engine.ts` — after L24
```typescript
const validation = validatePromotions(discounts, commission, vendor);

// Enforce validation — reject if critical errors
if (!validation.isValid && validation.errors.length > 0) {
    return {
        bar: 0,
        barRaw: 0,
        net,
        commission,
        totalDiscount: 0,
        validation,
        trace: [],
    };
}
```

### 3. [ ] Return 401 JSON for API routes instead of redirect (P1)
**File:** `middleware.ts` L55-60
```diff
 if (!session?.user) {
+    // API routes should return 401 JSON, not redirect
+    if (pathname.startsWith('/api/')) {
+        return NextResponse.json(
+            { error: 'Unauthorized', message: 'Authentication required' },
+            { status: 401 }
+        );
+    }
     const loginUrl = new URL("/auth/login", request.url)
     loginUrl.searchParams.set("callbackUrl", pathname)
     return NextResponse.redirect(loginUrl)
 }
```

## Test Criteria
- [ ] `calcBarFromNet(800000, 15, [], 'PROGRESSIVE', 'NONE')` returns exact float, no rounding
- [ ] Invalid promotions (e.g. discount > vendor cap) → returns `isValid: false` with `bar: 0`
- [ ] `GET /api/otb` without auth → returns `{ "error": "Unauthorized" }` with status 401
- [ ] Browser route `/dashboard` without auth → still redirects to `/auth/login`

---
Next Phase: [phase-04-verify.md](./phase-04-verify.md)
