/**
 * Rate Shopper — TypeScript Types & Interfaces
 *
 * These types mirror the Prisma schema enums and define
 * view models used between backend and frontend.
 *
 * @see spec §4, §9.5, §11.0
 */

// ──────────────────────────────────────────────────
// Enums (mirrors Prisma enums — keep in sync)
// ──────────────────────────────────────────────────

export enum CacheStatus {
    FRESH = 'FRESH',
    STALE = 'STALE',
    EXPIRED = 'EXPIRED',
    REFRESHING = 'REFRESHING',
    FAILED = 'FAILED',
}

export enum AvailabilityStatus {
    AVAILABLE = 'AVAILABLE',
    SOLD_OUT = 'SOLD_OUT',
    NO_RATE = 'NO_RATE',
}

export enum DataConfidence {
    HIGH = 'HIGH',
    MED = 'MED',
    LOW = 'LOW',
}

export enum RequestStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    COALESCED = 'COALESCED',
}

export enum RecommendationStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    EXPIRED = 'EXPIRED',
}

export enum DemandStrength {
    WEAK = 'WEAK',
    NORMAL = 'NORMAL',
    STRONG = 'STRONG',
}

export enum QueryType {
    PROPERTY_DETAILS = 'PROPERTY_DETAILS',
    LISTING = 'LISTING',
}

export enum Provider {
    SERPAPI = 'SERPAPI',
}

// ──────────────────────────────────────────────────
// SerpApi Response Types (parsed)
// ──────────────────────────────────────────────────

export interface SerpApiPropertyDetailsResponse {
    search_metadata: {
        id: string;
        status: string;
        created_at: string;
        processed_at: string;
        google_hotels_url: string;
        total_time_taken: number;
    };
    search_parameters: Record<string, unknown>;
    search_information?: {
        total_results?: number;
    };
    prices?: SerpApiPrice[];
    nearby_hotels?: SerpApiNearbyHotel[];
    /** Raw JSON for storage */
    [key: string]: unknown;
}

export interface SerpApiPrice {
    source: string;
    logo?: string;
    num_guests?: number;
    rate_per_night?: {
        lowest?: string;
        extracted_lowest?: number;
        before_taxes_fees?: number;
        extracted_before_taxes_fees?: number;
    };
    total_rate?: {
        lowest?: string;
        extracted_lowest?: number;
        before_taxes_fees?: number;
        extracted_before_taxes_fees?: number;
    };
    official?: boolean;
    link?: string;
}

export interface SerpApiNearbyHotel {
    name: string;
    hotel_class?: number;
    overall_rating?: number;
    reviews?: number;
    rate_per_night?: {
        lowest?: string;
        extracted_lowest?: number;
    };
}

export interface SerpApiAutocompleteResponse {
    search_metadata: {
        id: string;
        status: string;
    };
    suggestions: SerpApiAutocompleteSuggestion[];
}

export interface SerpApiAutocompleteSuggestion {
    value: string;
    serpapi_property_details_link?: string;
    property_token?: string;
    type: string;
    subtitle?: string;
    thumbnail?: string;
}

/** Response from google_hotels engine (hotel search by name) */
export interface SerpApiHotelSearchResponse {
    search_metadata: {
        id: string;
        status: string;
    };
    search_parameters: Record<string, unknown>;
    properties?: SerpApiHotelSearchProperty[];
    [key: string]: unknown;
}

/** A hotel property returned by google_hotels search */
export interface SerpApiHotelSearchProperty {
    type: string;
    name: string;
    description?: string;
    logo?: string;
    gps_coordinates?: { latitude: number; longitude: number };
    check_in_time?: string;
    check_out_time?: string;
    rate_per_night?: {
        lowest?: string;
        extracted_lowest?: number;
        before_taxes_fees?: string;
        extracted_before_taxes_fees?: number;
    };
    total_rate?: {
        lowest?: string;
        extracted_lowest?: number;
        before_taxes_fees?: string;
        extracted_before_taxes_fees?: number;
    };
    images?: { thumbnail?: string; original_image?: string }[];
    overall_rating?: number;
    reviews?: number;
    location_rating?: number;
    amenities?: string[];
    property_token?: string;
    serpapi_property_details_link?: string;
}

// ──────────────────────────────────────────────────
// Canonical Search Params
// ──────────────────────────────────────────────────

export interface CanonicalSearchParams {
    engine: 'google_hotels';
    q?: string;
    property_token: string;
    check_in_date: string;   // YYYY-MM-DD
    check_out_date: string;  // YYYY-MM-DD
    adults: number;
    children: number;
    currency: string;
    gl: string;
    hl: string;
}

// ──────────────────────────────────────────────────
// Parsed Competitor Rate
// ──────────────────────────────────────────────────

export interface ParsedCompetitorRate {
    source: string;                    // OTA name (normalized)
    availability_status: AvailabilityStatus;
    data_confidence: DataConfidence;
    total_rate_lowest: number | null;       // Decimal → integer VND
    total_rate_before_tax: number | null;   // Decimal → integer VND
    rate_per_night_lowest: number | null;
    rate_per_night_before_tax: number | null;
    representative_price: number | null;    // 4-level priority result
    price_source_level: number;             // 1-4 indicating which priority used
    is_official: boolean;
}

// ──────────────────────────────────────────────────
// Intraday View Model (§11.0 — backend → FE)
// ──────────────────────────────────────────────────

export interface IntradayViewModel {
    offset: number;                // 7|14|30|60|90
    check_in_date: string;         // YYYY-MM-DD
    my_rate: number | null;        // Decimal → integer
    competitors: IntradayCompetitor[];
    cache_status: CacheStatus;     // FRESH|STALE|REFRESHING|FAILED
    cache_fetched_at: string | null; // ISO timestamp ("as-of")
    tax_fee_mixed: boolean;         // badge "Tax/fee mixed"
    before_tax_ratio: number;       // 0–1
}

export interface IntradayCompetitor {
    competitor_id: string;
    name: string;
    representative_price: number | null; // best rate across all sources
    availability_status: AvailabilityStatus;
    data_confidence: DataConfidence;
    source: string;              // best source OTA name
    scraped_at: string;          // ISO timestamp
    rates: IntradayRate[];       // ALL OTA source rates
}

export interface IntradayRate {
    source: string;              // normalized OTA name (Agoda, Booking.com, ...)
    representative_price: number | null;
    total_rate_lowest: number | null;
    total_rate_before_tax: number | null;
    rate_per_night_lowest: number | null;
    rate_per_night_before_tax: number | null;
    price_source_level: number;
    data_confidence: DataConfidence;
    availability_status: AvailabilityStatus;
    is_official: boolean;
    scraped_at: string;
}

// ──────────────────────────────────────────────────
// Aggregation Result (for MarketSnapshot)
// ──────────────────────────────────────────────────

export interface AggregationResult {
    comp_min: number | null;
    comp_max: number | null;
    comp_avg: number | null;
    comp_median: number | null;
    comp_available_count: number;
    sold_out_count: number;
    no_rate_count: number;
    demand_strength: DemandStrength;
    market_confidence: DataConfidence;
    before_tax_ratio: number;
}
