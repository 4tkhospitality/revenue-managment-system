/**
 * GET /api/payments/history
 * Returns payment history for the current hotel
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const hotelId = await getActiveHotelId();
        if (!hotelId) {
            return NextResponse.json({ error: 'No hotel selected' }, { status: 400 });
        }

        // Fetch payment transactions for this hotel, ordered by most recent
        const payments = await prisma.paymentTransaction.findMany({
            where: { hotel_id: hotelId },
            orderBy: { created_at: 'desc' },
            take: 50,
            select: {
                id: true,
                order_id: true,
                gateway: true,
                amount: true,
                currency: true,
                status: true,
                purchased_tier: true,
                purchased_room_band: true,
                billing_cycle: true,
                term_months: true,
                description: true,
                created_at: true,
                completed_at: true,
                failed_at: true,
                failed_reason: true,
            },
        });

        return NextResponse.json({
            payments: payments.map(p => ({
                id: p.id,
                orderId: p.order_id,
                gateway: p.gateway,
                amount: Number(p.amount),
                currency: p.currency,
                status: p.status,
                purchasedTier: p.purchased_tier,
                purchasedRoomBand: p.purchased_room_band,
                billingCycle: p.billing_cycle,
                termMonths: p.term_months,
                description: p.description,
                createdAt: p.created_at.toISOString(),
                completedAt: p.completed_at?.toISOString() ?? null,
                failedAt: p.failed_at?.toISOString() ?? null,
                failedReason: p.failed_reason,
            })),
        });
    } catch (error) {
        console.error('[Payments History] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch payment history' }, { status: 500 });
    }
}
