'use server';

import prisma from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * V01.1: Build Daily OTB (On The Books) with Time-Travel Logic
 * 
 * Key changes from V01:
 * - Uses asOfTs (timestamp) instead of asOfDate for accurate time-travel
 * - Checks cancel_time against asOfTs (not status field)
 * - Implements book_time fallback for legacy data
 * - Revenue split per night with remainder to last night
 * 
 * Flow:
 * 1. Get all reservations that were active as-of asOfTs
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
function calculateRevenuePerNight(totalRevenue: number | Decimal, nights: number, nightIndex: number): number {
    const total = typeof totalRevenue === 'number' ? totalRevenue : Number(totalRevenue);
    if (nights <= 0) return total;

    const revenuePerNight = Math.floor(total / nights);
    const remainder = total - (revenuePerNight * nights);

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

    // Default stay date range: today to 365 days from now
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const stayDateFrom = params?.stayDateFrom || today;
    const stayDateTo = params?.stayDateTo || new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);

    try {
        // V01.1: Time-Travel Query
        // A reservation is active as-of asOfTs if:
        // 1. book_time <= asOfTs (or booking_date <= asOfTs for legacy)
        // 2. AND (cancel_time IS NULL OR cancel_time > asOfTs)
        const reservations = await prisma.reservationsRaw.findMany({
            where: {
                hotel_id: hotelId,
                // book_time/booking_date <= asOfTs
                OR: [
                    { book_time: { lte: asOfTs } },
                    {
                        book_time: null,
                        booking_date: { lte: asOfTs }
                    }
                ],
                // NOT cancelled before or at asOfTs
                AND: {
                    OR: [
                        { cancel_time: null },
                        { cancel_time: { gt: asOfTs } }
                    ]
                }
            },
            select: {
                reservation_id: true,
                booking_date: true,
                book_time: true,
                arrival_date: true,
                departure_date: true,
                rooms: true,
                revenue: true,
            },
        });

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

                // V01.1: Revenue split with remainder to last night
                const revenueForNight = calculateRevenuePerNight(res.revenue, nights, i);

                const existing = stayDateMap.get(dateKey) || { rooms: 0, revenue: 0 };
                stayDateMap.set(dateKey, {
                    rooms: existing.rooms + res.rooms,
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
 * Quick action to rebuild all OTB data for today
 */
export async function rebuildAllOTB() {
    return buildDailyOTB();
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
