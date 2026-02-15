/**
 * SePay Payment Gateway Helper
 * Handles HMAC-SHA256 signature verification and checkout utilities
 *
 * Docs: https://my.sepay.vn/docs
 */

import crypto from 'crypto';

// ── Environment Variables ───────────────────────────────────────────
function getConfig() {
    const apiKey = process.env.SEPAY_API_KEY;
    const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET;
    const bankAccount = process.env.SEPAY_BANK_ACCOUNT;
    const bankName = process.env.SEPAY_BANK_NAME || 'MB';

    if (!apiKey || !webhookSecret) {
        throw new Error('Missing SEPAY_API_KEY or SEPAY_WEBHOOK_SECRET env vars');
    }

    return { apiKey, webhookSecret, bankAccount, bankName };
}

// ── Webhook Signature Verification ──────────────────────────────────
/**
 * Verify SePay webhook HMAC-SHA256 signature.
 * SePay sends signature in header, computed over raw body.
 */
export function verifySepaySignature(
    rawBody: string,
    signature: string
): boolean {
    const { webhookSecret } = getConfig();
    const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody, 'utf8')
        .digest('hex');
    return crypto.timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(signature, 'hex')
    );
}

// ── Parse SePay Webhook Payload ─────────────────────────────────────
export interface SepayWebhookPayload {
    id: number;                    // Unique transaction ID (use for dedup — GLC-03)
    gateway: string;               // e.g. 'MB'
    transactionDate: string;       // e.g. '2026-02-15 21:30:00'
    accountNumber: string;
    transferType: 'in' | 'out';
    transferAmount: number;        // VND integer
    accumulated: number;
    code: string | null;           // Custom code / memo
    content: string;               // Transfer description (contains order_id)
    referenceCode: string;
    description: string;
}

/**
 * Extract order_id from SePay webhook content.
 * We embed order_id in the transfer description when creating checkout.
 * Format: "RMS-XXXXXXXX-TIMESTAMP"
 */
export function extractOrderId(content: string): string | null {
    const match = content.match(/RMS-[A-Za-z0-9]{8}-\d+/);
    return match ? match[0] : null;
}

// ── Build SePay QR Payment URL ──────────────────────────────────────
/**
 * Build a SePay QR Banking URL for the customer.
 * The customer scans QR → transfers → SePay sends webhook.
 */
export function buildSepayCheckoutUrl(params: {
    orderId: string;
    amount: number;
    description?: string;
}): string {
    const { bankAccount, bankName } = getConfig();
    const desc = params.description || params.orderId;

    // SePay QR URL format (simplified — check SePay docs for exact format)
    // The bank QR standard includes: bank, account, amount, memo
    const qrUrl = new URL('https://qr.sepay.vn/img');
    qrUrl.searchParams.set('bank', bankName);
    qrUrl.searchParams.set('acc', bankAccount || '');
    qrUrl.searchParams.set('template', 'compact');
    qrUrl.searchParams.set('amount', String(params.amount));
    qrUrl.searchParams.set('des', desc);

    return qrUrl.toString();
}
