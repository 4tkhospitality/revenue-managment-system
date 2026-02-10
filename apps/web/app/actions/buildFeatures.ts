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

    // ── 1. Pickup v2: LATERAL nearest-neighbor + deltaDays scale (NULL-safe) ──
    // BA rules: exact-first ORDER BY, ::numeric cast, NULLIF(delta,0), no future leakage
    const pickupRows = await prisma.$queryRaw<Array<{
        stay_date: Date;
        rooms_otb: number;
        pickup_t30: number | null;
        pickup_t15: number | null;
        pickup_t7: number | null;
        pickup_t5: number | null;
        pickup_t3: number | null;
        t30_src: string | null; t30_delta: number | null; t30_snap: string | null;
        t15_src: string | null; t15_delta: number | null; t15_snap: string | null;
        t7_src: string | null; t7_delta: number | null; t7_snap: string | null;
        t5_src: string | null; t5_delta: number | null; t5_snap: string | null;
        t3_src: string | null; t3_delta: number | null; t3_snap: string | null;
    }>>`
    SELECT
      cur.stay_date,
      cur.rooms_otb,
      -- T-30: scale to 30-day equiv
      CASE WHEN t30.rooms_otb IS NOT NULL AND t30.delta_days > 0 THEN
        ROUND(((cur.rooms_otb - t30.rooms_otb)::numeric / NULLIF(t30.delta_days, 0)) * 30)
      ELSE NULL END AS pickup_t30,
      t30.src AS t30_src, t30.delta_days AS t30_delta, t30.snap_date::text AS t30_snap,
      -- T-15
      CASE WHEN t15.rooms_otb IS NOT NULL AND t15.delta_days > 0 THEN
        ROUND(((cur.rooms_otb - t15.rooms_otb)::numeric / NULLIF(t15.delta_days, 0)) * 15)
      ELSE NULL END AS pickup_t15,
      t15.src AS t15_src, t15.delta_days AS t15_delta, t15.snap_date::text AS t15_snap,
      -- T-7
      CASE WHEN t7.rooms_otb IS NOT NULL AND t7.delta_days > 0 THEN
        ROUND(((cur.rooms_otb - t7.rooms_otb)::numeric / NULLIF(t7.delta_days, 0)) * 7)
      ELSE NULL END AS pickup_t7,
      t7.src AS t7_src, t7.delta_days AS t7_delta, t7.snap_date::text AS t7_snap,
      -- T-5
      CASE WHEN t5.rooms_otb IS NOT NULL AND t5.delta_days > 0 THEN
        ROUND(((cur.rooms_otb - t5.rooms_otb)::numeric / NULLIF(t5.delta_days, 0)) * 5)
      ELSE NULL END AS pickup_t5,
      t5.src AS t5_src, t5.delta_days AS t5_delta, t5.snap_date::text AS t5_snap,
      -- T-3
      CASE WHEN t3.rooms_otb IS NOT NULL AND t3.delta_days > 0 THEN
        ROUND(((cur.rooms_otb - t3.rooms_otb)::numeric / NULLIF(t3.delta_days, 0)) * 3)
      ELSE NULL END AS pickup_t3,
      t3.src AS t3_src, t3.delta_days AS t3_delta, t3.snap_date::text AS t3_snap
    FROM daily_otb cur
    -- T-30: window ±5 days (25-35)
    LEFT JOIN LATERAL (
        SELECT rooms_otb,
               (cur.as_of_date::date - as_of_date::date) AS delta_days,
               as_of_date AS snap_date,
               CASE WHEN as_of_date = (cur.as_of_date - INTERVAL '30 days')::date THEN 'exact' ELSE 'nearest' END AS src
        FROM daily_otb
        WHERE hotel_id = cur.hotel_id AND stay_date = cur.stay_date
          AND as_of_date BETWEEN (cur.as_of_date - INTERVAL '35 days')::date AND (cur.as_of_date - INTERVAL '25 days')::date
        ORDER BY (as_of_date = (cur.as_of_date - INTERVAL '30 days')::date) DESC,
                 ABS(as_of_date - (cur.as_of_date - INTERVAL '30 days')::date) ASC
        LIMIT 1
    ) t30 ON TRUE
    -- T-15: window ±4 days (11-19)
    LEFT JOIN LATERAL (
        SELECT rooms_otb,
               (cur.as_of_date::date - as_of_date::date) AS delta_days,
               as_of_date AS snap_date,
               CASE WHEN as_of_date = (cur.as_of_date - INTERVAL '15 days')::date THEN 'exact' ELSE 'nearest' END AS src
        FROM daily_otb
        WHERE hotel_id = cur.hotel_id AND stay_date = cur.stay_date
          AND as_of_date BETWEEN (cur.as_of_date - INTERVAL '19 days')::date AND (cur.as_of_date - INTERVAL '11 days')::date
        ORDER BY (as_of_date = (cur.as_of_date - INTERVAL '15 days')::date) DESC,
                 ABS(as_of_date - (cur.as_of_date - INTERVAL '15 days')::date) ASC
        LIMIT 1
    ) t15 ON TRUE
    -- T-7: window ±3 days (4-10)
    LEFT JOIN LATERAL (
        SELECT rooms_otb,
               (cur.as_of_date::date - as_of_date::date) AS delta_days,
               as_of_date AS snap_date,
               CASE WHEN as_of_date = (cur.as_of_date - INTERVAL '7 days')::date THEN 'exact' ELSE 'nearest' END AS src
        FROM daily_otb
        WHERE hotel_id = cur.hotel_id AND stay_date = cur.stay_date
          AND as_of_date BETWEEN (cur.as_of_date - INTERVAL '10 days')::date AND (cur.as_of_date - INTERVAL '4 days')::date
        ORDER BY (as_of_date = (cur.as_of_date - INTERVAL '7 days')::date) DESC,
                 ABS(as_of_date - (cur.as_of_date - INTERVAL '7 days')::date) ASC
        LIMIT 1
    ) t7 ON TRUE
    -- T-5: window ±2 days (3-7)
    LEFT JOIN LATERAL (
        SELECT rooms_otb,
               (cur.as_of_date::date - as_of_date::date) AS delta_days,
               as_of_date AS snap_date,
               CASE WHEN as_of_date = (cur.as_of_date - INTERVAL '5 days')::date THEN 'exact' ELSE 'nearest' END AS src
        FROM daily_otb
        WHERE hotel_id = cur.hotel_id AND stay_date = cur.stay_date
          AND as_of_date BETWEEN (cur.as_of_date - INTERVAL '7 days')::date AND (cur.as_of_date - INTERVAL '3 days')::date
        ORDER BY (as_of_date = (cur.as_of_date - INTERVAL '5 days')::date) DESC,
                 ABS(as_of_date - (cur.as_of_date - INTERVAL '5 days')::date) ASC
        LIMIT 1
    ) t5 ON TRUE
    -- T-3: window ±1 day (2-4)
    LEFT JOIN LATERAL (
        SELECT rooms_otb,
               (cur.as_of_date::date - as_of_date::date) AS delta_days,
               as_of_date AS snap_date,
               CASE WHEN as_of_date = (cur.as_of_date - INTERVAL '3 days')::date THEN 'exact' ELSE 'nearest' END AS src
        FROM daily_otb
        WHERE hotel_id = cur.hotel_id AND stay_date = cur.stay_date
          AND as_of_date BETWEEN (cur.as_of_date - INTERVAL '4 days')::date AND (cur.as_of_date - INTERVAL '2 days')::date
        ORDER BY (as_of_date = (cur.as_of_date - INTERVAL '3 days')::date) DESC,
                 ABS(as_of_date - (cur.as_of_date - INTERVAL '3 days')::date) ASC
        LIMIT 1
    ) t3 ON TRUE
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

        // pickup_source trace — rich metadata from LATERAL
        const pickup_source: Record<string, any> = {};
        if (row.t30_src) pickup_source.t30 = { src: row.t30_src, delta: Number(row.t30_delta), as_of: row.t30_snap };
        if (row.t15_src) pickup_source.t15 = { src: row.t15_src, delta: Number(row.t15_delta), as_of: row.t15_snap };
        if (row.t7_src) pickup_source.t7 = { src: row.t7_src, delta: Number(row.t7_delta), as_of: row.t7_snap };
        if (row.t5_src) pickup_source.t5 = { src: row.t5_src, delta: Number(row.t5_delta), as_of: row.t5_snap };
        if (row.t3_src) pickup_source.t3 = { src: row.t3_src, delta: Number(row.t3_delta), as_of: row.t3_snap };

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
