import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getActiveHotelId } from '../../../../lib/pricing/get-hotel';

// ─── In-memory cache (D43: TTL 10 min) ─────────────────────
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCacheKey(hotelId: string, asOf: string, mode: string): string {
    return `${hotelId}:${asOf}:${mode}`;
}

function getFromCache(key: string): unknown | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(key: string, data: unknown): void {
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
    }
    cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

// ─── Main Handler ───────────────────────────────────────────
export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const hotelIdParam = url.searchParams.get('hotelId');
    const asOfParam = url.searchParams.get('asOf');
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');
    const mode = (url.searchParams.get('mode') || 'rooms') as 'rooms' | 'revenue';

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

    // Determine as_of_date
    let asOfDate: Date;
    if (asOfParam) {
        asOfDate = new Date(asOfParam);
    } else {
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

    const asOfStr = asOfDate.toISOString().split('T')[0];

    // ─── Cache check ────────────────────────────────────────
    const cacheKey = getCacheKey(hotelId, asOfStr, mode);
    const cached = getFromCache(cacheKey);
    if (cached && !fromParam && !toParam) {
        const res = NextResponse.json(cached);
        res.headers.set('Cache-Control', 'private, max-age=600');
        res.headers.set('X-Cache', 'HIT');
        return res;
    }

    // Build date filters
    const dateWhere: Record<string, unknown> = {};
    if (fromParam) dateWhere.gte = new Date(fromParam);
    if (toParam) dateWhere.lte = new Date(toParam);

    // Fetch features
    const features = await prisma.featuresDaily.findMany({
        where: {
            hotel_id: hotelId,
            as_of_date: asOfDate,
            ...(Object.keys(dateWhere).length > 0 ? { stay_date: dateWhere } : {}),
        },
        orderBy: { stay_date: 'asc' },
    });

    // If explicit date requested but no features built
    if (features.length === 0 && asOfParam) {
        const latestFeat = await prisma.featuresDaily.findFirst({
            where: { hotel_id: hotelId },
            orderBy: { as_of_date: 'desc' },
            select: { as_of_date: true },
        });
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
            kpi: { occ7: 0, occ14: 0, occ30: 0, pace7: null, pace30: null, totalPickup7d: 0, totalPickup1d: 0, netPickupDOD: null, topChangeDay: null },
            quality: { totalRows: 0, withT7: 0, withSTLY: 0, approxSTLY: 0, completeness: 0, stlyCoverage: 0 },
            datesToWatch: [],
        });
    }

    // Fetch OTB for current as_of
    const otb = await prisma.dailyOTB.findMany({
        where: {
            hotel_id: hotelId,
            as_of_date: asOfDate,
            ...(Object.keys(dateWhere).length > 0 ? { stay_date: dateWhere } : {}),
        },
        orderBy: { stay_date: 'asc' },
    });

    // ─── DOD: Fetch yesterday's OTB (Area 2) ───────────────
    const yesterdayDate = new Date(asOfDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    const otbYesterday = await prisma.dailyOTB.findMany({
        where: {
            hotel_id: hotelId,
            as_of_date: yesterdayDate,
            ...(Object.keys(dateWhere).length > 0 ? { stay_date: dateWhere } : {}),
        },
        orderBy: { stay_date: 'asc' },
    });

    const yesterdayMap = new Map<string, { rooms_otb: number; revenue_otb: number }>();
    for (const o of otbYesterday) {
        yesterdayMap.set(o.stay_date.toISOString().split('T')[0], {
            rooms_otb: o.rooms_otb,
            revenue_otb: Number(o.revenue_otb),
        });
    }

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
        const ydData = yesterdayMap.get(key);
        return {
            stay_date: key,
            dow: f.dow,
            is_weekend: f.is_weekend,
            month: f.month,
            rooms_otb: otbData?.rooms_otb ?? 0,
            revenue_otb: otbData?.revenue_otb ?? 0,
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
            // DOD delta per stay_date
            dod_delta: ydData ? (otbData?.rooms_otb ?? 0) - ydData.rooms_otb : null,
            dod_delta_rev: ydData ? (otbData?.revenue_otb ?? 0) - ydData.revenue_otb : null,
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

    // ─── KPI calculations ───────────────────────────────────
    // Use asOfDate as reference point (not wall-clock) so historical
    // snapshots show correct KPIs relative to that snapshot date.
    const refDate = new Date(asOfDate);
    refDate.setHours(0, 0, 0, 0);
    const filterByHorizon = (days: number) => rows.filter(r => {
        const d = new Date(r.stay_date);
        return d >= refDate && d <= new Date(refDate.getTime() + days * 86400000);
    });

    const next7 = filterByHorizon(7);
    const next14 = filterByHorizon(14);
    const next30 = filterByHorizon(30);

    const avgOcc = (arr: typeof rows) => {
        if (arr.length === 0) return 0;
        const avg = arr.reduce((s, r) => s + r.rooms_otb, 0) / arr.length;
        return Math.round((avg / hotel.capacity) * 100);
    };

    const avgPace = (arr: typeof rows) => {
        if (mode === 'revenue') {
            // Revenue pace: sum(revenue_otb - stly_revenue_otb) for dates with STLY
            const withSTLY = arr.filter(r => r.stly_revenue_otb !== null);
            if (withSTLY.length === 0) return null;
            const totalDelta = withSTLY.reduce((s, r) => s + (r.revenue_otb - (r.stly_revenue_otb ?? 0)), 0);
            return Math.round(totalDelta / withSTLY.length);
        }
        const withPace = arr.filter(r => r.pace_vs_ly !== null);
        if (withPace.length === 0) return null;
        return Math.round(withPace.reduce((s, r) => s + (r.pace_vs_ly ?? 0), 0) / withPace.length);
    };

    const totalPickup7d = rows
        .filter(r => r.pickup_t7 !== null)
        .reduce((s, r) => s + (r.pickup_t7 ?? 0), 0);

    const totalPickup1d = rows
        .filter(r => r.pickup_t3 !== null)
        .reduce((s, r) => s + (r.pickup_t3 ?? 0), 0);

    // ─── DOD KPI (Area 2) ───────────────────────────────────
    const dodRows = rows.filter(r => r.dod_delta !== null);
    const netPickupDOD = dodRows.length > 0
        ? dodRows.reduce((s, r) => s + (mode === 'revenue' ? (r.dod_delta_rev ?? 0) : (r.dod_delta ?? 0)), 0)
        : null;

    // Top change day: stay_date with largest absolute DOD delta
    let topChangeDay: { stay_date: string; delta: number } | null = null;
    if (dodRows.length > 0) {
        const deltaKey = mode === 'revenue' ? 'dod_delta_rev' : 'dod_delta';
        let maxAbs = 0;
        for (const r of dodRows) {
            const val = Math.abs(r[deltaKey] ?? 0);
            if (val > maxAbs) {
                maxAbs = val;
                topChangeDay = { stay_date: r.stay_date, delta: r[deltaKey] ?? 0 };
            }
        }
    }

    // ─── Data quality ───────────────────────────────────────
    const totalWithT7 = rows.filter(r => r.pickup_t7 !== null).length;
    const totalWithT15 = rows.filter(r => r.pickup_t15 !== null).length;
    const totalWithT30 = rows.filter(r => r.pickup_t30 !== null).length;
    const totalWithT5 = rows.filter(r => r.pickup_t5 !== null).length;
    const totalWithT3 = rows.filter(r => r.pickup_t3 !== null).length;
    const totalWithSTLY = rows.filter(r => r.pace_vs_ly !== null).length;
    const totalApprox = rows.filter(r => r.stly_is_approx === true).length;
    const completeness = rows.length > 0
        ? Math.round((totalWithT7 / rows.length) * 100)
        : 0;
    const stlyCoverage = rows.length > 0
        ? Math.round((totalWithSTLY / rows.length) * 100)
        : 0;

    // Column availability — hide T-xx columns that are 100% NULL (Area 4)
    const columnAvailability = {
        hasT30: totalWithT30 > 0,
        hasT15: totalWithT15 > 0,
        hasT7: totalWithT7 > 0,
        hasT5: totalWithT5 > 0,
        hasT3: totalWithT3 > 0,
    };

    // ─── Dates to Watch (Area 3) ─────────────────────────────
    const DOW_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const futureRows = rows.filter(r => new Date(r.stay_date) >= refDate);

    const datesToWatch = futureRows
        .map(r => {
            const occ = hotel.capacity > 0 ? r.rooms_otb / hotel.capacity : 0;
            const supply = r.remaining_supply ?? (hotel.capacity - r.rooms_otb);

            let score: number;
            let category: 'under_pace' | 'tight_supply' | 'mixed';
            let impact: string;

            if (mode === 'revenue') {
                // Revenue scoring
                const revDelta = r.stly_revenue_otb !== null
                    ? r.revenue_otb - r.stly_revenue_otb
                    : 0;
                const underPaceRev = Math.max(0, -revDelta) * 0.6;
                const yieldOpp = supply * (r.rooms_otb > 0 ? r.revenue_otb / r.rooms_otb : 0) * 0.0004; // scaled
                score = underPaceRev + yieldOpp;

                if (occ >= 0.85 && supply <= hotel.capacity * 0.15) {
                    category = 'tight_supply';
                    impact = `Yield opp: High (${Math.round(occ * 100)}% occ, ${supply} avail) — Raise price / Close discounts`;
                } else if (revDelta < 0) {
                    category = 'under_pace';
                    impact = `Risk: ${Math.abs(revDelta) > 1000000 ? 'High' : 'Medium'} (rev under pace ${Math.round(revDelta / 1000)}k) — Consider promo`;
                } else {
                    category = 'mixed';
                    impact = `Monitor (${supply} avail, rev ${revDelta >= 0 ? '+' : ''}${Math.round(revDelta / 1000)}k vs LY)`;
                }
            } else {
                // Rooms scoring (D40: w1=0.6, w2=0.4)
                const underPace = Math.max(0, -(r.pace_vs_ly ?? 0)) * 0.6;
                const tightGap = Math.max(0, hotel.capacity * 0.85 - r.rooms_otb) * 0.4;
                score = underPace + tightGap;

                if (occ >= 0.85 && supply <= hotel.capacity * 0.15) {
                    category = 'tight_supply';
                    impact = `Yield opp: High (${Math.round(occ * 100)}% occ, ${supply} avail) — Raise price / Close discounts`;
                } else if ((r.pace_vs_ly ?? 0) < 0) {
                    const paceGap = Math.abs(r.pace_vs_ly ?? 0);
                    category = 'under_pace';
                    impact = `Risk: ${paceGap > 10 ? 'High' : 'Medium'} (under pace ${paceGap} rooms, ${supply} avail)`;
                } else {
                    category = 'mixed';
                    impact = `Monitor (${supply} avail, pace ${(r.pace_vs_ly ?? 0) >= 0 ? '+' : ''}${r.pace_vs_ly ?? 0} vs LY)`;
                }
            }

            return {
                stay_date: r.stay_date,
                dow: r.dow !== null ? DOW_LABELS[r.dow] : '—',
                score: Math.round(score * 100) / 100,
                category,
                impact,
                rooms_otb: r.rooms_otb,
                revenue_otb: r.revenue_otb,
                vs_ly: r.pace_vs_ly,
                remaining_supply: supply,
            };
        })
        .filter(d => d.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // D39: max 5

    // ─── Build response ─────────────────────────────────────
    const responseData = {
        hotelName: hotel.name,
        capacity: hotel.capacity,
        asOfDate: asOfStr,
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
            // Area 2: DOD
            netPickupDOD,
            topChangeDay,
        },
        quality: {
            totalRows: rows.length,
            withT7: totalWithT7,
            withSTLY: totalWithSTLY,
            approxSTLY: totalApprox,
            completeness,
            stlyCoverage,
            columnAvailability,
        },
        // Area 3: Dates to Watch
        datesToWatch,
    };

    // Cache the result (only for default from/to)
    if (!fromParam && !toParam) {
        setCache(cacheKey, responseData);
    }

    const res = NextResponse.json(responseData);
    res.headers.set('Cache-Control', 'private, max-age=600');
    res.headers.set('X-Cache', 'MISS');
    return res;
}
