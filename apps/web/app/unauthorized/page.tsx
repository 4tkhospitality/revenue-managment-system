import Link from 'next/link';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Không có quyền truy cập
                </h1>
                <p className="text-gray-600 mb-6">
                    Bạn không có quyền truy cập trang này với vai trò hiện tại.
                    Vui lòng liên hệ quản trị viên để được cấp quyền.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Quay lại Dashboard
                </Link>
            </div>
        </div>
    );
}
