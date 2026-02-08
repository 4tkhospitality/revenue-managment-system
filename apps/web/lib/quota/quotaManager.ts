/**
 * Quota Manager
 * Tracks and enforces export/team quotas based on subscription tier
 */
import prisma from '@/lib/prisma'

const TIER_LIMITS = {
    FREE: {
        exportsPerWeek: 3,
        teamSeats: 1,
    },
    STARTER: {
        exportsPerWeek: 20,
        teamSeats: 3,
    },
    PRO: {
        exportsPerWeek: -1, // Unlimited
        teamSeats: 10,
    },
    ENTERPRISE: {
        exportsPerWeek: -1,
        teamSeats: -1, // Unlimited
    },
}

export interface QuotaStatus {
    allowed: boolean
    used: number
    limit: number
    tier: string
    message?: string
}

/**
 * Check if user can perform an export
 * Counts EXPORT events in the last 7 days
 */
export async function checkExportQuota(userId: string, hotelId: string): Promise<QuotaStatus> {
    // Get subscription tier
    const subscription = await prisma.subscription.findUnique({
        where: { hotel_id: hotelId },
        select: { plan: true },
    })

    const tier = (subscription?.plan || 'FREE') as keyof typeof TIER_LIMITS
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.FREE

    // Unlimited exports for paid tiers
    if (limits.exportsPerWeek === -1) {
        return { allowed: true, used: 0, limit: -1, tier }
    }

    // Count exports in last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const exportCount = await prisma.productEvent.count({
        where: {
            user_id: userId,
            hotel_id: hotelId,
            event_type: 'EXPORT',
            created_at: { gte: weekAgo },
        },
    })

    const allowed = exportCount < limits.exportsPerWeek

    return {
        allowed,
        used: exportCount,
        limit: limits.exportsPerWeek,
        tier,
        message: allowed
            ? undefined
            : `Bạn đã sử dụng hết ${limits.exportsPerWeek} lượt xuất dữ liệu tuần này`,
    }
}

/**
 * Check if hotel can add more team members
 */
export async function checkTeamSeatQuota(hotelId: string): Promise<QuotaStatus> {
    // Get subscription tier
    const subscription = await prisma.subscription.findUnique({
        where: { hotel_id: hotelId },
        select: { plan: true },
    })

    const tier = (subscription?.plan || 'FREE') as keyof typeof TIER_LIMITS
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.FREE

    // Unlimited seats for enterprise
    if (limits.teamSeats === -1) {
        return { allowed: true, used: 0, limit: -1, tier }
    }

    // Count active team members
    const memberCount = await prisma.hotelUser.count({
        where: {
            hotel_id: hotelId,
            is_active: true,
        },
    })

    const allowed = memberCount < limits.teamSeats

    return {
        allowed,
        used: memberCount,
        limit: limits.teamSeats,
        tier,
        message: allowed
            ? undefined
            : `Gói ${tier} chỉ cho phép ${limits.teamSeats} thành viên`,
    }
}

/**
 * Record an export event
 */
export async function recordExportEvent(
    userId: string,
    hotelId: string,
    exportType: string
): Promise<void> {
    await prisma.productEvent.create({
        data: {
            user_id: userId,
            hotel_id: hotelId,
            event_type: 'EXPORT',
            event_data: { type: exportType },
        },
    })
}

/**
 * Get usage summary for a hotel
 */
export async function getUsageSummary(hotelId: string): Promise<{
    exports: QuotaStatus
    teamSeats: QuotaStatus
}> {
    const subscription = await prisma.subscription.findUnique({
        where: { hotel_id: hotelId },
        select: { plan: true },
    })

    const tier = (subscription?.plan || 'FREE') as keyof typeof TIER_LIMITS
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.FREE

    // Count exports in last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const exportCount = await prisma.productEvent.count({
        where: {
            hotel_id: hotelId,
            event_type: 'EXPORT',
            created_at: { gte: weekAgo },
        },
    })

    // Count team members
    const memberCount = await prisma.hotelUser.count({
        where: {
            hotel_id: hotelId,
            is_active: true,
        },
    })

    return {
        exports: {
            allowed: limits.exportsPerWeek === -1 || exportCount < limits.exportsPerWeek,
            used: exportCount,
            limit: limits.exportsPerWeek,
            tier,
        },
        teamSeats: {
            allowed: limits.teamSeats === -1 || memberCount < limits.teamSeats,
            used: memberCount,
            limit: limits.teamSeats,
            tier,
        },
    }
}
