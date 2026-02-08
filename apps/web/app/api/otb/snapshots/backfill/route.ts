import { NextRequest, NextResponse } from 'next/server';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import { backfillMonthlySnapshots } from '@/app/actions/buildDailyOTB';

/**
 * POST /api/otb/snapshots/backfill
 * Backfill multiple OTB snapshots (chunked for Vercel timeout)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            from,
            to,
            freq = 'monthly',
            missing_only = true,
            limit = 3
        } = body;

        const hotelId = await getActiveHotelId();

        if (!hotelId) {
            return NextResponse.json(
                { error: 'No active hotel' },
                { status: 400 }
            );
        }

        const result = await backfillMonthlySnapshots({
            hotelId,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
            freq: freq as 'monthly' | 'weekly',
            missingOnly: missing_only,
            limit
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('POST /api/otb/snapshots/backfill error:', error);
        return NextResponse.json(
            { error: 'Failed to backfill snapshots' },
            { status: 500 }
        );
    }
}
