// GET /api/entitlements — Returns entitlements for current hotel
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getEntitlements } from '@/lib/plg/entitlements';
import { getQuotaInfo } from '@/lib/plg/guard';
import { getTrialProgress } from '@/lib/plg/trial';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const hotelId = req.nextUrl.searchParams.get('hotelId');
        if (!hotelId) {
            return NextResponse.json({ error: 'hotelId required' }, { status: 400 });
        }

        const entitlements = await getEntitlements(hotelId);

        // Get quota info for all keys
        const [importsQuota, exportsQuota, usersQuota] = await Promise.all([
            getQuotaInfo(hotelId, 'imports'),
            getQuotaInfo(hotelId, 'exports'),
            getQuotaInfo(hotelId, 'users'),
        ]);

        // Get trial progress if in trial
        let trialProgress = null;
        if (entitlements.isTrialActive) {
            trialProgress = await getTrialProgress(hotelId);
        }

        return NextResponse.json({
            ...entitlements,
            quotas: {
                imports: importsQuota,
                exports: exportsQuota,
                users: usersQuota,
            },
            trialProgress,
        });
    } catch (error) {
        console.error('[API] /entitlements error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
