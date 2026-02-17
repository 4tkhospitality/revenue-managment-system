/**
 * Analytics Layer P2: Price Optimization Engine
 *
 * Pure function, zero DB calls, fully testable.
 *
 * Uses remaining_demand + net_remaining to compute demand pressure,
 * then applies piecewise-linear zone interpolation for price multiplier.
 *
 * Fixed per BA review (C5):
 *   - Net lens: channel commission deducted for RevPAR net
 *   - Comp set hook: prepared for Rate Shopper integration
 *   - Recalibrated demand pressure zones
 *   - Confidence dampening for low-quality forecasts
 */

import type { ForecastConfidence } from './demandModelV03';

// ── Types ───────────────────────────────────────────────────

export type PriceZone = 'SURGE' | 'STRONG' | 'NORMAL' | 'SOFT' | 'DISTRESS';
export type CompPosition = 'UNDERCUT' | 'MATCH' | 'PREMIUM' | null;

export interface PriceOptimizerInput {
    baseRate: number;
    roomsOtb: number;
    remainingDemand: number;
    remainingSupply: number;
    expectedCxl: number;
    capacity: number;
    seasonMultiplier: number;
    guardrails: {
        minRate: number;
        maxRate: number;
        maxStepPct: number; // max % change from current rate
    };
    currentRate?: number;
    confidence: ForecastConfidence;
    channelCommission?: number;   // C5: 0-1 fraction (e.g., 0.18 = 18%)
    compPosition?: CompPosition;  // C5: comp set hook
}

export interface PriceOptimizerResult {
    recommendedPrice: number;
    multiplier: number;
    zone: PriceZone;
    expectedFinalRooms: number;
    projectedOcc: number;
    currentOcc: number;          // P0: roomsOtb / capacity (for UI display)
    expectedGrossRevenue: number;
    expectedNetRevenue: number | null;
    upliftPct: number;
    trace: string[];
    confidenceAdjusted: boolean;
    cxlClipped: boolean;         // P0-3: true if expectedCxl was capped
}

// ── Zone Interpolation Curve (recalibrated) ─────────────────

const PRESSURE_CURVE = [
    { pressure: 0.0, mult: 0.85 },
    { pressure: 0.25, mult: 0.90 },
    { pressure: 0.60, mult: 0.95 },
    { pressure: 1.20, mult: 1.00 },
    { pressure: 2.00, mult: 1.15 },
    { pressure: 3.00, mult: 1.25 },
];

function interpolateMultiplier(pressure: number): number {
    if (pressure <= PRESSURE_CURVE[0].pressure) return PRESSURE_CURVE[0].mult;
    if (pressure >= PRESSURE_CURVE[PRESSURE_CURVE.length - 1].pressure) {
        return PRESSURE_CURVE[PRESSURE_CURVE.length - 1].mult;
    }
    for (let i = 0; i < PRESSURE_CURVE.length - 1; i++) {
        const lo = PRESSURE_CURVE[i];
        const hi = PRESSURE_CURVE[i + 1];
        if (pressure >= lo.pressure && pressure <= hi.pressure) {
            const t = (pressure - lo.pressure) / (hi.pressure - lo.pressure);
            return lo.mult + t * (hi.mult - lo.mult);
        }
    }
    return 1.0; // fallback — should never reach
}

function getZone(pressure: number): PriceZone {
    if (pressure >= 2.0) return 'SURGE';
    if (pressure >= 1.2) return 'STRONG';
    if (pressure >= 0.6) return 'NORMAL';
    if (pressure >= 0.25) return 'SOFT';
    return 'DISTRESS';
}

// ── Confidence Dampening ────────────────────────────────────

function dampenMultiplier(mult: number, confidence: ForecastConfidence): { dampened: number; adjusted: boolean } {
    // Dampen multiplier toward 1.0 based on confidence
    switch (confidence) {
        case 'high':
        case 'medium':
            return { dampened: mult, adjusted: false };
        case 'low':
            // 50% dampening toward 1.0
            return { dampened: 1.0 + (mult - 1.0) * 0.5, adjusted: true };
        case 'fallback':
            // 75% dampening (nearly neutral)
            return { dampened: 1.0 + (mult - 1.0) * 0.25, adjusted: true };
    }
}

// ── Core Function ───────────────────────────────────────────

