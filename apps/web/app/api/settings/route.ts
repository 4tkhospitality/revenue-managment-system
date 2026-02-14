import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import { deriveBand } from '@/lib/plg/plan-config';

export async function GET(request: NextRequest) {
    // Auth: require logged-in user
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tenant isolation: use active hotel, not client-supplied hotelId
    const hotelId = await getActiveHotelId();
    if (!hotelId) {
        return NextResponse.json({ error: 'No active hotel' }, { status: 403 });
    }

    try {
        const hotel = await prisma.hotel.findUnique({
            where: { hotel_id: hotelId }
        });

        return NextResponse.json({ hotel });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    // Auth + role check: modifying settings requires manager+
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = session.user.role || 'viewer';
    if (!session.user.isAdmin && !['manager', 'hotel_admin'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden — Manager role required to modify settings' }, { status: 403 });
    }

    // Tenant isolation: use active hotel, ignore client-supplied hotelId
    const hotelId = await getActiveHotelId();
    if (!hotelId) {
        return NextResponse.json({ error: 'No active hotel' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const {
            name,
            capacity,
            currency,
            defaultBaseRate,
            minRate,
            maxRate,
            timezone,
            fiscalStartDay,
            ladderSteps
        } = body;

        const hotel = await prisma.hotel.update({
            where: { hotel_id: hotelId },
            data: {
                name,
                capacity,
                currency,
                default_base_rate: defaultBaseRate,
                min_rate: minRate,
                max_rate: maxRate,
                timezone: timezone || 'Asia/Ho_Chi_Minh',
                fiscal_start_day: fiscalStartDay || 1,
                ladder_steps: ladderSteps || null,
            },
        });

        // Auto-sync subscription band when capacity changes
        if (capacity !== undefined) {
            const newBand = deriveBand(capacity);
            await prisma.$executeRaw`
                UPDATE subscriptions
                SET room_band = ${newBand}::"RoomBand",
                    capacity_snapshot = ${capacity}
                WHERE hotel_id = ${hotelId}::uuid
            `;
        }

        return NextResponse.json({ success: true, hotel });
    } catch (error) {
        console.error('Error saving settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
