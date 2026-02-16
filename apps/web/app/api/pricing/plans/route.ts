/**
 * GET /api/pricing/plans?band=R30
 * Returns dynamic prices for all tiers at the given room band.
 * Uses DB-backed pricing configs with hardcoded fallback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { RoomBand } from '@prisma/client';
import { getAllDynamicPrices } from '@/lib/plg/plan-config';

const VALID_BANDS: RoomBand[] = ['R30', 'R80', 'R150', 'R300P'];

export async function GET(req: NextRequest) {
    const band = (req.nextUrl.searchParams.get('band') || 'R30') as RoomBand;

    if (!VALID_BANDS.includes(band)) {
        return NextResponse.json({ error: 'Invalid band' }, { status: 400 });
    }

    try {
        const prices = await getAllDynamicPrices(band);
        return NextResponse.json(prices);
    } catch (error) {
        console.error('[Pricing Plans API] Error:', error);
        return NextResponse.json({ error: 'Failed to load prices' }, { status: 500 });
    }
}
