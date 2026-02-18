/**
 * GET    /api/team/members — List team members for current hotel
 * PATCH  /api/team/members — Change member role
 * DELETE /api/team/members — Remove member (soft: is_active=false)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { checkSeatAvailability } from '@/lib/seats'
import { UserRole } from '@prisma/client'

const ACTIVE_HOTEL_COOKIE = 'rms_active_hotel'

const ROLE_RANK: Record<string, number> = {
    viewer: 0,
    manager: 1,
    hotel_admin: 2,
    super_admin: 3,
}

// ── Helpers ─────────────────────────────────────────────────────────

async function getActiveHotelId() {
    const cookieStore = await cookies()
    return cookieStore.get(ACTIVE_HOTEL_COOKIE)?.value
}

function getActorHotelAccess(session: any, hotelId: string) {
    return session.user.accessibleHotels?.find(
        (h: any) => h.hotelId === hotelId
    )
}

function isActorAdmin(session: any, hotelId: string): boolean {
    if (session.user.isAdmin) return true // super_admin bypass
    const access = getActorHotelAccess(session, hotelId)
    return (ROLE_RANK[access?.role] ?? 0) >= ROLE_RANK['hotel_admin']
}

// ── GET ─────────────────────────────────────────────────────────────

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const activeHotelId = await getActiveHotelId()
        if (!activeHotelId) {
            return NextResponse.json({ error: 'No active hotel' }, { status: 400 })
        }

        // Verify user has access to this hotel
        const hasAccess = session.user.accessibleHotels?.some(
            (h: any) => h.hotelId === activeHotelId
        )
        if (!hasAccess && !session.user.isAdmin) {
            return NextResponse.json({ error: 'No access to this hotel' }, { status: 403 })
        }

        const [members, seats] = await Promise.all([
            prisma.hotelUser.findMany({
                where: {
                    hotel_id: activeHotelId,
                    is_active: true,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: [
                    { is_primary: 'desc' },
                    { role: 'asc' },
                    { created_at: 'asc' },
                ],
            }),
            checkSeatAvailability(activeHotelId),
        ])

        return NextResponse.json({
            members,
            seats: {
                current: seats.currentSeats,
                max: seats.maxSeats,
                available: seats.available,
                plan: seats.plan,
                activeMembers: seats.activeMembers,
                pendingInvites: seats.pendingInvites,
            },
        })
    } catch (error) {
        console.error('[API] Team members error:', error)
        return NextResponse.json(
            { error: 'Failed to load members' },
            { status: 500 }
        )
    }
}

// ── PATCH — Change role ─────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const activeHotelId = await getActiveHotelId()
        if (!activeHotelId) {
            return NextResponse.json({ error: 'No active hotel' }, { status: 400 })
        }

        // Actor must be hotel_admin+
        if (!isActorAdmin(session, activeHotelId)) {
            return NextResponse.json({ error: 'Chỉ Admin mới có thể đổi vai trò' }, { status: 403 })
        }

        const body = await request.json()
        const { memberId, newRole } = body as { memberId: string; newRole: UserRole }

        if (!memberId || !newRole) {
            return NextResponse.json({ error: 'memberId and newRole required' }, { status: 400 })
        }
        if (!['viewer', 'manager', 'hotel_admin'].includes(newRole)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }

        // Load target membership
        const target = await prisma.hotelUser.findFirst({
            where: { id: memberId, hotel_id: activeHotelId, is_active: true },
        })
        if (!target) {
            return NextResponse.json({ error: 'Thành viên không tồn tại' }, { status: 404 })
        }

        // Cannot change Owner's role
        if (target.is_primary) {
            return NextResponse.json({ error: 'Không thể thay đổi vai trò của Owner' }, { status: 403 })
        }

        // Cannot change own role
        if (target.user_id === session.user.id) {
            return NextResponse.json({ error: 'Không thể tự đổi vai trò của mình' }, { status: 403 })
        }

        // Determine if actor is Owner
        const actorMembership = await prisma.hotelUser.findFirst({
            where: { user_id: session.user.id, hotel_id: activeHotelId, is_active: true },
        })
        const actorIsOwner = actorMembership?.is_primary === true || session.user.isAdmin

        // Non-owner admin: cannot touch any hotel_admin member, cannot set hotel_admin
        if (!actorIsOwner) {
            if (target.role === 'hotel_admin') {
                return NextResponse.json(
                    { error: 'Chỉ Owner mới có thể thay đổi vai trò Admin' },
                    { status: 403 }
                )
            }
            if (newRole === 'hotel_admin') {
                return NextResponse.json(
                    { error: 'Chỉ Owner mới có thể promote lên Admin' },
                    { status: 403 }
                )
            }
        }

        // Cannot demote last hotel_admin
        if (target.role === 'hotel_admin' && newRole !== 'hotel_admin') {
            const adminCount = await prisma.hotelUser.count({
                where: { hotel_id: activeHotelId, role: 'hotel_admin', is_active: true },
            })
            if (adminCount <= 1) {
                return NextResponse.json(
                    { error: 'Không thể bỏ Admin cuối cùng — cần ít nhất 1 Admin' },
                    { status: 400 }
                )
            }
        }

        // Update role
        await prisma.hotelUser.update({
            where: { id: memberId },
            data: { role: newRole },
        })

        return NextResponse.json({ success: true, newRole })
    } catch (error) {
        console.error('[API] Change role error:', error)
        return NextResponse.json({ error: 'Failed to change role' }, { status: 500 })
    }
}

// ── DELETE — Remove member (soft) ───────────────────────────────────

export async function DELETE(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const activeHotelId = await getActiveHotelId()
        if (!activeHotelId) {
            return NextResponse.json({ error: 'No active hotel' }, { status: 400 })
        }

        // Actor must be hotel_admin+
        if (!isActorAdmin(session, activeHotelId)) {
            return NextResponse.json({ error: 'Chỉ Admin mới có thể xóa thành viên' }, { status: 403 })
        }

        const body = await request.json()
        const { memberId } = body as { memberId: string }

        if (!memberId) {
            return NextResponse.json({ error: 'memberId required' }, { status: 400 })
        }

        // Load target membership
        const target = await prisma.hotelUser.findFirst({
            where: { id: memberId, hotel_id: activeHotelId, is_active: true },
        })
        if (!target) {
            return NextResponse.json({ error: 'Thành viên không tồn tại' }, { status: 404 })
        }

        // Cannot remove Owner
        if (target.is_primary) {
            return NextResponse.json({ error: 'Không thể xóa Owner' }, { status: 403 })
        }

        // Cannot remove self
        if (target.user_id === session.user.id) {
            return NextResponse.json({ error: 'Không thể tự xóa chính mình' }, { status: 403 })
        }

        // Determine if actor is Owner
        const actorMembership = await prisma.hotelUser.findFirst({
            where: { user_id: session.user.id, hotel_id: activeHotelId, is_active: true },
        })
        const actorIsOwner = actorMembership?.is_primary === true || session.user.isAdmin

        // Non-owner admin cannot remove hotel_admin members
        if (!actorIsOwner && target.role === 'hotel_admin') {
            return NextResponse.json(
                { error: 'Chỉ Owner mới có thể xóa Admin' },
                { status: 403 }
            )
        }

        // Cannot remove last hotel_admin
        if (target.role === 'hotel_admin') {
            const adminCount = await prisma.hotelUser.count({
                where: { hotel_id: activeHotelId, role: 'hotel_admin', is_active: true },
            })
            if (adminCount <= 1) {
                return NextResponse.json(
                    { error: 'Không thể xóa Admin cuối cùng — cần ít nhất 1 Admin' },
                    { status: 400 }
                )
            }
        }

        // Soft remove
        await prisma.hotelUser.update({
            where: { id: memberId },
            data: { is_active: false },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API] Remove member error:', error)
        return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }
}
