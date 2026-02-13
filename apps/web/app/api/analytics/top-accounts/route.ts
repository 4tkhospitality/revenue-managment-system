import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const hotelId = await getActiveHotelId();
        if (!hotelId) {
            return NextResponse.json({ error: 'No hotel configured' }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const asOfDate = searchParams.get('asOfDate');
        const days = parseInt(searchParams.get('days') || '90');

        if (!asOfDate) {
            return NextResponse.json({ error: 'asOfDate required' }, { status: 400 });
        }

        const stayFrom = new Date(asOfDate);
        const stayTo = new Date(asOfDate);
        stayTo.setDate(stayTo.getDate() + days);
        const cutoffTs = new Date(asOfDate);
        cutoffTs.setDate(cutoffTs.getDate() + 1); // end-of-day cutoff

        // Top accounts by room-nights (time-travel safe)
        const accounts = await prisma.$queryRaw<Array<{
            account: string | null;
            segment: string | null;
            bookings: bigint;
            room_nights: number;
            revenue: number;
            adr: number;
        }>>`
            SELECT
                account_name_norm AS account,
                segment,
                COUNT(*)::int AS bookings,
                SUM(COALESCE(room_nights, rooms * GREATEST(1, (departure_date - arrival_date)))) AS room_nights,
                SUM(COALESCE(revenue, net_rate_per_room_night * COALESCE(room_nights, rooms)))::float AS revenue,
                (SUM(COALESCE(revenue, net_rate_per_room_night * COALESCE(room_nights, rooms)))
                  / NULLIF(SUM(COALESCE(room_nights, rooms * GREATEST(1, (departure_date - arrival_date)))), 0))::float AS adr
            FROM reservations_raw
            WHERE hotel_id = ${hotelId}::uuid
              AND book_time < ${cutoffTs}
              AND arrival_date >= ${stayFrom}::date
              AND arrival_date <= ${stayTo}::date
              AND (cancel_time IS NULL OR cancel_time >= ${cutoffTs})
            GROUP BY account_name_norm, segment
            ORDER BY SUM(COALESCE(room_nights, rooms * GREATEST(1, (departure_date - arrival_date)))) DESC
            LIMIT 10
        `;

        // Cancel rate per account (separate query)
        const cancelData = await prisma.$queryRaw<Array<{
            account: string | null;
            total_bookings: bigint;
            cancelled_bookings: bigint;
        }>>`
            SELECT
                account_name_norm AS account,
                COUNT(*)::int AS total_bookings,
                COUNT(CASE WHEN cancel_time IS NOT NULL AND cancel_time < ${cutoffTs} THEN 1 END)::int AS cancelled_bookings
            FROM reservations_raw
            WHERE hotel_id = ${hotelId}::uuid
              AND book_time < ${cutoffTs}
              AND arrival_date >= ${stayFrom}::date
              AND arrival_date <= ${stayTo}::date
            GROUP BY account_name_norm
            ORDER BY COUNT(*) DESC
            LIMIT 10
        `;

        const cancelMap = new Map(cancelData.map(c => [
            c.account,
            {
                total: Number(c.total_bookings),
                cancelled: Number(c.cancelled_bookings),
            }
        ]));

        const hasCancelData = cancelData.some(c => Number(c.cancelled_bookings) > 0);

        const result = accounts.map(a => {
            const cancel = cancelMap.get(a.account);
            const cancelRate = cancel && cancel.total > 0
                ? cancel.cancelled / cancel.total
                : null;

            return {
                account: a.account || 'Unknown',
                segment: a.segment || 'UNKNOWN',
                bookings: Number(a.bookings),
                roomNights: Number(a.room_nights) || 0,
                revenue: Number(a.revenue) || 0,
                adr: Math.round(Number(a.adr) || 0),
                cancelRate: cancelRate,
                cancelDataStatus: hasCancelData ? 'ok' : 'missing_cancel',
            };
        });

        return NextResponse.json({
            accounts: result,
            dataStatus: {
                hasCancelData,
                totalAccounts: result.length,
            },
        });
    } catch (error) {
        console.error('[Analytics/TopAccounts] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch top accounts' }, { status: 500 });
    }
}
