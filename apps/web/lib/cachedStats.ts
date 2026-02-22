// Data stats - filtered by hotel, with in-memory cache
import prisma from './prisma';
import { Prisma } from '@prisma/client';

// ─── In-memory cache ────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const reservationCache = new Map<string, CacheEntry<ReservationStats>>();
const cancellationCache = new Map<string, CacheEntry<CancellationStats>>();

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
        return entry.data;
    }
    cache.delete(key);
    return null;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
}

// Keep this export for backward compatibility (called by ingest actions)
export function invalidateStatsCache(): void {
    reservationCache.clear();
    cancellationCache.clear();
}

// ─── Types ───────────────────────────────────────────
interface ReservationStats {
    count: number;
    rooms: number;
    revenue: number;
    topAgents: Array<{ company_name: string; revenue: number }>;
}

interface CancellationStats {
    count: number;
    nights: number;
    revenue: number;
    topChannels: Array<{ channel: string; revenue: number }>;
}

// ─── Reservation stats: SQL aggregate + hotel filter + 7-day window ─
export async function getReservationStats30(hotelId?: string): Promise<ReservationStats> {
    const cacheKey = hotelId || '__all__';
    const cached = getCached(reservationCache, cacheKey);
    if (cached) return cached;

    // Filter to last 7 days by booking_date
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const whereClause = {
        status: 'booked' as const,
        booking_date: { gte: sevenDaysAgo },
        ...(hotelId ? { hotel_id: hotelId } : {}),
    };

    // Parallel: aggregate + groupBy instead of findMany + JS reduce
    const [agg, topAgentsRaw] = await Promise.all([
        prisma.reservationsRaw.aggregate({
            where: whereClause,
            _count: true,
            _sum: { rooms: true, revenue: true },
        }),
        prisma.reservationsRaw.groupBy({
            by: ['company_name'],
            where: whereClause,
            _sum: { revenue: true },
            orderBy: { _sum: { revenue: 'desc' } },
            take: 3,
        }),
    ]);

    const result: ReservationStats = {
        count: agg._count,
        rooms: agg._sum.rooms || 0,
        revenue: Number(agg._sum.revenue || 0),
        topAgents: topAgentsRaw.map(a => ({
            company_name: a.company_name || 'Other',
            revenue: Number(a._sum.revenue || 0),
        })),
    };

    setCache(reservationCache, cacheKey, result);
    return result;
}

// ─── Cancellation stats: from reservations_raw where cancelled (7-day window) ─
export async function getCancellationStats30Days(hotelId?: string): Promise<CancellationStats> {
    const cacheKey = hotelId || '__all__';
    const cached = getCached(cancellationCache, cacheKey);
    if (cached) return cached;

    // Filter to last 7 days by cancel_time
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Use OR condition: cancel_time is set OR status = 'cancelled'
    const whereClause = {
        OR: [
            { cancel_time: { not: null } },
            { status: 'cancelled' as const },
        ],
        cancel_time: { gte: sevenDaysAgo },
        ...(hotelId ? { hotel_id: hotelId } : {}),
    };

    // Build SQL for nights calculation (fixed: no nested $queryRaw)
    const nightsSql = hotelId
        ? Prisma.sql`
            SELECT COALESCE(SUM(departure_date - arrival_date), 0)::bigint AS total_nights
            FROM reservations_raw
            WHERE (cancel_time IS NOT NULL OR status = 'cancelled')
              AND cancel_time >= ${sevenDaysAgo}
              AND hotel_id = ${hotelId}::uuid
          `
        : Prisma.sql`
            SELECT COALESCE(SUM(departure_date - arrival_date), 0)::bigint AS total_nights
            FROM reservations_raw
            WHERE (cancel_time IS NOT NULL OR status = 'cancelled')
              AND cancel_time >= ${sevenDaysAgo}
          `;

    // Parallel: aggregate + groupBy
    const [agg, nightsResult, topChannelsRaw] = await Promise.all([
        prisma.reservationsRaw.aggregate({
            where: whereClause,
            _count: true,
            _sum: { revenue: true, rooms: true },
        }),
        prisma.$queryRaw<{ total_nights: bigint }[]>(nightsSql)
            .catch(() => [{ total_nights: BigInt(0) }]),
        prisma.reservationsRaw.groupBy({
            by: ['company_name'],
            where: whereClause,
            _sum: { revenue: true },
            orderBy: { _sum: { revenue: 'desc' } },
            take: 3,
        }),
    ]);

    const result: CancellationStats = {
        count: agg._count,
        nights: Number(nightsResult[0]?.total_nights || 0),
        revenue: Number(agg._sum.revenue || 0),
        topChannels: topChannelsRaw.map(c => ({
            channel: c.company_name || 'Other',
            revenue: Number(c._sum.revenue || 0),
        })),
    };

    setCache(cancellationCache, cacheKey, result);
    return result;
}
