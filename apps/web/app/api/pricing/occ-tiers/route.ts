// Dynamic Pricing: OCC Tiers — List & Bulk Upsert
// BA Note #2: Tier semantics [min, max), last tier includes 1.0
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getActiveHotelId } from '@/lib/pricing/get-hotel';

// Default 4 tiers for new hotels
const DEFAULT_TIERS = [
    { tier_index: 0, label: '0-35%', occ_min: 0.0, occ_max: 0.35, multiplier: 1.0, adjustment_type: 'MULTIPLY', fixed_amount: 0 },
    { tier_index: 1, label: '35-65%', occ_min: 0.35, occ_max: 0.65, multiplier: 1.10, adjustment_type: 'MULTIPLY', fixed_amount: 0 },
    { tier_index: 2, label: '65-85%', occ_min: 0.65, occ_max: 0.85, multiplier: 1.20, adjustment_type: 'MULTIPLY', fixed_amount: 0 },
    { tier_index: 3, label: '>85%', occ_min: 0.85, occ_max: 1.0, multiplier: 1.30, adjustment_type: 'MULTIPLY', fixed_amount: 0 },
];

// GET /api/pricing/occ-tiers — List tiers (returns defaults if none configured)
export async function GET() {
    try {
        const hotelId = await getActiveHotelId();

        if (!hotelId) {
            return NextResponse.json(
                { error: 'No active hotel selected' },
                { status: 401 }
            );
        }

        const tiers = await prisma.occTierConfig.findMany({
            where: { hotel_id: hotelId },
            orderBy: { tier_index: 'asc' },
        });

        if (tiers.length === 0) {
            // Return defaults (not yet saved to DB)
            return NextResponse.json({
                tiers: DEFAULT_TIERS,
                isDefault: true,
            });
        }

        return NextResponse.json({
            tiers,
            isDefault: false,
        });
    } catch (error) {
        console.error('Error fetching OCC tiers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch OCC tiers' },
            { status: 500 }
        );
    }
}

/**
 * Validate OCC tiers:
 * - 3 to 6 tiers
 * - Boundaries in 0–1 decimal
 * - Contiguous: tier[i].occ_max === tier[i+1].occ_min
 * - First tier starts at 0.0, last tier ends at 1.0
 * - Each tier: occ_min < occ_max
 * - Multiplier >= 0
 */
function validateTiers(tiers: any[]): string | null {
    if (tiers.length < 3 || tiers.length > 6) {
        return 'Must have between 3 and 6 tiers';
    }

    // Sort by tier_index
    const sorted = [...tiers].sort((a, b) => a.tier_index - b.tier_index);

    for (let i = 0; i < sorted.length; i++) {
        const t = sorted[i];

        // Check boundaries in [0, 1]
        if (t.occ_min < 0 || t.occ_min > 1 || t.occ_max < 0 || t.occ_max > 1) {
            return `Tier ${i}: boundaries must be between 0 and 1`;
        }

        // Check min < max
        if (t.occ_min >= t.occ_max) {
            return `Tier ${i}: occ_min must be less than occ_max`;
        }

        // Check multiplier
        if (typeof t.multiplier !== 'number' || t.multiplier < 0) {
            return `Tier ${i}: multiplier must be a non-negative number`;
        }

        // Check adjustment_type (per-tier: MULTIPLY or FIXED)
        const adjType = t.adjustment_type ?? 'MULTIPLY';
        if (adjType !== 'MULTIPLY' && adjType !== 'FIXED') {
            return `Tier ${i}: adjustment_type must be 'MULTIPLY' or 'FIXED'`;
        }

        // Check fixed_amount is a number when present
        if (t.fixed_amount !== undefined && typeof t.fixed_amount !== 'number') {
            return `Tier ${i}: fixed_amount must be a number`;
        }

        // Check contiguous with next tier
        if (i < sorted.length - 1) {
            const next = sorted[i + 1];
            if (Math.abs(t.occ_max - next.occ_min) > 0.001) {
                return `Gap between tier ${i} (max=${t.occ_max}) and tier ${i + 1} (min=${next.occ_min})`;
            }
        }
    }

    // First tier must start at 0
    if (Math.abs(sorted[0].occ_min) > 0.001) {
        return 'First tier must start at 0.0';
    }

    // Last tier must end at 1.0
    if (Math.abs(sorted[sorted.length - 1].occ_max - 1.0) > 0.001) {
        return 'Last tier must end at 1.0';
    }

    return null; // valid
}

// PUT /api/pricing/occ-tiers — Bulk upsert (replace all tiers for hotel)
export async function PUT(request: NextRequest) {
    try {
        const hotelId = await getActiveHotelId();

        if (!hotelId) {
            return NextResponse.json(
                { error: 'No active hotel selected' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { tiers } = body;

        if (!Array.isArray(tiers)) {
            return NextResponse.json(
                { error: 'tiers must be an array' },
                { status: 400 }
            );
        }

        // Validate
        const error = validateTiers(tiers);
        if (error) {
            return NextResponse.json({ error }, { status: 400 });
        }

        // Sort and normalize tier_index
        const sorted = [...tiers]
            .sort((a, b) => a.occ_min - b.occ_min)
            .map((t, i) => ({
                ...t,
                tier_index: i,
            }));

        // Transaction: delete all existing + create new
        const result = await prisma.$transaction(async (tx) => {
            await tx.occTierConfig.deleteMany({
                where: { hotel_id: hotelId },
            });

            const created = await Promise.all(
                sorted.map((t) =>
                    tx.occTierConfig.create({
                        data: {
                            hotel_id: hotelId, // server-derived
                            tier_index: t.tier_index,
                            label: t.label || `${Math.round(t.occ_min * 100)}-${Math.round(t.occ_max * 100)}%`,
                            occ_min: t.occ_min,
                            occ_max: t.occ_max,
                            multiplier: t.multiplier,
                            adjustment_type: t.adjustment_type ?? 'MULTIPLY',
                            fixed_amount: t.fixed_amount ?? 0,
                        },
                    })
                )
            );

            return created;
        });

        return NextResponse.json({
            tiers: result,
            isDefault: false,
        });
    } catch (error) {
        console.error('Error upserting OCC tiers:', error);
        return NextResponse.json(
            { error: 'Failed to save OCC tiers' },
            { status: 500 }
        );
    }
}
