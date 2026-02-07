/**
 * Rate Shopper — Cron API Route
 *
 * Endpoint for triggering the scheduler via cron service (e.g., Vercel Cron, external cron).
 * Secured with CRON_SECRET header validation.
 *
 * @see spec §10.2, Key Decision #9
 */

import { NextRequest, NextResponse } from 'next/server';
import { runScheduler } from '@/lib/rate-shopper/jobs/scheduler';

/**
 * POST /api/cron/rate-shopper
 *
 * Headers required:
 * - Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
    // 1. Validate CRON_SECRET
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        return NextResponse.json(
            { error: 'CRON_SECRET not configured' },
            { status: 500 },
        );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 },
        );
    }

    try {
        // 2. Run scheduler
        const result = await runScheduler();

        // 3. Return result for observability
        return NextResponse.json({
            success: true,
            result: {
                totalChecked: result.totalChecked,
                totalRefreshed: result.totalRefreshed,
                totalSkipped: result.totalSkipped,
                totalFailed: result.totalFailed,
                budgetUsed: result.budgetUsed,
                duration_ms:
                    result.completedAt.getTime() - result.startedAt.getTime(),
            },
        });
    } catch (error) {
        console.error('[RateShopper][Cron] Scheduler failed:', error);
        return NextResponse.json(
            {
                error: 'Scheduler failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
