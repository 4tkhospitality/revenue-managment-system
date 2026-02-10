# Software Requirements Specification (SRS)
## Revenue Management System (RMS) v01.5

**Document Version:** 1.5.0  
**Last Updated:** 2026-02-10  
**Status:** ✅ Production  
**Author:** 4TK Hospitality

---

## 1. Introduction

### 1.1 Purpose
Tài liệu này mô tả đầy đủ các yêu cầu phần mềm cho Hệ thống Quản lý Doanh thu Khách sạn (Revenue Management System - RMS). RMS là một nền tảng SaaS giúp các khách sạn tối ưu hóa giá phòng và tăng doanh thu thông qua phân tích dữ liệu và gợi ý giá thông minh.

### 1.2 Scope
RMS bao gồm các module chính:
- **Core RMS**: Quản lý OTB, Forecast, Pricing Recommendations
- **OTA Pricing Calculator**: Tính giá hiển thị trên các kênh OTA
- **Analytics Layer**: STLY comparison, Pace tracking, Pickup analytics
- **User Management**: Multi-tenant RBAC với Google OAuth
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

### 3.2 FR-002: Data Import

| ID | FR-002 |
|----|--------|
| **Title** | Import Reservations & Cancellations |
| **Priority** | P0 - Critical |
| **Description** | Upload file CSV/XML từ PMS để import booking data |
| **Actors** | Hotel Admin, Manager |
| **Preconditions** | User assigned to hotel |
| **Accepted Formats** | CSV (Cloudbeds, RoomRaccoon), XML (Opera Crystal Reports) |
| **Validation** | - File hash dedup<br>- Required fields check<br>- Date format validation<br>- Duplicate reservation_id detection |
| **Postconditions** | Data stored in reservations_raw/cancellations_raw |

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
| **Title** | NET → BAR Price Calculation |
| **Priority** | P0 - Critical |
| **Formula** | `BAR = NET / (1 - commission) / (1 - promo₁) / (1 - promo₂) ...` |
| **Supported OTAs** | Agoda, Booking.com, Expedia, Traveloka, Trip.com |
| **Modes** | Progressive (compound) / Additive (sum) |
| **Features** | - Room type management<br>- Channel commission config<br>- Promotion stacking rules<br>- Price matrix export |

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
            │
            └── (*) PricingDecision
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
- [ ] NET → BAR calculation matches formula
- [ ] All 5 OTAs supported with correct commissions
- [ ] Promotion stacking follows rules

### 6.4 OTA Growth Playbook
- [ ] Health Scorecard calculates correctly for Booking.com (7 metrics)
- [ ] Health Scorecard calculates correctly for Agoda (7 metrics)
- [ ] ROI Calculator shows profit/loss with 2 decimal VND formatting
- [ ] Review Impact Simulator calculates new weighted average
- [ ] Target Calculator shows reviews needed to reach goal
- [ ] When to Boost shows scenario-based recommendations
- [ ] Paywall blocks non-paid users with feature preview

---

## 7. Appendix

### 7.1 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-15 | Initial release |
| 1.1.0 | 2026-01-25 | Cancellation Bridge |
| 1.2.0 | 2026-02-01 | OTA Pricing Module |
| 1.3.0 | 2026-02-05 | User Management |
| 1.4.0 | 2026-02-09 | Analytics Layer + Time-Travel |
| 1.5.0 | 2026-02-10 | OTA Growth Playbook (Premium) |

### 7.2 Sign-off

| Role | Name | Date |
|------|------|------|
| Product Owner | - | - |
| Tech Lead | - | - |
| QA Lead | - | - |
