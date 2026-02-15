'use server'

import prisma from '../../lib/prisma';
import { forecastDemand } from '../../lib/engine/demandModelV03';

export async function runForecast(hotelId: string, asOfDate: Date) {
    // 1. Load Features
    const features = await prisma.featuresDaily.findMany({
        where: { hotel_id: hotelId, as_of_date: asOfDate }
    });

    // 2. Load hotel capacity for fallback
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { capacity: true },
    });
    const capacity = hotel?.capacity ?? 100;

    const forecasts = features.map(f => {
        const result = forecastDemand({
            stayDate: f.stay_date,
            asOfDate: f.as_of_date,
            roomsOtb: f.rooms_otb ?? 0,
            capacity,
            pickups: {
                t30: f.pickup_t30,
                t15: f.pickup_t15,
                t7: f.pickup_t7,
                t5: f.pickup_t5,
                t3: f.pickup_t3,
            },
            paceVsLy: f.pace_vs_ly,
        });

        return {
            hotel_id: hotelId,
            as_of_date: asOfDate,
            stay_date: f.stay_date,
            remaining_demand: result.remainingDemand,
            model_version: result.modelVersion,
            confidence: result.confidence,
            forecast_trace: result.trace,
        };
    });

    // 3. Atomic replace
    await prisma.demandForecast.deleteMany({
        where: { hotel_id: hotelId, as_of_date: asOfDate }
    });

    await prisma.demandForecast.createMany({
        data: forecasts
    });

    return { success: true, count: forecasts.length };
}
