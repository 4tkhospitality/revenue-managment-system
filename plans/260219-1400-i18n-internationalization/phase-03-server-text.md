# Phase 03: Server-generated Text
Status: ⬜ Pending  
Dependencies: Phase 01 (International Surfaces)  
Effort: 3–5 ngày

## Objective

Refactor tất cả server-generated user-facing text: Pricing Engine `reasonTextVi` → `reason_code` + `params`, Telegram notifications, Email templates, API error responses. Enforce IRON RULE: server KHÔNG trả sentence.

## Requirements

### Functional
- [ ] Pricing Engine trả `reason_code` + `params` thay vì `reasonTextVi`
- [ ] `reason_code` catalog file (`reason-codes.ts`) là single source of truth
- [ ] Telegram notifications gửi theo `recipientUser.locale` hoặc `Org.default_locale`
- [ ] Email templates có version EN + VI
- [ ] API error responses trả `{ code, message_key, params }` thay vì hardcoded text

### Non-Functional
- [ ] Backward compatible: existing `reasonTextVi` field có thể deprecate gradually
- [ ] Unknown reason_code → log error + fallback display
- [ ] Notification locale follows §6.6 rules

## Implementation Steps

### Step 1: Create `reason_code` Registry

#### [NEW] `lib/i18n/reason-codes.ts`

```ts
export const REASON_CODES = {
  // Occupancy-based
  'reasons.PRICING.OCC_LEVEL': {
    params: ['occ', 'level'] as const,
    severity: 'info' as const,
  },
  'reasons.PRICING.OCC_HIGH': {
    params: ['occ', 'threshold'] as const,
    severity: 'warning' as const,
  },
  
  // Competitor-based
  'reasons.PRICING.COMP_RATE': {
    params: ['competitor', 'delta', 'compPrice'] as const,
    severity: 'info' as const,
  },
  
  // STLY-based
  'reasons.PRICING.STLY_PATTERN': {
    params: ['stlyOcc', 'direction'] as const,
    severity: 'info' as const,
  },
  
  // Stop sell
  'reasons.PRICING.STOP_SELL': {
    params: ['reason'] as const,
    severity: 'critical' as const,
  },
  
  // Pickup-based
  'reasons.PRICING.HIGH_PICKUP': {
    params: ['pickupRooms', 'period'] as const,
    severity: 'info' as const,
  },
  
  // Guardrail
  'reasons.PRICING.GUARDRAIL_MIN': {
    params: ['suggestedPrice', 'minPrice'] as const,
    severity: 'warning' as const,
  },
  'reasons.PRICING.GUARDRAIL_MAX': {
    params: ['suggestedPrice', 'maxPrice'] as const,
    severity: 'warning' as const,
  },
  
  // Heuristic fallback
  'reasons.PRICING.HEURISTIC': {
    params: ['method', 'confidence'] as const,
    severity: 'info' as const,
  },
} as const;

export type ReasonCode = keyof typeof REASON_CODES;

// Validate reason code exists
export function isValidReasonCode(code: string): code is ReasonCode {
  return code in REASON_CODES;
}
```

### Step 2: Add Reason Code Translations to Messages

#### [MODIFY] `messages/en.json`
```json
{
  "reasons": {
    "PRICING": {
      "OCC_LEVEL": "Occupancy {occ}% — level {level}, demand is high",
      "OCC_HIGH": "Occupancy {occ}% exceeds threshold {threshold}%",
      "COMP_RATE": "Competitor {competitor} is {delta}% different at {compPrice}",
      "STLY_PATTERN": "STLY occupancy {stlyOcc}% shows {direction} trend",
      "STOP_SELL": "Stop sell: {reason}",
      "HIGH_PICKUP": "{pickupRooms} rooms picked up in {period}",
      "GUARDRAIL_MIN": "Price {suggestedPrice} below min rate {minPrice}",
      "GUARDRAIL_MAX": "Price {suggestedPrice} above max rate {maxPrice}",
      "HEURISTIC": "Heuristic ({method}), confidence: {confidence}%"
    }
  }
}
```

