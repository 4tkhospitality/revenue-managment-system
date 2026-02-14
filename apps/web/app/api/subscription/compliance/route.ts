/**
 * GET /api/subscription/compliance
 * Check if hotel capacity matches subscription band
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import prisma from '@/lib/prisma';
import { deriveBand } from '@/lib/plg/plan-config';
import { RoomBand } from '@prisma/client';

const BAND_ORDER: Record<RoomBand, number> = {
    R30: 0,
    R80: 1,
    R150: 2,
    R300P: 3,
};

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const queryHotelId = url.searchParams.get('hotelId');
        const hotelId = queryHotelId || (await getActiveHotelId());

        if (!hotelId) {
            return NextResponse.json({ error: 'No hotel selected' }, { status: 400 });
        }

        const hotel = await prisma.hotel.findUnique({
            where: { hotel_id: hotelId },
            select: { capacity: true, org_id: true },
        });

        if (!hotel) {
            return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
        }

        // Find subscription via org
        let subscription;
        if (hotel.org_id) {
            subscription = await prisma.subscription.findUnique({
                where: { org_id: hotel.org_id },
            });
        }
        if (!subscription) {
            subscription = await prisma.subscription.findFirst({
                where: { hotel_id: hotelId },
            });
        }

        const derivedBand = deriveBand(hotel.capacity);
        const subscriptionBand: RoomBand = subscription?.room_band ?? 'R30';

        const isCompliant = BAND_ORDER[derivedBand] <= BAND_ORDER[subscriptionBand];

        return NextResponse.json({
            hotelCapacity: hotel.capacity,
            derivedBand,
            subscriptionBand,
            isCompliant,
            requiresUpgrade: !isCompliant,
            suggestedBand: isCompliant ? subscriptionBand : derivedBand,
            plan: subscription?.plan ?? 'STANDARD',
        });
    } catch (error) {
        console.error('[Compliance GET] Error:', error);
        return NextResponse.json({ error: 'Failed to check compliance' }, { status: 500 });
    }
}
