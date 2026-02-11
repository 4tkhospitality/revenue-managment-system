'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface DeleteByMonthButtonProps {
    className?: string;
}

export function DeleteByMonthButton({ className }: DeleteByMonthButtonProps) {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [month, setMonth] = useState('');
    const [dataType, setDataType] = useState<'reservations' | 'cancellations' | 'all'>('reservations');
    const [includeOtb, setIncludeOtb] = useState(true);
    const [preview, setPreview] = useState<{ reservationCount: number; cancellationCount: number; otbCount: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Only show for super_admin
    if (!session?.user?.isAdmin) {
        return null;
    }

    const handlePreview = async () => {
        if (!month) {
            setError('Vui lòng chọn tháng');
            return;
        }

        setLoading(true);
        setError(null);
        setPreview(null);

        try {
            const res = await fetch(`/api/data/delete-by-month?month=${month}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to get preview');
            }

            setPreview(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (confirmText !== 'XÓA DỮ LIỆU') {
            setError('Vui lòng gõ đúng "XÓA DỮ LIỆU" để xác nhận');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/data/delete-by-month?month=${month}&type=${dataType}&includeOtb=${includeOtb}`, {
                method: 'DELETE'
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete');
            }

            setResult(data.message);
            setPreview(null);
            setConfirmText('');

            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setMonth('');
        setIncludeOtb(true);
        setPreview(null);
        setConfirmText('');
        setResult(null);
        setError(null);
    };

    // Generate month options (last 12 months)
    const monthOptions: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthOptions.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 hover:border-red-300 ${className || ''}`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Xóa theo tháng
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Xóa dữ liệu theo tháng</h2>
                                <p className="text-sm text-red-600">Hành động này không thể hoàn tác</p>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4 space-y-4">
                            {result ? (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
                                    ✓ {result}
                                    <p className="text-sm mt-2">Đang tải lại trang...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Month Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Chọn tháng cần xóa
                                        </label>
                                        <select
                                            value={month}
                                            onChange={(e) => {
                                                setMonth(e.target.value);
                                                setPreview(null);
                                                setConfirmText('');
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">-- Chọn tháng --</option>
                                            {monthOptions.map(m => (
                                                <option key={m} value={m}>
                                                    Tháng {m.split('-')[1]}/{m.split('-')[0]}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Data Type Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Loại dữ liệu
                                        </label>
                                        <select
                                            value={dataType}
                                            onChange={(e) => setDataType(e.target.value as 'reservations' | 'cancellations' | 'all')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="reservations">Chỉ đặt phòng</option>
                                            <option value="cancellations">Chỉ hủy phòng</option>
                                            <option value="all">Tất cả</option>
                                        </select>
                                    </div>

                                    {/* Preview Button */}
                                    <button
                                        onClick={handlePreview}
                                        disabled={!month || loading}
                                        className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                        {loading ? 'Đang kiểm tra...' : 'Xem trước số lượng'}
                                    </button>

                                    {/* Preview Result */}
                                    {preview && (
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <p className="font-medium text-amber-800">
                                                Dữ liệu sẽ bị xóa:
                                            </p>
                                            <ul className="mt-2 space-y-1 text-sm text-amber-700">
                                                <li>• Đặt phòng: <strong>{preview.reservationCount.toLocaleString()}</strong> bản ghi</li>
                                                <li>• Hủy phòng: <strong>{preview.cancellationCount.toLocaleString()}</strong> bản ghi</li>
                                                {preview.otbCount > 0 && (
                                                    <li>• OTB snapshots: <strong>{preview.otbCount.toLocaleString()}</strong> bản ghi
                                                        {!includeOtb && <span className="text-amber-500"> (sẽ KHÔNG xóa)</span>}
                                                    </li>
                                                )}
                                            </ul>

                                            {/* OTB Checkbox */}
                                            {preview.otbCount > 0 && (
                                                <label className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-200 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={includeOtb}
                                                        onChange={(e) => setIncludeOtb(e.target.checked)}
                                                        className="w-4 h-4 rounded border-amber-400 text-red-600 focus:ring-red-500"
                                                    />
                                                    <span className="text-sm text-amber-800 font-medium">
                                                        Xóa luôn OTB + Features ({preview.otbCount.toLocaleString()} bản ghi)
                                                    </span>
                                                </label>
                                            )}
                                        </div>
                                    )}

                                    {/* Confirmation Input */}
                                    {preview && (preview.reservationCount > 0 || preview.cancellationCount > 0) && (
                                        <div>
                                            <label className="block text-sm font-medium text-red-700 mb-1">
                                                Gõ <strong>&quot;XÓA DỮ LIỆU&quot;</strong> để xác nhận
                                            </label>
                                            <input
                                                type="text"
                                                value={confirmText}
                                                onChange={(e) => setConfirmText(e.target.value)}
                                                placeholder="XÓA DỮ LIỆU"
                                                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                                            />
                                        </div>
                                    )}

                                    {/* Error */}
                                    {error && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                            ✗ {error}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                {result ? 'Đóng' : 'Hủy'}
                            </button>

                            {!result && preview && (preview.reservationCount > 0 || preview.cancellationCount > 0) && (
                                <button
                                    onClick={handleDelete}
                                    disabled={confirmText !== 'XÓA DỮ LIỆU' || loading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
