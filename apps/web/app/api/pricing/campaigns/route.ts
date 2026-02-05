// V01.2: Campaigns API - List & Create
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';

// GET /api/pricing/campaigns - List campaigns for active hotel
export async function GET(request: NextRequest) {
    try {
        const hotelId = await getActiveHotelId();

        if (!hotelId) {
            return NextResponse.json(
                { error: 'No active hotel selected' },
                { status: 401 }
            );
        }

        // Optional filter by ota_channel_id
        const { searchParams } = new URL(request.url);
        const channelId = searchParams.get('channel_id');

        // Build query - no auto-seeding, start with empty promotions
        const where: Record<string, string> = { hotel_id: hotelId };
        if (channelId) {
            where.ota_channel_id = channelId;
        }

        const campaigns = await prisma.campaignInstance.findMany({
            where,
            include: {
                promo: true,
                ota_channel: true,
            },
            orderBy: { created_at: 'desc' },
        });

        return NextResponse.json(campaigns);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json(
            { error: 'Failed to fetch campaigns' },
            { status: 500 }
        );
    }
}

// POST /api/pricing/campaigns - Create campaign
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
        const { ota_channel_id, promo_id, discount_pct, is_active, start_date, end_date } = body;

        if (!ota_channel_id || !promo_id || discount_pct === undefined) {
            return NextResponse.json(
                { error: 'ota_channel_id, promo_id, and discount_pct are required' },
                { status: 400 }
            );
        }

        // Verify OTA channel belongs to hotel
        const channel = await prisma.oTAChannel.findFirst({
            where: { id: ota_channel_id, hotel_id: hotelId },
        });

        if (!channel) {
            return NextResponse.json(
                { error: 'OTA channel not found' },
                { status: 404 }
            );
        }

        // Verify promo exists in catalog
        const promo = await prisma.promotionCatalog.findUnique({
            where: { id: promo_id },
        });

        if (!promo) {
            return NextResponse.json(
                { error: 'Promotion not found in catalog' },
                { status: 404 }
            );
        }

        const campaign = await prisma.campaignInstance.create({
            data: {
                hotel_id: hotelId,
                ota_channel_id,
                promo_id,
                discount_pct: parseFloat(discount_pct),
                is_active: is_active !== false,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
            },
            include: {
                promo: true,
                ota_channel: true,
            },
        });

        return NextResponse.json(campaign, { status: 201 });
    } catch (error) {
        console.error('Error creating campaign:', error);
        return NextResponse.json(
            { error: 'Failed to create campaign' },
            { status: 500 }
        );
    }
}
