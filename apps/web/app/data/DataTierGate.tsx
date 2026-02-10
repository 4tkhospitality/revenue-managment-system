'use client';

import { ReactNode } from 'react';
import { Database, Upload as UploadIcon, FileText, BarChart3 } from 'lucide-react';
import { TierPaywall } from '@/components/paywall/TierPaywall';
import { useTierAccess } from '@/hooks/useTierAccess';

export function DataTierGate({ children }: { children: ReactNode }) {
    const { hasAccess, loading } = useTierAccess('SUPERIOR');

    if (loading) {
        return (
            <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <div className="text-slate-500">Đang tải...</div>
                </div>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <TierPaywall
                title="Data Inspector"
                subtitle="Xem dữ liệu đã import và trạng thái hệ thống"
                tierDisplayName="Superior"
                colorScheme="blue"
                features={[
                    { icon: <Database className="w-4 h-4" />, label: 'Xem chi tiết reservations & OTB data' },
                    { icon: <UploadIcon className="w-4 h-4" />, label: 'Theo dõi lịch sử import jobs' },
                    { icon: <FileText className="w-4 h-4" />, label: 'Báo cáo cancellations theo ngày' },
                    { icon: <BarChart3 className="w-4 h-4" />, label: 'Build OTB, Features & Forecast' },
                ]}
            />
        );
    }

    return <>{children}</>;
}
