# Software Requirements Specification (SRS)
## Revenue Management System (RMS) v01.9.1

**Document Version:** 1.9.1  
**Last Updated:** 2026-02-18  
**Status:** ✅ Production  
**Author:** 4TK Hospitality

---

## 1. Introduction

### 1.1 Purpose
Tài liệu này mô tả đầy đủ các yêu cầu phần mềm cho Hệ thống Quản lý Doanh thu Khách sạn (Revenue Management System - RMS). RMS là một nền tảng SaaS giúp các khách sạn tối ưu hóa giá phòng và tăng doanh thu thông qua phân tích dữ liệu và gợi ý giá thông minh.

### 1.2 Scope
RMS bao gồm các module chính:
- **Core RMS**: Quản lý OTB, Forecast, Pricing Recommendations
- **OTA Pricing Calculator**: Tính giá hiển thị trên các kênh OTA (3 modes: NET/BAR/Display)
- **Analytics Layer**: STLY comparison, Pace tracking, Pickup analytics
- **User Management**: Multi-tenant RBAC với Google OAuth
- **SaaS Infrastructure**: Subscriptions, Team Invites, Rate Limiting
- **OTA Growth Playbook**: Công cụ tối ưu ranking OTA (Premium feature)

### 1.3 Definitions & Acronyms

| Term | Definition |
|------|------------|
| OTB | On-The-Books - Số phòng/doanh thu đã được đặt |
| ADR | Average Daily Rate - Giá phòng trung bình |
| RevPAR | Revenue Per Available Room - Doanh thu/phòng khả dụng |
| STLY | Same Time Last Year - Cùng kỳ năm trước |
| Pickup | Số booking mới trong khoảng thời gian |
| Pace | Tốc độ đặt phòng so với năm trước |
| BAR | Best Available Rate - Giá công bố trên OTA |
| NET | Giá thực nhận sau khi trừ hoa hồng |

### 1.4 References
- [Technical Specification](./TECHNICAL_SPEC.md)
- [PRD/FRD Document](./PRD_FRD.md)
- [Database Schema](./database/schema.md)

---

## 2. Overall Description

### 2.1 Product Perspective
RMS là hệ thống độc lập, tích hợp với:
- **PMS (Property Management System)**: Nhận dữ liệu booking qua CSV/XML
- **OTA Channels**: Tính giá để cập nhật lên Agoda, Booking.com, Expedia...
- **Google OAuth**: Xác thực người dùng

### 2.2 Product Functions

