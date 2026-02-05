// V01.2: OTA Channels API - List & Create
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { seedDefaultOTAChannels } from '@/lib/pricing/seed-defaults';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';

// GET /api/pricing/ota-channels - List OTA channels for active hotel
export async function GET() {
    try {
        const hotelId = await getActiveHotelId();

        if (!hotelId) {
            return NextResponse.json(
                { error: 'No active hotel selected' },
                { status: 401 }
            );
        }


        // Check if hotel has any OTA channels, if not - seed defaults
        const existingCount = await prisma.oTAChannel.count({
            where: { hotel_id: hotelId },
        });

        if (existingCount === 0) {
            console.log(`[Pricing] Seeding default OTA channels for hotel ${hotelId}`);
            const created = await seedDefaultOTAChannels(hotelId);
            console.log(`[Pricing] Created ${created} default OTA channels`);
        }

        const channels = await prisma.oTAChannel.findMany({
            where: { hotel_id: hotelId },
            orderBy: { name: 'asc' },
            include: {
                campaigns: {
                    where: { is_active: true },
                    include: {
                        promo: true,
                    },
                },
            },
        });

        return NextResponse.json(channels);
    } catch (error) {
        console.error('Error fetching OTA channels:', error);
        return NextResponse.json(
            { error: 'Failed to fetch OTA channels' },
            { status: 500 }
        );
    }
}


// POST /api/pricing/ota-channels - Create OTA channel
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
        const { name, code, commission, calc_type, is_active } = body;

        if (!name || !code || commission === undefined) {
            return NextResponse.json(
                { error: 'Name, code, and commission are required' },
                { status: 400 }
            );
        }

        const channel = await prisma.oTAChannel.create({
            data: {
                hotel_id: hotelId,
                name,
                code: code.toLowerCase(),
                commission: parseFloat(commission),
                calc_type: calc_type || 'PROGRESSIVE',
                is_active: is_active !== false,
            },
        });

        return NextResponse.json(channel, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'OTA channel with this code already exists' },
                { status: 409 }
            );
        }
        console.error('Error creating OTA channel:', error);
        return NextResponse.json(
            { error: 'Failed to create OTA channel' },
            { status: 500 }
        );
    }
}
