import Link from 'next/link';

export default function NoHotelAccessPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">🏨</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Chưa được gán khách sạn
                </h1>
                <p className="text-gray-600 mb-6">
                    Tài khoản của bạn chưa được gán quyền truy cập khách sạn nào.
                    Vui lòng liên hệ quản trị viên để được cấp quyền.
                </p>
                <div className="space-y-3">
                    <Link
                        href="/auth/login"
                        className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Đăng nhập lại
                    </Link>
                    <a
                        href="mailto:support@vleisure.com"
                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Liên hệ hỗ trợ
                    </a>
                </div>
            </div>
        </div>
    );
}
