/**
 * GET/POST /api/subscription
 * Get or update hotel subscription
 * Resolves subscription via Organization (hotel → org → subscription)
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import prisma from '@/lib/prisma';
import { getEntitlements, invalidateEntitlementsCache } from '@/lib/plg/entitlements';
import { deriveBand, getBandMultiplier, getPrice } from '@/lib/plg/plan-config';
import { PlanTier, RoomBand } from '@prisma/client';

// GET: Get current hotel subscription info (resolves via org)
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

        // Use entitlements (already org-aware)
        const entitlements = await getEntitlements(hotelId);

        // Get hotel for capacity info
        const hotel = await prisma.hotel.findUnique({
            where: { hotel_id: hotelId },
            select: { capacity: true, org_id: true },
        });

        // Get usage counts
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const importsThisMonth = await prisma.importJob.count({
            where: {
                hotel_id: hotelId,
                created_at: { gte: startOfMonth },
            },
        });

        return NextResponse.json({
            plan: entitlements.plan,
            effectivePlan: entitlements.effectivePlan,
            status: entitlements.status,
            roomBand: entitlements.roomBand,
            orgId: entitlements.orgId,
            limits: entitlements.limits,
            features: entitlements.features,
            isTrialActive: entitlements.isTrialActive,
            isTrialExpired: entitlements.isTrialExpired,
            trialDaysRemaining: entitlements.trialDaysRemaining,
            hotelCapacity: hotel?.capacity ?? 0,
            derivedBand: hotel ? deriveBand(hotel.capacity) : 'R30',
            price: getPrice(entitlements.plan, entitlements.roomBand),
            usage: {
                importsThisMonth,
                exportsToday: 0,
            },
        });
    } catch (error) {
        console.error('[Subscription GET] Error:', error);
        return NextResponse.json({ error: 'Failed to get subscription' }, { status: 500 });
    }
}

// POST: Update subscription (Admin only) — resolves via org
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
        const {
            hotelId, plan, roomBand, capacitySnapshot,
            maxUsers, maxImportsMonth, maxExportsDay, maxExportRows,
            includedRateShopsMonth, dataRetentionMonths,
        } = body;

        if (!hotelId) {
            return NextResponse.json({ error: 'hotelId required' }, { status: 400 });
        }

        // Validate: STANDARD must be R30
        if (plan === 'STANDARD' && roomBand && roomBand !== 'R30') {
            return NextResponse.json(
                { error: 'STANDARD plan only supports R30 band' },
                { status: 400 },
            );
        }

        // Resolve org_id via hotel
        const hotel = await prisma.hotel.findUnique({
            where: { hotel_id: hotelId },
            select: { org_id: true, capacity: true },
        });

        const orgId = hotel?.org_id;
        const effectiveBand: RoomBand = roomBand ?? 'R30';
        const priceMultiplier = getBandMultiplier(effectiveBand);

        // Upsert: try via org_id first, fallback to hotel_id
        let subscription;
        if (orgId) {
            subscription = await prisma.subscription.upsert({
                where: { org_id: orgId },
                create: {
                    org_id: orgId,
                    hotel_id: hotelId,
                    plan: plan || 'STANDARD',
                    room_band: effectiveBand,
                    capacity_snapshot: capacitySnapshot ?? hotel?.capacity ?? 0,
                    price_multiplier: priceMultiplier,
                    max_users: maxUsers ?? 1,
                    max_imports_month: maxImportsMonth ?? 3,
                    max_exports_day: maxExportsDay ?? 1,
                    max_export_rows: maxExportRows ?? 30,
                    included_rate_shops_month: includedRateShopsMonth ?? 0,
                    data_retention_months: dataRetentionMonths ?? 6,
                },
                update: {
                    ...(plan && { plan: plan as PlanTier }),
                    ...(roomBand && { room_band: roomBand as RoomBand }),
                    ...(capacitySnapshot !== undefined && { capacity_snapshot: capacitySnapshot }),
                    ...(roomBand && { price_multiplier: priceMultiplier }),
                    ...(maxUsers !== undefined && { max_users: maxUsers }),
                    ...(maxImportsMonth !== undefined && { max_imports_month: maxImportsMonth }),
                    ...(maxExportsDay !== undefined && { max_exports_day: maxExportsDay }),
                    ...(maxExportRows !== undefined && { max_export_rows: maxExportRows }),
                    ...(includedRateShopsMonth !== undefined && { included_rate_shops_month: includedRateShopsMonth }),
                    ...(dataRetentionMonths !== undefined && { data_retention_months: dataRetentionMonths }),
                },
            });
        } else {
            // Fallback for pre-migration hotels
            subscription = await prisma.subscription.upsert({
                where: { hotel_id: hotelId },
                create: {
                    hotel_id: hotelId,
                    plan: plan || 'STANDARD',
                    room_band: effectiveBand,
                    capacity_snapshot: capacitySnapshot ?? hotel?.capacity ?? 0,
                    price_multiplier: priceMultiplier,
                    max_users: maxUsers ?? 1,
                    max_imports_month: maxImportsMonth ?? 3,
                    max_exports_day: maxExportsDay ?? 1,
                    max_export_rows: maxExportRows ?? 30,
                    included_rate_shops_month: includedRateShopsMonth ?? 0,
                    data_retention_months: dataRetentionMonths ?? 6,
                },
                update: {
                    ...(plan && { plan: plan as PlanTier }),
                    ...(roomBand && { room_band: roomBand as RoomBand }),
                    ...(capacitySnapshot !== undefined && { capacity_snapshot: capacitySnapshot }),
                    ...(roomBand && { price_multiplier: priceMultiplier }),
                    ...(maxUsers !== undefined && { max_users: maxUsers }),
                    ...(maxImportsMonth !== undefined && { max_imports_month: maxImportsMonth }),
                    ...(maxExportsDay !== undefined && { max_exports_day: maxExportsDay }),
                    ...(maxExportRows !== undefined && { max_export_rows: maxExportRows }),
                    ...(includedRateShopsMonth !== undefined && { included_rate_shops_month: includedRateShopsMonth }),
                    ...(dataRetentionMonths !== undefined && { data_retention_months: dataRetentionMonths }),
                },
            });
        }

        // Invalidate cache
        invalidateEntitlementsCache(hotelId);

        return NextResponse.json({
            success: true,
            subscription: {
                id: subscription.id,
                plan: subscription.plan,
                roomBand: subscription.room_band,
                priceMultiplier: subscription.price_multiplier,
                price: getPrice(subscription.plan, subscription.room_band),
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
