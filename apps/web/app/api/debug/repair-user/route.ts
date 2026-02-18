/**
 * POST /api/debug/repair-user
 * Super admin only — repairs a user whose onboarding/complete failed.
 *
 * Body: { email: string }
 *
 * Steps:
 * 1. Find user + their hotels
 * 2. Find COMPLETED payment (orphan or Demo-linked)
 * 3. Link payment to real hotel (not Demo)
 * 4. Activate/fix subscription
 * 5. Remove Demo HotelUser
 * 6. Update user.hotel_id
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { applySubscriptionChange } from '@/lib/payments/activation';

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { email } = await request.json();
    if (!email) {
        return NextResponse.json({ error: 'email required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            hotel_users: {
                include: {
                    hotel: { select: { hotel_id: true, name: true } },
                },
            },
        },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find real hotel (not Demo)
    const realHotelUser = user.hotel_users.find(hu => hu.hotel?.name !== 'Demo Hotel');
    const demoHotelUser = user.hotel_users.find(hu => hu.hotel?.name === 'Demo Hotel');

    if (!realHotelUser) {
        return NextResponse.json({
            error: 'User has no real hotel — need to check onboarding step 1-2',
            hotels: user.hotel_users.map(hu => ({
                hotelId: hu.hotel_id,
                name: hu.hotel?.name,
                role: hu.role,
            })),
        }, { status: 400 });
    }

    const realHotelId = realHotelUser.hotel_id;

    // Find payment
    const demoHotel = await prisma.hotel.findFirst({
        where: { name: 'Demo Hotel' },
        select: { hotel_id: true },
    });

    const payment = await prisma.paymentTransaction.findFirst({
        where: {
            user_id: user.id,
            status: 'COMPLETED',
        },
        orderBy: { created_at: 'desc' },
    });

    const repairs: string[] = [];

    await prisma.$transaction(async (tx) => {
        // 1. Link payment to real hotel if orphaned or on Demo
        if (payment && (!payment.hotel_id || payment.hotel_id === demoHotel?.hotel_id)) {
            await tx.paymentTransaction.update({
                where: { id: payment.id },
                data: { hotel_id: realHotelId },
            });
            repairs.push(`Payment ${payment.id} linked to ${realHotelUser.hotel?.name}`);
        }

        // 2. Activate subscription
        if (payment?.purchased_tier && payment?.purchased_room_band) {
            const now = new Date();
            const termMonths = (payment as any).term_months || 1;
            const periodEnd = new Date(now.getTime() + termMonths * 30 * 24 * 60 * 60 * 1000);

            await applySubscriptionChange(tx, realHotelId, user.id, {
                periodStart: payment.completed_at || now,
                periodEnd,
                provider: (payment.gateway === 'SEPAY' ? 'SEPAY' : 'PAYPAL') as 'SEPAY' | 'PAYPAL' | 'ZALO_MANUAL',
                plan: payment.purchased_tier,
                roomBand: payment.purchased_room_band,
            });
            repairs.push(`Subscription activated: ${payment.purchased_tier} / ${payment.purchased_room_band}`);
        }

        // 3. Update user.hotel_id
        await tx.user.update({
            where: { id: user.id },
            data: { hotel_id: realHotelId },
        });
        repairs.push(`user.hotel_id → ${realHotelId}`);

        // 4. Remove Demo HotelUser
        if (demoHotelUser) {
            await tx.hotelUser.deleteMany({
                where: {
                    user_id: user.id,
                    hotel_id: demoHotelUser.hotel_id,
                },
            });
            repairs.push('Removed Demo Hotel from accessible hotels');
        }

        // 5. Ensure real hotel role is hotel_admin
        await tx.hotelUser.update({
            where: {
                user_id_hotel_id: {
                    user_id: user.id,
                    hotel_id: realHotelId,
                },
            },
            data: { role: 'hotel_admin', is_primary: true },
        });
        repairs.push(`Role set to hotel_admin on ${realHotelUser.hotel?.name}`);
    });

    return NextResponse.json({
        success: true,
        email,
        realHotel: realHotelUser.hotel?.name,
        realHotelId,
        payment: payment ? {
            id: payment.id,
            tier: payment.purchased_tier,
            band: payment.purchased_room_band,
            amount: Number(payment.amount),
            gateway: payment.gateway,
        } : null,
        repairs,
        nextSteps: 'User needs to: 1) Clear cookies / log out, 2) Log back in → session will refresh with correct hotel + plan',
    });
}
