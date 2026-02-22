/**
 * Daily Action Engine V0 - Rule-based pricing recommendations
 * SMB60 V1.2 - "5 min/day pricing assistant"
 *
 * Logic: Occupancy + Pickup Index -> Action (Increase/Keep/Decrease) + Delta + Reason
 */

import prisma from '@/lib/prisma';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export type ActionType = 'INCREASE' | 'KEEP' | 'DECREASE';

export interface DailyAction {
    stay_date: Date;
    action: ActionType;
    delta_pct: number;
    recommended_rate: number;
    current_rate: number;
    reason_key: string;
    reason_text: string;
    confidence: 'high' | 'medium' | 'low';
    inputs: {
        occ_today: number;
        pickup_7d: number | null;
        baseline_pickup: number;
        pickup_index: number;
        remaining_supply: number;
    };
    accepted?: boolean;
    override_rate?: number;
    override_note?: string;
}

export interface DailyActionResult {
    hotel_id: string;
    generated_at: Date;
    base_rate: number;
    base_rate_source: 'hotel_setting' | 'last_export' | 'last_decision' | 'otb_derived' | 'user_input';
    actions: DailyAction[];
    summary: {
        total: number;
        increases: number;
        keeps: number;
        decreases: number;
    };
}

export interface GuardrailConfig {
    min_rate: number;
    max_rate: number;
    max_change_pct_per_day: number;
}

// ═══════════════════════════════════════════════════════════════════
// Constants - Rule Thresholds
// ═══════════════════════════════════════════════════════════════════

const RULES = [
    {
        condition: (occ: number, pi: number) => occ >= 0.85 && pi >= 1.2,
        action: 'INCREASE' as ActionType,
        delta: 8,
        reason_key: 'HIGH_DEMAND_FAST_PICKUP',
        reason_text: 'High occupancy and faster-than-normal pickup',
    },
    {
        condition: (occ: number, pi: number) => occ >= 0.70 && pi >= 1.1,
        action: 'INCREASE' as ActionType,
        delta: 5,
        reason_key: 'STRONG_DEMAND',
        reason_text: 'Selling well, room for price increase',
    },
    {
        condition: (occ: number, pi: number) => occ >= 0.45 && occ < 0.70,
        action: 'KEEP' as ActionType,
        delta: 0,
        reason_key: 'STABLE',
        reason_text: 'On pace, maintain rate',
    },
    {
        condition: (occ: number, pi: number) => occ < 0.45 && pi < 0.9,
        action: 'DECREASE' as ActionType,
        delta: -5,
        reason_key: 'SLOW_PICKUP',
        reason_text: 'Slower than normal, needs demand stimulation',
    },
    {
        condition: (occ: number, pi: number) => occ < 0.30 && pi < 0.7,
        action: 'DECREASE' as ActionType,
        delta: -8,
        reason_key: 'HIGH_RISK_EMPTY',
        reason_text: 'High vacancy risk',
    },
];

// Default rule if no condition matches
const DEFAULT_RULE = {
    action: 'KEEP' as ActionType,
    delta: 0,
    reason_key: 'DEFAULT',
    reason_text: 'Maintain current rate',
};

// ═══════════════════════════════════════════════════════════════════
// Core Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Get base rate with fallback chain
 * Order: Hotel.default_base_rate -> last decision -> OTB-derived avg rate -> null
 */
