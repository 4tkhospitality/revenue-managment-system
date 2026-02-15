'use client';

/**
 * PayPal Checkout Component
 * Renders PayPal subscription button using @paypal/react-paypal-js
 */

import { useState } from 'react';
import { PlanTier, RoomBand } from '@prisma/client';
import { trackEventClient } from '@/lib/payments/trackEvent';
import { Loader2 } from 'lucide-react';

interface PayPalCheckoutProps {
    hotelId: string;
    tier: PlanTier;
    roomBand: RoomBand;
    planId: string; // PayPal Plan ID
    onSuccess: (subscriptionId: string) => void;
    onError: (error: string) => void;
}

export function PayPalCheckout({
    hotelId,
    tier,
    roomBand,
    planId,
    onSuccess,
    onError,
}: PayPalCheckoutProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleApprove = async (subscriptionId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/payments/paypal/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hotelId,
                    tier,
                    roomBand,
                    paypalSubscriptionId: subscriptionId,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Activation failed');
            }

            onSuccess(subscriptionId);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            setError(msg);
            onError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">Đang kích hoạt gói...</span>
            </div>
        );
    }

    // PayPal button (using script tag approach — simpler than the React SDK for subscriptions)
    return (
        <div className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            <div
                id="paypal-button-container"
                className="min-h-[50px]"
            >
                {/* PayPal buttons will be rendered here by the PayPal SDK script */}
                <button
                    onClick={() => {
                        // Temporary: redirect to PayPal subscription link
                        // TODO: Replace with actual PayPal JS SDK integration
                        trackEventClient({
                            event: 'payment_method_selected',
                            properties: { method: 'PAYPAL', tier, roomBand },
                        });

                        // For now, show instructions
                        setError(
                            'PayPal subscription integration requires PayPal Plan IDs. ' +
                            'Please configure PAYPAL_PLAN_* environment variables.'
                        );
                    }}
                    className="w-full py-3 px-4 bg-[#0070ba] hover:bg-[#003087] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.7a.773.773 0 0 1 .764-.65h6.674c2.258 0 3.833.607 4.68 1.807.393.555.623 1.174.693 1.88.073.74-.013 1.586-.257 2.555l-.008.028v.396l.309.174c.261.14.47.292.635.464.29.303.477.678.556 1.116.082.45.056.99-.073 1.596-.15.695-.397 1.3-.736 1.794-.312.459-.712.84-1.19 1.132a4.718 4.718 0 0 1-1.513.618 7.58 7.58 0 0 1-1.813.2h-.431c-.307 0-.607.114-.836.318a1.236 1.236 0 0 0-.42.777l-.033.173-.553 3.503-.025.125a.303.303 0 0 1-.086.196.284.284 0 0 1-.182.067z" />
                    </svg>
                    Thanh toán qua PayPal
                </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
                Thanh toán định kỳ hàng tháng qua PayPal. Có thể hủy bất cứ lúc nào.
            </p>
        </div>
    );
}
