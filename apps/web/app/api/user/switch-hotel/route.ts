import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

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

        // Set httpOnly cookie
        const response = NextResponse.json({
            success: true,
            activeHotelId: hotelId
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
    const activeHotelId = request.cookies.get(ACTIVE_HOTEL_COOKIE)?.value

    return NextResponse.json({
        activeHotelId: activeHotelId || null
    })
}
