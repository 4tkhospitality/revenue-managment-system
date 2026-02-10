import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/admin/hotels - List all hotels with subscription data
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const hotels = await prisma.hotel.findMany({
            include: {
                subscription: true,
                _count: {
                    select: { hotel_users: true }
                }
            },
            orderBy: { name: 'asc' }
        })

        // Get pending invites count per hotel
        const pendingInvites = await prisma.hotelInvite.groupBy({
            by: ['hotel_id'],
            where: {
                status: 'active',
                expires_at: { gt: new Date() },
            },
            _count: { invite_id: true }
        })
        const pendingMap = new Map(pendingInvites.map(p => [p.hotel_id, p._count.invite_id]))

        return NextResponse.json({
            hotels: hotels.map(h => ({
                id: h.hotel_id,
                name: h.name,
                timezone: h.timezone,
                capacity: h.capacity,
                currency: h.currency,
                userCount: h._count.hotel_users,
                pendingInvites: pendingMap.get(h.hotel_id) ?? 0,
                createdAt: h.created_at,
                // Subscription data
                plan: h.subscription?.plan ?? null,
                subscriptionStatus: h.subscription?.status ?? null,
                periodEnd: h.subscription?.current_period_end ?? null,
                maxUsers: h.subscription?.max_users ?? null,
            }))
        })
    } catch (error) {
        console.error('Error listing hotels:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/admin/hotels - Create new hotel
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const { name, timezone = 'Asia/Ho_Chi_Minh', capacity = 100, currency = 'VND' } = body

        if (!name) {
            return NextResponse.json({ error: 'Hotel name is required' }, { status: 400 })
        }

        const hotel = await prisma.hotel.create({
            data: {
                name,
                timezone,
                capacity,
                currency,
            }
        })

        return NextResponse.json({
            hotel: {
                id: hotel.hotel_id,
                name: hotel.name,
                timezone: hotel.timezone,
                capacity: hotel.capacity,
                currency: hotel.currency,
            }
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating hotel:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
