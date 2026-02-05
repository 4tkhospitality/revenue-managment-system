// V01.2: Campaigns API - Update & Delete
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';

// PATCH /api/pricing/campaigns/[id] - Update campaign
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
        const existing = await prisma.campaignInstance.findFirst({
            where: { id, hotel_id: hotelId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const updateData: any = {};

        if (body.discount_pct !== undefined) updateData.discount_pct = parseFloat(body.discount_pct);
        if (body.is_active !== undefined) updateData.is_active = body.is_active;
        if (body.start_date !== undefined) updateData.start_date = body.start_date ? new Date(body.start_date) : null;
        if (body.end_date !== undefined) updateData.end_date = body.end_date ? new Date(body.end_date) : null;

        const updated = await prisma.campaignInstance.update({
            where: { id },
            data: updateData,
            include: {
                promo: true,
                ota_channel: true,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating campaign:', error);
        return NextResponse.json(
            { error: 'Failed to update campaign' },
            { status: 500 }
        );
    }
}

// DELETE /api/pricing/campaigns/[id] - Delete campaign
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
        const existing = await prisma.campaignInstance.findFirst({
            where: { id, hotel_id: hotelId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            );
        }

        await prisma.campaignInstance.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        return NextResponse.json(
            { error: 'Failed to delete campaign' },
            { status: 500 }
        );
    }
}
