import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

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
        console.error('Error getting user:', error)
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
        const { name, phone, role, isActive } = body

        const updateData: Record<string, unknown> = {}
        if (name !== undefined) updateData.name = name
        if (phone !== undefined) updateData.phone = phone
        if (role !== undefined) updateData.role = role
        if (isActive !== undefined) updateData.is_active = isActive

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
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/admin/users/[id] - Deactivate user (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params

        // Try HARD DELETE first to support re-onboarding testing
        try {
            await prisma.user.delete({
                where: { id }
            })
            return NextResponse.json({ success: true, message: 'User permanently deleted' })
        } catch (error: any) {
            // Foreign key constraint failed (e.g. user has PricingDecisions) -> Fallback to SOFT DELETE
            if (error.code === 'P2003') {
                console.log(`[ADMIN] Hard delete failed for user ${id}, falling back to soft delete`)

                await prisma.user.update({
                    where: { id },
                    data: { is_active: false }
                })
                return NextResponse.json({ success: true, message: 'User deactivated (soft delete due to existing data)' })
            }

            throw error
        }

        return NextResponse.json({ success: true, message: 'User deactivated' })
    } catch (error) {
        console.error('Error deactivating user:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
