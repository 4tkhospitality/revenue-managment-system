# Intake Pack — Revenue Management System
**Date**: 2026-02-07  
**Version**: V01.2  
**Repo**: `4tkhospitality/revenue-management-system` (`main` branch, HEAD)

---

## 1. PMS Export Contract

### Export Type
- **Design Intent**: **Delta** (only new/changed bookings per export).
- **Reality**: The system is **PMS-agnostic** — it accepts whatever CSV the user uploads. There is **no enforced contract** with any PMS. The user manually exports from their PMS and uploads.

### Export Frequency
- Manual upload (no scheduled sync). User decides when to import.

### Included Records
- **Booked**: ✅ Yes
- **Cancelled**: ✅ Yes (with `cancel_date`)
- **Past Stays**: ✅ Yes (no date-range filter on import)

### Reservation Identity
- `reservation_id` is a free-text string from the PMS. It **can repeat** across Import Jobs.

### Update Semantics (Amend/Re-export)
- **Not explicitly handled.** If a PMS re-exports the same `reservation_id` in a new CSV:
    - A NEW row is created in `reservations_raw` (unique key is `[hotel_id, reservation_id, job_id]`).
    - The OLD row from the previous job **remains**.

> [!CAUTION]
> ### 🔴 CRITICAL BUG: OTB Double-Counting Risk
> `buildDailyOTB.ts` queries **ALL rows** from `reservations_raw` matching `book_time <= asOfTs` without any deduplication by `reservation_id`.
>
> **Impact**: If the same reservation appears in 2 Import Jobs (e.g., daily snapshot exports), OTB will count it **twice** — inflating Rooms, Revenue, Occ, and ADR.
>
> **Current Mitigation**: None. The `skipDuplicates: true` in `ingestCSV.ts` only prevents duplicates **within the same job** (same `[hotel_id, reservation_id, job_id]`).
>
> **Required Fix**: Either:
> 1. Add a "canonical view" query that picks **latest job per reservation_id** before aggregation, OR
> 2. Enforce Delta-only imports (reject if `reservation_id` already exists in ANY completed job), OR
> 3. Add a `reservation_id` dedup step in `buildDailyOTB` (e.g., `DISTINCT ON (reservation_id)` with `ORDER BY job.created_at DESC`).

### as_of_date Determination
- **For OTB**: `asOfTs` parameter (default: `new Date()` = now). Truncated to midnight for the `as_of_date` field in `daily_otb`.
- **For Import Job**: `ImportJob.created_at` (auto-set on upload). There is **no user-provided `extracted_at` or `snapshot_date` field** in the CSV or ImportJob model.

---

## 2. Merge / Dedupe Rules (RAW → Canonical)

| Aspect | Current Implementation |
| :--- | :--- |
| RAW Uniqueness | `[hotel_id, reservation_id, job_id]` |
| Canonical View | ❌ **Does not exist.** No materialized "latest version" view. |
| Dedup Rule in OTB Builder | ❌ **None.** All matching rows are aggregated. |
| `as_of_date` source | `asOfTs` parameter (timestamp), NOT derived from CSV data. |

> [!WARNING]
> **Recommendation**: Create a `canonical_reservations` view or CTE that selects `DISTINCT ON (hotel_id, reservation_id) ORDER BY loaded_at DESC` before feeding into `buildDailyOTB`. This is the single most important fix for data correctness.

---

## 3. Inventory / Capacity Model

| Aspect | Current Implementation |
| :--- | :--- |
| Total Rooms | `Hotel.capacity` (Integer, set once at hotel creation). |
| Per-Day Capacity | ❌ **Not supported.** No `InventoryDaily` table. |
| Out-of-Order (OOO) | ❌ **Not supported.** |
| Room Closures | ❌ **Not supported.** |
| Capacity Override | ❌ **Not supported.** |

> [!WARNING]
> ### 🔴 BUG: Hardcoded Capacity in Pricing Engine
> `runPricingEngine.ts` line 29: `const capacity = 50;` — This **ignores** `Hotel.capacity` entirely. The pricing engine always assumes 50 rooms regardless of actual hotel size.
>
> **Fix**: Replace with `const hotel = await prisma.hotel.findUnique({ where: { hotel_id: hotelId }, select: { capacity: true } }); const capacity = hotel?.capacity ?? 50;`

