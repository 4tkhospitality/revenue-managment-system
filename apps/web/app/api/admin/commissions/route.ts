// Admin API – Commission + Payouts
// GET  /api/admin/commissions?resellerId=...  — ledger for reseller
// POST /api/admin/commissions/payout          — create payout run

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createPayoutRun, approvePayoutRun, markPayoutPaid, getResellerBalance } from '@/lib/reseller/commission';
import { audit } from '@/lib/shared/audit';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resellerId = req.nextUrl.searchParams.get('resellerId');
    if (!resellerId) return NextResponse.json({ error: 'resellerId required' }, { status: 400 });

    try {
        const [ledger, balance] = await Promise.all([
            prisma.commissionLedger.findMany({
                where: { reseller_id: resellerId },
                orderBy: { created_at: 'desc' },
                take: 100,
            }),
            getResellerBalance(resellerId),
        ]);

        return NextResponse.json({ ledger, unpaidBalance: balance });
    } catch (error) {
        console.error('[Admin Commissions] GET error:', error);
        return NextResponse.json({ ledger: [], unpaidBalance: 0 }, { status: 200 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, payoutRunId, period } = body;

    if (action === 'create_payout') {
        const run = await createPayoutRun(period);
        if (!run) return NextResponse.json({ error: 'No unpaid commissions' }, { status: 400 });

        await audit('PAYOUT_APPROVED', {
            actorId: session.user.id,
            entityType: 'payout_run',
            entityId: run.id,
            metadata: { period, itemCount: run.items.length },
        });

        return NextResponse.json(run, { status: 201 });
    }

    if (action === 'approve') {
        const run = await approvePayoutRun(payoutRunId, session.user.id);
        await audit('PAYOUT_APPROVED', {
            actorId: session.user.id,
            entityType: 'payout_run',
            entityId: payoutRunId,
        });
        return NextResponse.json(run);
    }

    if (action === 'mark_paid') {
        await markPayoutPaid(payoutRunId);
        await audit('PAYOUT_PAID', {
            actorId: session.user.id,
            entityType: 'payout_run',
            entityId: payoutRunId,
        });
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
