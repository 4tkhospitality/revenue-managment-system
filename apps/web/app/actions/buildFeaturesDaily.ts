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
 * - Pace vs LY (pace_vs_ly_rooms = rooms_otb - stly_rooms_otb)
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
    asOfDate?: Date,
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

    const snapshotDate = asOfDate || new Date();
    snapshotDate.setHours(0, 0, 0, 0);
    const snapshotDateStr = snapshotDate.toISOString().split('T')[0];

    // Step 1: GATED VALIDATION (required before build, unless backfill)
    if (!skipValidation) {
        const validation = await validateOTBData(resolvedHotelId, snapshotDate);
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
            -- Phase 01: buildFeaturesDaily - Full batch upsert
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
            
            -- STLY: Same as-of Last Year with DOW fallback (D11, D12)
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
                      -- D11: Explicit date arithmetic
                      AND stay_date BETWEEN (c.stay_date - 364 - 7)::date AND (c.stay_date - 364 + 7)::date
                      -- Same DOW
                      AND EXTRACT(DOW FROM stay_date) = EXTRACT(DOW FROM c.stay_date)
                      -- D12: as_of <= target (same relative point in time LY)
                      AND as_of_date <= (c.as_of_date - 364)::date
                    -- D12: ORDER BY as_of closeness first, then stay_date closeness
                    -- Note: date - date returns integer (days) in PostgreSQL
                    ORDER BY as_of_date DESC, ABS(stay_date - (c.stay_date - 364)::date) ASC
                    LIMIT 1
                ) ly ON TRUE
            ),
            
            -- Pace pickup: Strict exact T-x match (D13)
            pace_data AS (
                SELECT 
                    c.stay_date,
                    -- D13: Exact T-x, NULL if no matching snapshot
                    c.rooms_otb - t30.rooms_otb AS pickup_t30,
                    c.rooms_otb - t15.rooms_otb AS pickup_t15,
                    c.rooms_otb - t7.rooms_otb AS pickup_t7,
                    c.rooms_otb - t5.rooms_otb AS pickup_t5,
                    c.rooms_otb - t3.rooms_otb AS pickup_t3
                FROM current_otb c
                LEFT JOIN daily_otb t30 ON t30.hotel_id = c.hotel_id
                    AND t30.stay_date = c.stay_date
                    AND t30.as_of_date = (c.as_of_date - 30)::date
                LEFT JOIN daily_otb t15 ON t15.hotel_id = c.hotel_id
                    AND t15.stay_date = c.stay_date
                    AND t15.as_of_date = (c.as_of_date - 15)::date
                LEFT JOIN daily_otb t7 ON t7.hotel_id = c.hotel_id
                    AND t7.stay_date = c.stay_date
                    AND t7.as_of_date = (c.as_of_date - 7)::date
                LEFT JOIN daily_otb t5 ON t5.hotel_id = c.hotel_id
                    AND t5.stay_date = c.stay_date
                    AND t5.as_of_date = (c.as_of_date - 5)::date
                LEFT JOIN daily_otb t3 ON t3.hotel_id = c.hotel_id
                    AND t3.stay_date = c.stay_date
                    AND t3.as_of_date = (c.as_of_date - 3)::date
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
                    -- D16: Revenue fields
                    c.revenue_otb,
                    s.stly_revenue_otb,
                    p.pickup_t30,
                    p.pickup_t15,
                    p.pickup_t7,
                    p.pickup_t5,
                    p.pickup_t3,
                    -- pace_vs_ly: NULL if no STLY (don't COALESCE to 0!)
                    CASE WHEN s.stly_rooms_otb IS NOT NULL 
                         THEN c.rooms_otb - s.stly_rooms_otb 
                         ELSE NULL END AS pace_vs_ly,
                    -- Remaining supply: allow negative for overbooking visibility
                    ${capacity} - c.rooms_otb AS remaining_supply,
                    s.stly_is_approx,
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
                pace_vs_ly, remaining_supply, stly_is_approx, created_at
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
