import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getActiveHotelId } from '../../../../lib/pricing/get-hotel';
import { buildFeaturesDaily } from '../../../actions/buildFeaturesDaily';

/**
 * POST /api/analytics/backfill
 * 
 * Batch-build features_daily for all as_of_dates in daily_otb.
 * Supports smart-skip (compare COUNT+SUM between OTB and features) and force mode.
 * Uses stateless cursor for progressive polling from UI.
 * 
 * Body: { cursor?: string, batchSize?: number, mode: "smart" | "force" }
 * Response: { built, skipped, total, nextCursor: string|null, done: boolean }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const cursor: string | null = body.cursor || null;
        const batchSize: number = Math.min(body.batchSize || 7, 30); // cap at 30
        const mode: 'smart' | 'force' = body.mode === 'force' ? 'force' : 'smart';

        const hotelId = await getActiveHotelId();
        if (!hotelId) {
            return NextResponse.json({ error: 'No active hotel' }, { status: 400 });
        }

        // Get all as_of_dates from daily_otb
        const allDatesQuery = cursor
            ? prisma.dailyOTB.findMany({
                where: { hotel_id: hotelId, as_of_date: { gt: new Date(cursor + 'T00:00:00Z') } },
                select: { as_of_date: true },
                distinct: ['as_of_date'],
                orderBy: { as_of_date: 'asc' },
            })
            : prisma.dailyOTB.findMany({
                where: { hotel_id: hotelId },
                select: { as_of_date: true },
                distinct: ['as_of_date'],
                orderBy: { as_of_date: 'asc' },
            });

        const allDates = await allDatesQuery;
        const totalRemaining = allDates.length;

        // Get total count (for first call only, when cursor is null)
        let total = totalRemaining;
        if (cursor === null) {
            // first call — total is exact
        } else {
            // subsequent calls — total was passed from first response, but we recount
            const fullCount = await prisma.dailyOTB.findMany({
                where: { hotel_id: hotelId },
                select: { as_of_date: true },
                distinct: ['as_of_date'],
            });
            total = fullCount.length;
        }

        // Take batch
        const batch = allDates.slice(0, batchSize);
        let built = 0;
        let skipped = 0;

        for (const { as_of_date } of batch) {
            const dateStr = as_of_date.toISOString().split('T')[0];

            if (mode === 'smart') {
                // Smart-skip: compare COUNT + SUM(revenue_otb) between daily_otb and features_daily
                const otbStats = await prisma.$queryRawUnsafe<{ cnt: number; rev_sum: string }[]>(
                    `SELECT COUNT(*)::int as cnt, COALESCE(SUM(revenue_otb), 0)::text as rev_sum
                     FROM daily_otb
                     WHERE hotel_id = $1::uuid AND as_of_date = $2::date AND stay_date >= $2::date`,
                    hotelId, dateStr
                );
                const featStats = await prisma.$queryRawUnsafe<{ cnt: number; rev_sum: string }[]>(
                    `SELECT COUNT(*)::int as cnt, COALESCE(SUM(revenue_otb), 0)::text as rev_sum
                     FROM features_daily
                     WHERE hotel_id = $1::uuid AND as_of_date = $2::date`,
                    hotelId, dateStr
                );

                const otb = otbStats[0] || { cnt: 0, rev_sum: '0' };
                const feat = featStats[0] || { cnt: 0, rev_sum: '0' };

                // Match = same count AND same revenue sum → skip
                if (feat.cnt > 0 && feat.cnt === otb.cnt && feat.rev_sum === otb.rev_sum) {
                    skipped++;
                    continue;
                }
            }

            // Build features for this date
            try {
                const result = await buildFeaturesDaily(hotelId, dateStr, true);
                if (result.success) built++;
                else skipped++;
            } catch {
                skipped++;
            }
        }

        // Determine next cursor
        const lastProcessed = batch[batch.length - 1];
        const nextCursor = lastProcessed
            ? lastProcessed.as_of_date.toISOString().split('T')[0]
            : null;
        const done = batch.length < batchSize || totalRemaining <= batchSize;

        return NextResponse.json({
            built,
            skipped,
            total,
            nextCursor: done ? null : nextCursor,
            done,
            mode,
        });
    } catch (error) {
        console.error('Backfill error:', error);
        return NextResponse.json(
            { error: 'Backfill failed', detail: String(error) },
            { status: 500 }
        );
    }
}
