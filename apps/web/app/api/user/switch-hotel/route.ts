import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

const ACTIVE_HOTEL_COOKIE = 'rms_active_hotel'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { hotelId } = await request.json()

        if (!hotelId) {
            return NextResponse.json({ error: 'Hotel ID required' }, { status: 400 })
        }

        // Validate user has access to this hotel
        const hasAccess = session.user.accessibleHotels?.some(
            h => h.hotelId === hotelId
        )

        // Super admin can access any hotel
        if (!hasAccess && !session.user.isAdmin) {
            return NextResponse.json({ error: 'Access denied to this hotel' }, { status: 403 })
        }

        // Get hotel name from DB
        const hotel = await prisma.hotel.findUnique({
            where: { hotel_id: hotelId },
            select: { name: true }
        })

        // Set httpOnly cookie
        const response = NextResponse.json({
            success: true,
            activeHotelId: hotelId,
            activeHotelName: hotel?.name || null
        })

        response.cookies.set(ACTIVE_HOTEL_COOKIE, hotelId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        })

        return response
    } catch (error) {
        console.error('Error switching hotel:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    // Use the robust fallback chain from getActiveHotelId():
    // 1. Cookie → 2. Session hotels → 3. First real hotel (admin) → 4. Demo Hotel
    const { getActiveHotelId } = await import('@/lib/pricing/get-hotel');
    const activeHotelId = await getActiveHotelId();

    if (!activeHotelId) {
        return NextResponse.json({
            activeHotelId: null,
            activeHotelName: null,
            activeHotelRole: null,
        })
    }

    // Get session for user ID
    const session = await auth();
    const userId = (session?.user as any)?.userId || (session?.user as any)?.id;

    // Fetch hotel name + user's role from DB (not JWT — JWT may be stale)
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: activeHotelId },
        select: { name: true }
    })

    let activeHotelRole: string | null = null;
    let userCountry: string | null = null;

    if (userId) {
        const [hotelUser, user] = await Promise.all([
            prisma.hotelUser.findUnique({
                where: {
                    user_id_hotel_id: {
                        user_id: userId,
                        hotel_id: activeHotelId,
                    },
                },
                select: { role: true },
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: { country: true, locale: true },
            }),
        ]);
        activeHotelRole = hotelUser?.role || null;

        // ── Auto-detect country (only when user.country is null) ─────
        if (user && user.country == null) {
            const { detectCountry } = await import('@/lib/geo/detect-country');
            const detected = await detectCountry(
                request.headers,
                user.locale || (session?.user as any)?.locale,
            );
            if (detected) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { country: detected },
                });
                userCountry = detected;
                console.log(`[SWITCH-HOTEL] Auto-detected country for user ${userId}: ${detected}`);
            }
        } else {
            userCountry = user?.country || null;
        }
    }

    return NextResponse.json({
        activeHotelId,
        activeHotelName: hotel?.name || null,
        activeHotelRole,
        userCountry,
    })
}

