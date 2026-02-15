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
    expectedGrossRevenue: number;
    expectedNetRevenue: number | null;
    upliftPct: number;
    trace: string[];
    confidenceAdjusted: boolean;
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

    // Step 1: Net remaining (supply + expected CXL rooms)
    const netRemaining = remainingSupply + expectedCxl;
    trace.push(`net_remaining=${netRemaining} (supply=${remainingSupply} + cxl=${expectedCxl})`);

    // Step 2: Demand pressure
    const demandPressure = netRemaining > 0 ? remainingDemand / netRemaining : (remainingDemand > 0 ? 3.0 : 0);
    trace.push(`demand_pressure=${demandPressure.toFixed(3)} (demand=${remainingDemand} / net=${netRemaining})`);

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
    const { dampened, adjusted } = dampenMultiplier(rawMult, confidence);
    if (adjusted) {
        trace.push(`confidence_dampen: ${confidence} → ${rawMult.toFixed(3)} → ${dampened.toFixed(3)}`);
    }

    // Step 6: Apply season + compute price
    const multiplier = dampened * seasonMultiplier;
    let recommendedPrice = Math.round(baseRate * multiplier);
    trace.push(`price = ${baseRate} × ${dampened.toFixed(3)} × season(${seasonMultiplier}) = ${recommendedPrice}`);

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

    // Step 8: Revenue projections (FIX #3 — no double-count)
    const roomsStaying = Math.max(0, roomsOtb - expectedCxl);       // rooms that WILL stay
    const newBookings = Math.min(remainingDemand, netRemaining);     // new bookings capped by supply
    const expectedFinalRooms = roomsStaying + newBookings;
    const projectedOcc = capacity > 0 ? expectedFinalRooms / capacity : 0;
    const expectedGrossRevenue = recommendedPrice * expectedFinalRooms;
    const currentRevenue = (currentRate || baseRate) * roomsOtb;
    const upliftPct = currentRevenue > 0 ? (expectedGrossRevenue - currentRevenue) / currentRevenue : 0;
    trace.push(`final_rooms=${expectedFinalRooms} (stay=${roomsStaying}+new=${newBookings}), occ=${(projectedOcc * 100).toFixed(1)}%`);

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
        expectedGrossRevenue,
        expectedNetRevenue,
        upliftPct,
        trace,
        confidenceAdjusted: adjusted,
    };
}
