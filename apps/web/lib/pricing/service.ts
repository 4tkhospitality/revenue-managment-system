// Phase 00: Pricing Service Layer — DB-aware orchestration
// ARCHITECTURE RULE: service.ts = thin orchestration around engine.ts
// - Imports engine.ts (pure functions)
// - Imports prisma (DB access)
// - Uses 'server-only' to prevent client-side usage
// - API routes must import THIS file, never engine.ts directly
import 'server-only';

import prisma from '@/lib/prisma';
import {
    calcBarFromNet,
    calcNetFromBar,
    resolveTimingConflicts,
    resolveVendorStacking,
    calcEffectiveDiscount,
    computeDisplay,
    applyOccMultiplier,
    applyGuardrails,
    normalizeVendorCode,
} from './engine';
import type {
    CalcType,
    CalcResult,
    DiscountItem,
    CommissionBooster,
    MatrixCell,
    PriceMatrixResponse,
    RoomTypeData,
    OTAChannelData,
    GuardrailConfig,
    GuardrailResult,
} from './types';

// ── Types ──────────────────────────────────────────────────────────

export interface ChannelPricingInput {
    roomTypeId: string;
    netPrice: number;
    channelId: string;
    channelCode: string;
    calcType: CalcType;
    commission: number;
    discounts: DiscountItem[];
    boosters?: CommissionBooster[];
    roundingRule?: 'CEIL_1000' | 'ROUND_100' | 'NONE';
    occMultiplier?: number;
    seasonNetRate?: number;
}

export interface MatrixCalcInput {
    hotelId: string;
    seasonId?: string;
    occPct?: number;
}

export interface PreviewInput {
    hotelId: string;
    channelId: string;
    roomTypeId?: string;
    mode: 'NET' | 'BAR' | 'DISPLAY';
    value: number;
    selectedCampaignInstanceIds?: string[];
    seasonId?: string;
    occPct?: number;
}

export interface PreviewResult {
    net: number;
    bar: number;
    display: number;
    totalDiscountEffective: number;
    trace: { step: string; description: string; priceAfter: number }[];
    validation: { isValid: boolean; errors: string[]; warnings: string[] };
}

// ── Core Pricing Pipeline ──────────────────────────────────────────

/**
 * Calculate pricing for a single room × channel cell.
 * Single source of truth for Overview tab and Dynamic Pricing tab.
 */
export function calculateCell(input: ChannelPricingInput): MatrixCell {
    // Step 1: Determine effective NET
    let effectiveNet = input.netPrice;

    if (input.seasonNetRate !== undefined) {
        effectiveNet = input.seasonNetRate;
    }

    if (input.occMultiplier !== undefined && input.occMultiplier !== 1) {
        effectiveNet = applyOccMultiplier(effectiveNet, input.occMultiplier);
    }

    // Step 2: Resolve vendor stacking
    const { resolved: stackedDiscounts } = resolveVendorStacking(
        input.channelCode,
        input.discounts
    );

    // Step 3: Resolve timing conflicts (Early Bird + Last-Minute)
    const { resolved: finalDiscounts } = resolveTimingConflicts(stackedDiscounts);

    // Step 4: Calculate BAR from NET
    const result = calcBarFromNet(
        effectiveNet,
        input.commission,
        finalDiscounts,
        input.calcType,
        input.roundingRule ?? 'CEIL_1000',
        input.channelCode,
        input.boosters
    );

    // Step 5: Compute display price using effective discount
    // BA fix: totalDiscount MUST be the effective % matching computeDisplay semantics
    const effectiveDiscount = calcEffectiveDiscount(finalDiscounts, input.calcType);
    const display = computeDisplay(result.bar, effectiveDiscount);

    return {
        roomTypeId: input.roomTypeId,
        channelId: input.channelId,
        bar: result.bar,
        display,
        net: effectiveNet,
        commission: input.commission,
        totalDiscount: effectiveDiscount,  // BA: always effective%, not raw sum
        validation: result.validation,
        trace: result.trace,
    };
}

// ── Preview Calculation (for PromotionsTab) ────────────────────────

