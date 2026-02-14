import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { deriveBand } from '@/lib/plg/plan-config'

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
                subscription: true,
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
                subscription: hotel.subscription ? {
                    plan: hotel.subscription.plan,
                    status: hotel.subscription.status,
                    periodStart: hotel.subscription.current_period_start,
                    periodEnd: hotel.subscription.current_period_end,
                    maxUsers: hotel.subscription.max_users,
                    maxImportsMonth: hotel.subscription.max_imports_month,
                    maxExportsDay: hotel.subscription.max_exports_day,
                    maxExportRows: hotel.subscription.max_export_rows,
                    includedRateShopsMonth: hotel.subscription.included_rate_shops_month,
                    dataRetentionMonths: hotel.subscription.data_retention_months,
                } : null,
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

        // Auto-sync subscription band when capacity changes
        if (body.capacity !== undefined) {
            const newBand = deriveBand(body.capacity);
            await prisma.$executeRaw`
                UPDATE subscriptions
                SET room_band = ${newBand}::"RoomBand",
                    capacity_snapshot = ${body.capacity}
                WHERE hotel_id = ${id}::uuid
            `;
        }

        // Subscription upsert (if subscription fields provided)
        if (body.subscription) {
            const sub = body.subscription
            const subData: Record<string, unknown> = {}
            if (sub.plan !== undefined) subData.plan = sub.plan
            if (sub.status !== undefined) subData.status = sub.status
            if (sub.periodStart !== undefined) subData.current_period_start = sub.periodStart ? new Date(sub.periodStart) : null
            if (sub.periodEnd !== undefined) subData.current_period_end = sub.periodEnd ? new Date(sub.periodEnd) : null
            if (sub.maxUsers !== undefined) subData.max_users = sub.maxUsers
            if (sub.maxImportsMonth !== undefined) subData.max_imports_month = sub.maxImportsMonth
            if (sub.maxExportsDay !== undefined) subData.max_exports_day = sub.maxExportsDay
            if (sub.maxExportRows !== undefined) subData.max_export_rows = sub.maxExportRows
            if (sub.includedRateShopsMonth !== undefined) subData.included_rate_shops_month = sub.includedRateShopsMonth
            if (sub.dataRetentionMonths !== undefined) subData.data_retention_months = sub.dataRetentionMonths

            await prisma.subscription.upsert({
                where: { hotel_id: id },
                create: {
                    hotel_id: id,
                    plan: sub.plan || 'STANDARD',
                    status: sub.status || 'ACTIVE',
                    current_period_start: sub.periodStart ? new Date(sub.periodStart) : new Date(),
                    current_period_end: sub.periodEnd ? new Date(sub.periodEnd) : null,
                    max_users: sub.maxUsers ?? 1,
                    max_imports_month: sub.maxImportsMonth ?? 3,
                    max_exports_day: sub.maxExportsDay ?? 1,
                    max_export_rows: sub.maxExportRows ?? 30,
                    included_rate_shops_month: sub.includedRateShopsMonth ?? 0,
                    data_retention_months: sub.dataRetentionMonths ?? 6,
                },
                update: subData,
            })
        }

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
