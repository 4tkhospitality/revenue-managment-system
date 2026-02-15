import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getActiveHotelId } from '../../../../lib/pricing/get-hotel';

/**
 * GET /api/analytics/forecast
 * Returns forecast data with confidence, model version, and trace for UI.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const hotelId = searchParams.get('hotelId') || await getActiveHotelId();
        const asOfParam = searchParams.get('asOf');

        if (!hotelId) {
            return NextResponse.json({ error: 'No hotel found' }, { status: 400 });
        }

        // Determine as_of_date
        let asOfDate: Date;
        if (asOfParam) {
            asOfDate = new Date(asOfParam);
        } else {
            const latest = await prisma.demandForecast.findFirst({
                where: { hotel_id: hotelId },
                orderBy: { as_of_date: 'desc' },
                select: { as_of_date: true },
            });
            if (!latest) {
                return NextResponse.json({ error: 'No forecast data' }, { status: 404 });
            }
            asOfDate = latest.as_of_date;
        }

        // Fetch forecasts
        const forecasts = await prisma.demandForecast.findMany({
            where: { hotel_id: hotelId, as_of_date: asOfDate },
            orderBy: { stay_date: 'asc' },
            select: {
                stay_date: true,
                remaining_demand: true,
                model_version: true,
                confidence: true,
                forecast_trace: true,
            },
        });

        // Fetch features for same dates (for rooms_otb = "actual at forecast time")
        const features = await prisma.featuresDaily.findMany({
            where: { hotel_id: hotelId, as_of_date: asOfDate },
            select: {
                stay_date: true,
                remaining_supply: true,
                expected_cxl: true,
                net_remaining: true,
            },
        });
        const featureMap = new Map(
            features.map(f => [f.stay_date.toISOString().slice(0, 10), f])
        );

        // Fetch price recommendations
        const recommendations = await prisma.priceRecommendations.findMany({
            where: { hotel_id: hotelId, as_of_date: asOfDate },
            select: {
                stay_date: true,
                recommended_price: true,
                current_price: true,
                uplift_pct: true,
                explanation: true,
            },
        });
        const recMap = new Map(
            recommendations.map(r => [r.stay_date.toISOString().slice(0, 10), r])
        );

        // Build combined response
        const rows = forecasts.map(f => {
            const dateStr = f.stay_date.toISOString().slice(0, 10);
            const feat = featureMap.get(dateStr);
            const rec = recMap.get(dateStr);

            return {
                stay_date: dateStr,
                remaining_demand: f.remaining_demand,
                model_version: f.model_version,
                confidence: f.confidence,
                forecast_trace: f.forecast_trace,
                remaining_supply: feat?.remaining_supply ?? null,
                expected_cxl: feat?.expected_cxl ?? null,
                net_remaining: feat?.net_remaining ?? null,
                recommended_price: rec?.recommended_price ? Number(rec.recommended_price) : null,
                current_price: rec?.current_price ? Number(rec.current_price) : null,
                uplift_pct: rec?.uplift_pct ?? null,
                zone: rec?.explanation ? JSON.parse(String(rec.explanation))?.zone ?? null : null,
            };
        });

        return NextResponse.json({
            asOfDate: asOfDate.toISOString().slice(0, 10),
            rows,
            modelVersion: forecasts[0]?.model_version ?? null,
            totalRows: rows.length,
        });
    } catch (error: any) {
        console.error('[forecast API]', error?.message);
        return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
    }
}
