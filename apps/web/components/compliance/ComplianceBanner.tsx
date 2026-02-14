'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { useComplianceCheck } from '@/hooks/useComplianceCheck';

/**
 * Compliance banner that shows when hotel capacity exceeds subscription band.
 * Place at top of Dashboard and/or Settings pages.
 */
export function ComplianceBanner({ hotelId }: { hotelId?: string }) {
    const { compliance, loading } = useComplianceCheck(hotelId);

    if (loading || !compliance) return null;

    // STANDARD guard: capacity > 30 with free plan
    if (compliance.isStandardViolation) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">
                        Gói Tiêu chuẩn chỉ dành cho khách sạn ≤ 30 phòng
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                        Khách sạn của bạn có {compliance.hotelCapacity} phòng. Vui lòng nâng cấp để tiếp tục sử dụng.
                    </p>
                    <Link
                        href="/pricing-plans"
                        className="inline-flex items-center gap-1 mt-2 text-sm text-red-700 hover:text-red-900 font-medium"
                    >
                        Nâng cấp ngay <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        );
    }

    // Band mismatch warning
    if (!compliance.isCompliant) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800">
                        📊 Band không khớp
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                        Khách sạn có {compliance.hotelCapacity} phòng (band {compliance.derivedBand})
                        nhưng gói hiện tại là {compliance.subscriptionBand}. Một số quota có thể bị giới hạn.
                    </p>
                    <Link
                        href="/pricing-plans"
                        className="inline-flex items-center gap-1 mt-2 text-sm text-amber-700 hover:text-amber-900 font-medium"
                    >
                        Nâng cấp band <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        );
    }

    return null;
}
