/**
 * Analytics Layer P1: Cancel Forecast Engine (Pure Functions)
 * 
 * Pure functions for cancel rate statistics — no DB calls, fully testable.
 * 
 * Terminology (P1 canonical):
 *   - booking_lead_days = arrival_date - book_time (stats bucketing dimension)
 *   - days_to_stay = stayDate - asOfDate (runtime lookup dimension)
 */

// ─── Types ──────────────────────────────────────────────────

export interface CancelRateBucket {
    hotel_id: string;
    booking_lead_bucket: string;  // '0-3d' | '4-7d' | '8-14d' | '15-30d' | '31-60d' | '61d+'
    dow: number;                  // 0-6 (Sun-Sat)
    season_label: string;         // 'peak' | 'shoulder' | 'off_peak' | 'default'
    segment: string;              // 'OTA' | 'AGENT' | 'DIRECT' | 'UNKNOWN' | 'ALL'
    cancel_rate: number;          // 0.0 - 0.8 (smoothed + clamped)
    raw_rate: number;
    total_rooms: number;
    cancelled_rooms: number;
    confidence: 'high' | 'medium' | 'low';
    mapping_version: string;
}

export interface SeasonDateRange {
    code: string;    // 'NORMAL', 'HIGH', 'HOLIDAY'
    label: string;   // mapped: 'off_peak', 'shoulder', 'peak'
    start: string;   // 'MM-DD'
    end: string;     // 'MM-DD'
    priority: number;
}

export interface CancelForecastResult {
    expectedCxl: number;
    rate: number;
    confidence: 'high' | 'medium' | 'low' | 'fallback';
    bucket_used: string;    // which bucket was matched
    fallback_level: number; // 0=exact, 1=any_segment, 2=any_season, 3=any_dow, 4=global, 5=default
}

// ─── Constants ──────────────────────────────────────────────

const LEAD_BUCKETS = ['0-3d', '4-7d', '8-14d', '15-30d', '31-60d', '61d+'] as const;
const PRIOR_WEIGHT = 20;
const MIN_RATE = 0;
const MAX_RATE = 0.8;
const DEFAULT_CANCEL_RATE = 0.15; // Global fallback if no data at all

// Confidence thresholds (rooms-based)
const CONFIDENCE_HIGH = 200;
const CONFIDENCE_MEDIUM = 50;

// Season code → label mapping
const SEASON_CODE_TO_LABEL: Record<string, string> = {
    'HOLIDAY': 'peak',
    'HIGH': 'shoulder',
    'NORMAL': 'off_peak',
};

// ─── Pure Functions ─────────────────────────────────────────

/**
 * Map days count to booking_lead_bucket string.
 */
export function daysToLeadBucket(days: number): string {
    if (days <= 3) return '0-3d';
    if (days <= 7) return '4-7d';
    if (days <= 14) return '8-14d';
    if (days <= 30) return '15-30d';
    if (days <= 60) return '31-60d';
    return '61d+';
}

/**
 * Bayesian smoothing: blend bucket rate with parent rate.
 * Formula: blended = (rate * N + parentRate * PRIOR_WEIGHT) / (N + PRIOR_WEIGHT)
 * Then clamp to [MIN_RATE, MAX_RATE].
 */
export function smoothRate(
    rawRate: number,
    sampleSize: number,
    parentRate: number,
    priorWeight: number = PRIOR_WEIGHT
): number {
    if (sampleSize === 0) return clampRate(parentRate);
    const blended = (rawRate * sampleSize + parentRate * priorWeight) / (sampleSize + priorWeight);
    return clampRate(blended);
}

/**
 * Clamp rate to [0, 0.8] range.
 */
export function clampRate(rate: number): number {
    return Math.max(MIN_RATE, Math.min(MAX_RATE, rate));
}

/**
 * Determine confidence level based on total_rooms count.
 */
export function getConfidence(totalRooms: number): 'high' | 'medium' | 'low' {
    if (totalRooms >= CONFIDENCE_HIGH) return 'high';
    if (totalRooms >= CONFIDENCE_MEDIUM) return 'medium';
    return 'low';
}

/**
 * Determine season label for a given date using hotel's season configs.
 * Picks highest-priority matching season; defaults to 'default'.
 */
export function getSeasonLabel(
    date: Date,
    seasons: SeasonDateRange[]
): string {
    if (!seasons.length) return 'default';

    const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    let bestMatch: SeasonDateRange | null = null;

    for (const season of seasons) {
        if (isDateInRange(mmdd, season.start, season.end)) {
            if (!bestMatch || season.priority > bestMatch.priority) {
                bestMatch = season;
            }
        }
    }

    return bestMatch ? bestMatch.label : 'default';
}

