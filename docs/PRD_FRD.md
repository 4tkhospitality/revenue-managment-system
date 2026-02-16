# Product Requirements Document (PRD) & Functional Requirements Document (FRD)
## Revenue Management System (RMS) v01.9

**Document Version:** 1.9.0  
**Last Updated:** 2026-02-16  
**Status:** ✅ Production  
**Product Owner:** 4TK Hospitality

---

# Part 1: Product Requirements Document (PRD)

## 1. Executive Summary

### 1.1 Product Vision
RMS là nền tảng SaaS giúp các khách sạn Việt Nam **tối ưu hóa giá phòng** và **tăng doanh thu** thông qua phân tích dữ liệu booking và gợi ý giá thông minh.

### 1.2 Problem Statement

| Vấn đề | Ảnh hưởng |
|--------|----------|
| Không biết đang bán được bao nhiêu phòng | Quyết định giá theo cảm tính |
| Không so sánh được với năm trước | Không biết đang tốt hay xấu |
| Tính giá OTA phức tạp | Mất thời gian, dễ sai công thức |
| Data rải rác ở PMS | Không có dashboard tổng quan |

### 1.3 Solution Overview
RMS cung cấp:
1. **Dashboard** trực quan với KPI và biểu đồ OTB
2. **Analytics** so sánh STLY, Pace, Pickup
3. **Price Recommendations** dựa trên occupancy
4. **OTA Pricing Calculator** tính giá hiển thị chính xác
5. **OTA Growth Playbook** công cụ tối ưu ranking OTA (Premium)

### 1.4 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Daily Active Users | 50+ | Pilot |
| Hotels onboarded | 10+ | 2 |
| Price accuracy | 95%+ | 98% |
| OTB calculation time | < 30s | ~15s |

---

## 2. Target Users

### 2.1 Primary Personas

#### Persona 1: General Manager (GM)
- **Who**: Quản lý tổng điều hành khách sạn 3-4 sao
- **Pain Points**: Không có thời gian phân tích data, cần quyết định nhanh
- **Goals**: Xem tổng quan nhanh, approve giá hàng ngày
- **Tech Level**: Basic (dùng được Excel, email)
- **Usage**: 15-30 phút/ngày vào buổi sáng

#### Persona 2: Revenue Manager
- **Who**: Nhân viên RM tại khách sạn lớn hoặc chuỗi
- **Pain Points**: Thiếu công cụ analyze, phải làm thủ công trên Excel
- **Goals**: Deep-dive data, optimize pricing strategy
- **Tech Level**: Intermediate (biết pivot table, formulas)
- **Usage**: 2-4 giờ/ngày, liên tục check

#### Persona 3: Front Office Manager
- **Who**: Trưởng bộ phận lễ tân
- **Pain Points**: Cần biết giá để quote cho walk-in
- **Goals**: Check giá nhanh, hiểu OTB status
- **Tech Level**: Basic
- **Usage**: 5-10 phút/ngày, on-demand

### 2.2 User Roles & Permissions

| Role | Dashboard | Upload | Price Override | Settings | User Mgmt |
|------|-----------|--------|----------------|----------|-----------|
| Super Admin | ✅ All Hotels | ✅ | ✅ | ✅ | ✅ |
| Hotel Admin | ✅ Own Hotel | ✅ | ✅ | ✅ | ✅ Own |
| Manager | ✅ | ✅ | ✅ | ❌ | ❌ |
| Viewer | ✅ View Only | ❌ | ❌ | ❌ | ❌ |

---

## 3. Product Features

### 3.1 Feature Priority Matrix

