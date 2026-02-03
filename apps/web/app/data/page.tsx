import prisma from '../../lib/prisma';
import { DateUtils } from '../../lib/date';
import Link from 'next/link';
import { BuildOtbButton } from './BuildOtbButton';
import { BuildFeaturesButton } from './BuildFeaturesButton';
import { RunForecastButton } from './RunForecastButton';
import { ResetButton } from './ResetButton';
import { PaginatedImportJobs } from './PaginatedImportJobs';

export const dynamic = 'force-dynamic';

export default async function DataInspectorPage() {
    // Get import jobs
    const importJobs = await prisma.importJob.findMany({
        orderBy: { created_at: 'desc' },
        take: 20
    });

    // Get reservation count by booking date
    const reservationStats = await prisma.reservationsRaw.groupBy({
        by: ['booking_date', 'status'],
        _count: { reservation_id: true },
        _sum: { revenue: true, rooms: true },
        orderBy: { booking_date: 'desc' },
        take: 30
    });

    // Get recent reservations
    const recentReservations = await prisma.reservationsRaw.findMany({
        orderBy: { booking_date: 'desc' },
        take: 50
    });

    // Get Daily OTB stats
    const dailyOtb = await prisma.dailyOTB.findMany({
        orderBy: { stay_date: 'asc' },
        take: 30
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

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-50">📊 Data Inspector</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Xem dữ liệu đã import và trạng thái hệ thống
                    </p>
                </div>
                <Link
                    href="/dashboard"
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                    ← Back to Dashboard
                </Link>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 flex-wrap">
                <BuildOtbButton />
                <BuildFeaturesButton />
                <RunForecastButton />
                <div className="border-l border-slate-700 pl-4">
                    <ResetButton />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                    <div className="text-3xl font-bold text-blue-400">{totalReservations}</div>
                    <div className="text-sm text-slate-400">Total Reservations</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                    <div className="text-3xl font-bold text-emerald-400">{totalJobs}</div>
                    <div className="text-sm text-slate-400">Import Jobs</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                    <div className="text-3xl font-bold text-amber-400">{totalOtbDays}</div>
                    <div className="text-sm text-slate-400">OTB Days Built</div>
                </div>
                {/* Data Freshness Card */}
                <div className="bg-slate-900 border border-emerald-800 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">📅 Data Range (Booking Date)</div>
                    <div className="text-lg font-bold text-emerald-400">
                        {latestBookingDate
                            ? DateUtils.format(latestBookingDate, 'dd/MM/yyyy')
                            : 'N/A'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        {earliestBookingDate && latestBookingDate
                            ? `Từ ${DateUtils.format(earliestBookingDate, 'dd/MM/yy')} → ${DateUtils.format(latestBookingDate, 'dd/MM/yy')}`
                            : 'Chưa có dữ liệu'}
                    </div>
                </div>
            </div>

            {/* Import Jobs - Paginated */}
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

            {/* Reservations by Booking Date */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-50">📅 Reservations by Booking Date</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-2 text-left text-slate-400">Booking Date</th>
                                <th className="px-4 py-2 text-left text-slate-400">Status</th>
                                <th className="px-4 py-2 text-right text-slate-400">Count</th>
                                <th className="px-4 py-2 text-right text-slate-400">Rooms</th>
                                <th className="px-4 py-2 text-right text-slate-400">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservationStats.map((stat, idx) => (
                                <tr key={idx} className="border-t border-slate-800 hover:bg-slate-800/30">
                                    <td className="px-4 py-2 text-slate-300">
                                        {DateUtils.format(stat.booking_date, 'dd/MM/yyyy')}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${stat.status === 'booked' ? 'bg-emerald-500/20 text-emerald-400' :
                                            'bg-rose-500/20 text-rose-400'
                                            }`}>
                                            {stat.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-slate-300 text-right">
                                        {stat._count.reservation_id}
                                    </td>
                                    <td className="px-4 py-2 text-slate-300 text-right">
                                        {stat._sum.rooms || 0}
                                    </td>
                                    <td className="px-4 py-2 text-slate-300 text-right font-mono">
                                        {(Number(stat._sum.revenue || 0) / 1000000).toFixed(1)}M
                                    </td>
                                </tr>
                            ))}
                            {reservationStats.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                        Chưa có reservations nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Reservations */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-50">🏨 Recent Reservations (Last 50)</h2>
                </div>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800/50 sticky top-0">
                            <tr>
                                <th className="px-3 py-2 text-left text-slate-400">Confirm#</th>
                                <th className="px-3 py-2 text-left text-slate-400">Booking</th>
                                <th className="px-3 py-2 text-left text-slate-400">Arrival</th>
                                <th className="px-3 py-2 text-left text-slate-400">Departure</th>
                                <th className="px-3 py-2 text-right text-slate-400">Rooms</th>
                                <th className="px-3 py-2 text-right text-slate-400">Revenue</th>
                                <th className="px-3 py-2 text-left text-slate-400">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentReservations.map((res) => (
                                <tr key={res.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                                    <td className="px-3 py-2 text-blue-400 font-mono text-xs">
                                        {res.reservation_id}
                                    </td>
                                    <td className="px-3 py-2 text-slate-300 text-xs">
                                        {DateUtils.format(res.booking_date, 'dd/MM/yy')}
                                    </td>
                                    <td className="px-3 py-2 text-slate-300 text-xs">
                                        {DateUtils.format(res.arrival_date, 'dd/MM/yy')}
                                    </td>
                                    <td className="px-3 py-2 text-slate-300 text-xs">
                                        {DateUtils.format(res.departure_date, 'dd/MM/yy')}
                                    </td>
                                    <td className="px-3 py-2 text-slate-300 text-right">
                                        {res.rooms}
                                    </td>
                                    <td className="px-3 py-2 text-slate-300 text-right font-mono text-xs">
                                        {(Number(res.revenue) / 1000000).toFixed(1)}M
                                    </td>
                                    <td className="px-3 py-2">
                                        <span className={`px-2 py-0.5 rounded text-xs ${res.status === 'booked' ? 'bg-emerald-500/20 text-emerald-400' :
                                            'bg-rose-500/20 text-rose-400'
                                            }`}>
                                            {res.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {recentReservations.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                        Chưa có reservations nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Daily OTB */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold text-slate-50">📈 Daily OTB (On The Books)</h2>
                        <BuildOtbButton />
                    </div>
                    <span className="text-xs text-slate-500">
                        {totalOtbDays === 0 ? 'Chưa build OTB' : `${totalOtbDays} days`}
                    </span>
                </div>
                <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-slate-400">Stay Date</th>
                                <th className="px-4 py-2 text-right text-slate-400">Rooms OTB</th>
                                <th className="px-4 py-2 text-right text-slate-400">Revenue OTB</th>
                                <th className="px-4 py-2 text-right text-slate-400">ADR</th>
                                <th className="px-4 py-2 text-left text-slate-400">As Of</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyOtb.map((otb, idx) => {
                                const revenueNum = Number(otb.revenue_otb);
                                const adr = otb.rooms_otb > 0 ? Math.round(revenueNum / otb.rooms_otb) : 0;
                                return (
                                    <tr key={idx} className="border-t border-slate-800 hover:bg-slate-800/30">
                                        <td className="px-4 py-2 text-slate-300">
                                            {DateUtils.format(otb.stay_date, 'dd/MM/yyyy')}
                                        </td>
                                        <td className="px-4 py-2 text-slate-300 text-right">{otb.rooms_otb}</td>
                                        <td className="px-4 py-2 text-slate-300 text-right font-mono">
                                            {(revenueNum / 1000000).toFixed(1)}M
                                        </td>
                                        <td className="px-4 py-2 text-slate-300 text-right font-mono">
                                            {adr.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2 text-slate-400 text-xs">
                                            {DateUtils.format(otb.as_of_date, 'dd/MM/yyyy')}
                                        </td>
                                    </tr>
                                );
                            })}
                            {dailyOtb.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                        Chưa có OTB data. Cần chạy buildDailyOTB sau khi import reservations.
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
