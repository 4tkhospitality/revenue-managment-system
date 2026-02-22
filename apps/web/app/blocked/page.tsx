'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function BlockedPage() {
    useEffect(() => {
        // Auto sign out after showing message
        const timer = setTimeout(() => {
            signOut({ callbackUrl: '/auth/login?blocked=true' });
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Account has been disabled
                </h1>
                <p className="text-gray-600 mb-6">
                    Your account has been disabled by admin.
                    Please contact for support.
                </p>
                <div className="text-sm text-gray-400">
                    Signing out automatically...
                </div>
            </div>
        </div>
    );
}
