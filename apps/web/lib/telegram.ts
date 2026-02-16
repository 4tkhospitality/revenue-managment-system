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
        '👤 <b>User mới đăng ký!</b>',
        '',
        `📧 Email: <code>${email}</code>`,
        `👋 Tên: ${name || 'N/A'}`,
        `🕐 Thời gian: ${now}`,
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
        '💰 <b>Thanh toán thành công!</b>',
        '',
        `📧 User: <code>${params.email || 'N/A'}</code>`,
        `📦 Gói: <b>${params.tier}</b>`,
        `💵 Số tiền: <b>${amountStr}</b>`,
        `🏦 Cổng: ${params.gateway}`,
        `🔖 Mã đơn: <code>${params.orderId}</code>`,
        `✅ Xác nhận qua: ${params.confirmedVia}`,
        `🕐 Thời gian: ${now}`,
    ].join('\n');

    await sendTelegramMessage(msg);
}
