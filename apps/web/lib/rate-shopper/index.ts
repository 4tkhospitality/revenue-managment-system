/**
 * Rate Shopper — Barrel Export
 *
 * Central entry point for all rate-shopper utilities.
 * Import from 'lib/rate-shopper' instead of individual files.
 */

// Timezone helpers
export {
    getVNDate,
    getVNMonth,
    vnTodayMinus,
    vnTodayPlus,
    getVNNow,
} from './timezone';

// Constants & configuration
export {
    OFFSET_DAYS,
    DEFAULT_SEARCH,
    getTTLForOffset,
    SYSTEM_DAILY_BUDGET,
    TENANT_MONTHLY_QUOTA,
    MAX_MANUAL_SCANS_PER_DAY,
    SCHEDULER_BATCH_LIMIT,
    BACKOFF_MINUTES,
    MAX_FAIL_STREAK,
    getBackoffMs,
    SERPAPI_BASE_URL,
    SERPAPI_ENGINES,
    MIN_COMPS_HIGH,
    MIN_SOURCES_HIGH,
    MIN_BEFORE_TAX_RATIO_HIGH,
    RAW_RESPONSE_RETENTION_DAYS,
    PAST_STAY_PURGE_DAYS,
    NON_LATEST_SNAPSHOT_DAYS,
    COMPETITOR_RATE_MAX_AGE_DAYS,
} from './constants';
export type { OffsetDay } from './constants';

// Types & Enums
export {
    CacheStatus,
    AvailabilityStatus,
    DataConfidence,
    RequestStatus,
    RecommendationStatus,
    DemandStrength,
    QueryType,
    Provider,
} from './types';
export type {
    SerpApiPropertyDetailsResponse,
    SerpApiPrice,
    SerpApiNearbyHotel,
    SerpApiAutocompleteResponse,
    SerpApiAutocompleteSuggestion,
    CanonicalSearchParams,
    ParsedCompetitorRate,
    IntradayViewModel,
    IntradayCompetitor,
    AggregationResult,
} from './types';

// SerpApi client
export {
    fetchPropertyDetails,
    fetchAutocomplete,
    SerpApiError,
    SerpApiRateLimitError,
} from './serpapi-client';

// Cache key
export {
    generateCacheKey,
    buildCanonicalParams,
    populateMaterializedColumns,
} from './cache-key';

// Source normalizer
export {
    normalizeOTASource,
    countUniqueSources,
} from './source-normalizer';

// Rounding
export {
    roundVND,
    medianVND,
    extractPrice,
} from './rounding';

// Parser
export {
    parsePropertyDetailsResponse,
} from './parser';
export type { ParseResult } from './parser';

// Cache Service
export {
    readCache,
    acquireRefreshLock,
    releaseRefreshSuccess,
    releaseRefreshFailure,
} from './cache-service';
export type { CacheReadResult, LockResult } from './cache-service';

// Quota Service
export {
    checkManualScanLimit,
    checkTenantQuota,
    checkSystemBudget,
    recordUsage,
    preFlightCheck,
} from './quota-service';

// Aggregation
export { aggregateRates } from './aggregation';

// Refresh Job
export { executeRefresh } from './refresh-job';
export type { RefreshResult } from './refresh-job';

// Jobs
export { runSnapshotBuilder } from './jobs/snapshot-builder';
export type { SnapshotResult } from './jobs/snapshot-builder';
export { runScheduler } from './jobs/scheduler';
export {
    generateRecommendations,
    acceptRecommendation,
    rejectRecommendation,
    getPendingRecommendations,
} from './jobs/recommendation-engine';
export type { RecommendationOutput } from './jobs/recommendation-engine';
export { runDataCleanup } from './jobs/data-cleanup';
export type { CleanupResult } from './jobs/data-cleanup';
