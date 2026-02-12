// Dynamic Pricing: Seasons CRUD — List & Create
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';

// GET /api/pricing/seasons — List seasons for active hotel
export async function GET() {
    try {
        const hotelId = await getActiveHotelId();

        if (!hotelId) {
            return NextResponse.json(
                { error: 'No active hotel selected' },
                { status: 401 }
            );
        }

        const seasons = await prisma.seasonConfig.findMany({
            where: { hotel_id: hotelId },
            orderBy: { priority: 'desc' },
            include: {
                _count: { select: { net_rates: true } },
            },
        });

        return NextResponse.json(seasons);
    } catch (error) {
        console.error('Error fetching seasons:', error);
        return NextResponse.json(
            { error: 'Failed to fetch seasons' },
            { status: 500 }
        );
    }
}

// POST /api/pricing/seasons — Create season
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
        const { name, code, date_ranges, priority, is_active } = body;

        // Validate required fields
        if (!name || !code) {
            return NextResponse.json(
                { error: 'Name and code are required' },
                { status: 400 }
            );
        }

        // Validate code format
        const codeUpper = code.toUpperCase().trim();
        if (!/^[A-Z_]{2,20}$/.test(codeUpper)) {
            return NextResponse.json(
                { error: 'Code must be 2-20 uppercase letters/underscores' },
                { status: 400 }
            );
        }

        // Validate date_ranges format: [{start, end}]
        if (date_ranges && Array.isArray(date_ranges)) {
            for (const range of date_ranges) {
                if (!range.start || !range.end) {
                    return NextResponse.json(
                        { error: 'Each date range must have start and end' },
                        { status: 400 }
                    );
                }
                // Validate date-only format (YYYY-MM-DD)
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(range.start) || !dateRegex.test(range.end)) {
                    return NextResponse.json(
                        { error: 'Dates must be in YYYY-MM-DD format' },
                        { status: 400 }
                    );
                }
                // end is inclusive, but start must be <= end
                if (range.start > range.end) {
                    return NextResponse.json(
                        { error: 'Start date must be before or equal to end date' },
                        { status: 400 }
                    );
                }
            }
        }

        const season = await prisma.seasonConfig.create({
            data: {
                hotel_id: hotelId, // server-derived, never from client
                name: name.trim(),
                code: codeUpper,
                date_ranges: date_ranges || [],
                priority: priority ?? 0,
                is_active: is_active ?? true,
            },
        });

        return NextResponse.json(season, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Season with this code already exists for this hotel' },
                { status: 409 }
            );
        }
        console.error('Error creating season:', error);
        return NextResponse.json(
            { error: 'Failed to create season' },
            { status: 500 }
        );
    }
}
