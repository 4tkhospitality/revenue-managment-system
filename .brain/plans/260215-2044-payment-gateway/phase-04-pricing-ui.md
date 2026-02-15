# Phase 04: Pricing Plans Page (3 Options UI)
Status: ⬜ Pending
Dependencies: Phase 02, Phase 03
Updated: 2026-02-15 (P0 review applied)

## Objective
Redesign `/pricing-plans` page với 3 phương thức: SePay (VND), PayPal (USD), Zalo contact.
Tích hợp PLG event tracking.

## Implementation Steps

### 4.1. Pricing Page Layout
- [ ] Redesign `/pricing-plans` page:
  - Hero: "Chọn gói phù hợp cho khách sạn của bạn"
  - Tier cards: STANDARD (miễn phí) / SUPERIOR / DELUXE / SUITE
  - Mỗi card: features, giá VND/USD, nút nâng cấp
  - "Gói hiện tại" badge trên card đang dùng
  - Disable downgrade (chỉ cho upgrade)
  - Trial countdown nếu đang trial
- [ ] **Log event**: `pricing_viewed` khi page load

### 4.2. Payment Method Modal (3 options)
- [ ] `components/payments/PaymentMethodModal.tsx`
- [ ] User click "Nâng cấp" → modal hiện 3 lựa chọn:

```
┌─────────────────────────────────────────────────┐
│         Nâng cấp lên gói SUPERIOR               │
│         495.000₫/tháng · $19.90/month            │
├─────────────────────────────────────────────────┤
│                                                  │
│  ① 💳 Chuyển khoản / QR Banking (VND)           │
│     SePay.vn — Phí chỉ 200-500đ                 │
│     Thanh toán nhanh bằng QR code                │
│     [Thanh toán ngay →]                          │
│                                                  │
│  ② 🌍 PayPal (USD)                              │
│     Visa / MasterCard / PayPal Wallet            │
│     Tự động gia hạn hàng tháng                   │
│     [Rendered PayPal Button]                     │
│                                                  │
│  ③ 💬 Liên hệ Zalo trước khi đăng ký           │
│     Tư vấn gói phù hợp, hỗ trợ 1-1             │
│     [Chat Zalo 0778602953 →]                     │
│                                                  │
└─────────────────────────────────────────────────┘
```

- [ ] **Log events**:
  - `upgrade_clicked` khi bấm "Nâng cấp" (with tier)
  - `payment_method_selected` khi chọn SePay/PayPal/Zalo

### 4.3. Zalo Contact Button
- [ ] `components/payments/ZaloContactButton.tsx`
- [ ] Deep link: `https://zalo.me/0778602953`
- [ ] **Log event**: `zalo_clicked` (with tier, roomBand)
- [ ] Works on both mobile (Zalo app) and desktop (Zalo web)

### 4.4. SePay Checkout Button
- [ ] `components/payments/SepayCheckoutButton.tsx`
- [ ] POST to `/api/payments/sepay/create-checkout`
- [ ] Handle redirect to SePay checkout page
- [ ] Show loading state during redirect

### 4.5. PayPal Checkout Component
- [ ] Renders inline PayPal button
- [ ] Already built in Phase 03 (`PayPalCheckout.tsx`)
- [ ] Integrate into modal

### 4.6. PLG — Paywall CTA
- [ ] Trong `TierPaywall` component: thay vì chỉ nói "Upgrade required"
- [ ] Thêm CTA button dẫn thẳng về modal chọn phương thức thanh toán
- [ ] Đặt ở nơi GM vừa thấy "value" (VD: OTA Growth Playbook tab premium)

### 4.7. PLG Event Tracking
- [ ] Utility: `lib/payments/trackEvent.ts`
- [ ] Events tối thiểu:

| Event | Khi nào | Data |
|-------|---------|------|
| `pricing_viewed` | Load /pricing-plans | userId, currentTier |
| `upgrade_clicked` | Click "Nâng cấp" | targetTier, roomBand |
| `payment_method_selected` | Chọn SePay/PayPal/Zalo | method, tier |
| `payment_success` | Webhook xác nhận thanh toán | gateway, tier, amount |
| `payment_failed` | Webhook báo lỗi | gateway, tier, reason |
| `zalo_clicked` | Bấm Zalo button | tier, roomBand |

### 4.8. Mobile Responsive
- [ ] Tier cards: stack vertically on mobile
- [ ] Payment modal: bottom sheet on mobile
- [ ] Zalo button: prominent size on mobile (VN users)

## Files to Create/Modify
| File | Action |
|------|--------|
| `app/pricing-plans/page.tsx` | MODIFY |
| `components/payments/PaymentMethodModal.tsx` | NEW |
| `components/payments/ZaloContactButton.tsx` | NEW |
| `components/payments/SepayCheckoutButton.tsx` | NEW |
| `components/paywall/TierPaywall.tsx` | MODIFY — add CTA to payment modal |
| `lib/payments/trackEvent.ts` | NEW |

## Test Criteria
- [ ] All 3 payment methods visible
- [ ] SePay redirects to checkout
- [ ] PayPal button renders in sandbox
- [ ] Zalo opens app/web correctly
- [ ] All PLG events fire correctly
- [ ] Paywall CTA leads to payment modal
- [ ] Mobile responsive layout
