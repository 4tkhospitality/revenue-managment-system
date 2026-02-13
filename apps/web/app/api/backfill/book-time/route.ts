import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/backfill/book-time
 * 
 * One-time backfill: sets book_time from booking_date for all records
 * where book_time IS NULL but booking_date IS NOT NULL.
 * 
 * Uses Option A timezone conversion: VN (UTC+7) local midnight → UTC.
 * Example: booking_date 2026-01-15 → book_time 2026-01-14T17:00:00Z
 */
export async function POST() {
    try {
        // Count affected rows first
        const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*)::bigint AS count
            FROM reservations_raw
            WHERE book_time IS NULL
              AND booking_date IS NOT NULL
        `;
        const nullCount = Number(countResult[0]?.count ?? 0);

        if (nullCount === 0) {
            return NextResponse.json({
                success: true,
                message: 'No records need backfill — all book_time values are already set.',
                updated: 0,
            });
        }

        // Backfill: booking_date at VN midnight → UTC (subtract 7 hours)
        const result = await prisma.$executeRaw`
            UPDATE reservations_raw
            SET book_time = (booking_date::timestamp - INTERVAL '7 hours')
            WHERE book_time IS NULL
              AND booking_date IS NOT NULL
        `;

        // Also backfill cancel_time for cancelled records
        const cancelResult = await prisma.$executeRaw`
            UPDATE reservations_raw
            SET cancel_time = (cancel_date::timestamp - INTERVAL '7 hours')
            WHERE cancel_time IS NULL
              AND cancel_date IS NOT NULL
              AND status = 'cancelled'
        `;

        return NextResponse.json({
            success: true,
            message: `Backfill complete.`,
            updated: result,
            cancelTimeUpdated: cancelResult,
        });
    } catch (error: any) {
        console.error('[Backfill/BookTime] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Backfill failed' },
            { status: 500 },
        );
    }
}
