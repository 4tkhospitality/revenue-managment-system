import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkSeatAvailability, tierLimitError } from '@/lib/seats'

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''
        const showInactive = searchParams.get('showInactive') === 'true'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        const where = {
            // Show all users (including inactive/locked)
            ...(search && {
                OR: [
                    { email: { contains: search, mode: 'insensitive' as const } },
                    { name: { contains: search, mode: 'insensitive' as const } },
                ]
            }),
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: {
                    hotel_users: {
                        include: {
                            hotel: { select: { hotel_id: true, name: true, country: true } }
                        }
                    }
                },
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where })
        ])

        // Fetch latest payment for each user (separate query since no back-relation on User model)
        const userIds = users.map(u => u.id)
        const payments = userIds.length > 0 ? await prisma.paymentTransaction.findMany({
            where: {
                user_id: { in: userIds },
                status: { in: ['COMPLETED', 'PENDING'] },
            },
            orderBy: { created_at: 'desc' },
            select: {
                user_id: true,
                status: true,
                purchased_tier: true,
                purchased_room_band: true,
                amount: true,
                currency: true,
                gateway: true,
                completed_at: true,
                created_at: true,
                hotel_id: true,
            },
        }) : []

        // Group: latest payment per user
        const paymentByUser = new Map<string, typeof payments[0]>()
        for (const p of payments) {
            if (!paymentByUser.has(p.user_id)) {
                paymentByUser.set(p.user_id, p)
            }
        }

        return NextResponse.json({
            users: users.map(u => {
                const payment = paymentByUser.get(u.id)
                return {
                    id: u.id,
                    email: u.email,
                    name: u.name,
                    phone: u.phone,
                    image: u.image,
                    role: u.role,
                    isActive: u.is_active,
                    createdAt: u.created_at,
                    hotels: u.hotel_users.map(hu => ({
                        hotelId: hu.hotel_id,
                        hotelName: hu.hotel.name,
                        hotelCountry: hu.hotel.country,
                        role: hu.role,
                        isPrimary: hu.is_primary,
                    })),
                    payment: payment ? {
                        status: payment.status,
                        tier: payment.purchased_tier,
                        roomBand: payment.purchased_room_band,
                        amount: Number(payment.amount),
                        currency: payment.currency,
                        gateway: payment.gateway,
                        completedAt: payment.completed_at,
                        createdAt: payment.created_at,
                        hasHotel: !!payment.hotel_id || u.hotel_users.some(hu => hu.hotel.name !== 'Demo Hotel'),
                    } : null,
                }
            }),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        })
    } catch (error) {
        console.error('Error listing users:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const { email, name, phone, role = 'viewer', isActive = true, hotelAssignments = [] } = body

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
        }

        // Check seat limits for each target hotel
        for (const ha of hotelAssignments as { hotelId: string; role: string; isPrimary?: boolean }[]) {
            const seats = await checkSeatAvailability(ha.hotelId)
            if (!seats.available) {
                return NextResponse.json(tierLimitError(seats.plan, seats.maxSeats), { status: 403 })
            }
        }

        // Create user with hotel assignments
        const user = await prisma.user.create({
            data: {
                email,
                name,
                phone,
                role: role === 'super_admin' ? 'super_admin' : 'viewer', // Global role
                is_active: isActive,
                hotel_users: {
                    create: hotelAssignments.map((ha: { hotelId: string; role: string; isPrimary?: boolean }) => ({
                        hotel_id: ha.hotelId,
                        role: ha.role || 'viewer',
                        is_primary: ha.isPrimary || false,
                    }))
                }
            },
            include: {
                hotel_users: {
                    include: {
                        hotel: { select: { hotel_id: true, name: true, country: true } }
                    }
                }
            }
        })

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
                isActive: user.is_active,
                hotels: user.hotel_users.map(hu => ({
                    hotelId: hu.hotel_id,
                    hotelName: hu.hotel.name,
                    hotelCountry: hu.hotel.country,
                    role: hu.role,
                    isPrimary: hu.is_primary,
                }))
            }
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
