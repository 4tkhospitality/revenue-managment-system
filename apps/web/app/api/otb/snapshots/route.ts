import { NextRequest, NextResponse } from 'next/server';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import prisma from '@/lib/prisma';

/**
 * GET /api/otb/snapshots
 * List available OTB snapshots for the active hotel
 */
export async function GET() {
    try {
        const hotelId = await getActiveHotelId();

        if (!hotelId) {
            return NextResponse.json(
                { error: 'No active hotel' },
                { status: 400 }
            );
        }

        // Get distinct as_of_dates with row count
        const snapshots = await prisma.dailyOTB.groupBy({
            by: ['as_of_date'],
            where: { hotel_id: hotelId },
            _count: { stay_date: true },
            orderBy: { as_of_date: 'desc' }
        });

        return NextResponse.json(
            snapshots.map(s => ({
                as_of_date: s.as_of_date.toISOString().split('T')[0],
                row_count: s._count.stay_date
            }))
        );
    } catch (error) {
        console.error('GET /api/otb/snapshots error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch snapshots' },
            { status: 500 }
        );
    }
}
