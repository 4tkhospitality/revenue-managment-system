'use server';

import prisma from '../../lib/prisma';
import { getActiveHotelId } from '../../lib/pricing/get-hotel';
import { Prisma } from '@prisma/client';

// ─── Types ──────────────────────────────────────────────────
interface BuildFeaturesParams {
    hotelId?: string;
    asOfDate?: Date;      // specific as_of_date to build
    backfillAll?: boolean; // rebuild for ALL as_of_dates
}

interface BuildFeaturesResult {
    success: boolean;
    count?: number;
    asOfDatesProcessed?: number;
    error?: string;
}

// ─── Main: buildFeatures ────────────────────────────────────
export async function buildFeatures(
    hotelIdOrFirst?: string,
    asOfDateParam?: Date
): Promise<BuildFeaturesResult> {
    return buildFeaturesDaily({
        hotelId: hotelIdOrFirst ?? undefined,
        asOfDate: asOfDateParam ?? undefined,
    });
}

export async function buildFeaturesDaily(
    params: BuildFeaturesParams = {}
): Promise<BuildFeaturesResult> {
    try {
        const hotelId = params.hotelId || await getActiveHotelId();
        if (!hotelId) {
            return { success: false, error: 'No active hotel found' };
        }

        // Get hotel capacity
        const hotel = await prisma.hotel.findUnique({
            where: { hotel_id: hotelId },
            select: { capacity: true },
        });
        if (!hotel) {
            return { success: false, error: 'Hotel not found' };
        }
        const capacity = hotel.capacity;

        // Determine which as_of_dates to process
        let asOfDates: Date[];

        if (params.backfillAll) {
            // Get all distinct as_of_dates
            const distinct = await prisma.dailyOTB.findMany({
                where: { hotel_id: hotelId },
                select: { as_of_date: true },
                distinct: ['as_of_date'],
                orderBy: { as_of_date: 'asc' },
            });
            asOfDates = distinct.map(d => d.as_of_date);
        } else if (params.asOfDate) {
            asOfDates = [params.asOfDate];
        } else {
            // Use latest as_of_date
            const latest = await prisma.dailyOTB.findFirst({
                where: { hotel_id: hotelId },
                orderBy: { as_of_date: 'desc' },
                select: { as_of_date: true },
            });
            if (!latest) {
                return { success: false, error: 'No OTB data found' };
            }
            asOfDates = [latest.as_of_date];
        }

        let totalCount = 0;

        for (const asOfDate of asOfDates) {
            const count = await buildForSingleAsOf(hotelId, asOfDate, capacity);
            totalCount += count;
        }

        return {
            success: true,
            count: totalCount,
            asOfDatesProcessed: asOfDates.length,
        };
    } catch (err: any) {
        console.error('❌ buildFeaturesDaily error:', err?.message);
        return { success: false, error: err?.message || 'Unknown error' };
    }
}

