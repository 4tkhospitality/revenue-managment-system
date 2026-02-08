/**
 * POST /api/onboarding/complete
 * Mark onboarding as complete and extend trial if applicable
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { hotelId } = await request.json()

        if (!hotelId) {
            return NextResponse.json({ error: 'hotelId is required' }, { status: 400 })
        }

        // Verify user has access to this hotel
        const hotelUser = await prisma.hotelUser.findUnique({
            where: {
                user_id_hotel_id: {
                    user_id: session.user.id,
                    hotel_id: hotelId,
                },
            },
        })

        if (!hotelUser) {
            return NextResponse.json({ error: 'No access to this hotel' }, { status: 403 })
        }

        // Mark hotel as onboarding complete
        await prisma.hotel.update({
            where: { hotel_id: hotelId },
            data: {
                // Could add onboarding_complete field later
                // For now, just log the event
            },
        })

        // Check if in trial, extend by 7 days for completing onboarding
        const subscription = await prisma.subscription.findUnique({
            where: { hotel_id: hotelId },
        })

        let trialExtended = false
        if (subscription?.status === 'TRIAL' && subscription.current_period_end) {
            const newTrialEnd = new Date(subscription.current_period_end.getTime() + 7 * 24 * 60 * 60 * 1000)

            await prisma.subscription.update({
                where: { hotel_id: hotelId },
                data: {
                    current_period_end: newTrialEnd,
                },
            })

            trialExtended = true

            await prisma.productEvent.create({
                data: {
                    user_id: session.user.id,
                    hotel_id: hotelId,
                    event_type: 'TRIAL_EXTENDED',
                    event_data: { reason: 'onboarding_complete', extra_days: 7 },
                },
            })
        }

        // Log completion
        await prisma.productEvent.create({
            data: {
                user_id: session.user.id,
                hotel_id: hotelId,
                event_type: 'ONBOARDING_COMPLETED',
                event_data: { trialExtended },
            },
        })

        return NextResponse.json({
            success: true,
            trialExtended,
            message: trialExtended
                ? 'Onboarding complete! Trial extended by 7 days.'
                : 'Onboarding complete!'
        })
    } catch (error) {
        console.error('[API] Onboarding complete error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