/**
 * Calculate pricing preview for a single channel.
 * PromotionsTab calls this via /api/pricing/calc-preview.
 * Supports 3 modes: NET→BAR+Display, BAR→NET+Display, DISPLAY→BAR+NET.
 */
export async function calculatePreview(input: PreviewInput): Promise<PreviewResult> {
    const { hotelId, channelId, roomTypeId, mode, value, selectedCampaignInstanceIds, seasonId, occPct } = input;

    // Fetch channel
    const channel = await prisma.oTAChannel.findFirst({
        where: { id: channelId, hotel_id: hotelId },
    });
    if (!channel) throw new Error('Channel not found');

    // Fetch campaigns — either selected or all active for channel
    const campaigns = selectedCampaignInstanceIds?.length
        ? await prisma.campaignInstance.findMany({
            where: { id: { in: selectedCampaignInstanceIds }, hotel_id: hotelId },
            include: { promo: true },
        })
        : await prisma.campaignInstance.findMany({
            where: { ota_channel_id: channelId, hotel_id: hotelId, is_active: true },
            include: { promo: true },
        });

    const discounts: DiscountItem[] = campaigns.map(c => ({
        id: c.id,
        name: c.promo?.name ?? 'Unknown',
        percent: c.discount_pct,
        group: (c.promo?.group_type as DiscountItem['group']) ?? 'ESSENTIAL',
        subCategory: c.promo?.sub_category ?? undefined,
    }));

    // Resolve vendor stacking + timing
    const { resolved: stackedDiscounts } = resolveVendorStacking(channel.code, discounts);

    const { resolved: finalDiscounts, removed, hadConflict } = resolveTimingConflicts(stackedDiscounts);

    const calcType = channel.calc_type as CalcType;
    const effectiveDiscount = calcEffectiveDiscount(finalDiscounts, calcType);
    const commission = channel.commission;

    // Determine OCC multiplier
    let occMultiplier = 1;
    if (occPct !== undefined) {
        const occTiers = await prisma.occTierConfig.findMany({
            where: { hotel_id: hotelId },
            orderBy: { tier_index: 'asc' },
        });
        for (const tier of occTiers) {
            const min = Number(tier.occ_min);
            const max = Number(tier.occ_max);
            if (occPct >= min && (occPct < max || (max === 1.0 && occPct === 1.0))) {
                occMultiplier = Number(tier.multiplier);
                break;
            }
        }
    }

    // Season NET override
    let seasonNetRate: number | undefined;
    if (seasonId && roomTypeId) {
        const sr = await prisma.seasonNetRate.findFirst({
            where: { season_id: seasonId, room_type_id: roomTypeId, hotel_id: hotelId },
        });
        if (sr) seasonNetRate = Number(sr.net_rate);
    }

    let net: number, bar: number, display: number;
    let trace: { step: string; description: string; priceAfter: number }[] = [];
    let validation = { isValid: true, errors: [] as string[], warnings: [] as string[] };

    if (mode === 'NET') {
        // NET → BAR → Display
        let effectiveNet = value;
        if (seasonNetRate !== undefined) effectiveNet = seasonNetRate;
        if (occMultiplier !== 1) effectiveNet = applyOccMultiplier(effectiveNet, occMultiplier);

        const result = calcBarFromNet(effectiveNet, commission, finalDiscounts, calcType, 'CEIL_1000', channel.code);
        net = effectiveNet;
        bar = result.bar;
        display = computeDisplay(bar, effectiveDiscount);
        trace = result.trace;
        validation = result.validation;
    } else if (mode === 'BAR') {
        // BAR → NET + Display
        const result = calcNetFromBar(value, commission, finalDiscounts, calcType, channel.code);
        bar = value;
        net = result.net;
        display = computeDisplay(bar, effectiveDiscount);
        trace = result.trace;
        validation = result.validation;
    } else {
        // DISPLAY → BAR → NET
        // BAR = display / (1 - effectiveDiscount%)
        display = value;
        bar = effectiveDiscount >= 100 ? 0 : Math.round(display / (1 - effectiveDiscount / 100));
        net = Math.round(display * (1 - commission / 100));
        trace = [
            { step: 'Giá khách thấy', description: `Hiển thị trên OTA = ${display}`, priceAfter: display },
            { step: 'Tính BAR', description: `BAR = ${display} / (1 - ${effectiveDiscount.toFixed(1)}%) = ${bar}`, priceAfter: bar },
            { step: 'Hoa hồng OTA', description: `Thu về = ${display} × (1 - ${commission}%) = ${net}`, priceAfter: net },
        ];
    }

    // Add timing conflict warning to trace
    if (hadConflict && removed) {
        trace.unshift({
            step: '⚠️ Không cộng dồn',
            description: `Early Bird + Last-Minute → Bỏ "${removed.name}" (${removed.percent}%)`,
            priceAfter: value,
        });
    }

    return { net, bar, display, totalDiscountEffective: effectiveDiscount, trace, validation };
}

