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
    console.log('[Onboarding Complete] ━━━━ START ━━━━')
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log(`[Onboarding Complete] User: ${session.user.email} (${session.user.id})`)

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

        // ── Pay-first flow: Find COMPLETED payment to link to new hotel ──────
        // This includes: orphan payments (hotel_id=null) AND payments linked to Demo Hotel
        const demoHotel = await prisma.hotel.findFirst({
            where: { name: 'Demo Hotel' },
            select: { hotel_id: true },
        })

        const paymentToLink = await prisma.paymentTransaction.findFirst({
            where: {
                user_id: session.user.id,
                status: 'COMPLETED',
                OR: [
                    { hotel_id: null },
                    ...(demoHotel ? [{ hotel_id: demoHotel.hotel_id }] : []),
                ],
            },
            orderBy: { created_at: 'desc' },
        })

        // Also list ALL payments for this user for debugging
        const allPayments = await prisma.paymentTransaction.findMany({
            where: { user_id: session.user.id },
            select: { id: true, status: true, hotel_id: true, purchased_tier: true, purchased_room_band: true, gateway: true },
            orderBy: { created_at: 'desc' },
            take: 5,
        })
        console.log(`[OC] ALL payments for user: ${JSON.stringify(allPayments)}`)

        // List ALL hotelUsers for this user
        const allHotelUsers = await prisma.hotelUser.findMany({
            where: { user_id: session.user.id },
            include: { hotel: { select: { name: true } } },
        })
        console.log(`[OC] ALL hotelUsers BEFORE tx: ${JSON.stringify(allHotelUsers.map(hu => ({ hotelId: hu.hotel_id, name: hu.hotel?.name, role: hu.role })))}`)

        let subscriptionActivated = false

        console.log(`[OC] Payment to link: ${paymentToLink ? `id=${paymentToLink.id}, tier=${paymentToLink.purchased_tier}, band=${paymentToLink.purchased_room_band}, hotel_id=${paymentToLink.hotel_id}, gateway=${paymentToLink.gateway}` : 'NONE FOUND'}`)
        console.log(`[OC] demoHotel: ${demoHotel ? demoHotel.hotel_id : 'NOT FOUND'}`)

        if (paymentToLink && paymentToLink.purchased_tier && paymentToLink.purchased_room_band) {
            // Link payment to the new hotel + activate subscription
            const now = new Date()
            const termMonths = (paymentToLink as any).term_months || 1
            const periodEnd = new Date(now.getTime() + termMonths * 30 * 24 * 60 * 60 * 1000)

            // ALL critical operations in ONE transaction to prevent race conditions
            console.log(`[OC] 🟢 ENTERING TRANSACTION: paid flow (tier=${paymentToLink.purchased_tier}, band=${paymentToLink.purchased_room_band})`)
            await prisma.$transaction(async (tx) => {
                // 1. Link orphan payment to new hotel
                console.log(`[OC] Step 1: Linking payment ${paymentToLink.id} to hotel ${hotelId}`)
                await tx.paymentTransaction.update({
                    where: { id: paymentToLink.id },
                    data: { hotel_id: hotelId },
                })
                console.log(`[OC] Step 1: ✅ Done`)

                // 2. Activate subscription for the new hotel
                console.log(`[OC] Step 2: Activating subscription ${paymentToLink.purchased_tier}/${paymentToLink.purchased_room_band} for hotel ${hotelId}`)
                await applySubscriptionChange(tx, hotelId, session.user!.id!, {
                    periodStart: now,
                    periodEnd,
                    provider: (paymentToLink.gateway === 'SEPAY' ? 'SEPAY' : 'PAYPAL') as 'SEPAY' | 'PAYPAL' | 'ZALO_MANUAL',
                    plan: paymentToLink.purchased_tier!,
                    roomBand: paymentToLink.purchased_room_band!,
                })
                console.log(`[OC] Step 2: ✅ Done`)

                // 3. Update user.hotel_id to new hotel
                console.log(`[OC] Step 3: Updating user.hotel_id to ${hotelId}`)
                await tx.user.update({
                    where: { id: session.user!.id! },
                    data: { hotel_id: hotelId },
                })
                console.log(`[OC] Step 3: ✅ Done`)

                // 4. Remove Demo Hotel from user's accessible hotels (INSIDE tx)
                if (demoHotel) {
                    console.log(`[OC] Step 4: Removing Demo Hotel ${demoHotel.hotel_id} from user's hotelUsers`)
                    const deleteResult = await tx.hotelUser.deleteMany({
                        where: {
                            user_id: session.user!.id!,
                            hotel_id: demoHotel.hotel_id,
                        },
                    })
                    console.log(`[OC] Step 4: ✅ Deleted ${deleteResult.count} Demo HotelUser records`)
                } else {
                    console.log(`[OC] Step 4: No Demo Hotel to remove`)
                }

                // 5. Log event inside tx
                await tx.productEvent.create({
                    data: {
                        user_id: session.user!.id!,
                        hotel_id: hotelId,
                        event_type: 'ORPHAN_PAYMENT_LINKED',
                        event_data: {
                            paymentId: paymentToLink.id,
                            tier: paymentToLink.purchased_tier,
                            roomBand: paymentToLink.purchased_room_band,
                            termMonths,
                            demoHotelRemoved: !!demoHotel,
                        },
                    },
                })
            })
            console.log(`[OC] 🟢 TRANSACTION COMMITTED`)

            subscriptionActivated = true
            console.log(`[OC] ✅ Payment linked + subscription activated for hotel ${hotelId}`)
        } else {
            // No payment found or missing tier/band → still remove Demo and update user.hotel_id
            console.log(`[OC] 🟡 ENTERING TRANSACTION: no-payment flow`)
            console.log(`[OC] paymentToLink=${!!paymentToLink}, tier=${paymentToLink?.purchased_tier || 'null'}, band=${paymentToLink?.purchased_room_band || 'null'}`)

            await prisma.$transaction(async (tx) => {
                console.log(`[OC] Step A: Updating user.hotel_id to ${hotelId}`)
                await tx.user.update({
                    where: { id: session.user!.id! },
                    data: { hotel_id: hotelId },
                })
                console.log(`[OC] Step A: ✅ Done`)
                if (demoHotel) {
                    console.log(`[OC] Step B: Removing Demo Hotel ${demoHotel.hotel_id}`)
                    const deleteResult = await tx.hotelUser.deleteMany({
                        where: {
                            user_id: session.user!.id!,
                            hotel_id: demoHotel.hotel_id,
                        },
                    })
                    console.log(`[OC] Step B: ✅ Deleted ${deleteResult.count} Demo HotelUser records`)
                }
            })
            console.log(`[OC] 🟡 TRANSACTION COMMITTED (no-payment)`)
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

        console.log(`[Onboarding Complete] ━━━━ DONE ━━━━ subscriptionActivated=${subscriptionActivated}, trialExtended=${trialExtended}`)
        const response = NextResponse.json({
            success: true,
            trialExtended,
            subscriptionActivated,
            hotelId,
            message: subscriptionActivated
                ? `Đã kích hoạt gói ${paymentToLink?.purchased_tier}! Chào mừng bạn!`
                : trialExtended
                    ? 'Onboarding hoàn tất! Trial được gia hạn thêm 7 ngày.'
                    : 'Onboarding hoàn tất!'
        })

        // Set active hotel cookie so middleware allows through even before JWT refreshes
        console.log(`[OC] 🍪 Setting rms_active_hotel cookie = ${hotelId}`)
        response.cookies.set('rms_active_hotel', hotelId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
        })

        // Verify final state of hotelUsers
        const finalHotelUsers = await prisma.hotelUser.findMany({
            where: { user_id: session.user.id },
            include: { hotel: { select: { name: true } } },
        })
        console.log(`[OC] 🏁 FINAL hotelUsers: ${JSON.stringify(finalHotelUsers.map(hu => ({ hotelId: hu.hotel_id, name: hu.hotel?.name, role: hu.role })))}`)
        console.log(`[OC] ━━━━ END ━━━━ success=true`)

        return response
    } catch (error) {
        console.error('[API] Onboarding complete error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
