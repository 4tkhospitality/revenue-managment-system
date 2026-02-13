// ════════════════════════════════════════════════════════════════════
// PLG — Usage Service
// Inline atomic increment for quota-critical events
// ════════════════════════════════════════════════════════════════════

import prisma from '@/lib/prisma';

// ── Monthly Usage (imports, playbook_views) ─────────────────────────

/**
 * Atomically increment a monthly usage counter.
 * Creates UsageMonthly row if it doesn't exist (upsert).
 */
export async function incrementMonthlyUsage(
    hotelId: string,
    field: 'imports' | 'playbook_views',
): Promise<void> {
    const now = new Date();
    const month = new Date(now.getFullYear(), now.getMonth(), 1);

    await prisma.usageMonthly.upsert({
        where: { hotel_id_month: { hotel_id: hotelId, month } },
        create: { hotel_id: hotelId, month, [field]: 1 },
        update: { [field]: { increment: 1 } },
    });
}

// ── Daily Usage (exports) ───────────────────────────────────────────

/**
 * Atomically increment a daily usage counter.
 * Creates UsageDaily row if it doesn't exist (upsert).
 */
export async function incrementDailyUsage(
    hotelId: string,
    field: 'exports',
): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.usageDaily.upsert({
        where: { hotel_id_date: { hotel_id: hotelId, date: today } },
        create: { hotel_id: hotelId, date: today, [field]: 1 },
        update: { [field]: { increment: 1 } },
    });
}

// ── Read Usage ──────────────────────────────────────────────────────

export async function getMonthlyUsage(hotelId: string) {
    const now = new Date();
    const month = new Date(now.getFullYear(), now.getMonth(), 1);
    return prisma.usageMonthly.findUnique({
        where: { hotel_id_month: { hotel_id: hotelId, month } },
    });
}

export async function getDailyUsage(hotelId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return prisma.usageDaily.findUnique({
        where: { hotel_id_date: { hotel_id: hotelId, date: today } },
    });
}

/**
 * Check if usage is near the limit (≥ 80%).
 */
export function isNearLimit(used: number, limit: number): boolean {
    if (limit <= 0) return false; // unlimited
    return used / limit >= 0.8;
}
