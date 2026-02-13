// ════════════════════════════════════════════════════════════════════
// Reseller — Attribution Service
// Lifetime attribution + active condition + 60d grace period
// ════════════════════════════════════════════════════════════════════

import prisma from '@/lib/prisma';
import { AttachMethod } from '@prisma/client';

/**
 * Attribute a hotel to a reseller. Only one active attribution per hotel.
 * If hotel already attributed → skip (idempotent).
 */
export async function attributeHotel(
    hotelId: string,
    resellerId: string,
    method: AttachMethod,
): Promise<{ created: boolean; id: string }> {
    // Check if hotel already has an active attribution to ANY reseller
    const existing = await prisma.resellerAttribution.findFirst({
        where: { hotel_id: hotelId, status: 'ACTIVE' },
    });

    if (existing) {
        return { created: false, id: existing.id };
    }

    const attr = await prisma.resellerAttribution.create({
        data: {
            hotel_id: hotelId,
            reseller_id: resellerId,
            attach_method: method,
        },
    });

    return { created: true, id: attr.id };
}

/**
 * Close an attribution (never delete — set effective_to + ended_reason).
 */
export async function closeAttribution(
    attributionId: string,
    reason: string,
): Promise<void> {
    await prisma.resellerAttribution.update({
        where: { id: attributionId },
        data: {
            status: 'CHURNED',
            effective_to: new Date(),
            ended_reason: reason,
        },
    });
}

/**
 * Get active attribution for a hotel (if any).
 */
export async function getActiveAttribution(hotelId: string) {
    return prisma.resellerAttribution.findFirst({
        where: { hotel_id: hotelId, status: 'ACTIVE' },
        include: {
            reseller: {
                select: { id: true, name: true, ref_code: true },
                include: {
                    contracts: {
                        where: { is_active: true },
                        orderBy: { effective_from: 'desc' },
                        take: 1,
                    },
                },
            },
        },
    } as Parameters<typeof prisma.resellerAttribution.findFirst>[0]);
}

/**
 * List all attributions for a reseller.
 */
export async function getResellerHotels(resellerId: string) {
    return prisma.resellerAttribution.findMany({
        where: { reseller_id: resellerId },
        include: { hotel: { select: { hotel_id: true, name: true } } },
        orderBy: { created_at: 'desc' },
    });
}
