import prisma from '@/lib/prisma';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { OtbChart } from '@/components/dashboard/OtbChart';
import { RecommendationTable } from '@/components/dashboard/RecommendationTable';
import { DateUtils } from '@/lib/date';
import { PricingLogic } from '@/lib/pricing';
import { PageHeader } from '@/components/shared/PageHeader';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

// Performance: Parallel query helper
async function fetchDashboardData(hotelId: string, today: Date) {
    const startTime = Date.now();

    // BATCH 1: Get dates first - run in parallel
    const [
        hotel,
        latestReservation,
        latestCancellation,
        latestOtbDate,
        latestForecastDate
    ] = await Promise.all([
        // Hotel settings
        prisma.hotel.findUnique({
            where: { hotel_id: hotelId },
            select: { hotel_id: true, name: true, capacity: true }
        }),
        // Latest reservation date
        prisma.reservationsRaw.findFirst({
            where: { hotel_id: hotelId },
            orderBy: { booking_date: 'desc' },
            select: { booking_date: true }
        }),
        // Latest cancellation date
        prisma.cancellationRaw.findFirst({
            where: { hotel_id: hotelId },
            orderBy: { cancel_time: 'desc' },
            select: { cancel_time: true, as_of_date: true }
        }),
        // Latest OTB date (query FIRST to use for subsequent queries)
        prisma.dailyOTB.findFirst({
            where: { hotel_id: hotelId },
            orderBy: { as_of_date: 'desc' },
            select: { as_of_date: true }
        }),
        // Latest forecast date
        prisma.demandForecast.findFirst({
            where: { hotel_id: hotelId },
            orderBy: { as_of_date: 'desc' },
            select: { as_of_date: true }
        }),
    ]);

    console.log(`[Dashboard] Batch 1 queries: ${Date.now() - startTime}ms`);

    // Use latest as_of_date (NOT today) - fixes the data display issue
    const actualOtbDate = latestOtbDate?.as_of_date || today;
    const actualForecastDate = latestForecastDate?.as_of_date || today;

    // BATCH 2: Fetch data using actual latest dates
    const batch2Start = Date.now();
    const [
        otbData,
        forecastData,
        featuresData
    ] = await Promise.all([
        prisma.dailyOTB.findMany({
            where: { hotel_id: hotelId, as_of_date: actualOtbDate },
            orderBy: { stay_date: 'asc' },
            take: 60,
        }),
        prisma.demandForecast.findMany({
            where: { hotel_id: hotelId, as_of_date: actualForecastDate },
            take: 60,
        }),
        // Features with STLY data
        prisma.featuresDaily.findMany({
            where: { hotel_id: hotelId, as_of_date: actualOtbDate },
            select: {
                stay_date: true,
                pickup_t7: true,
                pickup_t3: true,
                pace_vs_ly: true,
                remaining_supply: true,
                stly_is_approx: true,
            },
            orderBy: { stay_date: 'asc' },
            take: 60,
        }),
    ]);
    console.log(`[Dashboard] Batch 2 data queries: ${Date.now() - batch2Start}ms`);
    console.log(`[Dashboard DEBUG] actualOtbDate: ${actualOtbDate?.toISOString()}, otbData.length: ${otbData.length}, first stay_date: ${otbData[0]?.stay_date?.toISOString() || 'N/A'}`);

    // BATCH 3: Cancellation query (depends on OTB reference date)
    const batch3Start = Date.now();
    const referenceDate = otbData.length > 0 ? new Date(otbData[0].as_of_date) : today;
    referenceDate.setHours(0, 0, 0, 0);
    const thirtyDaysFromRef = new Date(referenceDate);
    thirtyDaysFromRef.setDate(thirtyDaysFromRef.getDate() + 30);

    const cancelledReservations = await prisma.reservationsRaw.findMany({
        where: {
            hotel_id: hotelId,
            cancel_time: { not: null },
            arrival_date: { gte: referenceDate, lte: thirtyDaysFromRef }
        },
        select: { rooms: true, revenue: true, arrival_date: true, departure_date: true }
    });

    console.log(`[Dashboard] Batch 3 cancellation query: ${Date.now() - batch3Start}ms`);
    console.log(`[Dashboard] Total query time: ${Date.now() - startTime}ms`);

    return {
        hotel,
        latestReservation,
        latestCancellation,
        otbData,
        forecastData,
        featuresData,
        cancelledReservations,
        referenceDate
    };
}

