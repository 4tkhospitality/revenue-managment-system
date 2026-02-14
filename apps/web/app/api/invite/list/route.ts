/**
 * GET  /api/invite/list   — List active invites for current hotel
 * DELETE /api/invite/list — Revoke an invite by id
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

const ACTIVE_HOTEL_COOKIE = 'rms_active_hotel'

export async function GET() {
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

        const invites = await prisma.hotelInvite.findMany({
            where: {
                hotel_id: activeHotelId,
                status: 'active',
            },
            orderBy: { created_at: 'desc' },
            select: {
                invite_id: true,
                short_code: true,
                role: true,
                max_uses: true,
                used_count: true,
                expires_at: true,
                created_at: true,
                status: true,
            },
        })

        // Mark expired invites
        const now = new Date()
        const result = invites.map(inv => ({
            ...inv,
            isExpired: inv.expires_at < now,
            isUsedUp: inv.used_count >= inv.max_uses,
        }))

        return NextResponse.json({ invites: result })
    } catch (error) {
        console.error('[API] Invite list error:', error)
        return NextResponse.json({ error: 'Failed to load invites' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
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

        // Permission check
        const isSuperAdmin = session.user.role === 'super_admin' || session.user.isAdmin
        if (!isSuperAdmin) {
            const hotelAccess = session.user.accessibleHotels?.find(
                h => h.hotelId === activeHotelId
            )
            if (!hotelAccess || hotelAccess.role !== 'hotel_admin') {
                return NextResponse.json({ error: 'Admin required' }, { status: 403 })
            }
        }

        const { inviteId } = await request.json()
        if (!inviteId) {
            return NextResponse.json({ error: 'inviteId required' }, { status: 400 })
        }

        // Revoke: set status to 'revoked'
        await prisma.hotelInvite.updateMany({
            where: {
                invite_id: inviteId,
                hotel_id: activeHotelId,
            },
            data: { status: 'revoked' },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API] Invite revoke error:', error)
        return NextResponse.json({ error: 'Failed to revoke invite' }, { status: 500 })
    }
}
