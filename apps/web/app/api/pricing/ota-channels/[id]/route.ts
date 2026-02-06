// V01.2: OTA Channels API - Update & Delete
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';

// PATCH /api/pricing/ota-channels/[id] - Update OTA channel
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
        const existing = await prisma.oTAChannel.findFirst({
            where: { id, hotel_id: hotelId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'OTA channel not found' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const updateData: any = {};

        if (body.name !== undefined) updateData.name = body.name;
        if (body.code !== undefined) updateData.code = body.code.toLowerCase();
        if (body.commission !== undefined) updateData.commission = parseFloat(body.commission);
        if (body.calc_type !== undefined) updateData.calc_type = body.calc_type;
        if (body.is_active !== undefined) updateData.is_active = body.is_active;

        const updated = await prisma.oTAChannel.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'OTA channel with this code already exists' },
                { status: 409 }
            );
        }
        console.error('Error updating OTA channel:', error);
        return NextResponse.json(
            { error: 'Failed to update OTA channel' },
            { status: 500 }
        );
    }
}

// DELETE /api/pricing/ota-channels/[id] - Delete OTA channel
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
        const existing = await prisma.oTAChannel.findFirst({
            where: { id, hotel_id: hotelId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'OTA channel not found' },
                { status: 404 }
            );
        }

        // onDelete: Cascade will delete campaigns too
        await prisma.oTAChannel.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting OTA channel:', error);
        return NextResponse.json(
            { error: 'Failed to delete OTA channel' },
            { status: 500 }
        );
    }
}
