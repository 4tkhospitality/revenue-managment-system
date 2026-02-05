// V01.2: Room Types API - List & Create
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';

// GET /api/pricing/room-types - List room types for active hotel
export async function GET() {
    try {
        const hotelId = await getActiveHotelId();

        if (!hotelId) {
            return NextResponse.json(
                { error: 'No active hotel selected' },
                { status: 401 }
            );
        }

        const roomTypes = await prisma.roomType.findMany({
            where: { hotel_id: hotelId },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(roomTypes);
    } catch (error) {
        console.error('Error fetching room types:', error);
        return NextResponse.json(
            { error: 'Failed to fetch room types' },
            { status: 500 }
        );
    }
}


// POST /api/pricing/room-types - Create room type
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
        const { name, description, net_price } = body;

        if (!name || net_price === undefined) {
            return NextResponse.json(
                { error: 'Name and net_price are required' },
                { status: 400 }
            );
        }

        const roomType = await prisma.roomType.create({
            data: {
                hotel_id: hotelId,
                name,
                description: description || null,
                net_price: parseFloat(net_price),
            },
        });

        return NextResponse.json(roomType, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Room type with this name already exists' },
                { status: 409 }
            );
        }
        console.error('Error creating room type:', error);
        return NextResponse.json(
            { error: 'Failed to create room type' },
            { status: 500 }
        );
    }
}
