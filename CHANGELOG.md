# Changelog

## [2026-02-13]
### Added
- Phase 03: Unified Pricing Logic — server as single source of truth.
- `usePricingPreview` hook with AbortController, debounce 250ms, `isRefreshing` state.
- `StackingResult` type in `engine.ts` with `ignored[]` human-readable reasons.
- Enriched `PreviewResult` in `service.ts`: `breakdown[]`, `resolvedPromotions`, `calc_version`.
- Loading/refreshing indicators (Loader2 spinner + opacity transitions) in `PromotionsTab.tsx`.
- 3 new golden tests: Genius L1+L2 dedup, rounding tolerance, ignored[] verification (10 total).
- `force-dynamic` export in `calc-preview/route.ts` to prevent caching.

### Changed
- `PromotionsTab.tsx`: Removed ~210 lines of duplicated client-side pricing logic.
  Deleted: `validate()`, `dedupeBySubcategory()`, `pickBestGenius()`, vendor stacking blocks.
  Now renders API response only via `usePricingPreview` hook.

## [2026-02-12]
### Added
- Dynamic Pricing UI V2: context bar chips, cell drill-down panel, effective discount labels.
- OCC dirty-state validation in `OccTierEditor.tsx`.
- Enriched CSV export with 8-line metadata header.
- Booking.com stacking logic fix (Targeted promos don't stack).
- Promotions Tab UI redesign (Option B).
- Pricing Overview Tab redesign.
- Replace all emoji icons with Lucide icons and text labels (UUPM skill).

## [2026-02-11]
### Added
- OTB Reset checkbox when deleting data by month (`DeleteByMonthButton.tsx`) — clears OTB snapshots + FeaturesDaily.
- Hotel validation before `importJob.create` in `ingestCSV.ts` — prevents FK constraint error on stale hotel_id.
- Friendly error message translation for upload errors (FK, unique constraint, connection errors).
- New API `GET /api/features/latest-date` — returns `max(as_of_date)` from `features_daily`.
- Excel (.xlsx) upload support in `ingestCSV` — auto-detects format (CSV vs Excel).
- Split Excel templates: separate Booked and Cancelled templates with download links.

### Fixed
- **Forecast 0 results bug**: `RunForecastButton` now uses `max(as_of_date)` from `features_daily` instead of `max(booking_date)` from `reservationsRaw`. This aligns forecast query with features built date.
- **Delete-by-month hotel_id filter**: Added `hotel_id` to `WHERE` clause in both `GET` and `DELETE` operations (was deleting across all hotels).
- **Delete button hidden**: Now shows delete button when only OTB data exists (no raw data).

### Fixed
- **Forecast 0 results bug**: `RunForecastButton` now uses `max(as_of_date)` from `features_daily` instead of `max(booking_date)` from `reservationsRaw`. This aligns forecast query with features built date.
- **Delete-by-month hotel_id filter**: Added `hotel_id` to `WHERE` clause in both `GET` and `DELETE` operations (was deleting across all hotels).
- **Delete button hidden**: Now shows delete button when only OTB data exists (no raw data).

## [2026-02-10]
### Added
- Tier-based paywall for OTA Growth, Daily Actions, Pace & Pickup pages.
- `TierPaywall` reusable component with feature preview.
- Super Admin bypasses all paywalls automatically.
- Demo Hotel subscription bypass for all gated features.

### Fixed
- React Hooks ordering violation in gated pages (hooks must be called before conditional returns).

## [2026-02-09]
### Added
- Pricing page room count selector label update ("Khách sạn của bạn có:").
- Full number display in pricing (e.g., "495.000" instead of "495k").
- Enhanced current tier highlighting on pricing page.

## [2026-02-08]
### Added
- V01.4: OTB Time-Travel Date Picker integrated into dashboard.
- V01.4: OTB Snapshot backfill API with chunking (3 per request for Vercel safety).
- V01.4: Advisory lock (`pg_try_advisory_lock`) prevents concurrent OTB builds.
- Onboarding: Vietnamese thousands separator for price inputs.
- Onboarding: Zalo support link and sample Excel template download.

## [2026-02-06]
### Added
- Security audit report (`docs/reports/audit_2026-02-08.md`).
- Dependency health checks.

## [2026-02-05]
### Added
- Demo Hotel merge (Sunset Sanato → Demo Hotel, 270 rooms).
- Viewer role access to `/pricing` route.
- Hotel name hidden in sidebar/header for privacy ("Dashboard" + role shown instead).
- Auto-assignment of new users to Demo Hotel on first login.
- User deletion feature in admin panel.

## [2026-02-03]
### Fixed
- Vercel deployment Prisma Client initialization error — added `postinstall` script for `prisma generate`.

## [2026-02-02]
### Added
- Integration Test Script (`scripts/integration-test.ts`) covering Ingest, OTB, Features, Forecast, Pricing.
- `FeaturesDaily` table columns: `pickup_t15`, `pickup_t5`, `dow`, `month`, `is_weekend`.
- UUID validation for test data.

### Changed
- Refactored Server Actions to use relative imports (`../../lib/...`) for standalone script compatibility.
- Updated Prisma Schema (`ReservationsRaw`, `DailyOTB` restored).

### Fixed
- Null safety issues in `runForecast` and `pricing` logic.
- Schema mismatch in `buildFeatures`.
