// Seed default pricing configs into DB
// Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-pricing.ts
// Or via API: POST /api/admin/pricing-config/seed

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Check if any configs already exist
        const existingCount = await prisma.pricingConfig.count();
        if (existingCount > 0) {
            return NextResponse.json({
                message: `Seed skipped — ${existingCount} configs already exist`,
                seeded: false,
            });
        }

        const userId = session.user.id;

        // Seed BASE_PRICE configs (4 tiers × GLOBAL)
        const basePrices = [
            { tier: 'STANDARD' as const, amount_vnd: 0 },
            { tier: 'SUPERIOR' as const, amount_vnd: 990_000 },
            { tier: 'DELUXE' as const, amount_vnd: 1_990_000 },
            { tier: 'SUITE' as const, amount_vnd: 3_490_000 },
        ];

        // Seed BAND_MULTIPLIER configs (4 bands × GLOBAL)
        const bandMultipliers = [
            { room_band: 'R30' as const, multiplier: 1.0 },
            { room_band: 'R80' as const, multiplier: 1.3 },
            { room_band: 'R150' as const, multiplier: 1.6 },
            { room_band: 'R300P' as const, multiplier: 2.0 },
        ];

        // Seed TERM_DISCOUNT configs
        const termDiscounts = [
            { term_months: 1, percent: 0 },
            { term_months: 3, percent: 50 },
        ];

        await prisma.$transaction(async (tx) => {
            // Base prices
            for (const bp of basePrices) {
                await tx.pricingConfig.create({
                    data: {
                        config_type: 'BASE_PRICE',
                        tier: bp.tier,
                        amount_vnd: bp.amount_vnd,
                        scope: 'GLOBAL',
                        label: `Default ${bp.tier}`,
                        updated_by: userId,
                    },
                });
            }

            // Band multipliers
            for (const bm of bandMultipliers) {
                await tx.pricingConfig.create({
                    data: {
                        config_type: 'BAND_MULTIPLIER',
                        room_band: bm.room_band,
                        multiplier: bm.multiplier,
                        scope: 'GLOBAL',
                        label: `Default ${bm.room_band}`,
                        updated_by: userId,
                    },
                });
            }

            // Term discounts
            for (const td of termDiscounts) {
                await tx.pricingConfig.create({
                    data: {
                        config_type: 'TERM_DISCOUNT',
                        term_months: td.term_months,
                        percent: td.percent,
                        scope: 'GLOBAL',
                        label: `Default ${td.term_months}m`,
                        updated_by: userId,
                    },
                });
            }

            // Audit log
            await tx.pricingConfigAudit.create({
                data: {
                    config_id: 'seed',
                    action: 'PRICING_CONFIG_CREATED',
                    changed_by: userId,
                    note: 'Seeded 10 default GLOBAL configs (4 base + 4 band + 2 term)',
                },
            });
        });

        return NextResponse.json({
            message: 'Seeded 10 default pricing configs',
            seeded: true,
        });
    } catch (error) {
        console.error('[Pricing Seed] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Seed failed' },
            { status: 500 }
        );
    }
}
