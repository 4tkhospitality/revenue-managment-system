/**
 * DEBUG: Check full user state (payment, hotel, subscription, hotelUser)
 * GET /api/debug/user-state?email=phan@pakhos.com
 * Super admin only
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
        return NextResponse.json({ error: 'email param required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            hotel_users: {
                include: {
                    hotel: {
                        select: { hotel_id: true, name: true, capacity: true },
                    },
                },
            },
        },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // All payments
    const payments = await prisma.paymentTransaction.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        select: {
            id: true,
            order_id: true,
            status: true,
            gateway: true,
            amount: true,
            currency: true,
            purchased_tier: true,
            purchased_room_band: true,
            hotel_id: true,
            created_at: true,
            completed_at: true,
            term_months: true,
        },
    });

    // All subscriptions for user's hotels
    const hotelIds = user.hotel_users.map(hu => hu.hotel_id);
    const subscriptions = await prisma.subscription.findMany({
        where: { hotel_id: { in: hotelIds } },
        select: {
            id: true,
            hotel_id: true,
            plan: true,
            status: true,
            room_band: true,
            current_period_start: true,
            current_period_end: true,
            external_provider: true,
        },
    });

    // Product events
    const events = await prisma.productEvent.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: {
            event_type: true,
            event_data: true,
            hotel_id: true,
            created_at: true,
        },
    });

    return NextResponse.json({
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            hotel_id: user.hotel_id,
            is_active: user.is_active,
        },
        hotelUsers: user.hotel_users.map(hu => ({
            hotelId: hu.hotel_id,
            hotelName: hu.hotel?.name,
            hotelCapacity: hu.hotel?.capacity,
            role: hu.role,
            isPrimary: hu.is_primary,
        })),
        payments: payments.map(p => ({
            ...p,
            amount: Number(p.amount),
        })),
        subscriptions,
        recentEvents: events,
    });
}