export function optimizePrice(input: PriceOptimizerInput): PriceOptimizerResult {
    const trace: string[] = [];
    const {
        baseRate, roomsOtb, remainingDemand, remainingSupply,
        expectedCxl, capacity, seasonMultiplier, guardrails,
        currentRate, confidence, channelCommission, compPosition,
    } = input;

    // ── P0-3: Cap expectedCxl — never allow unreasonable cancellation forecast ──
    const MAX_CXL_RATIO = 0.7; // max 70% of OTB can cancel
    const clippedCxl = Math.min(expectedCxl, Math.round(roomsOtb * MAX_CXL_RATIO));
    const cxlClipped = clippedCxl < expectedCxl;
    if (cxlClipped) {
        trace.push(`cxl_clip: ${expectedCxl} → ${clippedCxl} (cap ${MAX_CXL_RATIO * 100}% of OTB=${roomsOtb})`);
    }

    // ── P0-1: Pressure based on Expected Final Occupancy (EFO) ──
    // Step 1: Compute final occupancy components
    const roomsStaying = Math.max(0, roomsOtb - clippedCxl);
    const netRemaining = remainingSupply + clippedCxl;
    const expectedNewBookings = Math.min(remainingDemand, Math.max(0, netRemaining));
    const expectedFinalRooms = roomsStaying + expectedNewBookings;
    const currentOcc = capacity > 0 ? roomsOtb / capacity : 0;
    const finalOcc = capacity > 0 ? expectedFinalRooms / capacity : 0;
    trace.push(`occ: current=${(currentOcc * 100).toFixed(1)}%, final=${(finalOcc * 100).toFixed(1)}% (staying=${roomsStaying} + new=${expectedNewBookings}, cxl=${clippedCxl})`);

    // Step 2: Demand pressure from finalOcc, not remainingDemand/netRemaining
    // occ_breakpoint = 0.40 (NORMAL zone starts here)
    // pressure = clamp(finalOcc / breakpoint, 0, 2.5)
    const OCC_BREAKPOINT = 0.40;
    const demandPressure = Math.min(2.5, Math.max(0, finalOcc / OCC_BREAKPOINT));
    trace.push(`demand_pressure=${demandPressure.toFixed(3)} (finalOcc=${(finalOcc * 100).toFixed(1)}% / breakpoint=${OCC_BREAKPOINT * 100}%)`);

    // Step 3: Zone + raw multiplier
    const zone = getZone(demandPressure);
    let rawMult = interpolateMultiplier(demandPressure);
    trace.push(`zone=${zone}, raw_mult=${rawMult.toFixed(3)}`);

    // Step 4: Comp set adjustment (C5 hook)
    if (compPosition === 'UNDERCUT') {
        rawMult *= 1.03;
        trace.push(`comp_adj: UNDERCUT → ×1.03 = ${rawMult.toFixed(3)}`);
    } else if (compPosition === 'PREMIUM') {
        rawMult *= 0.98;
        trace.push(`comp_adj: PREMIUM → ×0.98 = ${rawMult.toFixed(3)}`);
    }

    // Step 5: Confidence dampening
    // P0-3: Also dampen if expectedCxl was clipped (unreliable forecast)
    const effectiveConfidence = cxlClipped ? 'low' as ForecastConfidence : confidence;
    const { dampened, adjusted } = dampenMultiplier(rawMult, effectiveConfidence);
    if (adjusted) {
        trace.push(`confidence_dampen: ${effectiveConfidence}${cxlClipped ? ' (cxl clipped)' : ''} → ${rawMult.toFixed(3)} → ${dampened.toFixed(3)}`);
    }

    // ── P0-2: Anchor-centric pricing ──
    // Price = anchorRate × multiplier (not baseRate × mult × season)
    // anchorRate = currentRate (last accepted/published) or rack rate (base × season)
    // Season is already baked into anchor, so we don't multiply again
    const anchorRate = currentRate || Math.round(baseRate * seasonMultiplier);
    let recommendedPrice = Math.round(anchorRate * dampened);
    trace.push(`price = anchor(${anchorRate}) × ${dampened.toFixed(3)} = ${recommendedPrice}`);

    // Step 7: Guardrails
    recommendedPrice = Math.max(guardrails.minRate, Math.min(guardrails.maxRate, recommendedPrice));
    if (currentRate && guardrails.maxStepPct > 0) {
        const maxStep = Math.round(currentRate * guardrails.maxStepPct);
        const floor = currentRate - maxStep;
        const ceiling = currentRate + maxStep;
        recommendedPrice = Math.max(floor, Math.min(ceiling, recommendedPrice));
        trace.push(`guardrail: step_clamp [${floor}, ${ceiling}]`);
    }
    trace.push(`final_price=${recommendedPrice} (min=${guardrails.minRate}, max=${guardrails.maxRate})`);

    // Step 8: Revenue projections
    const projectedOcc = finalOcc; // already computed above
    const expectedGrossRevenue = recommendedPrice * expectedFinalRooms;
    const currentRevenue = (currentRate || anchorRate) * roomsOtb;
    const upliftPct = currentRevenue > 0 ? (expectedGrossRevenue - currentRevenue) / currentRevenue : 0;
    trace.push(`final_rooms=${expectedFinalRooms}, projected_occ=${(projectedOcc * 100).toFixed(1)}%, current_occ=${(currentOcc * 100).toFixed(1)}%`);

    // C5: Net revenue
    let expectedNetRevenue: number | null = null;
    if (channelCommission != null) {
        expectedNetRevenue = Math.round(expectedGrossRevenue * (1 - channelCommission));
        trace.push(`net_revenue=${expectedNetRevenue} (comm=${(channelCommission * 100).toFixed(1)}%)`);
    }

    return {
        recommendedPrice,
        multiplier: dampened,
        zone,
        expectedFinalRooms,
        projectedOcc,
        currentOcc,
        expectedGrossRevenue,
        expectedNetRevenue,
        upliftPct,
        trace,
        confidenceAdjusted: adjusted,
        cxlClipped,
    };
}
