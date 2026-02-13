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
        const account = searchParams.get('account');
        const asOfDate = searchParams.get('asOfDate');
        const days = parseInt(searchParams.get('days') || '90');

        if (!asOfDate || !account) {
            return NextResponse.json({ error: 'asOfDate and account required' }, { status: 400 });
        }

        const stayFrom = new Date(asOfDate);
        const stayTo = new Date(asOfDate);
        stayTo.setDate(stayTo.getDate() + days);
        const cutoffTs = new Date(asOfDate);
        cutoffTs.setDate(cutoffTs.getDate() + 1);

        // By stay date
        const byDate = await prisma.$queryRaw<Array<{
            stay_date: Date;
            room_nights: number;
            revenue: number;
        }>>`
            SELECT
                arrival_date AS stay_date,
                SUM(COALESCE(room_nights, rooms * GREATEST(1, (departure_date - arrival_date))))::int AS room_nights,
                SUM(COALESCE(revenue, net_rate_per_room_night * COALESCE(room_nights, rooms)))::float AS revenue
            FROM reservations_raw
            WHERE hotel_id = ${hotelId}::uuid
              AND account_name_norm = ${account}
              AND book_time < ${cutoffTs}
              AND arrival_date >= ${stayFrom}::date
              AND arrival_date <= ${stayTo}::date
              AND (cancel_time IS NULL OR cancel_time >= ${cutoffTs})
            GROUP BY arrival_date
            ORDER BY arrival_date
        `;

        // By room type
        const byRoomType = await prisma.$queryRaw<Array<{
            room_code: string | null;
            room_nights: number;
            revenue: number;
        }>>`
            SELECT
                COALESCE(room_code, 'Unknown') AS room_code,
                SUM(COALESCE(room_nights, rooms * GREATEST(1, (departure_date - arrival_date))))::int AS room_nights,
                SUM(COALESCE(revenue, net_rate_per_room_night * COALESCE(room_nights, rooms)))::float AS revenue
            FROM reservations_raw
            WHERE hotel_id = ${hotelId}::uuid
              AND account_name_norm = ${account}
              AND book_time < ${cutoffTs}
              AND arrival_date >= ${stayFrom}::date
              AND arrival_date <= ${stayTo}::date
              AND (cancel_time IS NULL OR cancel_time >= ${cutoffTs})
            GROUP BY COALESCE(room_code, 'Unknown')
            ORDER BY SUM(COALESCE(room_nights, rooms * GREATEST(1, (departure_date - arrival_date)))) DESC
        `;

        const totalRN = byRoomType.reduce((s, r) => s + Number(r.room_nights), 0);

        return NextResponse.json({
            account,
            byDate: byDate.map(d => ({
                stayDate: d.stay_date,
                roomNights: Number(d.room_nights),
                revenue: Number(d.revenue),
            })),
            byRoomType: byRoomType.map(r => ({
                roomCode: r.room_code || 'Unknown',
                roomNights: Number(r.room_nights),
                share: totalRN > 0 ? Number(r.room_nights) / totalRN : 0,
                revenue: Number(r.revenue),
            })),
        });
    } catch (error) {
        console.error('[Analytics/AccountDetail] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch account detail' }, { status: 500 });
    }
}
