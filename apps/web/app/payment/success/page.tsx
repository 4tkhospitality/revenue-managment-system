'use client';

/**
 * Payment Success Page
 * Handles post-payment flows:
 * - SePay: Simple success display
 * - PayPal: Auto-captures the order and activates subscription
 * 
 * 🔧 VERBOSE LOGGING for live debugging — remove after stable
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Loader2, XCircle } from 'lucide-react';

type Status = 'loading' | 'success' | 'error';

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { update: updateSession } = useSession();
    const provider = searchParams.get('provider');
    const token = searchParams.get('token'); // PayPal order ID from redirect
    const PayerID = searchParams.get('PayerID'); // PayPal payer ID

    const [status, setStatus] = useState<Status>(provider === 'paypal' ? 'loading' : 'success');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [plan, setPlan] = useState<string | null>(null);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    // PayPal: capture the order after redirect
    useEffect(() => {
        if (provider !== 'paypal' || !token) return;

        console.log('[PayPal Success Page] Capturing order...');
        console.log('[PayPal Success Page] token (paypalOrderId):', token);
        console.log('[PayPal Success Page] PayerID:', PayerID);

        const captureOrder = async () => {
            try {
                const res = await fetch('/api/payments/paypal/capture-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paypalOrderId: token }),
                });

                const data = await res.json();
                console.log('[PayPal Success Page] Capture response:', data);

                if (!res.ok) {
                    throw new Error(data.error || 'Capture failed');
                }

                setPlan(data.plan || null);
                setNeedsOnboarding(data.needsOnboarding || false);

                // Refresh JWT so middleware sees hasPendingActivation=true
                await updateSession();

                setStatus('success');

                // Auto-redirect for pay-first flow
                if (data.needsOnboarding) {
                    setTimeout(() => router.push('/onboarding'), 2000);
                }
            } catch (err) {
                console.error('[PayPal Success Page] Capture error:', err);
                setErrorMsg(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xác nhận thanh toán');
                setStatus('error');
            }
        };

        captureOrder();
    }, [provider, token, PayerID]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
                <div className="text-center max-w-md mx-4">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-6" />
                    <h1 className="text-xl font-bold text-gray-900 mb-3">
                        Đang xác nhận thanh toán PayPal...
                    </h1>
                    <p className="text-gray-500">
                        Vui lòng chờ trong giây lát. Không đóng trang này.
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white">
                <div className="text-center max-w-md mx-4">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">
                        Lỗi xác nhận thanh toán
                    </h1>
                    <p className="text-red-600 mb-4">{errorMsg}</p>
                    <p className="text-gray-500 mb-8 text-sm">
                        Thanh toán có thể đã thành công trên PayPal. Vui lòng liên hệ admin nếu gói chưa được kích hoạt.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Link
                            href="/pricing-plans"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                        >
                            Quay lại
                        </Link>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                        >
                            Vào Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
            <div className="text-center max-w-md mx-4">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Thanh toán thành công! 🎉
                </h1>
                <p className="text-gray-600 mb-8">
                    {needsOnboarding
                        ? `Gói ${plan || ''} đã được kích hoạt! Hãy tạo khách sạn của bạn để bắt đầu.`
                        : plan
                            ? `Gói ${plan} đã được kích hoạt. Bạn có thể bắt đầu sử dụng ngay bây giờ.`
                            : 'Gói của bạn đã được kích hoạt. Bạn có thể bắt đầu sử dụng ngay bây giờ.'}
                </p>
                <Link
                    href={needsOnboarding ? '/onboarding' : '/dashboard'}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
                >
                    {needsOnboarding ? 'Tạo khách sạn' : 'Vào Dashboard'} <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