| Feature | Priority | Status | Version |
|---------|----------|--------|--------|
| Google OAuth Login | P0 | ✅ Done | V01.0 |
| CSV/XML Upload | P0 | ✅ Done | V01.0 |
| OTB Calculation | P0 | ✅ Done | V01.0 |
| Dashboard + KPI | P0 | ✅ Done | V01.0 |
| Price Recommendations | P0 | ✅ Done | V01.0 |
| Cancellation Bridge | P1 | ✅ Done | V01.1 |
| STLY Comparison | P1 | ✅ Done | V01.1 |
| Pickup Analytics | P1 | ✅ Done | V01.1 |
| OTA Pricing Calculator | P1 | ✅ Done | V01.2 |
| Room Types CRUD | P1 | ✅ Done | V01.2 |
| Multi-Hotel Support | P1 | ✅ Done | V01.2 |
| SaaS Infrastructure | P1 | ✅ Done | V01.3 |
| Team Invites | P1 | ✅ Done | V01.3 |
| Subscription Tiers | P1 | ✅ Done | V01.3 |
| Time-Travel OTB | P1 | ✅ Done | V01.4 |
| OTA Growth Playbook | P1 | ✅ Done | V01.5 |
| 2-Layer Promotion Architecture | P1 | ✅ Done | V01.6 |
| Free Nights Deal | P1 | ✅ Done | V01.6 |
| 3-Tier Exclusion Engine | P1 | ✅ Done | V01.6 |
| 3 Calculator Modes | P1 | ✅ Done | V01.7 |
| Timing Conflict Resolution | P1 | ✅ Done | V01.7 |
| Comprehensive Guide Page | P1 | ✅ Done | V01.7 |
| GM Reporting Dimensions | P1 | ✅ Done | V01.8 |
| Forecast Timezone Fix | P0 | ✅ Done | V01.8 |
| Import Job Stale Cleanup | P1 | ✅ Done | V01.8 |
| Payment Gateway (SePay) | P0 | ✅ Done | V01.9 |
| Payment Gateway (PayPal) | P0 | ✅ Done | V01.9 |
| Pay-First Flow (Demo Users) | P1 | ✅ Done | V01.9 |
| Orphan Payment Recovery | P1 | ✅ Done | V01.9 |
| Dynamic Pricing Config | P1 | ✅ Done | V01.9 |
| PDF Export | P2 | ✅ Done | V01.5 |
| Rate Shopper | P2 | ⬜ Schema ready | Deferred |
| ML Forecasting | P3 | ⬜ Future | - |

### 3.2 Feature: Dashboard

**Epic:** As a GM, I want to see today's booking status at a glance so I can make quick pricing decisions.

