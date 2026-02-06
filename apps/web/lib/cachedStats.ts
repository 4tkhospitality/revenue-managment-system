// Cached data stats with revalidation on upload
import prisma from './prisma';

// Simple in-memory cache
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
}

// Invalidate cache when new data is uploaded
export function invalidateStatsCache(): void {
    cache.clear();
    console.log('[Cache] Stats cache invalidated');
}

// Reservation stats: based on last 30 DAYS (not 30 records)
export async function getReservationStats30() {
    const cacheKey = 'reservation_stats_30_days';
    const cached = getCached<{
        count: number;
        rooms: number;
        revenue: number;
        topAgents: { company_name: string | null; revenue: number }[];
    }>(cacheKey);

    if (cached) {
        console.log('[Cache] Hit reservation_stats_30_days');
        return cached;
    }

    console.log('[Cache] Miss reservation_stats_30_days, querying...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get reservations from last 30 days
    const recent = await prisma.reservationsRaw.findMany({
        where: {
            status: 'booked',
            booking_date: { gte: thirtyDaysAgo }
        },
        select: {
            rooms: true,
            revenue: true,
            company_name: true,
        }
    });

    const count = recent.length;
    const rooms = recent.reduce((sum, r) => sum + r.rooms, 0);
    const revenue = recent.reduce((sum, r) => sum + Number(r.revenue), 0);

    // Group by company_name for top 3 agents
    const agentMap = new Map<string, number>();
    for (const r of recent) {
        const agent = r.company_name || 'Khác';
        agentMap.set(agent, (agentMap.get(agent) || 0) + Number(r.revenue));
    }

    const topAgents = Array.from(agentMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([company_name, revenue]) => ({ company_name, revenue }));

    const result = { count, rooms, revenue, topAgents };
    setCache(cacheKey, result);
    return result;
}

// Cancellation stats: ALL data (not just 30 days since data may be from older months)
export async function getCancellationStats30Days() {
    const cacheKey = 'cancellation_stats_all';
    const cached = getCached<{
        count: number;
        nights: number;
        revenue: number;
        topChannels: { channel: string | null; revenue: number }[];
    }>(cacheKey);

    if (cached) {
        console.log('[Cache] Hit cancellation_stats_all');
        return cached;
    }

    console.log('[Cache] Miss cancellation_stats_all, querying...');

    // Get ALL cancellations for summary stats
    const allCancellations = await prisma.cancellationRaw.findMany({
        select: {
            nights: true,
            total_revenue: true,
            channel: true,
        }
    });

    const count = allCancellations.length;
    const nights = allCancellations.reduce((sum, c) => sum + (c.nights || 0), 0);
    const revenue = allCancellations.reduce((sum, c) => sum + Number(c.total_revenue || 0), 0);

    // Group by channel for top 3
    const channelMap = new Map<string, number>();
    for (const c of allCancellations) {
        const ch = c.channel || 'Khác';
        channelMap.set(ch, (channelMap.get(ch) || 0) + Number(c.total_revenue || 0));
    }

    const topChannels = Array.from(channelMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([channel, revenue]) => ({ channel, revenue }));

    const result = { count, nights, revenue, topChannels };
    setCache(cacheKey, result);
    return result;
}
