import prisma from '@/lib/prisma';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { OtbChart } from '@/components/dashboard/OtbChart';
import { RecommendationTable } from '@/components/dashboard/RecommendationTable';
import { DateUtils } from '@/lib/date';

export const dynamic = 'force-dynamic';

// Server Component - Direct DB Fetch
export default async function DashboardPage() {
    // Normalize to midnight for date-only comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hotelId = process.env.DEFAULT_HOTEL_ID || '123e4567-e89b-12d3-a456-426614174000';
    const hotelCapacity = 240; // TODO: Fetch from Hotel table

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

    // Calculate Avg Pickup T7 (Mock for now)
    const avgPickupT7 = 6.3; // TODO: Calculate from FeaturesDaily

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

    // Build table data directly from OTB (instead of priceRecommendations)
    // This shows actual OTB data immediately, ML recommendations will be added later
    const tableData = otbData.map((otb) => {
        const fcst = forecastData.find(
            (f) => f.stay_date.toISOString() === otb.stay_date.toISOString()
        );
        const remaining = hotelCapacity - otb.rooms_otb;
        const adr = otb.rooms_otb > 0 ? Number(otb.revenue_otb) / otb.rooms_otb : 0;

        return {
            id: otb.stay_date.toISOString(),
            stayDate: otb.stay_date.toISOString(),
            roomsOtb: otb.rooms_otb,
            remaining,
            forecast: fcst?.remaining_demand || 0,
            currentPrice: Math.round(adr), // Use ADR as current price
            recommendedPrice: Math.round(adr * 1.1), // Mock: +10% recommendation
            isStopSell: remaining <= 0,
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
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-50">Dashboard</h1>
                    <p className="text-sm text-slate-400">
                        Revenue Management System V01
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-400">
                        Data as of: {dataAsOf}
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {otbData.length === 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <p className="text-amber-400">
                        ⚠️ No OTB data found. Please <a href="/upload" className="underline hover:text-amber-300">upload reservations</a> and then <a href="/data" className="underline hover:text-amber-300">build OTB</a>.
                    </p>
                </div>
            )}

            {/* KPI Cards */}
            <KpiCards data={kpiData} />

            {/* OTB Chart */}
            <OtbChart data={chartData} />

            {/* Recommendation Table - now using OTB data directly */}
            <RecommendationTable
                data={tableData}
                onAccept={handleAccept}
                onOverride={handleOverride}
            />
        </div>
    );
}
