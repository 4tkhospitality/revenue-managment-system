/**
 * Rate Shopper — Data Cleanup Job
 *
 * Daily cron job (03:00 VN) that purges expired data
 * according to retention policy (spec §15).
 *
 * @see spec §10.2 DataCleanupJob, §15 Retention Policy
 */

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
    RAW_RESPONSE_RETENTION_DAYS,
    PAST_STAY_PURGE_DAYS,
    NON_LATEST_SNAPSHOT_DAYS,
    COMPETITOR_RATE_MAX_AGE_DAYS,
} from '../constants';
import { getVNNow } from '../timezone';

export interface CleanupResult {
    rawResponsesCleared: number;
    pastStayRatesPurged: number;
    oldSnapshotsPurged: number;
    oldCompetitorRatesPurged: number;
    expiredRecommendationsPurged: number;
    startedAt: Date;
    completedAt: Date;
}

/**
 * Run all cleanup tasks.
 */
export async function runDataCleanup(): Promise<CleanupResult> {
    const startedAt = getVNNow();

    const [
        rawResponsesCleared,
        pastStayRatesPurged,
        oldSnapshotsPurged,
        oldCompetitorRatesPurged,
        expiredRecommendationsPurged,
    ] = await Promise.all([
        clearOldRawResponses(),
        purgePastStayRates(),
        purgeOldSnapshots(),
        purgeOldCompetitorRates(),
        purgeExpiredRecommendations(),
    ]);

    return {
        rawResponsesCleared,
        pastStayRatesPurged,
        oldSnapshotsPurged,
        oldCompetitorRatesPurged,
        expiredRecommendationsPurged,
        startedAt,
        completedAt: getVNNow(),
    };
}

/**
 * Clear raw_response JSON from cache entries older than retention period.
 * Keeps raw_response_ref (signed URL) for audit trail.
 */
async function clearOldRawResponses(): Promise<number> {
    const cutoff = new Date(
        getVNNow().getTime() - RAW_RESPONSE_RETENTION_DAYS * 86400000,
    );

    const result = await prisma.rateShopCache.updateMany({
        where: {
            raw_response: { not: Prisma.AnyNull },
            fetched_at: { lt: cutoff },
        },
        data: { raw_response: Prisma.DbNull },
    });

    return result.count;
}

/**
 * Delete competitor rates for past stay dates.
 */
async function purgePastStayRates(): Promise<number> {
    const cutoff = new Date(
        getVNNow().getTime() - PAST_STAY_PURGE_DAYS * 86400000,
    );
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const result = await prisma.competitorRate.deleteMany({
        where: {
            check_in_date: { lt: cutoffStr },
        },
    });

    return result.count;
}

/**
 * Delete non-latest snapshots older than retention.
 */
async function purgeOldSnapshots(): Promise<number> {
    const cutoff = new Date(
        getVNNow().getTime() - NON_LATEST_SNAPSHOT_DAYS * 86400000,
    );
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const result = await prisma.marketSnapshot.deleteMany({
        where: {
            is_latest: false,
            snapshot_date: { lt: cutoffStr },
        },
    });

    return result.count;
}

/**
 * Delete old competitor rates beyond max age.
 */
async function purgeOldCompetitorRates(): Promise<number> {
    const cutoff = new Date(
        getVNNow().getTime() - COMPETITOR_RATE_MAX_AGE_DAYS * 86400000,
    );

    const result = await prisma.competitorRate.deleteMany({
        where: {
            scraped_at: { lt: cutoff },
        },
    });

    return result.count;
}

/**
 * Expire old PENDING recommendations.
 */
async function purgeExpiredRecommendations(): Promise<number> {
    const cutoff = new Date(getVNNow().getTime() - 7 * 86400000); // 7 days

    const result = await prisma.rateShopRecommendation.updateMany({
        where: {
            status: 'PENDING',
            created_at: { lt: cutoff },
        },
        data: { status: 'EXPIRED' },
    });

    return result.count;
}
