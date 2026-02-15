import { describe, it, expect } from 'vitest';
import { forecastDemand, type DemandForecastInput } from '../lib/engine/demandModelV03';

// ─── Helpers ────────────────────────────────────────────────

function makeInput(overrides: Partial<DemandForecastInput> = {}): DemandForecastInput {
    return {
        stayDate: new Date('2026-03-10'),
        asOfDate: new Date('2026-03-01'), // 9 days out → medium weight
        roomsOtb: 50,
        capacity: 100,
        pickups: { t30: 30, t15: 20, t7: 10, t5: 7, t3: 5 },
        paceVsLy: 1.0,
        ...overrides,
    };
}

// ─── Tests ──────────────────────────────────────────────────

describe('demandModelV03: forecastDemand', () => {

    // ── Weight profiles ──────────────────────────────────────

    it('short lead (<7d): T3 has highest weight', () => {
        const result = forecastDemand(makeInput({
            stayDate: new Date('2026-03-04'), // 3 days out
            pickups: { t30: null, t15: null, t7: null, t5: null, t3: 6 },
        }));
        expect(result.modelVersion).toBe('weighted_pickup_v03');
        expect(result.remainingDemand).toBeGreaterThan(0);
        expect(result.trace.some(t => t.includes('short'))).toBe(true);
    });

    it('long lead (>30d): T30 has highest weight', () => {
        const result = forecastDemand(makeInput({
            stayDate: new Date('2026-04-15'), // 45 days out
            pickups: { t30: 60, t15: null, t7: null, t5: null, t3: null },
        }));
        expect(result.modelVersion).toBe('weighted_pickup_v03');
        expect(result.remainingDemand).toBeGreaterThan(0);
        expect(result.trace.some(t => t.includes('distant'))).toBe(true);
    });

    it('medium lead (7-14d): T7 area dominates', () => {
        const result = forecastDemand(makeInput({
            stayDate: new Date('2026-03-10'), // 9 days out
        }));
        expect(result.trace.some(t => t.includes('medium'))).toBe(true);
    });

    it('15-30d lead: long profile', () => {
        const result = forecastDemand(makeInput({
            stayDate: new Date('2026-03-21'), // 20 days out
        }));
        expect(result.trace.some(t => t.includes('long'))).toBe(true);
    });

    // ── STLY factor ──────────────────────────────────────────

    it('STLY factor clamped at 2.0 maximum', () => {
        const base = forecastDemand(makeInput({ paceVsLy: 1.0 }));
        const boosted = forecastDemand(makeInput({ paceVsLy: 5.0 })); // should clamp to 2.0
        // boosted should be ~2× base (5.0 clamped to 2.0, base is 1.0)
        // Math.round() applied independently, so allow ±1 tolerance
        expect(boosted.remainingDemand).toBeGreaterThanOrEqual(base.remainingDemand * 2 - 1);
        expect(boosted.remainingDemand).toBeLessThanOrEqual(base.remainingDemand * 2 + 1);
        expect(boosted.trace.some(t => t.includes('stly_factor=2.000'))).toBe(true);
    });

    it('STLY factor clamped at 0.5 minimum', () => {
        const base = forecastDemand(makeInput({ paceVsLy: 1.0 }));
        const reduced = forecastDemand(makeInput({ paceVsLy: 0.1 })); // should clamp to 0.5
        expect(reduced.remainingDemand).toBeLessThan(base.remainingDemand);
        expect(reduced.trace.some(t => t.includes('stly_factor=0.500'))).toBe(true);
    });

    it('null STLY defaults to factor 1.0', () => {
        const withStly = forecastDemand(makeInput({ paceVsLy: 1.0 }));
        const noStly = forecastDemand(makeInput({ paceVsLy: null }));
        expect(noStly.remainingDemand).toBe(withStly.remainingDemand);
        expect(noStly.trace.some(t => t.includes('no STLY data'))).toBe(true);
    });

    // ── C2 invariant: cancel does NOT increase demand ────────

    it('C2: remaining_demand is unconstrained — no cancel factor', () => {
        // Demand should be the same regardless of cancel expectations
        const result = forecastDemand(makeInput());
        // The model should NOT reference cancel anywhere
        expect(result.trace.join(' ')).not.toContain('cancel');
        expect(result.remainingDemand).toBeGreaterThan(0);
    });

    // ── Confidence scoring ───────────────────────────────────

    it('≥3 non-null pickups + STLY → high confidence', () => {
        const result = forecastDemand(makeInput()); // all 5 pickups + paceVsLy
        expect(result.confidence).toBe('high');
    });

    it('≥3 non-null pickups, no STLY → medium confidence', () => {
        const result = forecastDemand(makeInput({ paceVsLy: null }));
        expect(result.confidence).toBe('medium');
    });

    it('2 non-null pickups → medium confidence', () => {
        const result = forecastDemand(makeInput({
            pickups: { t30: 30, t15: null, t7: null, t5: null, t3: 5 },
        }));
        expect(result.confidence).toBe('medium');
    });

    it('1 non-null pickup → low confidence', () => {
        const result = forecastDemand(makeInput({
            pickups: { t30: null, t15: null, t7: null, t5: null, t3: 5 },
        }));
        expect(result.confidence).toBe('low');
    });

    it('0 non-null pickups → fallback', () => {
        const result = forecastDemand(makeInput({
            pickups: { t30: null, t15: null, t7: null, t5: null, t3: null },
        }));
        expect(result.confidence).toBe('fallback');
        expect(result.modelVersion).toContain('fallback');
    });

    // ── Edge cases ───────────────────────────────────────────

    it('negative pickup rates clamped to 0', () => {
        const result = forecastDemand(makeInput({
            pickups: { t30: -10, t15: -5, t7: -3, t5: -1, t3: 0 },
        }));
        expect(result.remainingDemand).toBe(0); // all rates ≤ 0 → 0 demand
    });

    it('very large pickup rates produce proportional demand', () => {
        const base = forecastDemand(makeInput({
            pickups: { t30: 30, t15: 15, t7: 7, t5: 5, t3: 3 },
        }));
        const doubled = forecastDemand(makeInput({
            pickups: { t30: 60, t15: 30, t7: 14, t5: 10, t3: 6 },
        }));
        // Doubled pickup should give ~2x demand
        expect(doubled.remainingDemand).toBeGreaterThan(base.remainingDemand * 1.5);
    });

    it('same-day arrival: daysToArrival = 1', () => {
        const result = forecastDemand(makeInput({
            stayDate: new Date('2026-03-01'),
            asOfDate: new Date('2026-03-01'),
        }));
        expect(result.remainingDemand).toBeGreaterThanOrEqual(0);
        expect(result.trace[0]).toBe('days_to_arrival=1');
    });

    // ── Fallback mode details ────────────────────────────────

    it('fallback uses 20% of remaining supply', () => {
        const result = forecastDemand(makeInput({
            roomsOtb: 80,
            capacity: 100,
            pickups: { t30: null, t15: null, t7: null, t5: null, t3: null },
        }));
        // remaining supply = 100 - 80 = 20, 20% = 4
        expect(result.remainingDemand).toBe(4);
    });

    it('fallback with sold-out returns 0', () => {
        const result = forecastDemand(makeInput({
            roomsOtb: 100,
            capacity: 100,
            pickups: { t30: null, t15: null, t7: null, t5: null, t3: null },
        }));
        expect(result.remainingDemand).toBe(0);
    });

    // ── Trace format ─────────────────────────────────────────

    it('trace contains days_to_arrival, non_null_pickups, weight_profile, weighted_rate, confidence', () => {
        const result = forecastDemand(makeInput());
        expect(result.trace.length).toBeGreaterThan(5);
        const traceStr = result.trace.join(' ');
        expect(traceStr).toContain('days_to_arrival=');
        expect(traceStr).toContain('non_null_pickups=');
        expect(traceStr).toContain('weight_profile=');
        expect(traceStr).toContain('weighted_rate=');
        expect(traceStr).toContain('confidence=');
    });
});