// Server Component - Direct DB Fetch
export default async function DashboardPage({
    searchParams
}: {
    searchParams: Promise<{ as_of_date?: string }>
}) {
    const pageStart = Date.now();
    const params = await searchParams;

    // Support time-travel via URL params
    let today: Date;
    if (params.as_of_date) {
        today = new Date(params.as_of_date);
    } else {
        today = new Date();
    }
    today.setHours(0, 0, 0, 0);

    // Get active hotel from cookie/session (deterministic, no auto-detect)
    const hotelId = await getActiveHotelId();

    // Check if hotel is configured
    if (!hotelId) {
        return (
            <div className="p-6">
                <div className="bg-amber-950/30 border border-amber-800 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-bold text-amber-400 mb-2">⚠️ Chưa cấu hình Hotel ID</h2>
                    <p className="text-amber-300 mb-4">
                        Vui lòng thêm <code className="bg-gray-100 px-2 py-1 rounded text-gray-700">DEFAULT_HOTEL_ID</code> vào file <code className="bg-gray-100 px-2 py-1 rounded text-gray-700">.env</code>
                    </p>
                    <a href="/settings" className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                        Đi tới Settings →
                    </a>
                </div>
            </div>
        );
    }

    // Fetch all data in parallel batches
    const {
        hotel,
        latestReservation,
        latestCancellation,
        otbData,
        forecastData,
        featuresData,
        cancelledReservations,
    } = await fetchDashboardData(hotelId, today);

    // Check if hotel exists and has capacity set
    const needsSetup = !hotel || !hotel.capacity;
    const hotelCapacity = hotel?.capacity || 0;
    const hotelName = hotel?.name || 'Chưa đặt tên';

    // Calculate KPIs
    const totalOtb = otbData.reduce((sum, d) => sum + d.rooms_otb, 0);
    const remainingSupply = Math.max(0, hotelCapacity * 30 - totalOtb);
    const totalForecast = forecastData.reduce((sum, d) => sum + (d.remaining_demand || 0), 0);
    const avgPickupT7 = featuresData.length > 0
        ? featuresData.reduce((sum, f) => sum + (f.pickup_t7 || 0), 0) / featuresData.length
        : 0;

    // Calculate cancelled room-nights and lost revenue
    let cancelledRooms = 0;
    let lostRevenue = 0;
    for (const res of cancelledReservations) {
        const nights = Math.max(1, Math.ceil(
            (new Date(res.departure_date).getTime() - new Date(res.arrival_date).getTime()) / (1000 * 60 * 60 * 24)
        ));
        cancelledRooms += (res.rooms || 1) * nights;
        lostRevenue += Number(res.revenue || 0);
    }

    const kpiData = {
        roomsOtb: totalOtb,
        remainingSupply,
        avgPickupT7,
        forecastDemand: totalForecast,
        cancelledRooms,
        lostRevenue,
    };

    // Build features lookup map
    const featuresMap = new Map<string, typeof featuresData[0]>();
    for (const f of featuresData) {
        featuresMap.set(f.stay_date.toISOString(), f);
    }

    // Fetch Chart Data (OTB This Year vs Last Year using real features data)
    const chartData = otbData.slice(0, 14).map((d) => {
        const feature = featuresMap.get(d.stay_date.toISOString());
        // STLY = current OTB - pace_vs_ly (if pace_vs_ly exists)
        const stlyRooms = feature?.pace_vs_ly != null
            ? d.rooms_otb - feature.pace_vs_ly
            : null;
        return {
            date: DateUtils.format(d.stay_date, 'MMM dd'),
            otbCurrent: d.rooms_otb,
            otbLastYear: stlyRooms, // Real STLY data (null if not available)
        };
    });

    // Build table data directly from OTB with Pricing Engine
    const tableData = otbData.map((otb) => {
        const fcst = forecastData.find(
            (f) => f.stay_date.toISOString() === otb.stay_date.toISOString()
        );
        const remaining = hotelCapacity - otb.rooms_otb;
        const adr = otb.rooms_otb > 0 ? Number(otb.revenue_otb) / otb.rooms_otb : 0;
        const forecastDemand = fcst?.remaining_demand || 0;

        // Use Pricing Engine to calculate recommended price
        const pricingResult = PricingLogic.optimize(
            Math.round(adr),
            forecastDemand,
            remaining
        );

        return {
            id: otb.stay_date.toISOString(),
            stayDate: otb.stay_date.toISOString(),
            roomsOtb: otb.rooms_otb,
            remaining,
            forecast: forecastDemand,
            currentPrice: Math.round(adr),
            recommendedPrice: pricingResult.recommendedPrice || Math.round(adr),
            isStopSell: remaining <= 0 || pricingResult.recommendedPrice === null,
        };
    });

    // Server Actions for Accept/Override decisions
    const handleAccept = async (id: string) => {
        'use server';
        const { submitDecision } = await import('@/app/actions/submitDecision');
        const stayDate = new Date(id);
        const asOfDate = new Date();
        asOfDate.setHours(0, 0, 0, 0);

        // Calculate recommended price from OTB
        const otbRow = await import('@/lib/prisma').then(m => m.default.dailyOTB.findFirst({
            where: { stay_date: stayDate, hotel_id: hotelId }
        }));
        const recommendedPrice = otbRow && otbRow.rooms_otb > 0
            ? Math.round(Number(otbRow.revenue_otb) / otbRow.rooms_otb * 1.1)
            : 100;

        await submitDecision(hotelId, stayDate, asOfDate, 'accept', recommendedPrice);
    };

    const handleOverride = async (id: string) => {
        'use server';
        const { submitDecision } = await import('@/app/actions/submitDecision');
        const stayDate = new Date(id);
        const asOfDate = new Date();
        asOfDate.setHours(0, 0, 0, 0);

        // Calculate current price from OTB
        const otbRow = await import('@/lib/prisma').then(m => m.default.dailyOTB.findFirst({
            where: { stay_date: stayDate, hotel_id: hotelId }
        }));
        const currentPrice = otbRow && otbRow.rooms_otb > 0
            ? Math.round(Number(otbRow.revenue_otb) / otbRow.rooms_otb)
            : 100;

        // Override requires a reason
        await submitDecision(hotelId, stayDate, asOfDate, 'override', currentPrice, 'User rejected recommendation');
    };

    // Get data timestamp for display
    const dataAsOf = otbData.length > 0
        ? DateUtils.format(otbData[0].as_of_date, 'MMM dd, yyyy')
        : null;

    console.log(`[Dashboard] Total page render: ${Date.now() - pageStart}ms`);

    return (
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Time-Travel Date Picker */}
            <Suspense fallback={<div className="h-12" />}>
                <DashboardHeader currentAsOfDate={dataAsOf ? otbData[0]?.as_of_date?.toISOString().split('T')[0] : undefined} />
            </Suspense>

            {/* Header */}
            <PageHeader
                title={hotelName}
                subtitle={`Dashboard • ${hotelCapacity} phòng`}
                badges={[
                    {
                        label: 'Dữ liệu đặt phòng',
                        value: latestReservation
                            ? DateUtils.format(latestReservation.booking_date, 'dd/MM/yyyy')
                            : 'Chưa có',
                        variant: latestReservation ? 'success' : 'warning',
                    },
                    {
                        label: 'Dữ liệu hủy phòng',
                        value: latestCancellation
                            ? DateUtils.format(latestCancellation.as_of_date, 'dd/MM/yyyy')
                            : 'Chưa có',
                        variant: latestCancellation ? 'danger' : 'warning',
                    },
                    {
                        label: 'OTB',
                        value: dataAsOf || 'Chưa có dữ liệu',
                        variant: dataAsOf ? 'neutral' : 'warning',
                    },
                ]}
            />

            {/* Main Content - already on light bg from layout */}
            {/* Empty State */}
            {otbData.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-700">
                        ⚠️ Chưa có dữ liệu OTB. Vui lòng <a href="/upload" className="underline hover:text-amber-900">tải lên reservations</a> và <a href="/data" className="underline hover:text-amber-900">build OTB</a>.
                    </p>
                </div>
            )}

            {/* Setup Warning */}
            {needsSetup && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                    <p className="text-rose-700">
                        ⚠️ Chưa cấu hình khách sạn! <a href="/settings" className="underline hover:text-rose-900">Vào Cài đặt</a> để nhập Số phòng và các thông tin khác.
                    </p>
                </div>
            )}

            {/* KPI Cards */}
            <KpiCards data={kpiData} hotelCapacity={hotelCapacity} />

            {/* OTB Chart */}
            <OtbChart data={chartData} />

            {/* Recommendation Table */}
            <RecommendationTable
                data={tableData}
                onAccept={handleAccept}
                onOverride={handleOverride}
            />
        </div>
    );
}
