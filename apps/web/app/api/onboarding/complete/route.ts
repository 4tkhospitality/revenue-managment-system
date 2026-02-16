/**
 * POST /api/onboarding/complete
 * Mark onboarding as complete and activate subscription if orphan payment exists.
 *
 * Pay-first flow:
 * 1. Demo user pays → PaymentTransaction COMPLETED with hotel_id = null
 * 2. User creates hotel via /api/onboarding
 * 3. This endpoint links the payment to the new hotel + activates subscription
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { applySubscriptionChange } from '@/lib/payments/activation'

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

        // ── Pay-first flow: Check for orphan COMPLETED payment ──────────
        const orphanPayment = await prisma.paymentTransaction.findFirst({
            where: {
                user_id: session.user.id,
                hotel_id: null,
                status: 'COMPLETED',
            },
            orderBy: { created_at: 'desc' },
        })

        let subscriptionActivated = false

        if (orphanPayment && orphanPayment.purchased_tier && orphanPayment.purchased_room_band) {
            // Link payment to the new hotel + activate subscription
            const now = new Date()
            const termMonths = orphanPayment.term_months || 1
            const periodEnd = new Date(now.getTime() + termMonths * 30 * 24 * 60 * 60 * 1000)

            await prisma.$transaction(async (tx) => {
                // 1. Link orphan payment to new hotel
                await tx.paymentTransaction.update({
                    where: { id: orphanPayment.id },
                    data: { hotel_id: hotelId },
                })

                // 2. Activate subscription for the new hotel
                await applySubscriptionChange(tx, hotelId, session.user!.id!, {
                    periodStart: now,
                    periodEnd,
                    provider: (orphanPayment.gateway === 'SEPAY' ? 'SEPAY' : 'PAYPAL') as 'SEPAY' | 'PAYPAL' | 'ZALO_MANUAL',
                    plan: orphanPayment.purchased_tier!,
                    roomBand: orphanPayment.purchased_room_band!,
                })
            })

            subscriptionActivated = true

            // Log event
            await prisma.productEvent.create({
                data: {
                    user_id: session.user.id,
                    hotel_id: hotelId,
                    event_type: 'ORPHAN_PAYMENT_LINKED',
                    event_data: {
                        paymentId: orphanPayment.id,
                        tier: orphanPayment.purchased_tier,
                        roomBand: orphanPayment.purchased_room_band,
                        termMonths,
                    },
                },
            })
        }

        // ── Legacy: Check trial extension (for non-pay-first users) ─────
        let trialExtended = false
        if (!subscriptionActivated) {
            const subscription = await prisma.subscription.findUnique({
                where: { hotel_id: hotelId },
            })

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
        }

        // Log completion
        await prisma.productEvent.create({
            data: {
                user_id: session.user.id,
                hotel_id: hotelId,
                event_type: 'ONBOARDING_COMPLETED',
                event_data: { trialExtended, subscriptionActivated },
            },
        })

        return NextResponse.json({
            success: true,
            trialExtended,
            subscriptionActivated,
            message: subscriptionActivated
                ? `Đã kích hoạt gói ${orphanPayment?.purchased_tier}! Chào mừng bạn!`
                : trialExtended
                    ? 'Onboarding hoàn tất! Trial được gia hạn thêm 7 ngày.'
                    : 'Onboarding hoàn tất!'
        })
    } catch (error) {
        console.error('[API] Onboarding complete error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
