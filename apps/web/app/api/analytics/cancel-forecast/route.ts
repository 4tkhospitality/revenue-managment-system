import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getActiveHotelId } from '../../../../lib/pricing/get-hotel';

/**
 * GET /api/analytics/cancel-forecast
 * Returns cancel forecast data from features_daily for the dashboard.
 * Query params: ?hotelId=xxx&asOf=YYYY-MM-DD
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const hotelId = searchParams.get('hotelId') || await getActiveHotelId();
        const asOfParam = searchParams.get('asOf');

        if (!hotelId) {
            return NextResponse.json({ error: 'No hotel found' }, { status: 400 });
        }

        // Determine as_of_date
        let asOfDate: Date;
        if (asOfParam) {
            asOfDate = new Date(asOfParam);
        } else {
            const latest = await prisma.featuresDaily.findFirst({
                where: { hotel_id: hotelId },
                orderBy: { as_of_date: 'desc' },
                select: { as_of_date: true },
            });
            if (!latest) {
                return NextResponse.json({ error: 'No features data' }, { status: 404 });
            }
            asOfDate = latest.as_of_date;
        }

        // Fetch features with cancel forecast columns
        const features = await prisma.featuresDaily.findMany({
            where: {
                hotel_id: hotelId,
                as_of_date: asOfDate,
                stay_date: { gte: asOfDate },
            },
            orderBy: { stay_date: 'asc' },
            select: {
                stay_date: true,
                expected_cxl: true,
                net_remaining: true,
                cxl_rate_used: true,
                cxl_confidence: true,
                remaining_supply: true,
            },
        });

        // Fetch cancel stats summary
        const stats = await prisma.cancelRateStats.findMany({
            where: { hotel_id: hotelId },
            select: {
                segment: true,
                cancel_rate: true,
                total_rooms: true,
                cancelled_rooms: true,
                confidence: true,
                computed_at: true,
                unknown_pct: true,
            },
        });

        // Compute summary KPIs
        const allSegment = stats.filter(s => s.segment === 'ALL');
        const perSegment = stats.filter(s => s.segment !== 'ALL');

        const avgRate = allSegment.length > 0
            ? allSegment.reduce((s, r) => s + r.cancel_rate * r.total_rooms, 0) /
            Math.max(1, allSegment.reduce((s, r) => s + r.total_rooms, 0))
            : null;

        // Find top-cancelling segment
        const segmentRates = new Map<string, { totalRooms: number; cancelledRooms: number }>();
        for (const s of perSegment) {
            const existing = segmentRates.get(s.segment);
            if (existing) {
                existing.totalRooms += s.total_rooms;
                existing.cancelledRooms += s.cancelled_rooms;
            } else {
                segmentRates.set(s.segment, {
                    totalRooms: s.total_rooms,
                    cancelledRooms: s.cancelled_rooms,
                });
            }
        }

        let topSegment: { name: string; rate: number } | null = null;
        let maxRate = 0;
        for (const [name, data] of segmentRates) {
            const rate = data.totalRooms > 0 ? data.cancelledRooms / data.totalRooms : 0;
            if (rate > maxRate) {
                maxRate = rate;
                topSegment = { name, rate };
            }
        }

        const lastComputed = stats.length > 0
            ? new Date(Math.max(...stats.map(s => s.computed_at.getTime()))).toISOString()
            : null;

        return NextResponse.json({
            asOfDate: asOfDate.toISOString().slice(0, 10),
            rows: features.map(f => ({
                stay_date: f.stay_date.toISOString().slice(0, 10),
                expected_cxl: f.expected_cxl,
                net_remaining: f.net_remaining,
                cxl_rate_used: f.cxl_rate_used,
                cxl_confidence: f.cxl_confidence,
                remaining_supply: f.remaining_supply,
            })),
            summary: {
                avgCancelRate: avgRate,
                topSegment,
                totalBuckets: stats.length,
                lastComputed,
                unknownPct: stats.length > 0 ? stats[0].unknown_pct : null,
            },
        });
    } catch (error: any) {
        console.error('[cancel-forecast API]', error?.message);
        return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
    }
}
