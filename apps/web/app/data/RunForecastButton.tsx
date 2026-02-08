'use client';

import { useState } from 'react';
import { runForecast } from '../actions/runForecast';
import { getActiveHotelData } from '../actions/getActiveHotelData';
import { useRouter } from 'next/navigation';

export function RunForecastButton() {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);
    const router = useRouter();

    const handleRunForecast = async () => {
        setIsRunning(true);
        setResult(null);
        try {
            const { hotelId, latestBookingDate } = await getActiveHotelData();
            if (!hotelId || !latestBookingDate) {
                setResult({ success: false, error: 'Chưa có dữ liệu reservation' });
                return;
            }

            const asOfDate = new Date(latestBookingDate);
            asOfDate.setHours(0, 0, 0, 0);

            const res = await runForecast(hotelId, asOfDate);
            setResult(res);
            if (res.success) {
                router.refresh();
            }
        } catch (err) {
            setResult({ success: false, error: String(err) });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleRunForecast}
                disabled={isRunning}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${isRunning
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm'
                    }`}
            >
                {isRunning ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Running...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Run Forecast
                    </>
                )}
            </button>

            {result && (
                <span className={`text-sm font-medium ${result.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {result.success ? `✓ Đã tạo ${result.count} forecasts` : `✗ ${result.error}`}
                </span>
            )}
        </div>
    );
}
