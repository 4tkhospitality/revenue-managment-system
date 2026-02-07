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
                // Refresh the page to show new data
                router.refresh();
            }
        } catch (err) {
            setResult({ success: false, error: String(err) });
        } finally {
            setIsBuilding(false);
        }
    };

    return (
        <div className="flex items-center gap-4">
            <button
                onClick={handleBuildOTB}
                disabled={isBuilding}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${isBuilding
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
            >
                {isBuilding ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Building...
                    </span>
                ) : (
                    '🔄 Build OTB Now'
                )}
            </button>

            {result && (
                <span className={`text-sm ${result.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.success ? `✅ ${result.message}` : `❌ ${result.error}`}
                </span>
            )}
        </div>
    );
}