// ── Matrix Calculation (DB-aware) ──────────────────────────────────

/**
 * Calculate the full pricing matrix for a hotel.
 * Replaces the inline math in calc-matrix/route.ts.
 */
export async function calculateMatrix(
    input: MatrixCalcInput
): Promise<PriceMatrixResponse> {
    const { hotelId, seasonId, occPct } = input;

    // Fetch all data in parallel
    const [roomTypes, channels, campaigns, occTiers, seasonRates] = await Promise.all([
        prisma.roomType.findMany({
            where: { hotel_id: hotelId },
            orderBy: { name: 'asc' },
        }),
        prisma.oTAChannel.findMany({
            where: { hotel_id: hotelId, is_active: true },
            orderBy: { name: 'asc' },
        }),
        prisma.campaignInstance.findMany({
            where: { hotel_id: hotelId, is_active: true },
            include: { promo: true },
        }),
        occPct !== undefined
            ? prisma.occTierConfig.findMany({
                where: { hotel_id: hotelId },
                orderBy: { tier_index: 'asc' },
            })
            : Promise.resolve([] as Awaited<ReturnType<typeof prisma.occTierConfig.findMany>>),
        seasonId
            ? prisma.seasonNetRate.findMany({
                where: { season_id: seasonId, hotel_id: hotelId },
            })
            : Promise.resolve([] as Awaited<ReturnType<typeof prisma.seasonNetRate.findMany>>),
    ]);

    // Build lookup maps
    const seasonRateMap = new Map<string, number>(
        seasonRates.map((sr) => [sr.room_type_id, Number(sr.net_rate)])
    );

    // Determine OCC multiplier from current occupancy
    let occMultiplier = 1;
    if (occPct !== undefined && occTiers.length > 0) {
        for (const tier of occTiers) {
            const min = Number(tier.occ_min);
            const max = Number(tier.occ_max);
            const mult = Number(tier.multiplier);
            if (occPct >= min && (occPct < max || (max === 1.0 && occPct === 1.0))) {
                occMultiplier = mult;
                break;
            }
        }
    }

    // Build campaign → channel map
    const channelCampaigns = new Map<string, DiscountItem[]>();
    for (const c of campaigns) {
        const channelId = c.ota_channel_id;
        if (!channelCampaigns.has(channelId)) {
            channelCampaigns.set(channelId, []);
        }
        channelCampaigns.get(channelId)!.push({
            id: c.id,
            name: c.promo?.name ?? 'Unknown',
            percent: c.discount_pct,
            group: (c.promo?.group_type as DiscountItem['group']) ?? 'ESSENTIAL',
            subCategory: c.promo?.sub_category ?? undefined,
        });
    }

    // Build PricingSetting
    const settings = await prisma.pricingSetting.findUnique({ where: { hotel_id: hotelId } });
    const roundingRule = (settings?.rounding_rule || 'CEIL_1000') as 'CEIL_1000' | 'ROUND_100' | 'NONE';

    // Calculate each cell
    const matrix: Record<string, MatrixCell> = {};

    for (const rt of roomTypes) {
        for (const ch of channels) {
            const key = `${rt.id}:${ch.id}`;
            const discounts = channelCampaigns.get(ch.id) || [];
            const seasonNet = seasonRateMap.get(rt.id);

            matrix[key] = calculateCell({
                roomTypeId: rt.id,
                netPrice: rt.net_price,
                channelId: ch.id,
                channelCode: ch.code,
                calcType: ch.calc_type as CalcType,
                commission: ch.commission,
                discounts,
                roundingRule,
                occMultiplier,
                seasonNetRate: seasonNet,
            });
        }
    }

    return {
        roomTypes: roomTypes.map((rt): RoomTypeData => ({
            id: rt.id,
            hotelId: rt.hotel_id,
            name: rt.name,
            description: rt.description ?? undefined,
            netPrice: rt.net_price,
        })),
        channels: channels.map((ch): OTAChannelData => ({
            id: ch.id,
            hotelId: ch.hotel_id,
            name: ch.name,
            code: ch.code,
            calcType: ch.calc_type as CalcType,
            commission: ch.commission,
            isActive: ch.is_active,
        })),
        matrix,
        calculatedAt: new Date().toISOString(),
    };
}

