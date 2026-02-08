/**
 * Rate Shopper — Manual Scan API Route
 *
 * POST /api/rate-shopper/scan
 * Two modes:
 *   1. Single: { competitorPropertyToken, offset } — scan one competitor
 *   2. Bulk:   { offset } (no token) — scan ALL active competitors for that offset
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';
import { auth } from '@/lib/auth';
import { manualScan } from '@/lib/rate-shopper/actions/manual-scan';
import prisma from '@/lib/prisma';
import type { OffsetDay } from '@/lib/rate-shopper/constants';

export async function POST(request: NextRequest) {
    try {
        // Auth + role check: scans cost credits, require manager+
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const role = session.user.role || 'viewer';
        if (!session.user.isAdmin && !['manager', 'hotel_admin'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden — Manager role required to trigger scans' }, { status: 403 });
        }

        const hotelId = await getActiveHotelId();
        if (!hotelId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { competitorPropertyToken, offset } = body;

        if (!offset) {
            return NextResponse.json(
                { error: 'Missing offset' },
                { status: 400 },
            );
        }

        // ── Mode 1: Single competitor scan ──
        if (competitorPropertyToken) {
            const result = await manualScan({
                hotelId,
                competitorPropertyToken,
                offset: offset as OffsetDay,
            });
            return NextResponse.json(result);
        }

        // ── Mode 2: Bulk scan — all active competitors ──
        const competitors = await prisma.competitor.findMany({
            where: { hotel_id: hotelId, is_active: true },
            select: { name: true, serpapi_property_token: true },
        });

        if (competitors.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Chưa có đối thủ nào. Thêm đối thủ trước khi tìm giá.',
                summary: { total: 0, completed: 0, cached: 0, failed: 0 },
            });
        }

        const summary = { total: competitors.length, completed: 0, cached: 0, failed: 0 };

        for (const comp of competitors) {
            if (!comp.serpapi_property_token) {
                console.log(`[Scan] Skipping ${comp.name}: no property_token`);
                summary.failed++;
                continue;
            }
            try {
                console.log(`[Scan] Scanning ${comp.name} (offset=${offset}, token=${comp.serpapi_property_token})`);
                const result = await manualScan({
                    hotelId,
                    competitorPropertyToken: comp.serpapi_property_token,
                    offset: offset as OffsetDay,
                });
                console.log(`[Scan] Result for ${comp.name}:`, JSON.stringify(result));
                if (result.status === 'completed') {
                    if (result.message.includes('cache')) {
                        summary.cached++;
                    } else {
                        summary.completed++;
                    }
                } else if (result.status === 'coalesced') {
                    summary.cached++;
                } else {
                    summary.failed++;
                    console.error(`[Scan] FAILED for ${comp.name}: ${result.message}`);
                }
            } catch (err) {
                console.error(`[Scan] EXCEPTION for ${comp.name}:`, err);
                summary.failed++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Đã quét ${summary.completed + summary.cached}/${summary.total} đối thủ (${summary.cached} từ cache)`,
            summary,
        });
    } catch (error) {
        console.error('[RateShopper][API] Scan error:', error);
        return NextResponse.json(
            { error: 'Scan failed', message: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 },
        );
    }
}
