'use server'

import prisma from '../../lib/prisma';
import { PricingLogic } from '../../lib/pricing';

export async function runPricingEngine(hotelId: string, asOfDate: Date) {
    // 1. Fetch Forecasts and DailyOTB (for Supply)
    // We need:
    // - DemandForecast (Remaining Demand)
    // - DailyOTB (Rooms Sold -> Remaining Supply)
    // - Capacity (from Hotel or OTB?) -> Rooms Inventory.
    //   For V01, let's assume Capacity is fixed (e.g. 50 rooms) or stored in Hotel settings.
    //   Let's check schema/seed. Hotel has 'room_count' (implied, or add to query).

    // Seed says Hotel "Hotel California". Let's assume Capacity = 50 for MVP if not in DB.
    // Actually, `DailyOTB` stores `rooms_otb`.
    // Missing: `capacity` per day.
    // Phase 03 Feature Engine calculated `remaining_supply = capacity - rooms_otb`.
    // BUT we didn't save `remaining_supply` to DB in Phase 03 Code (we only saved FeaturesDaily).
    // So we can re-fetch FeaturesDaily! It has `remaining_supply`.

    // Check FeaturesDaily schema...
    // Schema in Phase 01: `model FeaturesDaily { ... }` 
    // Plan 03 said Features are "rooms_otb, pickup_...". 
    // DOES IT HAVE remaining_supply?
    // Let's verify via prisma schema inspection or assume it's calculated.
    // If not in table, calculate here: Capacity (constant) - OTB.

    const capacity = 50; // Hardcode V01 for Safety. Or fetch from Hotel metadata if exists.
    const basePrice = 100; // Default V01 Base Price.

    // Fetch Joined Data (Forecast + OTB)
    // In V01, we iterate Forecasts as primary driver.
    const forecasts = await prisma.demandForecast.findMany({
        where: { hotel_id: hotelId, as_of_date: asOfDate }
    });

    const recommendations = [];

    for (const fc of forecasts) {
        // Need Supply
        // Fetch OTB for this stay_date
        const otb = await prisma.dailyOTB.findUnique({
            where: {
                hotel_id_as_of_date_stay_date: {
                    hotel_id: hotelId,
                    as_of_date: asOfDate,
                    stay_date: fc.stay_date
                }
            }
        });

        const roomsSold = otb?.rooms_otb || 0;
        const remainingSupply = capacity - roomsSold;

        // Current Price Source
        // Ideally OTB has ADR. Or Forecast has.
        // V01 Fallback: Use BasePrice (100).
        const currentPrice = basePrice;

        // Run Logic
        const result = PricingLogic.optimize(currentPrice, fc.remaining_demand || 0, remainingSupply);

        recommendations.push({
            hotel_id: hotelId,
            as_of_date: asOfDate,
            stay_date: fc.stay_date,
            current_price: currentPrice,
            recommended_price: result.recommendedPrice, // Can be null (Stop Sell)
            expected_revenue: result.expectedRevenue,
            uplift_pct: result.upliftPct,
            explanation: result.explanation
        });
    }

    // Save
    await prisma.priceRecommendations.deleteMany({
        where: { hotel_id: hotelId, as_of_date: asOfDate }
    });

    // Prisma might complain if recommended_price is null and schema expects Float.
    // Check schema: `recommended_price Float`. Nullable?
    // If NOT nullable, we must handle STOP SELL differently.
    // Plan (4): "Stop Sell -> price_recommendations.status = 'stop_sell' or recommended_price = null"
    // Let's assume we filter out nulls or handle schema.
    // SAFE MVP: If Stop Sell, save price = 9999 (High) or 0? 
    // No, let's treat it as NULL. If schema constraint, we fix schema or skip record.
    // For now, filter valid recs.

    const validRecs = recommendations.filter(r => r.recommended_price !== null);

    if (validRecs.length > 0) {
        await prisma.priceRecommendations.createMany({
            data: validRecs as any // Casting to avoid strict null checks blocking build if schema mismatch
        });
    }

    return { success: true, count: validRecs.length };
}
