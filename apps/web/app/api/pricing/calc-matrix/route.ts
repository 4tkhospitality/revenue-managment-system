// V01.2: Calculate Price Matrix API
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { calcBarFromNet, calcNetFromBar } from '@/lib/pricing/engine';
import type { CalcType, DiscountItem, MatrixCell, PriceMatrixResponse } from '@/lib/pricing/types';

interface CalcMatrixRequest {
    mode?: 'net_to_bar' | 'bar_to_net';
    displayPrice?: number; // Used when mode = bar_to_net
}

// POST /api/pricing/calc-matrix - Calculate full price matrix
export async function POST(request: NextRequest) {
    try {
        // Parse request body
        let body: CalcMatrixRequest = {};
        try {
            body = await request.json();
        } catch {
            // No body or invalid JSON - use defaults
        }

        const mode = body.mode || 'net_to_bar';
        const displayPrice = body.displayPrice;

        // Read cookie directly from request
        let hotelId = request.cookies.get('rms_active_hotel')?.value;

        // Fallback: If no cookie (e.g., Admin users), get from session
        if (!hotelId) {
            const session = await auth();
            if (session?.user?.accessibleHotels?.length) {
                hotelId = session.user.accessibleHotels[0].hotelId;
            }
        }

        if (!hotelId) {
            return NextResponse.json(
                { error: 'No active hotel selected' },
                { status: 401 }
            );
        }

        // Fetch room types
        const roomTypes = await prisma.roomType.findMany({
            where: { hotel_id: hotelId },
            orderBy: { name: 'asc' },
        });

        // Fetch OTA channels with active campaigns
        const channels = await prisma.oTAChannel.findMany({
            where: { hotel_id: hotelId, is_active: true },
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

        // Fetch pricing settings (or use defaults)
        const settings = await prisma.pricingSetting.findUnique({
            where: { hotel_id: hotelId },
        });

        const roundingRule = (settings?.rounding_rule || 'CEIL_1000') as 'CEIL_1000' | 'ROUND_100' | 'NONE';

        // Calculate matrix
        const matrix: Record<string, MatrixCell> = {};

        for (const roomType of roomTypes) {
            for (const channel of channels) {
                // Convert campaigns to discount items
                const discounts: DiscountItem[] = channel.campaigns.map(c => ({
                    id: c.id,
                    name: c.promo.name,
                    percent: c.discount_pct,
                    group: c.promo.group_type as any,
                    subCategory: c.promo.sub_category || undefined,
                }));

                const key = `${roomType.id}:${channel.id}`;

                if (mode === 'bar_to_net' && displayPrice) {
                    // Reverse mode: Calculate NET from uniform display price
                    const result = calcNetFromBar(
                        displayPrice,
                        channel.commission,
                        discounts,
                        channel.calc_type as CalcType
                    );

                    matrix[key] = {
                        roomTypeId: roomType.id,
                        channelId: channel.id,
                        bar: displayPrice,
                        net: result.net,
                        commission: result.commission,
                        totalDiscount: result.totalDiscount,
                        validation: result.validation,
                        trace: result.trace,
                    };
                } else {
                    // Normal mode: Calculate BAR from NET
                    const result = calcBarFromNet(
                        roomType.net_price,
                        channel.commission,
                        discounts,
                        channel.calc_type as CalcType,
                        roundingRule
                    );

                    matrix[key] = {
                        roomTypeId: roomType.id,
                        channelId: channel.id,
                        bar: result.bar,
                        net: result.net,
                        commission: result.commission,
                        totalDiscount: result.totalDiscount,
                        validation: result.validation,
                        trace: result.trace,
                    };
                }
            }
        }

        const response: PriceMatrixResponse = {
            roomTypes: roomTypes.map(rt => ({
                id: rt.id,
                hotelId: rt.hotel_id,
                name: rt.name,
                description: rt.description || undefined,
                netPrice: rt.net_price,
            })),
            channels: channels.map(ch => ({
                id: ch.id,
                hotelId: ch.hotel_id,
                name: ch.name,
                code: ch.code,
                calcType: ch.calc_type as CalcType,
                commission: ch.commission,
                isActive: ch.is_active,
            })),
            matrix,
            calculatedAt: new Date().toISOString(),
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error calculating price matrix:', error);
        return NextResponse.json(
            { error: 'Failed to calculate price matrix' },
            { status: 500 }
        );
    }
}
