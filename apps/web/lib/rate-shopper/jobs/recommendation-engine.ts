/**
 * Rate Shopper — Recommendation Engine
 *
 * Generates pricing recommendations from MarketSnapshot data.
 * Analyzes price_index, gap_pct, demand_strength, and confidence
 * to produce actionable suggestions.
 *
 * @see spec §3.3, MarketSnapshot model, RateShopRecommendation model
 */

import prisma from '@/lib/prisma';
import { OFFSET_DAYS } from '../constants';
import { getVNDate } from '../timezone';
import { roundVND } from '../rounding';

// ──────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────

export interface RecommendationInput {
    hotelId: string;
    snapshotDate?: string; // Defaults to today (VN)
}

export interface RecommendationOutput {
    totalGenerated: number;
    recommendations: GeneratedRecommendation[];
}

interface GeneratedRecommendation {
    checkInDate: string;
    currentRate: number | null;
    recommendedRate: number | null;
    deltaPct: number | null;
    reasonCodes: string[];
    confidence: string;
}

// ──────────────────────────────────────────────────
// Thresholds
// ──────────────────────────────────────────────────

/** If our rate is more than 15% above median, suggest lowering */
const OVERPRICED_THRESHOLD = 0.15;
/** If our rate is more than 15% below median, suggest raising */
const UNDERPRICED_THRESHOLD = -0.15;
/** Minimum comp_available_count to generate recommendation */
const MIN_COMPS_FOR_RECOMMENDATION = 2;
/** Demand strength → multiplier for recommended rate */
const DEMAND_MULTIPLIERS: Record<string, number> = {
    STRONG: 1.05,  // High demand → can price higher
    NORMAL: 1.00,
    WEAK: 0.95,    // Low demand → price more aggressively
};

// ──────────────────────────────────────────────────
// Main Engine
// ──────────────────────────────────────────────────

/**
 * Generate recommendations for a hotel based on latest snapshots.
 *
 * Rules:
 * 1. Fetch latest snapshots (is_latest=true) for all 5 offsets
 * 2. For each snapshot where my_rate exists and comp data is sufficient:
 *    a. Calculate position (overpriced / underpriced / competitive)
 *    b. Factor in demand_strength for suggested adjustment
 *    c. Generate reason codes for UI display
 * 3. Persist as RateShopRecommendation with status=PENDING
 */
export async function generateRecommendations(
    input: RecommendationInput,
): Promise<RecommendationOutput> {
    const { hotelId, snapshotDate = getVNDate() } = input;
    const recommendations: GeneratedRecommendation[] = [];

    // Fetch latest snapshots for this hotel
    const snapshots = await prisma.marketSnapshot.findMany({
        where: {
            hotel_id: hotelId,
            is_latest: true,
            snapshot_date: snapshotDate,
        },
        orderBy: { check_in_date: 'asc' },
    });

    for (const snap of snapshots) {
        // Skip if insufficient data
        if (snap.comp_available_count < MIN_COMPS_FOR_RECOMMENDATION) continue;
        if (!snap.comp_median) continue;

        const compMedian = Number(snap.comp_median);
        const myRate = snap.my_rate ? Number(snap.my_rate) : null;

        // Skip if no own rate to compare
        if (!myRate) continue;

        const gapPct = (myRate - compMedian) / compMedian;
        const demandMultiplier = DEMAND_MULTIPLIERS[snap.demand_strength] ?? 1.0;
        const reasonCodes: string[] = [];

        let recommendedRate: number | null = null;
        let deltaPct: number | null = null;

        if (gapPct > OVERPRICED_THRESHOLD) {
            // Overpriced: suggest moving toward median (adjusted for demand)
            const target = compMedian * demandMultiplier;
            recommendedRate = roundVND(target);
            deltaPct = Number(((recommendedRate - myRate) / myRate).toFixed(4));
            reasonCodes.push('OVERPRICED');

            if (snap.demand_strength === 'STRONG') {
                reasonCodes.push('HIGH_DEMAND_BUFFER');
            }
            if (snap.sold_out_count > 0) {
                reasonCodes.push('COMPETITORS_SOLD_OUT');
            }
        } else if (gapPct < UNDERPRICED_THRESHOLD) {
            // Underpriced: suggest raising toward median (adjusted for demand)
            const target = compMedian * demandMultiplier;
            recommendedRate = roundVND(target);
            deltaPct = Number(((recommendedRate - myRate) / myRate).toFixed(4));
            reasonCodes.push('UNDERPRICED');

            if (snap.demand_strength === 'WEAK') {
                reasonCodes.push('LOW_DEMAND_CAUTION');
            }
        } else {
            // Competitive: no strong recommendation
            reasonCodes.push('COMPETITIVE');
            continue; // Don't generate recommendation for competitive pricing
        }

        // Confidence from market_confidence
        const confidence = snap.market_confidence;

        recommendations.push({
            checkInDate: snap.check_in_date,
            currentRate: myRate,
            recommendedRate,
            deltaPct,
            reasonCodes,
            confidence,
        });

        // Persist to DB
        await prisma.rateShopRecommendation.create({
            data: {
                hotel_id: hotelId,
                check_in_date: snap.check_in_date,
                snapshot_date: snapshotDate,
                current_rate: myRate,
                recommended_rate: recommendedRate,
                delta_pct: deltaPct,
                reason_codes: reasonCodes,
                confidence: confidence as any,
                status: 'PENDING',
            },
        });
    }

    return {
        totalGenerated: recommendations.length,
        recommendations,
    };
}

// ──────────────────────────────────────────────────
// Recommendation Actions
// ──────────────────────────────────────────────────

/**
 * Accept a recommendation (mark as ACCEPTED).
 */
export async function acceptRecommendation(
    hotelId: string,
    recommendationId: string,
): Promise<void> {
    await prisma.rateShopRecommendation.update({
        where: { id: recommendationId, hotel_id: hotelId },
        data: { status: 'ACCEPTED' },
    });
}

/**
 * Reject a recommendation (mark as REJECTED).
 */
export async function rejectRecommendation(
    hotelId: string,
    recommendationId: string,
): Promise<void> {
    await prisma.rateShopRecommendation.update({
        where: { id: recommendationId, hotel_id: hotelId },
        data: { status: 'REJECTED' },
    });
}

/**
 * Get pending recommendations for a hotel.
 */
export async function getPendingRecommendations(hotelId: string) {
    return prisma.rateShopRecommendation.findMany({
        where: { hotel_id: hotelId, status: 'PENDING' },
        orderBy: { check_in_date: 'asc' },
    });
}
