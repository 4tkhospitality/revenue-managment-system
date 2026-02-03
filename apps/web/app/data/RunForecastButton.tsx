'use client';

import { useState } from 'react';
import { runForecast } from '../actions/runForecast';
import { useRouter } from 'next/navigation';

export function RunForecastButton() {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);
    const router = useRouter();

    const handleRunForecast = async () => {
        setIsRunning(true);
        setResult(null);
        try {
            const hotelId = process.env.NEXT_PUBLIC_DEFAULT_HOTEL_ID;
            if (!hotelId) {
                setResult({ success: false, error: 'NEXT_PUBLIC_DEFAULT_HOTEL_ID chưa được cấu hình' });
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const res = await runForecast(hotelId, today);
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
        <div className="flex items-center gap-4">
            <button
                onClick={handleRunForecast}
                disabled={isRunning}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${isRunning
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-amber-600 text-white hover:bg-amber-500'
                    }`}
            >
                {isRunning ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Running...
                    </span>
                ) : (
                    '🎯 Run Forecast'
                )}
            </button>

            {result && (
                <span className={`text-sm ${result.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.success ? `✅ Đã tạo ${result.count} forecasts` : `❌ ${result.error}`}
                </span>
            )}
        </div>
    );
}
