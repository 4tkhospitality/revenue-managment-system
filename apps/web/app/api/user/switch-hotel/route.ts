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

export async function GET() {
    // Use the robust fallback chain from getActiveHotelId():
    // 1. Cookie → 2. Session hotels → 3. First real hotel (admin) → 4. Demo Hotel
    // This ensures upload page always gets a valid hotel ID.
    const { getActiveHotelId } = await import('@/lib/pricing/get-hotel');
    const activeHotelId = await getActiveHotelId();

    if (!activeHotelId) {
        return NextResponse.json({
            activeHotelId: null,
            activeHotelName: null
        })
    }

    // Fetch hotel name from DB for consistency
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: activeHotelId },
        select: { name: true }
    })

    return NextResponse.json({
        activeHotelId,
        activeHotelName: hotel?.name || null
    })
}

