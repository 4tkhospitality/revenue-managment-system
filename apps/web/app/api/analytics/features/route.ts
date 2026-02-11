import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getActiveHotelId } from '../../../../lib/pricing/get-hotel';

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const hotelIdParam = url.searchParams.get('hotelId');
    const asOfParam = url.searchParams.get('asOf');
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');

    const hotelId = hotelIdParam || await getActiveHotelId();
    if (!hotelId) {
        return NextResponse.json({ error: 'No active hotel' }, { status: 400 });
    }

    // Get hotel capacity
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { capacity: true, name: true },
    });
    if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    // Determine as_of_date - use latest from featuresDaily (not OTB) for consistency
    let asOfDate: Date;
    if (asOfParam) {
        asOfDate = new Date(asOfParam);
    } else {
        // Query latest as_of_date from featuresDaily table (not OTB)
        const latest = await prisma.featuresDaily.findFirst({
            where: { hotel_id: hotelId },
            orderBy: { as_of_date: 'desc' },
            select: { as_of_date: true },
        });
        if (!latest) {
            return NextResponse.json({
                error: 'No features data. Run Build Features first.',
                hint: 'Go to /data page and click "Build Features"'
            }, { status: 404 });
        }
        asOfDate = latest.as_of_date;
    }

    // Build date filters
    const dateWhere: Record<string, unknown> = {};
    if (fromParam) dateWhere.gte = new Date(fromParam);
    if (toParam) dateWhere.lte = new Date(toParam);

    // Fetch features + OTB together
    const features = await prisma.featuresDaily.findMany({
        where: {
            hotel_id: hotelId,
            as_of_date: asOfDate,
            ...(Object.keys(dateWhere).length > 0 ? { stay_date: dateWhere } : {}),
        },
        orderBy: { stay_date: 'asc' },
    });

    // If explicit date requested but no features built for that date — warn clearly
    if (features.length === 0 && asOfParam) {
        const latestFeat = await prisma.featuresDaily.findFirst({
            where: { hotel_id: hotelId },
            orderBy: { as_of_date: 'desc' },
            select: { as_of_date: true },
        });

        // Must include ALL fields the client expects (hotelName, capacity, asOfDates)
        // otherwise data.asOfDates.map() crashes on undefined
        const asOfDates = await prisma.dailyOTB.findMany({
            where: { hotel_id: hotelId },
            select: { as_of_date: true },
            distinct: ['as_of_date'],
            orderBy: { as_of_date: 'desc' },
            take: 90,
        });

        return NextResponse.json({
            hotelName: hotel.name,
            capacity: hotel.capacity,
            asOfDate: asOfParam,
            asOfDates: asOfDates.map(d => d.as_of_date.toISOString().split('T')[0]),
            rows: [],
            warning: 'NO_FEATURES_FOR_DATE',
            hint: `Chưa build features cho ngày ${asOfParam}. Vào /data → Build Features.`,
            latestAvailable: latestFeat?.as_of_date?.toISOString().split('T')[0] || null,
            kpi: { occ7: 0, occ14: 0, occ30: 0, pace7: null, pace30: null, totalPickup7d: 0, totalPickup1d: 0 },
            quality: { totalRows: 0, withT7: 0, withSTLY: 0, approxSTLY: 0, completeness: 0, stlyCoverage: 0 },
        });
    }

    const otb = await prisma.dailyOTB.findMany({
        where: {
            hotel_id: hotelId,
            as_of_date: asOfDate,
            ...(Object.keys(dateWhere).length > 0 ? { stay_date: dateWhere } : {}),
        },
        orderBy: { stay_date: 'asc' },
    });

    // Build OTB lookup
    const otbMap = new Map<string, { rooms_otb: number; revenue_otb: number }>();
    for (const o of otb) {
        otbMap.set(o.stay_date.toISOString().split('T')[0], {
            rooms_otb: o.rooms_otb,
            revenue_otb: Number(o.revenue_otb),
        });
    }

    // Merge features + OTB
    const rows = features.map(f => {
        const key = f.stay_date.toISOString().split('T')[0];
        const otbData = otbMap.get(key);
        return {
            stay_date: key,
            dow: f.dow,
            is_weekend: f.is_weekend,
            month: f.month,
            rooms_otb: otbData?.rooms_otb ?? 0,
            revenue_otb: otbData?.revenue_otb ?? 0,
            // D16: STLY revenue fields from features_daily
            stly_rooms_otb: f.pace_vs_ly !== null ? (otbData?.rooms_otb ?? 0) - (f.pace_vs_ly ?? 0) : null,
            stly_revenue_otb: f.stly_revenue_otb ? Number(f.stly_revenue_otb) : null,
            pickup_t30: f.pickup_t30,
            pickup_t15: f.pickup_t15,
            pickup_t7: f.pickup_t7,
            pickup_t5: f.pickup_t5,
            pickup_t3: f.pickup_t3,
            pace_vs_ly: f.pace_vs_ly,
            remaining_supply: f.remaining_supply,
            stly_is_approx: f.stly_is_approx,
        };
    });


    // Available as_of_dates for selector
    const asOfDates = await prisma.dailyOTB.findMany({
        where: { hotel_id: hotelId },
        select: { as_of_date: true },
        distinct: ['as_of_date'],
        orderBy: { as_of_date: 'desc' },
        take: 90,
    });

    // KPI calculations
    const now = new Date();
    const next7 = rows.filter(r => {
        const d = new Date(r.stay_date);
        return d >= now && d <= new Date(now.getTime() + 7 * 86400000);
    });
    const next14 = rows.filter(r => {
        const d = new Date(r.stay_date);
        return d >= now && d <= new Date(now.getTime() + 14 * 86400000);
    });
    const next30 = rows.filter(r => {
        const d = new Date(r.stay_date);
        return d >= now && d <= new Date(now.getTime() + 30 * 86400000);
    });

    const avgOcc = (arr: typeof rows) => {
        if (arr.length === 0) return 0;
        const avg = arr.reduce((s, r) => s + r.rooms_otb, 0) / arr.length;
        return Math.round((avg / hotel.capacity) * 100);
    };

    const avgPace = (arr: typeof rows) => {
        const withPace = arr.filter(r => r.pace_vs_ly !== null);
        if (withPace.length === 0) return null;
        return Math.round(withPace.reduce((s, r) => s + (r.pace_vs_ly ?? 0), 0) / withPace.length);
    };

    const totalPickup7d = rows
        .filter(r => r.pickup_t7 !== null)
        .reduce((s, r) => s + (r.pickup_t7 ?? 0), 0);

    // Data quality
    const totalWithT7 = rows.filter(r => r.pickup_t7 !== null).length;
    const totalWithSTLY = rows.filter(r => r.pace_vs_ly !== null).length;
    const totalApprox = rows.filter(r => r.stly_is_approx === true).length;
    const completeness = rows.length > 0
        ? Math.round((totalWithT7 / rows.length) * 100)
        : 0;
    const stlyCoverage = rows.length > 0
        ? Math.round((totalWithSTLY / rows.length) * 100)
        : 0;

    // Pickup 1d (T-1 approximation using T-3 if no exact T-1)
    const totalPickup1d = rows
        .filter(r => r.pickup_t3 !== null)
        .reduce((s, r) => s + (r.pickup_t3 ?? 0), 0);


    return NextResponse.json({
        hotelName: hotel.name,
        capacity: hotel.capacity,
        asOfDate: asOfDate.toISOString().split('T')[0],
        asOfDates: asOfDates.map(d => d.as_of_date.toISOString().split('T')[0]),
        rows,
        kpi: {
            occ7: avgOcc(next7),
            occ14: avgOcc(next14),
            occ30: avgOcc(next30),
            pace7: avgPace(next7),
            pace30: avgPace(next30),
            totalPickup7d,
            totalPickup1d,
        },
        quality: {
            totalRows: rows.length,
            withT7: totalWithT7,
            withSTLY: totalWithSTLY,
            approxSTLY: totalApprox,
            completeness,
            stlyCoverage,
        },
    });
}