```
┌─────────────────────────────────────────────────────────────┐
│                    RMS SYSTEM OVERVIEW                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Upload  │───▶│ Build OTB │───▶│ Features │              │
│  │ CSV/XML  │    │           │    │ (STLY,   │              │
│  └──────────┘    └──────────┘    │  Pickup) │              │
│                                   └────┬─────┘              │
│                                        │                     │
│                                        ▼                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Price   │◀───│ Forecast │◀───│ Analytics│              │
│  │ Decision │    │  Demand  │    │  Panel   │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│                                                              │
│  ┌───────────────────────────────────────────────┐         │
│  │           OTA PRICING CALCULATOR               │         │
│  │  NET ──▶ Commission ──▶ Promotions ──▶ BAR    │         │
│  └───────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 User Classes

| Role | Permissions | Typical User |
|------|-------------|--------------|
| **Super Admin** | Full system access, all hotels | IT Manager |
| **Hotel Admin** | Full hotel access, team management | General Manager |
| **Manager** | View + some edit (prices, decisions) | Revenue Manager |
| **Viewer** | Read-only access | Front Office Staff |

### 2.4 Operating Environment
- **Client**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Server**: Vercel (Node.js 18+)
- **Database**: PostgreSQL 16 (Supabase)
- **CDN**: Vercel Edge Network

### 2.5 Constraints
- Single-tenant per hotel (multi-hotel via HotelUser junction)
- Maximum 500 reservations per CSV upload
- OTB snapshot retention: 90 days
- File upload limit: 10MB

---

## 3. Functional Requirements

### 3.1 FR-001: User Authentication

| ID | FR-001 |
|----|--------|
| **Title** | Google OAuth Authentication |
| **Priority** | P0 - Critical |
| **Description** | Người dùng đăng nhập bằng tài khoản Google |
| **Actors** | All Users |
| **Preconditions** | Có tài khoản Google |
| **Flow** | 1. Click "Đăng nhập bằng Google"<br>2. Chọn tài khoản Google<br>3. Hệ thống kiểm tra email trong whitelist<br>4. Tạo session JWT<br>5. Redirect về Dashboard |
| **Postconditions** | User logged in, JWT stored |
| **Exceptions** | Email không được phép → Blocked page |
| **Notifications** | Telegram notification sent on every login (new + returning) (V01.9.1) |
| **Role Resolution** | Sidebar role fetched from DB via `/api/user/switch-hotel`, JWT role as fallback (V01.9.1) |
| **Hotel Resolution** | Active hotel validated against `HotelUser` table in DB, not stale JWT (V01.9.1) |

### 3.2 FR-002: Data Import

| ID | FR-002 |
|----|--------|
| **Title** | Import Reservations & Cancellations |
| **Priority** | P0 - Critical |
| **Description** | Upload file CSV/XML từ PMS để import booking data |
| **Actors** | Hotel Admin, Manager |
| **Preconditions** | User assigned to hotel |
| **Accepted Formats** | CSV (Cloudbeds, RoomRaccoon), XML (Opera Crystal Reports) |
| **Validation** | - File hash dedup<br>- Required fields check<br>- Date format validation<br>- Duplicate reservation_id detection<br>- Stale job cleanup on retry (V01.8) |
| **Postconditions** | Data stored in reservations_raw/cancellations_raw with GM reporting fields (V01.8) |

### 3.3 FR-003: OTB Calculation

| ID | FR-003 |
|----|--------|
| **Title** | Build On-The-Books Snapshot |
| **Priority** | P0 - Critical |
| **Description** | Tính OTB cho từng stay_date dựa trên reservations |
| **Formula** | `rooms_otb = SUM(rooms) WHERE book_time < cutoff AND (cancel_time IS NULL OR cancel_time >= cutoff)` |
| **Time-Travel** | Hỗ trợ as_of_date parameter để xem OTB tại thời điểm quá khứ |
| **Deduplication** | DISTINCT ON (reservation_id) ORDER BY snapshot_ts DESC |

### 3.4 FR-004: Analytics Features

| ID | FR-004 |
|----|--------|
| **Title** | Feature Calculation (STLY, Pickup, Pace) |
| **Priority** | P1 - Important |
| **Features** | |

| Feature | Calculation |
|---------|-------------|
| **STLY** | OTB cùng DOW, cùng week-of-year năm trước |
| **Pickup T-7** | OTB(today) - OTB(today-7) |
| **Pickup T-15** | OTB(today) - OTB(today-15) |
| **Pickup T-30** | OTB(today) - OTB(today-30) |
| **Pace vs LY** | OTB(today) - STLY |
| **Remaining Supply** | Hotel Capacity - rooms_otb |

### 3.5 FR-005: Demand Forecast

| ID | FR-005 |
|----|--------|
| **Title** | Heuristic Demand Forecasting |
| **Priority** | P1 - Important |
| **Algorithm** | Weighted average of historical pickup patterns |
| **Inputs** | OTB, Pickup T-7/15/30, STLY, Day-of-Week, Seasonality |
| **Output** | Predicted remaining demand per stay_date |
| **Timezone** | All date comparisons in UTC; `as_of_date` parsed as UTC midnight (V01.8 fix) |

### 3.6 FR-006: Price Recommendations

| ID | FR-006 |
|----|--------|
| **Title** | Ladder Pricing Strategy |
| **Priority** | P0 - Critical |
| **Algorithm** | Occupancy-based price tiers với guardrails |
| **Price Levels** | Level 1-5 based on remaining supply % |
| **Guardrails** | - Max step change: ±20%<br>- Min rate: hotel.min_rate<br>- Max rate: hotel.max_rate<br>- Manual override respected |
| **User Actions** | Accept / Override với reason code |

### 3.7 FR-007: OTA Pricing Calculator

| ID | FR-007 |
|----|--------|
| **Title** | OTA Price Calculation (3 Modes) |
| **Priority** | P0 - Critical |
| **Formula** | `BAR = NET / (1 - commission) / (1 - promo₁) / (1 - promo₂) ...` |
| **Supported OTAs** | Agoda, Booking.com, Expedia, Traveloka, Trip.com |
| **Calc Types** | Progressive (compound) / Additive (sum) / Single_Discount (isolated) |
| **Calculator Modes** | 1. Giá Thu về (NET → BAR + Display)<br>2. Giá BAR (BAR → NET + Display)<br>3. Giá Hiển thị (Display → BAR + NET) |
| **Features** | - Room type management<br>- Channel commission config<br>- 2-Layer Promotion Architecture (Engine + UI layers) (V01.6)<br>- 3-Tier Exclusion (EXCLUSIVE/Business Bookers/HIGHEST_WINS) (V01.6)<br>- Free Nights Deal (Stay X / Pay Y) (V01.6)<br>- Timing Conflict Resolution (Early Bird vs Last-Minute) (V01.7)<br>- Price matrix export |

### 3.8 FR-008: Dashboard

| ID | FR-008 |
|----|--------|
| **Title** | Revenue Dashboard with KPIs |
| **Priority** | P0 - Critical |
| **Components** | |

| Component | Description |
|-----------|-------------|
| **KPI Cards** | Rooms OTB, Remaining Supply, Avg Pickup T7, Cancelled Rooms |
| **OTB Chart** | Bar chart by stay_date (14/30/60/90 day tabs) |
| **Analytics Panel** | STLY comparison, Pace vs LY, Pickup trends |
| **Price Table** | Stay date, OTB, Forecast, Recommended price, Actions |

### 3.9 FR-009: Multi-Hotel Management

| ID | FR-009 |
|----|--------|
| **Title** | Multi-Tenant Hotel Switching |
| **Priority** | P1 - Important |
| **Features** | - Hotel switcher in sidebar<br>- Active hotel via cookie<br>- Auto-assign Demo Hotel for new users<br>- Tenant isolation on all queries |

### 3.10 FR-010: Export & Reports

| ID | FR-010 |
|----|--------|
| **Title** | Data Export Capabilities |
| **Priority** | P1 - Important |
| **Formats** | PDF (Dashboard), Excel (OTB data, Price Matrix) |

### 3.11 FR-011: OTA Growth Playbook

| ID | FR-011 |
|----|--------|
| **Title** | OTA Growth Playbook (Premium) |
| **Priority** | P1 - Important |
| **Description** | Bộ công cụ tối ưu ranking trên các kênh OTA, chỉ cho người dùng trả phí |
| **Actors** | Paid Users (Hotel Admin, Manager) |
| **Preconditions** | User has active paid subscription |
| **Tabs** | 1. Kiểm tra chỉ số OTA (Health Scorecard)<br>2. Booking.com Checklist<br>3. Agoda Checklist<br>4. Hiệu quả chương trình (ROI Calculator)<br>5. Điểm Review (Review Calculator)<br>6. Cách tăng Ranking (When to Boost) |
| **Scoring** | Weighted formula for Booking.com (7 metrics) and Agoda (7 metrics), total 100% each |
| **ROI Formula** | `Revenue = BAR × (1 - discount) × commission × rooms`, Compare with/without program |
| **Review Formula** | `newScore = (oldScore × count + newRating × newCount) / (count + newCount)` |
| **Paywall** | Non-paid users see `OTAGrowthPaywall` with feature preview |
| **PDF Engine** | modern-screenshot + jsPDF |

### 3.12 FR-012: SaaS Infrastructure

| ID | FR-012 |
|----|--------|
| **Title** | SaaS Infrastructure (V01.3) |
| **Priority** | P1 - Important |
| **Description** | Multi-tenant SaaS với subscription tiers, team invites, rate limiting |
| **Sub-features** | 1. Subscription tiers (STANDARD/SUPERIOR/DELUXE/SUITE)<br>2. Token-based team invites with short codes<br>3. IP-based rate limiting (DB-backed for Vercel)<br>4. Product event tracking (analytics)<br>5. 4-step onboarding wizard<br>6. Trial system (7 days + 7 bonus) |

### 3.13 FR-013: Comprehensive Guide

| ID | FR-013 |
|----|--------|
| **Title** | Guide Page with OTA Documentation (V01.7) |
| **Priority** | P1 - Important |
| **Description** | Comprehensive guide page with 4 sections and detailed OTA pricing documentation for all 5 channels |
| **Sections** | 1. Bắt đầu nhanh (QuickStart)<br>2. Quản lý Doanh thu (Revenue Management)<br>3. Tính giá OTA (OTA Pricing for 5 channels)<br>4. OTA Growth Playbook (Premium) |

### 3.14 FR-014: Payment Gateway & Pay-First Flow

| ID | FR-014 |
|----|--------|
| **Title** | Payment Gateway Integration & Pay-First Flow (V01.9) |
| **Priority** | P0 - Critical |
| **Description** | Tích hợp cổng thanh toán SePay (QR chuyển khoản VND) và PayPal (USD). Hỗ trợ Pay-First Flow cho demo users: thanh toán trước, tạo khách sạn sau. |
| **Gateways** | 1. SePay: QR Bank Transfer (VND)<br>2. PayPal: One-time Payment (USD)<br>3. Zalo: Manual Contact |
| **Pay-First Flow** | 1. Demo user chọn gói và thanh toán<br>2. PaymentTransaction tạo với hotel_id = NULL<br>3. Webhook xác nhận → status = COMPLETED, skip activation<br>4. Login tiếp → `/api/payments/pending-activation` phát hiện orphan<br>5. Redirect `/onboarding` → tạo hotel → link payment → activate subscription |
| **Standard Flow** | 1. Hotel admin chọn gói upgrade<br>2. PaymentTransaction tạo với hotel_id<br>3. Webhook/capture → applySubscriptionChange → activate ngay |
| **Transaction States** | PENDING → COMPLETED (webhook confirms)<br>PENDING → FAILED (amount mismatch/timeout) |
| **Idempotency** | @@unique([gateway, gateway_transaction_id]) chống duplicate webhook |
| **Onboarding Atomicity** | All onboarding completion steps (payment link, subscription activate, Demo Hotel removal, user.hotel_id update) in single Prisma $transaction (V01.9.1) |

### 3.15 FR-015: Monitoring & Notifications (V01.9.1)

| ID | FR-015 |
|----|--------|
| **Title** | Telegram Login Notifications & Diagnostic Tools |
| **Priority** | P1 - Important |
| **Description** | Gửi thông báo Telegram khi user đăng nhập (new + returning). Cung cấp API chẩn đoán và sửa user state. |
| **Notifications** | 1. 🆕 New user login: email + name<br>2. 🔑 Returning user login: email + name + hotel list<br>3. Fire-and-forget (không block login) |
| **Diagnostic APIs** | 1. `GET /api/debug/user-state`: xem state hiện tại của user<br>2. `POST /api/debug/repair-user`: sửa broken user state |
| **Implementation** | `notifyUserLogin()` in `lib/telegram.ts`, called from JWT callback in `lib/auth.ts` |


---

## 4. Non-Functional Requirements

### 4.1 NFR-001: Performance

| Metric | Requirement |
|--------|-------------|
| Page Load | < 3 seconds |
| API Response | < 500ms (p95) |
| CSV Import (500 rows) | < 10 seconds |
| OTB Build (90 days) | < 30 seconds |
| Concurrent Users | 50+ per hotel |

### 4.2 NFR-002: Security

| Requirement | Implementation |
|-------------|----------------|
| Authentication | NextAuth.js v5 + Google OAuth |
| Authorization | Role-based (super_admin > hotel_admin > manager > viewer) |
| Data Isolation | Hotel ID filter on all queries |
| Session | JWT with httpOnly cookies |
| Secrets | Environment variables (never in code) |

### 4.3 NFR-003: Reliability

| Metric | Target |
|--------|--------|
| Uptime | 99.5% |
| Data Loss | Zero tolerance |
| Backup | Supabase auto-backup daily |
| Error Rate | < 0.1% |

### 4.4 NFR-004: Scalability

| Dimension | Capacity |
|-----------|----------|
| Hotels | 100+ concurrent |
| Reservations/Hotel | 100,000+ |
| OTB Snapshots | 90 days × 365 stay_dates |
| Users | 500+ total |

### 4.5 NFR-005: Usability

| Requirement | Implementation |
|-------------|----------------|
| Language | Vietnamese (primary) |
| Responsive | Mobile-first design |
| Accessibility | WCAG 2.1 AA compliance |
| Theme | Light SaaS Pro |
| Help | Integrated User Guide |

---

## 5. Data Requirements

### 5.1 Data Model Overview

```
Hotel (1) ──┬── (*) HotelUser ──── User
            │
            ├── (*) ImportJob ──── (*) ReservationsRaw
            │                 └─── (*) CancellationRaw
            │
            ├── (*) DailyOTB
            ├── (*) FeaturesDaily
            ├── (*) DemandForecast
            ├── (*) PriceRecommendation
            │
            ├── (*) RoomType
            ├── (*) OtaChannel ──── (*) CampaignInstance
            ├── (1) PricingSetting
            │
            ├── (*) PricingDecision
            │
            ├── (*) HotelInvite          (V01.3 - Team Invites)
            ├── (1) Subscription          (V01.3 - Billing)
            │
            └── (*) Competitor            (Rate Shopper - deferred)
                    └── (*) CompetitorRate

