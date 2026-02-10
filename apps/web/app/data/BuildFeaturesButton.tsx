'use client';

import { useState } from 'react';
import { buildFeaturesDaily, backfillFeatures, BuildFeaturesResult, BackfillResult } from '../actions/buildFeaturesDaily';
import { getLatestOtbDate } from '../actions/getActiveHotelData';
import { useRouter } from 'next/navigation';

export function BuildFeaturesButton() {
    const [isBuilding, setIsBuilding] = useState(false);
    const [result, setResult] = useState<BuildFeaturesResult | null>(null);
    const router = useRouter();

    const handleBuildFeatures = async () => {
        setIsBuilding(true);
        setResult(null);
        try {
            // v2: Use MAX(as_of_date) from daily_otb — not booking_date!
            const { hotelId, latestAsOfDate } = await getLatestOtbDate();
            if (!hotelId) {
                setResult({ success: false, message: 'Chưa chọn hotel' });
                return;
            }
            if (!latestAsOfDate) {
                setResult({ success: false, message: '⚠️ Chưa có OTB snapshot. Vui lòng Build OTB trước!' });
                return;
            }

            // Fix timezone: extract ISO string BEFORE any Date conversion
            // latestAsOfDate from server is UTC midnight, converting to local timezone
            // in Vietnam (UTC+7) shifts it back 1 day via setHours(0,0,0,0)
            const asOfDateStr = latestAsOfDate instanceof Date
                ? latestAsOfDate.toISOString().split('T')[0]
                : String(latestAsOfDate).split('T')[0];

            const res = await buildFeaturesDaily(hotelId, asOfDateStr);
            setResult(res);
            if (res.success) {
                router.refresh();
            }
        } catch (err) {
            setResult({ success: false, message: String(err) });
        } finally {
            setIsBuilding(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleBuildFeatures}
                disabled={isBuilding}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${isBuilding
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm'
                    }`}
            >
                {isBuilding ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Building...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Build Features
                    </>
                )}
            </button>

            {result && (
                <span className={`text-sm font-medium ${result.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {result.success
                        ? `✓ ${result.message || `Đã tạo ${result.rowsBuilt} features`}`
                        : `✗ ${result.message}`}
                </span>
            )}

            {/* Show validation issues if any */}
            {result?.issues && result.issues.length > 0 && (
                <div className="ml-2 text-xs text-amber-600">
                    ⚠ {result.issues.length} issues
                </div>
            )}
        </div>
    );
}

/**
 * Backfill button for historical data
 */
export function BackfillFeaturesButton() {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<BackfillResult | null>(null);
    const router = useRouter();

    const handleBackfill = async () => {
        if (!confirm('Backfill sẽ xử lý tất cả as_of_dates. Có thể mất vài phút. Tiếp tục?')) {
            return;
        }

        setIsRunning(true);
        setResult(null);
        try {
            const { hotelId } = await getLatestOtbDate();
            if (!hotelId) {
                setResult({ success: false, totalProcessed: 0, totalChunks: 0, message: 'Không tìm thấy hotel' });
                return;
            }

            const res = await backfillFeatures(hotelId);
            setResult(res);
            if (res.success) {
                router.refresh();
            }
        } catch (err) {
            setResult({ success: false, totalProcessed: 0, totalChunks: 0, message: String(err) });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleBackfill}
                disabled={isRunning}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isRunning
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                    }`}
            >
                {isRunning ? (
                    <>
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Backfilling...
                    </>
                ) : (
                    <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Backfill All
                    </>
                )}
            </button>

            {result && (
                <span className={`text-xs font-medium ${result.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {result.success
                        ? `✓ ${result.totalProcessed} dates processed`
                        : `✗ ${result.message}`}
                </span>
            )}
        </div>
    );
}

