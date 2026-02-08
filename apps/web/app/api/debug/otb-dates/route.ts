import prisma from '@/lib/prisma';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const hotelId = '82423729-fb42-45ad-be9e-4e163600998d';

        // 1. Check RESERVATIONS date ranges
        const resStats = await prisma.reservationsRaw.aggregate({
            where: { hotel_id: hotelId },
            _count: true,
            _min: { arrival_date: true, booking_date: true },
            _max: { arrival_date: true, booking_date: true, departure_date: true },
        });

        // 2. Count reservations with future arrivals (Feb 2026+)
        const futureRes = await prisma.reservationsRaw.count({
            where: {
                hotel_id: hotelId,
                arrival_date: { gte: new Date('2026-02-01') }
            }
        });

        // 3. Check DAILY_OTB date ranges
        const otbStats = await prisma.dailyOTB.aggregate({
            where: { hotel_id: hotelId },
            _count: true,
            _min: { stay_date: true, as_of_date: true },
            _max: { stay_date: true, as_of_date: true },
        });

        // 4. Get sample stay_dates for latest as_of
        const latestAsOf = otbStats._max.as_of_date;
        let sampleStayDates: { stay_date: Date; rooms_otb: number }[] = [];
        if (latestAsOf) {
            sampleStayDates = await prisma.dailyOTB.findMany({
                where: { hotel_id: hotelId, as_of_date: latestAsOf },
                orderBy: { stay_date: 'desc' },
                take: 5,
                select: { stay_date: true, rooms_otb: true },
            });
        }

        return NextResponse.json({
            reservations: {
                total: resStats._count,
                bookingDateRange: `${resStats._min.booking_date?.toISOString().split('T')[0]} → ${resStats._max.booking_date?.toISOString().split('T')[0]}`,
                arrivalDateRange: `${resStats._min.arrival_date?.toISOString().split('T')[0]} → ${resStats._max.arrival_date?.toISOString().split('T')[0]}`,
                maxDeparture: resStats._max.departure_date?.toISOString().split('T')[0],
                futureArrivals_Feb2026Plus: futureRes,
            },
            dailyOtb: {
                total: otbStats._count,
                asOfDateRange: `${otbStats._min.as_of_date?.toISOString().split('T')[0]} → ${otbStats._max.as_of_date?.toISOString().split('T')[0]}`,
                stayDateRange: `${otbStats._min.stay_date?.toISOString().split('T')[0]} → ${otbStats._max.stay_date?.toISOString().split('T')[0]}`,
            },
            latestOtbSample: sampleStayDates.map(d => ({
                stay_date: d.stay_date.toISOString().split('T')[0],
                rooms: d.rooms_otb,
            })),
            diagnosis: futureRes === 0
                ? "❌ PROBLEM: No reservations with arrival >= Feb 2026 in database! Need to import Feb 2026 reservation data."
                : `✅ Found ${futureRes} reservations with future arrivals. If OTB shows old dates, run rebuildAllOTB.`
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
