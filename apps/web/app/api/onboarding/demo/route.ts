/**
 * POST /api/onboarding/demo
 * Assign current user to shared Demo Hotel as viewer
 */
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { assignToSharedDemo } from '@/lib/demo/demoHotel'

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

        return NextResponse.json({
            success: true,
            hotelId: result.hotelId,
            hotelName: result.hotelName,
        })
    } catch (error) {
        console.error('[API] Onboarding demo error:', error)
        return NextResponse.json(
            { error: 'Có lỗi xảy ra, vui lòng thử lại' },
            { status: 500 }
        )
    }
}

