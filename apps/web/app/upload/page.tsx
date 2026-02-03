'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2, FileSpreadsheet, FileCode } from 'lucide-react';
import { ingestCSV } from '../actions/ingestCSV';
import { ingestXML } from '../actions/ingestXML';

const getHotelId = () => {
    const hotelId = process.env.NEXT_PUBLIC_DEFAULT_HOTEL_ID;
    if (!hotelId) {
        console.warn('NEXT_PUBLIC_DEFAULT_HOTEL_ID not configured');
    }
    return hotelId || '';
};

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
            setMessage('Vui lòng tải lên file CSV hoặc XML.');
            return;
        }

        setStatus('uploading');
        setMessage(`Đang xử lý file ${fileType.toUpperCase()}...`);
        setResultDetails(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('hotelId', getHotelId());
            formData.append('reportType', activeTab);

            let result;
            if (fileType === 'xml') {
                result = await ingestXML(formData);
            } else {
                result = await ingestCSV(formData);
            }

            if (result.success) {
                setStatus('success');
                setMessage(`Đã import thành công ${result.count} reservations!`);
                setResultDetails({
                    count: result.count,
                    reportDate: (result as { reportDate?: string }).reportDate
                });
            } else {
                setStatus('error');
                setMessage(result.message || 'Import thất bại.');
            }
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Đã xảy ra lỗi.');
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
        <div className="mx-auto max-w-[1400px] px-8 py-6 space-y-6">
            {/* Header Card - lighter */}
            <header
                className="rounded-2xl px-6 py-4 text-white shadow-sm"
                style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
            >
                <h1 className="text-lg font-semibold">Tải lên Reservations</h1>
                <p className="text-white/70 text-sm mt-1">
                    Import báo cáo đặt phòng từ PMS (CSV hoặc Crystal Reports XML)
                </p>
            </header>

            <div className="max-w-3xl mx-auto space-y-6">
                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => handleTabChange('booked')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'booked'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <CheckCircle className="w-4 h-4" />
                        Báo cáo Đặt phòng
                    </button>
                    <button
                        onClick={() => handleTabChange('cancelled')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'cancelled'
                            ? 'bg-rose-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <XCircle className="w-4 h-4" />
                        Báo cáo Huỷ phòng
                    </button>
                </div>

                {/* Tab Description */}
                <div className={`p-4 rounded-xl border ${activeTab === 'booked'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-rose-50 border-rose-200'
                    }`}>
                    <p className={`text-sm ${activeTab === 'booked' ? 'text-blue-700' : 'text-rose-700'}`}>
                        {activeTab === 'booked'
                            ? '📥 Upload báo cáo "Reservation Booked On Date" từ PMS. File này chứa các booking mới.'
                            : '📤 Upload báo cáo "Reservation Cancelled" từ PMS. File này đánh dấu các booking đã huỷ.'}
                    </p>
                </div>

                {/* Upload Area */}
                <div
                    className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors ${dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : status === 'success'
                            ? 'border-emerald-500 bg-emerald-50'
                            : status === 'error'
                                ? 'border-rose-500 bg-rose-50'
                                : 'border-gray-300 bg-white hover:border-gray-400'
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
                            <p className="text-gray-700 text-lg mb-2">
                                Kéo thả file CSV hoặc XML vào đây
                            </p>
                            <p className="text-gray-500 text-sm mb-4">
                                Hỗ trợ: .csv, .xml (Crystal Reports)
                            </p>
                            <button
                                onClick={handleButtonClick}
                                className={`px-6 py-2.5 text-white rounded-lg font-medium transition-colors ${activeTab === 'booked'
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                            >
                                Chọn file
                            </button>
                        </>
                    )}

                    {status === 'uploading' && (
                        <>
                            <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                            <p className="text-gray-700 text-lg">{message}</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                            <p className="text-emerald-600 text-lg mb-2">{message}</p>
                            {resultDetails?.reportDate && (
                                <p className="text-gray-500 text-sm mb-4">
                                    Ngày báo cáo: {resultDetails.reportDate}
                                </p>
                            )}
                            <button
                                onClick={resetUpload}
                                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                            >
                                Upload file khác
                            </button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                            <p className="text-rose-600 text-lg mb-4">{message}</p>
                            <button
                                onClick={resetUpload}
                                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                            >
                                Thử lại
                            </button>
                        </>
                    )}
                </div>

                {/* Format Guide */}
                <div className="grid grid-cols-2 gap-4">
                    {/* XML Format */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <FileCode className="w-5 h-5 text-blue-500" />
                            <h2 className="text-base font-semibold text-gray-900">XML Format (Crystal Reports)</h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                            Export từ PMS với format Crystal Reports XML.
                        </p>
                        <div className="text-xs text-gray-500 space-y-1">
                            <div>• ConfirmNum → Reservation ID</div>
                            <div>• FromDate → Arrival</div>
                            <div>• ToDate → Departure</div>
                            <div>• NumRoom → Rooms</div>
                            <div>• GNetRate → Rate/room/night</div>
                        </div>
                    </div>

                    {/* CSV Format */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                            <h2 className="text-base font-semibold text-gray-900">CSV Format</h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                            File CSV với các cột:
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

                {/* Note */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-700">
                        <strong>Lưu ý:</strong> Với XML, <code className="bg-amber-100 px-1 rounded">GNetRate</code> là giá
                        <em> per room per night</em>. Hệ thống sẽ tự tính: <code className="bg-amber-100 px-1 rounded">Revenue = Rate × Rooms × Nights</code>
                    </p>
                </div>
            </div>
        </div>
    );
}
