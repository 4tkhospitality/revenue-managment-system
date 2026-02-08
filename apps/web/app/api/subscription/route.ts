/**
 * GET/POST /api/subscription
 * Get or update hotel subscription (Admin only for POST)
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import { getHotelSubscription } from '@/lib/tier/checkFeature';
import prisma from '@/lib/prisma';

// GET: Get current hotel subscription info
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get hotelId from query or active hotel
        const url = new URL(request.url);
        const queryHotelId = url.searchParams.get('hotelId');
        const hotelId = queryHotelId || (await getActiveHotelId());

        if (!hotelId) {
            return NextResponse.json({ error: 'No hotel selected' }, { status: 400 });
        }

        const subscription = await getHotelSubscription(hotelId);

        // Get usage counts
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Count imports this month
        const importsThisMonth = await prisma.importJob.count({
            where: {
                hotel_id: hotelId,
                created_at: { gte: startOfMonth },
            },
        });

        // Count exports today (approximated by recent activity)
        const exportsToday = 0; // TODO: Implement export tracking

        return NextResponse.json({
            ...subscription,
            usage: {
                importsThisMonth,
                exportsToday,
            },
        });
    } catch (error) {
        console.error('[Subscription GET] Error:', error);
        return NextResponse.json({ error: 'Failed to get subscription' }, { status: 500 });
    }
}

// POST: Update subscription (Admin only)
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (!user || !['super_admin', 'hotel_admin'].includes(user.role)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { hotelId, plan, maxUsers, maxImportsMonth, maxExportsDay, maxExportRows, includedRateShopsMonth, dataRetentionMonths } = body;

        if (!hotelId) {
            return NextResponse.json({ error: 'hotelId required' }, { status: 400 });
        }

        // Upsert subscription
        const subscription = await prisma.subscription.upsert({
            where: { hotel_id: hotelId },
            create: {
                hotel_id: hotelId,
                plan: plan || 'FREE',
                max_users: maxUsers ?? 1,
                max_imports_month: maxImportsMonth ?? 3,
                max_exports_day: maxExportsDay ?? 1,
                max_export_rows: maxExportRows ?? 30,
                included_rate_shops_month: includedRateShopsMonth ?? 0,
                data_retention_months: dataRetentionMonths ?? 6,
            },
            update: {
                ...(plan && { plan }),
                ...(maxUsers !== undefined && { max_users: maxUsers }),
                ...(maxImportsMonth !== undefined && { max_imports_month: maxImportsMonth }),
                ...(maxExportsDay !== undefined && { max_exports_day: maxExportsDay }),
                ...(maxExportRows !== undefined && { max_export_rows: maxExportRows }),
                ...(includedRateShopsMonth !== undefined && { included_rate_shops_month: includedRateShopsMonth }),
                ...(dataRetentionMonths !== undefined && { data_retention_months: dataRetentionMonths }),
            },
        });

        return NextResponse.json({
            success: true,
            subscription: {
                id: subscription.id,
                plan: subscription.plan,
                maxUsers: subscription.max_users,
                maxImportsMonth: subscription.max_imports_month,
                maxExportsDay: subscription.max_exports_day,
                maxExportRows: subscription.max_export_rows,
                includedRateShopsMonth: subscription.included_rate_shops_month,
                dataRetentionMonths: subscription.data_retention_months,
            },
        });
    } catch (error) {
        console.error('[Subscription POST] Error:', error);
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }
}