```
┌────────────────────────────────────────────────────────────┐
│                    RMS DASHBOARD                            │
├──────────────┬──────────────┬──────────────┬───────────────┤
│  Rooms OTB   │  Remaining   │  Pickup T7   │  Cancelled    │
│     156      │     114      │    +23       │      5        │
│   ▲+12 vs LY │   84% occ    │   +8% vs LY  │   -2 vs LY    │
└──────────────┴──────────────┴──────────────┴───────────────┘
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              OTB CHART (14/30/60/90 days)            │  │
│  │    ████▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ANALYTICS PANEL                          │  │
│  │  [STLY] [PACE] [PICKUP]                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              RECOMMENDATIONS TABLE                    │  │
│  │  Date | OTB | Rem | Suggest Price | [Accept][Override]│  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**User Stories:**
- [US-D01] User can view 4 KPI cards (OTB, Remaining, Pickup, Cancelled)
- [US-D02] User can switch between 14/30/60/90 day OTB chart
- [US-D03] User can see STLY comparison for each stay_date
- [US-D04] User can Accept or Override recommended prices
- [US-D05] User can export Dashboard to PDF

### 3.3 Feature: OTA Pricing Calculator

**Epic:** As a Revenue Manager, I want to calculate the correct BAR (public price) from my NET price so I receive the desired revenue after OTA commissions.

```
┌────────────────────────────────────────────────────────────┐
│                 OTA PRICING CALCULATOR                      │
├────────────────────────────────────────────────────────────┤
│  [Giá Thu về] [Giá BAR] [Giá Hiển thị]    ← 3 modes       │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  Room Type: [DELUXE ▼]          OTA: [AGODA ▼] (20%)       │
│                                                              │
│  Active Promotions:                                          │
│  ☑ Super Sale (-10%)    [STACKABLE]                         │
│  ☑ Member Deal (-5%)    [STACKABLE]                         │
│  ☐ Flash Sale (-15%)    [EXCLUSIVE]                         │
│                                                              │
├────────────────────────────────────────────────────────────┤
│  Mode: Giá Thu về (NET → BAR + Display)                     │
│  ──────────────────────────────────────                     │
│  • NET (Input):    1.000.000                                │
│  • BAR:            1.434.000                                │
│  • Display Price:  1.147.000                                │
│  ═══════════════════════════                                │
│  Stack Behavior Badges: STACKABLE / EXCLUSIVE / HIGHEST_WINS│
└────────────────────────────────────────────────────────────┘
```

**User Stories:**
- [US-P01] User can enter NET price and see BAR + Display calculation
- [US-P02] User can enter BAR price and see NET + Display calculation (V01.7)
- [US-P03] User can enter Display price and see BAR + NET calculation (V01.7)
- [US-P04] User can manage Room Types with net_price
- [US-P05] User can configure OTA channel commissions (Progressive/Additive/Single_Discount)
- [US-P06] User can add/remove promotion discounts with 2-Layer Architecture (V01.6)
- [US-P07] User can view Price Matrix for all room types + channels
- [US-P08] System resolves timing conflicts (Early Bird vs Last-Minute) automatically (V01.7)
- [US-P09] User can configure Free Nights Deal (Stay X / Pay Y → auto discount %) (V01.6)

### 3.5 Feature: OTA Growth Playbook (Premium)

**Epic:** As a Revenue Manager, I want to have tools to analyze and optimize my hotel's OTA ranking so I can increase visibility and bookings.

**Sub-features:**

| Tab | Label (VI) | Description |
|-----|------------|-------------|
| Kiểm tra chỉ số OTA | Health Scorecard | Chấm điểm sức khỏe kênh OTA (Booking.com + Agoda) |
| Hiệu quả chương trình | ROI Calculator | Tính lời/lỗ khi tham gia chương trình khuyến mãi OTA |
| Điểm Review | Review Calculator | Mô phỏng tác động review + Tính review cần để đạt mục tiêu |
| Cách tăng Ranking | When to Boost | Hướng dẫn thời điểm và cách đẩy ranking hiệu quả |
| Booking.com | Checklist | Checklist tối ưu ranking trên Booking.com |
| Agoda | Checklist | Checklist tối ưu ranking trên Agoda |

**User Stories:**
- [US-G01] User (paid) can view OTA Health Scorecard for Booking.com and Agoda
- [US-G02] User can calculate ROI/breakeven for OTA promotion programs
- [US-G03] User can simulate review impact on overall rating
- [US-G04] User can calculate reviews needed to reach target score
- [US-G05] User can view scenario-based boost recommendations
- [US-G06] User can follow interactive checklists for Booking.com and Agoda
- [US-G07] Non-paid users see paywall with feature preview

### 3.4 Feature: Data Import

**Epic:** As a GM, I want to upload my PMS export file so the system has my latest booking data.

**Supported Formats:**
| PMS | Format | Fields Mapped |
|-----|--------|---------------|
| Opera | XML (Crystal Reports) | res_id, dates, rooms, revenue |
| Cloudbeds | CSV | confirmation_id, checkin, checkout |
| RoomRaccoon | CSV | booking_id, arrival, departure |
| Generic | CSV | Flexible field mapping |

**User Stories:**
- [US-I01] User can drag-drop file to upload
- [US-I02] System detects file format automatically
- [US-I03] System prevents duplicate imports (file hash)
- [US-I04] User can see import history with status
- [US-I05] User can view imported rows in Data Inspector

---

## 4. User Journeys

### 4.1 Daily Workflow (GM)

```
Morning (08:00)
     │
     ▼
┌─────────────────┐
│ 1. Export từ PMS │
│    (CSV/XML)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Upload vào   │
│    RMS          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Build OTB    │
│    (Data menu)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Check        │
│    Dashboard    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. Review Prices│
│    Accept/Override
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. Update OTA   │
│    Channels     │
└─────────────────┘
```

### 4.2 First-Time User Onboarding

```
1. Login with Google
        │
        ▼
2. Auto-assigned to Demo Hotel
        │
        ▼
3. View QuickStart Guide (/guide)
        │
        ▼
4. Admin assigns user to real hotel
        │
        ▼
5. User uploads first CSV
        │
        ▼
