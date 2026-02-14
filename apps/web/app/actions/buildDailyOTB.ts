'use server';

import prisma from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

/**
 * V01.2: Build Daily OTB (On The Books) with Time-Travel + Dedup Logic
 * 
 * Key changes from V01.1:
 * - Raw SQL with DISTINCT ON (reservation_id) for deduplication
 * - Orders by snapshot_ts DESC (latest snapshot wins, not created_at)
 * - Tenant-safe join (j.hotel_id = r.hotel_id)
 * - Overlap filter for performance (arrival < to AND departure > from)
 * - cancel_time based filtering (event-time model)
 * 
 * Flow:
 * 1. Get deduplicated reservations active as-of asOfTs (latest version only)
 * 2. Expand each reservation to individual room-nights
 * 3. Aggregate by stay_date → rooms_otb, revenue_otb
 * 4. Upsert into daily_otb table
 */

interface BuildOTBParams {
    hotelId: string;
    asOfTs?: Date;           // Snapshot timestamp (default: now)
    stayDateFrom?: Date;     // Filter: start of stay date range
    stayDateTo?: Date;       // Filter: end of stay date range
}

interface BuildOTBResult {
    success: boolean;
    daysBuilt?: number;
    totalRoomsOtb?: number;
    message?: string;
    error?: string;
    snapshotGeneratedAt?: Date;
    dqFallbackCount?: number;  // Count of reservations using book_time fallback
}

/** Raw SQL result row type */
interface RawReservationRow {
    reservation_id: string;
    booking_date: Date;
    book_time: Date | null;
    arrival_date: Date;
    departure_date: Date;
    rooms: number | string;
    revenue: any; // Decimal comes as string from raw SQL
}

/**
 * Get effective book time with fallback for legacy data
 * If book_time is null, uses booking_date at 00:00:00
 */
function getEffectiveBookTime(bookTime: Date | null, bookingDate: Date): Date {
    if (bookTime) return bookTime;
    // Fallback: booking_date at midnight
    const fallback = new Date(bookingDate);
    fallback.setHours(0, 0, 0, 0);
    return fallback;
}

/**
 * Calculate revenue per night with remainder to last night
 * V01.1: Even split with remainder to last night for precision
 */
function calculateRevenuePerNight(totalRevenue: number, nights: number, nightIndex: number): number {
    if (nights <= 0) return totalRevenue;

    const revenuePerNight = Math.floor(totalRevenue / nights);
    const remainder = totalRevenue - (revenuePerNight * nights);

    // Last night gets the remainder
    if (nightIndex === nights - 1) {
        return revenuePerNight + remainder;
    }
    return revenuePerNight;
}

