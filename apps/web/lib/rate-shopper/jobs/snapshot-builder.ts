/**
 * Rate Shopper — Market Snapshot Builder Job
 *
 * Daily cron job (23:00 VN) that builds/upserts MarketSnapshot
 * for 5 offsets per hotel. Uses transactional upsert to prevent
 * partial unique index violations on is_latest.
 *
 * @see spec §10.2, §10.3 (MarketSnapshotJob)
 */

import prisma from '@/lib/prisma';
import { OFFSET_DAYS } from '../constants';
import { getVNDate, vnTodayPlus, getVNNow } from '../timezone';
import { aggregateRates } from '../aggregation';
import { parsePropertyDetailsResponse } from '../parser';
import { Prisma } from '@prisma/client';
import type { ParsedCompetitorRate } from '../types';

export interface SnapshotResult {
    totalHotels: number;
    totalSnapshots: number;
    totalFailed: number;
    startedAt: Date;
    completedAt: Date;
}

/**
 * Build daily snapshots for all hotels × 5 offsets.
 *
 * Flow per (hotel, offset):
 * 1. Get active competitors → find cache entries with fresh data
 * 2. Parse cached responses → aggregate rates
 * 3. Transactional upsert: set is_latest=false on old, upsert new with is_latest=true
 */
export async function runSnapshotBuilder(): Promise<SnapshotResult> {
    const startedAt = getVNNow();
    const snapshotDate = getVNDate();
    let totalSnapshots = 0;
    let totalFailed = 0;

    // Get all hotels that have active competitors (query Competitor table directly)
    const hotelRows = await prisma.competitor.findMany({
        where: { is_active: true },
        select: { hotel_id: true },
        distinct: ['hotel_id'],
    });
    const hotels = hotelRows.map((r: { hotel_id: string }) => ({ hotel_id: r.hotel_id }));

    for (const hotel of hotels) {
        for (const offset of OFFSET_DAYS) {
            try {
                await buildSnapshot(hotel.hotel_id, offset, snapshotDate);
                totalSnapshots++;
            } catch (error) {
                console.error(
                    `[RateShopper][Snapshot] Failed for hotel=${hotel.hotel_id} offset=${offset}:`,
                    error,
                );
                totalFailed++;
            }
        }
    }

    return {
        totalHotels: hotels.length,
        totalSnapshots,
        totalFailed,
        startedAt,
        completedAt: getVNNow(),
    };
}

/**
 * Build a single snapshot for a hotel + offset.
 * Uses transactional upsert (spec §10.2).
 */
async function buildSnapshot(
    hotelId: string,
    offset: number,
    snapshotDate: string,
): Promise<void> {
    const checkInDate = vnTodayPlus(offset);

    // 1. Get active competitors
    const competitors = await prisma.competitor.findMany({
        where: { hotel_id: hotelId, is_active: true },
        select: { id: true, serpapi_property_token: true },
    });

    const tokens = competitors
        .map((c) => c.serpapi_property_token)
        .filter(Boolean) as string[];

    if (tokens.length === 0) return;

    // 2. Find cache entries with FRESH/STALE data
    const cacheEntries = await prisma.rateShopCache.findMany({
        where: {
            property_token: { in: tokens },
            check_in_date: checkInDate,
            status: { in: ['FRESH', 'STALE'] },
            raw_response: { not: Prisma.AnyNull },
        },
        select: { id: true, raw_response: true },
    });

    if (cacheEntries.length === 0) return;

    // 3. Parse all cached responses and collect rates
    const allRates: ParsedCompetitorRate[] = [];
    let totalBeforeTaxCount = 0;
    let totalRateCount = 0;

    for (const entry of cacheEntries) {
        if (!entry.raw_response) continue;
        const parsed = parsePropertyDetailsResponse(
            entry.raw_response as any,
            1, // Default LOS=1 for snapshot
        );
        allRates.push(...parsed.rates);
        totalRateCount += parsed.rates.length;
        totalBeforeTaxCount += parsed.rates.filter(
            (r) => r.total_rate_before_tax !== null,
        ).length;
    }

    if (allRates.length === 0) return;

    const beforeTaxRatio =
        totalRateCount > 0 ? totalBeforeTaxCount / totalRateCount : 0;

    // 4. Aggregate
    const agg = aggregateRates(allRates, beforeTaxRatio);

    // 5. Get hotel's own rate (my_rate) — from internal BAR if available
    // For now, null until integrated with pricing module
    const myRate = null;

    // Calculate price_index and gap_pct
    const priceIndex =
        myRate && agg.comp_median
            ? Number((myRate / Number(agg.comp_median)).toFixed(4))
            : null;
    const gapPct =
        myRate && agg.comp_median
            ? Number(((myRate - Number(agg.comp_median)) / Number(agg.comp_median)).toFixed(4))
            : null;

    // 6. Transactional upsert (spec §10.2)
    const uniqueKey = {
        hotel_id_check_in_date_length_of_stay_adults_snapshot_date: {
            hotel_id: hotelId,
            check_in_date: checkInDate,
            length_of_stay: 1,
            adults: 2,
            snapshot_date: snapshotDate,
        },
    };

    await prisma.$transaction(async (tx) => {
        // Step 1: Set is_latest=false for all existing latest rows with same key
        await tx.marketSnapshot.updateMany({
            where: {
                hotel_id: hotelId,
                check_in_date: checkInDate,
                length_of_stay: 1,
                adults: 2,
                is_latest: true,
            },
            data: { is_latest: false },
        });

        // Step 2: Upsert new snapshot with is_latest=true
        await tx.marketSnapshot.upsert({
            where: uniqueKey,
            create: {
                hotel_id: hotelId,
                check_in_date: checkInDate,
                length_of_stay: 1,
                adults: 2,
                snapshot_date: snapshotDate,
                my_rate: myRate,
                comp_min: agg.comp_min,
                comp_max: agg.comp_max,
                comp_avg: agg.comp_avg,
                comp_median: agg.comp_median,
                comp_available_count: agg.comp_available_count,
                sold_out_count: agg.sold_out_count,
                no_rate_count: agg.no_rate_count,
                price_index: priceIndex,
                gap_pct: gapPct,
                market_confidence: agg.market_confidence as any,
                demand_strength: agg.demand_strength as any,
                reason_codes: [],
                is_latest: true,
            },
            update: {
                my_rate: myRate,
                comp_min: agg.comp_min,
                comp_max: agg.comp_max,
                comp_avg: agg.comp_avg,
                comp_median: agg.comp_median,
                comp_available_count: agg.comp_available_count,
                sold_out_count: agg.sold_out_count,
                no_rate_count: agg.no_rate_count,
                price_index: priceIndex,
                gap_pct: gapPct,
                market_confidence: agg.market_confidence as any,
                demand_strength: agg.demand_strength as any,
                is_latest: true,
            },
        });
    });
}