### Occ Calculation
- **Formula**: `rooms_otb / Hotel.capacity * 100`
- **Where calculated**: Dashboard UI (client-side), using `Hotel.capacity`.
- **Issue**: Pricing Engine uses hardcoded 50, Dashboard may use correct value — inconsistency.

---

## 4. Data Dictionary (CSV → DB)

| CSV Column | DB Field (`reservations_raw`) | DB Type | Required | Default | Validation | Notes |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `reservation_id` | `reservation_id` | String | ✅ | — | Non-empty | Free-text from PMS |
| `booking_date` | `booking_date` | Date | ✅ | — | Valid ISO date | Parsed via `date-fns/parseISO` |
| `arrival_date` | `arrival_date` | Date | ✅ | — | Valid ISO date, `< departure` | — |
| `departure_date` | `departure_date` | Date | ✅ | — | Valid ISO date, `> arrival` | — |
| `rooms` | `rooms` | Int | ✅ | — | `> 0` | **Room count** (not room-nights) |
| `revenue` | `revenue` | Decimal | ✅ | — | `>= 0` | See note below |
| `status` | `status` | Enum | ✅ | — | `booked`/`cancelled` | Normalized from variants |
| `cancel_date` | `cancel_date` | Date? | Cond. | `null` | If `cancelled` | Warn if missing |
| *(not in CSV)* | `book_time` | Timestamptz? | — | `null` | — | Set by XML import only |
| *(not in CSV)* | `cancel_time` | Timestamptz? | — | `null` | — | Set by XML/Bridge only |
| *(not in CSV)* | `job_id` | UUID | Auto | — | FK to ImportJob | Set by system |
| *(not in CSV)* | `loaded_at` | DateTime | Auto | `now()` | — | System timestamp |

### Key Conventions
- **Currency**: Determined by `Hotel.currency` (default `VND`). CSV has no currency column — assumed to match hotel setting.
- **Revenue**: Depends on PMS export. System treats it as **room charge only** (no F&B, tax breakdown). Whether Gross or Net is **undefined** — depends on what the PMS exports.
- **Timezone**: Dates parsed as **naive dates** (no timezone). `date-fns/parseISO` treats `YYYY-MM-DD` as local midnight. OTB uses `asOfTs` which is a full timestamp (UTC or server-local).
- **Rounding (OTB Revenue Split)**: `Math.floor(total / nights)` per night, remainder added to **last night**.

---

## 5. Business Edge Cases

| Scenario | Supported | Rule / Notes |
| :--- | :---: | :--- |
| **0-Night Stay** (`arrival == departure`) | ❌ Rejected | Validation: `arrival < departure` required. |
| **Revenue = 0** | ✅ Allowed | `revenue >= 0` passes validation. |
| **Rooms = 0** | ❌ Rejected | Validation: `rooms > 0` required. |
| **Status missing/unknown** | ❌ Rejected | Strict mode: throws error. |
| **Cancelled but no `cancel_date`** | ⚠️ Warn | Import succeeds. OTB treats as **active** (since `cancel_time` is null, booking passes the `cancel_time IS NULL` filter). |
| **Booking date modification** (amend dates) | ❌ Not handled | New import creates parallel row. Old row still active in OTB. **Will cause double-count.** |
| **No-show** | ❌ Out of scope | No `no_show` status. Treated as `booked` until cancelled. |
| **Early check-out** | ❌ Out of scope | No mechanism to shorten stay. |
| **Split booking** | ❌ Out of scope | — |
| **Merge booking** | ❌ Out of scope | — |
| **Multi-room booking** (`rooms > 1`) | ✅ Handled | Revenue split: `total / nights` per room-night. All rooms share same revenue figure. |
| **Group / Allotment / Block** | ❌ Out of scope | No group booking model. |
| **Overbooking** (`rooms_otb > capacity`) | ⚠️ Not guarded | No validation prevents OTB exceeding capacity. |

---

## 6. Rate Shopper Specification

### Comp-Set Configuration
- **Table**: `competitors` (per `hotel_id`).
- **Config UI**: `/rate-shopper` page → "Add Competitor" form.
- **Key Fields**:
    - `name`: Display name.
    - `serpapi_property_token`: Google Hotels property identifier.
    - `star_rating`: Optional.
    - `tier`: 1 (Primary) / 2 (Secondary).
    - `is_active`: Toggle.

