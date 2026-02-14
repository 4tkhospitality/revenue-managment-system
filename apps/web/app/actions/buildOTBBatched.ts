'use server';

import prisma from '@/lib/prisma';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import { buildDailyOTB } from './buildDailyOTB';

/**
 * Phase 1: Calculate all OTB dates to build (3-tier policy).
 * Returns the list of dates without building anything.
 * This is FAST — just SQL queries to generate date series.
 */
export async function getOTBBuildPlan() {
    const hotelId = await getActiveHotelId();
    if (!hotelId) return { error: 'No active hotel' };

    // Get booking date range
    const bookingRange = await prisma.$queryRaw<{ min_date: Date; max_date: Date; earliest_arr: Date; latest_dep: Date }[]>`
        SELECT 
            MIN(booking_date)::date as min_date,
            MAX(booking_date)::date as max_date,
            MIN(arrival_date)::date as earliest_arr,
            MAX(departure_date)::date as latest_dep
        FROM reservations_raw 
        WHERE hotel_id = ${hotelId}::uuid
    `;

    if (!bookingRange.length || !bookingRange[0].min_date) {
        return { error: 'No reservation data found. Please upload data first.' };
    }

    const { min_date, max_date, earliest_arr, latest_dep } = bookingRange[0];

    // Existing snapshot dates for dedup
    const existingDates = await prisma.dailyOTB.findMany({
        where: { hotel_id: hotelId },
        select: { as_of_date: true },
        distinct: ['as_of_date'],
    });
    const existingSet = new Set(existingDates.map(d => d.as_of_date.toISOString().split('T')[0]));

    // 3-Tier dates (same logic as rebuildAllOTB)
    const tier_b_start = new Date(max_date);
    tier_b_start.setDate(tier_b_start.getDate() - 450);
    const monthlyEnd = tier_b_start > min_date ? tier_b_start : min_date;

    const monthlyDates = await prisma.$queryRaw<{ d: Date }[]>`
        SELECT LEAST(
            (date_trunc('month', g) + interval '1 month' - interval '1 day')::date,
            ${max_date}::date
        ) as d
        FROM generate_series(${min_date}::date, ${monthlyEnd}::date, '1 month'::interval) g
        ORDER BY g ASC
    `;

    const tier_a_start = new Date(max_date);
    tier_a_start.setDate(tier_a_start.getDate() - 35);
    const weeklyStart = tier_b_start > min_date ? tier_b_start : min_date;
    const weeklyEnd = tier_a_start > weeklyStart ? tier_a_start : max_date;

    const weeklyDates = await prisma.$queryRaw<{ d: Date }[]>`
        SELECT g::date as d
        FROM generate_series(${weeklyStart}::date, ${weeklyEnd}::date, '7 days'::interval) g
        ORDER BY g ASC
    `;

    const dailyStart = tier_a_start > min_date ? tier_a_start : min_date;
    const dailyDates = await prisma.$queryRaw<{ d: Date }[]>`
        SELECT g::date as d
        FROM generate_series(${dailyStart}::date, ${max_date}::date, '1 day'::interval) g
        ORDER BY g ASC
    `;

    // Merge + dedup + sort
    const allDatesRaw = [
        ...monthlyDates.map(r => r.d),
        ...weeklyDates.map(r => r.d),
        ...dailyDates.map(r => r.d),
    ];
    const seen = new Set<string>();
    const datesToBuild: string[] = [];
    for (const d of allDatesRaw) {
        const key = d.toISOString().split('T')[0];
        if (!seen.has(key) && !existingSet.has(key)) {
            seen.add(key);
            datesToBuild.push(key);
        }
    }
    datesToBuild.sort();

    // Add "latest" date (max_date itself, always rebuild)
    const latestKey = max_date.toISOString().split('T')[0];
    if (!datesToBuild.includes(latestKey)) {
        datesToBuild.push(latestKey);
    }

    return {
        hotelId,
        total: datesToBuild.length,
        existing: existingSet.size,
        dates: datesToBuild,
        stayDateFrom: earliest_arr
            ? new Date(new Date(earliest_arr).setDate(new Date(earliest_arr).getDate() - 7)).toISOString().split('T')[0]
            : '2020-01-01',
        stayDateTo: latest_dep
            ? new Date(new Date(latest_dep).setDate(new Date(latest_dep).getDate() + 7)).toISOString().split('T')[0]
            : '2030-12-31',
        tiers: {
            daily: dailyDates.length,
            weekly: weeklyDates.length,
            monthly: monthlyDates.length,
        },
    };
}

/**
 * Phase 2: Build a batch of OTB dates.
 * Called repeatedly by the UI with a cursor index.
 */
export async function buildOTBBatch(
    hotelId: string,
    dates: string[],
    startIndex: number,
    batchSize: number,
    stayDateFrom: string,
    stayDateTo: string,
): Promise<{ built: number; skipped: number; nextIndex: number; done: boolean }> {
    const batch = dates.slice(startIndex, startIndex + batchSize);
    let built = 0;
    let skipped = 0;

    for (const dateStr of batch) {
        try {
            const asOfTs = new Date(dateStr + 'T23:59:59.999Z');
            const result = await buildDailyOTB({
                hotelId,
                asOfTs,
                stayDateFrom: new Date(stayDateFrom),
                stayDateTo: new Date(stayDateTo),
            });
            if (result.success) built++;
            else skipped++;
        } catch {
            skipped++;
        }
    }

    const nextIndex = startIndex + batch.length;
    return {
        built,
        skipped,
        nextIndex,
        done: nextIndex >= dates.length,
    };
}
