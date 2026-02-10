export default function DashboardLoading() {
    return (
        <div className="p-4 md:p-6 space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-7 w-48 bg-gray-200 rounded-lg" />
                    <div className="h-4 w-64 bg-gray-100 rounded mt-2" />
                </div>
                <div className="h-9 w-32 bg-gray-200 rounded-lg" />
            </div>

            {/* KPI Cards - 4 columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        <div className="h-3 w-20 bg-gray-100 rounded mb-3" />
                        <div className="h-8 w-24 bg-gray-200 rounded-lg mb-2" />
                        <div className="h-3 w-16 bg-gray-100 rounded" />
                    </div>
                ))}
            </div>

            {/* Loading indicator */}
            <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-3 px-6 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-blue-700 font-medium text-sm">Đang tải dữ liệu Dashboard...</span>
                </div>
            </div>

            {/* OTB Chart skeleton */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-5 w-40 bg-gray-200 rounded" />
                    <div className="flex gap-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-7 w-12 bg-gray-100 rounded" />
                        ))}
                    </div>
                </div>
                <div className="h-64 bg-gray-50 rounded-lg flex items-end justify-center gap-1 p-4">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-gray-200 rounded-t flex-1"
                            style={{ height: `${30 + Math.sin(i * 0.5) * 40 + Math.random() * 30}%` }}
                        />
                    ))}
                </div>
            </div>

            {/* Table skeleton */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="h-5 w-56 bg-gray-200 rounded" />
                </div>
                <div className="divide-y divide-gray-100">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="px-4 py-3 flex gap-4">
                            <div className="h-4 w-20 bg-gray-100 rounded" />
                            <div className="h-4 w-12 bg-gray-100 rounded" />
                            <div className="h-4 w-16 bg-gray-100 rounded" />
                            <div className="h-4 w-20 bg-gray-200 rounded" />
                            <div className="h-4 w-20 bg-gray-100 rounded" />
                            <div className="h-4 flex-1 bg-gray-50 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
