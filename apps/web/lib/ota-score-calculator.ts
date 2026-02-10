export interface OTAMetrics {
    booking: {
        ctr: number; // %
        conversion: number; // %
        priceQuality: number; // 1-10
        cancellationRate: number; // %
        netBookingGrowth: number; // %
        paceVsStly: number; // %
        contentScore: number; // %
        checklistCompletion: number; // % (Auto)
    };
    agoda: {
        contentScore: number; // %
        ctr: number; // %
        conversion: number; // %
        priceCompetitiveness: number; // 1-10
        reviewScore: number; // 1-10
        cancellationRate: number; // %
        checklistCompletion: number; // % (Auto)
        programParticipation: boolean; // Yes/No
    };
}

export interface Scoreresult {
    totalBoxScore: number; // 0-100
    breakdown: Record<string, number>; // metric key -> weighted score
    gap: number; // vs previous period (if available)
    grade: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    color: string;
}

// Weights defined in Phase 02 Spec
const BOOKING_WEIGHTS = {
    ctr: 0.15,
    conversion: 0.15,
    priceQuality: 0.15,
    cancellationRate: 0.10,
    netBookingGrowth: 0.10,
    paceVsStly: 0.10,
    contentScore: 0.15,
    checklistCompletion: 0.10,
};

const AGODA_WEIGHTS = {
    contentScore: 0.25,
    ctr: 0.10,
    conversion: 0.10,
    priceCompetitiveness: 0.15,
    reviewScore: 0.15,
    cancellationRate: 0.10,
    checklistCompletion: 0.10,
    programParticipation: 0.05,
};

/**
 * Calculate Booking.com Health Score
 */
export function calculateBookingScore(metrics: OTAMetrics['booking']): Scoreresult {
    let totalScore = 0;
    const breakdown: Record<string, number> = {};

    // 1. CTR (Target: 4% -> 100pts)
    // Normalized: 0% = 0, 4% = 100
    const scoreCTR = Math.min(100, (metrics.ctr / 4) * 100);
    totalScore += scoreCTR * BOOKING_WEIGHTS.ctr;
    breakdown.ctr = scoreCTR * BOOKING_WEIGHTS.ctr;

    // 2. Conversion (Target: 3% -> 100pts)
    const scoreConv = Math.min(100, (metrics.conversion / 3) * 100);
    totalScore += scoreConv * BOOKING_WEIGHTS.conversion;
    breakdown.conversion = scoreConv * BOOKING_WEIGHTS.conversion;

    // 3. Price Quality (1-10 -> 10-100)
    const scorePrice = metrics.priceQuality * 10;
    totalScore += scorePrice * BOOKING_WEIGHTS.priceQuality;
    breakdown.priceQuality = scorePrice * BOOKING_WEIGHTS.priceQuality;

    // 4. Cancellation (Target: <20% -> 100pts, >50% -> 0pts)
    // Inverted metric
    const scoreCancel = Math.max(0, Math.min(100, 100 - ((metrics.cancellationRate - 20) / 30 * 100)));
    totalScore += scoreCancel * BOOKING_WEIGHTS.cancellationRate;
    breakdown.cancellationRate = scoreCancel * BOOKING_WEIGHTS.cancellationRate;

    // 5. Net Booking Growth (Target: >10% -> 100pts, <0% -> 0pts)
    const scoreNet = Math.max(0, Math.min(100, (metrics.netBookingGrowth + 10) / 20 * 100)); // Map -10..10 to 0..100? No, let's say 0% growth = 50pts, 10% = 100pts
    // Simpler: Target 10% growth.
    const scoreNetFinal = Math.max(0, Math.min(100, (metrics.netBookingGrowth > 0 ? 50 + metrics.netBookingGrowth * 5 : 50 + metrics.netBookingGrowth * 2)));
    totalScore += scoreNetFinal * BOOKING_WEIGHTS.netBookingGrowth;
    breakdown.netBookingGrowth = scoreNetFinal * BOOKING_WEIGHTS.netBookingGrowth;

    // 6. Pace vs STLY (Target: >0% -> 100pts)
    // 0% = 50pts, +10% = 100pts, -10% = 0pts
    const scorePace = Math.max(0, Math.min(100, 50 + metrics.paceVsStly * 5));
    totalScore += scorePace * BOOKING_WEIGHTS.paceVsStly;
    breakdown.paceVsStly = scorePace * BOOKING_WEIGHTS.paceVsStly;

    // 7. Content Score (0-100 -> 0-100)
    totalScore += metrics.contentScore * BOOKING_WEIGHTS.contentScore;
    breakdown.contentScore = metrics.contentScore * BOOKING_WEIGHTS.contentScore;

    // 8. Checklist Completion (0-100 -> 0-100)
    totalScore += metrics.checklistCompletion * BOOKING_WEIGHTS.checklistCompletion;
    breakdown.checklistCompletion = metrics.checklistCompletion * BOOKING_WEIGHTS.checklistCompletion;

    const grade = getGrade(totalScore);
    return {
        totalBoxScore: Math.round(totalScore),
        breakdown,
        gap: 0, // Calculated in UI comparing to prev month
        grade: grade.grade,
        color: grade.color,
    };
}

