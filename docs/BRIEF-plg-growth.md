# BRIEF: PLG Growth + Auto Monetization — RMS

**Ngày tạo:** 2026-02-13
**Brainstorm:** Sales team + Dev review

---

## 1. Vấn đề

RMS có sản phẩm tốt nhưng chưa có **tự động hóa bán hàng**: user dùng Free không biết nên upgrade, không có friction đúng lúc, không có nudge theo hành vi. Cần biến schema hiện có (Subscription + ProductEvent + HotelUser) thành **PLG engine tự vận hành**.

## 2. Giải pháp: 2 lớp + 3 nhóm trigger

### Lớp 1 — Entitlements Service
`getEntitlements(hotel_id)` → trả về plan, limits, feature flags. Gắn vào API routes + server actions.

### Lớp 2 — Usage Meter
Bảng `UsageMonthly` roll-up hàng ngày từ `ProductEvent`. Dùng cho gating + nudge.

### 3 nhóm trigger upgrade

| Nhóm | Trigger | Recommend |
|------|---------|-----------|
| **A: Gặp giới hạn** | Import limit ≥ 3 lần/30d, export blocked ≥ 2/7d | → SUPERIOR |
| **B: Thấy value** | Playbook opens ≥ 5 + data ≥ 30 ngày | → DELUXE |
| **C: Cần mở rộng** | Attempt tạo hotel thứ 2 | → SUITE |

Mỗi recommend kèm `reason_codes[]` để UI hiển thị lý do.

## 3. Gating Policy (MVP)

| Feature | Gate | Hành vi |
|---------|------|---------|
| OTA Calculator | **Free** | Dùng thoải mái (mồi câu) |
| Dynamic Pricing Matrix | **Soft** | Xem read-only, chặn export/save/apply |
| Playbook / Growth | **Soft** | Preview + sample, chặn action |
| Multi-hotel | **Hard** | Chặn tạo hotel thứ 2 |
| Rate Shopper | **Hard + credits** | Chặn nếu không có credits |
| Dashboard/Analytics | **Preview** | Demo snapshot, data thật cần plan |

## 4. Packaging (UI label ≠ enum)

| Enum (DB) | UI Label | Highlights |
|-----------|----------|------------|
| STANDARD | **Starter** (Free) | OTA Calculator single-quote, 1 export/ngày, 1 hotel, retention 1-3 tháng |
| SUPERIOR | **Superior** | Full matrix + export, bulk promo, import quota cao |
| DELUXE | **Deluxe** | Dashboard/Analytics + Playbook + team seats |
| SUITE | **Suite** | Multi-hotel + unlimited seats + rate shopper credits |

### Free (Starter) — "Single-quote engine":
- Nhập BAR/NET, chọn OTA, commission, promotions → ra giá + trace
- So sánh tối đa 3 kịch bản — **session-based** (đóng tab = mất, không persist)
  - Lưu client-state (Zustand/React state), không localStorage, không DB
  - Khi user cố Save/Pin scenario → `UpgradeModal` (reason: `SCENARIO_PERSIST_PAYWALL`)
  - Badge: "Starter: Scenarios tạm thời (không lưu)" + CTA "Upgrade để lưu & export"
- Export giới hạn 1/ngày, không có batch/bulk
- Tính đúng (full promo types) — sai = mất trust

## 5. Trial Policy: 7 + 7 bonus

- **Trigger**: User bấm "Upload dữ liệu thật" → tạo hotel + `TRIAL` 7 ngày
- **Bonus +7 ngày** nếu đạt 2/3 conditions trong 7 ngày đầu:
  - `IMPORT_SUCCESS` ≥ 1 (data ownership)
  - `DASHBOARD_VIEW_SESSION` ≥ 3 sessions (engagement)
  - `PRICING_TAB_SESSION_VIEW` ≥ 2 sessions (core adoption)
- **Session-dedup logging:** tạo `session_id` trong sessionStorage, mỗi session chỉ log 1 event/loại
- Roll-up: `COUNT(DISTINCT session_id)` cho dashboard/pricing sessions

## 6. Payment Phases

- **Phase 1**: Bank transfer + upload receipt / admin approve
- **Phase 2**: Cổng thanh toán VN (Sepay hoặc tương đương)
- **Phase 3**: Stripe (nếu target quốc tế)

## 7. Schema bổ sung (ít đụng existing)

```prisma
model UsageMonthly {
  id              String   @id @default(uuid()) @db.Uuid
  hotel_id        String   @db.Uuid
  month           DateTime // First day of month
  imports         Int      @default(0)
  exports         Int      @default(0)
  playbook_views  Int      @default(0)
  active_users    Int      @default(0)
  last_rollup_at  DateTime?
  @@unique([hotel_id, month])
  @@map("usage_monthly")
}
```

