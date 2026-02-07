/**
 * Rate Shopper — Quota/Usage API Route
 *
 * GET /api/rate-shopper/usage
 * Returns current quota usage for the active hotel.
 */

import { NextResponse } from 'next/server';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import { checkTenantQuota, checkSystemBudget } from '@/lib/rate-shopper/quota-service';

export async function GET() {
    try {
        const hotelId = await getActiveHotelId();
        if (!hotelId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [tenant, system] = await Promise.all([
            checkTenantQuota(hotelId),
            checkSystemBudget(),
        ]);

        return NextResponse.json({
            data: {
                tenant: {
                    searches_used: tenant.searches_used,
                    quota_cap: tenant.quota_cap,
                    remaining: tenant.remaining,
                    allowed: tenant.allowed,
                },
                system: {
                    searches_used: system.searches_used,
                    budget_limit: system.budget_limit,
                    safe_mode_on: system.safe_mode_on,
                    allowed: system.allowed,
                },
            },
        });
    } catch (error) {
        console.error('[RateShopper][API] Usage error:', error);
        return NextResponse.json(
            { error: 'Failed to load usage' },
            { status: 500 },
        );
    }
}