export async function getBaseRate(hotelId: string): Promise<{
    rate: number | null;
    source: 'hotel_setting' | 'last_export' | 'last_decision' | 'otb_derived' | 'user_input';
}> {
    // 1. Hotel setting
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { default_base_rate: true },
    });

    if (hotel?.default_base_rate) {
        return { rate: Number(hotel.default_base_rate), source: 'hotel_setting' };
    }

    // 2. Last pricing decision
    const lastDecision = await prisma.pricingDecision.findFirst({
        where: { hotel_id: hotelId },
        orderBy: { decided_at: 'desc' },
        select: { final_price: true },
    });

    if (lastDecision?.final_price) {
        return { rate: Number(lastDecision.final_price), source: 'last_decision' };
    }

    // 3. Derive from OTB data (average revenue per room from recent data)
    const recentOTB = await prisma.dailyOTB.findMany({
        where: {
            hotel_id: hotelId,
            rooms_otb: { gt: 0 },
        },
        orderBy: { as_of_date: 'desc' },
        take: 30,
        select: { rooms_otb: true, revenue_otb: true },
    });

    if (recentOTB.length > 0) {
        const totalRevenue = recentOTB.reduce((sum, o) => sum + Number(o.revenue_otb), 0);
        const totalRooms = recentOTB.reduce((sum, o) => sum + o.rooms_otb, 0);
        if (totalRooms > 0) {
            const avgRate = Math.round(totalRevenue / totalRooms / 1000) * 1000; // Round to nearest 1000
            return { rate: avgRate, source: 'otb_derived' };
        }
    }

    // No base rate found
    return { rate: null, source: 'user_input' };
}

/**
 * Pre-calculate baseline pickups for all DOWs (0-6) in one query
 * Returns a Map: DOW -> median pickup value
 */
async function calculateAllBaselinePickups(
    hotelId: string,
    referenceDate: Date
): Promise<Map<number, number>> {
    // Fetch all historical pickup data for last 8 weeks in ONE query
    const features = await prisma.featuresDaily.findMany({
        where: {
            hotel_id: hotelId,
            stay_date: {
                gte: new Date(referenceDate.getTime() - 56 * 24 * 60 * 60 * 1000), // 8 weeks
                lt: referenceDate,
            },
            pickup_t7: { not: null },
        },
        select: { stay_date: true, pickup_t7: true },
    });

    // Group by DOW
    const pickupsByDow: Map<number, number[]> = new Map();
    for (let dow = 0; dow < 7; dow++) {
        pickupsByDow.set(dow, []);
    }

    features.forEach((f) => {
        const dow = f.stay_date.getDay();
        const arr = pickupsByDow.get(dow)!;
        arr.push(Number(f.pickup_t7));
    });

    // Calculate median for each DOW
    const medianByDow: Map<number, number> = new Map();
    pickupsByDow.forEach((pickups, dow) => {
        if (pickups.length === 0) {
            medianByDow.set(dow, 0);
            return;
        }
        pickups.sort((a, b) => a - b);
        const mid = Math.floor(pickups.length / 2);
        const median = pickups.length % 2 !== 0
            ? pickups[mid]
            : (pickups[mid - 1] + pickups[mid]) / 2;
        medianByDow.set(dow, median);
    });

    return medianByDow;
}

/**
 * Apply a single rule to determine action
 */
function applyRules(occ: number, pickupIndex: number): typeof RULES[0] | typeof DEFAULT_RULE {
    for (const rule of RULES) {
        if (rule.condition(occ, pickupIndex)) {
            return rule;
        }
    }
    return DEFAULT_RULE;
}

/**
 * Clamp rate within guardrails
 */
function clampRate(rate: number, guardrails: GuardrailConfig): number {
    return Math.max(guardrails.min_rate, Math.min(guardrails.max_rate, rate));
}

/**
 * Generate daily actions for next N days
 */
