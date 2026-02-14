/**
 * GET /api/organization
 * Get org info via active hotelId (avoids multi-org ambiguity)
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import prisma from '@/lib/prisma';
import { getScaledLimits } from '@/lib/plg/plan-config';
import { RoomBand } from '@prisma/client';

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Resolve org via active hotel (avoids multi-org ambiguity)
        const url = new URL(request.url);
        const queryHotelId = url.searchParams.get('hotelId');
        const hotelId = queryHotelId || (await getActiveHotelId());

        if (!hotelId) {
            return NextResponse.json({ error: 'No hotel context' }, { status: 400 });
        }

        const hotel = await prisma.hotel.findUnique({
            where: { hotel_id: hotelId },
            select: { org_id: true },
        });

        if (!hotel?.org_id) {
            return NextResponse.json({ error: 'Hotel not in org' }, { status: 404 });
        }

        const [org, hotelCount, memberCount, subscription] = await Promise.all([
            prisma.organization.findUnique({ where: { id: hotel.org_id } }),
            prisma.hotel.count({ where: { org_id: hotel.org_id } }),
            prisma.orgMember.count({ where: { org_id: hotel.org_id } }),
            prisma.subscription.findUnique({ where: { org_id: hotel.org_id } }),
        ]);

        if (!org) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        const plan = subscription?.plan ?? 'STANDARD';
        const roomBand: RoomBand = subscription?.room_band ?? 'R30';
        const limits = getScaledLimits(plan, roomBand);

        return NextResponse.json({
            org: { id: org.id, name: org.name, slug: org.slug },
            hotels: { count: hotelCount, maxProperties: limits.maxProperties },
            members: { count: memberCount, maxUsers: limits.maxUsers },
            subscription: {
                plan,
                roomBand,
                status: subscription?.status ?? 'ACTIVE',
            },
        });
    } catch (error) {
        console.error('[Organization GET] Error:', error);
        return NextResponse.json({ error: 'Failed to get organization' }, { status: 500 });
    }
}
