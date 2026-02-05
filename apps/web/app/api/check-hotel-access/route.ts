import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

/**
 * API endpoint to check and refresh user hotel access
 * This helps when user was assigned hotels AFTER their initial login
 */
export async function GET() {
    try {
        const session = await auth()

        if (!session?.user?.email) {
            return NextResponse.json({
                error: 'Not authenticated',
                needsRelogin: true
            }, { status: 401 })
        }

        // Fetch fresh data from database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                hotel_users: {
                    include: {
                        hotel: {
                            select: { hotel_id: true, name: true }
                        }
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json({
                error: 'User not found in database',
                needsRelogin: true
            })
        }

        const dbHotels = user.hotel_users.map(hu => ({
            hotelId: hu.hotel_id,
            hotelName: hu.hotel.name,
            role: hu.role,
        }))

        const sessionHotels = session.user.accessibleHotels || []

        // Check for mismatch
        const hasMismatch = dbHotels.length !== sessionHotels.length ||
            dbHotels.some(dbH => !sessionHotels.find(sH => sH.hotelId === dbH.hotelId))

        return NextResponse.json({
            email: user.email,
            dbHotels,
            sessionHotels,
            hasMismatch,
            needsRelogin: hasMismatch,
            message: hasMismatch
                ? 'Session is stale. User needs to log out and log back in to refresh hotel access.'
                : 'Session is up to date.'
        })

    } catch (error) {
        console.error('Error checking hotel access:', error)
        return NextResponse.json({
            error: 'Failed to check hotel access',
            details: String(error)
        }, { status: 500 })
    }
}
