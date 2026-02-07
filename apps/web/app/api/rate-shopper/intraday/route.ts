/**
 * Rate Shopper — Intraday API Route
 *
 * GET /api/rate-shopper/intraday
 * Returns the IntradayViewModel for the currently active hotel.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import { getIntradayView } from '@/lib/rate-shopper/actions/get-intraday-view';

export async function GET(request: NextRequest) {
    try {
        const hotelId = await getActiveHotelId();

        if (!hotelId) {
            return NextResponse.json(
                { error: 'Unauthorized — no hotel assigned' },
                { status: 401 },
            );
        }

        // Optional: filter by single offset
        const offsetParam = request.nextUrl.searchParams.get('offset');
        const offsets = offsetParam ? [parseInt(offsetParam, 10) as any] : undefined;

        const data = await getIntradayView(hotelId, offsets);

        return NextResponse.json({ data });
    } catch (error) {
        console.error('[RateShopper][API] Intraday error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 },
        );
    }
}
