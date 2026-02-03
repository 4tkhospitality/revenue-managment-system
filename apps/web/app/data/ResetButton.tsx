'use client';

import { useState } from 'react';
import { resetDerivedData } from '../actions/resetDerivedData';
import { useRouter } from 'next/navigation';

export function ResetButton() {
    const [isResetting, setIsResetting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message?: string; deleted?: Record<string, number> } | null>(null);
    const router = useRouter();

    const handleReset = async () => {
        setIsResetting(true);
        setResult(null);
        try {
            const hotelId = process.env.NEXT_PUBLIC_DEFAULT_HOTEL_ID;
            if (!hotelId) {
                setResult({ success: false, message: 'NEXT_PUBLIC_DEFAULT_HOTEL_ID chưa được cấu hình' });
                return;
            }

            const res = await resetDerivedData(hotelId);
            setResult(res);
            if (res.success) {
                router.refresh();
            }
        } catch (err) {
            setResult({ success: false, message: String(err) });
        } finally {
            setIsResetting(false);
            setShowConfirm(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={isResetting}
                className="px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-rose-600 text-white hover:bg-rose-500 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
                🔄 Reset & Rebuild
            </button>

            {/* Result message */}
            {result && (
                <span className={`text-sm ${result.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {result.success ? `✅ ${result.message}` : `❌ ${result.message}`}
                </span>
            )}

            {/* Confirmation Modal - Light theme */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            ⚠️ Xác nhận Reset?
                        </h3>

                        <p className="text-gray-700 mb-4">
                            Hành động này sẽ <strong className="text-rose-600">xóa toàn bộ</strong> dữ liệu đã tính toán:
                        </p>

                        <ul className="text-sm text-gray-500 mb-4 space-y-1">
                            <li>• Daily OTB (on-the-books)</li>
                            <li>• Features Daily (pickup, pace)</li>
                            <li>• Demand Forecast</li>
                            <li>• Price Recommendations</li>
                            <li>• Pricing Decisions</li>
                        </ul>

                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6">
                            <p className="text-sm text-emerald-700">
                                ✅ <strong>Raw reservations</strong> sẽ được giữ lại an toàn.
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={isResetting}
                                className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={isResetting}
                                className="px-4 py-2 rounded-lg text-sm bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50"
                            >
                                {isResetting ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Đang xóa...
                                    </span>
                                ) : (
                                    'Xóa và Reset'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
