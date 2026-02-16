// Public API – Get active pricing for pricing page display
// GET /api/pricing/active?band=R30&hotelId=...

import { NextRequest, NextResponse } from 'next/server';
import { getAllDynamicPrices } from '@/lib/plg/plan-config';
import type { RoomBand } from '@prisma/client';

const VALID_BANDS: RoomBand[] = ['R30', 'R80', 'R150', 'R300P'];

export async function GET(req: NextRequest) {
    const band = (req.nextUrl.searchParams.get('band') || 'R30') as RoomBand;
    const hotelId = req.nextUrl.searchParams.get('hotelId') || undefined;

    if (!VALID_BANDS.includes(band)) {
        return NextResponse.json({ error: 'Invalid band' }, { status: 400 });
    }

    try {
        const prices = await getAllDynamicPrices(band, hotelId);
        return NextResponse.json(prices);
    } catch (error) {
        console.error('[Pricing Active] GET error:', error);
        // Fallback: return empty so frontend uses static prices
        return NextResponse.json({}, { status: 200 });
    }
}
