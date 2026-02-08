/**
 * POST /api/trial/activate
 * Activate trial for a hotel after quality import
 * Trial: 7 days base + 7 days bonus if onboarding complete
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

        // Check if subscription exists
        const existingSubscription = await prisma.subscription.findUnique({
            where: { hotel_id: hotelId },
        })

        if (existingSubscription) {
            // If already in trial or paid, don't change
            if (existingSubscription.status === 'TRIAL' || existingSubscription.status === 'ACTIVE') {
                if (existingSubscription.plan !== 'FREE') {
                    return NextResponse.json({
                        message: 'Trial already active or upgraded',
                        status: existingSubscription.status,
                    })
                }
            }

            // Upgrade FREE to TRIAL
            const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

            await prisma.subscription.update({
                where: { hotel_id: hotelId },
                data: {
                    plan: 'STARTER',
                    status: 'TRIAL',
                    current_period_start: new Date(),
                    current_period_end: trialEnd,
                    // Upgrade limits for trial
                    max_users: 3,
                    max_imports_month: 10,
                    max_exports_day: 5,
                    max_export_rows: 1000,
                },
            })

            // Log event
            await prisma.productEvent.create({
                data: {
                    user_id: session.user.id,
                    hotel_id: hotelId,
                    event_type: 'TRIAL_ACTIVATED',
                    event_data: { trigger: 'quality_import', days: 7 },
                },
            })

            return NextResponse.json({
                success: true,
                trialEnd: trialEnd.toISOString(),
                message: 'Trial activated for 7 days',
            })
        }

        return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    } catch (error) {
        console.error('[API] Trial activate error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
