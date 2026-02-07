/**
 * Rate Shopper — Refresh Job
 *
 * Core refresh workflow: lock → fetch SerpApi → parse → fan-out rates → record usage.
 * Used by both manual scan and scheduler.
 *
 * @see spec §10.2, §6.2, Key Decision #14, #16, #17
 */

import prisma from '@/lib/prisma';
import { fetchPropertyDetails, SerpApiRateLimitError } from './serpapi-client';
import { parsePropertyDetailsResponse } from './parser';
import {
    readCache,
    acquireRefreshLock,
    releaseRefreshSuccess,
    releaseRefreshFailure,
} from './cache-service';
import { recordUsage } from './quota-service';
import { getVNDate, getVNNow } from './timezone';
import type { CanonicalSearchParams, ParsedCompetitorRate } from './types';

export interface RefreshResult {
    success: boolean;
    searchId?: string;
    ratesCount: number;
    creditConsumed: boolean;
    isVendorCacheHit?: boolean;
    errorMessage?: string;
}

/**
 * Execute a full cache refresh cycle for a single cache key.
 *
 * Flow:
 * 1. Acquire lock (atomic)
 * 2. Fetch from SerpApi
 * 3. Parse response
 * 4. Fan-out: write CompetitorRates for all matching competitors
 * 5. Record usage (system daily + tenant monthly if applicable)
 * 6. Release lock (success or failure)
 *
 * @param cacheKey - Cache key to refresh
 * @param canonicalParams - Search parameters
 * @param hotelId - Hotel ID for tenant billing (null for scheduler)
 * @param requestId - Optional RateShopRequest ID for coalesce audit
 */
export async function executeRefresh(
    cacheKey: string,
    canonicalParams: CanonicalSearchParams,
    hotelId: string | null,
    requestId?: string,
): Promise<RefreshResult> {
    // 1. Acquire lock
    const lock = await acquireRefreshLock(cacheKey, requestId);
    if (!lock.acquired) {
        return {
            success: false,
            ratesCount: 0,
            creditConsumed: false,
            errorMessage: 'Lock not acquired — another refresh in progress',
        };
    }

    try {
        // 2. Fetch from SerpApi
        const response = await fetchPropertyDetails(canonicalParams);

        // 3. Parse response
        const lengthOfStay = canonicalParams.check_out_date
            ? Math.max(
                1,
                Math.round(
                    (new Date(canonicalParams.check_out_date).getTime() -
                        new Date(canonicalParams.check_in_date).getTime()) /
                    86400000,
                ),
            )
            : 1;

        const parsed = parsePropertyDetailsResponse(response, lengthOfStay);

        // Debug: log raw response structure when 0 rates found
        if (parsed.rates.length === 0) {
            const keys = Object.keys(response);
            console.log(`[Parser] 0 rates for ${cacheKey}. Response keys: ${keys.join(', ')}`);
            if (response.prices) {
                console.log(`[Parser] prices array exists but empty:`, JSON.stringify(response.prices).slice(0, 300));
            }
            // Check alternative price fields
            const r = response as Record<string, unknown>;
            if (r.featured_prices) console.log('[Parser] Has featured_prices');
            if (r.typical_prices) console.log('[Parser] Has typical_prices');
            if (r.hotel_prices) console.log('[Parser] Has hotel_prices');
            if (r.rate_per_night) console.log('[Parser] Has rate_per_night at top level');
        } else {
            console.log(`[Parser] ${parsed.rates.length} rates parsed for ${cacheKey}. Sources: ${parsed.rates.map(r => r.source).join(', ')}`);
        }

        // 4. Get cache row for offset_days
        const cacheRow = await prisma.rateShopCache.findUnique({
            where: { cache_key: cacheKey },
            select: { id: true, offset_days: true, property_token: true },
        });

        // 5. Fan-out: write CompetitorRates for all matching competitors
        if (cacheRow && parsed.rates.length > 0) {
            await fanOutRates(
                cacheRow.id,
                cacheRow.property_token,
                canonicalParams.check_in_date,
                parsed.rates,
            );
        }

        // 6. Release lock with success + set TTL
        await releaseRefreshSuccess(cacheKey, {
            raw_response: parsed.raw_response,
            is_vendor_cache_hit: undefined, // Conservative: can't determine reliably (POC pending)
            offsetDays: cacheRow?.offset_days ?? 30,
        });

        // 7. Record usage — conservative billing (always credit unless confirmed cache hit)
        const creditConsumed = true; // Conservative fallback until POC-2 answers
        await recordUsage(hotelId, creditConsumed);

        // 8. Update RateShopRequest status if provided
        if (requestId) {
            await prisma.rateShopRequest.update({
                where: { id: requestId },
                data: {
                    status: 'COMPLETED',
                    credit_consumed: creditConsumed,
                    is_vendor_cache_hit: undefined,
                    http_status: 200,
                },
            });
        }

        return {
            success: true,
            searchId: parsed.searchId,
            ratesCount: parsed.rates.length,
            creditConsumed,
        };
    } catch (error) {
        // Handle specific errors
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
        const httpStatus =
            error instanceof SerpApiRateLimitError ? 429 : undefined;

        // Release lock with failure
        await releaseRefreshFailure(cacheKey, errorMessage);

        // Update request status if provided
        if (requestId) {
            await prisma.rateShopRequest.update({
                where: { id: requestId },
                data: {
                    status: 'FAILED',
                    error_message: errorMessage.slice(0, 500),
                    http_status: httpStatus,
                },
            });
        }

        return {
            success: false,
            ratesCount: 0,
            creditConsumed: false,
            errorMessage,
        };
    }
}

// ──────────────────────────────────────────────────
// Fan-Out: Write CompetitorRates
// ──────────────────────────────────────────────────

/**
 * Write parsed rates to CompetitorRate table for ALL competitors
 * that share the same property_token.
 *
 * This is the "fan-out" pattern: one SerpApi call benefits multiple
 * hotel tenants that track the same competitor property.
 */
async function fanOutRates(
    cacheId: string,
    propertyToken: string | null,
    checkInDate: string,
    rates: ParsedCompetitorRate[],
): Promise<void> {
    if (!propertyToken) return;

    // Find all active competitors with this property_token
    const competitors = await prisma.competitor.findMany({
        where: {
            serpapi_property_token: propertyToken,
            is_active: true,
        },
        select: { id: true },
    });

    if (competitors.length === 0) return;

    // Create rate records for each competitor
    const now = getVNNow();
    const records = competitors.flatMap((comp) =>
        rates.map((rate) => ({
            competitor_id: comp.id,
            cache_id: cacheId,
            check_in_date: checkInDate,
            source: rate.source,
            scraped_at: now,
            availability_status: rate.availability_status as any,
            data_confidence: rate.data_confidence as any,
            total_rate_lowest: rate.total_rate_lowest,
            total_rate_before_tax: rate.total_rate_before_tax,
            rate_per_night_lowest: rate.rate_per_night_lowest,
            rate_per_night_before_tax: rate.rate_per_night_before_tax,
            representative_price: rate.representative_price,
            price_source_level: rate.price_source_level,
            is_official: rate.is_official,
        })),
    );

    // Batch insert
    await prisma.competitorRate.createMany({
        data: records,
    });
}
