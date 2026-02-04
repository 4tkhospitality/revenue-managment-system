import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        const where = search ? {
            OR: [
                { email: { contains: search, mode: 'insensitive' as const } },
                { name: { contains: search, mode: 'insensitive' as const } },
            ]
        } : {}

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: {
                    hotel_users: {
                        include: {
                            hotel: { select: { hotel_id: true, name: true } }
                        }
                    }
                },
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where })
        ])

        return NextResponse.json({
            users: users.map(u => ({
                id: u.id,
                email: u.email,
                name: u.name,
                image: u.image,
                role: u.role,
                isActive: u.is_active,
                createdAt: u.created_at,
                hotels: u.hotel_users.map(hu => ({
                    hotelId: hu.hotel_id,
                    hotelName: hu.hotel.name,
                    role: hu.role,
                    isPrimary: hu.is_primary,
                }))
            })),
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
        const { email, name, role = 'viewer', isActive = true, hotelAssignments = [] } = body

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
        }

        // Create user with hotel assignments
        const user = await prisma.user.create({
            data: {
                email,
                name,
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
                        hotel: { select: { hotel_id: true, name: true } }
                    }
                }
            }
        })

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isActive: user.is_active,
                hotels: user.hotel_users.map(hu => ({
                    hotelId: hu.hotel_id,
                    hotelName: hu.hotel.name,
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
