import prisma from '../../lib/prisma';
import { DateUtils } from '../../lib/date';
import { BuildOtbButton } from './BuildOtbButton';
import { BuildFeaturesButton } from './BuildFeaturesButton';
import { RunForecastButton } from './RunForecastButton';
import { ResetButton } from './ResetButton';
import { DeleteByMonthButton } from './DeleteByMonthButton';
import { ClearImportHistoryButton } from './ClearImportHistoryButton';
import { PaginatedImportJobs } from './PaginatedImportJobs';
import { CancellationSection } from './CancellationSection';
import { DataValidationBadge } from './DataValidationBadge';
import { getReservationStats30 } from '../../lib/cachedStats';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTierGate } from './DataTierGate';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

// Get active hotel
import { getActiveHotelId } from '@/lib/pricing/get-hotel';

// Performance: Parallel query helper - NOW FILTERS BY HOTEL_ID
async function fetchDataInspectorData() {
    const startTime = Date.now();

    // STEP 0: Get active hotel first
    const hotelId = await getActiveHotelId();
    console.log(`[Data Inspector] Active hotelId: ${hotelId}`);
    if (!hotelId) {
        return {
            hotelId: null,
            importJobs: [],
            reservationsByDate: [],
            allCancellationsForGroup: [],
            recentReservations: [],
            dailyOtb: [],
            totalReservations: 0,
            totalJobs: 0,
            totalOtbDays: 0,
            dateRange: { _min: { booking_date: null }, _max: { booking_date: null } },
            reservationStats: null,
        };
    }

    // BATCH 1: All queries filtered by hotel_id
    const [
        importJobs,
        reservationsByDate,
        allCancellationsForGroup,
        recentReservations,
        dailyOtb,
        totalReservations,
        totalJobs,
        totalOtbDays,
        dateRange,
        reservationStats,
    ] = await Promise.all([
        // Import jobs - FILTERED
        prisma.importJob.findMany({
            where: { hotel_id: hotelId },
            orderBy: { created_at: 'desc' },
            take: 10
        }),
        // Reservations by date - FILTERED
        prisma.reservationsRaw.groupBy({
            by: ['booking_date', 'status'],
            where: { hotel_id: hotelId },
            _count: { reservation_id: true },
            _sum: { revenue: true, rooms: true },
            orderBy: { booking_date: 'desc' },
            take: 10
        }),
        // Cancellations - UNIFIED from reservationsRaw (covers CSV/XLSX/XML)
        prisma.reservationsRaw.findMany({
            where: {
                hotel_id: hotelId,
                OR: [
                    { cancel_time: { not: null } },
                    { status: 'cancelled' },
                ],
            },
            select: {
                cancel_time: true,
                booking_date: true,
                arrival_date: true,
                departure_date: true,
                rooms: true,
                revenue: true,
            },
            orderBy: { cancel_time: 'desc' },
            take: 100,
        }),
        // Recent reservations - FILTERED
        prisma.reservationsRaw.findMany({
            where: { hotel_id: hotelId },
            orderBy: { booking_date: 'desc' },
            take: 10
        }),
        // Daily OTB - FILTERED
        prisma.dailyOTB.findMany({
            where: { hotel_id: hotelId },
            orderBy: { stay_date: 'asc' },
            take: 10
        }),
        // Total counts - FILTERED
        prisma.reservationsRaw.count({ where: { hotel_id: hotelId } }),
        prisma.importJob.count({ where: { hotel_id: hotelId } }),
        prisma.dailyOTB.count({ where: { hotel_id: hotelId } }),
        // Date range - FILTERED
        prisma.reservationsRaw.aggregate({
            where: { hotel_id: hotelId },
            _min: { booking_date: true },
            _max: { booking_date: true }
        }),
        // Cached stats
        getReservationStats30(hotelId),
    ]);

    console.log(`[Data Inspector] All queries completed in: ${Date.now() - startTime}ms`);

    return {
        hotelId,
        importJobs,
        reservationsByDate,
        allCancellationsForGroup,
        recentReservations,
        dailyOtb,
        totalReservations,
        totalJobs,
        totalOtbDays,
        dateRange,
        reservationStats,
    };
}

