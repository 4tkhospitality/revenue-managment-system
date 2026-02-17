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
    // 1. Load hotel config
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { capacity: true, currency: true },
    });
    const capacity = hotel?.capacity ?? 100;

    // 2. Load season configs for season multiplier
    const seasonConfigs = await prisma.seasonConfig.findMany({
        where: { hotel_id: hotelId, is_active: true },
        orderBy: { priority: 'desc' },
    });

    // 3. Load guardrails from OCC tier config (or default)
    const tierConfigs = await prisma.occTierConfig.findMany({
        where: { hotel_id: hotelId },
        orderBy: { tier_index: 'asc' },
    });

    // Compute base rate from season net rates or fallback
    const seasonNetRate = await prisma.seasonNetRate.findFirst({
        where: { hotel_id: hotelId },
        orderBy: { net_rate: 'asc' },
        select: { net_rate: true },
    });
    const baseRate = seasonNetRate ? Number(seasonNetRate.net_rate) : 1000000; // 1M VND default

    // Compute guardrails from tier multipliers
    const minRate = tierConfigs.length > 0
        ? Math.round(baseRate * Math.min(...tierConfigs.map(t => t.adjustment_type === 'FIXED' ? (t.fixed_amount / Math.max(baseRate, 1)) : t.multiplier)))
        : Math.round(baseRate * 0.7);
    const maxRate = tierConfigs.length > 0
        ? Math.round(baseRate * Math.max(...tierConfigs.map(t => t.multiplier)) * 1.3)
        : Math.round(baseRate * 2.0);

    // 4. Load features + forecasts for this as_of_date
    const [features, forecasts] = await Promise.all([
        prisma.featuresDaily.findMany({
            where: { hotel_id: hotelId, as_of_date: asOfDate },
            orderBy: { stay_date: 'asc' },
        }),
        prisma.demandForecast.findMany({
            where: { hotel_id: hotelId, as_of_date: asOfDate },
        }),
    ]);

    // Index forecasts by stay_date string
    const forecastMap = new Map(
        forecasts.map(f => [f.stay_date.toISOString().slice(0, 10), f])
    );

    const recommendations: any[] = [];

    for (const feat of features) {
        const stayDateStr = feat.stay_date.toISOString().slice(0, 10);
        const fc = forecastMap.get(stayDateStr);
        const roomsOtb = feat.rooms_otb ?? 0;

        // Season multiplier for this date
        const seasonMult = getSeasonMultiplier(feat.stay_date, seasonConfigs);

        // L1: Compute current_price ONCE — this exact value is persisted AND used for delta
        const currentPrice = baseRate * seasonMult;

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
                maxRate: Math.round(maxRate),
                maxStepPct: 0.25,
            },
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
            // L1: delta from the SAME persisted currentPrice
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
                projectedOcc: result.projectedOcc,
                expectedFinalRooms: result.expectedFinalRooms,
                trace: result.trace,
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
 */
function generateViReason(
    code: ReasonCode,
    deltaPct: number,
    result: PriceOptimizerResult,
): string {
    const occStr = `${(result.projectedOcc * 100).toFixed(0)}%`;
    const sign = deltaPct > 0 ? '+' : '';
    const deltaStr = `${sign}${deltaPct.toFixed(1)}%`;

    switch (code) {
        case 'HIGH_OCC':
            return `OCC ${occStr} cao → tăng giá ${deltaStr}`;
        case 'STRONG_DEMAND':
            return `Nhu cầu mạnh (${result.zone}) → điều chỉnh ${deltaStr}`;
        case 'LOW_PICKUP':
            return `Pickup thấp, OCC ${occStr} → giảm giá ${deltaStr}`;
        case 'LOW_SUPPLY':
            return `Còn ít phòng, OCC ${occStr} → điều chỉnh ${deltaStr}`;
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
