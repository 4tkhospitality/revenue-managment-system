/**
 * Rate Shopper — Competitor Delete API Route
 *
 * DELETE /api/rate-shopper/competitors/[id]
 * Soft-deletes a competitor by setting is_active=false.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import { auth } from '@/lib/auth';
import { removeCompetitor } from '@/lib/rate-shopper/actions/competitor-management';

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        // Auth + role check: deleting competitors requires manager+
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const role = session.user.role || 'viewer';
        if (!session.user.isAdmin && !['manager', 'hotel_admin'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden — Manager role required' }, { status: 403 });
        }

        const hotelId = await getActiveHotelId();
        if (!hotelId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await removeCompetitor(hotelId, id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[RateShopper][API] Delete competitor error:', error);
        return NextResponse.json(
            { error: 'Failed to remove competitor' },
            { status: 500 },
        );
    }
}
