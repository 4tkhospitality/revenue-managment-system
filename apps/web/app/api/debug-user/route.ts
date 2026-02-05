import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

/**
 * Simple API to check user hotels - no auth dependency
 * Just needs email parameter
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const email = searchParams.get('email')

        if (!email) {
            return NextResponse.json({
                error: 'Email parameter required',
                usage: '/api/debug-user?email=user@example.com'
            }, { status: 400 })
        }

        // Get user with hotels
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                is_active: true,
                hotel_users: {
                    select: {
                        hotel_id: true,
                        role: true,
                        is_primary: true,
                        hotel: {
                            select: { name: true }
                        }
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json({
                found: false,
                email,
                error: 'User not found in database'
            })
        }

        const hotels = user.hotel_users.map(hu => ({
            hotelId: hu.hotel_id,
            hotelName: hu.hotel.name,
            role: hu.role,
            isPrimary: hu.is_primary
        }))

        return NextResponse.json({
            found: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isActive: user.is_active
            },
            hotels,
            hotelCount: hotels.length,
            message: hotels.length > 0
                ? `User has ${hotels.length} hotel(s) assigned`
                : 'User has no hotels assigned - this is the problem!'
        })

    } catch (error) {
        console.error('Debug user error:', error)
        return NextResponse.json({
            error: 'Database query failed',
            details: String(error)
        }, { status: 500 })
    }
}
