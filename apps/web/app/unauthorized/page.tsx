import Link from 'next/link';
import { Lock } from 'lucide-react';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4"><Lock className="w-16 h-16 text-red-400 mx-auto" /></div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Unauthorized Access
                </h1>
                <p className="text-gray-600 mb-6">
                    You don't have permission to access this page with your current role.
                    Please contact admin for access.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
