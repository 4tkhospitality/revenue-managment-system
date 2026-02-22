'use client';

import { useState } from 'react';
import { resetDerivedData } from '../actions/resetDerivedData';
import { getActiveHotelData } from '../actions/getActiveHotelData';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function ResetButton() {
    const t = useTranslations('dataPage');
    const [isResetting, setIsResetting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message?: string; deleted?: Record<string, number> } | null>(null);
    const router = useRouter();

    const handleReset = async () => {
        setIsResetting(true);
        setResult(null);
        try {
            const { hotelId } = await getActiveHotelData();
            if (!hotelId) {
                setResult({ success: false, message: t('noReservationData') });
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('resetAndRebuild')}
            </button>

            {result && (
                <span className={`text-sm font-medium ${result.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {result.success ? `✓ ${result.message}` : `✗ ${result.message}`}
                </span>
            )}

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {t('confirmReset')}
                            </h3>
                        </div>

                        <p className="text-gray-600 mb-4">
                            {t.rich('resetDesc', { b: (c) => <strong className="text-red-600">{c}</strong> })}
                        </p>

                        <ul className="text-sm text-gray-500 mb-4 space-y-1 pl-4">
                            <li>• Daily OTB (on-the-books)</li>
                            <li>• Features Daily (pickup, pace)</li>
                            <li>• Demand Forecast</li>
                            <li>• Price Recommendations</li>
                            <li>• Pricing Decisions</li>
                        </ul>

                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-6">
                            <p className="text-sm text-emerald-700">
                                ✓ <strong>Raw reservations</strong> {t('rawKept').replace('✓ ', '')}
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={isResetting}
                                className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={isResetting}
                                className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {isResetting ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        {t('deleting')}
                                    </span>
                                ) : (
                                    t('deleteAndReset')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
