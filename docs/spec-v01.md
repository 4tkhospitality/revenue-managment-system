# RMS – VERSION 01.7 (Production)

**Last Updated:** 2026-02-12
**Status:** Production — Deployed to Vercel (icn1 region)

## SCOPE – WHAT'S IN V01

### ✅ Implemented (V01.0 → V01.7)
- PMS-agnostic CSV/Excel/XML Import
- Crystal Reports XML Import (reservation + cancellation)
- Cancellation Bridge with auto-matching (V01.1)
- Daily OTB Time-Travel (as_of_date, book_time/cancel_time) (V01.1)
- RMS Feature Engine (pickup T-30/15/7/5/3, pace, supply, STLY)
- Forecast Remaining Demand (heuristic)
- Rule-based Pricing Optimization (Ladder Strategy)
- Recommendation Dashboard
- Accept / Override + Decision Log (Audit)
- Excel Export
- Google OAuth Authentication (NextAuth.js v5)
- Role-Based Access Control (super_admin/hotel_admin/manager/viewer)
- Multi-Hotel User Support with HotelSwitcher
- Admin Panel (Users + Hotels management)
- OTA Pricing Module — BAR/NET calculation with commissions + promotions (V01.2)
- Room Types Management (CRUD) (V01.2)
- OTA Channels Configuration (5 OTAs: Agoda, Booking.com, Traveloka, Trip.com, Expedia) (V01.2)
- 61 Promotion Catalog items across 5 OTAs (V01.2)
- 2-Layer Promotion Architecture — Engine layer + UI layer (V01.6)
- Free Nights Deal (Stay X / Pay Y) (V01.6)
- 3-Tier Exclusion Engine (EXCLUSIVE/Business Bookers/HIGHEST_WINS) (V01.6)
- 3 Calculator Tabs: Giá Thu về / Giá BAR / Giá Hiển thị (V01.7)
- Timing Conflict Resolution (Early Bird vs Last-Minute) (V01.7)
- 4-Step Onboarding Wizard (V01.3)
- Trial System (7 days + 7 bonus) (V01.3)
- Team Invite System (token-based) (V01.3)
- Subscription Tiers (STANDARD/SUPERIOR/DELUXE/SUITE) (V01.3)
- OTA Growth Playbook (6 tools: Scorecard, Checklists, ROI, Review, Boost) (V01.5)
- Comprehensive Guide Page with 5-OTA documentation (V01.7)
- OTB Time-Travel Date Picker (V01.4)
- Backfill OTB Snapshots (batch, chunked) (V01.4)
- Landing Page V3 (pakhos.com) — Professional SVG design, vi+en
- SaaS Pro Light Theme (consistent across all pages)
- Loading Skeletons for all pages
- Mobile Responsive Layout with Hamburger Menu

### ❌ NOT in V01 (Deferred)
- No PMS integration (no booking lifecycle, no room assignment)
- No Channel Manager
- No OTA XML / webhook realtime sync
- No Reinforcement Learning
- No LOS optimization
- Rate Shopper — schema ready, implementation deferred (needs SerpApi POC)

## MỤC TIÊU SẢN PHẨM (V01)
Trong 14 ngày pilot, GM/RM có thể:
- Upload file PMS (CSV/Excel/XML)
- Xem pickup & demand rõ ràng hơn PMS
- Nhận giá gợi ý dễ hiểu
- Quyết định nhanh: Accept / Override
- Tính giá OTA (NET → BAR → Display) cho 5 kênh
- Sử dụng OTA Growth Playbook tools

## 2. INPUT – PMS AGNOSTIC
### 2.1 Supported Formats
- **CSV** — Standard reservation format
- **Excel (.xlsx)** — Auto-detected, parsed with exceljs
- **XML (Crystal Reports)** — PMS export format, aggregated by ConfirmNum
- **Cancellation XML** — Separate upload, bridged to reservations