/**
 * Calculate Agoda Health Score
 */
export function calculateAgodaScore(metrics: OTAMetrics['agoda']): Scoreresult {
    let totalScore = 0;
    const breakdown: Record<string, number> = {};

    // 1. Content Score (0-100)
    totalScore += metrics.contentScore * AGODA_WEIGHTS.contentScore;
    breakdown.contentScore = metrics.contentScore * AGODA_WEIGHTS.contentScore;

    // 2. CTR (Target 4%)
    const scoreCTR = Math.min(100, (metrics.ctr / 4) * 100);
    totalScore += scoreCTR * AGODA_WEIGHTS.ctr;
    breakdown.ctr = scoreCTR * AGODA_WEIGHTS.ctr;

    // 3. Conversion (Target 3%)
    const scoreConv = Math.min(100, (metrics.conversion / 3) * 100);
    totalScore += scoreConv * AGODA_WEIGHTS.conversion;
    breakdown.conversion = scoreConv * AGODA_WEIGHTS.conversion;

    // 4. Price Competitiveness (1-10)
    const scorePrice = metrics.priceCompetitiveness * 10;
    totalScore += scorePrice * AGODA_WEIGHTS.priceCompetitiveness;
    breakdown.priceCompetitiveness = scorePrice * AGODA_WEIGHTS.priceCompetitiveness;

    // 5. Review Score (1-10)
    // Agoda users imply 8.0 is good. Map 8.0 -> 80pts?
    // Let's just use raw * 10.
    const scoreReview = metrics.reviewScore * 10;
    totalScore += scoreReview * AGODA_WEIGHTS.reviewScore;
    breakdown.reviewScore = scoreReview * AGODA_WEIGHTS.reviewScore;

    // 6. Cancellation (Target <20%)
    const scoreCancel = Math.max(0, Math.min(100, 100 - ((metrics.cancellationRate - 20) / 30 * 100)));
    totalScore += scoreCancel * AGODA_WEIGHTS.cancellationRate;
    breakdown.cancellationRate = scoreCancel * AGODA_WEIGHTS.cancellationRate;

    // 7. Checklist (0-100)
    totalScore += metrics.checklistCompletion * AGODA_WEIGHTS.checklistCompletion;
    breakdown.checklistCompletion = metrics.checklistCompletion * AGODA_WEIGHTS.checklistCompletion;

    // 8. Program Participation (Yes=100, No=0)
    const scoreProg = metrics.programParticipation ? 100 : 0;
    totalScore += scoreProg * AGODA_WEIGHTS.programParticipation;
    breakdown.programParticipation = scoreProg * AGODA_WEIGHTS.programParticipation;

    const grade = getGrade(totalScore);
    return {
        totalBoxScore: Math.round(totalScore),
        breakdown,
        gap: 0,
        grade: grade.grade,
        color: grade.color,
    };
}

function getGrade(score: number): { grade: Scoreresult['grade']; color: string } {
    if (score >= 90) return { grade: 'Excellent', color: 'text-emerald-600' };
    if (score >= 75) return { grade: 'Good', color: 'text-blue-600' };
    if (score >= 50) return { grade: 'Fair', color: 'text-amber-600' };
    return { grade: 'Poor', color: 'text-red-600' };
}
