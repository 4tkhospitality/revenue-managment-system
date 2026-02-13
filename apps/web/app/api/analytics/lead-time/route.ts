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
        cutoffTs.setDate(cutoffTs.getDate() + 1);

        // Lead-time buckets (time-travel safe)
        const buckets = await prisma.$queryRaw<Array<{
            bucket: string;
            count: bigint;
            room_nights: number;
            min_lead: number;
        }>>`
            SELECT
                CASE
                    WHEN (arrival_date - book_time::date) BETWEEN 0 AND 3 THEN '0-3d'
                    WHEN (arrival_date - book_time::date) BETWEEN 4 AND 7 THEN '4-7d'
                    WHEN (arrival_date - book_time::date) BETWEEN 8 AND 14 THEN '8-14d'
                    WHEN (arrival_date - book_time::date) BETWEEN 15 AND 30 THEN '15-30d'
                    ELSE '31d+'
                END AS bucket,
                COUNT(*)::int AS count,
                SUM(COALESCE(room_nights, rooms * GREATEST(1, (departure_date - arrival_date))))::int AS room_nights,
                MIN(arrival_date - book_time::date) AS min_lead
            FROM reservations_raw
            WHERE hotel_id = ${hotelId}::uuid
              AND book_time < ${cutoffTs}
              AND arrival_date >= ${stayFrom}::date
              AND arrival_date <= ${stayTo}::date
              AND (cancel_time IS NULL OR cancel_time >= ${cutoffTs})
              AND book_time IS NOT NULL
            GROUP BY bucket
            ORDER BY MIN(arrival_date - book_time::date)
        `;

        // Average lead time
        const avgResult = await prisma.$queryRaw<Array<{ avg_lead: number }>>`
            SELECT AVG(arrival_date - book_time::date)::float AS avg_lead
            FROM reservations_raw
            WHERE hotel_id = ${hotelId}::uuid
              AND book_time < ${cutoffTs}
              AND arrival_date >= ${stayFrom}::date
              AND arrival_date <= ${stayTo}::date
              AND (cancel_time IS NULL OR cancel_time >= ${cutoffTs})
              AND book_time IS NOT NULL
        `;

        const totalCount = buckets.reduce((s, b) => s + Number(b.count), 0);
        const hasBookTime = totalCount > 0;
        const avgLeadTime = avgResult[0]?.avg_lead ?? null;

        return NextResponse.json({
            buckets: buckets.map(b => ({
                bucket: b.bucket,
                count: Number(b.count),
                share: totalCount > 0 ? Number(b.count) / totalCount : 0,
                roomNights: Number(b.room_nights),
            })),
            avgLeadTime: avgLeadTime != null ? Math.round(avgLeadTime * 10) / 10 : null,
            dataStatus: {
                hasBookTime,
            },
        });
    } catch (error) {
        console.error('[Analytics/LeadTime] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch lead-time data' }, { status: 500 });
    }
}
