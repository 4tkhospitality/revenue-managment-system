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

    // Default stay date range: use very wide range to capture all data
    const stayDateFrom = params?.stayDateFrom || new Date('2020-01-01');
    const stayDateTo = params?.stayDateTo || new Date('2030-12-31');

    try {
        // V01.2: Dedup Query with Raw SQL
        // DISTINCT ON (reservation_id) + ORDER BY snapshot_ts DESC = latest version wins
        // Tenant-safe join: j.hotel_id = r.hotel_id
        // Overlap filter: arrival < stayDateTo AND departure > stayDateFrom
        const reservations = await prisma.$queryRaw<RawReservationRow[]>`
            SELECT DISTINCT ON (r.reservation_id)
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
              -- Time-travel: booked before snapshot
              AND COALESCE(r.book_time, r.booking_date::timestamp) <= ${asOfTs}
              -- Time-travel: not cancelled before snapshot (event-time model)
              AND (r.cancel_time IS NULL OR r.cancel_time > ${asOfTs})
              -- Performance: overlap filter
              AND r.arrival_date < ${stayDateTo}::date
              AND r.departure_date > ${stayDateFrom}::date
            ORDER BY r.reservation_id, COALESCE(j.snapshot_ts, j.created_at) DESC
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
 * Quick action to rebuild all OTB data
 * Uses active hotel from cookie/session (no auto-detect)
 * 
 * V01.2.1: Auto-detect data range for historical imports
 * - Finds min(arrival_date) and max(departure_date) to set stay date range
 * - Uses max(booking_date) as snapshot timestamp
 * - This ensures hotels onboarding with historical data see results immediately
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
        },
        _min: {
            arrival_date: true,
        },
    });

    const latestBookingDate = dataRange._max.booking_date;
    const earliestArrival = dataRange._min.arrival_date;
    const latestDeparture = dataRange._max.departure_date;

    if (!latestBookingDate) {
        // Hotel exists but has no reservation data yet
        return buildDailyOTB({ hotelId });
    }

    // Use end of the latest booking day as snapshot timestamp
    const asOfTs = new Date(latestBookingDate);
    asOfTs.setHours(23, 59, 59, 999);

    // Use actual data range for stay dates (with some buffer)
    // This ensures historical data imports work correctly
    const stayDateFrom = earliestArrival
        ? new Date(new Date(earliestArrival).setDate(new Date(earliestArrival).getDate() - 7))
        : new Date('2020-01-01');

    const stayDateTo = latestDeparture
        ? new Date(new Date(latestDeparture).setDate(new Date(latestDeparture).getDate() + 7))
        : new Date('2030-12-31');

    return buildDailyOTB({
        hotelId,
        asOfTs,
        stayDateFrom,
        stayDateTo,
    });
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
