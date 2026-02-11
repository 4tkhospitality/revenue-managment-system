import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/features/latest-date?hotelId=xxx
 * Returns the latest as_of_date from features_daily for a hotel.
 * Used by Run Forecast to align with Build Features' as_of_date.
 */
export async function GET(req: NextRequest) {
    const hotelId = req.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
        return NextResponse.json({ error: 'hotelId required' }, { status: 400 });
    }

    const latest = await prisma.featuresDaily.aggregate({
        where: { hotel_id: hotelId },
        _max: { as_of_date: true },
    });

    return NextResponse.json({
        latestAsOfDate: latest._max.as_of_date?.toISOString() || null,
    });
}
