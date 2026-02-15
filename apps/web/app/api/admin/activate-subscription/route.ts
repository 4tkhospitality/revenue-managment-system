/**
 * Admin Manual Activation — API Route
 *
 * POST /api/admin/activate-subscription
 * Body: { hotelId, tier, roomBand, durationDays }
 *
 * For Zalo-based manual activations (AT-19)
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PlanTier, RoomBand } from '@prisma/client';
import { generateOrderId } from '@/lib/payments/constants';
import { applySubscriptionChange } from '@/lib/payments/activation';

export async function POST(req: Request) {
    try {
        // 1. Auth check — admin only (AT-20)
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user = session.user as { id: string; isAdmin?: boolean };
        if (!user.isAdmin) {
            return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
        }

        // 2. Parse body
        const body = await req.json();
        const { hotelId, tier, roomBand, durationDays } = body as {
            hotelId: string;
            tier: PlanTier;
            roomBand: RoomBand;
            durationDays: number;
        };

        if (!hotelId || !tier || !roomBand || !durationDays) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const now = new Date();
        const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const orderId = generateOrderId(hotelId);

        // 3. DB Transaction: create COMPLETED tx + activate
        await prisma.$transaction(async (tx) => {
            await tx.paymentTransaction.create({
                data: {
                    hotel_id: hotelId,
                    user_id: user.id,
                    gateway: 'ZALO_MANUAL',
                    order_id: orderId,
                    amount: 0,
                    currency: 'VND',
                    status: 'COMPLETED',
                    completed_at: now,
                    purchased_tier: tier,
                    purchased_room_band: roomBand,
                    description: `Admin manual activation: ${tier} - ${roomBand} for ${durationDays} days`,
                },
            });

            await applySubscriptionChange(tx, hotelId, user.id, {
                periodStart: now,
                periodEnd,
                provider: 'ZALO_MANUAL',
                plan: tier,
                roomBand,
            });
        });

        return NextResponse.json({
            ok: true,
            plan: tier,
            roomBand,
            periodEnd: periodEnd.toISOString(),
            durationDays,
        });
    } catch (err) {
        console.error('[Admin Activate]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
