'use client';

import { useState } from 'react';
import { clearImportHistory } from '../actions/clearImportHistory';
import { getActiveHotelData } from '../actions/getActiveHotelData';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function ClearImportHistoryButton() {
    const t = useTranslations('dataPage');
    const [isClearing, setIsClearing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null);
    const router = useRouter();

    const handleClear = async () => {
        setIsClearing(true);
        setResult(null);
        try {
            const { hotelId } = await getActiveHotelData();
            if (!hotelId) {
                setResult({ success: false, message: t('noHotel') });
                return;
            }

            const res = await clearImportHistory(hotelId);
            setResult(res);
            if (res.success) {
                router.refresh();
            }
        } catch (err) {
            setResult({ success: false, message: String(err) });
        } finally {
            setIsClearing(false);
            setShowConfirm(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={isClearing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('resetAllData')}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Reset All Data
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
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                ⚠️ Reset All Data?
                            </h3>
                        </div>

                        <p className="text-gray-600 mb-4">
                            {t.rich('clearDesc', { b: (c) => <strong className="text-red-600">{c}</strong> })}
                        </p>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <ul className="text-sm text-red-700 space-y-1">
                                <li>• ❌ {t('allReservations')}</li>
                                <li>• ❌ {t('allCancellations')}</li>
                                <li>• ❌ {t('importHistory')}</li>
                            </ul>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                            <p className="text-sm text-amber-700">
                                💡 {t.rich('clearPurpose', { b: (c) => <strong>{c}</strong> })}
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={isClearing}
                                className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleClear}
                                disabled={isClearing}
                                className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {isClearing ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        {t('deleting')}
                                    </span>
                                ) : (
                                    t('clearHistory')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