// ─── Build features for a single as_of_date ─────────────────
async function buildForSingleAsOf(
    hotelId: string,
    asOfDate: Date,
    capacity: number
): Promise<number> {
    const asOfStr = asOfDate.toISOString().split('T')[0];

    // ── 1. Pickup T-30/T-15/T-7/T-5/T-3 (Batch Self-Join, NULL-safe) ──
    // This single query computes all pickup values via LEFT JOINs.
    // Missing snapshot → NULL (NOT 0 via COALESCE)
    const pickupRows = await prisma.$queryRaw<Array<{
        stay_date: Date;
        rooms_otb: number;
        pickup_t30: number | null;
        pickup_t15: number | null;
        pickup_t7: number | null;
        pickup_t5: number | null;
        pickup_t3: number | null;
        has_t30: boolean;
        has_t15: boolean;
        has_t7: boolean;
        has_t5: boolean;
        has_t3: boolean;
    }>>`
    SELECT
      cur.stay_date,
      cur.rooms_otb,
      CASE WHEN t30.rooms_otb IS NOT NULL THEN cur.rooms_otb - t30.rooms_otb ELSE NULL END AS pickup_t30,
      CASE WHEN t15.rooms_otb IS NOT NULL THEN cur.rooms_otb - t15.rooms_otb ELSE NULL END AS pickup_t15,
      CASE WHEN t7.rooms_otb IS NOT NULL THEN cur.rooms_otb - t7.rooms_otb ELSE NULL END AS pickup_t7,
      CASE WHEN t5.rooms_otb IS NOT NULL THEN cur.rooms_otb - t5.rooms_otb ELSE NULL END AS pickup_t5,
      CASE WHEN t3.rooms_otb IS NOT NULL THEN cur.rooms_otb - t3.rooms_otb ELSE NULL END AS pickup_t3,
      (t30.rooms_otb IS NOT NULL) AS has_t30,
      (t15.rooms_otb IS NOT NULL) AS has_t15,
      (t7.rooms_otb IS NOT NULL) AS has_t7,
      (t5.rooms_otb IS NOT NULL) AS has_t5,
      (t3.rooms_otb IS NOT NULL) AS has_t3
    FROM daily_otb cur
    LEFT JOIN daily_otb t30 ON t30.hotel_id = cur.hotel_id
      AND t30.stay_date = cur.stay_date
      AND t30.as_of_date = (cur.as_of_date - INTERVAL '30 days')::date
    LEFT JOIN daily_otb t15 ON t15.hotel_id = cur.hotel_id
      AND t15.stay_date = cur.stay_date
      AND t15.as_of_date = (cur.as_of_date - INTERVAL '15 days')::date
    LEFT JOIN daily_otb t7 ON t7.hotel_id = cur.hotel_id
      AND t7.stay_date = cur.stay_date
      AND t7.as_of_date = (cur.as_of_date - INTERVAL '7 days')::date
    LEFT JOIN daily_otb t5 ON t5.hotel_id = cur.hotel_id
      AND t5.stay_date = cur.stay_date
      AND t5.as_of_date = (cur.as_of_date - INTERVAL '5 days')::date
    LEFT JOIN daily_otb t3 ON t3.hotel_id = cur.hotel_id
      AND t3.stay_date = cur.stay_date
      AND t3.as_of_date = (cur.as_of_date - INTERVAL '3 days')::date
    WHERE cur.hotel_id = ${hotelId}::uuid
      AND cur.as_of_date = ${asOfStr}::date
      AND cur.stay_date >= cur.as_of_date
    ORDER BY cur.stay_date;
  `;

    // ── 2. STLY with nearest-snapshot fallback (batch via LATERAL) ──
    const stlyRows = await prisma.$queryRaw<Array<{
        stay_date: Date;
        stly_rooms_otb: number | null;
        stly_revenue_otb: number | null;
        stly_actual_date: Date | null;
        stly_is_approx: boolean;
    }>>`
    WITH stly_targets AS (
      SELECT
        stay_date,
        stay_date - INTERVAL '364 days' AS target_stay_ly,
        as_of_date - INTERVAL '364 days' AS target_asof_ly
      FROM daily_otb
      WHERE hotel_id = ${hotelId}::uuid
        AND as_of_date = ${asOfStr}::date
        AND stay_date >= as_of_date
    )
    SELECT
      t.stay_date,
      ly.rooms_otb AS stly_rooms_otb,
      ly.revenue_otb AS stly_revenue_otb,
      ly.stay_date AS stly_actual_date,
      CASE WHEN ly.stay_date IS NOT NULL AND ly.stay_date != t.target_stay_ly::date
        THEN true ELSE false END AS stly_is_approx
    FROM stly_targets t
    LEFT JOIN LATERAL (
      SELECT rooms_otb, revenue_otb, stay_date, as_of_date
      FROM daily_otb
      WHERE hotel_id = ${hotelId}::uuid
        AND stay_date BETWEEN (t.target_stay_ly - INTERVAL '7 days')::date
                         AND (t.target_stay_ly + INTERVAL '7 days')::date
        AND EXTRACT(DOW FROM stay_date) = EXTRACT(DOW FROM t.target_stay_ly)
        AND as_of_date <= t.target_asof_ly::date
      ORDER BY as_of_date DESC,
        ABS(stay_date - t.target_stay_ly::date) ASC
      LIMIT 1
    ) ly ON TRUE;
  `;

    // ── 3. Build lookup maps ──
    const stlyMap = new Map<string, {
        stly_rooms_otb: number | null;
        stly_is_approx: boolean;
    }>();

    for (const s of stlyRows) {
        const key = s.stay_date.toISOString().split('T')[0];
        stlyMap.set(key, {
            stly_rooms_otb: s.stly_rooms_otb != null ? Number(s.stly_rooms_otb) : null,
            stly_is_approx: s.stly_is_approx,
        });
    }

    // ── 4. Assemble features ──
    const features: Prisma.FeaturesDailyCreateManyInput[] = [];

    for (const row of pickupRows) {
        const stayStr = row.stay_date.toISOString().split('T')[0];
        const stly = stlyMap.get(stayStr);
        const stlyRooms = stly?.stly_rooms_otb ?? null;

        // pace_vs_ly = current - STLY (NULL if no STLY data)
        const pace_vs_ly = (stlyRooms != null && row.rooms_otb != null)
            ? row.rooms_otb - stlyRooms
            : null;

        // remaining_supply V1 = capacity - rooms_otb
        const remaining_supply = capacity - row.rooms_otb;

        const dow = row.stay_date.getDay();
        const month = row.stay_date.getMonth() + 1;
        const is_weekend = dow === 5 || dow === 6; // Fri/Sat (D6 decision)

        // pickup_source trace
        const pickup_source: Record<string, string> = {};
        if (row.has_t30) pickup_source.t30 = 'exact';
        if (row.has_t15) pickup_source.t15 = 'exact';
        if (row.has_t7) pickup_source.t7 = 'exact';
        if (row.has_t5) pickup_source.t5 = 'exact';
        if (row.has_t3) pickup_source.t3 = 'exact';

        features.push({
            hotel_id: hotelId,
            as_of_date: asOfDate,
            stay_date: row.stay_date,
            dow,
            month,
            is_weekend,
            pickup_t30: row.pickup_t30 != null ? Number(row.pickup_t30) : null,
            pickup_t15: row.pickup_t15 != null ? Number(row.pickup_t15) : null,
            pickup_t7: row.pickup_t7 != null ? Number(row.pickup_t7) : null,
            pickup_t5: row.pickup_t5 != null ? Number(row.pickup_t5) : null,
            pickup_t3: row.pickup_t3 != null ? Number(row.pickup_t3) : null,
            pace_vs_ly,
            remaining_supply,
            stly_is_approx: stly?.stly_is_approx ?? null,
            pickup_source: Object.keys(pickup_source).length > 0 ? pickup_source : Prisma.JsonNull,
        });
    }

    // ── 5. Atomic DELETE + INSERT ──
    await prisma.$transaction([
        prisma.featuresDaily.deleteMany({
            where: { hotel_id: hotelId, as_of_date: asOfDate },
        }),
        prisma.featuresDaily.createMany({
            data: features,
        }),
    ]);

    return features.length;
}
