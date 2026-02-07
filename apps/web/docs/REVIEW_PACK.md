# Review Pack – 4TK Revenue Management System – 07-Feb-2026

## 1. Overview
- **Product goal:** A Revenue Management System (RMS) for hotels to visualize booking data (OTB), forecast demand, and optimize pricing across channels.
- **Modules included:** 
    - **Dashboard**: High-level KPIs (Revenue, ADR, Occ).
    - **OTB (On-The-Books)**: Daily booking tracking with time-travel.
    - **Pricing Engine**: BAR/NET calculation, commission logic, campaign stacking.
    - **Rate Shopper**: Competitor rate tracking (SerpApi).
- **Scope done:**
    - Import CSV (Reservations).
    - OTB Calculation (Time-travel supported).
    - Basic Pricing Engine (Commission/Discount logic).
    - User/Hotel Management (RBAC).
- **Scope NOT done / Future:**
    - Advanced Forecasting Models (currently placeholder/basic).
    - 2-way PMS integration (currently distinct import).
    - Automated Rate Push to OTAs (Channel Manager integration).

## 2. Tech Stack
- **Frontend:** Next.js 16.1 (App Router), React 19, TailwindCSS, Lucide Icons.
- **Backend:** Next.js Server Actions, Prisma ORM.
- **DB:** PostgreSQL (Supabase).
- **Auth:** NextAuth.js v5 (Beta) - Google OAuth & Credentials.
- **Hosting/CI:** Vercel (Frontend/Edge), Supabase (DB).

## 3. How to Run
- **Prerequisites:** Node.js v20+, npm/pnpm.
- **Install:** `npm install`
- **Env vars (.env.example):**
    ```env
    DATABASE_URL="postgresql://..."
    DIRECT_URL="postgresql://..."
    NEXTAUTH_URL="http://localhost:3000"
    AUTH_SECRET="..."
    GOOGLE_CLIENT_ID="..."
    GOOGLE_CLIENT_SECRET="..."
    DEFAULT_HOTEL_ID="..."
    SERPAPI_API_KEY="..."
    ```
- **Seed/sample data:** `npm run prisma:seed` (Create Hotel/Users), `public/sample-reservations.csv` (Reservation Data).
- **Run commands:** `npm run dev`

## 4. Data Inputs
### 4.1 File A: Reservations CSV (`public/sample-reservations.csv`)
- **Purpose:** Historical booking data ingestion.
- **Columns:**
    - `reservation_id`: Unique Booking ID (String).
    - `booking_date`: Date booking was made (YYYY-MM-DD).
    - `arrival_date`: Check-in (YYYY-MM-DD).
    - `departure_date`: Check-out (YYYY-MM-DD).
    - `rooms`: Number of rooms.
    - `revenue`: Total revenue.
    - `status`: `booked` | `cancelled`.
    - `cancel_date`: Date of cancellation (if status = cancelled).
- **Keys:** `reservation_id` (Primary).
- **Example rows:**
    ```csv
    reservation_id,booking_date,arrival_date,departure_date,rooms,revenue,status,cancel_date
    RES-001,2025-01-15,2025-02-10,2025-02-12,1,200,booked,
    RES-011,2025-01-25,2025-02-19,2025-02-22,1,280,cancelled,2025-01-28
    ```

## 5. Data Model (DB)
- **Prisma schema notes:** UUIDs used for IDs. Relations defined for multi-tenancy (Hotel > Data).
- **Key tables:**
    - `User` / `Hotel`: Core Identity & Tenant.
    - `ReservationsRaw`: Source of Truth for bookings.
    - `DailyOTB`: Derived/Aggregated daily stats (Stay Date + As-Of Date).
    - `PricingDecision`: Log of manual/auto price changes.
    - `PriceRecommendations`: Output from Pricing Engine.
    - `CompetitorRate` / `RateShopCache`: Rate shopping data.
- **Unique keys & constraints:**
    - `ReservationsRaw`: `[hotel_id, reservation_id, job_id]`
    - `DailyOTB`: `[hotel_id, as_of_date, stay_date]` (PK)

