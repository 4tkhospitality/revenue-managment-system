'use server'

import prisma from '../../lib/prisma';
import { DateUtils } from '../../lib/date';
import { addDays } from 'date-fns';

export async function buildFeatures(hotelId: string, asOfDate: Date) {
    const windowEnd = addDays(asOfDate, 365);

    // 1. Fetch History for T30, T15, T7, T5
    // We need OTB snapshots at: asOfDate, T-5, T-7, T-15, T-30
    // And Last Year (LY): asOfDate - 365

    const dates = {
        current: asOfDate,
        t5: DateUtils.addDays(asOfDate, -5),
        t7: DateUtils.addDays(asOfDate, -7),
        t15: DateUtils.addDays(asOfDate, -15),
        t30: DateUtils.addDays(asOfDate, -30),
        ly: DateUtils.addDays(asOfDate, -365) // Approximation for LY
    };

    // Helper: Fetch OTB map for a specific snapshot date
    async function fetchSnapshot(snapshotDate: Date) {
        const records = await prisma.dailyOTB.findMany({
            where: {
                hotel_id: hotelId,
                as_of_date: snapshotDate,
                stay_date: {
                    gte: asOfDate, // Only care about future stay dates relative to current asOf
                    lte: windowEnd
                }
            },
            select: { stay_date: true, rooms_otb: true }
        });

        const map = new Map<string, number>();
        records.forEach(r => map.set(r.stay_date.toISOString().split('T')[0], r.rooms_otb));
        return map;
    }

    // Parallel Fetch
    const [otbCurrent, otbT5, otbT7, otbT15, otbT30, otbLY] = await Promise.all([
        fetchSnapshot(dates.current),
        fetchSnapshot(dates.t5),
        fetchSnapshot(dates.t7),
        fetchSnapshot(dates.t15),
        fetchSnapshot(dates.t30),
        fetchSnapshot(dates.ly)
    ]);

    const features = [];

    // Iterate through futureDates [asOfDate, windowEnd]
    for (const stayDate of DateUtils.eachDay(asOfDate, windowEnd)) {
        const key = stayDate.toISOString().split('T')[0];

        const current = otbCurrent.get(key) || 0;

        // Calculate Pickups
        const pickup_t5 = current - (otbT5.get(key) || 0); // V01: Simple subtraction? Or should it be aligned by lead time?
        // Standard RMS: Pickup over last 5 days for the SAME stay date.
        // Yes, OTB(Today, Stay) - OTB(Today-5, Stay). Correct.
        const pickup_t7 = current - (otbT7.get(key) || 0);
        const pickup_t15 = current - (otbT15.get(key) || 0);
        const pickup_t30 = current - (otbT30.get(key) || 0);

        // Calculate Pace vs LY
        // Need to compare OTB(Today, Stay) vs OTB(LY_Today, LY_Stay)
        // APPROX for V01: compare OTB(Today, Stay) vs OTB(Today-365, Stay-365) ?
        // Wait, fetchSnapshot(dates.ly) gets OTB for snapshot=Today-365.
        // But the stay_date likely won't match "Stay" (which is in 2026) vs LY stats (which was for 2025).
        // COMPLEXITY: Generating pace_vs_ly requires mapping StayDate -> StayDateLY.
        // V01 Simplification: We will skip Pace vs LY for now if data structure doesn't support easy LY mapping without massive query complexity.
        // User Req (D): Guard pace_vs_ly if LY=0 -> 1.0. Let's assume we have LY data for same DOW or Date.
        // Let's implement simple LY lookup: StayDate - 364 days (align DOW).
        const lyKey = DateUtils.addDays(stayDate, -364).toISOString().split('T')[0];
        // This assumes we have OTB data from a year ago. If not, LY=0.

        // Since we don't have LY data in a fresh DB, this will likely be 0.
        const lyVal = otbLY.get(lyKey) || 0;
        const pace_vs_ly = lyVal === 0 ? 1.0 : (current / lyVal);

        const dow = stayDate.getDay();
        const month = stayDate.getMonth() + 1;
        const is_weekend = dow === 0 || dow === 6;

        features.push({
            hotel_id: hotelId,
            as_of_date: asOfDate,
            stay_date: stayDate,
            dow,
            month,
            is_weekend,
            pickup_t5,
            pickup_t7,
            pickup_t15,
            pickup_t30,
            pace_vs_ly,
            remaining_supply: 50 // Mock
        });
    }

    // Save to DB (optional step if we want to debug features, but required per Plan "Module C -> Features")
    // Let's assume we pass this data to Forecast Engine directly for efficiency in V01, 
    // OR write to DB if user explicity requested a Feature Store.
    // "Save into demand_forecast" is Phase 03 Output.
    // "Feature engineering -> features_daily" found in schema?

    // Let's write to FeaturesDaily table
    await prisma.featuresDaily.deleteMany({
        where: { hotel_id: hotelId, as_of_date: asOfDate }
    });

    try {
        await prisma.featuresDaily.createMany({
            data: features
        });
    } catch (e: any) {
        console.error("❌ Error saving features:", e?.message);
        throw e;
    }

    return { success: true, count: features.length };
}
