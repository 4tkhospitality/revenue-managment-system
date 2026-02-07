/**
 * Rate Shopper — Snapshot Cron API Route
 *
 * POST /api/cron/rate-shopper/snapshot
 * Builds daily market snapshots for all hotels.
 * Scheduled at 23:00 VN time.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runSnapshotBuilder } from '@/lib/rate-shopper/jobs/snapshot-builder';

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await runSnapshotBuilder();
        return NextResponse.json({
            success: true,
            result: {
                totalHotels: result.totalHotels,
                totalSnapshots: result.totalSnapshots,
                totalFailed: result.totalFailed,
                duration_ms: result.completedAt.getTime() - result.startedAt.getTime(),
            },
        });
    } catch (error) {
        console.error('[RateShopper][Cron] Snapshot failed:', error);
        return NextResponse.json(
            { error: 'Snapshot failed', message: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 },
        );
    }
}
