'use client';

import { ReactNode, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QuickModePanel, type QuickModeRecommendation } from './QuickModePanel';
import { Zap, Table2 } from 'lucide-react';

interface QuickModePricingWrapperProps {
    isQuickMode: boolean;
    quickModeData: QuickModeRecommendation[];
    onAcceptAll: () => Promise<void>;
    onAcceptOne: (stayDate: string) => Promise<void>;
    detailedContent: ReactNode;
}

export function QuickModePricingWrapper({
    isQuickMode,
    quickModeData,
    onAcceptAll,
    onAcceptOne,
    detailedContent,
}: QuickModePricingWrapperProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const toggleMode = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', 'pricing');
        if (isQuickMode) {
            params.delete('mode');
        } else {
            params.set('mode', 'quick');
        }
        router.push(`/dashboard?${params.toString()}`);
    }, [isQuickMode, router, searchParams]);

    return (
        <div className="space-y-4">
            {/* Mode toggle bar */}
            <div className="flex items-center justify-between bg-gray-800/30 rounded-lg px-4 py-2 border border-gray-700/40">
                <span className="text-sm text-gray-400">
                    {isQuickMode ? 'Chế độ nhanh — xem action & duyệt' : 'Chế độ chi tiết — bảng giá đề xuất'}
                </span>
                <button
                    onClick={toggleMode}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors
                        bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                    {isQuickMode ? (
                        <><Table2 className="w-3.5 h-3.5" /> Chi tiết</>
                    ) : (
                        <><Zap className="w-3.5 h-3.5" /> Nhanh</>
                    )}
                </button>
            </div>

            {/* Content */}
            {isQuickMode ? (
                <QuickModePanel
                    data={quickModeData}
                    onAcceptAll={onAcceptAll}
                    onAcceptOne={onAcceptOne}
                />
            ) : (
                detailedContent
            )}
        </div>
    );
}
