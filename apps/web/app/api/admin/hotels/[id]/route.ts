import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/admin/hotels/[id] - Get single hotel
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params

        const hotel = await prisma.hotel.findUnique({
            where: { hotel_id: id },
            include: {
                hotel_users: {
                    include: {
                        user: { select: { id: true, email: true, name: true, image: true } }
                    }
                }
            }
        })

        if (!hotel) {
            return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
        }

        return NextResponse.json({
            hotel: {
                id: hotel.hotel_id,
                name: hotel.name,
                timezone: hotel.timezone,
                capacity: hotel.capacity,
                currency: hotel.currency,
                defaultBaseRate: hotel.default_base_rate,
                minRate: hotel.min_rate,
                maxRate: hotel.max_rate,
                createdAt: hotel.created_at,
                users: hotel.hotel_users.map(hu => ({
                    userId: hu.user_id,
                    email: hu.user.email,
                    name: hu.user.name,
                    image: hu.user.image,
                    role: hu.role,
                    isPrimary: hu.is_primary,
                }))
            }
        })
    } catch (error) {
        console.error('Error getting hotel:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/admin/hotels/[id] - Update hotel
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params
        const body = await request.json()

        const updateData: Record<string, unknown> = {}
        if (body.name !== undefined) updateData.name = body.name
        if (body.timezone !== undefined) updateData.timezone = body.timezone
        if (body.capacity !== undefined) updateData.capacity = body.capacity
        if (body.currency !== undefined) updateData.currency = body.currency
        if (body.defaultBaseRate !== undefined) updateData.default_base_rate = body.defaultBaseRate
        if (body.minRate !== undefined) updateData.min_rate = body.minRate
        if (body.maxRate !== undefined) updateData.max_rate = body.maxRate

        const hotel = await prisma.hotel.update({
            where: { hotel_id: id },
            data: updateData
        })

        return NextResponse.json({
            hotel: {
                id: hotel.hotel_id,
                name: hotel.name,
                timezone: hotel.timezone,
                capacity: hotel.capacity,
                currency: hotel.currency,
            }
        })
    } catch (error) {
        console.error('Error updating hotel:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/admin/hotels/[id] - Delete hotel and all related data
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params

        // Check hotel exists
        const hotel = await prisma.hotel.findUnique({ where: { hotel_id: id } })
        if (!hotel) {
            return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
        }

        // Delete all related data in a transaction
        await prisma.$transaction([
            // Rate Shopper data
            prisma.rateShopRecommendation.deleteMany({ where: { hotel_id: id } }),
            prisma.marketSnapshot.deleteMany({ where: { hotel_id: id } }),
            prisma.rateShopRequest.deleteMany({ where: { hotel_id: id } }),
            prisma.competitor.deleteMany({ where: { hotel_id: id } }),
            prisma.rateShopUsageTenantMonthly.deleteMany({ where: { hotel_id: id } }),
            // Analytics & Forecast
            prisma.demandForecast.deleteMany({ where: { hotel_id: id } }),
            prisma.featuresDaily.deleteMany({ where: { hotel_id: id } }),
            prisma.priceRecommendations.deleteMany({ where: { hotel_id: id } }),
            // Pricing
            prisma.pricingDecision.deleteMany({ where: { hotel_id: id } }),
            prisma.pricingSetting.deleteMany({ where: { hotel_id: id } }),
            prisma.oTAChannel.deleteMany({ where: { hotel_id: id } }),
            prisma.roomType.deleteMany({ where: { hotel_id: id } }),
            // Data
            prisma.dailyOTB.deleteMany({ where: { hotel_id: id } }),
            prisma.cancellationRaw.deleteMany({ where: { hotel_id: id } }),
            prisma.reservationsRaw.deleteMany({ where: { hotel_id: id } }),
            prisma.importJob.deleteMany({ where: { hotel_id: id } }),
            // Access & Billing
            prisma.hotelInvite.deleteMany({ where: { hotel_id: id } }),
            prisma.hotelUser.deleteMany({ where: { hotel_id: id } }),
            prisma.subscription.deleteMany({ where: { hotel_id: id } }),
            // Detach users who have this hotel as their active hotel
            prisma.user.updateMany({ where: { hotel_id: id }, data: { hotel_id: null } }),
            // Finally the hotel itself
            prisma.hotel.delete({ where: { hotel_id: id } }),
        ])

        return NextResponse.json({ success: true, deletedHotel: hotel.name })
    } catch (error) {
        console.error('Error deleting hotel:', error)
        return NextResponse.json({ error: 'Lỗi khi xóa hotel. Vui lòng thử lại.' }, { status: 500 })
    }
}
