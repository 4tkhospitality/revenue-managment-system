import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { serverLog } from '@/lib/logger'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/admin/users/[id] - Get single user
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                hotel_users: {
                    include: {
                        hotel: { select: { hotel_id: true, name: true } }
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                role: user.role,
                country: user.country,
                isActive: user.is_active,
                createdAt: user.created_at,
                hotels: user.hotel_users.map(hu => ({
                    hotelId: hu.hotel_id,
                    hotelName: hu.hotel.name,
                    role: hu.role,
                    isPrimary: hu.is_primary,
                }))
            }
        })
    } catch (error) {
        serverLog.error('Error getting user:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/admin/users/[id] - Update user global fields
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params
        const body = await request.json()
        const { name, phone, role, isActive, country } = body

        const updateData: Record<string, unknown> = {}
        if (name !== undefined) updateData.name = name
        if (phone !== undefined) updateData.phone = phone
        if (role !== undefined) updateData.role = role
        if (isActive !== undefined) updateData.is_active = isActive
        if (country !== undefined) {
            // null clears, valid 2-letter code sets, invalid is ignored
            updateData.country = country === null ? null
                : (typeof country === 'string' && /^[A-Z]{2}$/.test(country)) ? country
                    : undefined
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
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
                country: user.country,
                isActive: user.is_active,
                hotels: user.hotel_users.map(hu => ({
                    hotelId: hu.hotel_id,
                    hotelName: hu.hotel.name,
                    role: hu.role,
                    isPrimary: hu.is_primary,
                }))
            }
        })
    } catch (error) {
        serverLog.error('Error updating user:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/admin/users/[id] - Permanently delete user and all related data
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params

        // Prevent self-deletion
        if (id === session.user.id) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
        }

        // Cascade delete: remove all related records in a transaction
        await prisma.$transaction(async (tx) => {
            // 1. Delete pricing decisions
            await tx.pricingDecision.deleteMany({ where: { user_id: id } })

            // 2. Delete product events
            await tx.productEvent.deleteMany({ where: { user_id: id } })

            // 3. Delete payment transactions
            await tx.paymentTransaction.deleteMany({ where: { user_id: id } })

            // 4. Delete org memberships
            await tx.orgMember.deleteMany({ where: { user_id: id } })

            // 5. Delete hotel user assignments (also cascades in schema, but explicit is safer)
            await tx.hotelUser.deleteMany({ where: { user_id: id } })

            // 6. Delete NextAuth accounts & sessions
            await tx.account.deleteMany({ where: { userId: id } })
            await tx.session.deleteMany({ where: { userId: id } })

            // 7. Finally delete the user
            await tx.user.delete({ where: { id } })
        })

        serverLog.info(`[ADMIN] User ${id} permanently deleted with all related data by ${session.user.email}`)

        return NextResponse.json({ success: true, message: 'User and all related data permanently deleted' })
    } catch (error) {
        serverLog.error('Error deleting user:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