// ── Guardrail Application ──────────────────────────────────────────

/**
 * Apply guardrails to a BAR price using hotel-level config.
 */
export async function applyHotelGuardrails(
    hotelId: string,
    bar: number,
    previousBar?: number | null
): Promise<GuardrailResult> {
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { min_rate: true, max_rate: true },
    });

    if (!hotel) throw new Error(`Hotel ${hotelId} not found`);

    const config: GuardrailConfig = {
        min_rate: hotel.min_rate ? Number(hotel.min_rate) : 0,
        max_rate: hotel.max_rate ? Number(hotel.max_rate) : Infinity,
        max_step_change_pct: 0.2,
        previous_bar: previousBar,
        rounding_rule: 'CEIL_1000',
    };

    return applyGuardrails(bar, config);
}

// ── Dynamic Matrix Types (Phase 03-04) ─────────────────────────────

export interface DynamicMatrixInput {
    hotelId: string;
    stayDate: string;         // ISO date YYYY-MM-DD (date-only, hotel.timezone)
    channelId: string;
    seasonIdOverride?: string; // User chọn season thủ công → skip auto-detect
    occOverride?: number;      // User nhập OCC% thủ công (0..1)
}

export interface DynamicCell {
    net: number;               // BA fix #6: all 3 prices for view toggle
    bar: number;
    display: number;
    effectiveDiscount: number;
    validation?: { isValid: boolean; errors: string[]; warnings: string[] };
    trace?: { step: string; description: string; priceAfter: number }[];
}

export interface Violation {   // BA fix #1: structured violations
    roomTypeId: string;
    tierIndex: number;
    field: 'net' | 'bar' | 'display';
    value: number;
    min?: number;
    max?: number;
    message: string;
}

export interface DynamicMatrixResponse {
    tiers: { tierIndex: number; occMin: number; occMax: number; multiplier: number; label: string }[];
    matrix: Record<string, DynamicCell>; // key = "roomTypeId:tierIndex"
    roomTypes: { id: string; name: string; netBase: number }[];
    season: { id: string; name: string; type: string; autoDetected: boolean };
    channel: { id: string; name: string; code: string; commission: number };
    occPct: number | null;
    occSource: 'otb' | 'override' | 'unavailable';
    activeTierIndex: number | null;
    guardrails: { minRate: number; maxRate: number };
    violations: Violation[];
}

// ── Dynamic Matrix Calculation ─────────────────────────────────────

/**
 * Calculate dynamic pricing matrix for a given stay date + channel.
 * Returns NET/BAR/Display for ALL OCC tiers so UI can render full matrix.
 * BA corrections applied: structured violations, no N+1, locked OCC query,
 * date-only season match, DynamicCell with 3 prices.
 */