export default async function DataInspectorPage() {
    const pageStart = Date.now();
    const t = await getTranslations('dataPage');

    // Fetch all data in parallel
    const {
        hotelId,
        importJobs,
        reservationsByDate,
        allCancellationsForGroup,
        recentReservations,
        dailyOtb,
        totalReservations,
        totalJobs,
        totalOtbDays,
        dateRange,
        reservationStats,
    } = await fetchDataInspectorData();

    // Process cancellations (fast in-memory operation)
    const cancelDateMap = new Map<string, { date: Date; count: number; nights: number; revenue: number }>();
    for (const c of allCancellationsForGroup) {
        // Use cancel_time if available, fall back to booking_date
        const cancelDate = c.cancel_time || c.booking_date;
        if (!cancelDate) continue;
        const dateKey = DateUtils.format(cancelDate, 'yyyy-MM-dd');
        // Compute nights from arrival/departure
        const nights = c.arrival_date && c.departure_date
            ? Math.max(1, Math.ceil((new Date(c.departure_date).getTime() - new Date(c.arrival_date).getTime()) / (1000 * 60 * 60 * 24)))
            : (c.rooms || 1);
        const revenue = Number(c.revenue || 0);
        const existing = cancelDateMap.get(dateKey);
        if (existing) {
            existing.count++;
            existing.nights += nights;
            existing.revenue += revenue;
        } else {
            cancelDateMap.set(dateKey, {
                date: cancelDate,
                count: 1,
                nights,
                revenue,
            });
        }
    }
    const cancellationsByDate = Array.from(cancelDateMap.values())
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 10);

    const latestBookingDate = dateRange._max.booking_date;
    const earliestBookingDate = dateRange._min.booking_date;

    console.log(`[Data Inspector] Total page render: ${Date.now() - pageStart}ms`);

    return (
        <DataTierGate>
            <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                {/* Header */}
                <PageHeader
                    title={t('pageTitle')}
                    subtitle={t('pageSubtitle')}
                    badges={[
                        {
                            label: t('badgeReservations'),
                            value: totalReservations.toLocaleString(),
                            variant: 'info',
                        },
                        {
                            label: t('badgeImportJobs'),
                            value: totalJobs.toString(),
                            variant: 'neutral',
                        },
                        {
                            label: t('badgeOtbDays'),
                            value: totalOtbDays.toString(),
                            variant: 'success',
                        },
                    ]}
                />

                {/* Action Buttons - responsive */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <BuildOtbButton />
                    <BuildFeaturesButton />
                    <RunForecastButton />
                    <div className="w-full sm:w-auto sm:border-l sm:border-gray-300 sm:pl-4 flex flex-wrap gap-2 mt-2 sm:mt-0">
                        <ClearImportHistoryButton />
                        <ResetButton />
                        <DeleteByMonthButton />
                    </div>
                </div>

                {/* Data Quality Badge */}
                <DataValidationBadge />

                {/* Summary Cards - responsive grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm">
                        <div className="text-2xl sm:text-3xl font-bold text-blue-600">{totalReservations}</div>
                        <div className="text-sm text-gray-500">{t('totalReservations')}</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm">
                        <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{totalJobs}</div>
                        <div className="text-xs sm:text-sm text-gray-500">{t('importJobsLabel')}</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm">
                        <div className="text-2xl sm:text-3xl font-bold text-amber-600">{totalOtbDays}</div>
                        <div className="text-xs sm:text-sm text-gray-500">{t('otbDaysLabel')}</div>
                    </div>
                    {/* Data Freshness Card */}
                    <div className="bg-white border border-emerald-300 rounded-xl p-3 sm:p-4 shadow-sm">
                        <div className="text-xs sm:text-sm text-gray-500 mb-1">{t('dataRangeLabel')}</div>
                        <div className="text-lg font-bold text-emerald-600">
                            {latestBookingDate
                                ? DateUtils.format(latestBookingDate, 'dd/MM/yyyy')
                                : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                            {earliestBookingDate && latestBookingDate
                                ? t('fromTo', { from: DateUtils.format(earliestBookingDate, 'dd/MM/yy'), to: DateUtils.format(latestBookingDate, 'dd/MM/yy') })
                                : t('noData')}
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

                {/* 2-Column Layout: Recent Reservations + Cancellations - stack on mobile */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Recent Reservations */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-900">🏨 {t('recentBookings')}</h2>
                            <span className="text-xs text-gray-500">{t('recentBookingsDesc')}</span>
                        </div>

                        {/* Summary Stats (last 30 days) */}
                        {reservationStats && (
                            <>
                                <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-100">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {reservationStats.count}
                                        </div>
                                        <div className="text-xs text-gray-500">{t('bookings7d')}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-emerald-600">
                                            {reservationStats.rooms.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-gray-500">{t('roomNights')}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-amber-600">
                                            {(reservationStats.revenue / 1000000).toFixed(1)}M
                                        </div>
                                        <div className="text-xs text-gray-500">{t('revenue7d')}</div>
                                    </div>
                                </div>

                                {/* Top 3 Agents by Company Name */}
                                {reservationStats.topAgents.length > 0 && (
                                    <div className="p-3 border-b border-gray-100">
                                        <h3 className="text-xs font-medium text-gray-700 mb-2">🏆 {t('top3Agents')}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {reservationStats.topAgents.map((agent, idx) => (
                                                <div key={idx} className="px-2 py-1 bg-blue-50 rounded text-xs">
                                                    <span className="text-gray-600">{agent.company_name || t('direct')}</span>
                                                    <span className="text-blue-600 font-medium ml-1">
                                                        {(agent.revenue / 1000000).toFixed(1)}M
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="overflow-x-auto max-h-80">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-gray-600 font-medium">{t('resId')}</th>
                                        <th className="px-3 py-2 text-left text-gray-600 font-medium">{t('bookingDate')}</th>
                                        <th className="px-3 py-2 text-left text-gray-600 font-medium">{t('arrival')}</th>
                                        <th className="px-3 py-2 text-right text-gray-600 font-medium">{t('rooms')}</th>
                                        <th className="px-3 py-2 text-right text-gray-600 font-medium">{t('revenue')}</th>
                                        <th className="px-3 py-2 text-left text-gray-600 font-medium">{t('status')}</th>
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
                                                {t('noReservations')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Cancellations */}
                    <CancellationSection hotelId={hotelId ?? undefined} />
                </div>

                {/* Reservations by Booking Date */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900">📅 {t('resByBookingDate')}</h2>
                        <span className="text-xs text-gray-500">{t('last10days')}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">{t('bookDate')}</th>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">{t('statusCol')}</th>
                                    <th className="px-4 py-2 text-right text-gray-600 font-medium">{t('count')}</th>
                                    <th className="px-4 py-2 text-right text-gray-600 font-medium">{t('rooms')}</th>
                                    <th className="px-4 py-2 text-right text-gray-600 font-medium">{t('revenueCol')}</th>
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
                                                {stat.status === 'booked' ? t('booked') : t('cancelled')}
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
                                            {t('noReservations')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cancellations by Cancel Date */}
                <div className="bg-white border border-rose-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-rose-200 bg-rose-50">
                        <h2 className="text-lg font-semibold text-rose-700">📅 {t('cancelByDate')}</h2>
                        <span className="text-xs text-gray-500">{t('last10days')}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">{t('cancelDate')}</th>
                                    <th className="px-4 py-2 text-right text-gray-600 font-medium">{t('count')}</th>
                                    <th className="px-4 py-2 text-right text-gray-600 font-medium">{t('nights')}</th>
                                    <th className="px-4 py-2 text-right text-gray-600 font-medium">{t('lostRevenue')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cancellationsByDate.map((stat, idx) => (
                                    <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-2 text-gray-900">
                                            {DateUtils.format(stat.date, 'dd/MM/yyyy')}
                                        </td>
                                        <td className="px-4 py-2 text-rose-600 text-right font-medium">
                                            {stat.count}
                                        </td>
                                        <td className="px-4 py-2 text-gray-900 text-right">
                                            {stat.nights}
                                        </td>
                                        <td className="px-4 py-2 text-rose-600 font-mono text-right">
                                            {(stat.revenue / 1000000).toFixed(1)}M
                                        </td>
                                    </tr>
                                ))}
                                {cancellationsByDate.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                                            {t('noCancelData')}
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
                            <h2 className="text-lg font-semibold text-gray-900">📈 {t('dailyOtbTitle')}</h2>
                            <BuildOtbButton />
                        </div>
                        <span className="text-xs text-gray-400">
                            {totalOtbDays === 0 ? t('notBuilt') : t('daysCount', { n: totalOtbDays })}
                        </span>
                    </div>
                    <div className="overflow-x-auto max-h-64">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">{t('stayDate')}</th>
                                    <th className="px-4 py-2 text-right text-gray-600 font-medium">{t('roomsOtb')}</th>
                                    <th className="px-4 py-2 text-right text-gray-600 font-medium">{t('revenueOtb')}</th>
                                    <th className="px-4 py-2 text-right text-gray-600 font-medium">{t('adr')}</th>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">{t('asOf')}</th>
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
                                            {t('noOtbData')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DataTierGate>
    );
}
