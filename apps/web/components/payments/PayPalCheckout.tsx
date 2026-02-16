'use client';

/**
 * PayPal Checkout Component — Dual Mode
 * 
 * mode = 'subscription' → Uses PayPal Plan IDs (existing flow)
 * mode = 'one-time'     → Uses PayPal Orders v2 API (dynamic pricing)
 */

import { useState } from 'react';
import { PlanTier, RoomBand } from '@prisma/client';
import { trackEventClient } from '@/lib/payments/trackEvent';
import { Loader2, ExternalLink } from 'lucide-react';

type PayPalMode = 'subscription' | 'one-time';
type BillingCycle = 'monthly' | '3-months';

interface PayPalCheckoutProps {
    hotelId: string;
    tier: PlanTier;
    roomBand: RoomBand;
    mode: PayPalMode;
    billingCycle?: BillingCycle;
    planId?: string; // Only needed for subscription mode
    onSuccess: (id: string) => void;
    onError: (error: string) => void;
}

export function PayPalCheckout({
    hotelId,
    tier,
    roomBand,
    mode,
    billingCycle = 'monthly',
    planId,
    onSuccess,
    onError,
}: PayPalCheckoutProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── One-Time Payment Flow ───────────────────────────────────────
    const handleOneTimePayment = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/payments/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hotelId, tier, roomBand, billingCycle }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            trackEventClient({
                event: 'payment_method_selected',
                properties: { method: 'PAYPAL', mode: 'one-time', tier, roomBand },
            });

            // Redirect to PayPal approval page
            if (data.approvalUrl) {
                window.location.href = data.approvalUrl;
            } else {
                throw new Error('Không nhận được link thanh toán từ PayPal');
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
            setError(msg);
            onError(msg);
            setLoading(false);
        }
    };

    // ── Subscription Flow (existing) ────────────────────────────────
    const handleSubscription = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!planId) {
                throw new Error('PayPal Plan ID chưa được cấu hình. Vui lòng liên hệ admin.');
            }

            trackEventClient({
                event: 'payment_method_selected',
                properties: { method: 'PAYPAL', mode: 'subscription', tier, roomBand },
            });

            // For subscription: redirect to PayPal with plan_id
            // This would normally use the PayPal JS SDK, but for now we show instructions
            setError(
                'PayPal subscription integration đang được hoàn thiện. ' +
                'Vui lòng liên hệ admin hoặc sử dụng chế độ thanh toán 1 lần.'
            );
            setLoading(false);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
            setError(msg);
            onError(msg);
            setLoading(false);
        }
    };

    const handleClick = mode === 'one-time' ? handleOneTimePayment : handleSubscription;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">
                    {mode === 'one-time' ? 'Đang tạo đơn PayPal...' : 'Đang kết nối PayPal...'}
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                {mode === 'one-time'
                    ? '💳 Thanh toán 1 lần qua PayPal. Bạn sẽ được chuyển đến PayPal để xác nhận.'
                    : '🔄 Đăng ký thanh toán tự động hàng tháng qua PayPal.'}
            </div>

            <button
                onClick={handleClick}
                className="w-full py-3 px-4 bg-[#0070ba] hover:bg-[#003087] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.7a.773.773 0 0 1 .764-.65h6.674c2.258 0 3.833.607 4.68 1.807.393.555.623 1.174.693 1.88.073.74-.013 1.586-.257 2.555l-.008.028v.396l.309.174c.261.14.47.292.635.464.29.303.477.678.556 1.116.082.45.056.99-.073 1.596-.15.695-.397 1.3-.736 1.794-.312.459-.712.84-1.19 1.132a4.718 4.718 0 0 1-1.513.618 7.58 7.58 0 0 1-1.813.2h-.431c-.307 0-.607.114-.836.318a1.236 1.236 0 0 0-.42.777l-.033.173-.553 3.503-.025.125a.303.303 0 0 1-.086.196.284.284 0 0 1-.182.067z" />
                </svg>
                {mode === 'one-time' ? 'Thanh toán qua PayPal' : 'Đăng ký PayPal'}
                <ExternalLink className="w-4 h-4" />
            </button>

            <p className="text-xs text-gray-500 text-center">
                {mode === 'one-time'
                    ? 'Thanh toán 1 lần. Bạn sẽ được chuyển đến trang PayPal.'
                    : 'Thanh toán định kỳ hàng tháng qua PayPal. Có thể hủy bất cứ lúc nào.'}
            </p>
        </div>
    );
}
