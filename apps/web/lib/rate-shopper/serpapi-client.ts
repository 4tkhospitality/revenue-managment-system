/**
 * Rate Shopper — SerpApi Client
 *
 * Handles all HTTP communication with SerpApi.
 * Only two endpoints: Property Details (pricing) and Autocomplete (onboarding).
 *
 * @see spec §10.1, §2.2
 */

import { SERPAPI_BASE_URL, SERPAPI_ENGINES } from './constants';
import type {
    CanonicalSearchParams,
    SerpApiPropertyDetailsResponse,
    SerpApiAutocompleteResponse,
    SerpApiHotelSearchResponse,
} from './types';

// ──────────────────────────────────────────────────
// Error Types
// ──────────────────────────────────────────────────

export class SerpApiError extends Error {
    constructor(
        message: string,
        public readonly httpStatus: number,
        public readonly searchId?: string,
    ) {
        super(message);
        this.name = 'SerpApiError';
    }
}

export class SerpApiRateLimitError extends SerpApiError {
    constructor(searchId?: string) {
        super('SerpApi rate limit exceeded', 429, searchId);
        this.name = 'SerpApiRateLimitError';
    }
}

// ──────────────────────────────────────────────────
// Private Helpers
// ──────────────────────────────────────────────────

function getApiKey(): string {
    const key = process.env.SERPAPI_API_KEY;
    if (!key) throw new Error('SERPAPI_API_KEY environment variable is not set');
    return key;
}

/**
 * Generic SerpApi fetch with error handling and timeout.
 */
async function serpApiFetch<T>(params: Record<string, string | number>): Promise<T> {
    const url = new URL(SERPAPI_BASE_URL);
    url.searchParams.set('api_key', getApiKey());

    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000); // 30s timeout

    try {
        const response = await fetch(url.toString(), {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
        });

        if (response.status === 429) {
            throw new SerpApiRateLimitError();
        }

        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new SerpApiError(
                `SerpApi returned ${response.status}: ${body.slice(0, 200)}`,
                response.status,
            );
        }

        const json = (await response.json()) as T;
        return json;
    } finally {
        clearTimeout(timeout);
    }
}

// ──────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────

/**
 * Fetch property details (pricing snapshot for a specific hotel).
 * This is the primary data source for Rate Shopper Phase 1.
 *
 * @param params - Canonical search parameters
 * @returns Raw SerpApi response (preserved for storage + parsing)
 */
export async function fetchPropertyDetails(
    params: CanonicalSearchParams,
): Promise<SerpApiPropertyDetailsResponse> {
    return serpApiFetch<SerpApiPropertyDetailsResponse>({
        engine: SERPAPI_ENGINES.PROPERTY_DETAILS,
        q: 'hotel',   // Required by SerpApi — property_token handles actual lookup
        property_token: params.property_token,
        check_in_date: params.check_in_date,
        check_out_date: params.check_out_date,
        adults: params.adults,
        children: params.children,
        currency: params.currency,
        gl: params.gl,
        hl: params.hl,
    });
}

/**
 * Fetch autocomplete suggestions for competitor onboarding.
 * Returns suggestions including property_token for selected hotels.
 *
 * @param query - Hotel name or location text
 */
export async function fetchAutocomplete(
    query: string,
): Promise<SerpApiAutocompleteResponse> {
    return serpApiFetch<SerpApiAutocompleteResponse>({
        engine: SERPAPI_ENGINES.AUTOCOMPLETE,
        q: query,
    });
}

/**
 * Search hotels by name using google_hotels engine.
 * Returns actual hotel properties with property_token, name, address, etc.
 * This is the preferred method for competitor onboarding.
 *
 * @param query - Hotel name or location text
 */
export async function fetchHotelSearch(
    query: string,
): Promise<SerpApiHotelSearchResponse> {
    return serpApiFetch<SerpApiHotelSearchResponse>({
        engine: SERPAPI_ENGINES.PROPERTY_DETAILS.replace('_property', ''),  // 'google_hotels'
        q: query,
        check_in_date: getDefaultCheckIn(),
        check_out_date: getDefaultCheckOut(),
        adults: 2,
        currency: 'VND',
        gl: 'vn',
        hl: 'vi',
    });
}

/** Helper: tomorrow's date as YYYY-MM-DD */
function getDefaultCheckIn(): string {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
}

/** Helper: day-after-tomorrow as YYYY-MM-DD */
function getDefaultCheckOut(): string {
    const d = new Date();
    d.setDate(d.getDate() + 8);
    return d.toISOString().slice(0, 10);
}
