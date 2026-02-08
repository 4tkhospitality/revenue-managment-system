/**
 * Rate Shopper — Recommendations API Route
 *
 * GET  /api/rate-shopper/recommendations — list pending recommendations
 * POST /api/rate-shopper/recommendations — accept or reject
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import { auth } from '@/lib/auth';
import {
    getPendingRecommendations,
    acceptRecommendation,
    rejectRecommendation,
} from '@/lib/rate-shopper/jobs/recommendation-engine';

export async function GET() {
    try {
        const hotelId = await getActiveHotelId();
        if (!hotelId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const recommendations = await getPendingRecommendations(hotelId);
        return NextResponse.json({ data: recommendations });
    } catch (error) {
        console.error('[RateShopper][API] Recommendations error:', error);
        return NextResponse.json(
            { error: 'Failed to load recommendations' },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Auth + role check: accepting/rejecting recommendations requires manager+
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const role = session.user.role || 'viewer';
        if (!session.user.isAdmin && !['manager', 'hotel_admin'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden — Manager role required' }, { status: 403 });
        }

        const hotelId = await getActiveHotelId();
        if (!hotelId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { recommendationId, action } = body;

        if (!recommendationId || !['accept', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: 'Missing recommendationId or invalid action' },
                { status: 400 },
            );
        }

        if (action === 'accept') {
            await acceptRecommendation(hotelId, recommendationId);
        } else {
            await rejectRecommendation(hotelId, recommendationId);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[RateShopper][API] Recommendation action error:', error);
        return NextResponse.json(
            { error: 'Action failed' },
            { status: 500 },
        );
    }
}