export async function calculateDynamicMatrix(
    input: DynamicMatrixInput
): Promise<DynamicMatrixResponse> {
    const { hotelId, stayDate, channelId, seasonIdOverride, occOverride } = input;

    // ── Step 1: Fetch hotel (1 query, reuse for guardrails) ── BA fix #2
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { capacity: true, min_rate: true, max_rate: true, timezone: true },
    });
    if (!hotel) throw new Error('Hotel not found');

    const minRate = hotel.min_rate ? Number(hotel.min_rate) : 0;
    const maxRate = hotel.max_rate ? Number(hotel.max_rate) : Infinity;
    const guardrailConfig: GuardrailConfig = {
        min_rate: minRate,
        max_rate: maxRate,
        max_step_change_pct: 0.2,
        rounding_rule: 'CEIL_1000',
    };

    // ── Step 2: Auto-detect season ── BA fix #4: date-only, hotel.timezone
    let season: { id: string; name: string; type: string; autoDetected: boolean };

    if (seasonIdOverride) {
        const s = await prisma.seasonConfig.findUnique({ where: { id: seasonIdOverride } });
        if (!s) throw new Error('Season not found');
        season = { id: s.id, name: s.name, type: s.code, autoDetected: false };
    } else {
        // Find all active seasons and match stayDate against date_ranges
        const allSeasons = await prisma.seasonConfig.findMany({
            where: { hotel_id: hotelId, is_active: true },
            orderBy: { priority: 'desc' }, // holiday(3) > high(2) > normal(1)
        });

        let matched: typeof allSeasons[0] | null = null;
        for (const s of allSeasons) {
            const ranges = s.date_ranges as Array<{ start: string; end: string }>;
            if (!ranges || !Array.isArray(ranges)) continue;
            for (const range of ranges) {
                // BA fix #4: date-only comparison (YYYY-MM-DD), end date inclusive
                if (stayDate >= range.start && stayDate <= range.end) {
                    matched = s;
                    break;
                }
            }
            if (matched) break;
        }

        if (!matched) {
            // Fallback to Normal season (priority=1) or first available
            const fallback = allSeasons.find(s => s.code === 'NORMAL') ?? allSeasons[0];
            if (!fallback) throw new Error('No seasons configured for this hotel');
            matched = fallback;
        }

        season = { id: matched.id, name: matched.name, type: matched.code, autoDetected: true };
    }

    // ── Step 3: Auto-detect OCC ── BA fix #3: locked query rule
    let occPct: number | null = null;
    let occSource: 'otb' | 'override' | 'unavailable' = 'unavailable';
    let activeTierIndex: number | null = null;

    if (occOverride !== undefined && occOverride !== null) {
        occPct = Math.min(Math.max(occOverride, 0), 1); // clamp 0..1
        occSource = 'override';
    } else {
        // Fetch latest OTB snapshot for this stay_date
        const otbRecord = await prisma.dailyOTB.findFirst({
            where: { hotel_id: hotelId, stay_date: new Date(stayDate) },
            orderBy: { as_of_date: 'desc' }, // latest snapshot
        });

        if (otbRecord && hotel.capacity > 0) {
            occPct = Math.min(otbRecord.rooms_otb / hotel.capacity, 1.0); // clamp at 1.0
            occSource = 'otb';
        }
    }

    // ── Step 4: Fetch OCC tiers
    const occTiers = await prisma.occTierConfig.findMany({
        where: { hotel_id: hotelId },
        orderBy: { tier_index: 'asc' },
    });

    // Determine active tier from occPct
    if (occPct !== null && occTiers.length > 0) {
        for (const tier of occTiers) {
            const tMin = Number(tier.occ_min);
            const tMax = Number(tier.occ_max);
            if (occPct >= tMin && (occPct < tMax || (tMax === 1.0 && occPct <= 1.0))) {
                activeTierIndex = tier.tier_index;
                break;
            }
        }
    }

    // ── Step 5: Fetch data in parallel
    const [roomTypes, channel, campaigns, seasonRates, settings] = await Promise.all([
        prisma.roomType.findMany({
            where: { hotel_id: hotelId },
            orderBy: { name: 'asc' },
        }),
        prisma.oTAChannel.findFirst({
            where: { id: channelId, hotel_id: hotelId },
        }),
        prisma.campaignInstance.findMany({
            where: { hotel_id: hotelId, ota_channel_id: channelId, is_active: true },
            include: { promo: true },
        }),
        prisma.seasonNetRate.findMany({
            where: { season_id: season.id, hotel_id: hotelId },
        }),
        prisma.pricingSetting.findUnique({ where: { hotel_id: hotelId } }),
    ]);

    if (!channel) throw new Error('Channel not found');

    const roundingRule = (settings?.rounding_rule || 'CEIL_1000') as 'CEIL_1000' | 'ROUND_100' | 'NONE';

    // Build maps
    const seasonRateMap = new Map<string, number>(
        seasonRates.map((sr) => [sr.room_type_id, Number(sr.net_rate)])
    );

    const discounts: DiscountItem[] = campaigns.map(c => ({
        id: c.id,
        name: c.promo?.name ?? 'Unknown',
        percent: c.discount_pct,
        group: (c.promo?.group_type as DiscountItem['group']) ?? 'ESSENTIAL',
        subCategory: c.promo?.sub_category ?? undefined,
    }));

    // ── Step 6+7: Calculate matrix for ALL tiers ── BA fix #2: guardrailConfig reuse
    const matrix: Record<string, DynamicCell> = {};
    const violations: Violation[] = [];

    for (const rt of roomTypes) {
        const netBase = seasonRateMap.get(rt.id) ?? rt.net_price;

        for (const tier of occTiers) {
            const multiplier = Number(tier.multiplier);
            const key = `${rt.id}:${tier.tier_index}`;

            const cell = calculateCell({
                roomTypeId: rt.id,
                netPrice: rt.net_price,
                channelId: channel.id,
                channelCode: channel.code,
                calcType: channel.calc_type as CalcType,
                commission: channel.commission,
                discounts,
                roundingRule,
                occMultiplier: multiplier,
                seasonNetRate: netBase !== rt.net_price ? netBase : undefined,
            });

            matrix[key] = {
                net: cell.net,
                bar: cell.bar,
                display: cell.display,
                effectiveDiscount: cell.totalDiscount,
                validation: cell.validation,
                trace: cell.trace,
            };

            // BA fix #1: structured violations — check guardrails per cell
            const gr = applyGuardrails(cell.bar, guardrailConfig);
            if (gr.primary_reason !== 'PASS') {
                if (cell.net < minRate && minRate > 0) {
                    violations.push({
                        roomTypeId: rt.id,
                        tierIndex: tier.tier_index,
                        field: 'net',
                        value: cell.net,
                        min: minRate,
                        message: `${rt.name} tier ${tier.label}: NET ${cell.net.toLocaleString()} dưới guardrail min ${minRate.toLocaleString()}`,
                    });
                }
                if (cell.bar > maxRate && maxRate < Infinity) {
                    violations.push({
                        roomTypeId: rt.id,
                        tierIndex: tier.tier_index,
                        field: 'bar',
                        value: cell.bar,
                        max: maxRate,
                        message: `${rt.name} tier ${tier.label}: BAR ${cell.bar.toLocaleString()} vượt guardrail max ${maxRate.toLocaleString()}`,
                    });
                }
            }
        }
    }

    return {
        tiers: occTiers.map(t => ({
            tierIndex: t.tier_index,
            occMin: Number(t.occ_min),
            occMax: Number(t.occ_max),
            multiplier: Number(t.multiplier),
            label: t.label,
        })),
        matrix,
        roomTypes: roomTypes.map(rt => ({
            id: rt.id,
            name: rt.name,
            netBase: seasonRateMap.get(rt.id) ?? rt.net_price,
        })),
        season,
        channel: {
            id: channel.id,
            name: channel.name,
            code: channel.code,
            commission: channel.commission,
        },
        occPct,
        occSource,
        activeTierIndex,
        guardrails: { minRate, maxRate: maxRate === Infinity ? 0 : maxRate },
        violations,
    };
}

// ── Re-exports for convenience ─────────────────────────────────────
export { formatVND, normalizeVendorCode } from './engine';
export type { CalcResult, MatrixCell, PriceMatrixResponse } from './types';
