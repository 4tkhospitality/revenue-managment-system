'use client';

/**
 * DashboardPdfWrapper - Client component for PDF export on Dashboard
 * Wraps content with pdf-content ID and provides export button
 */

import { ReactNode } from 'react';
import { ExportPdfButton } from '@/components/shared/ExportPdfButton';

interface Props {
    children: ReactNode;
    hotelName: string;
    asOfDate?: string;
}

export function DashboardPdfWrapper({ children, hotelName, asOfDate }: Props) {
    return (
        <>
            {/* PDF Export Button - positioned in header area */}
            <div className="flex justify-end mb-4 pdf-hide">
                <ExportPdfButton
                    targetId="dashboard-pdf-content"
                    filename={`dashboard-${new Date().toISOString().split('T')[0]}`}
                    pageType="dashboard"
                    hotelName={hotelName}
                    asOfDate={asOfDate}
                />
            </div>

            {/* PDF Content Container */}
            <div id="dashboard-pdf-content">
                {children}
            </div>
        </>
    );
}