### SerpApi Query Strategy
- **Engine**: `google_hotels` (Property Details mode).
- **Parameters**:
    - `property_token`: From competitor record.
    - `check_in_date` / `check_out_date`: Derived from offset days `[7, 14, 30, 60, 90]`.
    - `adults`: 2 (fixed default).
    - `currency`: `VND`.
    - `gl`: `vn`, `hl`: `vi`.
- **Timeout**: 30 seconds per request.

### Cache Policy
- **Storage**: `rate_shop_cache` table (DB-level cache).
- **Key**: Hash of `[property_token, check_in, check_out, adults, currency]`.
- **TTL**:
    - 0-14 days out: 2h cache + 2h stale grace.
    - 15-30 days: 8h + 6h.
    - 30+ days: 24h + 12h.
- **Retry/Backoff**: `[5m, 15m, 60m, 120m, 360m]` exponential on failures.
- **Rate Limit**: SerpApi returns 429 → caught as `SerpApiRateLimitError`.
- **Ban/Captcha**: Not handled (SerpApi abstracts this).

### Normalization
- **Tax Inclusion**: Raw `total_rate_lowest` stored. No explicit tax/fee decomposition.
- **Cancel Policy**: ❌ Not normalized.
- **Breakfast**: ❌ Not normalized.
- **Channel (mobile/desktop)**: ❌ Not distinguished.

### Quotas
- **System Daily**: 500 searches.
- **Tenant Monthly**: 200 searches.
- **Manual Scans**: 20/day/hotel.
- **Scheduler Batch**: 20 per run.

---

## 7. API Contract

### Import
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/import-jobs` | Session | List import jobs (paginated). |
| `POST` | Server Action: `ingestCSV(formData)` | Session | Upload & process CSV file. |

### OTB
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | Server Action: `buildDailyOTB(params)` | Session | Build OTB snapshot. |
| `POST` | Server Action: `rebuildAllOTB()` | Session | Rebuild all OTB data. |
| `DELETE` | `/api/data/delete-by-month` | Session | Delete raw data by month. |

### Pricing
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/pricing/ota-channels` | Cookie | List OTA channels. |
| `POST` | `/api/pricing/ota-channels` | Cookie | Create OTA channel. |
| `PUT` | `/api/pricing/ota-channels/[id]` | Cookie | Update OTA channel. |
| `DELETE` | `/api/pricing/ota-channels/[id]` | Cookie | Delete OTA channel. |
| `GET` | `/api/pricing/campaigns` | Cookie | List campaigns. |
| `POST` | `/api/pricing/campaigns` | Cookie | Create campaign. |
| `PUT/DEL` | `/api/pricing/campaigns/[id]` | Cookie | Update/Delete campaign. |
| `POST` | `/api/pricing/calc-matrix` | Cookie | Calculate BAR matrix. |
| `GET` | `/api/pricing/catalog` | Cookie | Get promotion catalog. |
| `GET` | `/api/pricing/room-types` | Cookie | List room types. |
| `POST` | `/api/pricing/room-types` | Cookie | Create room type. |

### Rate Shopper
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/rate-shopper/competitors` | Cookie | List competitors. |
| `POST` | `/api/rate-shopper/competitors` | Cookie | Add competitor. |
| `DELETE` | `/api/rate-shopper/competitors/[id]` | Cookie | Remove competitor. |
| `POST` | `/api/rate-shopper/scan` | Cookie | Manual scan (single/bulk). |
| `GET` | `/api/rate-shopper/search` | Cookie | Search hotels (onboarding). |
| `GET` | `/api/rate-shopper/intraday` | Cookie | Get intraday rate data. |
| `GET` | `/api/rate-shopper/recommendations` | Cookie | Get rate recommendations. |
| `GET` | `/api/rate-shopper/usage` | Cookie | Get usage/quota stats. |

### Admin
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/admin/users` | Admin | List all users. |
| `PUT` | `/api/admin/users/[id]` | Admin | Update user role/status. |
| `DELETE` | `/api/admin/users/[id]` | Admin | Delete user. |
| `POST` | `/api/admin/users/[id]/hotels` | Admin | Assign hotel to user. |
| `GET` | `/api/admin/hotels` | Admin | List all hotels. |
| `PUT` | `/api/admin/hotels/[id]` | Admin | Update hotel. |

