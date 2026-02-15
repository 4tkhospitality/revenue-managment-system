'use server'

import prisma from '../../lib/prisma';
import { optimizePrice, type PriceOptimizerInput } from '../../lib/engine/priceOptimizer';
import type { ForecastConfidence } from '../../lib/engine/demandModelV03';

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

    const recommendations = [];

    for (const feat of features) {
        const stayDateStr = feat.stay_date.toISOString().slice(0, 10);
        const fc = forecastMap.get(stayDateStr);
        const roomsOtb = feat.rooms_otb ?? 0;

        // Season multiplier for this date
        const seasonMult = getSeasonMultiplier(feat.stay_date, seasonConfigs);

        const input: PriceOptimizerInput = {
            baseRate,
            roomsOtb,
            remainingDemand: fc?.remaining_demand ?? 0,
            remainingSupply: feat.remaining_supply ?? Math.max(0, capacity - roomsOtb),
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

        recommendations.push({
            hotel_id: hotelId,
            as_of_date: asOfDate,
            stay_date: feat.stay_date,
            current_price: baseRate * seasonMult,
            recommended_price: result.recommendedPrice,
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
        });
    }

    // 5. Atomic replace
    await prisma.priceRecommendations.deleteMany({
        where: { hotel_id: hotelId, as_of_date: asOfDate }
    });

    if (recommendations.length > 0) {
        await prisma.priceRecommendations.createMany({
            data: recommendations as any
        });
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
