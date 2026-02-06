// V01.2: Room Types API - Update & Delete
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';

// PATCH /api/pricing/room-types/[id] - Update room type
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const hotelId = await getActiveHotelId();

        if (!hotelId) {
            return NextResponse.json(
                { error: 'No active hotel selected' },
                { status: 401 }
            );
        }

        // Verify ownership
        const existing = await prisma.roomType.findFirst({
            where: { id, hotel_id: hotelId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Room type not found' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const updateData: any = {};

        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.net_price !== undefined) updateData.net_price = parseFloat(body.net_price);

        const updated = await prisma.roomType.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Room type with this name already exists' },
                { status: 409 }
            );
        }
        console.error('Error updating room type:', error);
        return NextResponse.json(
            { error: 'Failed to update room type' },
            { status: 500 }
        );
    }
}

// DELETE /api/pricing/room-types/[id] - Delete room type
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const hotelId = await getActiveHotelId();

        if (!hotelId) {
            return NextResponse.json(
                { error: 'No active hotel selected' },
                { status: 401 }
            );
        }

        // Verify ownership
        const existing = await prisma.roomType.findFirst({
            where: { id, hotel_id: hotelId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Room type not found' },
                { status: 404 }
            );
        }

        await prisma.roomType.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting room type:', error);
        return NextResponse.json(
            { error: 'Failed to delete room type' },
            { status: 500 }
        );
    }
}
