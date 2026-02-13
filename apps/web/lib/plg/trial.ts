// ════════════════════════════════════════════════════════════════════
// PLG — Trial Policy Service (7 + 7 Bonus)
// ════════════════════════════════════════════════════════════════════

import prisma from '@/lib/prisma';
import { invalidateEntitlementsCache } from './entitlements';
import { countDistinctSessions, countEvents } from './events';

export interface TrialCondition {
    name: string;
    label: string;
    met: boolean;
    current: number;
    target: number;
}

export interface TrialProgress {
    conditions: TrialCondition[];
    conditionsMet: number;
    bonusThreshold: number; // 2 out of 3
    bonusGranted: boolean;
    bonusEligible: boolean; // met >= threshold && !bonusGranted
}

/**
 * Start a 7-day trial for a hotel (called on first real data upload).
 */
export async function startTrial(hotelId: string): Promise<void> {
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await prisma.subscription.upsert({
        where: { hotel_id: hotelId },
        create: {
            hotel_id: hotelId,
            plan: 'STANDARD',
            status: 'TRIAL',
            trial_ends_at: trialEndsAt,
            trial_bonus_granted: false,
        },
        update: {
            status: 'TRIAL',
            trial_ends_at: trialEndsAt,
            trial_bonus_granted: false,
        },
    });

    invalidateEntitlementsCache(hotelId);
}

/**
 * Check trial bonus conditions: 2/3 required.
 * If met and not already granted → extend by 7 days.
 */
export async function checkTrialBonus(hotelId: string): Promise<TrialProgress> {
    const sub = await prisma.subscription.findUnique({
        where: { hotel_id: hotelId },
        select: {
            status: true,
            trial_ends_at: true,
            trial_bonus_granted: true,
            created_at: true,
        },
    });

    if (!sub || sub.status !== 'TRIAL' || !sub.trial_ends_at) {
        return {
            conditions: [],
            conditionsMet: 0,
            bonusThreshold: 2,
            bonusGranted: false,
            bonusEligible: false,
        };
    }

    const trialStart = sub.created_at;

    // Count conditions
    const importCount = await countEvents(hotelId, 'import_success', trialStart);
    const dashboardSessions = await countDistinctSessions(
        hotelId,
        'dashboard_view_session',
        trialStart,
    );
    const pricingSessions = await countDistinctSessions(
        hotelId,
        'pricing_tab_session_view',
        trialStart,
    );

    const conditions: TrialCondition[] = [
        {
            name: 'import_success',
            label: 'Import dữ liệu',
            met: importCount >= 1,
            current: Math.min(importCount, 1),
            target: 1,
        },
        {
            name: 'dashboard_sessions',
            label: 'Xem Dashboard',
            met: dashboardSessions >= 3,
            current: Math.min(dashboardSessions, 3),
            target: 3,
        },
        {
            name: 'pricing_sessions',
            label: 'Xem Pricing',
            met: pricingSessions >= 2,
            current: Math.min(pricingSessions, 2),
            target: 2,
        },
    ];

    const conditionsMet = conditions.filter((c) => c.met).length;
    const bonusEligible = conditionsMet >= 2 && !sub.trial_bonus_granted;

    // Auto-grant bonus if eligible
    if (bonusEligible) {
        const newEndsAt = new Date(sub.trial_ends_at.getTime() + 7 * 24 * 60 * 60 * 1000);
        await prisma.subscription.update({
            where: { hotel_id: hotelId },
            data: {
                trial_ends_at: newEndsAt,
                trial_bonus_granted: true,
            },
        });
        invalidateEntitlementsCache(hotelId);
    }

    return {
        conditions,
        conditionsMet,
        bonusThreshold: 2,
        bonusGranted: sub.trial_bonus_granted || bonusEligible,
        bonusEligible,
    };
}

/**
 * Get trial progress without auto-granting bonus (for UI display).
 */
export async function getTrialProgress(hotelId: string): Promise<TrialProgress> {
    return checkTrialBonus(hotelId);
}