Standalone Tables:
            ProductEvent                  (V01.3 - Analytics)
            RateLimitHit                  (V01.3 - Security)
            PromotionCatalog              (V01.2 - 61 items)
            RateShopCache / RateShopRequest (deferred)
            MarketSnapshot / RateShopRecommendation (deferred)
```

### 5.2 Data Retention

| Data Type | Retention | Reason |
|-----------|-----------|--------|
| ReservationsRaw | Indefinite | Audit trail |
| DailyOTB | 2 years | Historical analysis |
| FeaturesDaily | 1 year | STLY comparison |
| PricingDecision | 1 year | Audit compliance |
| ImportJob | 90 days | Debugging |

---

## 6. Acceptance Criteria

### 6.1 Core Workflow
- [ ] User can login with Google OAuth
- [ ] User can upload CSV/XML and see import status
- [ ] Dashboard shows correct OTB data
- [ ] Price recommendations are generated
- [ ] User can Accept/Override prices

### 6.2 Analytics
- [ ] STLY data matches year-ago values
- [ ] Pickup calculations are accurate
- [ ] Pace vs LY is correctly calculated

### 6.3 OTA Pricing
- [ ] NET → BAR calculation matches formula (Progressive/Additive/Single_Discount)
- [ ] All 5 OTAs supported with correct commissions
- [ ] Promotion stacking follows 2-Layer Architecture rules (V01.6)
- [ ] 3 Calculator modes work correctly (Giá Thu về / Giá BAR / Giá Hiển thị) (V01.7)
- [ ] Timing conflicts resolved (Early Bird vs Last-Minute → highest wins) (V01.7)
- [ ] Free Nights Deal calculates correct discount % (V01.6)
- [ ] 3-Tier Exclusion Engine enforces correctly (EXCLUSIVE/Business Bookers/HIGHEST_WINS) (V01.6)

### 6.4 OTA Growth Playbook
- [ ] Health Scorecard calculates correctly for Booking.com (7 metrics)
- [ ] Health Scorecard calculates correctly for Agoda (7 metrics)
- [ ] ROI Calculator shows profit/loss with 2 decimal VND formatting
- [ ] Review Impact Simulator calculates new weighted average
- [ ] Target Calculator shows reviews needed to reach goal
- [ ] When to Boost shows scenario-based recommendations
- [ ] Paywall blocks non-paid users with feature preview

### 6.5 SaaS Infrastructure (V01.3)
- [ ] Subscription tiers limit features correctly
- [ ] Team invites generate and validate tokens
- [ ] Rate limiting blocks excessive requests
- [ ] Onboarding wizard completes 4 steps

### 6.6 Payment Gateway (V01.9)
- [ ] SePay QR checkout works with correct VND amount
- [ ] PayPal checkout works with correct USD amount
- [ ] Pay-first flow: demo user can pay without hotel
- [ ] Orphan payment detected on login via pending-activation API
- [ ] Onboarding completion links orphan payment and activates subscription
- [ ] Duplicate webhooks rejected (idempotency via gateway_transaction_id)

### 6.8 Monitoring & Notifications (V01.9.1)
- [ ] New user login triggers Telegram notification (🆕)
- [ ] Returning user login triggers Telegram notification (🔑) with hotel list
- [ ] Notifications are fire-and-forget (do not slow down login)
- [ ] Sidebar role matches DB (not stale JWT)
- [ ] Hotel resolution validates cookie against HotelUser DB table
- [ ] `GET /api/debug/user-state` returns user's current diagnostic state
- [ ] `POST /api/debug/repair-user` fixes broken user-hotel associations

---

## 7. Appendix

### 7.1 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-15 | Initial release |
| 1.1.0 | 2026-01-25 | Cancellation Bridge |
| 1.2.0 | 2026-02-01 | OTA Pricing Module |
| 1.3.0 | 2026-02-05 | User Management, SaaS Infrastructure |
| 1.4.0 | 2026-02-09 | Analytics Layer + Time-Travel |
| 1.5.0 | 2026-02-10 | OTA Growth Playbook (Premium) |
| 1.6.0 | 2026-02-11 | 2-Layer Promotion Architecture, Free Nights, 3-Tier Exclusion |
| 1.7.0 | 2026-02-12 | 3 Calculator Modes, Timing Conflict Resolution, Guide Page |
| 1.8.0 | 2026-02-13 | GM Reporting Dimensions, Forecast Timezone Fix, Import Job Stale Cleanup |
| 1.9.0 | 2026-02-16 | Payment Gateways (SePay, PayPal), Pay-First Flow, Orphan Payment Recovery |
| 1.9.1 | 2026-02-18 | Telegram Login Notifications, Onboarding Race-Condition Fix, DB-based Hotel Resolution, Sidebar Role from DB, Diagnostic APIs |

### 7.2 Sign-off

| Role | Name | Date |
|------|------|------|
| Product Owner | - | - |
| Tech Lead | - | - |
| QA Lead | - | - |
