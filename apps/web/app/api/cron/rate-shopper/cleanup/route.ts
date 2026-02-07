/**
 * Rate Shopper — Cleanup Cron API Route
 *
 * POST /api/cron/rate-shopper/cleanup
 * Purges expired data per retention policy.
 * Scheduled at 03:00 VN time.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runDataCleanup } from '@/lib/rate-shopper/jobs/data-cleanup';

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await runDataCleanup();
        return NextResponse.json({
            success: true,
            result: {
                rawResponsesCleared: result.rawResponsesCleared,
                pastStayRatesPurged: result.pastStayRatesPurged,
                oldSnapshotsPurged: result.oldSnapshotsPurged,
                oldCompetitorRatesPurged: result.oldCompetitorRatesPurged,
                expiredRecommendationsPurged: result.expiredRecommendationsPurged,
                duration_ms: result.completedAt.getTime() - result.startedAt.getTime(),
            },
        });
    } catch (error) {
        console.error('[RateShopper][Cron] Cleanup failed:', error);
        return NextResponse.json(
            { error: 'Cleanup failed', message: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 },
        );
    }
}
