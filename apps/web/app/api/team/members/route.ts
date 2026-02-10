/**
 * GET /api/team/members
 * List team members for current hotel
 */
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { checkSeatAvailability } from '@/lib/seats'

const ACTIVE_HOTEL_COOKIE = 'rms_active_hotel'

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const cookieStore = await cookies()
        const activeHotelId = cookieStore.get(ACTIVE_HOTEL_COOKIE)?.value

        if (!activeHotelId) {
            return NextResponse.json({ error: 'No active hotel' }, { status: 400 })
        }

        // Verify user has access to this hotel
        const hasAccess = session.user.accessibleHotels?.some(
            h => h.hotelId === activeHotelId
        )
        if (!hasAccess && !session.user.isAdmin) {
            return NextResponse.json({ error: 'No access to this hotel' }, { status: 403 })
        }

        const [members, seats] = await Promise.all([
            prisma.hotelUser.findMany({
                where: {
                    hotel_id: activeHotelId,
                    is_active: true,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: [
                    { is_primary: 'desc' },
                    { role: 'asc' },
                    { created_at: 'asc' },
                ],
            }),
            checkSeatAvailability(activeHotelId),
        ])

        return NextResponse.json({
            members,
            seats: {
                current: seats.currentSeats,
                max: seats.maxSeats,
                available: seats.available,
                plan: seats.plan,
            },
        })
    } catch (error) {
        console.error('[API] Team members error:', error)
        return NextResponse.json(
            { error: 'Failed to load members' },
            { status: 500 }
        )
    }
}