### Auth / System
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `*` | `/api/auth/[...nextauth]` | Public | NextAuth handlers. |
| `POST` | `/api/onboarding` | Session | First-time user setup. |
| `POST` | `/api/user/switch-hotel` | Session | Switch active hotel. |
| `GET` | `/api/settings` | Session | Get hotel settings. |
| `GET` | `/api/is-demo-hotel` | Session | Check if current hotel is demo. |

### Cron Jobs
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/cron/rate-shopper` | Cron Secret | Scheduled rate refresh. |
| `GET` | `/api/cron/rate-shopper/cleanup` | Cron Secret | Purge expired cache/rates. |
| `GET` | `/api/cron/rate-shopper/snapshot` | Cron Secret | Build market snapshots. |

### Idempotency Keys
- **Import**: `file_hash` (SHA-256) — prevents re-processing same file.
- **Pricing Decide**: ❌ No idempotency key. Multiple submits create duplicate decisions.
- **Rate Shopper Scan**: Cache-level coalescing (`COALESCED` status if identical request in-flight).

---

## 8. Ops Runbook (Expanded)

### Environments
| Env | Platform | URL | DB |
| :--- | :--- | :--- | :--- |
| Dev | Local (`next dev`) | `localhost:3000` | Supabase (shared) |
| Prod | Vercel | `*.vercel.app` | Supabase (shared) |
| Staging | ❌ Not configured | — | — |

### Migration
```bash
# Dev
npx prisma migrate dev --name "description"
# Prod (pre-deploy)
npx prisma migrate deploy
# Emergency schema push (no migration file)
npx prisma db push
```

### Seed
```bash
npm run prisma:seed   # Creates Hotel California + Admin user
```

### Cron Jobs
| Job | Trigger | Frequency | Platform |
| :--- | :--- | :--- | :--- |
| Rate Shopper Refresh | `/api/cron/rate-shopper` | Configurable (Vercel Cron) | Vercel |
| Cache Cleanup | `/api/cron/rate-shopper/cleanup` | Daily | Vercel |
| Market Snapshot | `/api/cron/rate-shopper/snapshot` | Daily | Vercel |
| OTB Rebuild | Manual (UI button) | On-demand | — |

### Backup & Restore
- **Supabase Pro Plan**: PITR (7 days), Daily automatic backups.
- **Manual Backup**: `supabase db dump -f backup.sql`
- **Restore**: Supabase Dashboard → Backups → Restore.

### Monitoring & Logging
- **Current**: `console.log` / `console.error` → Vercel Runtime Logs.
- **Planned**: Sentry (Error tracking), Vercel Analytics (Performance).

### Rate Limiting
- **Current**: ❌ No rate limiting on any route.
- **Planned**: Implement on `/api/auth/*` and `/api/rate-shopper/scan`.

### Data Retention
- **Raw Responses** (`rate_shop_cache.raw_response`): 7 days, then nulled.
- **Competitor Rates**: Purged 7 days after check-in date.
- **Market Snapshots**: Non-latest purged after 3 days.
- **Reservations Raw**: ♾️ Kept indefinitely.

---

## 9. Known Limits

| Dimension | Current Limit | Notes |
| :--- | :--- | :--- |
| Max rows per import | **Unlimited** (Prisma `createMany`) | Risk: Large files may timeout on Vercel (30s serverless). |
| Max hotels | **Unlimited** | But no horizontal scaling. |
| Max users per hotel | **Unlimited** | — |
| Max competitors per hotel | **Unlimited** | But quota limits searches. |
| Vercel Function Timeout | **30s** (Hobby) / **60s** (Pro) | Large imports or bulk scans may fail. |
| DB Connection Pool | Supabase default (Pooler) | — |
| SerpApi Monthly Searches | Plan-dependent (100 free) | — |

---

## 10. Additional Bugs Found During Analysis

> [!CAUTION]
> ### `submitDecision.ts` — Hardcoded `user_id`
> Line 38: `user_id: "system_user"` — All pricing decisions are logged as "system_user" instead of the actual authenticated user. This breaks the audit trail.

> [!WARNING]
> ### `runPricingEngine.ts` — Hardcoded Base Price
> Line 30: `const basePrice = 100;` — The pricing engine always uses $100 as the base price, ignoring actual room type pricing or historical ADR.
