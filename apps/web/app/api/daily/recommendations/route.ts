/**
 * GET /api/daily/recommendations
 * Fetch daily action recommendations for the active hotel
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import { generateDailyActions } from '@/lib/engine/dailyAction';
import { requireFeature, FeatureGateError } from '@/lib/tier/checkFeature';

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const hotelId = await getActiveHotelId();
        if (!hotelId) {
            return NextResponse.json({ error: 'No hotel selected' }, { status: 400 });
        }

        // Feature gate: daily_actions requires Starter+
        try {
            await requireFeature(hotelId, 'daily_actions');
        } catch (e) {
            if (e instanceof FeatureGateError) {
                return NextResponse.json(
                    {
                        error: 'Feature requires upgrade',
                        feature: e.feature,
                        requiredTier: e.requiredTier,
                        currentTier: e.currentTier,
                    },
                    { status: 403 }
                );
            }
            throw e;
        }

        // Parse query params
        const url = new URL(request.url);
        const daysAhead = parseInt(url.searchParams.get('days') || '30', 10);

        // Generate recommendations
        const result = await generateDailyActions(hotelId, Math.min(daysAhead, 90));

        return NextResponse.json(result);
    } catch (error) {
        console.error('[Daily Recommendations] Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate recommendations' },
            { status: 500 }
        );
    }
}
