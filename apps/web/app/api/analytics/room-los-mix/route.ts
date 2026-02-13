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

        // Room type mix
        const roomMix = await prisma.$queryRaw<Array<{
            room_code: string | null;
            room_nights: number;
            revenue: number;
            adr: number;
        }>>`
            SELECT
                COALESCE(room_code, 'Unknown') AS room_code,
                SUM(COALESCE(room_nights, rooms * GREATEST(1, (departure_date - arrival_date))))::int AS room_nights,
                SUM(COALESCE(revenue, net_rate_per_room_night * COALESCE(room_nights, rooms)))::float AS revenue,
                (SUM(COALESCE(revenue, net_rate_per_room_night * COALESCE(room_nights, rooms)))
                  / NULLIF(SUM(COALESCE(room_nights, rooms * GREATEST(1, (departure_date - arrival_date)))), 0))::float AS adr
            FROM reservations_raw
            WHERE hotel_id = ${hotelId}::uuid
              AND book_time < ${cutoffTs}
              AND arrival_date >= ${stayFrom}::date
              AND arrival_date <= ${stayTo}::date
              AND (cancel_time IS NULL OR cancel_time >= ${cutoffTs})
            GROUP BY COALESCE(room_code, 'Unknown')
            ORDER BY SUM(COALESCE(room_nights, rooms * GREATEST(1, (departure_date - arrival_date)))) DESC
        `;

        const totalRN = roomMix.reduce((s, r) => s + Number(r.room_nights), 0);

        // LOS mix
        const losMix = await prisma.$queryRaw<Array<{
            bucket: string;
            count: bigint;
            room_nights: number;
        }>>`
            SELECT
                CASE
                    WHEN COALESCE(nights, (departure_date - arrival_date)) = 1 THEN '1N'
                    WHEN COALESCE(nights, (departure_date - arrival_date)) = 2 THEN '2N'
                    WHEN COALESCE(nights, (departure_date - arrival_date)) BETWEEN 3 AND 5 THEN '3-5N'
                    ELSE '6N+'
                END AS bucket,
                COUNT(*)::int AS count,
                SUM(COALESCE(room_nights, rooms * GREATEST(1, (departure_date - arrival_date))))::int AS room_nights
            FROM reservations_raw
            WHERE hotel_id = ${hotelId}::uuid
              AND book_time < ${cutoffTs}
              AND arrival_date >= ${stayFrom}::date
              AND arrival_date <= ${stayTo}::date
              AND (cancel_time IS NULL OR cancel_time >= ${cutoffTs})
            GROUP BY bucket
            ORDER BY MIN(COALESCE(nights, (departure_date - arrival_date)))
        `;

        const totalLOS = losMix.reduce((s, l) => s + Number(l.count), 0);

        // Check data availability
        const hasRoomCode = roomMix.some(r => r.room_code !== 'Unknown');
        const hasNights = losMix.length > 0;

        return NextResponse.json({
            roomMix: roomMix.map(r => ({
                roomCode: r.room_code || 'Unknown',
                roomNights: Number(r.room_nights),
                share: totalRN > 0 ? Number(r.room_nights) / totalRN : 0,
                adr: Math.round(Number(r.adr) || 0),
                revenue: Number(r.revenue) || 0,
            })),
            losMix: losMix.map(l => ({
                bucket: l.bucket,
                count: Number(l.count),
                share: totalLOS > 0 ? Number(l.count) / totalLOS : 0,
                roomNights: Number(l.room_nights),
            })),
            dataStatus: {
                hasRoomCode,
                hasNights,
            },
        });
    } catch (error) {
        console.error('[Analytics/RoomLosMix] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch room/LOS mix' }, { status: 500 });
    }
}
