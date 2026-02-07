'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';

export default function NoHotelAccessPage() {
    const { data: session, status } = useSession();
    const [autoRefreshing, setAutoRefreshing] = useState(false);

    useEffect(() => {
        // If user somehow lands here but has hotels in session, redirect
        if (status === 'loading') return;

        if (session?.user?.accessibleHotels && session.user.accessibleHotels.length > 0) {
            // User has hotels but session is stale, refresh
            setAutoRefreshing(true);
            setTimeout(async () => {
                await signOut({ callbackUrl: '/auth/login' });
            }, 1500);
            return;
        }

        // Auto-refresh: sign out and re-login to trigger auto-assign Demo Hotel
        if (session?.user?.email) {
            setAutoRefreshing(true);
            setTimeout(async () => {
                await signOut({ callbackUrl: '/auth/login' });
            }, 2000);
        }
    }, [session, status]);

    // Loading
    if (status === 'loading') {
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
                    <h1 className="text-2xl font-bold text-blue-700 mb-2">
                        Đang cập nhật quyền truy cập...
                    </h1>
                    <p className="text-gray-600 mb-4">
                        Hệ thống đang tự động gán khách sạn cho bạn. Vui lòng đăng nhập lại.
                    </p>
                    <div className="animate-pulse text-sm text-gray-400">
                        Đang chuyển hướng...
                    </div>
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
                <p className="text-gray-600 mb-6">
                    Tài khoản của bạn chưa được gán quyền truy cập khách sạn nào.
                    Vui lòng thử đăng nhập lại hoặc liên hệ quản trị viên.
                </p>
                <div className="space-y-3">
                    <button
                        onClick={() => signOut({ callbackUrl: '/auth/login' })}
                        className="block w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        🔄 Đăng nhập lại
                    </button>
                    <a
                        href="https://zalo.me/0778602953"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                    >
                        💬 Liên hệ hỗ trợ qua Zalo
                    </a>
                </div>
            </div>
        </div>
    );
}
