import prisma from '../../lib/prisma';
import { DateUtils } from '../../lib/date';

export async function CancellationSection() {
    // Get total cancellation stats (all time, not just 30 days)
    // The issue was cancel_time in future years (2025/2026) didn't match 30 days filter
    const cancellationStats = await prisma.cancellationRaw.aggregate({
        _count: { id: true },
        _sum: { nights: true, total_revenue: true }
    });

    // Group by channel (all time)
    const byChannel = await prisma.cancellationRaw.groupBy({
        by: ['channel'],
        _count: { id: true },
        _sum: { nights: true, total_revenue: true },
        orderBy: { _sum: { total_revenue: 'desc' } },
        take: 5
    });

    // Recent cancellations - limit to 10 for faster loading
    const recentCancellations = await prisma.cancellationRaw.findMany({
        orderBy: { cancel_time: 'desc' },
        take: 10 // Reduced from 20 to 10
    });

    const totalNights = cancellationStats._sum.nights || 0;
    const totalRevenue = Number(cancellationStats._sum.total_revenue || 0);
    const totalCount = cancellationStats._count.id || 0;

    return (
        <div className="bg-white border border-rose-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-rose-200 bg-rose-50">
                <h2 className="text-lg font-semibold text-rose-700">❌ Huỷ phòng gần đây</h2>
                <span className="text-xs text-gray-500">10 bản ghi mới nhất</span>
            </div>

            {/* KPI Cards */}
            <div className="p-4 grid grid-cols-3 gap-4 border-b border-gray-100">
                <div className="text-center">
                    <div className="text-2xl font-bold text-rose-600">{totalCount}</div>
                    <div className="text-xs text-gray-500">Lượt huỷ</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-rose-600">{totalNights}</div>
                    <div className="text-xs text-gray-500">Room nights</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-rose-600">
                        {(totalRevenue / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-gray-500">Doanh thu mất</div>
                </div>
            </div>

            {/* By Channel - compact */}
            {byChannel.length > 0 && (
                <div className="p-3 border-b border-gray-100">
                    <h3 className="text-xs font-medium text-gray-700 mb-2">Theo kênh</h3>
                    <div className="flex flex-wrap gap-2">
                        {byChannel.slice(0, 3).map((ch, idx) => {
                            const revenue = Number(ch._sum.total_revenue || 0);
                            return (
                                <div key={idx} className="px-2 py-1 bg-rose-50 rounded text-xs">
                                    <span className="text-gray-600">{ch.channel || 'Khác'}</span>
                                    <span className="text-rose-600 font-medium ml-1">
                                        {(revenue / 1000000).toFixed(1)}M
                                    </span>
                                </div>
                            );
                        })}
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