export async function buildDailyOTB(params?: BuildOTBParams): Promise<BuildOTBResult> {
    const hotelId = params?.hotelId || process.env.DEFAULT_HOTEL_ID;
    if (!hotelId) {
        throw new Error('DEFAULT_HOTEL_ID chưa được cấu hình trong .env');
    }

    // V01.1: Use asOfTs (timestamp) for time-travel
    const asOfTs = params?.asOfTs || new Date();
    const snapshotDate = new Date(asOfTs);
    snapshotDate.setHours(0, 0, 0, 0);

    // V01.4: Half-open interval cutoff (exclusive end)
    // as_of_date = D → cutoff_end_excl = (D + 1) 00:00:00
    // This ensures all bookings during day D are included
    const cutoffEndExcl = new Date(snapshotDate);
    cutoffEndExcl.setDate(cutoffEndExcl.getDate() + 1);

    // Default stay date range: use very wide range to capture all data
    const stayDateFrom = params?.stayDateFrom || new Date('2020-01-01');
    const stayDateTo = params?.stayDateTo || new Date('2030-12-31');

    try {
        // V01.2: Dedup Query with Raw SQL
        // DISTINCT ON (reservation_id) + ORDER BY snapshot_ts DESC = latest version wins
        // Tenant-safe join: j.hotel_id = r.hotel_id
        // Overlap filter: arrival < stayDateTo AND departure > stayDateFrom
        const reservations = await prisma.$queryRaw<RawReservationRow[]>`
            SELECT DISTINCT ON (r.reservation_id, COALESCE(r.room_code, ''))
                r.reservation_id,
                r.booking_date,
                r.book_time,
                r.arrival_date,
                r.departure_date,
                r.rooms,
                r.revenue
            FROM reservations_raw r
            JOIN import_jobs j
              ON j.job_id = r.job_id
              AND j.hotel_id = r.hotel_id
            WHERE r.hotel_id = ${hotelId}::uuid
              -- V01.4: Half-open interval (exclusive end)
              -- Include booking if book_time < cutoff (not <=)
              AND COALESCE(r.book_time, r.booking_date::timestamp) < ${cutoffEndExcl}
              -- Exclude if cancelled before cutoff
              AND (r.cancel_time IS NULL OR r.cancel_time >= ${cutoffEndExcl})
              -- Performance: overlap filter
              AND r.arrival_date < ${stayDateTo}::date
              AND r.departure_date > ${stayDateFrom}::date
            ORDER BY r.reservation_id, COALESCE(r.room_code, ''), COALESCE(j.snapshot_ts, j.created_at) DESC
        `;

        if (reservations.length === 0) {
            return {
                success: false,
                error: 'No active reservations found as-of the specified timestamp',
                snapshotGeneratedAt: asOfTs,
            };
        }

        // Count legacy fallbacks for DQ monitoring
        let dqFallbackCount = 0;

        // Build room-night map: stay_date → { rooms, revenue }
        const stayDateMap = new Map<string, { rooms: number; revenue: number }>();

        for (const res of reservations) {
            // Track DQ: book_time fallback
            if (!res.book_time) {
                dqFallbackCount++;
            }

            // Raw SQL type casting: Postgres may return numeric types as strings
            const roomsNum = Number(res.rooms);
            const revenueNum = Number(res.revenue);

            const arrival = new Date(res.arrival_date);
            const departure = new Date(res.departure_date);
            const nights = Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));

            // For each night from arrival to departure-1
            for (let i = 0; i < nights; i++) {
                const stayDate = new Date(arrival);
                stayDate.setDate(stayDate.getDate() + i);

                // Filter by stay date range
                if (stayDate < stayDateFrom || stayDate > stayDateTo) {
                    continue;
                }

                const dateKey = stayDate.toISOString().split('T')[0];

                // V01.2: Revenue split with remainder to last night
                const revenueForNight = calculateRevenuePerNight(revenueNum, nights, i);

                const existing = stayDateMap.get(dateKey) || { rooms: 0, revenue: 0 };
                stayDateMap.set(dateKey, {
                    rooms: existing.rooms + roomsNum,
                    revenue: existing.revenue + revenueForNight,
                });
            }
        }

        // Convert to array and sort
        const otbRows = Array.from(stayDateMap.entries())
            .map(([dateKey, data]) => ({
                hotel_id: hotelId,
                as_of_date: snapshotDate,
                stay_date: new Date(dateKey),
                rooms_otb: data.rooms,
                revenue_otb: data.revenue,
            }))
            .sort((a, b) => a.stay_date.getTime() - b.stay_date.getTime());

        if (otbRows.length === 0) {
            return {
                success: false,
                error: 'No stay dates found in the specified range',
                snapshotGeneratedAt: asOfTs,
            };
        }

        // Delete old OTB for this snapshot date (if rebuilding)
        await prisma.dailyOTB.deleteMany({
            where: {
                hotel_id: hotelId,
                as_of_date: snapshotDate,
            },
        });

        // Insert new OTB rows
        await prisma.dailyOTB.createMany({
            data: otbRows,
        });

        // Revalidate dashboard
        revalidatePath('/dashboard');
        revalidatePath('/data');

        return {
            success: true,
            daysBuilt: otbRows.length,
            totalRoomsOtb: otbRows.reduce((sum, r) => sum + r.rooms_otb, 0),
            message: `Built OTB for ${otbRows.length} stay dates (as-of ${snapshotDate.toISOString().split('T')[0]})`,
            snapshotGeneratedAt: asOfTs,
            dqFallbackCount: dqFallbackCount > 0 ? dqFallbackCount : undefined,
        };
    } catch (error) {
        console.error('buildDailyOTB error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            snapshotGeneratedAt: asOfTs,
        };
    }
}

/**
 * Quick action to rebuild all OTB data WITH historical backfill
 * Uses active hotel from cookie/session (no auto-detect)
 * 
 * V02: Auto-backfill monthly snapshots so STLY, pickup, and
 * year-over-year comparisons work for bulk-uploaded data.
 * 
 * Creates end-of-month snapshots from min(booking_date) to max(booking_date),
 * plus a "today" snapshot. This gives the system multiple as_of_dates
 * for time-series features.
 */
