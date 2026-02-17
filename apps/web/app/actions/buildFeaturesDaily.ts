'use server';

import prisma from '../../lib/prisma';
import { getActiveHotelId } from '../../lib/pricing/get-hotel';
import { revalidatePath } from 'next/cache';
import { validateOTBData } from './validateOTBData';
import { Prisma } from '@prisma/client';

/**
 * Phase 01: buildFeaturesDaily - Populate features_daily table
 * 
 * Features computed:
 * - STLY (Same Time Last Year) with nearest-snapshot fallback (D11, D12)
 * - Pace pickup (T-30, T-15, T-7, T-5, T-3) strict exact match (D13)
 * - Pace vs LY (pace_vs_ly = rooms_otb - stly_rooms_otb, absolute diff)
 * - Remaining Supply (capacity - rooms_otb)
 * 
 * 🚨 GATED VALIDATION:
 * Must call validateOTBData() first. If valid=false → abort.
 * 
 * 🔒 Locked Decisions:
 * D11: Explicit ::date casting for STLY
 * D12: ORDER BY as_of_date DESC first, then stay_date closeness
 * D13: Strict exact T-x match, NULL if missing
 * D14: ON CONFLICT upsert (race-safe)
 * D15: Backfill chunking (7 as_of_dates per batch)
 */

export interface BuildFeaturesResult {
    success: boolean;
    rowsBuilt?: number;
    message?: string;
    issues?: Array<{
        type: 'FAIL' | 'WARNING';
        code: string;
        message: string;
    }>;
}

// D15: Backfill chunk size
const BACKFILL_CHUNK_SIZE = 7;

