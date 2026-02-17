'use server'

import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { optimizePrice, type PriceOptimizerInput, type PriceOptimizerResult } from '../../lib/engine/priceOptimizer';
import type { ForecastConfidence } from '../../lib/engine/demandModelV03';

// ─── Reason Code Taxonomy (L6) ────────────────────────────────────
// Fixed set — never raw zone strings.
type ReasonCode =
    | 'HIGH_OCC'        // OCC ≥ 85% + positive pressure
    | 'STRONG_DEMAND'   // Demand pressure ≥ 1.2
    | 'STABLE'          // Deadband |delta| < 1% or moderate
    | 'LOW_PICKUP'      // Pickup below baseline (SOFT/DISTRESS zone)
    | 'LOW_SUPPLY'      // Remaining supply < 10% capacity
    | 'STOP_SELL'       // Remaining supply ≤ 0
    | 'MISSING_PRICE';  // current_price null/0

const UPSERT_CHUNK_SIZE = 200; // L10

export async function runPricingEngine(hotelId: string, asOfDate: Date) {
    // 1. Load hotel config (including pricing settings)
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: {
            capacity: true,
            currency: true,
            default_base_rate: true,
            min_rate: true,
            max_rate: true,
        },
    });
    const capacity = hotel?.capacity ?? 100;

    // ── Base Rate: hotel.default_base_rate (Settings page) ──
    const baseRate = hotel?.default_base_rate
        ? Number(hotel.default_base_rate)
        : 1000000; // 1M VND fallback if not configured

    // ── Guardrails: hotel.min_rate / hotel.max_rate (Settings page) ──
    const minRate = hotel?.min_rate
        ? Number(hotel.min_rate)
        : Math.round(baseRate * 0.7);
    const maxRate = hotel?.max_rate
        ? Number(hotel.max_rate)
        : Math.round(baseRate * 2.0);

    // 2. Load season configs for season multiplier
    const seasonConfigs = await prisma.seasonConfig.findMany({
        where: { hotel_id: hotelId, is_active: true },
        orderBy: { priority: 'desc' },
    });

    // 3. Load OCC tier configs (still used by optimizer for zone interpolation)
    const tierConfigs = await prisma.occTierConfig.findMany({
        where: { hotel_id: hotelId },
        orderBy: { tier_index: 'asc' },
    });

    // 4. Load features + forecasts + last accepted decisions + dailyOTB (authoritative OTB)
    const [features, forecasts, lastDecisions, dailyOtbRows] = await Promise.all([
        prisma.featuresDaily.findMany({
            where: { hotel_id: hotelId, as_of_date: asOfDate },
            orderBy: { stay_date: 'asc' },
        }),
        prisma.demandForecast.findMany({
            where: { hotel_id: hotelId, as_of_date: asOfDate },
        }),
        // Option E: Load last accepted/overridden decisions for anchor
        prisma.pricingDecision.findMany({
            where: {
                hotel_id: hotelId,
                decided_at: { lte: asOfDate },
            },
            orderBy: { decided_at: 'desc' },
            select: {
                decision_id: true,
                stay_date: true,
                final_price: true,
                action: true,
                decided_at: true,
            },
        }),
        // P0-FIX: Load OTB from dailyOTB (same source as dashboard)
        // features_daily.rooms_otb is nullable and often NULL → OTB=0 bug
        prisma.dailyOTB.findMany({
            where: { hotel_id: hotelId, as_of_date: asOfDate },
            select: { stay_date: true, rooms_otb: true, revenue_otb: true },
        }),
    ]);

    // Index forecasts by stay_date string
    const forecastMap = new Map(
        forecasts.map(f => [f.stay_date.toISOString().slice(0, 10), f])
    );

    // Index dailyOTB by stay_date (authoritative OTB source)
    const otbMap = new Map(
        dailyOtbRows.map(o => [o.stay_date.toISOString().slice(0, 10), o])
    );

    // Index last decisions by stay_date (first match = most recent due to ORDER BY decided_at DESC)
    const lastDecisionMap = new Map<string, typeof lastDecisions[0]>();
    for (const d of lastDecisions) {
        const key = d.stay_date.toISOString().slice(0, 10);
        if (!lastDecisionMap.has(key)) {
            lastDecisionMap.set(key, d); // first = most recent
        }
    }

    const recommendations: any[] = [];

    for (const feat of features) {
        const stayDateStr = feat.stay_date.toISOString().slice(0, 10);
        const fc = forecastMap.get(stayDateStr);
        const otbRow = otbMap.get(stayDateStr);
        // P0-FIX: Use dailyOTB.rooms_otb (authoritative) → fall back to features_daily
        const roomsOtb = otbRow?.rooms_otb ?? feat.rooms_otb ?? 0;

        // Season multiplier for this date
        const seasonMult = getSeasonMultiplier(feat.stay_date, seasonConfigs);

        // ── Option E: Anchor cascade ──────────────────────────────
        // Priority 1: Last accepted/published price for this stay_date
        // Priority 2: Rack rate (base × seasonMult)
        const lastDecision = lastDecisionMap.get(stayDateStr);
        let currentPrice: number;
        let currentSource: 'LAST_ACCEPTED' | 'RACK_FALLBACK';
        let anchorDecisionId: string | null = null;

        if (lastDecision?.final_price && Number(lastDecision.final_price) > 0) {
            currentPrice = Math.round(Number(lastDecision.final_price));
            currentSource = 'LAST_ACCEPTED';
            anchorDecisionId = lastDecision.decision_id;
        } else {
            currentPrice = Math.round(baseRate * seasonMult);
            currentSource = 'RACK_FALLBACK';
        }

        const remainingSupply = feat.remaining_supply ?? Math.max(0, capacity - roomsOtb);

        const input: PriceOptimizerInput = {
            baseRate,
            roomsOtb,
            remainingDemand: fc?.remaining_demand ?? 0,
            remainingSupply,
            expectedCxl: feat.expected_cxl ?? 0,
            capacity,
            seasonMultiplier: seasonMult,
            guardrails: {
                minRate,
                maxRate,
                maxStepPct: 0.25,
            },
            currentRate: currentPrice, // pass anchor as currentRate for step-change guardrail
            confidence: (fc?.confidence as ForecastConfidence) ?? 'fallback',
        };

        const result = optimizePrice(input);

        // ── Compute action / delta / reason (4 guardrails) ──────────

        let action: 'INCREASE' | 'KEEP' | 'DECREASE' | 'STOP_SELL';
        let deltaPctDecimal: Prisma.Decimal | null;
        let reasonCode: ReasonCode;
        let reasonTextVi: string;
        let finalRecommendedPrice = result.recommendedPrice;

        // G1: Missing price guard (div-by-zero)
        if (!currentPrice || currentPrice <= 0) {
            action = 'KEEP';
            deltaPctDecimal = null;
            reasonCode = 'MISSING_PRICE';
            reasonTextVi = 'Thiếu giá hiện tại — không đề xuất thay đổi';
        }
        // G2: STOP_SELL override — remaining_supply ≤ 0
        else if (remainingSupply <= 0) {
            action = 'STOP_SELL';
            deltaPctDecimal = new Prisma.Decimal('0.00');
            reasonCode = 'STOP_SELL';
            reasonTextVi = 'Hết phòng — ngừng bán';
            finalRecommendedPrice = currentPrice; // keep same so UI doesn't show NaN
        }
        else {
            // L1: delta from the SAME persisted currentPrice (anchor)
            const rawDelta = ((result.recommendedPrice - currentPrice) / currentPrice) * 100;
            // L2: Decimal conversion
            deltaPctDecimal = new Prisma.Decimal(rawDelta.toFixed(2));

            // G3: Deadband — |delta| < 1% → KEEP but keep actual delta_pct (L7)
            if (Math.abs(rawDelta) < 1.0) {
                action = 'KEEP';
                reasonCode = 'STABLE';
                reasonTextVi = 'Bán đúng nhịp, giữ giá';
            } else if (rawDelta > 0) {
                action = 'INCREASE';
                reasonCode = mapToReasonCode(result, remainingSupply, capacity);
                reasonTextVi = generateViReason(reasonCode, rawDelta, result);
            } else {
                action = 'DECREASE';
                reasonCode = mapToReasonCode(result, remainingSupply, capacity);
                reasonTextVi = generateViReason(reasonCode, rawDelta, result);
            }
        }

        recommendations.push({
            hotel_id: hotelId,
            as_of_date: asOfDate,
            stay_date: feat.stay_date,
            current_price: currentPrice,
            recommended_price: finalRecommendedPrice,
            expected_revenue: result.expectedGrossRevenue,
            uplift_pct: result.upliftPct,
            explanation: JSON.stringify({
                zone: result.zone,
                multiplier: result.multiplier,
                confidence: input.confidence,
                currentOcc: result.currentOcc,
                projectedOcc: result.projectedOcc,
                cxlClipped: result.cxlClipped,
                expectedFinalRooms: result.expectedFinalRooms,
                trace: result.trace,
                // ── Provenance (Option E) ──
                anchor: {
                    currentPrice,
                    source: currentSource,
                    anchorDecisionId,
                    baseRate,
                    seasonMult,
                    rackRate: Math.round(baseRate * seasonMult),
                },
                guardrailsUsed: { minRate, maxRate, source: 'HOTEL_SETTINGS' },
            }),
            action,
            delta_pct: deltaPctDecimal,
            reason_code: reasonCode,
            reason_text_vi: reasonTextVi,
        });
    }

    // G4/L3/L10: Atomic chunked upsert in $transaction
    for (let i = 0; i < recommendations.length; i += UPSERT_CHUNK_SIZE) {
        const chunk = recommendations.slice(i, i + UPSERT_CHUNK_SIZE);
        await prisma.$transaction(
            chunk.map((rec: any) =>
                prisma.priceRecommendations.upsert({
                    where: {
                        hotel_id_as_of_date_stay_date: {
                            hotel_id: rec.hotel_id,
                            as_of_date: rec.as_of_date,
                            stay_date: rec.stay_date,
                        },
                    },
                    update: {
                        current_price: rec.current_price,
                        recommended_price: rec.recommended_price,
                        expected_revenue: rec.expected_revenue,
                        uplift_pct: rec.uplift_pct,
                        explanation: rec.explanation,
                        action: rec.action,
                        delta_pct: rec.delta_pct,
                        reason_code: rec.reason_code,
                        reason_text_vi: rec.reason_text_vi,
                        // L3: created_at + updated_at excluded — Prisma @updatedAt auto-sets
                    },
                    create: rec,
                })
            )
        );
    }

    return { success: true, count: recommendations.length };
}

