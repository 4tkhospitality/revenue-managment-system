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
 *
 * IMPORTANT: Banks (VCB, MB, etc.) strip dashes AND special chars from transfer descriptions!
 * "RMS-4dafcc39-1771249328427" → "RMS4dafcc39b1771249328427" (if UUID contains 'b')
 * The stripped version is ambiguous, so we extract the full blob and compare by stripping.
 */
export function extractOrderId(content: string): string | null {
    // Try with dashes first (ideal format — when content is preserved)
    const withDashes = content.match(/RMS-[A-Za-z0-9]{8}-\d+/);
    if (withDashes) return withDashes[0];

    // Banks strip dashes — extract the full RMS blob (at least 20 chars to avoid false matches)
    const blob = content.match(/RMS[A-Za-z0-9]{18,}/);
    if (blob) return blob[0]; // Return raw blob, will be matched using matchesOrderId()

    return null;
}

/**
 * Compare an extracted (possibly stripped) order ID with a canonical one from DB.
 * Strips all non-alphanumeric chars from both before comparing.
 */
export function matchesOrderId(extracted: string, canonical: string): boolean {
    const strip = (s: string) => s.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return strip(extracted) === strip(canonical);
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
