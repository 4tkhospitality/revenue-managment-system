import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { checkSeatAvailability, tierLimitError } from '@/lib/seats'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/admin/users/[id]/hotels - Get user's hotel assignments
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params

        const hotelUsers = await prisma.hotelUser.findMany({
            where: { user_id: id },
            include: {
                hotel: { select: { hotel_id: true, name: true } }
            }
        })

        return NextResponse.json({
            assignments: hotelUsers.map(hu => ({
                id: hu.id,
                hotelId: hu.hotel_id,
                hotelName: hu.hotel.name,
                role: hu.role,
                isPrimary: hu.is_primary,
                createdAt: hu.created_at,
            }))
        })
    } catch (error) {
        console.error('Error getting hotel assignments:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/admin/users/[id]/hotels - Replace all hotel assignments
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params
        const { assignments } = await request.json()

        if (!Array.isArray(assignments)) {
            return NextResponse.json({ error: 'Assignments must be an array' }, { status: 400 })
        }

        // Check seat limits for each target hotel (excluding current user's existing seats)
        const existingAssignments = await prisma.hotelUser.findMany({
            where: { user_id: id },
            select: { hotel_id: true }
        })
        const existingHotelIds = new Set(existingAssignments.map(a => a.hotel_id))

        for (const a of assignments as { hotelId: string; role: string; isPrimary?: boolean }[]) {
            // Only check limit for newly assigned hotels
            if (!existingHotelIds.has(a.hotelId)) {
                const seats = await checkSeatAvailability(a.hotelId)
                if (!seats.available) {
                    return NextResponse.json(tierLimitError(seats.plan, seats.maxSeats), { status: 403 })
                }
            }
        }

        // Delete all existing assignments
        await prisma.hotelUser.deleteMany({
            where: { user_id: id }
        })

        // Create new assignments
        if (assignments.length > 0) {
            await prisma.hotelUser.createMany({
                data: assignments.map((a: { hotelId: string; role: string; isPrimary?: boolean }) => ({
                    user_id: id,
                    hotel_id: a.hotelId,
                    role: (a.role || 'viewer') as UserRole,
                    is_primary: a.isPrimary || false,
                }))
            })
        }

        // Fetch updated assignments
        const hotelUsers = await prisma.hotelUser.findMany({
            where: { user_id: id },
            include: {
                hotel: { select: { hotel_id: true, name: true } }
            }
        })

        return NextResponse.json({
            assignments: hotelUsers.map(hu => ({
                id: hu.id,
                hotelId: hu.hotel_id,
                hotelName: hu.hotel.name,
                role: hu.role,
                isPrimary: hu.is_primary,
            }))
        })
    } catch (error) {
        console.error('Error updating hotel assignments:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/admin/users/[id]/hotels - Add single hotel assignment
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params
        const { hotelId, role = 'viewer', isPrimary = false } = await request.json()

        if (!hotelId) {
            return NextResponse.json({ error: 'Hotel ID required' }, { status: 400 })
        }

        // Check if assignment already exists
        const existing = await prisma.hotelUser.findUnique({
            where: {
                user_id_hotel_id: { user_id: id, hotel_id: hotelId }
            }
        })

        if (existing) {
            return NextResponse.json({ error: 'Assignment already exists' }, { status: 409 })
        }

        // Check seat limit
        const seats = await checkSeatAvailability(hotelId)
        if (!seats.available) {
            return NextResponse.json(tierLimitError(seats.plan, seats.maxSeats), { status: 403 })
        }

        const hotelUser = await prisma.hotelUser.create({
            data: {
                user_id: id,
                hotel_id: hotelId,
                role,
                is_primary: isPrimary,
            },
            include: {
                hotel: { select: { hotel_id: true, name: true } }
            }
        })

        return NextResponse.json({
            assignment: {
                id: hotelUser.id,
                hotelId: hotelUser.hotel_id,
                hotelName: hotelUser.hotel.name,
                role: hotelUser.role,
                isPrimary: hotelUser.is_primary,
            }
        }, { status: 201 })
    } catch (error) {
        console.error('Error adding hotel assignment:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
