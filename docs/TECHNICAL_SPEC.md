# Technical Specification
## Revenue Management System (RMS) v01.7

**Document Version:** 1.7.0  
**Last Updated:** 2026-02-12  
**Status:** ✅ Production  
**Author:** 4TK Hospitality Engineering

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Desktop   │  │   Mobile    │  │   Tablet    │  │     PWA     │    │
│  │  (Chrome)   │  │  (Safari)   │  │  (Chrome)   │  │  (Future)   │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
└─────────┼────────────────┼────────────────┼────────────────┼────────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           VERCEL EDGE NETWORK                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Next.js 16 App Router                        │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │   │
│  │  │ Server Comps  │  │ API Routes    │  │ Server Actions│        │   │
│  │  │ (SSR/SSG)     │  │ (/api/*)      │  │ (RPC)         │        │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘        │   │
│  │                                                                   │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │   │
│  │  │ NextAuth.js   │  │ Prisma ORM    │  │ React         │        │   │
│  │  │ (Auth)        │  │ (DB Access)   │  │ (Client)      │        │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Supabase (PostgreSQL 16)                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │   │
│  │  │ Hotels  │  │ Users   │  │ OTB     │  │ Pricing │            │   │
│  │  │ Tables  │  │ Auth    │  │ Data    │  │ Config  │            │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Next.js | 16.1.6 | React framework with App Router |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **Icons** | Lucide React | 0.3x | Icon library |
| **Charts** | Recharts | 2.x | Data visualization |
| **Backend** | Next.js API Routes | - | REST APIs |
| **RPC** | Server Actions | - | Type-safe mutations |
| **Auth** | NextAuth.js | 5.x | Google OAuth |
| **ORM** | Prisma | 5.10.2 | Database access |
| **Database** | PostgreSQL | 16 | Primary data store |
| **Hosting** | Vercel | - | Serverless deployment |
| **DB Host** | Supabase | - | Managed PostgreSQL |

### 1.3 Monorepo Structure

```
revenue-management-system/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/                # App Router pages
│       │   ├── (auth)/         # Auth routes
│       │   ├── admin/          # Admin pages
│       │   ├── api/            # API routes
│       │   ├── dashboard/      # Dashboard page
│       │   ├── data/           # Data inspector
│       │   ├── guide/          # User guide
│       │   ├── pricing/        # OTA pricing
│       │   ├── settings/       # Hotel settings
│       │   └── upload/         # Data upload
│       ├── components/         # React components
│       │   ├── dashboard/      # Dashboard widgets
│       │   ├── guide/          # OTA Growth Playbook components
│       │   │   ├── OTAPlaybookGuide.tsx    # Tab controller
│       │   │   ├── OTAHealthScorecard.tsx  # Health scoring
│       │   │   ├── ROICalculator.tsx       # ROI engine
│       │   │   ├── ReviewCalculator.tsx    # Review simulator
│       │   │   └── WhenToBoost.tsx         # Boost guide
│       │   ├── pricing/        # Pricing components
│       │   └── shared/         # Shared UI
│       ├── lib/                # Business logic
│       │   ├── pricing/        # Pricing engine
│       │   ├── analytics/      # Analytics functions
│       │   ├── ota-score-calculator.ts  # OTA scoring engine
│       │   └── date.ts         # Date utilities
│       ├── prisma/             # Database schema
│       └── public/             # Static assets
├── docs/                       # Documentation
├── plans/                      # Feature plans
└── .brain/                     # Project brain
```

---

## 2. Database Design

### 2.1 Entity Relationship Diagram

```
┌────────────────┐
│     Hotel      │──────────────────────────────────────────┐
│────────────────│                                               │
│ hotel_id (PK)  │◀─────────┐                                   │
│ name           │          │                                    │
│ capacity       │          │                                    │
│ timezone       │          │                                    │
│ ladder_steps   │          │                                    │
│ min_rate       │          │                                    │
│ max_rate       │          │                                    │
│ is_demo        │          │                                    │
└────────────────┘          │                                    │
         │                  │                                    │
         │ 1:N              │ N:M                                │
         ▼                  │                                    │
┌────────────────┐    ┌─────┴───────┐    ┌────────────────┐     │
│   ImportJob    │    │  HotelUser  │    │     User       │     │
│────────────────│    │─────────────│    │────────────────│     │
│ job_id (PK)    │    │ hotel_id    │───▶│ user_id (PK)   │     │
│ hotel_id (FK)  │    │ user_id     │    │ email          │     │
│ file_hash      │    │ role        │    │ name           │     │
│ status         │    └─────────────┘    │ role (global)  │     │
│ snapshot_ts    │                       │ is_active      │     │
└───────┴────────┘                       └────────────────┘     │
        │                                                        │
        │ 1:N                                                    │
        ▼                                                        │
┌────────────────┐                                               │
│ ReservationsRaw│                                               │
│────────────────│                                               │
│ reservation_id │                                               │
│ hotel_id (FK)  │◀───────────────────────────────────────────┘
│ job_id (FK)    │
│ arrival_date   │
│ departure_date │
│ rooms          │
│ revenue        │
│ book_time      │
│ cancel_time    │
└────────────────┘

┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│    DailyOTB    │    │ FeaturesDaily  │    │ DemandForecast │
│────────────────│    │────────────────│    │────────────────│
│ hotel_id       │    │ hotel_id       │    │ hotel_id       │
│ as_of_date     │    │ as_of_date     │    │ as_of_date     │
│ stay_date      │    │ stay_date      │    │ stay_date      │
│ rooms_otb      │    │ stly_rooms_otb │    │ remaining_dem  │
│ revenue_otb    │    │ pickup_t7/15/30│    └────────────────┘
└────────────────┘    │ pace_vs_ly     │
                      └────────────────┘

┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│   RoomType     │    │  OtaChannel    │    │ PricingSetting │
│────────────────│    │────────────────│    │────────────────│
│ V01.2          │    │ V01.2          │    │ V01.2          │
└────────────────┘    └────────────────┘    └────────────────┘

┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│  HotelInvite   │    │  Subscription  │    │  RateLimitHit  │
│────────────────│    │────────────────│    │────────────────│
│ V01.3          │    │ V01.3          │    │ V01.3          │
└────────────────┘    └────────────────┘    └────────────────┘

┌────────────────┐    ┌────────────────┐
│ PromoCatalog   │    │ CampaignInst   │
│────────────────│    │────────────────│
│ 61 promotions  │    │ V01.2          │
│ V01.2          │    └────────────────┘
└────────────────┘

(Rate Shopper tables: Competitor, CompetitorRate,
 RateShopCache, RateShopRequest, MarketSnapshot,
 RateShopRecommendation — schema ready, impl deferred)
```

### 2.2 Key Tables

#### 2.2.1 hotels
```sql
CREATE TABLE hotels (
    hotel_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    capacity        INT NOT NULL DEFAULT 100,
    timezone        VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    ladder_steps    JSONB DEFAULT '[0.5, 0.7, 0.85, 0.95, 1.0]',
    price_levels    JSONB,
    min_rate        DECIMAL,
    max_rate        DECIMAL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.2.2 reservations_raw
```sql
CREATE TABLE reservations_raw (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id        UUID NOT NULL REFERENCES hotels(hotel_id),
    job_id          UUID NOT NULL REFERENCES import_jobs(job_id),
    reservation_id  VARCHAR(255),
    arrival_date    DATE NOT NULL,
    departure_date  DATE NOT NULL,
    rooms           INT DEFAULT 1,
    revenue         DECIMAL,
    book_time       TIMESTAMPTZ,
    cancel_time     TIMESTAMPTZ,
    status          VARCHAR(50) DEFAULT 'confirmed',
    -- Normalized fields for matching
    reservation_id_norm VARCHAR(255),
    room_code_norm  VARCHAR(50)
);

-- Performance indexes
CREATE INDEX idx_res_raw_otb ON reservations_raw 
    (hotel_id, book_time, cancel_time, arrival_date, departure_date);
```

#### 2.2.3 daily_otb
```sql
CREATE TABLE daily_otb (
    hotel_id    UUID NOT NULL REFERENCES hotels(hotel_id),
    as_of_date  DATE NOT NULL,
    stay_date   DATE NOT NULL,
    rooms_otb   INT NOT NULL DEFAULT 0,
    revenue_otb DECIMAL DEFAULT 0,
    adr         DECIMAL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (hotel_id, as_of_date, stay_date)
);

CREATE INDEX idx_daily_otb_stay ON daily_otb (hotel_id, stay_date, as_of_date);
```

#### 2.2.4 features_daily
```sql
CREATE TABLE features_daily (
    hotel_id        UUID NOT NULL REFERENCES hotels(hotel_id),
    as_of_date      DATE NOT NULL,
    stay_date       DATE NOT NULL,
    dow             INT,
    is_weekend      BOOLEAN,
    month           INT,
    revenue_otb     DECIMAL,
    stly_revenue_otb DECIMAL,
    stly_is_approx  BOOLEAN,
    pickup_t30      INT,
    pickup_t15      INT,
    pickup_t7       INT,
    pickup_t5       INT,
    pickup_t3       INT,
    pickup_source   JSONB,
    pace_vs_ly      FLOAT,
    remaining_supply INT,
    PRIMARY KEY (hotel_id, as_of_date, stay_date)
);
```

### 2.3 Database Patterns

#### 2.3.1 Tenant Isolation
```typescript
// All queries MUST include hotel_id filter
const otbData = await prisma.dailyOTB.findMany({
    where: {
        hotel_id: activeHotelId,  // REQUIRED
        as_of_date: asOfDate
    }
});
```

#### 2.3.2 Time-Travel OTB Deduplication
```sql
-- DISTINCT ON with snapshot_ts ordering ensures latest version wins
SELECT DISTINCT ON (r.reservation_id)
    r.reservation_id,
    r.arrival_date,
    r.rooms,
    r.revenue
FROM reservations_raw r
JOIN import_jobs j ON j.job_id = r.job_id
WHERE r.hotel_id = $1::uuid
  AND r.book_time < $2::timestamptz
  AND (r.cancel_time IS NULL OR r.cancel_time >= $2::timestamptz)
ORDER BY r.reservation_id, COALESCE(j.snapshot_ts, j.created_at) DESC;
```

---

## 3. API Design

### 3.1 API Route Structure

```
/api
├── admin/
│   ├── users/              # GET, POST, PUT user management
│   └── hotels/             # GET, POST, PUT hotel management
├── analytics/
│   └── features/           # GET features_daily data
├── otb/
│   └── snapshots/
│       ├── route.ts        # GET list snapshots
│       ├── build/          # POST build single snapshot
│       └── backfill/       # POST batch backfill
├── pricing/
│   ├── room-types/         # CRUD room types
│   ├── ota-channels/       # CRUD OTA channels
│   ├── campaigns/          # CRUD promotion campaigns
│   ├── calc-matrix/        # POST calculate price matrix
│   └── catalog/            # GET promotion catalog
└── user/
    └── switch-hotel/       # POST set active hotel
```

### 3.2 API Response Format

```typescript
// Success Response
{
    success: true,
    data: { ... },
    meta?: {
        total: number,
        page: number,
        limit: number
    }
}

// Error Response
{
    success: false,
    error: {
        code: string,
        message: string,
        details?: object
    }
}
```

### 3.3 Authentication Flow

```typescript
// NextAuth.js v5 Configuration
export const { auth, signIn, signOut } = NextAuth({
    providers: [Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })],
    callbacks: {
        async signIn({ user }) {
            // Create user in DB if not exists
            await prisma.user.upsert({
                where: { email: user.email },
                create: { email: user.email, name: user.name },
                update: { name: user.name }
            });
            return true;
        },
        async jwt({ token, user, account }) {
            if (account) {
                // First login - populate token with user data
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email },
                    include: { hotel_users: true }
                });
                token.role = dbUser.role;
                token.hotels = dbUser.hotel_users.map(hu => ({
                    id: hu.hotel_id,
                    role: hu.role
                }));
            }
            return token;
        }
    }
});
```

---

## 4. Core Algorithms

### 4.1 OTB Calculation

```typescript
/**
 * Build OTB for a specific as_of_date
 * Uses half-open interval: book_time < cutoff, cancel_time >= cutoff
 */
async function buildDailyOTB(hotelId: string, asOfDate: Date) {
    const cutoffEndExcl = new Date(asOfDate);
    cutoffEndExcl.setDate(cutoffEndExcl.getDate() + 1); // D+1 00:00:00
    
    // Query with deduplication
    const reservations = await prisma.$queryRaw`
        SELECT DISTINCT ON (r.reservation_id)
            r.arrival_date,
            r.departure_date,
            r.rooms,
            r.revenue
        FROM reservations_raw r
        JOIN import_jobs j ON j.job_id = r.job_id
        WHERE r.hotel_id = ${hotelId}::uuid
          AND COALESCE(r.book_time, r.booking_date::timestamp) < ${cutoffEndExcl}
          AND (r.cancel_time IS NULL OR r.cancel_time >= ${cutoffEndExcl})
        ORDER BY r.reservation_id, COALESCE(j.snapshot_ts, j.created_at) DESC
    `;
    
    // Aggregate by stay_date
    const otbMap = new Map<string, { rooms: number, revenue: number }>();
    for (const res of reservations) {
        for (let d = res.arrival_date; d < res.departure_date; d = addDays(d, 1)) {
            const key = d.toISOString().split('T')[0];
            const existing = otbMap.get(key) || { rooms: 0, revenue: 0 };
            existing.rooms += res.rooms;
            existing.revenue += res.revenue / nights; // Split revenue
            otbMap.set(key, existing);
        }
    }
    
    // Upsert to daily_otb
    await prisma.$transaction(
        Array.from(otbMap).map(([date, data]) =>
            prisma.dailyOTB.upsert({
                where: { hotel_id_as_of_date_stay_date: { 
                    hotel_id: hotelId, 
                    as_of_date: asOfDate, 
                    stay_date: new Date(date) 
                }},
                create: { ...data, hotel_id: hotelId, as_of_date: asOfDate, stay_date: new Date(date) },
                update: data
            })
        )
    );
}
```

### 4.2 STLY Calculation

```typescript
/**
 * Find Same Time Last Year OTB
 * Matches by: same DOW, same week-of-year, year-1
 */
function findSTLYDate(stayDate: Date): Date {
    const dow = stayDate.getDay(); // 0-6
    const yearAgo = new Date(stayDate);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    
    // Find nearest date with same DOW
    const dayDiff = dow - yearAgo.getDay();
    yearAgo.setDate(yearAgo.getDate() + dayDiff);
    
    return yearAgo;
}
```

### 4.3 Price Engine (Ladder Strategy)

```typescript
interface PricingResult {
    level: number;
    price: number;
    reason: string;
    confidence: number;
}

function calculatePrice(
    adr: number,
    remainingSupply: number,
    capacity: number,
    ladderSteps: number[],
    priceLevels: number[]
): PricingResult {
    const occupancy = 1 - (remainingSupply / capacity);
    
    // Find level based on occupancy thresholds
    let level = 1;
    for (let i = 0; i < ladderSteps.length; i++) {
        if (occupancy >= ladderSteps[i]) {
            level = i + 2;
        }
    }
    
    // Calculate price adjustment
    const priceMultiplier = priceLevels[level - 1] || 1;
    const recommendedPrice = Math.round(adr * priceMultiplier);
    
    return {
        level,
        price: recommendedPrice,
        reason: `Occupancy ${(occupancy * 100).toFixed(0)}% → Level ${level}`,
        confidence: 0.7 + (level * 0.05)
    };
}
```

### 4.4 OTA Price Calculation

```typescript
/**
 * Calculate prices with commission and promotions
 * Supports 3 calc types and 3 calculator modes (V01.7)
 */

// MODE 1: net_to_bar (Giá Thu về)
function calcNetToBar(netPrice: number, commRate: number, discounts: number[], calcType: string) {
    let bar = netPrice / (1 - commRate);
    if (calcType === 'PROGRESSIVE') {
        for (const d of discounts) bar = bar / (1 - d);
    } else if (calcType === 'ADDITIVE') {
        const total = discounts.reduce((s, d) => s + d, 0);
        bar = bar / (1 - Math.min(total, 0.99));
    }
    // SINGLE_DISCOUNT: each promo = separate rate plan
    const displayPrice = calcType === 'PROGRESSIVE'
        ? bar * discounts.reduce((acc, d) => acc * (1 - d), 1)
        : bar * (1 - discounts.reduce((s, d) => s + d, 0));
    return { bar: Math.ceil(bar / 1000) * 1000, displayPrice, net: netPrice };
}

// MODE 2: bar_to_net (Giá BAR) — V01.7
function calcBarToNet(barPrice: number, commRate: number, discounts: number[], calcType: string) {
    const displayPrice = calcType === 'PROGRESSIVE'
        ? barPrice * discounts.reduce((acc, d) => acc * (1 - d), 1)
        : barPrice * (1 - discounts.reduce((s, d) => s + d, 0));
    // NET = Display × (1 - commission) — direct calculation, no double-discount
    const net = displayPrice * (1 - commRate);
    return { bar: barPrice, displayPrice, net: Math.round(net) };
}

// MODE 3: display_to_bar (Giá Hiển thị) — V01.7
function calcDisplayToBar(displayPrice: number, commRate: number, discounts: number[], calcType: string) {
    const bar = calcType === 'PROGRESSIVE'
        ? displayPrice / discounts.reduce((acc, d) => acc * (1 - d), 1)
        : displayPrice / (1 - discounts.reduce((s, d) => s + d, 0));
    const net = displayPrice * (1 - commRate);
    return { bar: Math.ceil(bar / 1000) * 1000, displayPrice, net: Math.round(net) };
}

// Timing Conflict Resolution (V01.7)
function resolveTimingConflicts(campaigns: Campaign[]): Campaign[] {
    const earlyBird = campaigns.find(c => c.promo_id.includes('early_bird'));
    const lastMinute = campaigns.find(c => c.promo_id.includes('last_minute'));
    if (earlyBird?.is_active && lastMinute?.is_active) {
        // Keep only the one with higher discount
        if (earlyBird.discount_pct >= lastMinute.discount_pct) {
            lastMinute.is_active = false;
        } else {
            earlyBird.is_active = false;
        }
    }
    return campaigns;
}
```

### 4.5 OTA Score Calculation

```typescript
/**
 * Calculate weighted OTA health score
 * Used by OTAHealthScorecard component
 * Metrics defined in ota-score-calculator.ts
 */
interface ScoreMetric {
    metric: string;
    weight: number;
    score: number; // 0-100
}

function calculateOTAScore(metrics: ScoreMetric[]): number {
    return metrics.reduce(
        (total, m) => total + (m.score * m.weight), 0
    );
}

// Booking.com: 7 metrics (review 25%, content 15%, response 10%, 
//              commission 15%, mobile 10%, genius 15%, visibility 10%)
// Agoda: 7 metrics (review 25%, photo 15%, vhp 15%, 
//        commission 15%, ycs 10%, offers 10%, payment 10%)
```

### 4.6 Review Impact Calculation

```typescript
/**
 * Review Calculator - two modes:
 * 1. Impact Simulator: How does a new review affect overall score?
 * 2. Target Calculator: How many 5-star reviews needed to reach target?
 */
function calculateReviewImpact(
    currentScore: number,
    totalReviews: number,
    newRating: number,
    newCount: number = 1
): number {
    return (currentScore * totalReviews + newRating * newCount) 
        / (totalReviews + newCount);
}

function reviewsNeededForTarget(
    currentScore: number,
    totalReviews: number,
    targetScore: number
): number {
    if (targetScore <= currentScore) return 0;
    return Math.ceil(
        (targetScore * totalReviews - currentScore * totalReviews) 
        / (5 - targetScore)
    );
}
```

---

## 5. Security

### 5.1 Authentication & Authorization

| Layer | Implementation |
|-------|----------------|
| Identity | Google OAuth via NextAuth.js |
| Session | JWT stored in httpOnly cookie |
| RBAC | Role-based permissions (super_admin > hotel_admin > manager > viewer) |
| Tenant Isolation | hotel_id filter on all DB queries |

### 5.2 Data Protection

| Concern | Mitigation |
|---------|------------|
| SQL Injection | Prisma parameterized queries |
| XSS | React auto-escaping, CSP headers |
| CSRF | SameSite cookies, CSRF tokens |
| Secrets | Environment variables only |

### 5.3 Rate Limiting

```typescript
// IP-based rate limiting (DB-backed for Vercel)
const RATE_LIMIT = {
    invite_redeem: { max: 5, window: '15 minutes' },
    api_calls: { max: 100, window: '1 minute' }
};
```

---

## 6. Performance

### 6.1 Optimization Strategies

| Area | Strategy |
|------|----------|
| Database | Composite indexes, DISTINCT ON, connection pooling |
| API | Parallel queries, selective includes |
| Frontend | Server Components, lazy loading |
| Build | Turbopack, tree shaking |

### 6.2 Key Performance Indexes

```sql
-- OTB query optimization
CREATE INDEX idx_res_raw_otb ON reservations_raw 
    (hotel_id, book_time, cancel_time, arrival_date, departure_date);

-- Features lookup
CREATE INDEX idx_features_stay_asof ON features_daily 
    (hotel_id, stay_date, as_of_date);

-- Dashboard queries
CREATE INDEX idx_daily_otb_stay ON daily_otb 
    (hotel_id, stay_date, as_of_date);
```

### 6.3 Cache Strategy

| Data | TTL | Strategy |
|------|-----|----------|
| Static Pages | Indefinite | Build-time generation |
| Dashboard Data | None | Real-time fetch |
| Hotel Settings | 5 minutes | Server-side cache |
| Promotion Catalog | 1 hour | Static JSON |

---

## 7. Deployment

### 7.1 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...?pgbouncer=true
DIRECT_URL=postgresql://...

# Auth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=xxx

# Config
DEFAULT_HOTEL_ID=xxx
ADMIN_EMAIL=admin@example.com
```

### 7.2 Vercel Configuration

```json
{
    "root_directory": "apps/web",
    "framework": "nextjs",
    "build_command": "npm run build",
    "install_command": "npm install"
}
```

### 7.3 CI/CD Pipeline

```
git push origin main
        │
        ▼
┌───────────────────┐
│   GitHub Webhook  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Vercel Build    │
│  - npm install    │
│  - prisma generate│
│  - next build     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Deploy to Edge  │
│   Auto-rollback   │
│   if build fails  │
└───────────────────┘
```

---

## 8. Monitoring & Logging

### 8.1 Logging Strategy

```typescript
// Performance logging
console.log(`[Dashboard] Total page render: ${Date.now() - startTime}ms`);

// Error logging
console.error(`[IngestCSV] Error: ${error.message}`, { 
    hotelId, 
    fileName,
    lineNumber 
});
```

### 8.2 Health Checks

| Endpoint | Purpose |
|----------|---------|
| `/api/health` | Basic API health |
| `/api/is-demo-hotel` | Demo hotel detection |

---

## 9. Appendix

### 9.1 Glossary

| Term | Definition |
|------|------------|
| **Server Component** | React component rendered on server |
| **Server Action** | RPC-style function callable from client |
| **Edge Function** | Serverless function at CDN edge |
| **Prisma** | Type-safe ORM for Node.js |

### 9.2 References

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://authjs.dev)
- [Supabase Documentation](https://supabase.com/docs)

### 9.3 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-15 | Eng | Initial technical spec |
| 1.1 | 2026-01-25 | Eng | Cancellation Bridge, timestamptz fields |
| 1.2 | 2026-02-01 | Eng | OTA Pricing module, Room Types, OTA Channels |
| 1.3 | 2026-02-05 | Eng | SaaS Infrastructure, Team Invites, Rate Limiting |
| 1.4 | 2026-02-09 | Eng | Analytics Layer, Time-Travel OTB |
| 1.5 | 2026-02-10 | Eng | OTA Growth Playbook (Premium) |
| 1.6 | 2026-02-11 | Eng | 2-Layer Promotion Architecture, Free Nights, 3-Tier Exclusion |
| 1.7 | 2026-02-12 | Eng | 3 Calculator Modes, Timing Conflict Resolution |
