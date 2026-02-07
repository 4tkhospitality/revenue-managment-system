/**
 * Rate Shopper — Response Parser
 *
 * Parses SerpApi property details responses into CompetitorRate-compatible objects.
 * Implements 4-level representative price priority and tax/fee normalization.
 *
 * @see spec §9.1–9.6, Key Decision #12
 */

import type {
    SerpApiPropertyDetailsResponse,
    SerpApiPrice,
    ParsedCompetitorRate,
} from './types';
import { AvailabilityStatus, DataConfidence } from './types';
import { normalizeOTASource } from './source-normalizer';
import { extractPrice } from './rounding';

// ──────────────────────────────────────────────────
// Main Parser
// ──────────────────────────────────────────────────

export interface ParseResult {
    rates: ParsedCompetitorRate[];
    searchId: string;
    before_tax_ratio: number;
    total_sources: number;
    raw_response: SerpApiPropertyDetailsResponse;
}

/**
 * Parse a full SerpApi property details response into structured rates.
 *
 * @param response - Raw SerpApi JSON response
 * @param lengthOfStay - LOS for nightly→total calculation
 * @returns Parsed rates with metadata
 */
export function parsePropertyDetailsResponse(
    response: SerpApiPropertyDetailsResponse,
    lengthOfStay: number = 1,
): ParseResult {
    const searchId = response.search_metadata?.id ?? 'unknown';
    const prices = response.prices ?? [];

    if (prices.length === 0) {
        return {
            rates: [],
            searchId,
            before_tax_ratio: 0,
            total_sources: 0,
            raw_response: response,
        };
    }

    const rates = prices.map((price) => parseSinglePrice(price, lengthOfStay));
    const withBeforeTax = rates.filter((r) => r.total_rate_before_tax !== null);
    const before_tax_ratio =
        rates.length > 0 ? withBeforeTax.length / rates.length : 0;

    return {
        rates,
        searchId,
        before_tax_ratio,
        total_sources: rates.length,
        raw_response: response,
    };
}

// ──────────────────────────────────────────────────
// Single Price Parser
// ──────────────────────────────────────────────────

/**
 * Parse a single SerpApi price entry with 4-level representative price priority.
 *
 * Priority:
 * 1. total_rate_before_tax (nếu có)
 * 2. total_rate_lowest
 * 3. rate_per_night_before_tax × LOS
 * 4. rate_per_night_lowest × LOS
 *
 * @see spec §9.5 Step 1
 */
function parseSinglePrice(
    price: SerpApiPrice,
    lengthOfStay: number,
): ParsedCompetitorRate {
    const source = normalizeOTASource(price.source);

    // Extract all price fields
    const totalLowest = extractPrice(
        price.total_rate?.extracted_lowest ?? price.total_rate?.lowest,
    );
    const totalBeforeTax = extractPrice(
        price.total_rate?.extracted_before_taxes_fees ??
        price.total_rate?.before_taxes_fees,
    );
    const nightlyLowest = extractPrice(
        price.rate_per_night?.extracted_lowest ?? price.rate_per_night?.lowest,
    );
    const nightlyBeforeTax = extractPrice(
        price.rate_per_night?.extracted_before_taxes_fees ??
        price.rate_per_night?.before_taxes_fees,
    );

    // 4-level representative price selection
    const { representative_price, price_source_level } = selectRepresentativePrice(
        totalBeforeTax,
        totalLowest,
        nightlyBeforeTax,
        nightlyLowest,
        lengthOfStay,
    );

    // Determine availability and confidence
    const { availability_status, data_confidence } = determineAvailability(
        representative_price,
        price_source_level,
    );

    return {
        source,
        availability_status,
        data_confidence,
        total_rate_lowest: totalLowest,
        total_rate_before_tax: totalBeforeTax,
        rate_per_night_lowest: nightlyLowest,
        rate_per_night_before_tax: nightlyBeforeTax,
        representative_price,
        price_source_level,
        is_official: price.official === true,
    };
}

// ──────────────────────────────────────────────────
// Representative Price Selection (4-level priority)
// ──────────────────────────────────────────────────

function selectRepresentativePrice(
    totalBeforeTax: number | null,
    totalLowest: number | null,
    nightlyBeforeTax: number | null,
    nightlyLowest: number | null,
    lengthOfStay: number,
): { representative_price: number | null; price_source_level: number } {
    // Level 1: total_rate_before_tax
    if (totalBeforeTax !== null && totalBeforeTax > 0) {
        return { representative_price: totalBeforeTax, price_source_level: 1 };
    }

    // Level 2: total_rate_lowest
    if (totalLowest !== null && totalLowest > 0) {
        return { representative_price: totalLowest, price_source_level: 2 };
    }

    // Level 3: rate_per_night_before_tax × LOS
    if (nightlyBeforeTax !== null && nightlyBeforeTax > 0) {
        return {
            representative_price: Math.round(nightlyBeforeTax * lengthOfStay),
            price_source_level: 3,
        };
    }

    // Level 4: rate_per_night_lowest × LOS
    if (nightlyLowest !== null && nightlyLowest > 0) {
        return {
            representative_price: Math.round(nightlyLowest * lengthOfStay),
            price_source_level: 4,
        };
    }

    // No price found
    return { representative_price: null, price_source_level: 0 };
}

// ──────────────────────────────────────────────────
// Availability & Confidence
// ──────────────────────────────────────────────────

function determineAvailability(
    representativePrice: number | null,
    priceSourceLevel: number,
): { availability_status: AvailabilityStatus; data_confidence: DataConfidence } {
    if (representativePrice === null || priceSourceLevel === 0) {
        return {
            availability_status: AvailabilityStatus.NO_RATE,
            data_confidence: DataConfidence.LOW,
        };
    }

    // Level 1 (before_tax total) → highest confidence
    if (priceSourceLevel === 1) {
        return {
            availability_status: AvailabilityStatus.AVAILABLE,
            data_confidence: DataConfidence.HIGH,
        };
    }

    // Level 2 (total_lowest) → medium+ (tax included but no before_tax)
    if (priceSourceLevel === 2) {
        return {
            availability_status: AvailabilityStatus.AVAILABLE,
            data_confidence: DataConfidence.MED,
        };
    }

    // Level 3-4 (nightly × LOS) → medium (rounding risk)
    return {
        availability_status: AvailabilityStatus.AVAILABLE,
        data_confidence: DataConfidence.MED,
    };
}
