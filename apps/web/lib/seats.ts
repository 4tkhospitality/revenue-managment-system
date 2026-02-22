import prisma from '@/lib/prisma'
import { getDefaultLimits } from '@/lib/plg/plan-config'

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
 * Source of truth: effectiveMaxUsers = subscription.max_users ?? plan-config defaults
 * Seats are counted at HOTEL level (HotelUsers) to be consistent with team page
 */
export async function checkSeatAvailability(hotelId: string): Promise<SeatAvailability> {
    // Load subscription by hotel_id
    const subscription = await prisma.subscription.findFirst({
        where: { hotel_id: hotelId },
        select: { plan: true, max_users: true, status: true }
    })

    // Count active hotel members (consistent with team page member list)
    const activeMembers = await prisma.hotelUser.count({
        where: {
            hotel_id: hotelId,
            is_active: true,
        }
    })

    // Count active pending invites
    const pendingInvites = await prisma.hotelInvite.count({
        where: {
            hotel_id: hotelId,
            status: 'active',
            expires_at: { gt: new Date() },
        }
    })

    const plan = subscription?.plan ?? null

    // effectiveMaxUsers = subscription.max_users ?? plan-config defaults
    let maxSeats = 0
    if (subscription?.max_users) {
        maxSeats = subscription.max_users
    } else if (plan) {
        maxSeats = getDefaultLimits(plan).maxUsers
    }

    const currentSeats = activeMembers + pendingInvites

    return {
        currentSeats,
        activeMembers,
        pendingInvites,
        maxSeats,
        available: maxSeats === 0 || currentSeats < maxSeats, // 0 means unlimited
        plan,
    }
}

/**
 * Standard error response for tier limit reached.
 */
export function tierLimitError(plan: string | null, maxSeats: number) {
    const planDisplay = plan ?? 'Current'
    return {
        error: 'TIER_LIMIT_REACHED',
        message: `Plan ${planDisplay} allows ${maxSeats >= 999 ? 'unlimited' : maxSeats} members. Upgrade your plan to add more.`,
        upgradeUrl: '/pricing-plans',
    }
}
