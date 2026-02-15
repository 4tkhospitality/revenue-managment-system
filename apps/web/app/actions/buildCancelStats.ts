'use server';

import prisma from '../../lib/prisma';
import { getActiveHotelId } from '../../lib/pricing/get-hotel';
import { Prisma } from '@prisma/client';
import {
    daysToLeadBucket,
    smoothRate,
    clampRate,
    getConfidence,
    seasonCodeToLabel,
    type SeasonDateRange,
} from '../../lib/engine/cancelForecast';

// ─── Types ──────────────────────────────────────────────────

interface BuildCancelStatsResult {
    success: boolean;
    bucketsCreated?: number;
    dataRowCount?: number;
    unknownPct?: number;
    windowStart?: string;
    windowEnd?: string;
    error?: string;
}

interface ExplodedRow {
    booking_lead_bucket: string;
    dow: number;
    season_label: string;
    segment: string;
    rooms: number;
    cancelled_rooms: number;
}

// ─── Constants ──────────────────────────────────────────────

const LOOKBACK_DAYS = 365; // Training window: 1 year of historical data
const MAPPING_VERSION = 'v1';

// ─── Main ───────────────────────────────────────────────────

/**
 * Build cancel rate statistics for a hotel from reservations_raw.
 * 
 * Process:
 * 1. Explode reservations to per-stay-date grain (matching daily_otb)
 * 2. Bucket by booking_lead_days × DOW × season × segment
 * 3. Apply Bayesian smoothing with parent rate
 * 4. Upsert into cancel_rate_stats
 * 5. Create aggregated "ALL" segment buckets
 * 6. Log UNKNOWN% — warn if > 20%
 */
