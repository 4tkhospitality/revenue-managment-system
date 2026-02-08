'use client';

import { useState } from 'react';
import { rebuildAllOTB } from '../actions/buildDailyOTB';
import { useRouter } from 'next/navigation';

export function BuildOtbButton() {
    const [isBuilding, setIsBuilding] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
    const router = useRouter();

    const handleBuildOTB = async () => {
        setIsBuilding(true);
        setResult(null);
        try {
            const res = await rebuildAllOTB();
            setResult(res);
            if (res.success) {
                router.refresh();
            }
        } catch (err) {
            setResult({ success: false, error: String(err) });
        } finally {
            setIsBuilding(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleBuildOTB}
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Build OTB
                    </>
                )}
            </button>

            {result && (
                <span className={`text-sm font-medium ${result.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {result.success ? `✓ ${result.message}` : `✗ ${result.error}`}
                </span>
            )}
        </div>
    );
}
