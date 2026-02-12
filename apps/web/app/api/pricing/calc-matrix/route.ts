// Phase 00: Calculate Price Matrix API — thin wrapper over service
// ARCHITECTURE: route only does auth + parse + delegate, NO pricing math
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { calculateMatrix, calculatePreview } from '@/lib/pricing/service';
import type { PreviewResult } from '@/lib/pricing/service';

interface CalcMatrixRequest {
    mode?: 'net_to_bar' | 'bar_to_net';
    displayPrice?: number;
    displayPrices?: Record<string, number>;
    // Dynamic Pricing extensions
    seasonId?: string;
    occPct?: number;
}

// POST /api/pricing/calc-matrix
export async function POST(request: NextRequest) {
    try {
        // Parse request body
        let body: CalcMatrixRequest = {};
        try {
            body = await request.json();
        } catch {
            // No body or invalid JSON - use defaults
        }

        const mode = body.mode || 'net_to_bar';

        // Read hotel ID from cookie, fallback to session
        let hotelId = request.cookies.get('rms_active_hotel')?.value;
        if (!hotelId) {
            const session = await auth();
            if (session?.user?.accessibleHotels?.length) {
                hotelId = session.user.accessibleHotels[0].hotelId;
            }
        }

        if (!hotelId) {
            return NextResponse.json(
                { error: 'No active hotel selected' },
                { status: 401 }
            );
        }

        if (mode === 'net_to_bar') {
            // Standard mode: delegate entirely to service.calculateMatrix()
            const response = await calculateMatrix({
                hotelId,
                seasonId: body.seasonId,
                occPct: body.occPct,
            });
            return NextResponse.json(response);
        }

        // bar_to_net mode: per room type display prices → preview for each
        // This mode is used by the "Display Price" tab
        const displayPrices = body.displayPrices || {};
        const displayPriceFallback = body.displayPrice;

        // Fetch channels to know which ones to calculate
        const matrixData = await calculateMatrix({
            hotelId,
            seasonId: body.seasonId,
            occPct: body.occPct,
        });

        // For bar_to_net, recalculate cells using DISPLAY mode preview
        const updatedMatrix = { ...matrixData.matrix };

        for (const rt of matrixData.roomTypes) {
            const dpForRoom = displayPrices[rt.id] || displayPriceFallback;
            if (!dpForRoom) continue;

            for (const ch of matrixData.channels) {
                const key = `${rt.id}:${ch.id}`;
                try {
                    const preview: PreviewResult = await calculatePreview({
                        hotelId,
                        channelId: ch.id,
                        roomTypeId: rt.id,
                        mode: 'DISPLAY',
                        value: dpForRoom,
                        seasonId: body.seasonId,
                        occPct: body.occPct,
                    });

                    updatedMatrix[key] = {
                        roomTypeId: rt.id,
                        channelId: ch.id,
                        bar: preview.bar,
                        display: preview.display,
                        net: preview.net,
                        commission: ch.commission,
                        totalDiscount: preview.totalDiscountEffective,
                        validation: preview.validation,
                        trace: preview.trace,
                    };
                } catch (e) {
                    console.error(`Preview failed for ${key}:`, e);
                    // Keep existing cell from net_to_bar calculation
                }
            }
        }

        return NextResponse.json({
            ...matrixData,
            matrix: updatedMatrix,
        });

    } catch (error) {
        console.error('Error calculating price matrix:', error);
        return NextResponse.json(
            { error: 'Failed to calculate price matrix' },
            { status: 500 }
        );
    }
}