/**
 * Check if MM-DD date falls in a range (handles wrap-around for ranges crossing year boundary).
 */
function isDateInRange(mmdd: string, start: string, end: string): boolean {
    if (start <= end) {
        return mmdd >= start && mmdd <= end;
    }
    // Wrap-around (e.g. 11-01 to 02-28)
    return mmdd >= start || mmdd <= end;
}

/**
 * Map SeasonConfig code to cancel-stats label.
 */
export function seasonCodeToLabel(code: string): string {
    return SEASON_CODE_TO_LABEL[code.toUpperCase()] || 'off_peak';
}

/**
 * Core function: Get expected cancel rooms for a given stay_date.
 * 
 * Uses days_to_stay (stayDate - asOfDate) for runtime bucket lookup,
 * NOT booking_lead_days (which is used only at stats-building time).
 * 
 * Fallback hierarchy (5 levels):
 *   0. Exact match: lead_bucket + DOW + season + segment
 *   1. Any segment (ALL): lead_bucket + DOW + season + ALL
 *   2. Any season (default): lead_bucket + DOW + default + segment
 *   3. Any DOW (-1): lead_bucket + -1 + default + ALL
 *   4. Global: hotel-wide average
 *   5. Hard default: 15%
 */
export function getExpectedCancelRooms(
    stayDate: Date,
    asOfDate: Date,
    roomsOtb: number,
    segment: string,
    stats: CancelRateBucket[],
    seasons: SeasonDateRange[]
): CancelForecastResult {
    if (roomsOtb <= 0) {
        return {
            expectedCxl: 0,
            rate: 0,
            confidence: 'high',
            bucket_used: 'zero_rooms',
            fallback_level: 0,
        };
    }

    // Compute days_to_stay (runtime dimension)
    const diffMs = stayDate.getTime() - asOfDate.getTime();
    const daysToStay = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    // Map to closest booking_lead_bucket for lookup
    const leadBucket = daysToLeadBucket(daysToStay);

    // DOW of the stay_date
    const dow = stayDate.getDay(); // 0=Sun

    // Season of the stay_date
    const seasonLabel = getSeasonLabel(stayDate, seasons);

    // Fallback chain
    const lookups: Array<{
        lead: string; dow: number; season: string; segment: string; level: number;
    }> = [
            { lead: leadBucket, dow, season: seasonLabel, segment, level: 0 },
            { lead: leadBucket, dow, season: seasonLabel, segment: 'ALL', level: 1 },
            { lead: leadBucket, dow, season: 'default', segment, level: 2 },
            { lead: leadBucket, dow: -1, season: 'default', segment: 'ALL', level: 3 },
        ];

    for (const lookup of lookups) {
        const match = stats.find(s =>
            s.booking_lead_bucket === lookup.lead &&
            (lookup.dow === -1 || s.dow === lookup.dow) &&
            s.season_label === lookup.season &&
            s.segment === lookup.segment
        );

        if (match) {
            const expectedCxl = Math.min(roomsOtb, Math.round(roomsOtb * match.cancel_rate));
            return {
                expectedCxl,
                rate: match.cancel_rate,
                confidence: match.confidence,
                bucket_used: `${lookup.lead}|dow=${lookup.dow}|${lookup.season}|${lookup.segment}`,
                fallback_level: lookup.level,
            };
        }
    }

    // Level 4: Global hotel average across all stats
    if (stats.length > 0) {
        const totalRooms = stats.reduce((s, b) => s + b.total_rooms, 0);
        const totalCxl = stats.reduce((s, b) => s + b.cancelled_rooms, 0);
        const globalRate = totalRooms > 0 ? clampRate(totalCxl / totalRooms) : DEFAULT_CANCEL_RATE;
        const expectedCxl = Math.min(roomsOtb, Math.round(roomsOtb * globalRate));
        return {
            expectedCxl,
            rate: globalRate,
            confidence: 'low',
            bucket_used: 'global_avg',
            fallback_level: 4,
        };
    }

    // Level 5: Hard default
    const expectedCxl = Math.min(roomsOtb, Math.round(roomsOtb * DEFAULT_CANCEL_RATE));
    return {
        expectedCxl,
        rate: DEFAULT_CANCEL_RATE,
        confidence: 'fallback',
        bucket_used: 'hard_default_15pct',
        fallback_level: 5,
    };
}
