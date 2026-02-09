'use client';

/**
 * ExportPdfButton - Reusable PDF export button
 * Features:
 * - Loading state with spinner
 * - Error handling with alert
 * - Self-hides from PDF capture (pdf-hide class)
 */

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { exportToPdf, getRecommendedOrientation, type PdfExportOptions } from '@/lib/pdf/exportToPdf';

type PageType = 'dashboard' | 'analytics' | 'daily';

interface ExportPdfButtonProps {
    targetId: 'dashboard-pdf-content' | 'analytics-pdf-content' | 'daily-pdf-content';
    filename: string;
    pageType: PageType;
    // Metadata
    hotelName?: string;
    reportTitle?: string;
    asOfDate?: string;
    dateRange?: string;
    // Styling
    className?: string;
    variant?: 'primary' | 'secondary';
}

export function ExportPdfButton({
    targetId,
    filename,
    pageType,
    hotelName,
    reportTitle,
    asOfDate,
    dateRange,
    className = '',
    variant = 'secondary',
}: ExportPdfButtonProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async () => {
        setIsExporting(true);
        setError(null);

        try {
            const options: PdfExportOptions = {
                orientation: getRecommendedOrientation(pageType),
                format: 'a4',
                hotelName,
                reportTitle: reportTitle || getDefaultTitle(pageType),
                asOfDate,
                dateRange,
            };

            await exportToPdf(targetId, filename, options);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Lỗi xuất PDF. Thử lại sau.';
            setError(message);
            console.error('[PDF Export]', err);
        } finally {
            setIsExporting(false);
        }
    };

    const baseStyles = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
        secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100',
    };

    return (
        <div className="pdf-hide relative">
            <button
                onClick={handleExport}
                disabled={isExporting}
                className={`${baseStyles} ${variantStyles[variant]} ${className}`}
                title="Xuất báo cáo PDF"
            >
                {isExporting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang xuất...</span>
                    </>
                ) : (
                    <>
                        <FileDown className="w-4 h-4" />
                        <span>Xuất PDF</span>
                    </>
                )}
            </button>

            {/* Error tooltip */}
            {error && (
                <div className="absolute top-full mt-2 right-0 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap">
                    ⚠️ {error}
                    <button
                        onClick={() => setError(null)}
                        className="ml-2 text-red-500 hover:text-red-700"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Get default report title based on page type
 */
function getDefaultTitle(pageType: PageType): string {
    switch (pageType) {
        case 'dashboard':
            return 'Báo cáo Dashboard';
        case 'analytics':
            return 'Báo cáo Pace & Pickup';
        case 'daily':
            return 'Báo cáo Daily Actions';
        default:
            return 'Báo cáo RMS';
    }
}
