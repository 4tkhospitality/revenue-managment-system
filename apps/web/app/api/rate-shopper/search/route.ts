/**
 * Rate Shopper — Competitor Search (Autocomplete) API Route
 *
 * GET /api/rate-shopper/search?q=hotel+name
 * Uses SerpApi autocomplete to find properties for competitor onboarding.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import { searchCompetitor } from '@/lib/rate-shopper/actions/competitor-management';

export async function GET(request: NextRequest) {
    try {
        const hotelId = await getActiveHotelId();
        if (!hotelId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const query = request.nextUrl.searchParams.get('q') ?? '';
        const result = await searchCompetitor(query);

        return NextResponse.json({
            data: result.suggestions,
            fromCache: result.fromCache ?? false,
        });
    } catch (error) {
        console.error('[RateShopper][API] Search error:', error);
        return NextResponse.json(
            { error: 'Search failed' },
            { status: 500 },
        );
    }
}