export async function buildCancelStats(
    hotelIdParam?: string
): Promise<BuildCancelStatsResult> {
    try {
        const hotelId = hotelIdParam || await getActiveHotelId();
        if (!hotelId) {
            return { success: false, error: 'No active hotel found' };
        }

        // 1. Get hotel's season configs
        const seasonConfigs = await prisma.seasonConfig.findMany({
            where: { hotel_id: hotelId, is_active: true },
            orderBy: { priority: 'desc' },
        });

        const seasons: SeasonDateRange[] = seasonConfigs.flatMap(sc => {
            const ranges = sc.date_ranges as Array<{ start: string; end: string }>;
            return ranges.map(r => ({
                code: sc.code,
                label: seasonCodeToLabel(sc.code),
                start: r.start.slice(5), // 'YYYY-MM-DD' → 'MM-DD'
                end: r.end.slice(5),
                priority: sc.priority,
            }));
        });

        // 2. Fetch reservations with book_time (training window)
        const windowEnd = new Date();
        const windowStart = new Date();
        windowStart.setDate(windowStart.getDate() - LOOKBACK_DAYS);

        // Use raw SQL for generate_series explosion
        const explodedRows = await prisma.$queryRaw<Array<{
            hotel_id: string;
            rooms: number;
            segment: string | null;
            book_time: Date;
            cancel_time: Date | null;
            arrival_date: Date;
            stay_date: Date;
            booking_lead_days: number;
        }>>(Prisma.sql`
            SELECT
                r.hotel_id,
                r.rooms,
                r.segment,
                r.book_time,
                r.cancel_time,
                r.arrival_date,
                d.stay_date::date AS stay_date,
                (r.arrival_date - r.book_time::date) AS booking_lead_days
            FROM reservations_raw r
            CROSS JOIN LATERAL generate_series(
                r.arrival_date,
                r.departure_date - INTERVAL '1 day',
                INTERVAL '1 day'
            ) AS d(stay_date)
            WHERE r.hotel_id = ${hotelId}::uuid
              AND r.book_time IS NOT NULL
              AND r.book_time >= ${windowStart}
              AND r.book_time <= ${windowEnd}
        `);

        if (explodedRows.length === 0) {
            return {
                success: true,
                bucketsCreated: 0,
                dataRowCount: 0,
                error: 'No reservation data with book_time found',
            };
        }

        // 3. Bucket the exploded rows
        const bucketMap = new Map<string, {
            total_rooms: number;
            cancelled_rooms: number;
            booking_lead_bucket: string;
            dow: number;
            season_label: string;
            segment: string;
        }>();

        let unknownCount = 0;

        for (const row of explodedRows) {
            const segment = row.segment || 'UNKNOWN';
            if (segment === 'UNKNOWN') unknownCount++;

            const stayDate = new Date(row.stay_date);
            const leadBucket = daysToLeadBucket(Number(row.booking_lead_days));
            const dow = stayDate.getDay();
            const seasonLabel = getSeasonLabel(stayDate, seasons);

            const key = `${leadBucket}|${dow}|${seasonLabel}|${segment}`;

            const existing = bucketMap.get(key);
            const cancelledRooms = row.cancel_time ? row.rooms : 0;

            if (existing) {
                existing.total_rooms += row.rooms;
                existing.cancelled_rooms += cancelledRooms;
            } else {
                bucketMap.set(key, {
                    total_rooms: row.rooms,
                    cancelled_rooms: cancelledRooms,
                    booking_lead_bucket: leadBucket,
                    dow,
                    season_label: seasonLabel,
                    segment,
                });
            }
        }

        const unknownPct = explodedRows.length > 0
            ? (unknownCount / explodedRows.length) * 100
            : 0;

        if (unknownPct > 20) {
            console.warn(`[CancelStats] ⚠️ UNKNOWN segment = ${unknownPct.toFixed(1)}% (>${20}% threshold). Check inferSegment() mapping.`);
        }

        // 4. Compute global parent rate for Bayesian smoothing
        let globalTotalRooms = 0;
        let globalCancelledRooms = 0;
        for (const b of bucketMap.values()) {
            globalTotalRooms += b.total_rooms;
            globalCancelledRooms += b.cancelled_rooms;
        }
        const globalRate = globalTotalRooms > 0
            ? globalCancelledRooms / globalTotalRooms
            : 0.15;

        // 5. Create "ALL" segment aggregates per (lead × dow × season)
        const allSegmentMap = new Map<string, {
            total_rooms: number;
            cancelled_rooms: number;
            booking_lead_bucket: string;
            dow: number;
            season_label: string;
        }>();

        for (const b of bucketMap.values()) {
            const key = `${b.booking_lead_bucket}|${b.dow}|${b.season_label}`;
            const existing = allSegmentMap.get(key);
            if (existing) {
                existing.total_rooms += b.total_rooms;
                existing.cancelled_rooms += b.cancelled_rooms;
            } else {
                allSegmentMap.set(key, {
                    total_rooms: b.total_rooms,
                    cancelled_rooms: b.cancelled_rooms,
                    booking_lead_bucket: b.booking_lead_bucket,
                    dow: b.dow,
                    season_label: b.season_label,
                });
            }
        }

        // 6. Build upsert data with Bayesian smoothing
        const upsertData: Array<{
            hotel_id: string;
            booking_lead_bucket: string;
            dow: number;
            season_label: string;
            segment: string;
            cancel_rate: number;
            raw_rate: number;
            total_rooms: number;
            cancelled_rooms: number;
            confidence: string;
            mapping_version: string;
            window_start: Date;
            window_end: Date;
            data_row_count: number;
            unknown_pct: number;
        }> = [];

        // Per-segment buckets: smoothed against ALL-segment parent
        for (const b of bucketMap.values()) {
            const rawRate = b.total_rooms > 0 ? b.cancelled_rooms / b.total_rooms : 0;

            // Find parent rate (ALL segment for same lead × dow × season)
            const parentKey = `${b.booking_lead_bucket}|${b.dow}|${b.season_label}`;
            const parent = allSegmentMap.get(parentKey);
            const parentRate = parent && parent.total_rooms > 0
                ? parent.cancelled_rooms / parent.total_rooms
                : globalRate;

            const smoothedRate = smoothRate(rawRate, b.total_rooms, parentRate);

            upsertData.push({
                hotel_id: hotelId,
                booking_lead_bucket: b.booking_lead_bucket,
                dow: b.dow,
                season_label: b.season_label,
                segment: b.segment,
                cancel_rate: smoothedRate,
                raw_rate: clampRate(rawRate),
                total_rooms: b.total_rooms,
                cancelled_rooms: b.cancelled_rooms,
                confidence: getConfidence(b.total_rooms),
                mapping_version: MAPPING_VERSION,
                window_start: windowStart,
                window_end: windowEnd,
                data_row_count: explodedRows.length,
                unknown_pct: unknownPct,
            });
        }

        // ALL segment buckets: smoothed against global
        for (const a of allSegmentMap.values()) {
            const rawRate = a.total_rooms > 0 ? a.cancelled_rooms / a.total_rooms : 0;
            const smoothedRate = smoothRate(rawRate, a.total_rooms, globalRate);

            upsertData.push({
                hotel_id: hotelId,
                booking_lead_bucket: a.booking_lead_bucket,
                dow: a.dow,
                season_label: a.season_label,
                segment: 'ALL',
                cancel_rate: smoothedRate,
                raw_rate: clampRate(rawRate),
                total_rooms: a.total_rooms,
                cancelled_rooms: a.cancelled_rooms,
                confidence: getConfidence(a.total_rooms),
                mapping_version: MAPPING_VERSION,
                window_start: windowStart,
                window_end: windowEnd,
                data_row_count: explodedRows.length,
                unknown_pct: unknownPct,
            });
        }

        // Also add a "default" season + DOW=-1 global fallback bucket
        upsertData.push({
            hotel_id: hotelId,
            booking_lead_bucket: '0-3d', // placeholder — all leads
            dow: -1, // any DOW
            season_label: 'default',
            segment: 'ALL',
            cancel_rate: clampRate(globalRate),
            raw_rate: clampRate(globalRate),
            total_rooms: globalTotalRooms,
            cancelled_rooms: globalCancelledRooms,
            confidence: getConfidence(globalTotalRooms),
            mapping_version: MAPPING_VERSION,
            window_start: windowStart,
            window_end: windowEnd,
            data_row_count: explodedRows.length,
            unknown_pct: unknownPct,
        });

        // 7. Delete old stats for this hotel, then bulk insert
        await prisma.$transaction(async (tx) => {
            await tx.cancelRateStats.deleteMany({
                where: { hotel_id: hotelId },
            });

            await tx.cancelRateStats.createMany({
                data: upsertData,
            });
        });

        console.log(
            `[CancelStats] ✅ Built ${upsertData.length} buckets for hotel ${hotelId}. ` +
            `Rows: ${explodedRows.length}, UNKNOWN: ${unknownPct.toFixed(1)}%, ` +
            `Window: ${windowStart.toISOString().slice(0, 10)} → ${windowEnd.toISOString().slice(0, 10)}`
        );

        return {
            success: true,
            bucketsCreated: upsertData.length,
            dataRowCount: explodedRows.length,
            unknownPct,
            windowStart: windowStart.toISOString().slice(0, 10),
            windowEnd: windowEnd.toISOString().slice(0, 10),
        };
    } catch (error: any) {
        console.error('[CancelStats] ❌ Error:', error?.message);
        return { success: false, error: error?.message || 'Unknown error' };
    }
}

/**
 * Helper: Get season label for a date.
 * Re-exported for use in the server action context.
 */
function getSeasonLabel(date: Date, seasons: SeasonDateRange[]): string {
    if (!seasons.length) return 'default';

    const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    let bestMatch: SeasonDateRange | null = null;

    for (const season of seasons) {
        if (isDateInRange(mmdd, season.start, season.end)) {
            if (!bestMatch || season.priority > bestMatch.priority) {
                bestMatch = season;
            }
        }
    }

    return bestMatch ? bestMatch.label : 'default';
}

function isDateInRange(mmdd: string, start: string, end: string): boolean {
    if (start <= end) {
        return mmdd >= start && mmdd <= end;
    }
    return mmdd >= start || mmdd <= end;
}
