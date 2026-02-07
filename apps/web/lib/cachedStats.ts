// Data stats - always fresh (no cache to avoid stale data issues)
import prisma from './prisma';

// Keep this export for backward compatibility (called by ingest actions)
export function invalidateStatsCache(): void {
    // No-op: cache removed, stats are always fresh
}

// Reservation stats: ALL booked reservations
export async function getReservationStats30() {
    const recent = await prisma.reservationsRaw.findMany({
        where: {
            status: 'booked',
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

    return { count, rooms, revenue, topAgents };
}

// Cancellation stats: ALL data
export async function getCancellationStats30Days() {
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

    return { count, nights, revenue, topChannels };
}
