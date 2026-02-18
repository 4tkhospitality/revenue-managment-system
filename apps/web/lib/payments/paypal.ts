/**
 * PayPal Payment Gateway Helper
 * Handles OAuth, Orders (one-time), subscription management, and webhook verification
 *
 * Orders v2 API: https://developer.paypal.com/docs/api/orders/v2/
 * Docs: https://developer.paypal.com/api/rest/
 * GLC-02: Webhook signature verification must use raw body
 */

// ── Environment Variables ───────────────────────────────────────────

function getConfig() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    const apiUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    console.log(`[PayPal Config] clientId: ${clientId ? clientId.slice(0, 10) + '...' : 'MISSING'}`);
    console.log(`[PayPal Config] secret: ${secret ? '***SET***' : 'MISSING'}`);
    console.log(`[PayPal Config] apiUrl: ${apiUrl}`);
    console.log(`[PayPal Config] webhookId: ${webhookId || 'MISSING'}`);

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
        console.log('[PayPal OAuth] Using cached token (valid)');
        return cachedToken.token;
    }

    console.log('[PayPal OAuth] Requesting new token...');
    const { clientId, secret, apiUrl } = getConfig();
    const tokenUrl = `${apiUrl}/v1/oauth2/token`;
    console.log(`[PayPal OAuth] Token URL: ${tokenUrl}`);

    const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
        const errText = await res.text();
        console.error(`[PayPal OAuth] ❌ Failed: ${res.status}`, errText);
        throw new Error(`PayPal OAuth failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    cachedToken = {
        token: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
    };
    console.log(`[PayPal OAuth] ✅ Token obtained, expires in ${data.expires_in}s`);
    return cachedToken.token;
}

// ── Orders v2 API (One-Time Payment) ────────────────────────────────

export interface CreateOrderParams {
    orderId: string;
    amount: number;       // USD amount (e.g. 19.00)
    description: string;
    hotelId: string;
}

/**
 * Create a PayPal Order for one-time payment.
 * Returns the PayPal order ID and approval URL.
 */
export async function createPayPalOrder(params: CreateOrderParams): Promise<{
    paypalOrderId: string;
    approvalUrl: string;
}> {
    console.log('[PayPal createOrder] Starting...');
    const { apiUrl } = getConfig();
    const token = await getAccessToken();

    const returnUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/payment/success?provider=paypal`;
    const cancelUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/pricing-plans`;
    console.log(`[PayPal createOrder] return_url: ${returnUrl}`);
    console.log(`[PayPal createOrder] cancel_url: ${cancelUrl}`);

    const body = {
        intent: 'CAPTURE',
        purchase_units: [{
            reference_id: params.orderId,
            description: params.description,
            custom_id: params.hotelId,
            amount: {
                currency_code: 'USD',
                value: params.amount.toFixed(2),
            },
        }],
        application_context: {
            brand_name: '4TK Hospitality',
            landing_page: 'NO_PREFERENCE',
            user_action: 'PAY_NOW',
            return_url: returnUrl,
            cancel_url: cancelUrl,
        },
    };

    console.log(`[PayPal createOrder] Request body:`, JSON.stringify(body, null, 2));
    const orderUrl = `${apiUrl}/v2/checkout/orders`;
    console.log(`[PayPal createOrder] POST ${orderUrl}`);

    const res = await fetch(orderUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text();
        console.error(`[PayPal createOrder] ❌ Failed: ${res.status}`, errText);
        throw new Error(`PayPal createOrder failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    console.log(`[PayPal createOrder] ✅ Response:`, JSON.stringify(data, null, 2));
    const approvalLink = data.links?.find((l: { rel: string; href: string }) => l.rel === 'approve');

    return {
        paypalOrderId: data.id,
        approvalUrl: approvalLink?.href || '',
    };
}

/**
 * Capture a PayPal Order after user approval.
 * Returns the capture details including payer email.
 */
export async function capturePayPalOrder(paypalOrderId: string): Promise<{
    status: string;
    captureId: string;
    payerEmail: string;
    amount: number;
    currency: string;
}> {
    const { apiUrl } = getConfig();
    const token = await getAccessToken();

    const res = await fetch(`${apiUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`PayPal captureOrder failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

    return {
        status: data.status,
        captureId: capture?.id || paypalOrderId,
        payerEmail: data.payer?.email_address || '',
        amount: parseFloat(capture?.amount?.value || '0'),
        currency: capture?.amount?.currency_code || 'USD',
    };
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
