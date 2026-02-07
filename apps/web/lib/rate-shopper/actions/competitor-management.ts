/**
 * Rate Shopper — Competitor Management Server Actions
 *
 * CRUD operations for competitor onboarding and management.
 * Uses SerpApi autocomplete for property_token discovery.
 *
 * @see spec §10.1
 */

'use server';

import prisma from '@/lib/prisma';
import { fetchHotelSearch } from '../serpapi-client';
import type { SerpApiHotelSearchProperty } from '../types';

// ──────────────────────────────────────────────────
// Search Cache (save SerpApi costs)
// ──────────────────────────────────────────────────

const SEARCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
    suggestions: SearchResult['suggestions'];
    cachedAt: number;
}

/** Server-side cache: normalized query → results + timestamp */
const searchCache = new Map<string, CacheEntry>();

function normalizeQuery(q: string): string {
    return q.trim().toLowerCase().replace(/\s+/g, ' ');
}

// ──────────────────────────────────────────────────
// Hotel Search (Competitor Discovery)
// ──────────────────────────────────────────────────

export interface SearchResult {
    suggestions: {
        name: string;
        property_token: string;
        address?: string;
        rating?: number;
        thumbnail?: string;
    }[];
    fromCache?: boolean;
}

export async function searchCompetitor(
    query: string,
): Promise<SearchResult> {
    if (!query || query.trim().length < 2) {
        return { suggestions: [] };
    }

    const key = normalizeQuery(query);

    // ── Check cache first ──
    const cached = searchCache.get(key);
    if (cached && Date.now() - cached.cachedAt < SEARCH_CACHE_TTL_MS) {
        console.log(`[RateShopper][Search] Cache HIT for "${key}" (age: ${Math.round((Date.now() - cached.cachedAt) / 60000)}m)`);
        return { suggestions: cached.suggestions, fromCache: true };
    }

    // ── Cache miss → call SerpApi ──
    console.log(`[RateShopper][Search] Cache MISS for "${key}" — calling SerpApi`);
    const response = await fetchHotelSearch(query.trim());

    // SerpApi google_hotels has 2 response formats:
    // 1. Single property match: data at top level (name, property_token, address...)
    // 2. Multiple results: data in properties[] array
    const rawResponse = response as Record<string, unknown>;
    const suggestions: SearchResult['suggestions'] = [];

    // Case 1: Single property match (exact hotel name search)
    if (rawResponse.property_token && rawResponse.name) {
        suggestions.push({
            name: rawResponse.name as string,
            property_token: rawResponse.property_token as string,
            address: (rawResponse.address as string) || undefined,
            rating: (rawResponse.overall_rating as number) || undefined,
            thumbnail: undefined,
        });
    }

    // Case 2: Multiple properties array
    if (response.properties && Array.isArray(response.properties)) {
        for (const p of response.properties) {
            if (p.property_token) {
                suggestions.push({
                    name: p.name,
                    property_token: p.property_token,
                    address: p.description || undefined,
                    rating: p.overall_rating || undefined,
                    thumbnail: p.images?.[0]?.thumbnail || undefined,
                });
            }
        }
    }

    const result = suggestions.slice(0, 10);

    // ── Store in cache ──
    if (result.length > 0) {
        searchCache.set(key, { suggestions: result, cachedAt: Date.now() });
        // Evict old entries (keep max 100)
        if (searchCache.size > 100) {
            const oldest = [...searchCache.entries()]
                .sort((a, b) => a[1].cachedAt - b[1].cachedAt)[0];
            if (oldest) searchCache.delete(oldest[0]);
        }
    }

    return { suggestions: result, fromCache: false };
}

// ──────────────────────────────────────────────────
// CRUD Operations
// ──────────────────────────────────────────────────

export interface AddCompetitorInput {
    hotelId: string;
    name: string;
    serpApiPropertyToken: string;
    tier?: number;
}

export async function addCompetitor(input: AddCompetitorInput) {
    const { hotelId, name, serpApiPropertyToken, tier } = input;

    const existing = await prisma.competitor.findFirst({
        where: {
            hotel_id: hotelId,
            serpapi_property_token: serpApiPropertyToken,
        },
    });

    if (existing) {
        if (!existing.is_active) {
            return prisma.competitor.update({
                where: { id: existing.id },
                data: { is_active: true, name, tier: tier ?? 1 },
            });
        }
        throw new Error('Competitor already exists in compset');
    }

    return prisma.competitor.create({
        data: {
            hotel_id: hotelId,
            name,
            serpapi_property_token: serpApiPropertyToken,
            tier: tier ?? 1,
        },
    });
}

export async function removeCompetitor(
    hotelId: string,
    competitorId: string,
) {
    return prisma.competitor.update({
        where: { id: competitorId, hotel_id: hotelId },
        data: { is_active: false },
    });
}

export async function listCompetitors(hotelId: string) {
    return prisma.competitor.findMany({
        where: { hotel_id: hotelId, is_active: true },
        orderBy: [{ tier: 'asc' }, { name: 'asc' }],
    });
}

export async function updateCompetitor(
    hotelId: string,
    competitorId: string,
    data: { name?: string; tier?: number },
) {
    return prisma.competitor.update({
        where: { id: competitorId, hotel_id: hotelId },
        data,
    });
}