export async function generateDailyActions(
    hotelId: string,
    daysAhead: number = 30
): Promise<DailyActionResult> {
    // Get hotel info
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: {
            capacity: true,
            default_base_rate: true,
            min_rate: true,
            max_rate: true,
        },
    });

    if (!hotel) {
        throw new Error('Hotel not found');
    }

    const capacity = hotel.capacity;
    const guardrails: GuardrailConfig = {
        min_rate: Number(hotel.min_rate) || 0,
        max_rate: Number(hotel.max_rate) || 999999999,
        max_change_pct_per_day: 10,
    };

    // Get base rate
    const { rate: baseRate, source: baseRateSource } = await getBaseRate(hotelId);

    if (!baseRate) {
        return {
            hotel_id: hotelId,
            generated_at: new Date(),
            base_rate: 0,
            base_rate_source: 'user_input',
            actions: [],
            summary: { total: 0, increases: 0, keeps: 0, decreases: 0 },
        };
    }

    // Get features for next N days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysAhead);

    const features = await prisma.featuresDaily.findMany({
        where: {
            hotel_id: hotelId,
            stay_date: {
                gte: today,
                lt: endDate,
            },
        },
        orderBy: { stay_date: 'asc' },
    });

    // Also get OTB data for occupancy
    const otbData = await prisma.dailyOTB.findMany({
        where: {
            hotel_id: hotelId,
            stay_date: {
                gte: today,
                lt: endDate,
            },
        },
        orderBy: [{ stay_date: 'asc' }, { as_of_date: 'desc' }],
        distinct: ['stay_date'],
    });

    // Create lookup map
    const otbMap = new Map(otbData.map((o) => [o.stay_date.toISOString().split('T')[0], o]));
    const featuresMap = new Map(features.map((f) => [f.stay_date.toISOString().split('T')[0], f]));

    // Pre-calculate baseline pickups for all DOWs in ONE query (fixing N+1 problem)
    const baselineByDow = await calculateAllBaselinePickups(hotelId, today);

    // Generate actions for each day
    const actions: DailyAction[] = [];
    let increases = 0, keeps = 0, decreases = 0;

    for (let d = 0; d < daysAhead; d++) {
        const stayDate = new Date(today);
        stayDate.setDate(stayDate.getDate() + d);
        const dateKey = stayDate.toISOString().split('T')[0];

        const otb = otbMap.get(dateKey);
        const feature = featuresMap.get(dateKey);

        // Calculate occupancy — prefer net_remaining (cancel-aware) over raw capacity
        const roomsSold = otb?.rooms_otb ?? 0;
        const netRemaining = feature?.net_remaining ?? feature?.remaining_supply ?? (capacity - roomsSold);
        const occ = capacity > 0 ? (capacity - netRemaining) / capacity : 0;

        // Get pickup (using cached baseline)
        const pickup7d = feature && feature.pickup_t7 !== null ? Number(feature.pickup_t7) : null;
        const dow = stayDate.getDay();
        const baseline = baselineByDow.get(dow) ?? 0;
        const pickupIndex = baseline > 0 && pickup7d !== null ? pickup7d / baseline : 1;

        // Apply rules
        const rule = applyRules(occ, pickupIndex);

        // Calculate recommended rate
        let recommendedRate = baseRate * (1 + rule.delta / 100);

        // Apply guardrails
        recommendedRate = clampRate(recommendedRate, guardrails);

        // Round to nearest 1000 VND
        recommendedRate = Math.round(recommendedRate / 1000) * 1000;

        // Determine confidence
        let confidence: 'high' | 'medium' | 'low' = 'high';
        if (pickup7d === null) confidence = 'low';
        else if (baseline === 0) confidence = 'medium';

        actions.push({
            stay_date: stayDate,
            action: rule.action,
            delta_pct: rule.delta,
            recommended_rate: recommendedRate,
            current_rate: baseRate,
            reason_key: rule.reason_key,
            reason_text: rule.reason_text,
            confidence,
            inputs: {
                occ_today: occ,
                pickup_7d: pickup7d,
                baseline_pickup: baseline,
                pickup_index: pickupIndex,
                remaining_supply: capacity - roomsSold,
            },
        });

        // Count
        if (rule.action === 'INCREASE') increases++;
        else if (rule.action === 'DECREASE') decreases++;
        else keeps++;
    }

    return {
        hotel_id: hotelId,
        generated_at: new Date(),
        base_rate: baseRate,
        base_rate_source: baseRateSource,
        actions,
        summary: {
            total: actions.length,
            increases,
            keeps,
            decreases,
        },
    };
}