## 6. Core Business Logic
### 6.1 OTB time-travel (`buildDailyOTB.ts`)
- **Definition:** snapshots are generated on-the-fly based on `as_of_date`.
- **Logic:**
    - Include if `book_time <= as_of_date`.
    - Exclude if `cancel_time` exists AND `cancel_time <= as_of_date`.
- **Revenue Split:** Revenue is split evenly across nights, with remainder added to the last night.

### 6.2 Pickup/Pace
- Implementation relies on comparing two `DailyOTB` snapshots (e.g., Today vs Yesterday, or Today vs Same-Time-Last-Year).

### 6.3 Forecast
- **Model:** `DemandForecast` table.
- **Logic:** Currently simplistic/placeholder in `runPricingEngine.ts` (retrieves from DB, assumes capacity limit).

### 6.4 Pricing rules / guardrails (`lib/pricing/engine.ts`)
- **Optimization:** `Optimize(CurrentPrice, RemainingDemand, RemainingSupply)`
- **BAR/NET Logic:** 
    - `PROGRESSIVE`: BAR = NET / (1-Comm) / (1-Disc1) / ...
    - `ADDITIVE`: BAR = NET / (1-Comm) / (1 - Sum(Discs))
- **Rounding:** Default `CEIL_1000`.

### 6.5 Decision log
- **Table:** `PricingDecision`.
- **Flow:** User reviews `PriceRecommendations` -> Accepts/Overrides -> Saved to `PricingDecision`.

## 7. API
- **Endpoint list:**
    - `/api/import-jobs`: Handle CSV Uploads.
    - `/api/pricing/*`: Pricing Engine & configurations.
    - `/api/rate-shopper/*`: Competitor data & scraping trigger.
    - `/api/admin/*`: User/Hotel management.
- **Auth:** NextAuth (Session based). Routes protected via `middleware.ts`.
- **Sample requests/responses:**
    - `POST /api/pricing/calculate`: `{ net: 1000000, commission: 15, discounts: [] }` -> `{ bar: 1177000 }`

## 8. UI / User Flows
- **Routes:**
    - `/dashboard`: Main Overview.
    - `/pricing`: Pricing Grid & Decisions.
    - `/data`: OTB Data Table.
    - `/rate-shopper`: Competitor Analysis.
- **Main flows:**
    1. Import Data (CSV).
    2. View Dashboard (KPIs).
    3. Check Pricing Recommendations.
    4. Approve/Reject Prices.

## 9. Deployment & Ops
- **Environments:** Local (Dev), Vercel (Staging/Prod).
- **Cron/jobs:** 
    - `Rate Shopper`: Scheduled scraping (via Cron or API trigger).
- **Logging/monitoring:** `console.log` (Basic), Database Logs.

## 10. Tests & Known Issues
- **Tests:** Basic Unit Tests structure (Need expansion).
- **Known issues:** 
    - `next-auth` Beta version.
    - Missing explicit Rate Limiting on APIs.
    - Performance: `PricingDecision` table heavy (Indexes added 07-Feb-2026).
- **Next priorities:** 
    - Full Forecast Model implementation.
    - Advanced Rate Shopper scheduling.

## 11. Detailed Specifications
- [Architecture Diagram](specs/01_architecture.md)
- [Database Schema](specs/02_database_schema.md)
- [ImportJob Spec](specs/03_import_spec.md)
- [OTB Business Glossary](specs/04_otb_spec.md)
- [Pricing Engine Spec](specs/05_pricing_spec.md)
- [Security & Tenancy](specs/06_security_spec.md)
- [Repo Map & Entry Points](specs/07_repo_map.md)
- [Data Contract (CSV)](specs/08_data_contract.md)
- [KPI Definitions](specs/09_kpi_definitions.md)
- [Pricing Configuration](specs/10_pricing_config.md)
- [Rate Shopper Details](specs/11_rate_shopper_details.md)
- [RBAC Matrix](specs/12_rbac_matrix.md)
- [Ops Runbook](specs/13_ops_runbook.md)
- **[📦 INTAKE PACK (Full Technical Review)](../INTAKE_PACK.md)** ← Start here for deep review
