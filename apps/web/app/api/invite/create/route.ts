/**
 * POST /api/invite/create
 * Create invite link for hotel (hotel_admin+ only)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { checkSeatAvailability, tierLimitError } from '@/lib/seats'

const ACTIVE_HOTEL_COOKIE = 'rms_active_hotel'

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const cookieStore = await cookies()
        const activeHotelId = cookieStore.get(ACTIVE_HOTEL_COOKIE)?.value

        if (!activeHotelId) {
            return NextResponse.json({ error: 'No active hotel' }, { status: 400 })
        }

        // Permission check: super_admin OR hotel_admin for this hotel
        const isSuperAdmin = session.user.role === 'super_admin' || session.user.isAdmin

        if (!isSuperAdmin) {
            const hotelAccess = session.user.accessibleHotels?.find(
                h => h.hotelId === activeHotelId
            )
            if (!hotelAccess || hotelAccess.role !== 'hotel_admin') {
                return NextResponse.json(
                    { error: 'Only Admins can create invite codes' },
                    { status: 403 }
                )
            }
        }

        // Parse body
        const body = await request.json().catch(() => ({}))
        const role = body.role || 'viewer'
        const maxUses = body.maxUses || 5
        const expiryDays = body.expiryDays || 7

        // Generate token
        const token = crypto.randomBytes(16).toString('hex')
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
        const shortCode = token.substring(0, 8).toUpperCase()

        // Set expires_at at API (not DB default)
        const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)

        // Check seat limit before creating invite
        const seats = await checkSeatAvailability(activeHotelId)
        if (!seats.available) {
            return NextResponse.json(tierLimitError(seats.plan, seats.maxSeats), { status: 403 })
        }

        // Create invite
        const invite = await prisma.hotelInvite.create({
            data: {
                hotel_id: activeHotelId,
                token_hash: tokenHash,
                short_code: shortCode,
                role: role as any,
                max_uses: maxUses,
                expires_at: expiresAt,
                created_by: session.user.id,
            },
        })

        // Build invite URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const inviteUrl = `${baseUrl}/invite?token=${token}`

        // Log event
        await prisma.productEvent.create({
            data: {
                user_id: session.user.id,
                hotel_id: activeHotelId,
                event_type: 'INVITE_CREATED',
                event_data: { role, maxUses, expiryDays },
            },
        })

        return NextResponse.json({
            success: true,
            inviteId: invite.invite_id,
            token,
            shortCode,
            inviteUrl,
            expiresAt: expiresAt.toISOString(),
        })
    } catch (error) {
        console.error('[API] Invite create error:', error)
        return NextResponse.json(
            { error: 'Unable to create invite code' },
            { status: 500 }
        )
    }
}
