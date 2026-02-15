/**
 * Shared Subscription Activation Function ⭐
 *
 * Single source of truth for ALL subscription changes.
 * MUST be called inside a Prisma $transaction().
 *
 * Used by: SePay webhook, PayPal activate, PayPal webhook, Admin manual, Cron
 */

import type { PrismaClient, PlanTier, RoomBand, SubscriptionStatus } from '@prisma/client';
import { getScaledLimits } from '@/lib/plg/plan-config';

// Transaction client type (subset of PrismaClient inside $transaction)
type PrismaTransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export interface SubscriptionChangeParams {
    periodStart: Date;
    periodEnd: Date;
    provider: 'SEPAY' | 'PAYPAL' | 'ZALO_MANUAL';
    plan: PlanTier;
    roomBand: RoomBand;
    externalSubscriptionId?: string;
    status?: SubscriptionStatus;
}

/**
 * Apply a subscription change atomically inside a Prisma $transaction.
 *
 * @param tx - Prisma transaction client (from $transaction callback)
 * @param hotelId - Hotel UUID
 * @param userId - User who triggered the change
 * @param params - Subscription change parameters
 */
export async function applySubscriptionChange(
    tx: PrismaTransactionClient,
    hotelId: string,
    userId: string,
    params: SubscriptionChangeParams
): Promise<void> {
    const {
        periodStart,
        periodEnd,
        provider,
        plan,
        roomBand,
        externalSubscriptionId,
        status = 'ACTIVE',
    } = params;

    // Get scaled limits for new plan + band
    const limits = getScaledLimits(plan, roomBand);

    // Upsert subscription (create if not exists, update if exists)
    const subscription = await tx.subscription.upsert({
        where: { hotel_id: hotelId },
        create: {
            hotel_id: hotelId,
            plan,
            status,
            room_band: roomBand,
            external_provider: provider,
            external_subscription_id: externalSubscriptionId || null,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            max_users: limits.maxUsers,
            max_properties: limits.maxProperties,
            max_imports_month: limits.maxImportsMonth,
            max_exports_day: limits.maxExportsDay,
            max_export_rows: limits.maxExportRows,
            included_rate_shops_month: limits.includedRateShopsMonth,
            data_retention_months: limits.dataRetentionMonths,
        },
        update: {
            plan,
            status,
            room_band: roomBand,
            external_provider: provider,
            external_subscription_id: externalSubscriptionId || undefined,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            max_users: limits.maxUsers,
            max_properties: limits.maxProperties,
            max_imports_month: limits.maxImportsMonth,
            max_exports_day: limits.maxExportsDay,
            max_export_rows: limits.maxExportRows,
            included_rate_shops_month: limits.includedRateShopsMonth,
            data_retention_months: limits.dataRetentionMonths,
        },
    });

    // Log audit trail
    await tx.auditLog.create({
        data: {
            action: 'SUBSCRIPTION_CHANGED',
            entity_type: 'subscription',
            entity_id: subscription.id,
            actor_id: userId,
            hotel_id: hotelId,
            metadata: {
                plan,
                roomBand,
                provider,
                periodStart: periodStart.toISOString(),
                periodEnd: periodEnd.toISOString(),
                status,
                externalSubscriptionId: externalSubscriptionId || null,
            },
        },
    });
}

/**
 * Downgrade a subscription to STANDARD (free tier).
 * Used by cron when subscription expires.
 */
export async function downgradeToStandard(
    tx: PrismaTransactionClient,
    hotelId: string,
    reason: string
): Promise<void> {
    const limits = getScaledLimits('STANDARD', 'R30');

    await tx.subscription.update({
        where: { hotel_id: hotelId },
        data: {
            plan: 'STANDARD',
            status: 'CANCELLED',
            room_band: 'R30',
            max_users: limits.maxUsers,
            max_properties: limits.maxProperties,
            max_imports_month: limits.maxImportsMonth,
            max_exports_day: limits.maxExportsDay,
            max_export_rows: limits.maxExportRows,
            included_rate_shops_month: limits.includedRateShopsMonth,
            data_retention_months: limits.dataRetentionMonths,
        },
    });

    const sub = await tx.subscription.findUnique({ where: { hotel_id: hotelId } });
    if (sub) {
        await tx.auditLog.create({
            data: {
                action: 'SUBSCRIPTION_CHANGED',
                entity_type: 'subscription',
                entity_id: sub.id,
                actor_id: 'system',
                hotel_id: hotelId,
                metadata: {
                    plan: 'STANDARD',
                    status: 'CANCELLED',
                    reason,
                },
            },
        });
    }
}
