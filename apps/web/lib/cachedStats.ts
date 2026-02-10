// Data stats - filtered by hotel, with in-memory cache
import prisma from './prisma';

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

// ─── Reservation stats: SQL aggregate + hotel filter ─
export async function getReservationStats30(hotelId?: string): Promise<ReservationStats> {
    const cacheKey = hotelId || '__all__';
    const cached = getCached(reservationCache, cacheKey);
    if (cached) return cached;

    const whereClause = hotelId
        ? { hotel_id: hotelId, status: 'booked' as const }
        : { status: 'booked' as const };

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
            company_name: a.company_name || 'Khác',
            revenue: Number(a._sum.revenue || 0),
        })),
    };

    setCache(reservationCache, cacheKey, result);
    return result;
}

// ─── Cancellation stats: SQL aggregate + hotel filter ─
export async function getCancellationStats30Days(hotelId?: string): Promise<CancellationStats> {
    const cacheKey = hotelId || '__all__';
    const cached = getCached(cancellationCache, cacheKey);
    if (cached) return cached;

    const whereClause = hotelId ? { hotel_id: hotelId } : {};

    // Parallel: aggregate + groupBy instead of findMany + JS reduce
    const [agg, topChannelsRaw] = await Promise.all([
        prisma.cancellationRaw.aggregate({
            where: whereClause,
            _count: true,
            _sum: { nights: true, total_revenue: true },
        }),
        prisma.cancellationRaw.groupBy({
            by: ['channel'],
            where: whereClause,
            _sum: { total_revenue: true },
            orderBy: { _sum: { total_revenue: 'desc' } },
            take: 3,
        }),
    ]);

    const result: CancellationStats = {
        count: agg._count,
        nights: agg._sum.nights || 0,
        revenue: Number(agg._sum.total_revenue || 0),
        topChannels: topChannelsRaw.map(c => ({
            channel: c.channel || 'Khác',
            revenue: Number(c._sum.total_revenue || 0),
        })),
    };

    setCache(cancellationCache, cacheKey, result);
    return result;
}
