/**
 * Telegram Bot Notification Utility
 *
 * Sends notifications to a Telegram chat via Bot API.
 * Used for: new user registration, payment confirmation.
 *
 * Bot: @ngocphan99_bot
 * Chat ID: 6555711409
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8359818296:AAEH3397pYvjhnWNZyRuNA1QEYE4E5LVJcA';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6555711409';

/**
 * Send a message to the configured Telegram chat.
 * Fire-and-forget — never throws, just logs errors.
 */
export async function sendTelegramMessage(text: string): Promise<void> {
    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text,
                parse_mode: 'HTML',
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error('[Telegram] Failed to send message:', res.status, err);
        }
    } catch (error) {
        console.error('[Telegram] Error sending message:', error);
    }
}

// ── Pre-built notification messages ─────────────────────────────────

/**
 * Notify when a new user registers (first Google login)
 */
export async function notifyNewUser(email: string, name: string | null): Promise<void> {
    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const msg = [
        '👤 <b>New user signed up!</b>',
        '',
        `📧 Email: <code>${email}</code>`,
        `👋 Name: ${name || 'N/A'}`,
        `🕐 Time: ${now}`,
    ].join('\n');

    await sendTelegramMessage(msg);
}

/**
 * Notify when a payment is confirmed
 */
export async function notifyPaymentConfirmed(params: {
    email?: string;
    orderId: string;
    amount: number;
    currency: string;
    tier: string;
    gateway: string;
    confirmedVia: string;
}): Promise<void> {
    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const amountStr = params.currency === 'VND'
        ? `${params.amount.toLocaleString('vi-VN')}₫`
        : `$${params.amount.toFixed(2)}`;

    const msg = [
        '💰 <b>Payment successful!</b>',
        '',
        `📧 User: <code>${params.email || 'N/A'}</code>`,
        `📦 Plan: <b>${params.tier}</b>`,
        `💵 Amount: <b>${amountStr}</b>`,
        `🏦 Gateway: ${params.gateway}`,
        `🔖 Order: <code>${params.orderId}</code>`,
        `✅ Confirmed via: ${params.confirmedVia}`,
        `🕐 Time: ${now}`,
    ].join('\n');

    await sendTelegramMessage(msg);
}

/**
 * Notify when any user logs in (new or returning)
 */
export async function notifyUserLogin(params: {
    email: string;
    name: string | null;
    isNew: boolean;
    hotels?: string[];
    country?: string | null;
}): Promise<void> {
    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const icon = params.isNew ? '🆕' : '🔑';
    const label = params.isNew ? 'NEW user login' : 'User login';
    const hotelList = params.hotels?.length
        ? params.hotels.join(', ')
        : 'No hotel yet';

    // Country display (flag + name or 'Unknown')
    let countryDisplay = 'Unknown';
    if (params.country) {
        try {
            const { getCountryDisplay } = await import('@/lib/constants/countries');
            countryDisplay = getCountryDisplay(params.country);
        } catch {
            countryDisplay = params.country;
        }
    }

    const msg = [
        `${icon} <b>${label}</b>`,
        '',
        `📧 Email: <code>${params.email}</code>`,
        `👋 Name: ${params.name || 'N/A'}`,
        `🌍 Country: ${countryDisplay}`,
        `🏨 Hotels: ${hotelList}`,
        `🕐 ${now}`,
    ].join('\n');

    await sendTelegramMessage(msg);
}
