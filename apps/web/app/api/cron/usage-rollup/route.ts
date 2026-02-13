// ════════════════════════════════════════════════════════════════════
// Cron — Usage Rollup Reconciliation
// Runs on schedule to ensure counters are accurate
// ════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
    // Auth: only allow with CRON_SECRET header
    const authHeader = req.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const month = new Date(now.getFullYear(), now.getMonth(), 1);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Count actual imports per hotel for this month
        const importCounts = await prisma.importJob.groupBy({
            by: ['hotel_id'],
            where: {
                status: 'completed',
                created_at: { gte: month },
            },
            _count: { _all: true },
        });

        let reconciled = 0;

        for (const ic of importCounts) {
            await prisma.usageMonthly.upsert({
                where: {
                    hotel_id_month: {
                        hotel_id: ic.hotel_id,
                        month,
                    },
                },
                update: { imports: ic._count._all },
                create: {
                    hotel_id: ic.hotel_id,
                    month,
                    imports: ic._count._all,
                },
            });
            reconciled++;
        }

        // Count exports per hotel today
        const exportCounts = await prisma.productEvent.groupBy({
            by: ['hotel_id'],
            where: {
                event_type: 'EXPORT',
                hotel_id: { not: null },
                created_at: { gte: today },
            },
            _count: { _all: true },
        });

        for (const ec of exportCounts) {
            if (!ec.hotel_id) continue; // guard for nullable type
            await prisma.usageDaily.upsert({
                where: {
                    hotel_id_date: {
                        hotel_id: ec.hotel_id,
                        date: today,
                    },
                },
                update: { exports: ec._count._all },
                create: {
                    hotel_id: ec.hotel_id,
                    date: today,
                    exports: ec._count._all,
                },
            });
            reconciled++;
        }

        return NextResponse.json({
            success: true,
            reconciled,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error('[Cron] Usage rollup error:', error);
        return NextResponse.json({ error: 'Rollup failed' }, { status: 500 });
    }
}
