/**
 * Payment Status Check — API Route
 *
 * GET /api/payments/status?orderId=RMS-XXXXXXXX-TIMESTAMP
 *
 * Used by frontend polling to detect when SePay/PayPal payment is completed.
 * Returns current status of the payment transaction.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orderId = req.nextUrl.searchParams.get('orderId');
        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        const tx = await prisma.paymentTransaction.findFirst({
            where: {
                order_id: orderId,
                user_id: session.user.id,
            },
            select: {
                status: true,
                completed_at: true,
                failed_at: true,
                failed_reason: true,
                purchased_tier: true,
            },
            orderBy: { created_at: 'desc' },
        });

        if (!tx) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({
            status: tx.status,
            completedAt: tx.completed_at,
            failedAt: tx.failed_at,
            failedReason: tx.failed_reason,
            tier: tx.purchased_tier,
        });
    } catch (err) {
        console.error('[Payment Status] Error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
