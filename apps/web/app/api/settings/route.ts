import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const hotelId = request.nextUrl.searchParams.get('hotelId');

    if (!hotelId) {
        return NextResponse.json({ error: 'hotelId required' }, { status: 400 });
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
    try {
        const body = await request.json();
        const {
            hotelId,
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

        if (!hotelId) {
            return NextResponse.json({ error: 'hotelId required' }, { status: 400 });
        }

        const hotel = await prisma.hotel.upsert({
            where: { hotel_id: hotelId },
            update: {
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
            create: {
                hotel_id: hotelId,
                name,
                capacity,
                currency,
                default_base_rate: defaultBaseRate,
                min_rate: minRate,
                max_rate: maxRate,
                timezone: timezone || 'Asia/Ho_Chi_Minh',
                fiscal_start_day: fiscalStartDay || 1,
                ladder_steps: ladderSteps || null,
            }
        });

        return NextResponse.json({ success: true, hotel });
    } catch (error) {
        console.error('Error saving settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
