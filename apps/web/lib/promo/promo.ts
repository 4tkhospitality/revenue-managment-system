// ════════════════════════════════════════════════════════════════════
// Promo — PromoCode + Redemption + Best Discount Wins
// ════════════════════════════════════════════════════════════════════

import prisma from '@/lib/prisma';
import { PlanTier, Prisma } from '@prisma/client';
import { attributeHotel } from '@/lib/reseller/attribution';

// ── Validate ────────────────────────────────────────────────────────

export async function validateCode(code: string, hotelPlan?: PlanTier) {
    const promo = await prisma.promoCode.findUnique({ where: { code } });

    if (!promo) return { valid: false, error: 'Code does not exist' };
    if (!promo.is_active) return { valid: false, error: 'Code has been deactivated' };
    if (promo.expires_at && promo.expires_at < new Date()) return { valid: false, error: 'Code has expired' };
    if (promo.max_redemptions && promo.current_redemptions >= promo.max_redemptions) {
        return { valid: false, error: 'Code has reached usage limit' };
    }
    if (hotelPlan && promo.plan_eligible.length > 0 && !promo.plan_eligible.includes(hotelPlan)) {
        return { valid: false, error: 'Code does not apply to your plan' };
    }

    return {
        valid: true,
        promo: {
            id: promo.id,
            code: promo.code,
            percentOff: Number(promo.percent_off),
            templateType: promo.template_type,
            description: promo.description,
        },
    };
}

// ── Redeem (Transactional) ──────────────────────────────────────────

export async function redeemCode(code: string, hotelId: string) {
    return prisma.$transaction(async (tx) => {
        // Step a: Lock hotel row (SELECT FOR UPDATE via raw query)
        await tx.$queryRaw`SELECT hotel_id FROM hotels WHERE hotel_id = ${hotelId}::uuid FOR UPDATE`;

        // Step b: Check hotel doesn't already have an active promo
        const hotel = await tx.hotel.findUnique({
            where: { hotel_id: hotelId },
            select: { active_promo_code_id: true },
        });

        if (hotel?.active_promo_code_id) {
            throw new Error('You already have an active promo code');
        }

        // Step c: Atomic increment with conditions
        const result = await tx.$executeRaw`
      UPDATE promo_codes
      SET current_redemptions = current_redemptions + 1
      WHERE code = ${code}
        AND is_active = true
        AND (max_redemptions IS NULL OR current_redemptions < max_redemptions)
        AND (expires_at IS NULL OR expires_at > NOW())
    `;

        if (result === 0) {
            throw new Error('Invalid code or usage limit reached');
        }

        // Get the promo for redemption info
        const promo = await tx.promoCode.findUnique({ where: { code } });
        if (!promo) throw new Error('Code does not exist');

        // Step d: Create redemption record
        const redemption = await tx.promoRedemption.create({
            data: {
                promo_code_id: promo.id,
                hotel_id: hotelId,
                status: 'ACTIVE',
            },
        });

        // Step e: Update hotel's active promo code
        await tx.hotel.update({
            where: { hotel_id: hotelId },
            data: { active_promo_code_id: promo.id },
        });

        // Step f: If promo has reseller → auto-attribute
        if (promo.reseller_id) {
            await attributeHotel(hotelId, promo.reseller_id, 'COUPON_CODE');
        }

        return {
            redemptionId: redemption.id,
            percentOff: Number(promo.percent_off),
            promoCode: promo.code,
        };
    });
}

// ── Best Discount Wins ──────────────────────────────────────────────

interface DiscountCandidate {
    id: string;
    percentOff: number;
    templateType: 'GLOBAL' | 'RESELLER' | 'CAMPAIGN';
    createdAt: Date;
}

const TYPE_PRIORITY: Record<string, number> = {
    CAMPAIGN: 3,
    GLOBAL: 2,
    RESELLER: 1,
};

export function bestDiscountWins(candidates: DiscountCandidate[]): DiscountCandidate | null {
    if (candidates.length === 0) return null;

    return candidates.sort((a, b) => {
        // 1. Highest percent_off wins
        if (b.percentOff !== a.percentOff) return b.percentOff - a.percentOff;
        // 2. Template type priority: CAMPAIGN > GLOBAL > RESELLER
        const pa = TYPE_PRIORITY[a.templateType] || 0;
        const pb = TYPE_PRIORITY[b.templateType] || 0;
        if (pb !== pa) return pb - pa;
        // 3. Oldest created_at wins
        return a.createdAt.getTime() - b.createdAt.getTime();
    })[0];
}

// ── Admin CRUD ──────────────────────────────────────────────────────

export async function createPromoCode(data: {
    code: string;
    templateType: 'GLOBAL' | 'RESELLER' | 'CAMPAIGN';
    percentOff: number;
    description?: string;
    resellerId?: string;
    planEligible?: PlanTier[];
    maxRedemptions?: number;
    expiresAt?: Date;
}) {
    return prisma.promoCode.create({
        data: {
            code: data.code.toUpperCase(),
            template_type: data.templateType,
            percent_off: data.percentOff,
            description: data.description,
            reseller_id: data.resellerId,
            plan_eligible: data.planEligible ?? [],
            max_redemptions: data.maxRedemptions,
            expires_at: data.expiresAt,
        },
    });
}

export async function listPromoCodes() {
    return prisma.promoCode.findMany({
        include: {
            _count: { select: { redemptions: true } },
            reseller: { select: { name: true, ref_code: true } },
        },
        orderBy: { created_at: 'desc' },
    });
}

export async function getActivePromo(hotelId: string) {
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { active_promo_code_id: true },
    });

    if (!hotel?.active_promo_code_id) return null;

    return prisma.promoCode.findUnique({
        where: { id: hotel.active_promo_code_id },
    });
}
