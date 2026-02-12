// Dynamic Pricing: Season NET Rates — List & Bulk Upsert
// BA Note #1: hotel_id derived server-side, validate room_type belongs to hotel
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';

// GET /api/pricing/season-rates?seasonId=xxx — List rates for a season
export async function GET(request: NextRequest) {
    try {
        const hotelId = await getActiveHotelId();

        if (!hotelId) {
            return NextResponse.json(
                { error: 'No active hotel selected' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const seasonId = searchParams.get('seasonId');

        if (!seasonId) {
            return NextResponse.json(
                { error: 'seasonId query parameter is required' },
                { status: 400 }
            );
        }

        // Verify season belongs to this hotel
        const season = await prisma.seasonConfig.findFirst({
            where: { id: seasonId, hotel_id: hotelId },
        });

        if (!season) {
            return NextResponse.json(
                { error: 'Season not found' },
                { status: 404 }
            );
        }

        const rates = await prisma.seasonNetRate.findMany({
            where: {
                season_id: seasonId,
                hotel_id: hotelId,
            },
            include: {
                room_type: {
                    select: { id: true, name: true, net_price: true },
                },
            },
            orderBy: { room_type: { name: 'asc' } },
        });

        return NextResponse.json({
            season,
            rates,
        });
    } catch (error) {
        console.error('Error fetching season rates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch season rates' },
            { status: 500 }
        );
    }
}

// PUT /api/pricing/season-rates — Bulk upsert rates for a season
//   Body: { seasonId, rates: [{ room_type_id, net_rate }] }
export async function PUT(request: NextRequest) {
    try {
        const hotelId = await getActiveHotelId();

        if (!hotelId) {
            return NextResponse.json(
                { error: 'No active hotel selected' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { seasonId, rates } = body;

        if (!seasonId || !Array.isArray(rates)) {
            return NextResponse.json(
                { error: 'seasonId and rates array are required' },
                { status: 400 }
            );
        }

        // Verify season belongs to this hotel
        const season = await prisma.seasonConfig.findFirst({
            where: { id: seasonId, hotel_id: hotelId },
        });

        if (!season) {
            return NextResponse.json(
                { error: 'Season not found for this hotel' },
                { status: 404 }
            );
        }

        // Validate all room_types belong to this hotel
        const roomTypeIds = rates.map((r: any) => r.room_type_id);
        const validRoomTypes = await prisma.roomType.findMany({
            where: {
                id: { in: roomTypeIds },
                hotel_id: hotelId,
            },
            select: { id: true },
        });

        const validIds = new Set(validRoomTypes.map((rt) => rt.id));
        const invalidIds = roomTypeIds.filter((id: string) => !validIds.has(id));

        if (invalidIds.length > 0) {
            return NextResponse.json(
                {
                    error: 'Some room types do not belong to this hotel',
                    invalidRoomTypeIds: invalidIds,
                },
                { status: 400 }
            );
        }

        // Validate net_rate values
        for (const rate of rates) {
            const nr = parseFloat(rate.net_rate);
            if (isNaN(nr) || nr < 0) {
                return NextResponse.json(
                    { error: `Invalid net_rate for room ${rate.room_type_id}` },
                    { status: 400 }
                );
            }
        }

        // Transaction: upsert all rates
        const result = await prisma.$transaction(
            rates.map((r: any) =>
                prisma.seasonNetRate.upsert({
                    where: {
                        season_id_room_type_id: {
                            season_id: seasonId,
                            room_type_id: r.room_type_id,
                        },
                    },
                    create: {
                        hotel_id: hotelId, // server-derived — BA Note #1
                        season_id: seasonId,
                        room_type_id: r.room_type_id,
                        net_rate: parseFloat(r.net_rate),
                    },
                    update: {
                        net_rate: parseFloat(r.net_rate),
                    },
                })
            )
        );

        return NextResponse.json({
            updated: result.length,
            rates: result,
        });
    } catch (error) {
        console.error('Error upserting season rates:', error);
        return NextResponse.json(
            { error: 'Failed to save season rates' },
            { status: 500 }
        );
    }
}
