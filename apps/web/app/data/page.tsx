import prisma from '../../lib/prisma';
import { DateUtils } from '../../lib/date';
import Link from 'next/link';
import { BuildOtbButton } from './BuildOtbButton';
import { BuildFeaturesButton } from './BuildFeaturesButton';
import { RunForecastButton } from './RunForecastButton';
import { ResetButton } from './ResetButton';
import { DeleteByMonthButton } from './DeleteByMonthButton';
import { PaginatedImportJobs } from './PaginatedImportJobs';
import { CancellationSection } from './CancellationSection';
import { getReservationStats30 } from '../../lib/cachedStats';

export const dynamic = 'force-dynamic';

export default async function DataInspectorPage() {
    // Get import jobs
    const importJobs = await prisma.importJob.findMany({
        orderBy: { created_at: 'desc' },
        take: 10 // Reduced from 20 to 10
    });

    // Get reservation count by booking date - limit to 10 for faster loading
    const reservationsByDate = await prisma.reservationsRaw.groupBy({
        by: ['booking_date', 'status'],
        _count: { reservation_id: true },
        _sum: { revenue: true, rooms: true },
        orderBy: { booking_date: 'desc' },
        take: 10 // Reduced from 30 to 10
    });

    // Get recent reservations - limit to 10 for faster loading
    const recentReservations = await prisma.reservationsRaw.findMany({
        orderBy: { booking_date: 'desc' },
        take: 10 // Reduced from 50 to 10
    });

    // Get Daily OTB stats - limit to 10
    const dailyOtb = await prisma.dailyOTB.findMany({
        orderBy: { stay_date: 'asc' },
        take: 10 // Reduced from 30 to 10
    });

    // Total counts
    const totalReservations = await prisma.reservationsRaw.count();
    const totalJobs = await prisma.importJob.count();
    const totalOtbDays = await prisma.dailyOTB.count();

    // Data Freshness - Get min/max booking dates
    const dateRange = await prisma.reservationsRaw.aggregate({
        _min: { booking_date: true },
        _max: { booking_date: true }
    });
    const latestBookingDate = dateRange._max.booking_date;
    const earliestBookingDate = dateRange._min.booking_date;

    // Reservation summary stats (cached, 30 most recent)
    const reservationStats = await getReservationStats30();

    return (
        <div className="mx-auto max-w-[1400px] px-8 py-6 space-y-6">
            {/* Header - lighter */}
            <header
                className="rounded-2xl px-6 py-4 text-white flex items-center justify-between shadow-sm"
                style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
            >
                <div>
                    <h1 className="text-lg font-semibold">📊 Data Inspector</h1>
                    <p className="text-white/70 text-sm mt-1">
                        Xem dữ liệu đã import và trạng thái hệ thống
                    </p>
                </div>
                <Link
                    href="/dashboard"
                    className="px-4 py-2 bg-white/15 text-white rounded-lg hover:bg-white/25 transition-colors backdrop-blur-sm text-sm"
                >
                    ← Quay lại Dashboard
                </Link>
            </header>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 flex-wrap">
                <BuildOtbButton />
                <BuildFeaturesButton />
                <RunForecastButton />
                <div className="border-l border-gray-300 pl-4 flex gap-2">
                    <ResetButton />
                    <DeleteByMonthButton />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="text-3xl font-bold text-blue-600">{totalReservations}</div>
                    <div className="text-sm text-gray-500">Tổng Reservations</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="text-3xl font-bold text-emerald-600">{totalJobs}</div>
                    <div className="text-sm text-gray-500">Import Jobs</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="text-3xl font-bold text-amber-600">{totalOtbDays}</div>
                    <div className="text-sm text-gray-500">OTB Days Built</div>
                </div>
                {/* Data Freshness Card */}
                <div className="bg-white border border-emerald-300 rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">📅 Data Range (Booking Date)</div>
                    <div className="text-lg font-bold text-emerald-600">
                        {latestBookingDate
                            ? DateUtils.format(latestBookingDate, 'dd/MM/yyyy')
                            : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                        {earliestBookingDate && latestBookingDate
                            ? `Từ ${DateUtils.format(earliestBookingDate, 'dd/MM/yy')} → ${DateUtils.format(latestBookingDate, 'dd/MM/yy')}`
                            : 'Chưa có dữ liệu'}
                    </div>
                </div>
            </div>

            {/* Import Jobs - Paginated with Expand/Collapse */}
            <PaginatedImportJobs
                initialJobs={importJobs.map(j => ({
                    job_id: j.job_id,
                    file_name: j.file_name,
                    status: j.status,
                    created_at: j.created_at,
                    finished_at: j.finished_at,
                    error_summary: j.error_summary,
                }))}
                totalCount={totalJobs}
            />

            {/* 2-Column Layout: Recent Reservations + Cancellations */}
            <div className="grid grid-cols-2 gap-6">
                {/* Recent Reservations */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900">🏨 Đặt phòng gần đây</h2>
                        <span className="text-xs text-gray-500">10 bản ghi mới nhất</span>
                    </div>

                    {/* Summary Stats (30 most recent bookings) */}
                    <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-100">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {reservationStats.count}
                            </div>
                            <div className="text-xs text-gray-500">Lượt đặt (30 ngày)</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600">
                                {reservationStats.rooms.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">Room-nights</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-amber-600">
                                {(reservationStats.revenue / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-xs text-gray-500">Doanh thu</div>
                        </div>
                    </div>

                    {/* Top 3 Agents by Company Name */}
                    {reservationStats.topAgents.length > 0 && (
                        <div className="p-3 border-b border-gray-100">
                            <h3 className="text-xs font-medium text-gray-700 mb-2">Top 3 đại lý (30 ngày)</h3>
                            <div className="flex flex-wrap gap-2">
                                {reservationStats.topAgents.map((agent, idx) => (
                                    <div key={idx} className="px-2 py-1 bg-blue-50 rounded text-xs">
                                        <span className="text-gray-600">{agent.company_name || 'Trực tiếp'}</span>
                                        <span className="text-blue-600 font-medium ml-1">
                                            {(agent.revenue / 1000000).toFixed(1)}M
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto max-h-80">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-600 font-medium">Mã ĐP</th>
                                    <th className="px-3 py-2 text-left text-gray-600 font-medium">Ngày đặt</th>
                                    <th className="px-3 py-2 text-left text-gray-600 font-medium">Đến</th>
                                    <th className="px-3 py-2 text-right text-gray-600 font-medium">Phòng</th>
                                    <th className="px-3 py-2 text-right text-gray-600 font-medium">DT</th>
                                    <th className="px-3 py-2 text-left text-gray-600 font-medium">TT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentReservations.map((res) => (
                                    <tr key={res.id} className="border-t border-gray-100 hover:bg-gray-50">
                                        <td className="px-3 py-2 text-blue-600 font-mono text-xs">
                                            {res.reservation_id}
                                        </td>
                                        <td className="px-3 py-2 text-gray-900 text-xs">
                                            {DateUtils.format(res.booking_date, 'dd/MM/yy')}
                                        </td>
                                        <td className="px-3 py-2 text-gray-900 text-xs">
                                            {DateUtils.format(res.arrival_date, 'dd/MM/yy')}
                                        </td>
                                        <td className="px-3 py-2 text-gray-900 text-right">
                                            {res.rooms}
                                        </td>
                                        <td className="px-3 py-2 text-gray-900 text-right font-mono text-xs">
                                            {(Number(res.revenue) / 1000000).toFixed(1)}M
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-0.5 rounded text-xs ${res.status === 'booked' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-rose-100 text-rose-700'
                                                }`}>
                                                {res.status === 'booked' ? '✓' : '✗'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {recentReservations.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                            Chưa có reservations nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cancellations */}
                <CancellationSection />
            </div>

            {/* Reservations by Booking Date */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">📅 Reservations theo Ngày đặt</h2>
                    <span className="text-xs text-gray-500">10 ngày gần nhất</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-gray-600 font-medium">Ngày đặt</th>
                                <th className="px-4 py-2 text-left text-gray-600 font-medium">Trạng thái</th>
                                <th className="px-4 py-2 text-right text-gray-600 font-medium">Số lượng</th>
                                <th className="px-4 py-2 text-right text-gray-600 font-medium">Phòng</th>
                                <th className="px-4 py-2 text-right text-gray-600 font-medium">Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservationsByDate.map((stat, idx) => (
                                <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-2 text-gray-900">
                                        {DateUtils.format(stat.booking_date, 'dd/MM/yyyy')}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${stat.status === 'booked' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-rose-100 text-rose-700'
                                            }`}>
                                            {stat.status === 'booked' ? 'Đã đặt' : 'Đã huỷ'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-gray-900 text-right">
                                        {stat._count.reservation_id}
                                    </td>
                                    <td className="px-4 py-2 text-gray-900 text-right">
                                        {stat._sum.rooms || 0}
                                    </td>
                                    <td className="px-4 py-2 text-gray-900 font-mono text-right">
                                        {(Number(stat._sum.revenue || 0) / 1000000).toFixed(1)}M
                                    </td>
                                </tr>
                            ))}
                            {reservationsByDate.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                        Chưa có reservations nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Daily OTB */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">📈 Daily OTB (On The Books)</h2>
                        <BuildOtbButton />
                    </div>
                    <span className="text-xs text-gray-400">
                        {totalOtbDays === 0 ? 'Chưa build OTB' : `${totalOtbDays} ngày`}
                    </span>
                </div>
                <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-gray-600 font-medium">Ngày ở</th>
                                <th className="px-4 py-2 text-right text-gray-600 font-medium">Phòng OTB</th>
                                <th className="px-4 py-2 text-right text-gray-600 font-medium">Doanh thu OTB</th>
                                <th className="px-4 py-2 text-right text-gray-600 font-medium">ADR</th>
                                <th className="px-4 py-2 text-left text-gray-600 font-medium">Tính đến</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyOtb.map((otb, idx) => {
                                const revenueNum = Number(otb.revenue_otb);
                                const adr = otb.rooms_otb > 0 ? Math.round(revenueNum / otb.rooms_otb) : 0;
                                return (
                                    <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-2 text-gray-900">
                                            {DateUtils.format(otb.stay_date, 'dd/MM/yyyy')}
                                        </td>
                                        <td className="px-4 py-2 text-gray-900 text-right">{otb.rooms_otb}</td>
                                        <td className="px-4 py-2 text-gray-900 text-right font-mono">
                                            {(revenueNum / 1000000).toFixed(1)}M
                                        </td>
                                        <td className="px-4 py-2 text-gray-900 text-right font-mono">
                                            {adr.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2 text-gray-400 text-xs">
                                            {DateUtils.format(otb.as_of_date, 'dd/MM/yyyy')}
                                        </td>
                                    </tr>
                                );
                            })}
                            {dailyOtb.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                        Chưa có OTB data. Cần chạy &quot;Build OTB&quot; sau khi import reservations.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
