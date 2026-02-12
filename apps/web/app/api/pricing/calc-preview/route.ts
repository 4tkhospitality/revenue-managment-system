// Phase 00: Calc Preview API — thin wrapper over service.calculatePreview()
// ARCHITECTURE: no pricing math here, only parse + call service + return
import { NextRequest, NextResponse } from 'next/server';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import { calculatePreview } from '@/lib/pricing/service';

interface CalcPreviewRequest {
    channelId: string;
    roomTypeId?: string;
    mode: 'NET' | 'BAR' | 'DISPLAY';
    value: number;
    selectedCampaignInstanceIds?: string[];
    seasonId?: string;
    occPct?: number;
}

// POST /api/pricing/calc-preview
export async function POST(request: NextRequest) {
    try {
        const hotelId = await getActiveHotelId();
        if (!hotelId) {
            return NextResponse.json(
                { error: 'No active hotel selected' },
                { status: 401 }
            );
        }

        const body: CalcPreviewRequest = await request.json();

        // Validate required fields
        if (!body.channelId || !body.mode || body.value === undefined) {
            return NextResponse.json(
                { error: 'channelId, mode, and value are required' },
                { status: 400 }
            );
        }

        if (!['NET', 'BAR', 'DISPLAY'].includes(body.mode)) {
            return NextResponse.json(
                { error: 'mode must be NET, BAR, or DISPLAY' },
                { status: 400 }
            );
        }

        const result = await calculatePreview({
            hotelId,
            channelId: body.channelId,
            roomTypeId: body.roomTypeId,
            mode: body.mode,
            value: body.value,
            selectedCampaignInstanceIds: body.selectedCampaignInstanceIds,
            seasonId: body.seasonId,
            occPct: body.occPct,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error calculating preview:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to calculate preview' },
            { status: 500 }
        );
    }
}
