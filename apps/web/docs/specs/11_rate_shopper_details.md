# Rate Shopper Details (Scope)

## SerpApi Integration
- **Engine**: `google_hotels`.
- **Query Pattern**:
    - `q`: "Hotel Name" (Initial search) -> `property_token`.
    - `property_token`: Direct property lookup (Pricing).
    - `check_in_date`, `check_out_date`.
    - `adults`: 2 (Standard).
    - `currency`: VND.

## Normalization
Use `source-normalizer.ts` (Planned/Basic):
- **Tax Inclusion**: Google Hotel Ads usually displays "Total price" or "Per night". We map `total_rate_lowest`. Need to flag if Tax inclusive/exclusive (Google raw data varies by locale, `gl=vn` usually inclusive).
- **Cancel Policy**: Not normalized in V01.
- **Breakfast**: Not normalized in V01.

## Caching Strategy
- **Layer**: Database (`rate_shop_cache`).
- **Key**: Hash of Canonical Params (`property_token`, `dates`, `adults`).
- **TTL** (`constants.ts`):
    - 0-14 days out: **2 Hours**.
    - 15-30 days out: **8 Hours**.
    - 30+ days out: **24 Hours**.
- **Retry/Backoff**: Exponential backoff (`5m, 15m, 60m...`) on failures.

## Usage Limits
- **Daily Budget**: 500 searches (System wide).
- **Monthly Quota**: 200 searches (Per Tenant).
- **Manual Scans**: Cap 20/day.
