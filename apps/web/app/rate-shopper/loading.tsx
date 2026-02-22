export default function RateShopperLoading() {
    return (
        <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-6 animate-pulse">
            {/* Sub Navigation */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-2">
                <div className="flex gap-2">
                    <div className="h-9 w-28 bg-gray-200 rounded-lg" />
                    <div className="h-9 w-32 bg-gray-100 rounded-lg" />
                </div>
                <div className="h-9 w-28 bg-gray-200 rounded-lg" />
            </div>

            {/* Header */}
            <div>
                <div className="h-7 w-52 bg-gray-200 rounded-lg" />
                <div className="h-4 w-72 bg-gray-100 rounded mt-2" />
            </div>

            {/* Loading indicator */}
            <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-3 px-6 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-blue-700 font-medium text-sm">Loading Rate Shopper...</span>
                </div>
            </div>

            {/* Offset Tabs */}
            <div className="flex gap-2">
                {['+7d', '+14d', '+30d', '+60d', '+90d'].map((label, i) => (
                    <div
                        key={i}
                        className="flex flex-col items-center px-5 py-3 rounded-xl min-w-[110px] border"
                        style={{
                            backgroundColor: i === 0 ? '#204184' : '#fff',
                            borderColor: i === 0 ? '#204184' : '#E5E7EB',
                        }}
                    >
                        <div className={`h-4 w-14 rounded ${i === 0 ? 'bg-white/30' : 'bg-gray-200'}`} />
                        <div className={`h-3 w-10 rounded mt-2 ${i === 0 ? 'bg-white/20' : 'bg-gray-100'}`} />
                        <div className={`h-3 w-16 rounded-full mt-2 ${i === 0 ? 'bg-white/20' : 'bg-gray-100'}`} />
                    </div>
                ))}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gray-100" />
                        <div>
                            <div className="h-3 w-12 bg-gray-100 rounded mb-2" />
                            <div className="h-5 w-16 bg-gray-200 rounded" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Table skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <div className="h-5 w-36 bg-gray-200 rounded" />
                </div>
                <div className="divide-y divide-gray-100">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="px-5 py-4 flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-gray-200" />
                            <div className="h-4 w-32 bg-gray-200 rounded" />
                            <div className="h-4 w-16 bg-gray-100 rounded ml-auto" />
                            <div className="h-4 w-20 bg-gray-200 rounded" />
                            <div className="h-4 w-14 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
