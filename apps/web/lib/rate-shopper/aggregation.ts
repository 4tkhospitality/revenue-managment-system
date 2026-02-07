/**
 * Rate Shopper — Aggregation Service
 *
 * Builds market aggregates from CompetitorRates for snapshots.
 * Implements confidence scoring with before_tax_ratio.
 *
 * @see spec §9.5, Key Decision #11, #13
 */

import type {
    AggregationResult,
    ParsedCompetitorRate,
} from './types';
import { DataConfidence, AvailabilityStatus, DemandStrength } from './types';
import {
    MIN_COMPS_HIGH,
    MIN_SOURCES_HIGH,
    MIN_BEFORE_TAX_RATIO_HIGH,
} from './constants';
import { roundVND, medianVND } from './rounding';
import { countUniqueSources } from './source-normalizer';

/**
 * Aggregate parsed rates into a market snapshot summary.
 *
 * @param rates - Parsed competitor rates for a single check-in date
 * @param beforeTaxRatio - Ratio of sources providing before_tax prices
 * @returns Aggregation with min/max/avg/median, demand, confidence
 */
export function aggregateRates(
    rates: ParsedCompetitorRate[],
    beforeTaxRatio: number,
): AggregationResult {
    const available = rates.filter(
        (r) => r.availability_status === AvailabilityStatus.AVAILABLE && r.representative_price !== null,
    );
    const soldOut = rates.filter(
        (r) => r.availability_status === AvailabilityStatus.SOLD_OUT,
    );
    const noRate = rates.filter(
        (r) => r.availability_status === AvailabilityStatus.NO_RATE,
    );

    // Prices for aggregation
    const prices = available
        .map((r) => r.representative_price!)
        .filter((p) => p > 0)
        .sort((a, b) => a - b);

    // Aggregates
    const comp_min = prices.length > 0 ? prices[0] : null;
    const comp_max = prices.length > 0 ? prices[prices.length - 1] : null;
    const comp_avg =
        prices.length > 0
            ? roundVND(prices.reduce((sum, p) => sum + p, 0) / prices.length)
            : null;
    const comp_median = medianVND(prices);

    // Demand strength (sold_out ratio)
    const demand_strength = determineDemandStrength(
        soldOut.length,
        rates.length,
    );

    // Market confidence with before_tax_ratio
    const market_confidence = determineConfidence(
        available.length,
        rates.map((r) => r.source),
        beforeTaxRatio,
    );

    return {
        comp_min,
        comp_max,
        comp_avg,
        comp_median,
        comp_available_count: available.length,
        sold_out_count: soldOut.length,
        no_rate_count: noRate.length,
        demand_strength,
        market_confidence,
        before_tax_ratio: beforeTaxRatio,
    };
}

// ──────────────────────────────────────────────────
// Confidence Determination
// ──────────────────────────────────────────────────

function determineConfidence(
    availableCount: number,
    sources: string[],
    beforeTaxRatio: number,
): DataConfidence {
    const uniqueSources = countUniqueSources(sources);

    // HIGH: ≥3 comps + ≥2 sources + before_tax_ratio ≥ 60%
    if (
        availableCount >= MIN_COMPS_HIGH &&
        uniqueSources >= MIN_SOURCES_HIGH &&
        beforeTaxRatio >= MIN_BEFORE_TAX_RATIO_HIGH
    ) {
        return DataConfidence.HIGH;
    }

    // MED: ≥2 comps + ≥1 source
    if (availableCount >= 2 && uniqueSources >= 1) {
        return DataConfidence.MED;
    }

    return DataConfidence.LOW;
}

// ──────────────────────────────────────────────────
// Demand Strength
// ──────────────────────────────────────────────────

function determineDemandStrength(
    soldOutCount: number,
    totalCount: number,
): DemandStrength {
    if (totalCount === 0) return DemandStrength.NORMAL;

    const soldOutRatio = soldOutCount / totalCount;

    if (soldOutRatio >= 0.5) return DemandStrength.STRONG;
    if (soldOutRatio >= 0.2) return DemandStrength.NORMAL;
    return DemandStrength.WEAK;
}