ProductEvent log chỉ meaningful events:
`import_success`, `export_success`, `export_blocked`, `playbook_open`, `upgrade_click`, `create_hotel_attempt`, `invite_attempt_blocked`, `paywall_view`

## 8. Implementation Priority — PLG Layer (~2 tuần)

| # | Task | Effort | Week |
|---|------|--------|------|
| 1 | `entitlements.ts` — resolve plan/limits/features | 1-2 ngày | W1 |
| 2 | `guard.ts` — requireFeature(), requireQuota() | 1 ngày | W1 |
| 3 | Log billable events → ProductEvent | 1 ngày | W1 |
| 4 | UI: PlanBadge + UsageMeter components | 2-3 ngày | W1 |
| 5 | UpgradeModal + Billing card + Settings | 3-5 ngày | W2 |
| 6 | UsageMonthly model + cron roll-up | 1 ngày | W2 |
| 7 | Recommendation triggers + reason_codes | 2 ngày | W2 |

---

## 9. Reseller / Partner Program

### 9.1 Attribution Rule: Lifetime + Active Condition

- **Lifetime attribution**: Hotel gắn reseller A thì mãi thuộc A
- **Active condition**: Commission valid khi `subscription.status == ACTIVE` và paid liên tục
- **Grace period**: 60 ngày — gián đoạn > 60 ngày → đóng attribution (`ended_reason: CHURN_GT_60D`), ngừng commission
- **Re-subscribe ≤ 60 ngày**: attribution giữ nguyên
- **Re-subscribe > 60 ngày**: admin có quyền re-attach (tạo record mới)
- Attribution history **không bao giờ xóa**

### 9.2 Commission Policy

- **Rate MVP**: Flat **20% net collected**, recurring (kèm active condition + clawback)
- **Net collected** = tiền thực thu, sau discount/coupon, sau refund/chargeback, không VAT
- **Upgrade/Downgrade**: Commission theo **actual invoice amount** (win-win-win)
- **Past_due**: 0 commission cho tới khi `paid_at != null`
- **Clawback**: refund trong 30 ngày hoặc chargeback → reversal (âm) trong CommissionLedger
- **Tiered** (15/20/25% theo volume): Phase 2/3, schema đã mở đường

### 9.3 CommissionLedger: Append-only (nguyên tắc số 1)

- Không bao giờ UPDATE amount
- Sai → tạo REVERSAL hoặc ADJUSTMENT row mới
- Mỗi row snapshot: `contract_id`, `rate`, `rule_version`
- Không dùng rate hiện tại tính lại kỳ cũ

### 9.4 Gắn reseller 3 cách

| Cách | Tự động? | Khi nào |
|------|----------|---------|
| Referral link `?ref=RES123` | Tự động | Online |
| Coupon code `OTA-GURU-ABC` | Tự động | Checkout/trial |
| Manual attach (admin) | Thủ công | Offline, kèm lý do + audit log |

### 9.5 Schema bổ sung (Reseller)

```prisma
model Reseller {
  id            String   @id @default(uuid()) @db.Uuid
  name          String
  email         String?
  phone         String?
  tax_info      String?
  bank_account  String?
  status        String   @default("ACTIVE") // ACTIVE | SUSPENDED
  ref_code      String   @unique // "RES123"
  created_at    DateTime @default(now())
  @@map("resellers")
}

model ResellerAttribution {
  id              String    @id @default(uuid()) @db.Uuid
  hotel_id        String    @db.Uuid
  reseller_id     String    @db.Uuid
  method          String    // "LINK" | "COUPON" | "MANUAL"
  attributed_at   DateTime  @default(now())
  attributed_by   String?   @db.Uuid // admin user_id (for MANUAL)
  effective_to    DateTime? // null = active; set when closed
  ended_reason    String?   // "CHURN_GT_60D" | "ADMIN_OVERRIDE"
  @@map("reseller_attributions")
}

model ResellerContract {
  id              String    @id @default(uuid()) @db.Uuid
  reseller_id     String    @db.Uuid
  commission_rate Float     // 0.20 = 20%
  commission_type String    // "RECURRING" | "RECURRING_CAPPED"
  max_months      Int?      // null = forever (with active condition)
  effective_from  DateTime
  effective_to    DateTime? // null = current
  created_by      String    @db.Uuid
  @@map("reseller_contracts")
}

model CommissionLedger {
  id              String   @id @default(uuid()) @db.Uuid
  reseller_id     String   @db.Uuid
  hotel_id        String   @db.Uuid
  invoice_id      String?  @db.Uuid
  contract_id     String   @db.Uuid
  amount          Float    // negative = reversal
  rate            Float    // snapshot from contract
  rule_version    String   @default("v1")
  status          String   @default("PENDING") // PENDING | APPROVED | PAID | REVERSED
  created_at      DateTime @default(now())
  note            String?
  @@map("commission_ledger")
}

model Payout {
  id              String   @id @default(uuid()) @db.Uuid
  reseller_id     String   @db.Uuid
  period_start    DateTime
  period_end      DateTime
  total_amount    Float
  paid_at         DateTime?
  method          String?  // "BANK_TRANSFER"
  reference       String?  // transaction ref
  @@map("payouts")
}
```

