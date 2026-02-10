'use client';

/**
 * DashboardPdfWrapper - Client component wrapping dashboard content for PDF export
 * The export button lives in PageHeader now (ghost variant)
 */

import { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export function DashboardPdfWrapper({ children }: Props) {
    return (
        <div id="dashboard-pdf-content">
            {children}
        </div>
    );
}