export async function rebuildAllOTB() {
    // Get active hotel from context (cookie → session → fallback)
    const { getActiveHotelId } = await import('../../lib/pricing/get-hotel');
    const hotelId = await getActiveHotelId();

    if (!hotelId) {
        throw new Error('Không tìm thấy hotel đang active. Vui lòng chọn hotel trước.');
    }

    // Find date ranges for this specific hotel
    const dataRange = await prisma.reservationsRaw.aggregate({
        where: { hotel_id: hotelId },
        _max: {
            booking_date: true,
            departure_date: true,
            loaded_at: true,
        },
        _min: {
            arrival_date: true,
            booking_date: true,
        },
    });

    const latestBookingDate = dataRange._max.booking_date;
    const minBookingDate = dataRange._min.booking_date;
    const earliestArrival = dataRange._min.arrival_date;
    const latestDeparture = dataRange._max.departure_date;

    if (!latestBookingDate || !minBookingDate) {
        return buildDailyOTB({ hotelId });
    }

    // ─── V04: 3-Tier OTB Snapshot Policy (BA-approved) ──────────
    // Tier A: Daily for last 35 days — ensures T-3/T-5/T-7 exact match
    // Tier B: Weekly for last 450 days (~15 months) — covers T-15/T-30 + STLY (D-364 ±7d)
    // Tier C: Monthly EOM for older history
    // All tiers skip dates already in daily_otb for idempotency.

    // Existing snapshot dates for dedup
    const existingDates = await prisma.dailyOTB.findMany({
        where: { hotel_id: hotelId },
        select: { as_of_date: true },
        distinct: ['as_of_date'],
    });
    const existingSet = new Set(existingDates.map(d => d.as_of_date.toISOString().split('T')[0]));

    // Tier C: Monthly EOM (for dates older than 450d from latestBookingDate)
    const tier_b_start = new Date(latestBookingDate);
    tier_b_start.setDate(tier_b_start.getDate() - 450);
    const monthlyEnd = tier_b_start > minBookingDate ? tier_b_start : minBookingDate;

    const monthlyDates = await prisma.$queryRaw<{ d: Date }[]>`
        SELECT LEAST(
            (date_trunc('month', g) + interval '1 month' - interval '1 day')::date,
            ${latestBookingDate}::date
        ) as d
        FROM generate_series(${minBookingDate}::date, ${monthlyEnd}::date, '1 month'::interval) g
        ORDER BY g ASC
    `;

    // Tier B: Weekly for last 450 days
    const tier_a_start = new Date(latestBookingDate);
    tier_a_start.setDate(tier_a_start.getDate() - 35);
    const weeklyStart = tier_b_start > minBookingDate ? tier_b_start : minBookingDate;
    const weeklyEnd = tier_a_start > weeklyStart ? tier_a_start : latestBookingDate;

    const weeklyDates = await prisma.$queryRaw<{ d: Date }[]>`
        SELECT g::date as d
        FROM generate_series(${weeklyStart}::date, ${weeklyEnd}::date, '7 days'::interval) g
        ORDER BY g ASC
    `;

    // Tier A: Daily for last 35 days
    const dailyStart = tier_a_start > minBookingDate ? tier_a_start : minBookingDate;
    const dailyDates = await prisma.$queryRaw<{ d: Date }[]>`
        SELECT g::date as d
        FROM generate_series(${dailyStart}::date, ${latestBookingDate}::date, '1 day'::interval) g
        ORDER BY g ASC
    `;

    // Merge all dates, dedup, sort ASC
    const allDatesRaw = [
        ...monthlyDates.map(r => r.d),
        ...weeklyDates.map(r => r.d),
        ...dailyDates.map(r => r.d),
    ];
    const seen = new Set<string>();
    const allDates: Date[] = [];
    for (const d of allDatesRaw) {
        const key = d.toISOString().split('T')[0];
        if (!seen.has(key) && !existingSet.has(key)) {
            seen.add(key);
            allDates.push(d);
        }
    }
    allDates.sort((a, b) => a.getTime() - b.getTime());

    // Stay date range (with buffer)
    const stayDateFrom = earliestArrival
        ? new Date(new Date(earliestArrival).setDate(new Date(earliestArrival).getDate() - 7))
        : new Date('2020-01-01');
    const stayDateTo = latestDeparture
        ? new Date(new Date(latestDeparture).setDate(new Date(latestDeparture).getDate() + 7))
        : new Date('2030-12-31');

    let built = 0;
    let skipped = 0;

    // Build all snapshot dates
    for (const asOfDate of allDates) {
        try {
            const result = await buildDailyOTB({
                hotelId,
                asOfTs: asOfDate,
                stayDateFrom,
                stayDateTo,
            });
            if (result.success) built++;
            else skipped++;
        } catch {
            skipped++;
        }
    }

    // Build "latest" snapshot using actual data horizon (latestBookingDate)
    // NOT new Date() — wall-clock time has no meaning when data only goes to e.g. Feb 13
    const latestTs = new Date(latestBookingDate);
    latestTs.setHours(23, 59, 59, 999);
    const todayResult = await buildDailyOTB({
        hotelId,
        asOfTs: latestTs,
        stayDateFrom,
        stayDateTo,
    });
    if (todayResult.success) built++;

    return {
        success: built > 0,
        daysBuilt: todayResult.daysBuilt,
        totalRoomsOtb: todayResult.totalRoomsOtb,
        message: `Built ${built} snapshots (${dailyDates.length} daily + ${weeklyDates.length} weekly + ${monthlyDates.length} monthly, ${skipped} skipped, ${existingSet.size} existed). Latest: ${todayResult.daysBuilt || 0} stay dates.`,
        snapshotGeneratedAt: latestTs,
    };
}