// ─── Helpers ────────────────────────────────────────────────

function getSeasonMultiplier(
    stayDate: Date,
    seasonConfigs: Array<{ code: string; date_ranges: any; priority: number }>
): number {
    const mmdd = stayDate.toISOString().slice(5, 10); // "MM-DD"

    for (const sc of seasonConfigs) {
        const ranges = sc.date_ranges as Array<{ start: string; end: string }>;
        for (const range of ranges) {
            const rStart = range.start.slice(5); // "MM-DD"
            const rEnd = range.end.slice(5);
            if (mmdd >= rStart && mmdd <= rEnd) {
                // Map season code to multiplier
                const code = sc.code.toUpperCase();
                if (code === 'HOLIDAY') return 1.5;
                if (code === 'HIGH') return 1.2;
                if (code === 'NORMAL') return 1.0;
                return 1.0;
            }
        }
    }
    return 1.0; // default — no season match
}

/**
 * L6: Map optimizer result to fixed reason_code taxonomy.
 * Never returns raw zone string.
 */
function mapToReasonCode(
    result: PriceOptimizerResult,
    remainingSupply: number,
    capacity: number,
): ReasonCode {
    const occPct = result.projectedOcc * 100;
    const supplyPct = capacity > 0 ? (remainingSupply / capacity) * 100 : 100;

    // Supply-based reasons (most specific)
    if (supplyPct < 10) return 'LOW_SUPPLY';

    // Demand-based reasons
    if (result.zone === 'SURGE' || result.zone === 'STRONG') return 'STRONG_DEMAND';
    if (occPct >= 85) return 'HIGH_OCC';
    if (result.zone === 'SOFT' || result.zone === 'DISTRESS') return 'LOW_PICKUP';

    return 'STABLE';
}