### 2.2 Schema (BẮT BUỘC)
- reservation_id (string)
- booking_date (date)
- arrival_date (date)
- departure_date (date)
- rooms (int)
- revenue (number)
- status (enum: booked / cancelled)
- cancel_date (date, nullable)

### 2.3 Extended Fields (V01.1+)
- book_time (timestamptz)
- cancel_time (timestamptz)
- cancel_reason, cancel_source
- reservation_id_norm, room_code, room_code_norm
- company_name (OTA/Agent name from XML)
- last_modified_time (timestamptz)

## 3. DATA MODEL (V01.7)

### Core Tables
- `hotels` — Tenant root (capacity, timezone, ladder_steps, is_demo)
- `users` — With role, is_active, phone
- `hotel_users` — Many-to-many junction with per-hotel roles
- `import_jobs` — File upload tracking (CSV/XML/Cancellation)
- `reservations_raw` — Append-only raw booking data
- `cancellations_raw` — Cancellation records with bridge matching (V01.1)
- `daily_otb` — Time-travel OTB snapshots
- `features_daily` — Computed ML features (pickup, pace, STLY)
- `demand_forecast` — Forecast outputs
- `price_recommendations` — Pricing engine suggestions
- `pricing_decisions` — Audit log (accept/override)

### OTA Pricing Tables (V01.2)
- `room_types` — Room type with NET base price
- `ota_channels` — OTA config (commission, calc_type)
- `promotion_catalog` — 61 promotions across 5 OTAs
- `campaign_instances` — Links promotions to channels per hotel
- `pricing_settings` — Per-hotel config (currency, rounding, max_discount)

### SaaS Infrastructure (V01.3)
- `hotel_invites` — Token-based team invites
- `product_events` — Analytics tracking
- `rate_limit_hits` — IP-based rate limiting (DB-backed, Vercel-safe)
- `subscriptions` — Plan tiers with feature limits

### Rate Shopper (Schema Ready, Implementation Deferred)
- `competitors`, `competitor_rates`
- `rate_shop_cache`, `rate_shop_requests`
- `market_snapshots`, `rate_shop_recommendations`
- `rate_shop_usage_daily`, `rate_shop_usage_tenant_monthly`

Grain: (hotel_id, as_of_date, stay_date)

## 4. PIPELINE TỔNG THỂ
```
CSV/Excel/XML → reservations_raw → daily_otb → features_daily → demand_forecast → price_recommendations → Dashboard
                                                                                                        ↓
Cancellation XML → cancellations_raw → Bridge → reservations_raw (cancel_time updated)       OTA Pricing Module
```

### as_of_date Semantics
| Step | as_of_date Source |
|------|------------------|
| Build OTB | `loaded_at` (upload date) |
| Build Features | `new Date()` (today) |
| Run Forecast | `max(as_of_date)` from `features_daily` |

## 5. MODULE DESIGN
- **Ingestion Engine**: Multi-format with auto-detect, hotel validation before import
- **Core RMS Engine**: Time-travel OTB, advisory lock, chunked backfill
- **Feature Engine**: Pickup rates, STLY, pace, supply
- **Pricing Engine**: Ladder Strategy, configurable presets
- **OTA Pricing**: BAR calculation with 3 calc modes (Progressive/Additive/Single_Discount)
- **Dashboard**: KPI cards, OTB chart, recommendation table, cancellation stats
- **Admin Panel**: User/Hotel CRUD, role management
- **Guide Page**: 4-section left nav, OTA pricing docs for 5 channels

## 7. TECH STACK
- **Full-stack**: Next.js 16.1.6 (App Router + Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Custom + Lucide Icons
- **Charts**: Recharts
- **Database**: PostgreSQL 16 (Supabase, region: ap-northeast-2)
- **ORM**: Prisma 5.10.2
- **Auth**: NextAuth.js v5 (Google OAuth)
- **CSV Parser**: Papaparse
- **Excel Parser**: exceljs
- **XML Parser**: fast-xml-parser
- **Hosting**: Vercel (region: icn1 / Seoul)
- **VCS**: GitHub (auto-deploy)
