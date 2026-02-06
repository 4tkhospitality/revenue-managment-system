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
    const [preview, setPreview] = useState<{ reservationCount: number; cancellationCount: number } | null>(null);
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
        } catch (err: any) {
            setError(err.message);
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
            const res = await fetch(`/api/data/delete-by-month?month=${month}&type=${dataType}`, {
                method: 'DELETE'
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete');
            }

            setResult(data.message);
            setPreview(null);
            setConfirmText('');

            // Reload after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setMonth('');
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
                className={`px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 ${className || ''}`}
            >
                🗑️ Xóa dữ liệu theo tháng
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                            <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
                                ⚠️ Xóa dữ liệu theo tháng
                            </h2>
                            <p className="text-sm text-red-600 mt-1">
                                Hành động này không thể hoàn tác!
                            </p>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4 space-y-4">
                            {result ? (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                                    ✅ {result}
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                                            onChange={(e) => setDataType(e.target.value as any)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                                        className="w-full py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? 'Đang kiểm tra...' : '🔍 Xem trước số lượng'}
                                    </button>

                                    {/* Preview Result */}
                                    {preview && (
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <p className="font-medium text-amber-800">
                                                📊 Dữ liệu sẽ bị xóa:
                                            </p>
                                            <ul className="mt-2 space-y-1 text-sm text-amber-700">
                                                <li>• Đặt phòng: <strong>{preview.reservationCount.toLocaleString()}</strong> bản ghi</li>
                                                <li>• Hủy phòng: <strong>{preview.cancellationCount.toLocaleString()}</strong> bản ghi</li>
                                            </ul>
                                        </div>
                                    )}

                                    {/* Confirmation Input */}
                                    {preview && (preview.reservationCount > 0 || preview.cancellationCount > 0) && (
                                        <div>
                                            <label className="block text-sm font-medium text-red-700 mb-1">
                                                Gõ <strong>"XÓA DỮ LIỆU"</strong> để xác nhận
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
                                            ❌ {error}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                {result ? 'Đóng' : 'Hủy'}
                            </button>

                            {!result && preview && (preview.reservationCount > 0 || preview.cancellationCount > 0) && (
                                <button
                                    onClick={handleDelete}
                                    disabled={confirmText !== 'XÓA DỮ LIỆU' || loading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? 'Đang xóa...' : '🗑️ Xóa vĩnh viễn'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
