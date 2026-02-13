// ════════════════════════════════════════════════════════════════════
// Reseller Portal — Token-based magic link auth for resellers
// ════════════════════════════════════════════════════════════════════

import prisma from '@/lib/prisma';
import crypto from 'crypto';

const PORTAL_TOKEN_EXPIRY_HOURS = 72;

// ── Generate Magic Link Token ───────────────────────────────────

export async function generatePortalToken(resellerId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + PORTAL_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.resellerToken.create({
        data: {
            reseller_id: resellerId,
            token,
            expires_at: expiresAt,
        },
    });

    return token;
}

// ── Validate Token ──────────────────────────────────────────────

export async function validatePortalToken(token: string) {
    const record = await prisma.resellerToken.findUnique({ where: { token } });

    if (!record) return null;
    if (record.expires_at < new Date()) return null;
    if (record.used_at) return null; // Already used → reject

    // Mark as used
    await prisma.resellerToken.update({
        where: { id: record.id },
        data: { used_at: new Date() },
    });

    return { resellerId: record.reseller_id };
}

// ── Get Portal Dashboard Data ───────────────────────────────────

export async function getPortalDashboard(resellerId: string) {
    const [reseller, balance, hotels, recentCommissions] = await Promise.all([
        prisma.reseller.findUnique({
            where: { id: resellerId },
            select: { id: true, name: true, email: true, ref_code: true },
        }),
        prisma.commissionLedger.aggregate({
            where: { reseller_id: resellerId, payout_item_id: null },
            _sum: { amount: true },
        }),
        prisma.resellerAttribution.findMany({
            where: { reseller_id: resellerId, status: 'ACTIVE' },
            include: {
                hotel: {
                    select: {
                        hotel_id: true,
                        name: true,
                        subscription: { select: { plan: true, status: true } },
                    },
                },
            },
        }),
        prisma.commissionLedger.findMany({
            where: { reseller_id: resellerId },
            orderBy: { created_at: 'desc' },
            take: 20,
        }),
    ]);

    return {
        reseller,
        unpaidBalance: Number(balance._sum.amount ?? 0),
        activeHotels: hotels.length,
        hotels: hotels.map((h) => ({
            hotelId: h.hotel_id,
            name: h.hotel.name,
            plan: h.hotel.subscription?.plan,
            status: h.hotel.subscription?.status,
            attributedAt: h.created_at,
        })),
        recentCommissions: recentCommissions.map((c) => ({
            id: c.id,
            type: c.type,
            amount: Number(c.amount),
            description: c.description,
            date: c.created_at,
        })),
    };
}

// ── Get Payout History ──────────────────────────────────────────

export async function getPayoutHistory(resellerId: string) {
    return prisma.payoutItem.findMany({
        where: { reseller_id: resellerId, status: 'PAID' },
        include: {
            payout_run: { select: { period: true, paid_at: true } },
        },
        orderBy: { created_at: 'desc' },
    });
}
