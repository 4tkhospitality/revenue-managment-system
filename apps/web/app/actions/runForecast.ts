'use server'

import prisma from '../../lib/prisma';

export async function runForecast(hotelId: string, asOfDate: Date) {
    const lead_time_factor = 1.0; // V01 Default

    // 1. Load Features
    const features = await prisma.featuresDaily.findMany({
        where: { hotel_id: hotelId, as_of_date: asOfDate }
    });

    const forecasts = features.map(f => {
        // Heuristic Logic
        // avg(t30, t15, t5)
        const avgPickup = ((f.pickup_t30 || 0) + (f.pickup_t15 || 0) + (f.pickup_t5 || 0)) / 3.0;

        // max(avg, t7)
        const baseDemand = Math.max(avgPickup, f.pickup_t7 || 0);

        // Apply Factor
        // Note: Demand cannot be negative
        let remaining_demand = Math.max(0, baseDemand * lead_time_factor);

        // Capacity Guard (Optional V01?)
        // remaining_demand <= remaining_supply * multiplier?
        // Not strictly enforcing yet, let's keep it raw demand.

        return {
            hotel_id: hotelId,
            as_of_date: asOfDate,
            stay_date: f.stay_date,
            remaining_demand: remaining_demand,
            model_version: 'heuristic_v01',
            // Explainability Log (stored in DB? Schema might need Json field)
            // `demand_forecast` schema check needed. Assuming strict columns for now.
        };
    });

    // 2. Save Forecast
    await prisma.demandForecast.deleteMany({
        where: { hotel_id: hotelId, as_of_date: asOfDate }
    });

    await prisma.demandForecast.createMany({
        data: forecasts
    });

    return { success: true, count: forecasts.length };
}
