import { describe, it, expect } from 'vitest';
import { optimizePrice, type PriceOptimizerInput } from '../lib/engine/priceOptimizer';

// ─── Helpers ────────────────────────────────────────────────

const BASE_GUARDRAILS = { minRate: 500000, maxRate: 5000000, maxStepPct: 0.30 };

function makeInput(overrides: Partial<PriceOptimizerInput> = {}): PriceOptimizerInput {
    return {
        baseRate: 1000000,
        roomsOtb: 50,
        remainingDemand: 30,
        remainingSupply: 50,
        expectedCxl: 5,
        capacity: 100,
        seasonMultiplier: 1.0,
        guardrails: BASE_GUARDRAILS,
        confidence: 'high',
        ...overrides,
    };
}

// ─── Tests ──────────────────────────────────────────────────

describe('priceOptimizer: optimizePrice', () => {

    // ── Zone assignment ──────────────────────────────────────

    it('SURGE zone when demand >> supply', () => {
        // staying=50-5=45, net=20+5=25, new=min(120,25)=25, final=70
        // finalOcc=70/100=0.70, pressure=0.70/0.40=1.75 → STRONG
        // To get SURGE (≥2.0), need finalOcc≥0.80 → use higher OTB
        const result = optimizePrice(makeInput({
            roomsOtb: 70,
            remainingDemand: 120,
            remainingSupply: 30,
            expectedCxl: 5,
            capacity: 100,
            // staying=70-5=65, net=30+5=35, new=min(120,35)=35, final=100
            // finalOcc=100/100=1.0, pressure=1.0/0.40=2.5 → SURGE
        }));
        expect(result.zone).toBe('SURGE');
        expect(result.recommendedPrice).toBeGreaterThan(1000000);
    });

    it('STRONG zone when demand > supply', () => {
        const result = optimizePrice(makeInput({
            remainingDemand: 50,
            remainingSupply: 20,
            expectedCxl: 5,
            // pressure = 50 / 25 = 2.0 → STRONG/SURGE boundary
        }));
        expect(['SURGE', 'STRONG']).toContain(result.zone);
        expect(result.recommendedPrice).toBeGreaterThanOrEqual(1000000);
    });

    it('NORMAL zone when demand ≈ supply', () => {
        // staying=30-0=30, net=20+0=20, new=min(10,20)=10, final=40
        // finalOcc=40/100=0.40, pressure=0.40/0.40=1.0 → NORMAL (≥0.6, <1.2)
        const result = optimizePrice(makeInput({
            roomsOtb: 30,
            remainingDemand: 10,
            remainingSupply: 20,
            expectedCxl: 0,
            capacity: 100,
        }));
        expect(result.zone).toBe('NORMAL');
    });

    it('SOFT zone when demand < supply', () => {
        // staying=10-0=10, net=80+0=80, new=min(5,80)=5, final=15
        // finalOcc=15/100=0.15, pressure=0.15/0.40=0.375 → SOFT (≥0.25, <0.6)
        const result = optimizePrice(makeInput({
            roomsOtb: 10,
            remainingDemand: 5,
            remainingSupply: 80,
            expectedCxl: 0,
            capacity: 100,
        }));
        expect(result.zone).toBe('SOFT');
        expect(result.recommendedPrice).toBeLessThanOrEqual(1000000);
    });

    it('DISTRESS zone when very low demand', () => {
        // staying=5-0=5, net=90+0=90, new=min(2,90)=2, final=7
        // finalOcc=7/100=0.07, pressure=0.07/0.40=0.175 → DISTRESS (<0.25)
        const result = optimizePrice(makeInput({
            roomsOtb: 5,
            remainingDemand: 2,
            remainingSupply: 90,
            expectedCxl: 0,
            capacity: 100,
        }));
        expect(result.zone).toBe('DISTRESS');
        expect(result.recommendedPrice).toBeLessThan(900000);
    });

    // ── Multiplier ranges ────────────────────────────────────

    it('SURGE price increases 15-25%', () => {
        const result = optimizePrice(makeInput({
            remainingDemand: 200,
            remainingSupply: 30,
            expectedCxl: 10,
        }));
        expect(result.multiplier).toBeGreaterThanOrEqual(1.15);
        expect(result.multiplier).toBeLessThanOrEqual(1.25);
    });

    it('DISTRESS price decreases ~15%', () => {
        // staying=5-0=5, net=90+0=90, new=min(0,90)=0, final=5
        // finalOcc=5/100=0.05, pressure=0.05/0.40=0.125 → DISTRESS
        const result = optimizePrice(makeInput({
            roomsOtb: 5,
            remainingDemand: 0,
            remainingSupply: 90,
            expectedCxl: 0,
            capacity: 100,
        }));
        expect(result.multiplier).toBeLessThan(0.90);
    });

    // ── Guardrails ───────────────────────────────────────────

    it('price clamped to minRate', () => {
        const result = optimizePrice(makeInput({
            baseRate: 400000,
            guardrails: { minRate: 500000, maxRate: 5000000, maxStepPct: 1.0 },
            remainingDemand: 0,
            remainingSupply: 80,
            expectedCxl: 0,
        }));
        expect(result.recommendedPrice).toBeGreaterThanOrEqual(500000);
    });

    it('price clamped to maxRate', () => {
        const result = optimizePrice(makeInput({
            baseRate: 4000000,
            guardrails: { minRate: 500000, maxRate: 5000000, maxStepPct: 1.0 },
            remainingDemand: 200,
            remainingSupply: 10,
            expectedCxl: 5,
        }));
        expect(result.recommendedPrice).toBeLessThanOrEqual(5000000);
    });

    it('step change limited by maxStepPct', () => {
        const result = optimizePrice(makeInput({
            currentRate: 1000000,
            guardrails: { minRate: 500000, maxRate: 5000000, maxStepPct: 0.10 },
            remainingDemand: 200,
            remainingSupply: 10,
            expectedCxl: 5,
        }));
        // Max step = 10% × 1M = 100k. Price should be at most 1.1M
        expect(result.recommendedPrice).toBeLessThanOrEqual(1100000);
    });

    // ── Confidence dampening ─────────────────────────────────

    it('high confidence: full multiplier (no dampening)', () => {
        const result = optimizePrice(makeInput({ confidence: 'high' }));
        expect(result.confidenceAdjusted).toBe(false);
    });

    it('low confidence: dampened multiplier', () => {
        const high = optimizePrice(makeInput({ confidence: 'high' }));
        const low = optimizePrice(makeInput({ confidence: 'low' }));
        expect(low.confidenceAdjusted).toBe(true);
        // Low should be closer to base rate than high
        const highDiff = Math.abs(high.recommendedPrice - 1000000);
        const lowDiff = Math.abs(low.recommendedPrice - 1000000);
        expect(lowDiff).toBeLessThanOrEqual(highDiff);
    });

    it('fallback confidence: heavily dampened', () => {
        const result = optimizePrice(makeInput({ confidence: 'fallback' }));
        expect(result.confidenceAdjusted).toBe(true);
        // Should be very close to base × season
        expect(result.recommendedPrice).toBeGreaterThanOrEqual(950000);
        expect(result.recommendedPrice).toBeLessThanOrEqual(1050000);
    });

    // ── Season multiplier ────────────────────────────────────

    it('season multiplier applied correctly', () => {
        const normal = optimizePrice(makeInput({ seasonMultiplier: 1.0 }));
        const peak = optimizePrice(makeInput({ seasonMultiplier: 1.3 }));
        expect(peak.recommendedPrice).toBeGreaterThan(normal.recommendedPrice);
    });

    // ── Channel commission (C5) ──────────────────────────────

    it('net revenue calculated with commission', () => {
        const result = optimizePrice(makeInput({ channelCommission: 0.18 }));
        expect(result.expectedNetRevenue).not.toBeNull();
        expect(result.expectedNetRevenue!).toBeLessThan(result.expectedGrossRevenue);
        // Net = Gross × (1 - 0.18)
        expect(result.expectedNetRevenue!).toBe(Math.round(result.expectedGrossRevenue * 0.82));
    });

    it('no commission → null net revenue', () => {
        const result = optimizePrice(makeInput({}));
        expect(result.expectedNetRevenue).toBeNull();
    });

    // ── Comp set hook (C5) ───────────────────────────────────

    it('UNDERCUT comp position increases multiplier', () => {
        const base = optimizePrice(makeInput({ compPosition: null }));
        const undercut = optimizePrice(makeInput({ compPosition: 'UNDERCUT' }));
        expect(undercut.recommendedPrice).toBeGreaterThanOrEqual(base.recommendedPrice);
    });

    it('PREMIUM comp position decreases multiplier', () => {
        const base = optimizePrice(makeInput({ compPosition: null }));
        const premium = optimizePrice(makeInput({ compPosition: 'PREMIUM' }));
        expect(premium.recommendedPrice).toBeLessThanOrEqual(base.recommendedPrice);
    });

    // ── Revenue projections ──────────────────────────────────

    it('projectedOcc between 0 and 1', () => {
        const result = optimizePrice(makeInput());
        expect(result.projectedOcc).toBeGreaterThanOrEqual(0);
        expect(result.projectedOcc).toBeLessThanOrEqual(1);
    });

    it('expectedFinalRooms = (OTB - CXL) + min(demand, net)', () => {
        const result = optimizePrice(makeInput({
            roomsOtb: 60,
            remainingDemand: 20,
            remainingSupply: 40,
            expectedCxl: 5,
        }));
        // stay = 60 - 5 = 55, net = 40 + 5 = 45, new = min(20, 45) = 20
        // final = 55 + 20 = 75
        expect(result.expectedFinalRooms).toBe(75);
    });

    // ── Trace format ─────────────────────────────────────────

    it('trace contains key calculation steps', () => {
        const result = optimizePrice(makeInput());
        const traceStr = result.trace.join(' ');
        expect(traceStr).toContain('occ:');
        expect(traceStr).toContain('demand_pressure=');
        expect(traceStr).toContain('zone=');
        expect(traceStr).toContain('final_price=');
        expect(traceStr).toContain('final_rooms=');
    });
});
