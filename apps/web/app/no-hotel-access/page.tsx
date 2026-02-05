'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';

export default function NoHotelAccessPage() {
    const { data: session, status } = useSession();
    const [checking, setChecking] = useState(true);
    const [hasMismatch, setHasMismatch] = useState(false);
    const [dbHotels, setDbHotels] = useState<string[]>([]);
    const [autoRefreshing, setAutoRefreshing] = useState(false);

    useEffect(() => {
        const checkAndRefresh = async () => {
            // Wait for session to load
            if (status === 'loading') return;

            if (!session?.user?.email) {
                setChecking(false);
                return;
            }

            try {
                // Check if user has hotels in DB
                const res = await fetch(`/api/debug-user?email=${encodeURIComponent(session.user.email)}`);
                const data = await res.json();

                if (data.found && data.hotelCount > 0) {
                    // User HAS hotels in DB but got redirected here = stale session
                    setHasMismatch(true);
                    setDbHotels(data.hotels?.map((h: any) => h.hotelName) || []);

                    // Auto-refresh by signing out
                    setAutoRefreshing(true);
                    setTimeout(async () => {
                        await signOut({ callbackUrl: '/auth/login' });
                    }, 2000);
                }
            } catch (error) {
                console.error('Error checking access:', error);
            } finally {
                setChecking(false);
            }
        };

        checkAndRefresh();
    }, [session, status]);

    const handleManualLogout = async () => {
        await signOut({ callbackUrl: '/auth/login' });
    };

    // Loading session
    if (status === 'loading' || checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
                </div>
            </div>
        );
    }

    // Auto-refreshing
    if (autoRefreshing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="text-6xl mb-4">🔄</div>
                    <h1 className="text-2xl font-bold text-green-700 mb-2">
                        Đang cập nhật phiên đăng nhập...
                    </h1>
                    <p className="text-gray-600 mb-4">
                        Phát hiện bạn đã được gán khách sạn: <strong>{dbHotels.join(', ')}</strong>
                    </p>
                    <p className="text-sm text-gray-500">
                        Đang đăng xuất để làm mới phiên... Vui lòng đăng nhập lại.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">🏨</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Chưa được gán khách sạn
                </h1>

                {hasMismatch ? (
                    <>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                            <p className="text-amber-800 font-medium mb-2">
                                ⚠️ Phát hiện session cũ!
                            </p>
                            <p className="text-amber-700 text-sm">
                                Bạn đã được gán: <strong>{dbHotels.join(', ')}</strong>
                            </p>
                        </div>
                        <button
                            onClick={handleManualLogout}
                            className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            🔄 Đăng xuất và đăng nhập lại
                        </button>
                    </>
                ) : (
                    <>
                        <p className="text-gray-600 mb-6">
                            Tài khoản của bạn chưa được gán quyền truy cập khách sạn nào.
                            Vui lòng liên hệ quản trị viên để được cấp quyền.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={handleManualLogout}
                                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Đăng nhập lại
                            </button>
                            <a
                                href="mailto:support@vleisure.com"
                                className="block w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Liên hệ hỗ trợ
                            </a>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
