/**
 * PayPal Payment Gateway Helper
 * Handles OAuth, subscription management, and webhook verification
 *
 * Docs: https://developer.paypal.com/api/rest/
 * GLC-02: Webhook signature verification must use raw body
 */

// ── Environment Variables ───────────────────────────────────────────

function getConfig() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    const apiUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    if (!clientId || !secret) {
        throw new Error('Missing PAYPAL_CLIENT_ID or PAYPAL_SECRET env vars');
    }

    return { clientId, secret, apiUrl, webhookId };
}

// ── OAuth Token ─────────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
        return cachedToken.token;
    }

    const { clientId, secret, apiUrl } = getConfig();
    const res = await fetch(`${apiUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
        throw new Error(`PayPal OAuth failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    cachedToken = {
        token: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
    };
    return cachedToken.token;
}

// ── Subscription Details ────────────────────────────────────────────

export interface PayPalSubscriptionDetails {
    id: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED' | 'APPROVAL_PENDING';
    plan_id: string;
    subscriber: {
        email_address: string;
        name?: { given_name?: string; surname?: string };
    };
    billing_info: {
        next_billing_time?: string; // ISO 8601
        last_payment?: {
            amount: { value: string; currency_code: string };
            time: string;
        };
    };
    create_time: string;
    update_time: string;
}

/**
 * Re-fetch subscription details from PayPal API.
 * GLC-05: Called OUTSIDE Prisma $transaction(), never inside.
 * P1: Always re-fetch — don't trust webhook payload alone.
 */
export async function getSubscriptionDetails(
    subscriptionId: string
): Promise<PayPalSubscriptionDetails> {
    const { apiUrl } = getConfig();
    const token = await getAccessToken();

    const res = await fetch(`${apiUrl}/v1/billing/subscriptions/${subscriptionId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) {
        throw new Error(`PayPal getSubscription failed: ${res.status} ${await res.text()}`);
    }

    return res.json();
}

// ── Webhook Signature Verification ──────────────────────────────────
/**
 * Verify PayPal webhook signature using PayPal's verify endpoint.
 * GLC-02: Uses raw body (not parsed/re-stringified).
 *
 * Required headers: paypal-transmission-id, paypal-transmission-sig,
 * paypal-transmission-time, paypal-cert-url, paypal-auth-algo
 */
export async function verifyWebhookSignature(params: {
    rawBody: string;
    headers: {
        'paypal-transmission-id': string | null;
        'paypal-transmission-sig': string | null;
        'paypal-transmission-time': string | null;
        'paypal-cert-url': string | null;
        'paypal-auth-algo': string | null;
    };
}): Promise<boolean> {
    const { apiUrl, webhookId } = getConfig();
    if (!webhookId) {
        console.error('[PayPal] PAYPAL_WEBHOOK_ID not configured');
        return false;
    }

    const token = await getAccessToken();

    const verifyBody = {
        auth_algo: params.headers['paypal-auth-algo'],
        cert_url: params.headers['paypal-cert-url'],
        transmission_id: params.headers['paypal-transmission-id'],
        transmission_sig: params.headers['paypal-transmission-sig'],
        transmission_time: params.headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: JSON.parse(params.rawBody),
    };

    const res = await fetch(`${apiUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(verifyBody),
    });

    if (!res.ok) {
        console.error('[PayPal] Webhook verify failed:', res.status, await res.text());
        return false;
    }

    const result = await res.json();
    return result.verification_status === 'SUCCESS';
}

// ── Cancel Subscription ─────────────────────────────────────────────

export async function cancelSubscription(
    subscriptionId: string,
    reason: string = 'User requested downgrade'
): Promise<void> {
    const { apiUrl } = getConfig();
    const token = await getAccessToken();

    const res = await fetch(`${apiUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
    });

    if (!res.ok && res.status !== 404) {
        throw new Error(`PayPal cancelSubscription failed: ${res.status}`);
    }
}
