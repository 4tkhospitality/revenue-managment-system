import prisma from '@/lib/prisma';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { OtbChart } from '@/components/dashboard/OtbChart';
import { RecommendationTable } from '@/components/dashboard/RecommendationTable';
import { DateUtils } from '@/lib/date';
import { PricingLogic } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

// Server Component - Direct DB Fetch
export default async function DashboardPage() {
    // Normalize to midnight for date-only comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hotelId = process.env.DEFAULT_HOTEL_ID;

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

    // Fetch hotel settings from database
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId }
    });

    // Check if hotel exists and has capacity set
    const needsSetup = !hotel || !hotel.capacity;
    const hotelCapacity = hotel?.capacity || 0;
    const hotelName = hotel?.name || 'Chưa đặt tên';

    // Fetch OTB Data - try today first, fallback to latest available
    let otbData = await prisma.dailyOTB.findMany({
        where: {
            hotel_id: hotelId,
            as_of_date: today,
        },
        orderBy: { stay_date: 'asc' },
        take: 60, // Get 60 days for table filtering
    });

    // Fallback: if no OTB for today, get latest available OTB
    if (otbData.length === 0) {
        const latestOtb = await prisma.dailyOTB.findFirst({
            where: { hotel_id: hotelId },
            orderBy: { as_of_date: 'desc' },
        });
        if (latestOtb) {
            otbData = await prisma.dailyOTB.findMany({
                where: {
                    hotel_id: hotelId,
                    as_of_date: latestOtb.as_of_date,
                },
                orderBy: { stay_date: 'asc' },
                take: 60,
            });
        }
    }

    const totalOtb = otbData.reduce((sum, d) => sum + d.rooms_otb, 0);
    const remainingSupply = Math.max(0, hotelCapacity * 30 - totalOtb);

    // Fetch Forecast Data - try today first, fallback to any available
    let forecastData = await prisma.demandForecast.findMany({
        where: {
            hotel_id: hotelId,
            as_of_date: today,
        },
        take: 60,
    });

    // Fallback: if no forecast for today, get latest available
    if (forecastData.length === 0) {
        const latestForecast = await prisma.demandForecast.findFirst({
            where: { hotel_id: hotelId },
            orderBy: { as_of_date: 'desc' },
        });
        if (latestForecast) {
            forecastData = await prisma.demandForecast.findMany({
                where: {
                    hotel_id: hotelId,
                    as_of_date: latestForecast.as_of_date,
                },
                take: 60,
            });
        }
    }

    const totalForecast = forecastData.reduce((sum, d) => sum + (d.remaining_demand || 0), 0);

    // Calculate Avg Pickup T7 from features_daily (if data exists)
    const featuresData = await prisma.featuresDaily.findMany({
        where: { hotel_id: hotelId },
        select: { pickup_t7: true },
        take: 30,
    });
    const avgPickupT7 = featuresData.length > 0
        ? featuresData.reduce((sum, f) => sum + (f.pickup_t7 || 0), 0) / featuresData.length
        : 0; // Show 0 if no data yet

    const kpiData = {
        roomsOtb: totalOtb,
        remainingSupply,
        avgPickupT7,
        forecastDemand: totalForecast,
    };

    // Fetch Chart Data (OTB This Year vs Last Year)
    const chartData = otbData.slice(0, 14).map((d) => ({
        date: DateUtils.format(d.stay_date, 'MMM dd'),
        otbCurrent: d.rooms_otb,
        otbLastYear: Math.floor(d.rooms_otb * (0.8 + Math.random() * 0.4)), // Mock LY
    }));

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
        : DateUtils.format(today, 'MMM dd, yyyy');

    return (
        <div className="mx-auto max-w-[1400px] px-8 py-6 space-y-6">
            {/* Header Brand Card - lighter, thinner */}
            <header
                className="rounded-2xl px-6 py-4 text-white shadow-sm"
                style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">{hotelName}</h1>
                        <p className="text-white/70 text-sm">
                            Dashboard • {hotelCapacity} phòng
                        </p>
                    </div>
                    <div className="px-3 py-1.5 bg-white/10 rounded-lg text-sm backdrop-blur-sm">
                        Dữ liệu: {dataAsOf}
                    </div>
                </div>
            </header>

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
