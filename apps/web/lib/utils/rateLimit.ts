/**
 * DB-based rate limiter using ProductEvent table
 * Vercel-safe: no in-memory state, works across serverless instances
 */
import prisma from '@/lib/prisma'

interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: Date
}

/**
 * Check if user is within rate limit using ProductEvent as tracking
 * @param userId - User ID to check
 * @param eventType - Event type to track (e.g., 'INVITE_ATTEMPT')
 * @param limit - Max attempts allowed (default: 5)
 * @param windowSeconds - Time window in seconds (default: 60)
 */
export async function checkRateLimit(
    userId: string,
    eventType: string,
    limit: number = 5,
    windowSeconds: number = 60
): Promise<RateLimitResult> {
    const windowStart = new Date(Date.now() - windowSeconds * 1000)
    const resetAt = new Date(Date.now() + windowSeconds * 1000)

    // Count recent attempts
    const count = await prisma.productEvent.count({
        where: {
            user_id: userId,
            event_type: eventType,
            created_at: { gte: windowStart },
        },
    })

    return {
        allowed: count < limit,
        remaining: Math.max(0, limit - count),
        resetAt,
    }
}

/**
 * Record a rate-limited event
 * Call this BEFORE the actual action to count the attempt
 */
export async function recordRateLimitEvent(
    userId: string,
    eventType: string,
    hotelId?: string,
    eventData?: object
): Promise<void> {
    await prisma.productEvent.create({
        data: {
            user_id: userId,
            hotel_id: hotelId ?? null,
            event_type: eventType,
            event_data: eventData ?? undefined,
        },
    })
}

/**
 * Combined check + record for convenience
 * Returns false if rate limited (and doesn't record)
 */
export async function tryRateLimit(
    userId: string,
    eventType: string,
    hotelId?: string,
    limit: number = 5,
    windowSeconds: number = 60
): Promise<RateLimitResult> {
    const result = await checkRateLimit(userId, eventType, limit, windowSeconds)

    if (result.allowed) {
        await recordRateLimitEvent(userId, eventType, hotelId)
    }

    return result
}

// ════════════════════════════════════════════════════════════════════
// IP-Based Rate Limiting (for unauthenticated requests)
// Uses RateLimitHit table for Vercel serverless safety
// ════════════════════════════════════════════════════════════════════

interface IpRateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: Date
}

/**
 * Check if IP is within rate limit (for guest/unauthenticated requests)
 * @param ip - Client IP address
 * @param key - Rate limit key (e.g., 'invite_redeem', 'login_attempt')
 * @param limit - Max attempts allowed (default: 5)
 * @param windowSeconds - Time window in seconds (default: 60)
 */
export async function checkIpRateLimit(
    ip: string,
    key: string,
    limit: number = 5,
    windowSeconds: number = 60
): Promise<IpRateLimitResult> {
    const windowStart = new Date(Date.now() - windowSeconds * 1000)
    const resetAt = new Date(Date.now() + windowSeconds * 1000)

    // Count recent hits from this IP for this key
    const count = await prisma.rateLimitHit.count({
        where: {
            ip,
            key,
            created_at: { gte: windowStart },
        },
    })

    return {
        allowed: count < limit,
        remaining: Math.max(0, limit - count),
        resetAt,
    }
}

/**
 * Record an IP rate limit hit
 */
export async function recordIpRateLimitHit(
    ip: string,
    key: string
): Promise<void> {
    await prisma.rateLimitHit.create({
        data: { ip, key },
    })
}

/**
 * Combined check + record for IP rate limiting
 * Returns false if rate limited (and doesn't record)
 */
export async function tryIpRateLimit(
    ip: string,
    key: string,
    limit: number = 5,
    windowSeconds: number = 60
): Promise<IpRateLimitResult> {
    const result = await checkIpRateLimit(ip, key, limit, windowSeconds)

    if (result.allowed) {
        await recordIpRateLimitHit(ip, key)
    }

    return result
}

/**
 * Clean up old rate limit hits (run periodically via cron)
 * Removes hits older than 24 hours
 */
export async function cleanupOldRateLimitHits(): Promise<number> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const result = await prisma.rateLimitHit.deleteMany({
        where: {
            created_at: { lt: cutoff },
        },
    })

    return result.count
}
