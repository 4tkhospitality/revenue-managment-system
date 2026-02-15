/**
 * Analytics Layer P1-P2: Demand Model V03 — Weighted Pickup + STLY
 * 
 * Pure function, zero DB calls, fully testable.
 * 
 * Key improvements over heuristic_v02:
 *   1. Lead-time-dependent pick-up weights (T3 dominates short, T30 dominates long)
 *   2. STLY normalization factor (clamped 0.5–2.0)
 *   3. Confidence scoring based on data completeness
 *   4. Human-readable trace for debugging
 *
 * Convention (C2):  remaining_demand = unconstrained demand from pickup only.
 *                   Cancel impact stays on supply side (net_remaining), NOT here.
 */

// ─── Types ──────────────────────────────────────────────────

export type ForecastConfidence = 'high' | 'medium' | 'low' | 'fallback';

export interface DemandForecastInput {
    stayDate: Date;
    asOfDate: Date;
    roomsOtb: number;
    capacity: number;
    pickups: {
        t30: number | null;
        t15: number | null;
        t7: number | null;
        t5: number | null;
        t3: number | null;
    };
    paceVsLy: number | null;
}

export interface DemandForecastResult {
    remainingDemand: number;
    confidence: ForecastConfidence;
    modelVersion: string;
    trace: string[];
}

// ─── Weight Tables (lead-time buckets) ──────────────────────

//                        T30    T15   T7    T5    T3
const WEIGHT_SHORT = [0.05, 0.10, 0.20, 0.25, 0.40]; // <7d
const WEIGHT_MEDIUM = [0.10, 0.20, 0.30, 0.25, 0.15]; // 7-14d
const WEIGHT_LONG = [0.15, 0.30, 0.25, 0.20, 0.10]; // 15-30d
const WEIGHT_DISTANT = [0.40, 0.25, 0.15, 0.10, 0.10]; // >30d

const PICKUP_WINDOWS = [30, 15, 7, 5, 3]; // matching weight index

// ─── Core Function ──────────────────────────────────────────

export function forecastDemand(input: DemandForecastInput): DemandForecastResult {
    const trace: string[] = [];
    const { stayDate, asOfDate, roomsOtb, capacity, pickups, paceVsLy } = input;

    const daysToArrival = Math.max(1, Math.ceil(
        (new Date(stayDate).getTime() - new Date(asOfDate).getTime()) / (1000 * 60 * 60 * 24)
    ));
    trace.push(`days_to_arrival=${daysToArrival}`);

    // Compute per-window rates
    const rawRates: (number | null)[] = [
        pickups.t30 != null ? pickups.t30 / 30 : null,
        pickups.t15 != null ? pickups.t15 / 15 : null,
        pickups.t7 != null ? pickups.t7 / 7 : null,
        pickups.t5 != null ? pickups.t5 / 5 : null,
        pickups.t3 != null ? pickups.t3 / 3 : null,
    ];

    const nonNullCount = rawRates.filter(r => r != null).length;
    trace.push(`non_null_pickups=${nonNullCount}`);

    // ─── Fallback: no pickup data at all ───
    if (nonNullCount === 0) {
        const supply = Math.max(0, capacity - roomsOtb);
        const est = Math.round(supply * 0.2);
        const remainingDemand = Math.min(supply, Math.max(0, est));
        trace.push(`fallback: supply=${supply}, est=${est}`);
        return {
            remainingDemand,
            confidence: 'fallback',
            modelVersion: 'weighted_pickup_v03:fallback',
            trace,
        };
    }

    // ─── Select weight profile ───
    let weights: number[];
    if (daysToArrival < 7) {
        weights = WEIGHT_SHORT;
        trace.push('weight_profile=short(<7d)');
    } else if (daysToArrival <= 14) {
        weights = WEIGHT_MEDIUM;
        trace.push('weight_profile=medium(7-14d)');
    } else if (daysToArrival <= 30) {
        weights = WEIGHT_LONG;
        trace.push('weight_profile=long(15-30d)');
    } else {
        weights = WEIGHT_DISTANT;
        trace.push('weight_profile=distant(>30d)');
    }

    // ─── Weighted average (re-normalize for missing windows) ───
    let weightedSum = 0;
    let totalWeight = 0;
    for (let i = 0; i < rawRates.length; i++) {
        if (rawRates[i] != null) {
            // Clamp negative rates to 0 (due to cancellations exceeding bookings in a window)
            const rate = Math.max(0, rawRates[i]!);
            weightedSum += weights[i] * rate;
            totalWeight += weights[i];
            trace.push(`w[T${PICKUP_WINDOWS[i]}]=${weights[i].toFixed(2)}×${rate.toFixed(3)}`);
        }
    }
    const weightedRate = totalWeight > 0 ? weightedSum / totalWeight : 0;
    trace.push(`weighted_rate=${weightedRate.toFixed(4)}`);

    // ─── STLY factor ───
    let stlyFactor = 1.0;
    if (paceVsLy != null && isFinite(paceVsLy)) {
        stlyFactor = Math.max(0.5, Math.min(2.0, paceVsLy));
        trace.push(`stly_factor=${stlyFactor.toFixed(3)} (raw=${paceVsLy.toFixed(3)})`);
    } else {
        trace.push('stly_factor=1.0 (no STLY data)');
    }

    // ─── Final demand ───
    const rawDemand = weightedRate * daysToArrival * stlyFactor;
    const remainingDemand = Math.max(0, Math.round(rawDemand));
    trace.push(`remaining_demand=${remainingDemand} (raw=${rawDemand.toFixed(2)})`);

    // ─── Confidence scoring ───
    let confidence: ForecastConfidence;
    if (nonNullCount >= 3 && paceVsLy != null) {
        confidence = 'high';
    } else if (nonNullCount >= 3) {
        confidence = 'medium'; // enough pickups but no STLY
    } else if (nonNullCount >= 2) {
        confidence = 'medium';
    } else {
        confidence = 'low';
    }
    trace.push(`confidence=${confidence}`);

    return {
        remainingDemand,
        confidence,
        modelVersion: 'weighted_pickup_v03',
        trace,
    };
}
