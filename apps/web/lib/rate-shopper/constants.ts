/**
 * Rate Shopper — Constants & Configuration
 *
 * Centralized config for offsets, TTLs, quotas, and billing rules.
 * @see spec §3, §5, §8
 */

// ──────────────────────────────────────────────────
// Horizons (Phase 1: 5 offset points only)
// ──────────────────────────────────────────────────

/** Whitelist of allowed offset days — enforced by CHECK constraint */
export const OFFSET_DAYS = [7, 14, 30, 60, 90] as const;
export type OffsetDay = (typeof OFFSET_DAYS)[number];

/** Default search params */
export const DEFAULT_SEARCH = {
    length_of_stay: 1,
    adults: 2,
    children: 0,
    currency: 'VND',
    gl: 'vn',
    hl: 'vi',
} as const;

// ──────────────────────────────────────────────────
// TTL Configuration (milliseconds)
// ──────────────────────────────────────────────────

interface TTLConfig {
    cacheTTL: number;
    staleGrace: number;
}

/** TTL by horizon range (§3.2) */
export function getTTLForOffset(offset: number): TTLConfig {
    if (offset <= 14) {
        return { cacheTTL: 2 * 60 * 60 * 1000, staleGrace: 2 * 60 * 60 * 1000 }; // 2h + 2h
    }
    if (offset <= 30) {
        return { cacheTTL: 8 * 60 * 60 * 1000, staleGrace: 6 * 60 * 60 * 1000 }; // 8h + 6h
    }
    return { cacheTTL: 24 * 60 * 60 * 1000, staleGrace: 12 * 60 * 60 * 1000 }; // 24h + 12h
}

// ──────────────────────────────────────────────────
// Quota & Billing
// ──────────────────────────────────────────────────

/** System-wide daily budget (env overridable) */
export const SYSTEM_DAILY_BUDGET = parseInt(
    process.env.RATE_SHOPPER_DAILY_BUDGET ?? '500',
    10,
);

/** Per-tenant monthly quota cap */
export const TENANT_MONTHLY_QUOTA = parseInt(
    process.env.RATE_SHOPPER_TENANT_MONTHLY_QUOTA ?? '200',
    10,
);

/** Max manual scans per day per hotel (spam prevention) */
export const MAX_MANUAL_SCANS_PER_DAY = parseInt(
    process.env.RATE_SHOPPER_MAX_MANUAL_SCANS ?? '20',
    10,
);

/** Batch limit per scheduler run */
export const SCHEDULER_BATCH_LIMIT = parseInt(
    process.env.RATE_SHOPPER_BATCH_LIMIT ?? '20',
    10,
);

// ──────────────────────────────────────────────────
// Backoff Configuration
// ──────────────────────────────────────────────────

/** Backoff durations by fail_streak (minutes) */
export const BACKOFF_MINUTES = [5, 15, 60, 120, 360] as const;

/** Max fail streak before giving up */
export const MAX_FAIL_STREAK = BACKOFF_MINUTES.length;

/** Get backoff duration for current streak */
export function getBackoffMs(failStreak: number): number {
    const idx = Math.min(failStreak, BACKOFF_MINUTES.length - 1);
    return BACKOFF_MINUTES[idx] * 60 * 1000;
}

// ──────────────────────────────────────────────────
// SerpApi
// ──────────────────────────────────────────────────

export const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';

/** SerpApi engines used */
export const SERPAPI_ENGINES = {
    PROPERTY_DETAILS: 'google_hotels' as const,
    AUTOCOMPLETE: 'google_hotels_autocomplete' as const,
};

// ──────────────────────────────────────────────────
// Confidence Thresholds
// ──────────────────────────────────────────────────

/** Minimum comps for HIGH confidence */
export const MIN_COMPS_HIGH = 3;

/** Minimum unique sources for HIGH confidence */
export const MIN_SOURCES_HIGH = 2;

/** Minimum before_tax_ratio for HIGH confidence */
export const MIN_BEFORE_TAX_RATIO_HIGH = 0.6;

// ──────────────────────────────────────────────────
// Retention
// ──────────────────────────────────────────────────

/** Days to keep raw_response in DB before nulling */
export const RAW_RESPONSE_RETENTION_DAYS = 7;

/** Days after check-in to purge CompetitorRate / Recommendation */
export const PAST_STAY_PURGE_DAYS = 7;

/** Days to keep non-latest MarketSnapshot */
export const NON_LATEST_SNAPSHOT_DAYS = 3;

/** Max scrape age for CompetitorRate (future dates) */
export const COMPETITOR_RATE_MAX_AGE_DAYS = 90;
