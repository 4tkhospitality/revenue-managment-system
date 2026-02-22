'use client';

/**
 * Payment Method Modal
 * Shows 3 payment options: SePay (VND), PayPal (USD), Zalo Contact
 * Integrates PLG event tracking
 */

import { useState, useEffect, useRef } from 'react';
import { X, QrCode, CreditCard, MessageCircle, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { PlanTier, RoomBand } from '@prisma/client';
import { trackEventClient } from '@/lib/payments/trackEvent';
import { getPlanLabel, getBandLabel, getPrice } from '@/lib/plg/plan-config';
import { PayPalCheckout } from './PayPalCheckout';

type BillingCycle = 'monthly' | '3-months';

interface PaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    hotelId: string;
    tier: PlanTier;
    roomBand: RoomBand;
    currentTier: PlanTier;
    billingCycle?: BillingCycle;
}

type PaymentMethod = 'sepay' | 'paypal' | 'zalo' | null;
type Step = 'select' | 'processing' | 'success' | 'paid' | 'error' | 'paypal';

export function PaymentMethodModal({
    isOpen,
    onClose,
    hotelId,
    tier,
    roomBand,
    currentTier,
    billingCycle = 'monthly',
}: PaymentMethodModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
    const [step, setStep] = useState<Step>('select');
    const [error, setError] = useState<string | null>(null);
    const [paypalMode, setPaypalMode] = useState<'subscription' | 'one-time'>('one-time');
    const [checkoutData, setCheckoutData] = useState<{
        checkoutUrl?: string;
        orderId?: string;
        amount?: number;
    } | null>(null);

    // Payment confirmation polling
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);

    // Dynamic pricing from DB
    const [dynamicMonthly, setDynamicMonthly] = useState<number | null>(null);
    const [dynamicQuarterly, setDynamicQuarterly] = useState<number | null>(null);

    // Fetch PayPal mode setting
    useEffect(() => {
        if (!isOpen) return;
        fetch('/api/admin/settings?key=paypal_mode')
            .then(r => r.json())
            .then(data => {
                if (data.value === 'subscription' || data.value === 'one-time') {
                    setPaypalMode(data.value);
                }
            })
            .catch(() => { }); // Fallback to default 'one-time'
    }, [isOpen]);

    // Fetch dynamic prices from DB
    useEffect(() => {
        if (!isOpen) return;
        fetch(`/api/pricing/plans?band=${roomBand}`)
            .then(r => r.json())
            .then(data => {
                if (data[tier]) {
                    setDynamicMonthly(data[tier].monthly);
                    setDynamicQuarterly(data[tier].quarterly);
                }
            })
            .catch(() => { }); // Fallback to hardcoded
    }, [isOpen, tier, roomBand]);

    // Poll payment status when QR is displayed (every 5s)
    useEffect(() => {
        // Only poll when showing QR code (step === 'success') with an orderId
        if (step !== 'success' || !checkoutData?.orderId) {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            return;
        }

        const poll = async () => {
            try {
                const res = await fetch(`/api/payments/status?orderId=${checkoutData.orderId}`);
                if (!res.ok) return;
                const data = await res.json();

                if (data.status === 'COMPLETED') {
                    setPaymentConfirmed(true);
                    setStep('paid');
                    if (pollingRef.current) {
                        clearInterval(pollingRef.current);
                        pollingRef.current = null;
                    }
                    trackEventClient({
                        event: 'payment_success',
                        hotelId,
                        properties: { gateway: 'SEPAY', tier, orderId: checkoutData.orderId, source: 'poll' },
                    });
                } else if (data.status === 'FAILED') {
                    setError(data.failedReason || 'Payment failed');
                    setStep('error');
                    if (pollingRef.current) {
                        clearInterval(pollingRef.current);
                        pollingRef.current = null;
                    }
                }
            } catch {
                // Silently ignore poll errors
            }
        };

        // Initial check immediately
        poll();
        pollingRef.current = setInterval(poll, 5000);

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [step, checkoutData?.orderId, hotelId, tier]);

    if (!isOpen) return null;

    // Use dynamic price from DB, fallback to hardcoded
    const monthlyPrice = dynamicMonthly ?? getPrice(tier, roomBand);
    const vndPrice = billingCycle === '3-months'
        ? (dynamicQuarterly ?? monthlyPrice * 0.5)  // quarterly from DB is already per-month discounted
        : monthlyPrice;
    const planLabel = getPlanLabel(tier);
    const bandLabel = getBandLabel(roomBand);

    const handleMethodSelect = (method: PaymentMethod) => {
        setSelectedMethod(method);
        trackEventClient({
            event: 'payment_method_selected',
            hotelId,
            properties: { method, tier, roomBand },
        });

        if (method === 'zalo') {
            trackEventClient({
                event: 'zalo_clicked',
                hotelId,
                properties: { tier, roomBand },
            });
            window.open('https://zalo.me/0778602953', '_blank');
        }
    };

    const handleSepayCheckout = async () => {
        setStep('processing');
        setError(null);
        try {
            const res = await fetch('/api/payments/sepay/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hotelId: hotelId || undefined, tier, roomBand, billingCycle }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setCheckoutData(data);
            setStep('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setStep('error');
        }
    };

    const handlePaypalSelect = () => {
        handleMethodSelect('paypal');
        setStep('paypal');
    };

    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Upgrade to {planLabel}</h2>
                        <p className="text-sm text-gray-500">{bandLabel}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 'select' && (
                        <div className="space-y-3">
                            {/* SePay (VND) */}
                            <button
                                onClick={() => { handleMethodSelect('sepay'); handleSepayCheckout(); }}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-blue-300 hover:bg-blue-50/50 ${selectedMethod === 'sepay' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <QrCode className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900">QR Banking (SePay)</div>
                                        <div className="text-sm text-gray-500">Bank transfer via QR</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900">{formatVND(vndPrice)}₫</div>
                                        <div className="text-xs text-gray-500">/{billingCycle === '3-months' ? 'month (x3)' : 'month'}</div>
                                    </div>
                                </div>
                            </button>

                            {/* PayPal (USD) */}
                            <button
                                onClick={handlePaypalSelect}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50/50 ${selectedMethod === 'paypal' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900">PayPal (USD)</div>
                                        <div className="text-sm text-gray-500">
                                            {paypalMode === 'one-time' ? 'One-time payment in USD' : 'Recurring payment in USD'}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400">
                                            {paypalMode === 'one-time' ? 'One-time payment' : 'Monthly subscription'}
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {/* Zalo */}
                            <button
                                onClick={() => handleMethodSelect('zalo')}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-green-300 hover:bg-green-50/50 ${selectedMethod === 'zalo' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900">Contact via Zalo</div>
                                        <div className="text-sm text-gray-500">Get advice before subscribing/upgrading</div>
                                    </div>
                                </div>
                            </button>


                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                            <p className="text-gray-600">Creating payment order...</p>
                        </div>
                    )}

                    {step === 'success' && checkoutData && (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                                <h3 className="text-lg font-semibold text-gray-900">Order Created!</h3>
                                <p className="text-sm text-gray-500 mt-1">Scan QR to pay</p>
                            </div>

                            {/* QR Code Display */}
                            <div className="bg-gray-50 p-4 rounded-xl text-center">
                                {checkoutData.checkoutUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={checkoutData.checkoutUrl}
                                        alt="QR Payment"
                                        className="mx-auto w-48 h-48 object-contain"
                                    />
                                )}
                                <p className="text-sm text-gray-600 mt-3">
                                    Amount: <strong>{formatVND(checkoutData.amount || 0)}₫</strong>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Order ID: {checkoutData.orderId}
                                </p>
                            </div>

                            <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-700">
                                ⏱️ Order expires after 30 minutes. After transfer, the system will automatically activate your plan.
                            </div>
                        </div>
                    )}

                    {step === 'paid' && (
                        <div className="flex flex-col items-center py-10">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-green-700 mb-2">Payment Successful!</h3>
                            <p className="text-sm text-gray-500 mb-6">Your service plan has been activated</p>
                            <button
                                onClick={() => { onClose(); window.location.href = '/onboarding'; }}
                                className="px-6 py-2.5 rounded-xl text-white font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all"
                            >
                                Complete
                            </button>
                        </div>
                    )}

                    {step === 'paypal' && (
                        <div className="space-y-4">
                            <button
                                onClick={() => { setStep('select'); setSelectedMethod(null); }}
                                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Go Back
                            </button>
                            <PayPalCheckout
                                hotelId={hotelId}
                                tier={tier}
                                roomBand={roomBand}
                                mode={paypalMode}
                                billingCycle={billingCycle}
                                planId={process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || ''}
                                onSuccess={(subId) => {
                                    setCheckoutData({ orderId: subId });
                                    setStep('success');
                                }}
                                onError={(msg) => {
                                    setError(msg);
                                    setStep('error');
                                }}
                            />
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                                <p className="text-red-700 font-medium">❌ An error occurred</p>
                                <p className="text-sm text-red-600 mt-1">{error}</p>
                            </div>
                            <button
                                onClick={() => { setStep('select'); setError(null); }}
                                className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
