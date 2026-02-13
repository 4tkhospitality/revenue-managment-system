// POST /api/promo/validate — Validate promo code without redeeming
// POST /api/promo/redeem   — Redeem promo code for current hotel

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { validateCode, redeemCode } from '@/lib/promo/promo';
import { audit } from '@/lib/shared/audit';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, code, hotelId } = body;

        if (!code || !hotelId) {
            return NextResponse.json({ error: 'code and hotelId required' }, { status: 400 });
        }

        if (action === 'validate') {
            const result = await validateCode(code);
            return NextResponse.json(result);
        }

        if (action === 'redeem') {
            const result = await redeemCode(code, hotelId);

            await audit('PROMO_REDEEMED', {
                actorId: session.user.id,
                entityType: 'promo_code',
                hotelId,
                metadata: { code, ...result },
            });

            return NextResponse.json(result);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        console.error('[API] /promo error:', message);
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