/**
 * V01.1: Backfill OTB for historical dates
 * Useful after running cancellation bridge to recalculate past snapshots
 */
export async function backfillOTB(hotelId: string, days: number = 30): Promise<{
    success: boolean;
    daysProcessed: number;
    message: string;
}> {
    const results: BuildOTBResult[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
        const asOfDate = new Date(today);
        asOfDate.setDate(asOfDate.getDate() - i);
        asOfDate.setHours(23, 59, 59, 999); // End of day snapshot

        const result = await buildDailyOTB({
            hotelId,
            asOfTs: asOfDate,
        });
        results.push(result);
    }

    const successCount = results.filter(r => r.success).length;

    return {
        success: successCount > 0,
        daysProcessed: successCount,
        message: `Backfilled OTB for ${successCount}/${days} days`,
    };
}

// ============================================================
// V01.4: New backfill with generate_series + advisory lock
// ============================================================

export interface BackfillOptions {
    hotelId?: string;
    from?: Date;
    to?: Date;
    freq?: 'monthly' | 'weekly';
    missingOnly?: boolean;
    limit?: number;
}

export interface BackfillResult {
    success: boolean;
    built: number;
    skipped: number;
    remaining: number;
    message: string;
}

function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

/**
 * V01.4: Backfill OTB snapshots using generate_series
 */
export async function backfillMonthlySnapshots(
    options: BackfillOptions = {}
): Promise<BackfillResult> {
    const { getActiveHotelId } = await import('../../lib/pricing/get-hotel');
    const hotelId = options.hotelId || await getActiveHotelId();

    if (!hotelId) {
        return { success: false, built: 0, skipped: 0, remaining: 0, message: 'No active hotel' };
    }

    const limit = options.limit || 3;
    const missingOnly = options.missingOnly ?? true;

    const lockKey = hashCode(`otb-backfill-${hotelId}`);
    const lockResult = await prisma.$queryRaw<[{ locked: boolean }]>`
        SELECT pg_try_advisory_lock(${lockKey}) as locked
    `;

    if (!lockResult[0].locked) {
        return { success: false, built: 0, skipped: 0, remaining: 0, message: 'Build already running' };
    }

    try {
        let from = options.from;
        let to = options.to;

        if (!from || !to) {
            const range = await prisma.reservationsRaw.aggregate({
                where: { hotel_id: hotelId },
                _min: { booking_date: true },
                _max: { booking_date: true }
            });
            from = from || range._min.booking_date || new Date();
            to = to || range._max.booking_date || new Date();
        }

        const interval = options.freq === 'weekly' ? '1 week' : '1 month';
        const months = await prisma.$queryRaw<{ eom: Date }[]>`
            SELECT (date_trunc('month', d) + interval '1 month' - interval '1 day')::date as eom
            FROM generate_series(${from}::date, ${to}::date, ${interval}::interval) d
            ORDER BY d ASC
        `;

        let targets = months.map(m => m.eom);
        if (missingOnly) {
            const existing = await prisma.dailyOTB.findMany({
                where: { hotel_id: hotelId },
                select: { as_of_date: true },
                distinct: ['as_of_date']
            });
            const existingSet = new Set(existing.map(e => e.as_of_date.toISOString().split('T')[0]));
            targets = targets.filter(t => !existingSet.has(t.toISOString().split('T')[0]));
        }

        let built = 0, skipped = 0;
        const toProcess = targets.slice(0, limit);

        for (const eom of toProcess) {
            try {
                const result = await buildDailyOTB({ hotelId, asOfTs: eom });
                if (result.success) built++;
                else skipped++;
            } catch {
                skipped++;
            }
        }

        const remaining = targets.length - toProcess.length;
        revalidatePath('/dashboard');
        revalidatePath('/data');

        return {
            success: true,
            built,
            skipped,
            remaining,
            message: remaining > 0 ? `Built ${built}, ${remaining} remaining` : `Complete. Built ${built}.`
        };
    } finally {
        await prisma.$queryRaw`SELECT pg_advisory_unlock(${lockKey})`;
    }
}
