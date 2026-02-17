// Dynamic Pricing: Seasons — Update & Delete
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';

// PUT /api/pricing/seasons/[id] — Update season
export async function PUT(
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
        const existing = await prisma.seasonConfig.findFirst({
            where: { id, hotel_id: hotelId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Season not found' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const updateData: Record<string, any> = {};

        if (body.name !== undefined) updateData.name = body.name.trim();
        if (body.code !== undefined) {
            const codeUpper = body.code.toUpperCase().trim();
            if (!/^[A-Z_]{2,20}$/.test(codeUpper)) {
                return NextResponse.json(
                    { error: 'Code must be 2-20 uppercase letters/underscores' },
                    { status: 400 }
                );
            }
            updateData.code = codeUpper;
        }
        if (body.date_ranges !== undefined) {
            // Validate date_ranges
            if (Array.isArray(body.date_ranges)) {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                for (const range of body.date_ranges) {
                    if (!range.start || !range.end ||
                        !dateRegex.test(range.start) || !dateRegex.test(range.end) ||
                        range.start > range.end) {
                        return NextResponse.json(
                            { error: 'Invalid date range format' },
                            { status: 400 }
                        );
                    }
                }
            }
            updateData.date_ranges = body.date_ranges;
        }
        if (body.priority !== undefined) updateData.priority = body.priority;
        if (body.is_active !== undefined) updateData.is_active = body.is_active;
        if (body.multiplier !== undefined) updateData.multiplier = body.multiplier;

        const updated = await prisma.seasonConfig.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Season with this code already exists for this hotel' },
                { status: 409 }
            );
        }
        console.error('Error updating season:', error);
        return NextResponse.json(
            { error: 'Failed to update season' },
            { status: 500 }
        );
    }
}

// DELETE /api/pricing/seasons/[id] — Delete season (cascades to SeasonNetRate)
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
        const existing = await prisma.seasonConfig.findFirst({
            where: { id, hotel_id: hotelId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Season not found' },
                { status: 404 }
            );
        }

        await prisma.seasonConfig.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting season:', error);
        return NextResponse.json(
            { error: 'Failed to delete season' },
            { status: 500 }
        );
    }
}
