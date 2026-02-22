'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2, FileSpreadsheet, FileCode, Lock, Files, Download, Package, Lightbulb } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { ingestCSV } from '../actions/ingestCSV';
import { ingestXML } from '../actions/ingestXML';
import { ingestCancellationXml } from '../actions/ingestCancellationXml';
import { TierPaywall } from '@/components/paywall/TierPaywall';
import { useTierAccess } from '@/hooks/useTierAccess';
import { useTranslations } from 'next-intl';

type ReportType = 'booked' | 'cancelled';
type FileType = 'csv' | 'xml' | 'xlsx';

interface FileResult {
    fileName: string;
    status: 'pending' | 'processing' | 'success' | 'error';
    message?: string;
    count?: number;
}

export default function UploadPage() {
    const { hasAccess, loading: tierLoading } = useTierAccess('DELUXE');
    const t = useTranslations('uploadPage');
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<ReportType>('booked');
    const [isProcessing, setIsProcessing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [fileResults, setFileResults] = useState<FileResult[]>([]);
    const [activeHotelId, setActiveHotelId] = useState<string | null>(null);
    const [activeHotelName, setActiveHotelName] = useState<string | null>(null);
    const [isDemo, setIsDemo] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch active hotel and check if Demo Hotel
    useEffect(() => {
        if (!hasAccess || tierLoading) return; // Don't fetch if no access
        const fetchActiveHotel = async () => {
            try {
                const res = await fetch('/api/user/switch-hotel');
                const data = await res.json();
                if (data.activeHotelId) {
                    setActiveHotelId(data.activeHotelId);
                    // Use hotel name from API response (from DB) for consistency
                    if (data.activeHotelName) {
                        setActiveHotelName(data.activeHotelName);
                    }
                }

                const demoRes = await fetch('/api/is-demo-hotel');
                const demoData = await demoRes.json();
                setIsDemo(demoData.isDemo || false);
                // Check role for admin bypass
                const isAdminRole = demoData.role === 'super_admin' || demoData.role === 'hotel_admin';
                setIsAdmin(isAdminRole || session?.user?.isAdmin || false);
            } catch (error) {
                console.error('Error fetching active hotel:', error);
            }
        };
        fetchActiveHotel();
    }, [session, hasAccess, tierLoading]);

    // Tier gate: show paywall for non-SUPERIOR users
    // MUST be after all hooks to avoid React hooks order violation
    if (!tierLoading && !hasAccess) {
        return (
            <TierPaywall
                title={t('title')}
                subtitle={t('paywallSubtitle')}
                tierDisplayName="Deluxe"
                colorScheme="blue"
                features={[
                    { icon: <Upload className="w-4 h-4" />, label: t('feat1') },
                    { icon: <FileSpreadsheet className="w-4 h-4" />, label: t('feat2') },
                    { icon: <FileCode className="w-4 h-4" />, label: t('feat3') },
                    { icon: <CheckCircle className="w-4 h-4" />, label: t('feat4') },
                ]}
            />
        );
    }

    const detectFileType = (file: File): FileType => {
        if (file.name.endsWith('.xml')) return 'xml';
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) return 'xlsx';
        return 'csv';
    };

    // Process a single file 
    const processOneFile = async (file: File, hotelId: string): Promise<{ success: boolean; message: string; count?: number }> => {
        const fileType = detectFileType(file);

        if (fileType !== 'csv' && fileType !== 'xml' && fileType !== 'xlsx') {
            return { success: false, message: t('unsupported') };
        }

        try {
            let result;

            if (activeTab === 'cancelled' && fileType === 'xml') {
                // Use API Route instead of Server Action to handle large XML files
                const formData = new FormData();
                formData.append('file', file);
                formData.append('hotelId', hotelId);

                const response = await fetch('/api/upload/cancellation', {
                    method: 'POST',
                    body: formData,
                });
                result = await response.json();

                if (result.success) {
                    return { success: true, message: t('cancellations', { n: result.recordCount }), count: result.recordCount };
                } else {
                    return { success: false, message: result.error || t('importFailed') };
                }
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('hotelId', hotelId);
            formData.append('reportType', activeTab);

            if (fileType === 'xml') {
                result = await ingestXML(formData);
            } else {
                // CSV and XLSX both go through ingestCSV (server detects format)
                result = await ingestCSV(formData);
            }

            if (result.success) {
                return { success: true, message: t('reservations', { n: result.count ?? 0 }), count: result.count };
            } else {
                return { success: false, message: result.message || t('importFailed') };
            }
        } catch (err: any) {
            return { success: false, message: err.message || 'Unknown error' };
        }
    };

    // Process multiple files sequentially
    const handleFiles = async (files: File[]) => {
        if (isDemo && !isAdmin) {
            return;
        }

        const hotelId = activeHotelId || '';
        console.log(`[UPLOAD] 🔍 hotelId resolution:`, {
            activeHotelId,
            resolved: hotelId,
        });
        if (!hotelId) {
            setFileResults([{ fileName: 'ERROR', status: 'error', message: t('hotelNotFound') }]);
            return;
        }

        // Sort files by name for logical order
        const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));

        // Init all as pending
        const initial: FileResult[] = sorted.map(f => ({
            fileName: f.name,
            status: 'pending' as const,
        }));
        setFileResults(initial);
        setIsProcessing(true);

        // Process one by one
        for (let i = 0; i < sorted.length; i++) {
            // Mark current as processing
            setFileResults(prev => prev.map((r, idx) =>
                idx === i ? { ...r, status: 'processing' as const } : r
            ));

            const result = await processOneFile(sorted[i], hotelId);

            // Update result
            setFileResults(prev => prev.map((r, idx) =>
                idx === i ? {
                    ...r,
                    status: result.success ? 'success' as const : 'error' as const,
                    message: result.message,
                    count: result.count,
                } : r
            ));
        }

        setIsProcessing(false);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDemo && !isAdmin) return;
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (isDemo && !isAdmin) return;
        if (isProcessing) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFiles(files);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const handleButtonClick = () => {
        if (isDemo && !isAdmin) return;
        if (isProcessing) return;
        inputRef.current?.click();
    };

    const resetUpload = () => {
        setFileResults([]);
        setIsProcessing(false);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const handleTabChange = (tab: ReportType) => {
        if (isProcessing) return;
        setActiveTab(tab);
        resetUpload();
    };

    // Summary stats
    const successCount = fileResults.filter(r => r.status === 'success').length;
    const errorCount = fileResults.filter(r => r.status === 'error').length;
    const totalRecords = fileResults.reduce((sum, r) => sum + (r.count || 0), 0);
    const isDone = fileResults.length > 0 && !isProcessing;
    const isIdle = fileResults.length === 0;

    return (
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 space-y-6">
            {/* Header */}
            <header
                className="rounded-2xl px-6 py-4 text-white shadow-sm"
                style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
            >
                <h1 className="text-lg font-semibold">{t('title')}</h1>
                <p className="text-white/70 text-sm mt-1">
                    <span dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
                </p>
            </header>

            <div className="space-y-6">
                {/* Active Hotel Banner */}
                {activeHotelName && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-blue-800">
                            {t('uploadingFor')} <strong>{activeHotelName}</strong>
                        </span>
                        <span className="text-xs text-blue-400 ml-auto font-mono">{activeHotelId?.slice(0, 8)}</span>
                    </div>
                )}
                {/* Demo Hotel Warning */}
                {isDemo && !isAdmin && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-amber-800 font-medium">{t('demoTitle')}</p>
                            <p className="text-amber-700 text-sm">
                                You are using Demo Hotel. File upload is disabled.
                                Please contact admin to be assigned a real hotel.
                            </p>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => handleTabChange('booked')}
                        disabled={(isDemo && !isAdmin) || isProcessing}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'booked'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            } ${(isDemo && !isAdmin) || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <CheckCircle className="w-4 h-4" />
                        {t('tabBooked')}
                    </button>
                    <button
                        onClick={() => handleTabChange('cancelled')}
                        disabled={(isDemo && !isAdmin) || isProcessing}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'cancelled'
                            ? 'bg-rose-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            } ${(isDemo && !isAdmin) || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <XCircle className="w-4 h-4" />
                        {t('tabCancelled')}
                    </button>
                </div>

                {/* Tab Description */}
                {(!isDemo || isAdmin) && (
                    <div className={`p-4 rounded-xl border ${activeTab === 'booked'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-rose-50 border-rose-200'
                        }`}>
                        <p className={`text-sm ${activeTab === 'booked' ? 'text-blue-700' : 'text-rose-700'}`}>
                            {activeTab === 'booked'
                                ? t('tabBookedDesc')
                                : t('tabCancelledDesc')}
                        </p>
                    </div>
                )}

                {/* Upload Area */}
                <div
                    className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors ${(isDemo && !isAdmin)
                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                        : dragActive
                            ? 'border-blue-500 bg-blue-50'
                            : isIdle
                                ? 'border-gray-300 bg-white hover:border-gray-400'
                                : 'border-gray-200 bg-gray-50'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv,.xml,.xlsx,.xls"
                        multiple
                        onChange={handleChange}
                        className="hidden"
                        disabled={(isDemo && !isAdmin) || isProcessing}
                    />

                    {(isDemo && !isAdmin) ? (
                        <>
                            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg mb-2">{t('demoDragTitle')}</p>
                            <p className="text-gray-400 text-sm">{t('demoDragSub')}</p>
                        </>
                    ) : isIdle ? (
                        <>
                            <div className="flex justify-center gap-4 mb-4">
                                <Files className="w-10 h-10 text-blue-500" />
                            </div>
                            <p className="text-gray-700 text-lg mb-2">
                                {t('dragTitle')}
                            </p>
                            <p className="text-gray-500 text-sm mb-4">
                                <span dangerouslySetInnerHTML={{ __html: t.raw('dragSub') }} />
                            </p>
                            <button
                                onClick={handleButtonClick}
                                className={`px-6 py-2.5 text-white rounded-lg font-medium transition-colors ${activeTab === 'booked'
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                            >
                                {t('selectBtn')}
                            </button>
                            <div className="mt-4 pt-3 border-t border-gray-100">
                                <a
                                    href={activeTab === 'booked' ? '/template-booked.xlsx' : '/template-cancelled.xlsx'}
                                    download
                                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    {activeTab === 'booked' ? t('downloadBooking') : t('downloadCancel')}
                                </a>
                                <p className="text-xs text-gray-400 mt-1">
                                    {activeTab === 'booked'
                                        ? 'Sample has 7 columns: Code, Booking Date, Check-in, Check-out, Room, Revenue, Status'
                                        : 'Sample has 8 columns: includes Cancel Date column (required)'}
                                </p>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* File Queue / Progress */}
                {fileResults.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Queue Header */}
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Files className="w-4 h-4 text-gray-500" />
                                <h3 className="text-sm font-semibold text-gray-700">
                                    {isProcessing
                                        ? `Processing... (${successCount + errorCount}/${fileResults.length})`
                                        : `Completed ${successCount}/${fileResults.length} file`}
                                </h3>
                            </div>
                            {isDone && (
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-emerald-600 font-medium">
                                        {t('successful', { n: successCount })}
                                    </span>
                                    {errorCount > 0 && (
                                        <span className="text-xs text-rose-600 font-medium">
                                            {t('errors', { n: errorCount })}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-500">
                                        {t('totalRecords', { n: totalRecords })}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Progress bar */}
                        {isProcessing && (
                            <div className="h-1 bg-gray-100">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${((successCount + errorCount) / fileResults.length) * 100}%` }}
                                />
                            </div>
                        )}

                        {/* File list */}
                        <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
                            {fileResults.map((result, idx) => (
                                <div key={idx} className={`px-4 py-2.5 flex items-center gap-3 ${result.status === 'processing' ? 'bg-blue-50' : ''
                                    }`}>
                                    {/* Status icon */}
                                    {result.status === 'pending' && (
                                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                    )}
                                    {result.status === 'processing' && (
                                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                    )}
                                    {result.status === 'success' && (
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    )}
                                    {result.status === 'error' && (
                                        <XCircle className="w-5 h-5 text-rose-500" />
                                    )}

                                    {/* File info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-gray-900 truncate font-mono">
                                            {result.fileName}
                                        </div>
                                    </div>

                                    {/* Result message */}
                                    <div className="text-xs shrink-0">
                                        {result.status === 'pending' && (
                                            <span className="text-gray-400">{t('wait')}</span>
                                        )}
                                        {result.status === 'processing' && (
                                            <span className="text-blue-500">{t('processingFile')}</span>
                                        )}
                                        {result.status === 'success' && (
                                            <span className="text-emerald-600 font-medium">
                                                ✓ {result.message}
                                            </span>
                                        )}
                                        {result.status === 'error' && (
                                            <span className="text-rose-600">{result.message}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Done actions */}
                        {isDone && (
                            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center gap-3">
                                <button
                                    onClick={resetUpload}
                                    className={`px-5 py-2 text-white rounded-lg font-medium text-sm transition-colors ${activeTab === 'booked'
                                        ? 'bg-blue-600 hover:bg-blue-700'
                                        : 'bg-rose-600 hover:bg-rose-700'
                                        }`}
                                >
                                    {t('uploadMore')}
                                </button>
                                <a
                                    href="/data"
                                    className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
                                >
                                    {t('viewData')}
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* Format Guide */}
                {(!isDemo || isAdmin) && isIdle && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <FileCode className="w-5 h-5 text-blue-500" />
                                    <h2 className="text-base font-semibold text-gray-900">{t('xmlTitle')}</h2>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                    {t('xmlDesc')}
                                </p>
                                <div className="text-xs text-gray-500 space-y-1">
                                    <div>• ConfirmNum → Reservation ID</div>
                                    <div>• FromDate → Arrival</div>
                                    <div>• ToDate → Departure</div>
                                    <div>• NumRoom → Rooms</div>
                                    <div>• GNetRate → Rate/room/night</div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                                    <h2 className="text-base font-semibold text-gray-900">{t('csvTitle')}</h2>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                    {t('csvDesc')}
                                </p>
                                <div className="bg-gray-50 rounded p-2 overflow-x-auto">
                                    <code className="text-xs text-gray-700">
                                        reservation_id, booking_date,<br />
                                        arrival_date, departure_date,<br />
                                        rooms, revenue, status
                                    </code>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-sm text-amber-700">
                                <strong><Lightbulb className="w-4 h-4 inline mr-0.5" />Tip:</strong> Use Ctrl+A (select all) or Ctrl+Click to select multiple files at once.
                                System will automatically import each file in order.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
