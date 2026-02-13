// ════════════════════════════════════════════════════════════════════
// Audit — append-only audit trail for PLG events
// ════════════════════════════════════════════════════════════════════

import prisma from '@/lib/prisma';
import { AuditAction, Prisma } from '@prisma/client';

export async function audit(
    action: AuditAction,
    opts: {
        actorId?: string;
        entityType: string;
        entityId?: string;
        hotelId?: string;
        metadata?: Record<string, unknown>;
    },
): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                entity_type: opts.entityType,
                entity_id: opts.entityId,
                hotel_id: opts.hotelId,
                actor_id: opts.actorId,
                metadata: (opts.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
            },
        });
    } catch (err) {
        // Audit should never break the main flow
        console.error('[Audit] Failed to write:', err);
    }
}

export async function getAuditLog(params: {
    hotelId?: string;
    actorId?: string;
    action?: AuditAction;
    limit?: number;
    offset?: number;
}) {
    const where: Record<string, unknown> = {};
    if (params.hotelId) where.hotel_id = params.hotelId;
    if (params.actorId) where.actor_id = params.actorId;
    if (params.action) where.action = params.action;

    return prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: params.limit ?? 50,
        skip: params.offset ?? 0,
    });
}