export async function buildFeaturesDaily(
    hotelId?: string,
    asOfDate?: Date | string,
    skipValidation: boolean = false // For backfill performance
): Promise<BuildFeaturesResult> {
    // Step 0: Get active hotel (RBAC)
    const resolvedHotelId = hotelId || await getActiveHotelId();
    if (!resolvedHotelId) {
        return {
            success: false,
            message: 'Không tìm thấy hotel. Vui lòng chọn hotel trước.',
        };
    }

    // Timezone-safe date extraction:
    // - String 'YYYY-MM-DD': use directly (no timezone shift)
    // - Date object: extract UTC date to avoid local timezone issues
    let snapshotDateStr: string;
    if (typeof asOfDate === 'string') {
        snapshotDateStr = asOfDate.split('T')[0]; // 'YYYY-MM-DD' or full ISO
    } else {
        const snapshotDate = asOfDate || new Date();
        snapshotDateStr = snapshotDate.toISOString().split('T')[0];
    }

    // Step 1: GATED VALIDATION (required before build, unless backfill)
    if (!skipValidation) {
        const validation = await validateOTBData(resolvedHotelId, new Date(snapshotDateStr + 'T00:00:00Z'));
        if (!validation.valid) {
            return {
                success: false,
                message: `Validation failed với ${validation.stats.failCount} lỗi. Không thể build features từ data bẩn.`,
                issues: validation.issues.map(i => ({
                    type: i.severity === 'FAIL' ? 'FAIL' as const : 'WARNING' as const,
                    code: i.code,
                    message: i.message
                }))
            };
        }
    }

    try {
        // Step 2: Get hotel capacity for remaining supply
        const hotel = await prisma.hotel.findUnique({
            where: { hotel_id: resolvedHotelId },
            select: { capacity: true }
        });
        const capacity = hotel?.capacity || 100;

        // Step 3: Build features using batch SQL (all-in-one query)
        // D11: Explicit ::date casting
        // D12: ORDER BY as_of_date DESC, then stay_date closeness
        // D13: Strict T-x match (no nearest fallback for pace)
        // D14: ON CONFLICT upsert for race-safety

        const result = await prisma.$executeRaw`
            -- Phase 01 v2: buildFeaturesDaily - LATERAL nearest + deltaDays scale
            WITH 
            -- Current OTB data for this snapshot
            current_otb AS (
                SELECT 
                    hotel_id,
                    as_of_date,
                    stay_date,
                    rooms_otb,
                    revenue_otb,
                    EXTRACT(DOW FROM stay_date) AS dow,
                    EXTRACT(MONTH FROM stay_date) AS month,
                    CASE WHEN EXTRACT(DOW FROM stay_date) IN (5, 6) THEN true ELSE false END AS is_weekend
                FROM daily_otb
                WHERE hotel_id = ${resolvedHotelId}::uuid
                  AND as_of_date = ${snapshotDateStr}::date
                  AND stay_date >= ${snapshotDateStr}::date
            ),
            
            -- STLY: Same as-of Last Year with DOW fallback (D11, D12) — unchanged
            stly_data AS (
                SELECT DISTINCT ON (c.stay_date)
                    c.stay_date,
                    ly.rooms_otb AS stly_rooms_otb,
                    ly.revenue_otb AS stly_revenue_otb,
                    (ly.stay_date != (c.stay_date - 364)::date) AS stly_is_approx
                FROM current_otb c
                LEFT JOIN LATERAL (
                    SELECT rooms_otb, revenue_otb, stay_date
                    FROM daily_otb
                    WHERE hotel_id = ${resolvedHotelId}::uuid
                      AND stay_date BETWEEN (c.stay_date - 364 - 7)::date AND (c.stay_date - 364 + 7)::date
                      AND EXTRACT(DOW FROM stay_date) = EXTRACT(DOW FROM c.stay_date)
                      AND as_of_date <= (c.as_of_date - 364)::date
                    ORDER BY as_of_date DESC, ABS(stay_date - (c.stay_date - 364)::date) ASC
                    LIMIT 1
                ) ly ON TRUE
            ),
            
            -- Pace pickup v2: LATERAL nearest-neighbor + deltaDays scale
            -- BA rules: exact-first ORDER BY, ::numeric cast, NULLIF(delta,0), no future leakage
            pace_data AS (
                SELECT 
                    c.stay_date,
                    c.rooms_otb,
                    -- T-30: scale to 30-day equiv, ::numeric to avoid int division
                    CASE WHEN t30.rooms_otb IS NOT NULL AND t30.delta_days > 0 THEN
                        ROUND(((c.rooms_otb - t30.rooms_otb)::numeric / NULLIF(t30.delta_days, 0)) * 30)
                    ELSE NULL END AS pickup_t30,
                    t30.src AS t30_src, t30.delta_days AS t30_delta, t30.snap_date AS t30_snap,
                    -- T-15
                    CASE WHEN t15.rooms_otb IS NOT NULL AND t15.delta_days > 0 THEN
                        ROUND(((c.rooms_otb - t15.rooms_otb)::numeric / NULLIF(t15.delta_days, 0)) * 15)
                    ELSE NULL END AS pickup_t15,
                    t15.src AS t15_src, t15.delta_days AS t15_delta, t15.snap_date AS t15_snap,
                    -- T-7
                    CASE WHEN t7.rooms_otb IS NOT NULL AND t7.delta_days > 0 THEN
                        ROUND(((c.rooms_otb - t7.rooms_otb)::numeric / NULLIF(t7.delta_days, 0)) * 7)
                    ELSE NULL END AS pickup_t7,
                    t7.src AS t7_src, t7.delta_days AS t7_delta, t7.snap_date AS t7_snap,
                    -- T-5
                    CASE WHEN t5.rooms_otb IS NOT NULL AND t5.delta_days > 0 THEN
                        ROUND(((c.rooms_otb - t5.rooms_otb)::numeric / NULLIF(t5.delta_days, 0)) * 5)
                    ELSE NULL END AS pickup_t5,
                    t5.src AS t5_src, t5.delta_days AS t5_delta, t5.snap_date AS t5_snap,
                    -- T-3
                    CASE WHEN t3.rooms_otb IS NOT NULL AND t3.delta_days > 0 THEN
                        ROUND(((c.rooms_otb - t3.rooms_otb)::numeric / NULLIF(t3.delta_days, 0)) * 3)
                    ELSE NULL END AS pickup_t3,
                    t3.src AS t3_src, t3.delta_days AS t3_delta, t3.snap_date AS t3_snap
                FROM current_otb c
                -- T-30: window ±5 days (25-35), no future snapshot
                LEFT JOIN LATERAL (
                    SELECT rooms_otb,
                           (c.as_of_date::date - as_of_date::date) AS delta_days,
                           as_of_date AS snap_date,
                           CASE WHEN as_of_date = (c.as_of_date - 30)::date THEN 'exact' ELSE 'nearest' END AS src
                    FROM daily_otb
                    WHERE hotel_id = c.hotel_id AND stay_date = c.stay_date
                      AND as_of_date BETWEEN (c.as_of_date - 35)::date AND (c.as_of_date - 25)::date
                    ORDER BY (as_of_date = (c.as_of_date - 30)::date) DESC,
                             ABS(as_of_date - (c.as_of_date - 30)::date) ASC
                    LIMIT 1
                ) t30 ON TRUE
                -- T-15: window ±4 days (11-19)
                LEFT JOIN LATERAL (
                    SELECT rooms_otb,
                           (c.as_of_date::date - as_of_date::date) AS delta_days,
                           as_of_date AS snap_date,
                           CASE WHEN as_of_date = (c.as_of_date - 15)::date THEN 'exact' ELSE 'nearest' END AS src
                    FROM daily_otb
                    WHERE hotel_id = c.hotel_id AND stay_date = c.stay_date
                      AND as_of_date BETWEEN (c.as_of_date - 19)::date AND (c.as_of_date - 11)::date
                    ORDER BY (as_of_date = (c.as_of_date - 15)::date) DESC,
                             ABS(as_of_date - (c.as_of_date - 15)::date) ASC
                    LIMIT 1
                ) t15 ON TRUE
                -- T-7: window ±3 days (4-10)
                LEFT JOIN LATERAL (
                    SELECT rooms_otb,
                           (c.as_of_date::date - as_of_date::date) AS delta_days,
                           as_of_date AS snap_date,
                           CASE WHEN as_of_date = (c.as_of_date - 7)::date THEN 'exact' ELSE 'nearest' END AS src
                    FROM daily_otb
                    WHERE hotel_id = c.hotel_id AND stay_date = c.stay_date
                      AND as_of_date BETWEEN (c.as_of_date - 10)::date AND (c.as_of_date - 4)::date
                    ORDER BY (as_of_date = (c.as_of_date - 7)::date) DESC,
                             ABS(as_of_date - (c.as_of_date - 7)::date) ASC
                    LIMIT 1
                ) t7 ON TRUE
                -- T-5: window ±2 days (3-7)
                LEFT JOIN LATERAL (
                    SELECT rooms_otb,
                           (c.as_of_date::date - as_of_date::date) AS delta_days,
                           as_of_date AS snap_date,
                           CASE WHEN as_of_date = (c.as_of_date - 5)::date THEN 'exact' ELSE 'nearest' END AS src
                    FROM daily_otb
                    WHERE hotel_id = c.hotel_id AND stay_date = c.stay_date
                      AND as_of_date BETWEEN (c.as_of_date - 7)::date AND (c.as_of_date - 3)::date
                    ORDER BY (as_of_date = (c.as_of_date - 5)::date) DESC,
                             ABS(as_of_date - (c.as_of_date - 5)::date) ASC
                    LIMIT 1
                ) t5 ON TRUE
                -- T-3: window ±1 day (2-4)
                LEFT JOIN LATERAL (
                    SELECT rooms_otb,
                           (c.as_of_date::date - as_of_date::date) AS delta_days,
                           as_of_date AS snap_date,
                           CASE WHEN as_of_date = (c.as_of_date - 3)::date THEN 'exact' ELSE 'nearest' END AS src
                    FROM daily_otb
                    WHERE hotel_id = c.hotel_id AND stay_date = c.stay_date
                      AND as_of_date BETWEEN (c.as_of_date - 4)::date AND (c.as_of_date - 2)::date
                    ORDER BY (as_of_date = (c.as_of_date - 3)::date) DESC,
                             ABS(as_of_date - (c.as_of_date - 3)::date) ASC
                    LIMIT 1
                ) t3 ON TRUE
            ),
            
            -- Combine all features
            features AS (
                SELECT 
                    c.hotel_id,
                    c.as_of_date,
                    c.stay_date,
                    c.dow::int,
                    c.is_weekend,
                    c.month::int,
                    -- Revenue fields
                    c.revenue_otb,
                    s.stly_revenue_otb,
                    -- Pickup: NULL preserved (never coalesce to 0)
                    p.pickup_t30,
                    p.pickup_t15,
                    p.pickup_t7,
                    p.pickup_t5,
                    p.pickup_t3,
                    -- pace_vs_ly: absolute room diff (UI converts to %)
                    CASE WHEN s.stly_rooms_otb IS NOT NULL 
                         THEN c.rooms_otb - s.stly_rooms_otb 
                         ELSE NULL END AS pace_vs_ly,
                    -- Remaining supply
                    ${capacity} - c.rooms_otb AS remaining_supply,
                    s.stly_is_approx,
                    -- pickup_source JSON metadata
                    jsonb_strip_nulls(jsonb_build_object(
                        't30', CASE WHEN p.pickup_t30 IS NOT NULL THEN jsonb_build_object('src', p.t30_src, 'delta', p.t30_delta, 'as_of', p.t30_snap::text) ELSE NULL END,
                        't15', CASE WHEN p.pickup_t15 IS NOT NULL THEN jsonb_build_object('src', p.t15_src, 'delta', p.t15_delta, 'as_of', p.t15_snap::text) ELSE NULL END,
                        't7',  CASE WHEN p.pickup_t7 IS NOT NULL THEN jsonb_build_object('src', p.t7_src, 'delta', p.t7_delta, 'as_of', p.t7_snap::text) ELSE NULL END,
                        't5',  CASE WHEN p.pickup_t5 IS NOT NULL THEN jsonb_build_object('src', p.t5_src, 'delta', p.t5_delta, 'as_of', p.t5_snap::text) ELSE NULL END,
                        't3',  CASE WHEN p.pickup_t3 IS NOT NULL THEN jsonb_build_object('src', p.t3_src, 'delta', p.t3_delta, 'as_of', p.t3_snap::text) ELSE NULL END
                    )) AS pickup_source,
                    NOW() AS created_at
                FROM current_otb c
                LEFT JOIN stly_data s ON s.stay_date = c.stay_date
                LEFT JOIN pace_data p ON p.stay_date = c.stay_date
            )

            
            -- D14: ON CONFLICT upsert (race-safe)
            INSERT INTO features_daily (
                hotel_id, as_of_date, stay_date, dow, is_weekend, month,
                revenue_otb, stly_revenue_otb,
                pickup_t30, pickup_t15, pickup_t7, pickup_t5, pickup_t3,
                pace_vs_ly, remaining_supply, stly_is_approx, pickup_source, created_at
            )
            SELECT * FROM features
            ON CONFLICT (hotel_id, as_of_date, stay_date)
            DO UPDATE SET
                dow = EXCLUDED.dow,
                is_weekend = EXCLUDED.is_weekend,
                month = EXCLUDED.month,
                revenue_otb = EXCLUDED.revenue_otb,
                stly_revenue_otb = EXCLUDED.stly_revenue_otb,
                pickup_t30 = EXCLUDED.pickup_t30,
                pickup_t15 = EXCLUDED.pickup_t15,
                pickup_t7 = EXCLUDED.pickup_t7,
                pickup_t5 = EXCLUDED.pickup_t5,
                pickup_t3 = EXCLUDED.pickup_t3,
                pace_vs_ly = EXCLUDED.pace_vs_ly,
                remaining_supply = EXCLUDED.remaining_supply,
                stly_is_approx = EXCLUDED.stly_is_approx,
                pickup_source = EXCLUDED.pickup_source,
                created_at = EXCLUDED.created_at;
        `;


        const rowCount = Number(result);
        console.log(`buildFeaturesDaily: ${rowCount} features built for ${snapshotDateStr}`);

        revalidatePath('/data');
        revalidatePath('/analytics');

        return {
            success: true,
            rowsBuilt: rowCount,
            message: `Đã build ${rowCount} features cho ${snapshotDateStr}`,
        };

    } catch (error) {
        console.error('buildFeaturesDaily error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Quick action: rebuild features for current snapshot
 */
export async function rebuildFeatures(): Promise<BuildFeaturesResult> {
    return buildFeaturesDaily();
}

/**
 * D15: Backfill historical features with chunking + resume
 */
export interface BackfillResult {
    success: boolean;
    totalProcessed: number;
    totalChunks: number;
    lastProcessedDate?: string;
    errors?: string[];
    message?: string;
}

export async function backfillFeatures(
    hotelId?: string,
    resumeFromDate?: Date
): Promise<BackfillResult> {
    const resolvedHotelId = hotelId || await getActiveHotelId();
    if (!resolvedHotelId) {
        return {
            success: false,
            totalProcessed: 0,
            totalChunks: 0,
            message: 'Không tìm thấy hotel.',
        };
    }

    try {
        // Get distinct as_of_dates from daily_otb
        const asOfDates = await prisma.dailyOTB.findMany({
            where: {
                hotel_id: resolvedHotelId,
                ...(resumeFromDate ? { as_of_date: { gt: resumeFromDate } } : {})
            },
            select: { as_of_date: true },
            distinct: ['as_of_date'],
            orderBy: { as_of_date: 'asc' }
        });

        if (asOfDates.length === 0) {
            return {
                success: true,
                totalProcessed: 0,
                totalChunks: 0,
                message: 'Không có as_of_date nào cần backfill.',
            };
        }

        const totalChunks = Math.ceil(asOfDates.length / BACKFILL_CHUNK_SIZE);
        let processed = 0;
        let lastDate: Date | null = null;
        const errors: string[] = [];

        // D15: Process in chunks
        for (let i = 0; i < asOfDates.length; i += BACKFILL_CHUNK_SIZE) {
            const chunk = asOfDates.slice(i, i + BACKFILL_CHUNK_SIZE);

            for (const { as_of_date } of chunk) {
                try {
                    // Skip validation for backfill (too slow)
                    await buildFeaturesDaily(resolvedHotelId, as_of_date, true);
                    processed++;
                    lastDate = as_of_date;
                } catch (e) {
                    errors.push(`${as_of_date.toISOString().split('T')[0]}: ${e}`);
                }
            }

            // Log progress
            console.log(`Backfill progress: ${processed}/${asOfDates.length} (chunk ${Math.floor(i / BACKFILL_CHUNK_SIZE) + 1}/${totalChunks})`);
        }

        revalidatePath('/data');
        revalidatePath('/analytics');

        return {
            success: errors.length === 0,
            totalProcessed: processed,
            totalChunks,
            lastProcessedDate: lastDate?.toISOString().split('T')[0],
            errors: errors.length > 0 ? errors : undefined,
            message: `Backfill hoàn tất: ${processed}/${asOfDates.length} as_of_dates`,
        };

    } catch (error) {
        console.error('backfillFeatures error:', error);
        return {
            success: false,
            totalProcessed: 0,
            totalChunks: 0,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
