// POST /api/pricing/dynamic-matrix
// Thin wrapper → service.calculateDynamicMatrix()
import { NextRequest, NextResponse } from 'next/server';
import { calculateDynamicMatrix } from '@/lib/pricing/service';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';

export async function POST(request: NextRequest) {
    try {
        const hotelId = await getActiveHotelId();
        if (!hotelId) {
            return NextResponse.json(
                { error: 'No active hotel selected' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { stayDate, channelId, seasonIdOverride, occOverride } = body;

        if (!stayDate || !channelId) {
            return NextResponse.json(
                { error: 'stayDate and channelId are required' },
                { status: 400 }
            );
        }

        const result = await calculateDynamicMatrix({
            hotelId,
            stayDate,
            channelId,
            seasonIdOverride: seasonIdOverride || undefined,
            occOverride: occOverride !== undefined ? Number(occOverride) : undefined,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('[dynamic-matrix] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}