### 9.7 Promo Code & Discount System

#### Offer Templates (Admin-controlled, reseller không set %)

| Type | Tạo bởi | Dùng bởi | Ví dụ |
|------|---------|----------|-------|
| **GLOBAL** | Admin | Mọi khách (auto, có thể không cần code) | `PREPAY_6M_10`, `PREPAY_12M_15` |
| **RESELLER** | Admin | Reseller chọn để tạo code (kèm attribution) | `RES10_3M`, `RES15_1M`, `NO_DISCOUNT_ATTR_ONLY` |
| **CAMPAIGN** | Admin | Có thời hạn/giới hạn, global hoặc reseller-scoped | `TET2026_20OFF` |

#### Discount Rules (no stacking)

- **Best discount wins**: invoice chỉ áp 1 discount cao nhất
- **Attribution luôn attach** nếu code có `reseller_id`, dù discount thắng là global
- **Tie-breaker**: `percent_off` lớn nhất → CAMPAIGN > GLOBAL > RESELLER → `created_at` nhỏ hơn
- **1 hotel = 1 active promo code**. MVP: reject code thứ 2
- **Commission base** = `invoice.amount_net` (sau discount, sau refund, không VAT)

#### Schema bổ sung

```prisma
model PromoCode {
  id                    String    @id @default(uuid()) @db.Uuid
  code                  String    @unique
  reseller_id           String?   @db.Uuid // null = global
  template_type         String    // "GLOBAL" | "RESELLER" | "CAMPAIGN"
  percent_off           Float     // 0.10 = 10%
  duration_months       Int       // số tháng áp discount
  min_prepay_months     Int?      // null = không yêu cầu
  max_redemptions       Int?      // null = unlimited
  current_redemptions   Int       @default(0) // atomic increment
  eligible_plans        String?   // "SUPERIOR,DELUXE" hoặc null = all
  expires_at            DateTime?
  is_active             Boolean   @default(true)
  created_at            DateTime  @default(now())
  @@map("promo_codes")
}

model PromoRedemption {
  id              String   @id @default(uuid()) @db.Uuid
  promo_code_id   String   @db.Uuid
  hotel_id        String   @db.Uuid
  first_invoice_id String? @db.Uuid
  redeemed_at     DateTime @default(now())
  status          String   @default("ACTIVE") // ACTIVE | VOIDED | EXPIRED
  @@map("promo_redemptions")
}
```

**Atomic redemption** (Postgres):
```sql
UPDATE promo_codes
SET current_redemptions = current_redemptions + 1
WHERE code = $1 AND is_active = true
  AND (max_redemptions IS NULL OR current_redemptions < max_redemptions)
-- 0 rows = reject
```

**Hotel source of truth**: `Hotel.active_promo_code_id` (nullable). Redemption history in `PromoRedemption`.

### 9.8 Implementation — Reseller + Promo Phases (sau PLG Layer)

| Phase | Scope | Effort |
|-------|-------|--------|
| **R1** | Reseller + Attribution + manual commission | ~1 tuần |
| **R2** | PromoCode + Redemption + offer templates | ~1 tuần |
| **R3** | CommissionLedger auto-calc + Reseller Portal | ~2 tuần |
| **R4** | Payout management + audit log + PDF statements | ~1 tuần |

---

## 10. Full Roadmap

| Sprint | Focus | Effort |
|--------|-------|--------|
| **S1** | PLG Layer (entitlements + guard + UI) | ~2 tuần |
| **S2** | Reseller R1 + R2 (attribution + promo) | ~2 tuần |
| **S3** | Reseller R3 (auto commission + portal) | ~2 tuần |
| **S4** | Reseller R4 (payout + audit) | ~1 tuần |

## 11. Bước tiếp theo

→ `/plan` để thiết kế chi tiết Sprint 1 (PLG Layer)
