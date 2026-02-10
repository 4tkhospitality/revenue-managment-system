import prisma from '@/lib/prisma'
import { TIER_CONFIGS } from '@/lib/tier/tierConfig'

export interface SeatAvailability {
    currentSeats: number
    activeMembers: number
    pendingInvites: number
    maxSeats: number
    available: boolean
    plan: string | null
}

/**
 * Check seat availability for a hotel based on its subscription tier.
 * 
 * Source of truth: effectiveMaxUsers = subscription.max_users ?? tierConfig[plan].maxUsers
 * currentSeats = activeHotelUsers + activePendingInvites
 */
export async function checkSeatAvailability(hotelId: string): Promise<SeatAvailability> {
    const [subscription, activeMembers, pendingInvites] = await Promise.all([
        prisma.subscription.findUnique({
            where: { hotel_id: hotelId },
            select: { plan: true, max_users: true, status: true }
        }),
        // Count active hotel users
        prisma.hotelUser.count({
            where: {
                hotel_id: hotelId,
                user: { is_active: true }
            }
        }),
        // Count active pending invites (not expired, not fully used)
        prisma.hotelInvite.count({
            where: {
                hotel_id: hotelId,
                status: 'active',
                expires_at: { gt: new Date() },
            }
        }),
    ])

    const plan = subscription?.plan ?? null

    // effectiveMaxUsers = subscription.max_users ?? tierConfig[plan].maxUsers
    let maxSeats = 0
    if (subscription?.max_users) {
        maxSeats = subscription.max_users
    } else if (plan && plan in TIER_CONFIGS) {
        maxSeats = TIER_CONFIGS[plan as keyof typeof TIER_CONFIGS].maxUsers
    }

    const currentSeats = activeMembers + pendingInvites

    return {
        currentSeats,
        activeMembers,
        pendingInvites,
        maxSeats,
        available: maxSeats === 0 || currentSeats < maxSeats, // 0 means no limit enforcement
        plan,
    }
}

/**
 * Standard error response for tier limit reached.
 */
export function tierLimitError(plan: string | null, maxSeats: number) {
    const planDisplay = plan ?? 'Hiện tại'
    return {
        error: 'TIER_LIMIT_REACHED',
        message: `Gói ${planDisplay} chỉ cho phép ${maxSeats >= 999 ? 'không giới hạn' : maxSeats} thành viên. Nâng cấp gói để thêm.`,
        upgradeUrl: '/pricing-plans',
    }
}
