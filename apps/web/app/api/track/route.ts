/**
 * PLG Event Tracking API Route
 *
 * POST /api/track
 * Body: { event, userId?, hotelId?, properties? }
 *
 * Client-side fires events here; server logs them.
 */

import { NextResponse } from 'next/server';
import { trackEvent } from '@/lib/payments/trackEvent';
import type { TrackEventPayload } from '@/lib/payments/trackEvent';

export async function POST(req: Request) {
    try {
        const body: TrackEventPayload = await req.json();

        if (!body.event) {
            return NextResponse.json({ error: 'Missing event name' }, { status: 400 });
        }

        trackEvent(body);
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
}
