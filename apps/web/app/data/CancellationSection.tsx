import prisma from '../../lib/prisma';
import { DateUtils } from '../../lib/date';
import { getCancellationStats30Days } from '../../lib/cachedStats';

export async function CancellationSection() {
    // Get cancellation stats for last 30 days (cached)
    const stats = await getCancellationStats30Days();

    // V01.1: Match status breakdown (still all-time for matching purposes)
    const matchStatusStats = await prisma.cancellationRaw.groupBy({
        by: ['match_status'],
        _count: { id: true }
    });

    const matchedCount = matchStatusStats.find(s => s.match_status === 'matched')?._count.id || 0;
    const unmatchedCount = matchStatusStats.find(s => s.match_status === 'unmatched')?._count.id || 0;
    const ambiguousCount = matchStatusStats.find(s => s.match_status === 'ambiguous')?._count.id || 0;
    const pendingCount = matchStatusStats.find(s => s.match_status === 'pending' || !s.match_status)?._count.id || 0;
    const totalMatchCount = matchedCount + unmatchedCount + ambiguousCount + pendingCount;
    const matchRate = totalMatchCount > 0 ? Math.round((matchedCount / totalMatchCount) * 100) : 0;

    // Recent cancellations - limit to 10 for faster loading
    const recentCancellations = await prisma.cancellationRaw.findMany({
        orderBy: { cancel_time: 'desc' },
        take: 10
    });

    return (
        <div className="bg-white border border-rose-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-rose-200 bg-rose-50">
                <h2 className="text-lg font-semibold text-rose-700">❌ Huỷ phòng gần đây</h2>
                <span className="text-xs text-gray-500">10 bản ghi mới nhất</span>
            </div>

            {/* KPI Cards (30 days) */}
            <div className="p-4 grid grid-cols-3 gap-4 border-b border-gray-100">
                <div className="text-center">
                    <div className="text-2xl font-bold text-rose-600">{stats.count}</div>
                    <div className="text-xs text-gray-500">Tổng lượt huỷ</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-rose-600">{stats.nights}</div>
                    <div className="text-xs text-gray-500">Room nights</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-rose-600">
                        {(stats.revenue / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-gray-500">Doanh thu mất</div>
                </div>
            </div>

            {/* V01.1: Match Status Breakdown */}
            <div className="p-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-gray-700">🔗 Trạng thái khớp (Bridge)</h3>
                    <span className="text-xs text-emerald-600 font-medium">{matchRate}% đã khớp</span>
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 px-2 py-1 bg-emerald-100 rounded text-center">
                        <div className="text-sm font-bold text-emerald-700">{matchedCount}</div>
                        <div className="text-[10px] text-emerald-600">Matched</div>
                    </div>
                    <div className="flex-1 px-2 py-1 bg-amber-100 rounded text-center">
                        <div className="text-sm font-bold text-amber-700">{unmatchedCount}</div>
                        <div className="text-[10px] text-amber-600">Unmatched</div>
                    </div>
                    <div className="flex-1 px-2 py-1 bg-purple-100 rounded text-center">
                        <div className="text-sm font-bold text-purple-700">{ambiguousCount}</div>
                        <div className="text-[10px] text-purple-600">Ambiguous</div>
                    </div>
                    {pendingCount > 0 && (
                        <div className="flex-1 px-2 py-1 bg-gray-100 rounded text-center">
                            <div className="text-sm font-bold text-gray-700">{pendingCount}</div>
                            <div className="text-[10px] text-gray-600">Pending</div>
                        </div>
                    )}
                </div>
            </div>

            {/* By Channel - Top 3 from all data */}
            {stats.topChannels.length > 0 && (
                <div className="p-3 border-b border-gray-100">
                    <h3 className="text-xs font-medium text-gray-700 mb-2">Top 3 kênh hủy nhiều nhất</h3>
                    <div className="flex flex-wrap gap-2">
                        {stats.topChannels.map((ch, idx) => (
                            <div key={idx} className="px-2 py-1 bg-rose-50 rounded text-xs">
                                <span className="text-gray-600">{ch.channel || 'Khác'}</span>
                                <span className="text-rose-600 font-medium ml-1">
                                    {(ch.revenue / 1000000).toFixed(1)}M
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Cancellations Table */}
            <div className="overflow-x-auto max-h-56">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-3 py-2 text-left text-gray-600 font-medium">Folio</th>
                            <th className="px-3 py-2 text-left text-gray-600 font-medium">Huỷ lúc</th>
                            <th className="px-3 py-2 text-left text-gray-600 font-medium">Đến</th>
                            <th className="px-3 py-2 text-right text-gray-600 font-medium">Đêm</th>
                            <th className="px-3 py-2 text-right text-gray-600 font-medium">DT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentCancellations.map((c) => (
                            <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="px-3 py-2 text-blue-600 font-mono text-xs">
                                    {c.folio_num}
                                </td>
                                <td className="px-3 py-2 text-gray-900 text-xs">
                                    {DateUtils.format(c.cancel_time, 'dd/MM HH:mm')}
                                </td>
                                <td className="px-3 py-2 text-gray-900 text-xs">
                                    {DateUtils.format(c.arrival_date, 'dd/MM/yy')}
                                </td>
                                <td className="px-3 py-2 text-gray-900 text-right">{c.nights}</td>
                                <td className="px-3 py-2 text-rose-600 text-right font-mono text-xs">
                                    {(Number(c.total_revenue) / 1000000).toFixed(1)}M
                                </td>
                            </tr>
                        ))}
                        {recentCancellations.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                    Chưa có dữ liệu huỷ phòng
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
