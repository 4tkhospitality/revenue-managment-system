/**
 * Rate Shopper — Competitors API Route
 *
 * CRUD operations for competitor management.
 * GET  /api/rate-shopper/competitors — list active competitors
 * POST /api/rate-shopper/competitors — add a new competitor
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import {
    listCompetitors,
    addCompetitor,
} from '@/lib/rate-shopper/actions/competitor-management';

export async function GET() {
    try {
        const hotelId = await getActiveHotelId();
        if (!hotelId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const competitors = await listCompetitors(hotelId);
        return NextResponse.json({ data: competitors });
    } catch (error) {
        console.error('[RateShopper][API] List competitors error:', error);
        return NextResponse.json(
            { error: 'Failed to list competitors' },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const hotelId = await getActiveHotelId();
        if (!hotelId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, serpApiPropertyToken, tier } = body;

        if (!name || !serpApiPropertyToken) {
            return NextResponse.json(
                { error: 'Missing name or serpApiPropertyToken' },
                { status: 400 },
            );
        }

        // Verify hotel exists before trying to add competitor
        const hotel = await (await import('@/lib/prisma')).default.hotel.findUnique({
            where: { hotel_id: hotelId },
            select: { hotel_id: true },
        });
        if (!hotel) {
            console.error('[RateShopper][API] Hotel not found:', hotelId);
            return NextResponse.json(
                { error: `Hotel không tồn tại (ID: ${hotelId}). Vui lòng chuyển sang khách sạn hợp lệ.` },
                { status: 400 },
            );
        }

        const competitor = await addCompetitor({
            hotelId,
            name,
            serpApiPropertyToken,
            tier: tier ? parseInt(String(tier), 10) || 1 : 1,
        });

        return NextResponse.json({ data: competitor });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add competitor';
        return NextResponse.json(
            { error: message },
            { status: message.includes('already exists') ? 409 : 500 },
        );
    }
}
