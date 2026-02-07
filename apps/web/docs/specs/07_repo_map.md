# Repository Map & Entry Points

**Branch**: `main` (Latest Production)
**Commit**: `HEAD`

## Directory Structure (Key Areas)

```text
apps/web
├── app
│   ├── actions           # Server Actions (Mutations)
│   │   ├── buildDailyOTB.ts        # OTB Build Logic
│   │   ├── ingestCSV.ts            # CSV Import Logic
│   │   ├── runForecast.ts          # Forecast Logic
│   │   └── runPricingEngine.ts     # Pricing Trigger
│   ├── api               # API Routes (Rest)
│   │   ├── import-jobs             # Import Status/List
│   │   ├── pricing                 # Pricing System APIs
│   │   └── rate-shopper            # Competitor Data APIs
│   └── (pages)           # UI Routes (Dashboard, Pricing, etc.)
├── lib
│   ├── auth.ts           # NextAuth Config
│   ├── pricing           # Pricing Engine Core
│   │   ├── engine.ts               # Calculation Logic
│   │   └── validators.ts           # Input Validators
│   └── rate-shopper      # Rate Shopper Core
│       ├── serpapi-client.ts       # Scraping Client
│       └── constants.ts            # Config & Quotas
├── prisma
│   ├── schema.prisma     # DB Schema
│   └── seed.ts           # Data Seeding
└── middleware.ts         # RBAC & Tenant Protection
```

## Key Files Path

### 1. Import CSV
- **Route**: `app/api/import-jobs/route.ts` (List/Status)
- **Parser**: `lib/csv.ts` (PapaParse wrapper)
- **Processor**: `app/actions/ingestCSV.ts` (Validation, Hashing, Transaction)

### 2. OTB Time-Travel
- **Builder**: `app/actions/buildDailyOTB.ts`
- **Logic**: Expand reservation -> daily rows, split revenue, filter by `as_of_ts`.

### 3. Forecast
- **Logic**: `app/actions/runForecast.ts`
- **Status**: Placeholder (heuristic `avg(t30, t15, t5)`).

### 4. Pricing Engine
- **Mathematical Core**: `lib/pricing/engine.ts` (BAR/NET formulas).
- **Validators**: `lib/pricing/validators.ts`.
- **Defaults**: `lib/pricing/seed-defaults.ts`.

### 5. Rate Shopper
- **Client**: `lib/rate-shopper/serpapi-client.ts` (SerpApi calls).
- **Config**: `lib/rate-shopper/constants.ts` (TTL, Quotas, Backoff).

### 6. Auth / RBAC
- **Config**: `lib/auth.ts` (Providers, Callbacks).
- **Enforcement**: `middleware.ts` (Route protection, Hotel context).
