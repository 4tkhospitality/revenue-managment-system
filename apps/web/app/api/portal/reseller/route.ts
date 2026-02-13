// Reseller Portal API — Token-based access
// GET  /api/portal/reseller?token=...  — validate + get dashboard
// GET  /api/portal/reseller/payouts?resellerId=...  — payout history

import { NextRequest, NextResponse } from 'next/server';
import { validatePortalToken, getPortalDashboard, getPayoutHistory } from '@/lib/reseller/portal';

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');
    const action = req.nextUrl.searchParams.get('action') ?? 'dashboard';
    const resellerId = req.nextUrl.searchParams.get('resellerId');

    // Token-based auth
    if (token) {
        const result = await validatePortalToken(token);
        if (!result) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        if (action === 'dashboard') {
            const dashboard = await getPortalDashboard(result.resellerId);
            return NextResponse.json(dashboard);
        }

        if (action === 'payouts') {
            const payouts = await getPayoutHistory(result.resellerId);
            return NextResponse.json(payouts);
        }
    }

    // Direct resellerId access (admin use)
    if (resellerId) {
        if (action === 'payouts') {
            const payouts = await getPayoutHistory(resellerId);
            return NextResponse.json(payouts);
        }

        const dashboard = await getPortalDashboard(resellerId);
        return NextResponse.json(dashboard);
    }

    return NextResponse.json({ error: 'token or resellerId required' }, { status: 400 });
}
