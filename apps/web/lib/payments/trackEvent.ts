/**
 * PLG Event Tracking for Payment Funnel
 *
 * Events: pricing_viewed, upgrade_clicked, payment_method_selected,
 *         payment_success, payment_failed, zalo_clicked
 *
 * Server-side: logs to console + stores in DB (future: analytics service)
 * Client-side: call via fetch('/api/track', { body: ... })
 */

export type PaymentEvent =
    | 'pricing_viewed'
    | 'upgrade_clicked'
    | 'payment_method_selected'
    | 'payment_success'
    | 'payment_failed'
    | 'zalo_clicked';

export interface TrackEventPayload {
    event: PaymentEvent;
    userId?: string;
    hotelId?: string;
    properties?: Record<string, unknown>;
}

/**
 * Track a PLG payment funnel event.
 * Server-side: call directly.
 * Client-side: use trackEventClient() which calls the API route.
 */
export function trackEvent(payload: TrackEventPayload): void {
    // Log to console (structured for log aggregation)
    console.log(
        JSON.stringify({
            type: 'plg_event',
            event: payload.event,
            userId: payload.userId || 'anonymous',
            hotelId: payload.hotelId || null,
            properties: payload.properties || {},
            timestamp: new Date().toISOString(),
        })
    );

    // Future: send to analytics service (Mixpanel, PostHog, etc.)
    // Future: store in DB for self-serve analytics
}

/**
 * Client-side event tracker.
 * Calls /api/track endpoint via fetch (fire-and-forget).
 */
export function trackEventClient(payload: TrackEventPayload): void {
    if (typeof window === 'undefined') return;

    fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true, // Ensure request completes even on page navigation
    }).catch(() => {
        // Silently fail — tracking should never block UX
    });
}
