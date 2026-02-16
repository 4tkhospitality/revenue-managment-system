/**
 * GET /api/payments/pending-activation
 *
 * Check if current user has a COMPLETED payment without a hotel (orphan payment).
 * This is used to detect users who paid but didn't complete hotel onboarding.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await auth();
        console.log(`[PendingActivation] Session: ${session?.user?.email || 'NO SESSION'}`);
        if (!session?.user) {
            console.log(`[PendingActivation] ❌ No session → 401`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = (session.user as { id: string }).id;
        console.log(`[PendingActivation] 🔍 Checking orphan payments for userId=${userId}, email=${session.user.email}`);

        // Find COMPLETED payment with no hotel_id (orphan payment from pay-first flow)
        const orphanPayment = await prisma.paymentTransaction.findFirst({
            where: {
                user_id: userId,
                hotel_id: null,
                status: 'COMPLETED',
            },
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                purchased_tier: true,
                purchased_room_band: true,
                billing_cycle: true,
                term_months: true,
                amount: true,
                currency: true,
                gateway: true,
                completed_at: true,
            },
        });

        if (!orphanPayment) {
            console.log(`[PendingActivation] ⚠️ NO orphan payment found → hasPendingActivation=false`);
            // Also check: does the user have ANY payment at all?
            const anyPayment = await prisma.paymentTransaction.findFirst({
                where: { user_id: userId },
                select: { id: true, status: true, hotel_id: true },
            });
            if (anyPayment) {
                console.log(`[PendingActivation] 📋 User HAS payment but: status=${anyPayment.status}, hotel_id=${anyPayment.hotel_id}`);
            } else {
                console.log(`[PendingActivation] 📋 User has NO payments at all`);
            }
            return NextResponse.json({ hasPendingActivation: false });
        }

        console.log(`[PendingActivation] ✅ FOUND orphan payment: id=${orphanPayment.id}, tier=${orphanPayment.purchased_tier}, amount=${orphanPayment.amount}`);

        return NextResponse.json({
            hasPendingActivation: true,
            transaction: {
                id: orphanPayment.id,
                tier: orphanPayment.purchased_tier,
                roomBand: orphanPayment.purchased_room_band,
                billingCycle: orphanPayment.billing_cycle,
                termMonths: orphanPayment.term_months,
                amount: Number(orphanPayment.amount),
                currency: orphanPayment.currency,
                gateway: orphanPayment.gateway,
                completedAt: orphanPayment.completed_at,
            },
        });
    } catch (error) {
        console.error('[API] pending-activation check error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
