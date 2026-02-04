import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/admin/hotels - List all hotels
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const hotels = await prisma.hotel.findMany({
            include: {
                _count: {
                    select: { hotel_users: true, users: true }
                }
            },
            orderBy: { name: 'asc' }
        })

        return NextResponse.json({
            hotels: hotels.map(h => ({
                id: h.hotel_id,
                name: h.name,
                timezone: h.timezone,
                capacity: h.capacity,
                currency: h.currency,
                userCount: h._count.hotel_users,
                createdAt: h.created_at,
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
