/**
 * Rate Shopper — Cache Key Generator
 *
 * Generates deterministic cache keys from canonical search params.
 * Cache key = sha256(sortedJSON(canonicalParams))
 *
 * Also provides materialized column extraction for indexed queries.
 *
 * @see spec §5.1, Key Decision #2
 */

import { createHash } from 'crypto';
import { addDays, format, differenceInCalendarDays, parseISO } from 'date-fns';
import type { CanonicalSearchParams } from './types';
import { DEFAULT_SEARCH, type OffsetDay } from './constants';
import { vnTodayPlus } from './timezone';

// ──────────────────────────────────────────────────
// Cache Key Generation
// ──────────────────────────────────────────────────

/**
 * Generates a deterministic cache key from canonical search parameters.
 * Sort keys alphabetically → JSON stringify → SHA256 hash.
 *
 * This ensures that identical search params always produce the same cache key,
 * enabling global cache sharing across tenants.
 */
export function generateCacheKey(params: CanonicalSearchParams): string {
    const sorted = Object.keys(params)
        .sort()
        .reduce(
            (obj, key) => {
                obj[key] = params[key as keyof CanonicalSearchParams];
                return obj;
            },
            {} as Record<string, unknown>,
        );

    const json = JSON.stringify(sorted);
    return createHash('sha256').update(json).digest('hex');
}

// ──────────────────────────────────────────────────
// Canonical Params Builder
// ──────────────────────────────────────────────────

/**
 * Build canonical search parameters for a property token + offset.
 *
 * @param propertyToken - SerpApi property token
 * @param offset - Horizon offset in days (7, 14, 30, 60, 90)
 * @param overrides - Optional param overrides
 */
export function buildCanonicalParams(
    propertyToken: string,
    offset: OffsetDay,
    overrides?: Partial<Pick<CanonicalSearchParams, 'adults' | 'children' | 'currency' | 'gl' | 'hl'>>,
): CanonicalSearchParams {
    const checkIn = vnTodayPlus(offset);
    const checkOut = format(
        addDays(parseISO(checkIn), DEFAULT_SEARCH.length_of_stay),
        'yyyy-MM-dd',
    );

    return {
        engine: 'google_hotels',
        property_token: propertyToken,
        check_in_date: checkIn,
        check_out_date: checkOut,
        adults: overrides?.adults ?? DEFAULT_SEARCH.adults,
        children: overrides?.children ?? DEFAULT_SEARCH.children,
        currency: overrides?.currency ?? DEFAULT_SEARCH.currency,
        gl: overrides?.gl ?? DEFAULT_SEARCH.gl,
        hl: overrides?.hl ?? DEFAULT_SEARCH.hl,
    };
}

// ──────────────────────────────────────────────────
// Materialized Columns
// ──────────────────────────────────────────────────

/**
 * Extract materialized columns from canonical params.
 * These are denormalized into RateShopCache for indexed queries.
 *
 * @returns Object with 7 materialized fields for DB insert
 */
export function populateMaterializedColumns(params: CanonicalSearchParams) {
    const checkIn = parseISO(params.check_in_date);
    const checkOut = parseISO(params.check_out_date);
    const today = parseISO(vnTodayPlus(0)); // vnToday as Date for diff calc

    return {
        property_token: params.property_token,
        check_in_date: params.check_in_date,      // string YYYY-MM-DD
        check_out_date: params.check_out_date,     // string YYYY-MM-DD
        adults: params.adults,
        length_of_stay: differenceInCalendarDays(checkOut, checkIn),
        currency: params.currency,
        offset_days: differenceInCalendarDays(checkIn, today),
    };
}
