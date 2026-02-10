'use server'

import prisma from '../../lib/prisma';

export async function runForecast(hotelId: string, asOfDate: Date) {
    const lead_time_factor = 1.0; // V01 Default

    // 1. Load Features
    const features = await prisma.featuresDaily.findMany({
        where: { hotel_id: hotelId, as_of_date: asOfDate }
    });

    const forecasts = features.map(f => {
        // v2: Convert N-day equivalents → per-day rate, average only non-null values
        // BA rules: Option A scaling, countNonNull avg, clamp negative, days_to_arrival
        const rates: number[] = [];
        if (f.pickup_t30 != null) rates.push(f.pickup_t30 / 30);
        if (f.pickup_t15 != null) rates.push(f.pickup_t15 / 15);
        if (f.pickup_t7 != null) rates.push(f.pickup_t7 / 7);
        if (f.pickup_t5 != null) rates.push(f.pickup_t5 / 5);
        if (f.pickup_t3 != null) rates.push(f.pickup_t3 / 3);

        const countNonNull = rates.length;

        // days_to_arrival = stay_date - as_of_date (in days)
        const daysToArrival = Math.max(1, Math.ceil(
            (new Date(f.stay_date).getTime() - new Date(f.as_of_date).getTime()) / (1000 * 60 * 60 * 24)
        ));

        let remaining_demand: number;
        let forecast_source: string;

        if (countNonNull >= 2) {
            // Enough history: true average of per-day rates
            const avgRate = rates.reduce((a, b) => a + b, 0) / countNonNull;
            // Clamp negative rates (due to cancellations) to 0 for forecast
            const safeRate = Math.max(0, avgRate);
            remaining_demand = Math.max(0, Math.round(safeRate * lead_time_factor * daysToArrival));
            forecast_source = 'pickup_avg';
        } else if (countNonNull === 1) {
            // Single data point: use it but flag
            const safeRate = Math.max(0, rates[0]);
            remaining_demand = Math.max(0, Math.round(safeRate * lead_time_factor * daysToArrival));
            forecast_source = 'pickup_single';
        } else {
            // No pickup history → supply-based fallback
            // BA rule: clamp to supply, no forced >=1 when supply=0
            const supply = Math.max(0, f.remaining_supply || 0);
            const est = Math.round(supply * 0.2);
            remaining_demand = Math.min(supply, Math.max(0, est));
            forecast_source = supply > 0 ? 'fallback' : 'no_supply';
        }

        return {
            hotel_id: hotelId,
            as_of_date: asOfDate,
            stay_date: f.stay_date,
            remaining_demand: remaining_demand,
            model_version: `heuristic_v02:${forecast_source}`,
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
