'use client';

/**
 * Payment Success Page
 * Shown after successful SePay QR payment
 */

import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function PaymentSuccessPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
            <div className="text-center max-w-md mx-4">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Thanh toán thành công! 🎉
                </h1>
                <p className="text-gray-600 mb-8">
                    Gói của bạn đã được kích hoạt. Bạn có thể bắt đầu sử dụng ngay bây giờ.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
                >
                    Vào Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
