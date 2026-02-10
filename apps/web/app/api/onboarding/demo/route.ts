/**
 * POST /api/onboarding/demo
 * Assign current user to shared Demo Hotel as viewer
 */
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { assignToSharedDemo } from '@/lib/demo/demoHotel'
import prisma from '@/lib/prisma'

export async function POST() {
    const session = await auth()

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const result = await assignToSharedDemo(session.user.id)

        if (!result) {
            return NextResponse.json(
                { error: 'Demo Hotel không khả dụng. Vui lòng tạo khách sạn mới.' },
                { status: 404 }
            )
        }

        // Ensure Demo Hotel has a proper subscription for demo users
        // GROWTH tier gives access to dashboard, analytics, daily actions, etc.
        await prisma.subscription.upsert({
            where: { hotel_id: result.hotelId },
            create: {
                hotel_id: result.hotelId,
                plan: 'DELUXE',
                status: 'ACTIVE',
                max_users: 999,
                max_properties: 1,
                max_imports_month: 999,
                max_exports_day: 999,
                max_export_rows: 999,
                included_rate_shops_month: 50,
                data_retention_months: 24,
            },
            update: {}, // Don't override if already exists
        })

        const response = NextResponse.json({
            success: true,
            hotelId: result.hotelId,
            hotelName: result.hotelName,
        })

        // Set active hotel cookie so middleware allows access before JWT refresh
        response.cookies.set('rms_active_hotel', result.hotelId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        })

        return response
    } catch (error) {
        console.error('[API] Onboarding demo error:', error)
        return NextResponse.json(
            { error: 'Có lỗi xảy ra, vui lòng thử lại' },
            { status: 500 }
        )
    }
}

