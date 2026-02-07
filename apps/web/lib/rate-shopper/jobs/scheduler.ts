/**
 * Rate Shopper — Scheduler Job
 *
 * Triggered by cron, iterates all active competitor cache keys,
 * checks SWR status, and refreshes STALE/EXPIRED entries within batch limit.
 *
 * Always increments system daily budget when vendor call made.
 *
 * @see spec §10.2, §6.2, Key Decision #8, #17, #18
 */

import prisma from '@/lib/prisma';
import { OFFSET_DAYS, SCHEDULER_BATCH_LIMIT } from '../constants';
import { buildCanonicalParams, generateCacheKey, populateMaterializedColumns } from '../cache-key';
import { readCache } from '../cache-service';
import { executeRefresh } from '../refresh-job';
import { checkSystemBudget } from '../quota-service';
import { getVNNow } from '../timezone';
import type { OffsetDay } from '../constants';

export interface SchedulerResult {
    totalChecked: number;
    totalRefreshed: number;
    totalSkipped: number;
    totalFailed: number;
    budgetUsed: number;
    startedAt: Date;
    completedAt: Date;
}

/**
 * Run the scheduler: seed cache → check status → refresh within limit.
 *
 * Steps:
 * 1. Seed cache rows for all active competitor × offset combos
 * 2. Query STALE/EXPIRED cache entries (priority: short offsets first)
 * 3. Refresh up to SCHEDULER_BATCH_LIMIT entries
 * 4. Log results for observability
 */
export async function runScheduler(): Promise<SchedulerResult> {
    const startedAt = getVNNow();
    let totalChecked = 0;
    let totalRefreshed = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    let budgetUsed = 0;

    // 1. Get all active competitors with property_tokens
    const competitors = await prisma.competitor.findMany({
        where: {
            is_active: true,
            serpapi_property_token: { not: null },
        },
        select: {
            serpapi_property_token: true,
        },
        distinct: ['serpapi_property_token'],
    });

    const uniqueTokens = competitors
        .map((c) => c.serpapi_property_token)
        .filter(Boolean) as string[];

    // 2. Seed cache rows for ALL token × offset combos
    for (const token of uniqueTokens) {
        for (const offset of OFFSET_DAYS) {
            const params = buildCanonicalParams(token, offset);
            const cacheKey = generateCacheKey(params);
            const materialized = populateMaterializedColumns(params);

            await prisma.rateShopCache.upsert({
                where: { cache_key: cacheKey },
                create: {
                    cache_key: cacheKey,
                    canonical_params: params as any,
                    ...materialized,
                },
                update: {}, // No-op if exists
            });
        }
    }

    // 3. Find STALE/EXPIRED entries (sorted by offset ascending — short horizon first)
    const now = getVNNow();
    const candidates = await prisma.rateShopCache.findMany({
        where: {
            status: { in: ['STALE', 'EXPIRED'] },
            OR: [
                { backoff_until: null },
                { backoff_until: { lt: now } },
            ],
        },
        orderBy: [
            { offset_days: 'asc' },
            { expires_at: 'asc' },
        ],
        take: SCHEDULER_BATCH_LIMIT * 2, // Over-fetch to account for lock failures
    });

    totalChecked = candidates.length;

    // 4. Refresh within batch limit and system budget
    for (const candidate of candidates) {
        if (totalRefreshed >= SCHEDULER_BATCH_LIMIT) {
            totalSkipped += candidates.length - totalChecked;
            break;
        }

        // Check system budget before each call
        const budget = await checkSystemBudget();
        if (!budget.allowed) {
            totalSkipped++;
            continue;
        }

        // Build params from cache row
        const params = candidate.canonical_params as any;
        if (!params || !params.property_token) {
            totalSkipped++;
            continue;
        }

        // Execute refresh (scheduler = hotelId null → system-level billing)
        const result = await executeRefresh(
            candidate.cache_key,
            params,
            null, // No specific hotel — scheduler is system-level
        );

        if (result.success) {
            totalRefreshed++;
            budgetUsed++;
        } else {
            totalFailed++;
        }
    }

    const completedAt = getVNNow();

    return {
        totalChecked,
        totalRefreshed,
        totalSkipped,
        totalFailed,
        budgetUsed,
        startedAt,
        completedAt,
    };
}
