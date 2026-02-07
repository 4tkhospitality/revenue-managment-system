/**
 * Rate Shopper — Cache Service
 *
 * SWR (Stale-While-Revalidate) cache logic for RateShopCache.
 * Handles: read (FRESH/STALE/EXPIRED), lock-and-refresh, backoff, and status management.
 *
 * @see spec §5, §6, §10.1
 */

import prisma from '@/lib/prisma';
import { getTTLForOffset, getBackoffMs, MAX_FAIL_STREAK } from './constants';
import { getVNNow } from './timezone';
import type { CacheStatus } from './types';

// ──────────────────────────────────────────────────
// Cache Read (SWR Logic)
// ──────────────────────────────────────────────────

export interface CacheReadResult {
    status: 'FRESH' | 'STALE' | 'EXPIRED' | 'REFRESHING' | 'FAILED' | 'NOT_FOUND';
    cacheRow: Awaited<ReturnType<typeof prisma.rateShopCache.findUnique>> | null;
}

/**
 * Read cache and determine SWR status.
 * - FRESH: within TTL → serve directly
 * - STALE: past TTL but within grace → serve + trigger background refresh
 * - EXPIRED: past grace → must refresh before serving
 * - REFRESHING: another job is actively refreshing
 * - FAILED: last refresh failed, within backoff window
 * - NOT_FOUND: no cache entry exists
 */
export async function readCache(cacheKey: string): Promise<CacheReadResult> {
    const row = await prisma.rateShopCache.findUnique({
        where: { cache_key: cacheKey },
    });

    if (!row) {
        return { status: 'NOT_FOUND', cacheRow: null };
    }

    const now = getVNNow();

    // Check if actively refreshing (and lock valid)
    if (
        row.status === 'REFRESHING' &&
        row.refresh_lock_until &&
        row.refresh_lock_until > now
    ) {
        return { status: 'REFRESHING', cacheRow: row };
    }

    // Check if in backoff window
    if (row.backoff_until && row.backoff_until > now) {
        return { status: 'FAILED', cacheRow: row };
    }

    // SWR check
    if (row.expires_at > now) {
        return { status: 'FRESH', cacheRow: row };
    }

    if (row.stale_until > now) {
        return { status: 'STALE', cacheRow: row };
    }

    return { status: 'EXPIRED', cacheRow: row };
}

// ──────────────────────────────────────────────────
// Lock & Refresh
// ──────────────────────────────────────────────────

export interface LockResult {
    acquired: boolean;
    cacheId?: string;
}

/**
 * Attempt to acquire refresh lock on a cache key.
 * Uses atomic UPDATE with WHERE clause to prevent race conditions.
 *
 * @param cacheKey - The cache key to lock
 * @param requestId - Optional RateShopRequest ID for coalesce audit
 * @returns Whether lock was acquired
 */
export async function acquireRefreshLock(
    cacheKey: string,
    requestId?: string,
): Promise<LockResult> {
    const now = getVNNow();
    const lockUntil = new Date(now.getTime() + 60_000); // 1 min lock

    try {
        // Atomic: only update if not already locked (or lock expired)
        const result = await prisma.rateShopCache.updateMany({
            where: {
                cache_key: cacheKey,
                OR: [
                    { refresh_lock_until: null },
                    { refresh_lock_until: { lt: now } },
                ],
            },
            data: {
                status: 'REFRESHING',
                refresh_lock_until: lockUntil,
                refreshing_request_id: requestId ?? null,
            },
        });

        if (result.count === 0) {
            return { acquired: false };
        }

        const row = await prisma.rateShopCache.findUnique({
            where: { cache_key: cacheKey },
            select: { id: true },
        });

        return { acquired: true, cacheId: row?.id };
    } catch {
        return { acquired: false };
    }
}

/**
 * Release refresh lock after successful fetch.
 * Updates cache with new data, sets TTL, and clears lock.
 */
export async function releaseRefreshSuccess(
    cacheKey: string,
    data: {
        raw_response: unknown;
        raw_response_ref?: string;
        is_vendor_cache_hit?: boolean;
        offsetDays: number;
    },
): Promise<void> {
    const now = getVNNow();
    const { cacheTTL, staleGrace } = getTTLForOffset(data.offsetDays);

    await prisma.rateShopCache.update({
        where: { cache_key: cacheKey },
        data: {
            status: 'FRESH',
            raw_response: data.raw_response as any, // Prisma Json type
            raw_response_ref: data.raw_response_ref ?? null,
            fetched_at: now,
            expires_at: new Date(now.getTime() + cacheTTL),
            stale_until: new Date(now.getTime() + cacheTTL + staleGrace),
            is_vendor_cache_hit: data.is_vendor_cache_hit ?? null,
            refresh_lock_until: null,
            refreshing_request_id: null,
            fail_streak: 0,
            backoff_until: null,
        },
    });
}

/**
 * Handle refresh failure: increment fail_streak, set backoff, clear lock.
 */
export async function releaseRefreshFailure(
    cacheKey: string,
    errorMessage?: string,
): Promise<void> {
    const now = getVNNow();

    // Get current fail_streak
    const current = await prisma.rateShopCache.findUnique({
        where: { cache_key: cacheKey },
        select: { fail_streak: true },
    });

    const newStreak = Math.min((current?.fail_streak ?? 0) + 1, MAX_FAIL_STREAK);
    const backoffMs = getBackoffMs(newStreak);

    await prisma.rateShopCache.update({
        where: { cache_key: cacheKey },
        data: {
            status: 'FAILED',
            fail_streak: newStreak,
            backoff_until: new Date(now.getTime() + backoffMs),
            refresh_lock_until: null,
            refreshing_request_id: null,
        },
    });
}