6. Dashboard populated
```

---

## 5. Design Guidelines

### 5.1 Design Principles
1. **Clarity First**: Data hiển thị rõ ràng, không clutter
2. **Mobile-Friendly**: Responsive cho tablet/phone
3. **Vietnamese-First**: Copy/UX phù hợp user Việt
4. **Minimal Clicks**: Core actions trong 2 clicks

### 5.2 UI Components

| Component | Usage |
|-----------|-------|
| Cards | KPI display, summary boxes |
| Tables | Data lists with sort/filter |
| Charts | Recharts for OTB visualization |
| Modals | Forms, confirmations |
| Toasts | Success/error notifications |

### 5.3 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | #1E3A8A | Headers, CTAs |
| Secondary Blue | #3B82F6 | Links, icons |
| Success Green | #10B981 | Positive KPIs |
| Warning Amber | #F59E0B | Alerts |
| Error Red | #EF4444 | Errors, cancel |
| Neutral Gray | #6B7280 | Text, borders |

---

# Part 2: Functional Requirements Document (FRD)

## 6. Functional Requirements by Module

### 6.1 Module: Authentication (AUTH)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| AUTH-01 | User can login via Google OAuth | P0 | ✅ |
| AUTH-02 | System creates user record on first login | P0 | ✅ |
| AUTH-03 | User blocked if email not in whitelist | P0 | ✅ |
| AUTH-04 | Session persists via JWT cookie | P0 | ✅ |
| AUTH-05 | User can logout | P0 | ✅ |
| AUTH-06 | Auto-assign new user to Demo Hotel | P1 | ✅ |

### 6.2 Module: Data Import (IMPORT)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| IMPORT-01 | Accept CSV file upload | P0 | ✅ |
| IMPORT-02 | Accept XML file upload (Opera) | P0 | ✅ |
| IMPORT-03 | Parse and validate file format | P0 | ✅ |
| IMPORT-04 | Store to reservations_raw table | P0 | ✅ |
| IMPORT-05 | Detect duplicate files (hash) | P1 | ✅ |
| IMPORT-06 | Track import status in import_jobs | P1 | ✅ |
| IMPORT-07 | Accept Cancellations file | P1 | ✅ |
| IMPORT-08 | Apply Cancellation Bridge | P1 | ✅ |
| IMPORT-09 | Auto-cleanup stale PROCESSING/FAILED jobs on retry (V01.8) | P1 | ✅ |
| IMPORT-10 | Parse GM reporting fields from XML (V01.8) | P1 | ✅ |

### 6.3 Module: OTB Engine (OTB)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| OTB-01 | Build OTB for all stay_dates | P0 | ✅ |
| OTB-02 | Deduplicate reservations by res_id | P0 | ✅ |
| OTB-03 | Handle partial-night stays | P0 | ✅ |
| OTB-04 | Store to daily_otb table | P0 | ✅ |
| OTB-05 | Support as_of_date parameter (Time-Travel) | P1 | ✅ |
| OTB-06 | Backfill historical snapshots | P1 | ✅ |
| OTB-07 | Calculate remaining_supply | P1 | ✅ |

### 6.4 Module: Analytics (ANALYTICS)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| ANALYTICS-01 | Calculate STLY rooms_otb | P1 | ✅ |
| ANALYTICS-02 | Calculate Pickup T-7/15/30 | P1 | ✅ |
| ANALYTICS-03 | Calculate Pace vs LY | P1 | ✅ |
| ANALYTICS-04 | Store to features_daily table | P1 | ✅ |
| ANALYTICS-05 | Display in AnalyticsPanel | P1 | ✅ |
| ANALYTICS-06 | Show trend arrows (up/down vs LY) | P2 | ✅ |

### 6.5 Module: Pricing (PRICING)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| PRICING-01 | Calculate ladder-based price levels | P0 | ✅ |
| PRICING-02 | Respect min/max rate guardrails | P0 | ✅ |
| PRICING-03 | Allow user Accept action | P0 | ✅ |
| PRICING-04 | Allow user Override with reason | P0 | ✅ |
| PRICING-05 | Store decisions to pricing_decisions | P1 | ✅ |
| PRICING-06 | Lock prices within ±20% step | P2 | ✅ |

### 6.6 Module: OTA Calculator (OTA)

| ID | Requirement | Priority | Status | Version |
|----|-------------|----------|--------|---------|
| OTA-01 | NET → BAR calculation | P0 | ✅ | V01.2 |
| OTA-02 | CRUD Room Types | P0 | ✅ | V01.2 |
| OTA-03 | CRUD OTA Channels + Commissions | P0 | ✅ | V01.2 |
| OTA-04 | CRUD Promotion Campaigns | P0 | ✅ | V01.2 |
| OTA-05 | Apply promotions (progressive/additive/single_discount) | P1 | ✅ | V01.2 |
| OTA-06 | Generate Price Matrix | P1 | ✅ | V01.2 |
| OTA-07 | Export Price Matrix to Excel | P2 | ✅ | V01.2 |
| OTA-08 | 2-Layer Promotion Architecture (Engine + UI) | P1 | ✅ | V01.6 |
| OTA-09 | Free Nights Deal (Stay X / Pay Y) | P1 | ✅ | V01.6 |
| OTA-10 | 3-Tier Exclusion Engine | P1 | ✅ | V01.6 |
| OTA-11 | BAR → NET calculator mode | P1 | ✅ | V01.7 |
| OTA-12 | Display → BAR calculator mode | P1 | ✅ | V01.7 |
| OTA-13 | Timing Conflict Resolution | P1 | ✅ | V01.7 |

### 6.7 Module: Dashboard (DASHBOARD)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| DASH-01 | Display 4 KPI cards | P0 | ✅ |
| DASH-02 | Display OTB bar chart | P0 | ✅ |
| DASH-03 | Toggle 14/30/60/90 day view | P1 | ✅ |
| DASH-04 | Display Recommendations table | P0 | ✅ |
| DASH-05 | Inline Accept/Override buttons | P0 | ✅ |
| DASH-06 | Add AnalyticsPanel (STLY/Pace/Pickup) | P1 | ✅ |
| DASH-07 | DatePicker for Time-Travel | P1 | ✅ |
| DASH-08 | Export to PDF | P2 | ✅ |

### 6.8 Module: User Management (USER)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| USER-01 | List all users (admin) | P1 | ✅ |
| USER-02 | Assign user to hotel | P1 | ✅ |
| USER-03 | Set user role per hotel | P1 | ✅ |
| USER-04 | Deactivate user | P1 | ✅ |
| USER-05 | Edit user details | P1 | ✅ |
| USER-06 | Invite new user via email | P2 | ✅ |

### 6.9 Module: Hotel Management (HOTEL)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| HOTEL-01 | List hotels (admin) | P1 | ✅ |
| HOTEL-02 | Create new hotel | P1 | ✅ |
| HOTEL-03 | Edit hotel settings | P1 | ✅ |
| HOTEL-04 | Configure ladder_steps | P1 | ✅ |
| HOTEL-05 | Switch active hotel | P1 | ✅ |
| HOTEL-06 | Demo Hotel for testing | P1 | ✅ |

### 6.10 Module: OTA Growth Playbook (PLAYBOOK)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| PLAYBOOK-01 | OTA Health Scorecard (Booking.com + Agoda) | P1 | ✅ |
| PLAYBOOK-02 | ROI Calculator for OTA promotions | P1 | ✅ |
| PLAYBOOK-03 | Review Impact Simulator | P1 | ✅ |
| PLAYBOOK-04 | Target Score Calculator | P1 | ✅ |
| PLAYBOOK-05 | When to Boost decision guide | P1 | ✅ |
| PLAYBOOK-06 | Interactive checklists (Booking + Agoda) | P1 | ✅ |
| PLAYBOOK-07 | Premium paywall gating | P1 | ✅ |

### 6.11 Module: SaaS Infrastructure (SAAS)

| ID | Requirement | Priority | Status | Version |
|----|-------------|----------|--------|---------|
| SAAS-01 | Subscription tiers (STANDARD/SUPERIOR/DELUXE/SUITE) | P1 | ✅ | V01.3 |
| SAAS-02 | Token-based team invites | P1 | ✅ | V01.3 |
| SAAS-03 | IP-based rate limiting (DB-backed) | P1 | ✅ | V01.3 |
| SAAS-04 | Product event tracking | P2 | ✅ | V01.3 |
| SAAS-05 | 4-step onboarding wizard | P1 | ✅ | V01.3 |
| SAAS-06 | Trial system (7 + 7 days) | P1 | ✅ | V01.3 |
| SAAS-07 | Feature limits per plan tier | P1 | ✅ | V01.3 |

### 6.12 Module: Guide Page (GUIDE)

| ID | Requirement | Priority | Status | Version |
|----|-------------|----------|--------|---------|
| GUIDE-01 | QuickStart 5-step guide | P1 | ✅ | V01.4 |
| GUIDE-02 | Revenue Management documentation | P1 | ✅ | V01.4 |
| GUIDE-03 | OTA Pricing docs for all 5 channels | P1 | ✅ | V01.7 |
| GUIDE-04 | OTA Growth Playbook section (premium) | P1 | ✅ | V01.5 |

---

## 7. Data Validation Rules

### 7.1 CSV Import Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| arrival_date | Required, valid date | "Ngày đến không hợp lệ" |
| departure_date | Required, > arrival | "Ngày đi phải sau ngày đến" |
| rooms | Optional, default 1 | - |
| revenue | Optional, ≥ 0 | "Doanh thu không được âm" |
| reservation_id | Optional, unique per file | - |

### 7.2 OTA Calculation Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| net_price | Required, > 0 | "NET phải lớn hơn 0" |
| commission | 0 - 100% | "Hoa hồng 0-100%" |
| discount | 0 - 99% | "Giảm giá tối đa 99%" |

---

## 8. Error Handling

### 8.1 Error Codes

| Code | HTTP | Message |
|------|------|---------|
| AUTH_REQUIRED | 401 | "Vui lòng đăng nhập" |
| AUTH_FORBIDDEN | 403 | "Không có quyền truy cập" |
| HOTEL_NOT_FOUND | 404 | "Khách sạn không tồn tại" |
| FILE_INVALID | 400 | "File không hợp lệ" |
| DUPLICATE_FILE | 409 | "File đã được import trước đó" |
| DB_ERROR | 500 | "Lỗi hệ thống" |

### 8.2 User-Friendly Messages

```typescript
const ERROR_MESSAGES = {
    'NETWORK_ERROR': 'Không kết nối được mạng. Vui lòng thử lại.',
    'TIMEOUT': 'Quá thời gian chờ. Thử lại sau.',
    'INVALID_CSV': 'File CSV không đúng định dạng. Kiểm tra lại cấu trúc file.',
    'NO_DATA': 'Chưa có dữ liệu. Vui lòng upload file từ PMS.'
};
```

---

## 9. Acceptance Criteria

### 9.1 Dashboard Feature

**Given** user is logged in and has hotel assigned  
**When** user navigates to /dashboard  
**Then:**
- [ ] 4 KPI cards display with correct values
- [ ] OTB chart shows bars for selected range
- [ ] Recommendations table lists upcoming 30 days
- [ ] Accept button stores decision as 'accepted'
- [ ] Override button opens modal for price input

### 9.2 OTA Calculator Feature

**Given** user is on /pricing page  
**When** user enters NET price and selects OTA  
**Then:**
- [ ] BAR is calculated correctly per formula
- [ ] Commission percentage shows next to OTA name
- [ ] Active promotions are applied in order
- [ ] Breakdown shows each step of calculation

### 9.3 Data Import Feature

**Given** user is on /upload page  
**When** user drags CSV file to upload zone  
**Then:**
- [ ] File is uploaded within 10 seconds
- [ ] Progress indicator shows upload status
- [ ] Success message shows row count
- [ ] Data appears in Data Inspector

---

## 10. Appendix

### 10.1 Glossary

| Term | Vietnamese | Definition |
|------|------------|------------|
| OTB | Số đặt trước | Total rooms/revenue already booked |
| ADR | Giá phòng TB | Revenue / Rooms sold |
| RevPAR | DT/phòng khả dụng | Revenue / Total rooms |
| STLY | Cùng kỳ năm trước | Same Time Last Year comparison |
| Pickup | Số đặt mới | New bookings in period |
| Pace | Tốc độ đặt | Booking velocity vs LY |
| BAR | Giá công bố | Best Available Rate on OTA |
| NET | Giá thực nhận | Price after commission |

### 10.2 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-15 | PM | Initial PRD |
| 1.1 | 2026-01-25 | PM | Added Cancellation module |
| 1.2 | 2026-02-01 | PM | Added OTA Calculator |
| 1.3 | 2026-02-05 | PM | Added User Management, SaaS Infrastructure |
| 1.4 | 2026-02-09 | PM | Added Analytics Layer, User Guide |
| 1.5 | 2026-02-10 | PM | Added OTA Growth Playbook (Premium) |
| 1.6 | 2026-02-11 | PM | 2-Layer Promotion Architecture, Free Nights, 3-Tier Exclusion |
| 1.7 | 2026-02-12 | PM | 3 Calculator Modes, Timing Conflicts, Guide Page |
| 1.8 | 2026-02-13 | PM | GM Reporting Dimensions, Forecast Timezone Fix, Import Job Stale Cleanup |
| 1.9 | 2026-02-16 | PM | Payment Gateways (SePay, PayPal), Pay-First Flow, Orphan Payment Recovery |

### 10.3 Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Engineering Lead | | | |
| QA Lead | | | |
| Stakeholder | | | |