#### [MODIFY] `messages/vi.json`
```json
{
  "reasons": {
    "PRICING": {
      "OCC_LEVEL": "Công suất {occ}% — mức {level}, nhu cầu cao",
      "OCC_HIGH": "Công suất {occ}% vượt ngưỡng {threshold}%",
      "COMP_RATE": "Đối thủ {competitor} chênh {delta}%, giá {compPrice}",
      "STLY_PATTERN": "STLY công suất {stlyOcc}% đang {direction}",
      "STOP_SELL": "Ngừng bán: {reason}",
      "HIGH_PICKUP": "{pickupRooms} phòng pickup trong {period}",
      "GUARDRAIL_MIN": "Giá {suggestedPrice} dưới giá sàn {minPrice}",
      "GUARDRAIL_MAX": "Giá {suggestedPrice} trên giá trần {maxPrice}",
      "HEURISTIC": "Heuristic ({method}), độ tin cậy: {confidence}%"
    }
  }
}
```

### Step 3: Refactor Pricing Engine Output

#### Target Files (in `lib/`):
- Pricing recommendation generators
- Heuristic pricing logic
- Pipeline output formatters

#### Change pattern:
```ts
// BEFORE
return {
  recommendedPrice: 1200000,
  reasonTextVi: "Công suất 84% — mức 4, nhu cầu cao",
};

// AFTER
return {
  recommendedPrice: 1200000,
  reason_code: "reasons.PRICING.OCC_LEVEL",
  reason_params: { occ: 84, level: 4 },
  reason_severity: "info",
  // Deprecation: keep reasonTextVi for backward compat during transition
  reasonTextVi: "Công suất 84% — mức 4, nhu cầu cao", // TODO: remove after Phase 03
};
```

### Step 4: Update UI to Render reason_code

#### Target Files:
- `components/dashboard/RecommendationTable.tsx`
- `components/dashboard/QuickModePanel.tsx`

```tsx
// BEFORE
<span>{row.reasonTextVi}</span>

// AFTER
const t = useTranslations();
<span>{t(row.reason_code, row.reason_params)}</span>
```

### Step 5: Telegram Notifications — Locale-aware

#### Target Files:
- Telegram notification functions in `lib/`
- Login notification, pipeline alerts, etc.

#### Change pattern:
```ts
// BEFORE
await sendTelegram(`🏨 ${user.name} vừa đăng nhập`);

// AFTER
const locale = resolveNotificationLocale({
  recipientUser: recipient,
  orgDefaultLocale: org?.default_locale,
});
const messages = await import(`../../messages/${locale}.json`);
// Use template with locale-specific messages
```

### Step 6: Email Templates — Locale Variants

#### Target Files:
- Email sending functions
- Email HTML templates

#### Approach:
- Create `emails/templates/{template_name}/{locale}.html`
- Or use message keys in template: `{{t('email.welcome.subject')}}`

### Step 7: API Error Responses

#### Scope:
- Standardize API error format: `{ error: { code: string, message_key: string, params?: object } }`
- Client-side: render `t(error.message_key, error.params)` instead of displaying raw message

### Step 8: Deprecate `reasonTextVi`

After all consumers updated:
- [ ] Remove `reasonTextVi` generation from engine
- [ ] Remove field from API response types
- [ ] Update tests

## Files to Create/Modify

| File | Change |
|------|--------|
| `lib/i18n/reason-codes.ts` | [NEW] Reason code registry |
| `messages/en.json` | Add `reasons.*` namespace |
| `messages/vi.json` | Add `reasons.*` namespace |
| Pricing engine files | Return `reason_code` + `params` |
| `RecommendationTable.tsx` | Render via `t()` |
| `QuickModePanel.tsx` | Render via `t()` |
| Telegram notification files | Locale-aware templates |
| Email template files | Locale variants |
| API error handlers | Standardized error format |

## Test Criteria

- [ ] Pricing recommendations display correctly in EN and VI
- [ ] Unknown reason_code → graceful fallback (code path displayed) + error logged
- [ ] Telegram notification sends in correct language for recipient
- [ ] Email template renders in recipient's locale
- [ ] API errors return structured `{ code, message_key, params }` format
- [ ] All reason codes in catalog match keys in message files (CI parity)

## Notes

- **Backward compatibility:** Keep `reasonTextVi` field during transition, remove in final step.
- **Telegram:** If group channel has mixed-language users, use `Org.default_locale`.
- **Email:** Consider starting with just 2 key emails (welcome, invoice) and expanding.
- **Reason codes:** Audit current pricing engine to extract ALL existing reason text patterns.

---
Next Phase: [phase-04-thai-expansion.md](file:///c:/Apps/Antigravity/revenue-management-system/plans/260219-1400-i18n-internationalization/phase-04-thai-expansion.md)
