# Changelog

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
