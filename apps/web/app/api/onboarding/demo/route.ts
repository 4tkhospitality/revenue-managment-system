/**
 * POST /api/onboarding/demo
 * Assign current user to shared Demo Hotel as viewer
 */
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { assignToSharedDemo } from '@/lib/demo/demoHotel'

export async function POST() {
    console.log('[DEBUG] /api/onboarding/demo: START')

    console.log('[DEBUG] Calling auth()...')
    const session = await auth()
    console.log('[DEBUG] auth() returned:', session?.user?.id ? 'User found' : 'No user')

    if (!session?.user?.id) {
        console.log('[DEBUG] Returning 401 - No session')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log('[DEBUG] Calling assignToSharedDemo with userId:', session.user.id)
        const result = await assignToSharedDemo(session.user.id)
        console.log('[DEBUG] assignToSharedDemo returned:', result)

        if (!result) {
            console.log('[DEBUG] No Demo Hotel found, returning 404')
            return NextResponse.json(
                { error: 'Demo Hotel không khả dụng. Vui lòng tạo khách sạn mới.' },
                { status: 404 }
            )
        }

        console.log('[DEBUG] SUCCESS - returning hotel:', result.hotelName)
        return NextResponse.json({
            success: true,
            hotelId: result.hotelId,
            hotelName: result.hotelName,
        })
    } catch (error) {
        console.error('[DEBUG] ERROR in assignToSharedDemo:', error)
        return NextResponse.json(
            { error: 'Có lỗi xảy ra, vui lòng thử lại' },
            { status: 500 }
        )
    }
}