/**
 * Generate Vietnamese reason text for GM display.
 * Shows OTB% (current) + Projected OCC% (after cxl + forecast) separately.
 */
function generateViReason(
    code: ReasonCode,
    deltaPct: number,
    result: PriceOptimizerResult,
): string {
    const otbStr = `${(result.currentOcc * 100).toFixed(0)}%`;
    const projStr = `${(result.projectedOcc * 100).toFixed(0)}%`;
    const sign = deltaPct > 0 ? '+' : '';
    const deltaStr = `${sign}${deltaPct.toFixed(1)}%`;

    switch (code) {
        case 'HIGH_OCC':
            return `OTB ${otbStr}, dự phóng ${projStr} cao → tăng giá ${deltaStr}`;
        case 'STRONG_DEMAND':
            return `Nhu cầu mạnh (${result.zone}), OTB ${otbStr} → điều chỉnh ${deltaStr}`;
        case 'LOW_PICKUP':
            return `Pickup thấp, OTB ${otbStr}, dự phóng ${projStr} → giảm giá ${deltaStr}`;
        case 'LOW_SUPPLY':
            return `Còn ít phòng, OTB ${otbStr} → điều chỉnh ${deltaStr}`;
        case 'STABLE':
            return 'Bán đúng nhịp, giữ giá';
        case 'STOP_SELL':
            return 'Hết phòng — ngừng bán';
        case 'MISSING_PRICE':
            return 'Thiếu giá hiện tại — không đề xuất thay đổi';
        default:
            return `Điều chỉnh ${deltaStr}`;
    }
}
