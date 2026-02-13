'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Inner component that uses useSearchParams (requires Suspense boundary)
function AnalyticsRedirectInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', 'analytics');
        router.replace(`/dashboard?${params.toString()}`);
    }, [router, searchParams]);

    return (
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                <div className="text-slate-500 text-sm">Đang chuyển hướng...</div>
            </div>
        </div>
    );
}

// ─── D1: Smart Redirect ─────────────────────────────────────
// /analytics → /dashboard?tab=analytics
// Preserves all query parameters (asOf, mode, etc.)
export default function AnalyticsRedirectPage() {
    return (
        <Suspense fallback={
            <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                    <div className="text-slate-500 text-sm">Đang chuyển hướng...</div>
                </div>
            </div>
        }>
            <AnalyticsRedirectInner />
        </Suspense>
    );
}
