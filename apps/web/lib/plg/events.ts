// ════════════════════════════════════════════════════════════════════
// PLG — Event Logging Service
// logEvent() → general events
// logSessionEvent() → dedup by @@unique(hotel_id, event_type, session_id)
// ════════════════════════════════════════════════════════════════════

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Log a generic product event (no dedup).
 */
export async function logEvent(
    userId: string,
    hotelId: string | null,
    eventType: string,
    eventData?: Record<string, unknown>,
): Promise<void> {
    await prisma.productEvent.create({
        data: {
            user_id: userId,
            hotel_id: hotelId,
            event_type: eventType,
            event_data: eventData ? (eventData as Prisma.InputJsonValue) : undefined,
        },
    });
}

/**
 * Log a session-based event with absolute dedup.
 * Uses @@unique([hotel_id, event_type, session_id]) constraint.
 * Duplicate → no-op (idempotent).
 */
export async function logSessionEvent(
    userId: string,
    hotelId: string,
    eventType: string,
    sessionId: string,
    eventData?: Record<string, unknown>,
): Promise<boolean> {
    try {
        await prisma.productEvent.create({
            data: {
                user_id: userId,
                hotel_id: hotelId,
                event_type: eventType,
                session_id: sessionId,
                event_data: eventData ? (eventData as Prisma.InputJsonValue) : undefined,
            },
        });
        return true; // new event
    } catch (error: unknown) {
        // P2002 = Unique constraint violation → duplicate, skip
        if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            (error as { code: string }).code === 'P2002'
        ) {
            return false; // duplicate, no-op
        }
        throw error;
    }
}

/**
 * Count distinct sessions for an event type within a date range.
 * Used by trial bonus check.
 */
export async function countDistinctSessions(
    hotelId: string,
    eventType: string,
    since: Date,
): Promise<number> {
    const result = await prisma.productEvent.findMany({
        where: {
            hotel_id: hotelId,
            event_type: eventType,
            session_id: { not: null },
            created_at: { gte: since },
        },
        select: { session_id: true },
        distinct: ['session_id'],
    });
    return result.length;
}

/**
 * Count events of a specific type since a date. Used for trial bonus.
 */
export async function countEvents(
    hotelId: string,
    eventType: string,
    since: Date,
): Promise<number> {
    return prisma.productEvent.count({
        where: {
            hotel_id: hotelId,
            event_type: eventType,
            created_at: { gte: since },
        },
    });
}
