/**
 * Rate Shopper — Manual Scan Server Action
 *
 * Orchestrates a manual scan request from the UI:
 * pre-flight quota check → create request → coalesce or refresh → return result.
 *
 * @see spec §6.1, §4.C, §10.1
 */

'use server';

import prisma from '@/lib/prisma';
import { preFlightCheck } from '../quota-service';
import { readCache } from '../cache-service';
import { executeRefresh } from '../refresh-job';
import { buildCanonicalParams, generateCacheKey, populateMaterializedColumns } from '../cache-key';
import { getVNDate } from '../timezone';
import type { OffsetDay } from '../constants';

export interface ManualScanInput {
    hotelId: string;
    competitorPropertyToken: string;
    offset: OffsetDay;
}

export interface ManualScanResult {
    success: boolean;
    requestId: string;
    status: 'completed' | 'coalesced' | 'failed';
    message: string;
}

/**
 * Execute a manual scan for a specific competitor + offset.
 */
export async function manualScan(
    input: ManualScanInput,
): Promise<ManualScanResult> {
    const { hotelId, competitorPropertyToken, offset } = input;

    // 1. Pre-flight checks
    try {
        await preFlightCheck(hotelId);
    } catch (error) {
        return {
            success: false,
            requestId: '',
            status: 'failed',
            message: error instanceof Error ? error.message : 'Quota check failed',
        };
    }

    // 2. Build canonical params + cache key
    const params = buildCanonicalParams(competitorPropertyToken, offset);
    const cacheKey = generateCacheKey(params);
    const materialized = populateMaterializedColumns(params);
    const today = getVNDate();

    // 3. Ensure cache row exists
    await prisma.rateShopCache.upsert({
        where: { cache_key: cacheKey },
        create: {
            cache_key: cacheKey,
            canonical_params: params as any,
            ...materialized,
        },
        update: {},
    });

    // 4. Create RateShopRequest
    const request = await prisma.rateShopRequest.create({
        data: {
            hotel_id: hotelId,
            cache_key: cacheKey,
            check_in_date: params.check_in_date,
            check_out_date: params.check_out_date,
            adults: params.adults,
            requested_date: new Date(today),
            query_type: 'PROPERTY_DETAILS',
        },
    });

    // 5. Check cache status
    const cacheRead = await readCache(cacheKey);

    // 6. FRESH → no vendor call needed
    if (cacheRead.status === 'FRESH') {
        await prisma.rateShopRequest.update({
            where: { id: request.id },
            data: { status: 'COMPLETED', credit_consumed: false },
        });
        return {
            success: true,
            requestId: request.id,
            status: 'completed',
            message: 'Data served from cache (fresh)',
        };
    }

    // 7. REFRESHING → coalesce
    if (cacheRead.status === 'REFRESHING' && cacheRead.cacheRow?.refreshing_request_id) {
        await prisma.rateShopRequest.update({
            where: { id: request.id },
            data: {
                status: 'COALESCED',
                coalesced_to_request_id: cacheRead.cacheRow.refreshing_request_id,
                credit_consumed: false,
            },
        });
        return {
            success: true,
            requestId: request.id,
            status: 'coalesced',
            message: 'Request coalesced with in-progress refresh',
        };
    }

    // 8. Execute refresh
    const refreshResult = await executeRefresh(cacheKey, params, hotelId, request.id);
    if (refreshResult.success) {
        return {
            success: true,
            requestId: request.id,
            status: 'completed',
            message: `Refresh complete: ${refreshResult.ratesCount} rates fetched`,
        };
    }

    return {
        success: false,
        requestId: request.id,
        status: 'failed',
        message: refreshResult.errorMessage ?? 'Refresh failed',
    };
}
