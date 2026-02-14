/**
 * InsightsV2 Data Fetcher — Server-side data preparation
 * Fetches and transforms data for insightsV2Engine
 */
import prisma from '@/lib/prisma';
import {
    type DayData,
    type CancelData,
    type SegmentData,
    type PricingHintData,
    type InsightsV2Input,
    type ConfidenceDimensions,
    calculateConfidence,
    DEFAULT_CONFIG,
} from './insightsV2Engine';

interface FetchInsightsDataParams {
    hotelId: string;
    hotelCapacity: number;
    otbData: Array<{ stay_date: Date; rooms_otb: number; revenue_otb: unknown; as_of_date: Date }>;
    featuresData: Array<{
        stay_date: Date;
        pickup_t7: number | null;
        pickup_t3: number | null;
        pace_vs_ly: number | null;
        remaining_supply: number | null;
        stly_is_approx: boolean | null;
    }>;
    forecastData: Array<{ stay_date: Date; remaining_demand: number | null; model_version: string | null }>;
    referenceDate: Date;
}

export async function fetchInsightsV2Data(params: FetchInsightsDataParams): Promise<InsightsV2Input> {
    const {
        hotelId,
        hotelCapacity,
        otbData,
        featuresData,
        forecastData,
        referenceDate,
    } = params;

    const thirtyDaysFromRef = new Date(referenceDate);
    thirtyDaysFromRef.setDate(thirtyDaysFromRef.getDate() + 30);
    const sevenDaysAgo = new Date(referenceDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Parallel fetch: PriceRec + PricingDecisions + Reservations for segments/cancel
    const [priceRecs, pricingDecisions, reservations, cancelledReservations] = await Promise.all([
        // PriceRecommendations for all future stay_dates
        prisma.priceRecommendations.findMany({
            where: {
                hotel_id: hotelId,
                stay_date: { gte: referenceDate, lte: thirtyDaysFromRef },
            },
            orderBy: { stay_date: 'asc' },
            select: {
                stay_date: true,
                current_price: true,
                recommended_price: true,
                expected_revenue: true,
                uplift_pct: true,
            },
        }),

        // PricingDecision: last 2 per stay_date (for pricing hint)
        prisma.pricingDecision.findMany({
            where: {
                hotel_id: hotelId,
                stay_date: { gte: referenceDate, lte: thirtyDaysFromRef },
            },
            orderBy: { decided_at: 'desc' },
            select: {
                stay_date: true,
                final_price: true,
                decided_at: true,
            },
        }),

        // Reservations for segment mix (next 30d arrivals)
        prisma.reservationsRaw.findMany({
            where: {
                hotel_id: hotelId,
                arrival_date: { gte: referenceDate, lte: thirtyDaysFromRef },
                status: { not: 'cancelled' },
            },
            select: {
                segment: true,
                rooms: true,
            },
        }),

        // Cancellations in last 30d + new bookings in last 7d
        prisma.reservationsRaw.findMany({
            where: {
                hotel_id: hotelId,
                arrival_date: { gte: referenceDate, lte: thirtyDaysFromRef },
            },
            select: {
                status: true,
                cancel_time: true,
                book_time: true,
                segment: true,
                rooms: true,
            },
        }),
    ]);

    // ── Build PriceRec lookup ──
    const priceRecMap = new Map<string, typeof priceRecs[0]>();
    for (const rec of priceRecs) {
        priceRecMap.set(rec.stay_date.toISOString(), rec);
    }

    // ── Build features lookup ──
    const featuresMap = new Map<string, typeof featuresData[0]>();
    for (const f of featuresData) {
        featuresMap.set(f.stay_date.toISOString(), f);
    }

    // ── Build forecast lookup ──
    const forecastMap = new Map<string, typeof forecastData[0]>();
    for (const f of forecastData) {
        forecastMap.set(f.stay_date.toISOString(), f);
    }

    // ── Build DayData array ──
    const days: DayData[] = otbData.map(otb => {
        const key = otb.stay_date.toISOString();
        const feat = featuresMap.get(key);
        const fcst = forecastMap.get(key);
        const prec = priceRecMap.get(key);

        return {
            stayDate: otb.stay_date,
            roomsOtb: otb.rooms_otb,
            revenueOtb: Number(otb.revenue_otb ?? 0),
            pickupNetT3: feat?.pickup_t3 ?? null,
            pickupNetT7: feat?.pickup_t7 ?? null,
            paceVsLy: feat?.pace_vs_ly ?? null,
            remainingSupply: feat?.remaining_supply ?? null,
            revenueOtbFeature: null,
            stlyRevenueOtb: null, // Will need FeaturesDaily with revenue fields
            forecastDemand: fcst?.remaining_demand ?? null,
            recommendedPrice: prec?.recommended_price != null ? Number(prec.recommended_price) : null,
            expectedRevenue: prec?.expected_revenue != null ? Number(prec.expected_revenue) : null,
            upliftPct: prec?.uplift_pct ?? null,
            currentPrice: prec?.current_price != null ? Number(prec.current_price) : null,
        };
    });

    // ── Build Pricing Hints (spec §11: compare TWO records over time) ──
    // Group PricingDecisions by stay_date, take latest 2
    const decisionsByDate = new Map<string, typeof pricingDecisions>();
    for (const d of pricingDecisions) {
        const key = d.stay_date.toISOString();
        const arr = decisionsByDate.get(key) || [];
        arr.push(d);
        decisionsByDate.set(key, arr);
    }

    const pricingHints: PricingHintData[] = [];
    for (const [, decisions] of decisionsByDate) {
        if (decisions.length >= 2) {
            const latest = decisions[0]; // Already sorted DESC by decided_at
            const prev = decisions[1];
            if (latest.final_price != null && prev.final_price != null) {
                pricingHints.push({
                    stayDate: latest.stay_date,
                    latestFinalPrice: Number(latest.final_price),
                    prevFinalPrice: Number(prev.final_price),
                    latestDecidedAt: latest.decided_at,
                });
            }
        }
    }

    // ── Cancel Data ──
    const totalRes30d = cancelledReservations.length;
    const cancelledRes = cancelledReservations.filter(r => r.status === 'cancelled');
    const cancelRate30d = totalRes30d > 0 ? cancelledRes.length / totalRes30d : 0;

    // Gross pickup 7d (bookings created in last 7 days)
    const pickupGross7d = cancelledReservations.filter(
        r => r.book_time && r.book_time >= sevenDaysAgo && r.status !== 'cancelled'
    ).reduce((s, r) => s + (r.rooms ?? 1), 0);

    // Cancel 7d
    const cancel7d = cancelledReservations.filter(
        r => r.cancel_time && r.cancel_time >= sevenDaysAgo
    ).reduce((s, r) => s + (r.rooms ?? 1), 0);

    // Top cancel segment
    const cancelBySegment = new Map<string, number>();
    for (const r of cancelledRes) {
        const seg = r.segment || 'Unknown';
        cancelBySegment.set(seg, (cancelBySegment.get(seg) || 0) + (r.rooms ?? 1));
    }
    let topCancelSegment: string | null = null;
    let topCancelCount = 0;
    for (const [seg, count] of cancelBySegment) {
        if (count > topCancelCount) {
            topCancelCount = count;
            topCancelSegment = seg;
        }
    }

    const cancelData: CancelData | null = totalRes30d > 0 ? {
        cancelRate30d,
        pickupGross7d,
        cancel7d,
        topCancelSegment,
    } : null;

    // ── Segment Data ──
    const segmentMap = new Map<string, number>();
    for (const r of reservations) {
        const seg = r.segment || 'Unknown';
        segmentMap.set(seg, (segmentMap.get(seg) || 0) + (r.rooms ?? 1));
    }
    const totalSegmentRooms = [...segmentMap.values()].reduce((a, b) => a + b, 0);
    const segments: SegmentData[] = [...segmentMap.entries()].map(([name, count]) => ({
        segmentName: name,
        roomCount: count,
        pct: totalSegmentRooms > 0 ? count / totalSegmentRooms : 0,
    }));

    // ── Confidence ──
    const pickupHistoryCount = featuresData.filter(f => f.pickup_t7 != null).length;
    const forecastSource = forecastData.length > 0
        ? (forecastData[0].model_version?.includes('fallback') || forecastData[0].model_version?.includes('no_supply')
            ? 'fallback'
            : forecastData[0].model_version?.includes('pickup_single')
                ? 'single'
                : 'computed')
        : 'none';
    const segmentMappedPct = reservations.filter(r => r.segment != null && r.segment !== '').length
        / Math.max(reservations.length, 1);

    const confidenceDims = calculateConfidence(pickupHistoryCount, forecastSource, segmentMappedPct);

    // ── FeaturesDaily revenue (need to re-query with revenue fields) ──
    // Enrich days with STLY revenue data
    const featuresWithRevenue = await prisma.featuresDaily.findMany({
        where: {
            hotel_id: hotelId,
            as_of_date: otbData[0]?.as_of_date ?? referenceDate,
        },
        select: {
            stay_date: true,
            revenue_otb: true,
            stly_revenue_otb: true,
        },
        orderBy: { stay_date: 'asc' },
        take: 90,
    });

    for (const feat of featuresWithRevenue) {
        const day = days.find(d => d.stayDate.toISOString() === feat.stay_date.toISOString());
        if (day) {
            day.revenueOtbFeature = feat.revenue_otb != null ? Number(feat.revenue_otb) : null;
            day.stlyRevenueOtb = feat.stly_revenue_otb != null ? Number(feat.stly_revenue_otb) : null;
        }
    }

    return {
        hotelCapacity,
        days,
        cancelData,
        segments,
        pricingHints,
        confidenceDims,
        config: DEFAULT_CONFIG,
    };
}
