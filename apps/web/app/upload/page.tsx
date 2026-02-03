'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2, FileSpreadsheet, FileCode } from 'lucide-react';
import { ingestCSV } from '../actions/ingestCSV';
import { ingestXML } from '../actions/ingestXML';

const DEFAULT_HOTEL_ID = '123e4567-e89b-12d3-a456-426614174000';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
type ReportType = 'booked' | 'cancelled';
type FileType = 'csv' | 'xml';

export default function UploadPage() {
    const [activeTab, setActiveTab] = useState<ReportType>('booked');
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [message, setMessage] = useState<string>('');
    const [dragActive, setDragActive] = useState(false);
    const [resultDetails, setResultDetails] = useState<{ count?: number; reportDate?: string } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const detectFileType = (file: File): FileType => {
        if (file.name.endsWith('.xml')) return 'xml';
        return 'csv';
    };

    const handleFile = async (file: File) => {
        const fileType = detectFileType(file);

        if (fileType !== 'csv' && fileType !== 'xml') {
            setStatus('error');
            setMessage('Please upload a CSV or XML file.');
            return;
        }

        setStatus('uploading');
        setMessage(`Processing ${fileType.toUpperCase()} file...`);
        setResultDetails(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('hotelId', DEFAULT_HOTEL_ID);
            formData.append('reportType', activeTab);

            let result;
            if (fileType === 'xml') {
                result = await ingestXML(formData);
            } else {
                result = await ingestCSV(formData);
            }

            if (result.success) {
                setStatus('success');
                setMessage(`Successfully imported ${result.count} reservations!`);
                setResultDetails({
                    count: result.count,
                    reportDate: (result as { reportDate?: string }).reportDate
                });
            } else {
                setStatus('error');
                setMessage(result.message || 'Import failed.');
            }
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'An unexpected error occurred.');
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
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

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleButtonClick = () => {
        inputRef.current?.click();
    };

    const resetUpload = () => {
        setStatus('idle');
        setMessage('');
        setResultDetails(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const handleTabChange = (tab: ReportType) => {
        setActiveTab(tab);
        resetUpload();
    };

    return (
        <div className="p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-50">Upload Reservations</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Import PMS reservation reports (CSV or Crystal Reports XML)
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => handleTabChange('booked')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'booked'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                            }`}
                    >
                        <CheckCircle className="w-4 h-4" />
                        Booked Report
                    </button>
                    <button
                        onClick={() => handleTabChange('cancelled')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'cancelled'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                            }`}
                    >
                        <XCircle className="w-4 h-4" />
                        Cancelled Report
                    </button>
                </div>

                {/* Tab Description */}
                <div className={`mb-6 p-4 rounded-lg border ${activeTab === 'booked'
                    ? 'bg-blue-950/30 border-blue-800'
                    : 'bg-rose-950/30 border-rose-800'
                    }`}>
                    <p className="text-sm text-slate-300">
                        {activeTab === 'booked'
                            ? '📥 Upload "Reservation Booked On Date" report from PMS. This imports new bookings.'
                            : '📤 Upload "Reservation Cancelled" report from PMS. This marks bookings as cancelled.'}
                    </p>
                </div>

                {/* Upload Area */}
                <div
                    className={`relative border-2 border-dashed rounded-lg p-10 text-center transition-colors ${dragActive
                        ? 'border-blue-500 bg-blue-500/10'
                        : status === 'success'
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : status === 'error'
                                ? 'border-rose-500 bg-rose-500/10'
                                : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv,.xml"
                        onChange={handleChange}
                        className="hidden"
                    />

                    {status === 'idle' && (
                        <>
                            <div className="flex justify-center gap-4 mb-4">
                                <FileSpreadsheet className="w-10 h-10 text-emerald-500" />
                                <FileCode className="w-10 h-10 text-blue-500" />
                            </div>
                            <p className="text-slate-300 text-lg mb-2">
                                Drag & drop your CSV or XML file here
                            </p>
                            <p className="text-slate-500 text-sm mb-4">
                                Supports: .csv, .xml (Crystal Reports)
                            </p>
                            <button
                                onClick={handleButtonClick}
                                className={`px-6 py-2.5 text-white rounded-lg font-medium transition-colors ${activeTab === 'booked'
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                            >
                                Browse Files
                            </button>
                        </>
                    )}

                    {status === 'uploading' && (
                        <>
                            <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                            <p className="text-slate-300 text-lg">{message}</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                            <p className="text-emerald-400 text-lg mb-2">{message}</p>
                            {resultDetails?.reportDate && (
                                <p className="text-slate-400 text-sm mb-4">
                                    Report Date: {resultDetails.reportDate}
                                </p>
                            )}
                            <button
                                onClick={resetUpload}
                                className="px-6 py-2.5 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
                            >
                                Upload Another File
                            </button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                            <p className="text-rose-400 text-lg mb-4">{message}</p>
                            <button
                                onClick={resetUpload}
                                className="px-6 py-2.5 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
                            >
                                Try Again
                            </button>
                        </>
                    )}
                </div>

                {/* Format Guide */}
                <div className="mt-8 grid grid-cols-2 gap-4">
                    {/* XML Format */}
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <FileCode className="w-5 h-5 text-blue-500" />
                            <h2 className="text-base font-semibold text-slate-50">XML Format (Crystal Reports)</h2>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">
                            Export từ PMS với format Crystal Reports XML.
                        </p>
                        <div className="text-xs text-slate-500 space-y-1">
                            <div>• ConfirmNum → Reservation ID</div>
                            <div>• FromDate → Arrival</div>
                            <div>• ToDate → Departure</div>
                            <div>• NumRoom → Rooms</div>
                            <div>• GNetRate → Rate/room/night</div>
                        </div>
                    </div>

                    {/* CSV Format */}
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                            <h2 className="text-base font-semibold text-slate-50">CSV Format</h2>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">
                            File CSV với các cột:
                        </p>
                        <div className="bg-slate-950 rounded p-2 overflow-x-auto">
                            <code className="text-xs text-slate-300">
                                reservation_id, booking_date,<br />
                                arrival_date, departure_date,<br />
                                rooms, revenue, status
                            </code>
                        </div>
                    </div>
                </div>

                {/* Note */}
                <div className="mt-6 p-4 bg-amber-950/30 border border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-300">
                        <strong>Lưu ý:</strong> Với XML, <code className="bg-slate-800 px-1 rounded">GNetRate</code> là giá
                        <em> per room per night</em>. Hệ thống sẽ tự tính: <code className="bg-slate-800 px-1 rounded">Revenue = Rate × Rooms × Nights</code>
                    </p>
                </div>
            </div>
        </div>
    );
}
