/**
 * Rate Shopper — Intraday View Action
 *
 * Server action to build IntradayViewModel for the frontend.
 * Queries cache + competitor rates, scoped by hotel_id.
 * Returns ALL OTA source rates per competitor.
 *
 * @see spec §11.0, Key Decision #19, #22
 */

'use server';

import prisma from '@/lib/prisma';
import { OFFSET_DAYS, type OffsetDay } from '../constants';
import { vnTodayPlus } from '../timezone';
import type {
    IntradayViewModel,
    IntradayCompetitor,
    IntradayRate,
} from '../types';
import { CacheStatus, AvailabilityStatus, DataConfidence } from '../types';

/**
 * Get intraday view data for a hotel's rate shopper dashboard.
 * Data is ALWAYS scoped by hotel_id — no cross-tenant leakage.
 * Returns ALL OTA rates per competitor (not just 1).
 */
export async function getIntradayView(
    hotelId: string,
    offsets: OffsetDay[] = [...OFFSET_DAYS],
): Promise<IntradayViewModel[]> {
    const competitors = await prisma.competitor.findMany({
        where: { hotel_id: hotelId, is_active: true },
        select: { id: true, name: true, serpapi_property_token: true },
    });

    const competitorTokens = competitors
        .map((c: { serpapi_property_token: string | null }) => c.serpapi_property_token)
        .filter(Boolean) as string[];

    // Try to get hotel's own rate for comparison (from pricing data)
    const myRate = await getMyRate(hotelId, offsets);

    const viewModels: IntradayViewModel[] = [];

    for (const offset of offsets) {
        const checkInDate = vnTodayPlus(offset);

        const cacheEntries = await prisma.rateShopCache.findMany({
            where: {
                property_token: { in: competitorTokens },
                check_in_date: checkInDate,
            },
            select: { id: true, cache_key: true, property_token: true, status: true, fetched_at: true },
        });

        const cacheIds = cacheEntries.map((c: { id: string }) => c.id);
        const competitorIds = competitors.map((c: { id: string }) => c.id);

        // Get ALL rates (all sources) for all competitors
        const allRates = cacheIds.length > 0
            ? await prisma.competitorRate.findMany({
                where: {
                    competitor_id: { in: competitorIds },
                    cache_id: { in: cacheIds },
                    check_in_date: checkInDate,
                },
                orderBy: [{ scraped_at: 'desc' }, { representative_price: 'asc' }],
            })
            : [];

        // Group rates by competitor
        const viewCompetitors: IntradayCompetitor[] = competitors.map(
            (comp: { id: string; name: string }) => {
                // Get ALL rates for this competitor (deduplicate by source, keep latest)
                const compRates = allRates.filter(
                    (r: { competitor_id: string }) => r.competitor_id === comp.id,
                );

                // Deduplicate: keep only the latest rate per source
                const sourceMap = new Map<string, typeof compRates[0]>();
                for (const r of compRates) {
                    const src = r.source ?? 'Unknown';
                    if (!sourceMap.has(src)) {
                        sourceMap.set(src, r); // First occurrence = latest (ordered by scraped_at desc)
                    }
                }

                const uniqueRates: IntradayRate[] = Array.from(sourceMap.values()).map((r) => ({
                    source: r.source ?? 'Unknown',
                    representative_price: r.representative_price ? Number(r.representative_price) : null,
                    total_rate_lowest: r.total_rate_lowest ? Number(r.total_rate_lowest) : null,
                    total_rate_before_tax: r.total_rate_before_tax ? Number(r.total_rate_before_tax) : null,
                    rate_per_night_lowest: r.rate_per_night_lowest ? Number(r.rate_per_night_lowest) : null,
                    rate_per_night_before_tax: r.rate_per_night_before_tax ? Number(r.rate_per_night_before_tax) : null,
                    price_source_level: r.price_source_level ?? 0,
                    data_confidence: (r.data_confidence ?? 'LOW') as DataConfidence,
                    availability_status: (r.availability_status ?? 'NO_RATE') as AvailabilityStatus,
                    is_official: r.is_official ?? false,
                    scraped_at: r.scraped_at?.toISOString() ?? '',
                }));

                // Sort by price ascending (cheapest first)
                uniqueRates.sort((a, b) => {
                    if (a.representative_price === null) return 1;
                    if (b.representative_price === null) return -1;
                    return a.representative_price - b.representative_price;
                });

                // Best rate = cheapest available
                const bestRate = uniqueRates.find((r) => r.representative_price !== null) ?? uniqueRates[0];

                return {
                    competitor_id: comp.id,
                    name: comp.name,
                    representative_price: bestRate?.representative_price ?? null,
                    availability_status: bestRate?.availability_status ?? AvailabilityStatus.NO_RATE,
                    data_confidence: bestRate?.data_confidence ?? DataConfidence.LOW,
                    source: bestRate?.source ?? '',
                    scraped_at: bestRate?.scraped_at ?? '',
                    rates: uniqueRates,
                };
            },
        );

        const primaryCacheStatus = determinePrimaryCacheStatus(cacheEntries);
        const oldestFetch = cacheEntries
            .map((c: { fetched_at: Date | null }) => c.fetched_at)
            .filter(Boolean)
            .sort((a: Date | null, b: Date | null) =>
                a && b ? a.getTime() - b.getTime() : 0,
            )[0];

        const ratesWithBeforeTax = allRates.filter(
            (r: { total_rate_before_tax: unknown }) => r.total_rate_before_tax !== null,
        );
        const tax_fee_mixed =
            allRates.length > 0 &&
            ratesWithBeforeTax.length > 0 &&
            ratesWithBeforeTax.length < allRates.length;

        const before_tax_ratio =
            allRates.length > 0
                ? ratesWithBeforeTax.length / allRates.length
                : 0;

        viewModels.push({
            offset,
            check_in_date: checkInDate,
            my_rate: myRate[offset] ?? null,
            competitors: viewCompetitors,
            cache_status: primaryCacheStatus,
            cache_fetched_at: oldestFetch?.toISOString() ?? null,
            tax_fee_mixed,
            before_tax_ratio,
        });
    }

    return viewModels;
}

/**
 * Get the hotel's own rate (BAR) for comparison.
 * Tries to find from the hotel's pricing/rate data.
 */
async function getMyRate(
    hotelId: string,
    offsets: OffsetDay[],
): Promise<Record<number, number | null>> {
    const result: Record<number, number | null> = {};

    try {
        // Try to get from hotel settings or pricing data
        const hotel = await prisma.hotel.findUnique({
            where: { hotel_id: hotelId },
            select: {
                hotel_id: true,
                // Check if there's a base_rate or similar pricing field
            },
        });

        // For now, populate from any available pricing data
        // TODO: Integrate with actual pricing module when available
        for (const offset of offsets) {
            result[offset] = null; // Will be populated when pricing module provides BAR
        }
    } catch {
        for (const offset of offsets) {
            result[offset] = null;
        }
    }

    return result;
}

function determinePrimaryCacheStatus(
    entries: { status: string }[],
): CacheStatus {
    if (entries.length === 0) return CacheStatus.EXPIRED;
    const statuses = entries.map((e) => e.status);
    if (statuses.some((s) => s === 'REFRESHING')) return CacheStatus.REFRESHING;
    if (statuses.some((s) => s === 'FAILED')) return CacheStatus.FAILED;
    if (statuses.every((s) => s === 'FRESH')) return CacheStatus.FRESH;
    if (statuses.some((s) => s === 'STALE')) return CacheStatus.STALE;
    return CacheStatus.EXPIRED;
}
