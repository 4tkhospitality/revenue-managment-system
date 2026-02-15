'use client';

/**
 * Payment Cancel/Expired Page
 * Shown when user cancels payment or it expires
 */

import Link from 'next/link';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function PaymentCancelPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
            <div className="text-center max-w-md mx-4">
                <XCircle className="w-16 h-16 text-orange-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Thanh toán đã hủy
                </h1>
                <p className="text-gray-600 mb-8">
                    Giao dịch chưa được hoàn tất. Bạn có thể thử lại bất cứ lúc nào.
                </p>
                <Link
                    href="/pricing-plans"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại bảng giá
                </Link>
            </div>
        </div>
    );
}
