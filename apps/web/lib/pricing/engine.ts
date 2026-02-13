// V01.4: Pricing Calculation Engine
// Calculate BAR from NET with commission and discounts
// V01.3: Early Bird + Last-Minute are mutually exclusive (non-stacking)
// V01.4: Commission Boosters (AGP/AGX/SL) support

import type { CalcType, CalcResult, DiscountItem, CommissionBooster, TraceStep, ValidationResult } from './types';
import { validatePromotions } from './validators';

/**
 * Calculate effective commission with boosters
 * Total = Base + Σ(active booster %)
 */
function calcEffectiveCommission(
    baseCommission: number,
    boosters?: CommissionBooster[]
): { effectiveCommission: number; activeBoosters: CommissionBooster[] } {
    if (!boosters || boosters.length === 0) {
        return { effectiveCommission: baseCommission, activeBoosters: [] };
    }
    const active = boosters.filter(b => b.enabled && b.boostPct > 0);
    const totalBoost = active.reduce((sum, b) => sum + b.boostPct, 0);
    return {
        effectiveCommission: baseCommission + totalBoost,
        activeBoosters: active,
    };
}

// Patterns to detect timing-based promotions
const EARLY_BIRD_PATTERN = /early.?bird|early.?booker/i;
const LAST_MINUTE_PATTERN = /last.?minute/i;

/**
 * Resolve Early Bird + Last-Minute conflict.
 * These promotions are mutually exclusive by booking window:
 * - Early Bird: khách đặt sớm (14-30 ngày trước check-in)
 * - Last-Minute: khách đặt gấp (1-7 ngày trước check-in)
 * When both are active, only the LARGER discount is applied.
 */
export function resolveTimingConflicts(discounts: DiscountItem[]): {
    resolved: DiscountItem[];
    removed: DiscountItem | null;
    hadConflict: boolean;
} {
    const earlyBird = discounts.find(d => EARLY_BIRD_PATTERN.test(d.name));
    const lastMinute = discounts.find(d => LAST_MINUTE_PATTERN.test(d.name));

    if (!earlyBird || !lastMinute) {
        return { resolved: discounts, removed: null, hadConflict: false };
    }

    // Both exist → keep the larger discount, remove the smaller
    const toRemove = earlyBird.percent >= lastMinute.percent ? lastMinute : earlyBird;
    const resolved = discounts.filter(d => d.id !== toRemove.id);

    return { resolved, removed: toRemove, hadConflict: true };
}

/**
 * Calculate BAR (Best Available Rate) from NET
 * 
 * Progressive Mode: BAR = NET / (1 - commission) / Π(1 - dᵢ)
 * Additive Mode:    BAR = NET / (1 - commission) / (1 - Σdᵢ)
 */
export function calcBarFromNet(
    net: number,
    commission: number,     // Base % (0-100)
    discounts: DiscountItem[],
    calcType: CalcType,
    roundingRule: 'CEIL_1000' | 'ROUND_100' | 'NONE' = 'CEIL_1000',
    vendor: string = 'agoda',
    boosters?: CommissionBooster[]
): CalcResult {
    const trace: TraceStep[] = [];

    // V01.3: Resolve Early Bird + Last-Minute mutual exclusivity
    const { resolved: effectiveDiscounts, removed, hadConflict } = resolveTimingConflicts(discounts);
    if (hadConflict && removed) {
        trace.push({
            step: '⚠️ Không cộng dồn',
            description: `Early Bird + Last-Minute không stack → Bỏ "${removed.name}" (${removed.percent}%), giữ KM lớn hơn`,
            priceAfter: net,
        });
    }

    // Validate inputs with vendor-specific rules
    const validation = validatePromotions(effectiveDiscounts, commission, vendor);

    // Enforce validation: reject if critical errors
    if (!validation.isValid && validation.errors.length > 0) {
        return {
            bar: 0,
            barRaw: 0,
            net,
            commission,
            totalDiscount: 0,
            validation,
            trace: [],
        };
    }

    // If commission >= 100, return error
    if (commission >= 100) {
        return {
            bar: 0,
            barRaw: 0,
            net,
            commission,
            totalDiscount: 0,
            validation: {
                isValid: false,
                errors: ['Commission phải < 100%'],
                warnings: [],
            },
            trace: [],
        };
    }

    // V01.4: Calculate effective commission with boosters
    const { effectiveCommission, activeBoosters } = calcEffectiveCommission(commission, boosters);

    // Step 1: Calculate gross before discounts (use effectiveDiscounts from here on)
    const commissionDecimal = effectiveCommission / 100;
    const gross = net / (1 - commissionDecimal);

    if (activeBoosters.length > 0) {
        const boosterBreakdown = activeBoosters.map(b => `${b.name} +${b.boostPct}%`).join(' + ');
        trace.push({
            step: '📊 Marketing Programs',
            description: `Base ${commission}% + ${boosterBreakdown} = ${effectiveCommission}% total commission`,
            priceAfter: net,
        });
    }

    trace.push({
        step: 'Commission',
        description: `NET ${formatVND(net)} / (1 - ${effectiveCommission}%) = ${formatVND(gross)}`,
        priceAfter: gross,
    });

    // Step 2: Apply discounts (reverse calculation)
    let bar: number;
    let totalDiscount = 0;

    if (calcType === 'PROGRESSIVE') {
        // Progressive: BAR = gross / Π(1 - dᵢ)
        let multiplier = 1;
        effectiveDiscounts.forEach((d) => {
            multiplier *= (1 - d.percent / 100);
            totalDiscount = (1 - multiplier) * 100; // Running total
        });
        bar = gross / multiplier;

        // Add trace for each discount
        let running = gross;
        effectiveDiscounts.forEach((d) => {
            running = running / (1 - d.percent / 100);
            trace.push({
                step: d.name,
                description: `÷ (1 - ${d.percent}%) = ${formatVND(running)}`,
                priceAfter: running,
            });
        });
    } else if (calcType === 'SINGLE_DISCOUNT') {
        // Lock #1: SINGLE_DISCOUNT — only the highest discount applies
        // Future-proof: even if resolveVendorStacking already filtered to 1,
        // engine must still handle >1 discount correctly.
        totalDiscount = effectiveDiscounts.length > 0
            ? Math.max(...effectiveDiscounts.map(d => d.percent))
            : 0;

        if (totalDiscount >= 100) {
            return {
                bar: 0, barRaw: 0, net, commission, totalDiscount,
                validation: { isValid: false, errors: ['Giảm giá phải < 100%'], warnings: [] },
                trace,
            };
        }

        bar = gross / (1 - totalDiscount / 100);

        const bestDiscount = effectiveDiscounts.reduce((b, d) => d.percent > b.percent ? d : b, effectiveDiscounts[0]);
        trace.push({
            step: `${bestDiscount?.name ?? 'Discount'} (highest wins)`,
            description: `÷ (1 - ${totalDiscount}%) = ${formatVND(bar)}`,
            priceAfter: bar,
        });
    } else {
        // Additive: BAR = gross / (1 - Σdᵢ)
        totalDiscount = effectiveDiscounts.reduce((sum, d) => sum + d.percent, 0);

        if (totalDiscount >= 100) {
            return {
                bar: 0,
                barRaw: 0,
                net,
                commission,
                totalDiscount,
                validation: {
                    isValid: false,
                    errors: ['Tổng giảm giá phải < 100%'],
                    warnings: [],
                },
                trace,
            };
        }

        bar = gross / (1 - totalDiscount / 100);

        trace.push({
            step: 'Total Discounts',
            description: `÷ (1 - ${totalDiscount}%) = ${formatVND(bar)}`,
            priceAfter: bar,
        });
    }

    // Step 3: Apply rounding
    const barRaw = bar;
    switch (roundingRule) {
        case 'CEIL_1000':
            bar = Math.ceil(bar / 1000) * 1000;
            break;
        case 'ROUND_100':
            bar = Math.round(bar / 100) * 100;
            break;
        case 'NONE':
        default:
            // NONE = no rounding at all, preserve raw float
            break;
    }

    if (barRaw !== bar) {
        trace.push({
            step: 'Rounding',
            description: `${formatVND(barRaw)} → ${formatVND(bar)} (${roundingRule})`,
            priceAfter: bar,
        });
    }

    return {
        bar,
        barRaw,
        net,
        commission,
        effectiveCommission: activeBoosters.length > 0 ? effectiveCommission : undefined,
        totalDiscount,
        boosters: activeBoosters.length > 0 ? activeBoosters : undefined,
        validation,
        trace,
    };
}

/**
 * Calculate NET from BAR (reverse calculation)
 * NET = BAR × (1 - totalDiscount) × (1 - commission)
 * Returns full CalcResult with trace for UI display
 */
export function calcNetFromBar(
    bar: number,
    commission: number,     // Base % (0-100)
    discounts: DiscountItem[],
    calcType: CalcType,
    vendor: string = 'agoda',
    boosters?: CommissionBooster[]
): CalcResult {
    const trace: TraceStep[] = [];

    // V01.3: Resolve Early Bird + Last-Minute mutual exclusivity
    const { resolved: effectiveDiscounts, removed, hadConflict } = resolveTimingConflicts(discounts);
    if (hadConflict && removed) {
        trace.push({
            step: '⚠️ Không cộng dồn',
            description: `Early Bird + Last-Minute không stack → Bỏ "${removed.name}" (${removed.percent}%), giữ KM lớn hơn`,
            priceAfter: bar,
        });
    }

    // Validate inputs
    const validation = validatePromotions(effectiveDiscounts, commission, vendor);

    // If commission >= 100, return error
    if (commission >= 100) {
        return {
            bar,
            barRaw: bar,
            net: 0,
            commission,
            totalDiscount: 0,
            validation: {
                isValid: false,
                errors: ['Commission phải < 100%'],
                warnings: [],
            },
            trace: [],
        };
    }

    trace.push({
        step: 'Giá hiển thị',
        description: `BAR = ${formatVND(bar)}`,
        priceAfter: bar,
    });

    // Step 1: Calculate total discount
    let totalDiscount = 0;
    let afterDiscount: number;

    if (calcType === 'PROGRESSIVE') {
        // Progressive: afterDiscount = BAR × Π(1 - dᵢ)
        let multiplier = 1;
        let running = bar;

        effectiveDiscounts.forEach((d) => {
            const before = running;
            running = running * (1 - d.percent / 100);
            multiplier *= (1 - d.percent / 100);
            trace.push({
                step: `KM: ${d.name}`,
                description: `${formatVND(before)} × (1 - ${d.percent}%) = ${formatVND(running)}`,
                priceAfter: running,
            });
        });

        totalDiscount = (1 - multiplier) * 100;
        afterDiscount = running;
    } else if (calcType === 'SINGLE_DISCOUNT') {
        // Lock #1: SINGLE_DISCOUNT — only highest discount
        totalDiscount = effectiveDiscounts.length > 0
            ? Math.max(...effectiveDiscounts.map(d => d.percent))
            : 0;

        if (totalDiscount >= 100) {
            return {
                bar, barRaw: bar, net: 0, commission, totalDiscount,
                validation: { isValid: false, errors: ['Giảm giá phải < 100%'], warnings: [] },
                trace,
            };
        }

        afterDiscount = bar * (1 - totalDiscount / 100);
        const bestDiscount = effectiveDiscounts.reduce((b, d) => d.percent > b.percent ? d : b, effectiveDiscounts[0]);
        trace.push({
            step: `${bestDiscount?.name ?? 'KM'} (highest wins)`,
            description: `${formatVND(bar)} × (1 - ${totalDiscount.toFixed(1)}%) = ${formatVND(afterDiscount)}`,
            priceAfter: afterDiscount,
        });
    } else {
        // Additive: afterDiscount = BAR × (1 - Σdᵢ)
        totalDiscount = effectiveDiscounts.reduce((sum, d) => sum + d.percent, 0);

        if (totalDiscount >= 100) {
            return {
                bar,
                barRaw: bar,
                net: 0,
                commission,
                totalDiscount,
                validation: {
                    isValid: false,
                    errors: ['Tổng giảm giá phải < 100%'],
                    warnings: [],
                },
                trace,
            };
        }

        afterDiscount = bar * (1 - totalDiscount / 100);

        trace.push({
            step: 'Tổng KM',
            description: `${formatVND(bar)} × (1 - ${totalDiscount.toFixed(1)}%) = ${formatVND(afterDiscount)}`,
            priceAfter: afterDiscount,
        });
    }

    // V01.4: Calculate effective commission with boosters
    const { effectiveCommission, activeBoosters } = calcEffectiveCommission(commission, boosters);

    // Step 2: Subtract commission
    const commissionDecimal = effectiveCommission / 100;
    const net = afterDiscount * (1 - commissionDecimal);

    if (activeBoosters.length > 0) {
        const boosterBreakdown = activeBoosters.map(b => `${b.name} +${b.boostPct}%`).join(' + ');
        trace.push({
            step: '📊 Marketing Programs',
            description: `Base ${commission}% + ${boosterBreakdown} = ${effectiveCommission}% total commission`,
            priceAfter: afterDiscount,
        });
    }

    trace.push({
        step: 'Hoa hồng OTA',
        description: `${formatVND(afterDiscount)} × (1 - ${effectiveCommission}%) = ${formatVND(net)}`,
        priceAfter: net,
    });

    const netRounded = Math.round(net);

    trace.push({
        step: '💰 Thu về',
        description: `NET = ${formatVND(netRounded)}`,
        priceAfter: netRounded,
    });

    return {
        bar,
        barRaw: bar,
        net: netRounded,
        commission,
        effectiveCommission: activeBoosters.length > 0 ? effectiveCommission : undefined,
        totalDiscount,
        boosters: activeBoosters.length > 0 ? activeBoosters : undefined,
        validation,
        trace,
    };
}

/**
 * Format VND price with thousand separators
 */
export function formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
}

/**
 * Parse VND string back to number
 */
export function parseVND(str: string): number {
    return parseInt(str.replace(/\D/g, ''), 10) || 0;
}

/**
 * Apply guardrails to a calculated BAR price.
 * 
 * D25-D36 Locked Decisions Applied:
 * - D25: Manual override policy (enforce_guardrails_on_manual)
 * - D31: step_pct unit = 0-1 (0.2 = 20%)
 * - D32: Clamp-after-rounding
 * - D33: Min/Max = hard constraint (always wins)
 * - D34: warnings[] for manual bypass
 * - D35: MISSING_BASE = info (not primary if no change)
 * - D36: INVALID_NET = hard stop
 * 
 * Pipeline:
 *   1. Check INVALID_NET (hard stop)
 *   2. Manual bypass check
 *   3. Initial clamp (min/max)
 *   4. Step-cap (within min/max bounds)
 *   5. Re-clamp
 *   6. Rounding
 *   7. Final clamp
 */
export function applyGuardrails(
    bar: number,
    config: import('./types').GuardrailConfig
): import('./types').GuardrailResult {
    const reason_codes: import('./types').GuardrailReasonCode[] = [];
    const warnings: import('./types').GuardrailWarningCode[] = [];

    const thresholds = {
        min: config.min_rate,
        max: config.max_rate,
        max_step_pct: config.max_step_change_pct, // D31: 0.2 = 20%
    };

    // D36: INVALID_NET = hard stop (return early, no clamp)
    if (bar <= 0) {
        return {
            reason_codes: ['INVALID_NET'],
            primary_reason: 'INVALID_NET',
            warnings: [],
            before_price: bar,
            after_price: 0,
            delta_pct: -100,
            clamped: true,
            thresholds,
        };
    }

    let candidate = bar;
    const isManual = config.is_manual ?? false;
    const enforceOnManual = config.enforce_guardrails_on_manual ?? false; // D25 default

    // D25: Manual bypass check
    if (isManual && !enforceOnManual) {
        // Check violations for warnings only (D34)
        if (candidate < config.min_rate) warnings.push('OUTSIDE_MIN');
        if (candidate > config.max_rate) warnings.push('OUTSIDE_MAX');

        if (config.previous_bar != null && config.previous_bar > 0) {
            const deltaPct = Math.abs((candidate - config.previous_bar) / config.previous_bar);
            if (deltaPct > config.max_step_change_pct) {
                warnings.push('OUTSIDE_STEP');
            }
        }

        return {
            reason_codes: ['MANUAL_OVERRIDE'],
            primary_reason: 'MANUAL_OVERRIDE',
            warnings,
            before_price: bar,
            after_price: candidate, // No modification for manual bypass
            delta_pct: 0,
            clamped: false,
            thresholds,
        };
    }

    // === PIPELINE START (D33: Min/Max always wins) ===

    // Step 1: Initial clamp (D33)
    if (candidate < config.min_rate) {
        candidate = config.min_rate;
        reason_codes.push('MIN_RATE');
    }
    if (candidate > config.max_rate) {
        candidate = config.max_rate;
        reason_codes.push('MAX_RATE');
    }

    // Step 2: Step-cap (soft constraint within min/max bounds)
    if (config.previous_bar != null && config.previous_bar > 0) {
        const stepPct = config.max_step_change_pct; // D31: 0.2 = 20%
        const maxDelta = config.previous_bar * stepPct;
        const lowerBound = Math.max(config.min_rate, config.previous_bar - maxDelta);
        const upperBound = Math.min(config.max_rate, config.previous_bar + maxDelta);

        if (candidate < lowerBound) {
            candidate = lowerBound;
            if (!reason_codes.includes('STEP_CAP')) reason_codes.push('STEP_CAP');
        } else if (candidate > upperBound) {
            candidate = upperBound;
            if (!reason_codes.includes('STEP_CAP')) reason_codes.push('STEP_CAP');
        }
    } else {
        // D35: No prev_price → info only (not error)
        reason_codes.push('MISSING_BASE');
    }

    // Step 3: Re-clamp after step-cap (D33)
    if (candidate < config.min_rate) {
        candidate = config.min_rate;
        if (!reason_codes.includes('MIN_RATE')) reason_codes.push('MIN_RATE');
    }
    if (candidate > config.max_rate) {
        candidate = config.max_rate;
        if (!reason_codes.includes('MAX_RATE')) reason_codes.push('MAX_RATE');
    }

    // Step 4: Rounding
    switch (config.rounding_rule) {
        case 'CEIL_1000':
            candidate = Math.ceil(candidate / 1000) * 1000;
            break;
        case 'ROUND_100':
            candidate = Math.round(candidate / 100) * 100;
            break;
        case 'NONE':
        default:
            candidate = Math.round(candidate);
            break;
    }

    // Step 5: D32 — Final clamp after rounding
    if (candidate < config.min_rate) {
        candidate = config.min_rate;
        if (!reason_codes.includes('MIN_RATE')) reason_codes.push('MIN_RATE');
    }
    if (candidate > config.max_rate) {
        candidate = config.max_rate;
        if (!reason_codes.includes('MAX_RATE')) reason_codes.push('MAX_RATE');
    }

    // === PIPELINE END ===

    const clamped = candidate !== bar;
    const delta_pct = bar > 0 ? Math.round(((candidate - bar) / bar) * 10000) / 100 : 0;

    // D35: Determine primary_reason
    // If only MISSING_BASE and no price change → primary = PASS
    const nonInfoCodes = reason_codes.filter(c => c !== 'MISSING_BASE');
    let primary_reason: import('./types').GuardrailReasonCode;

    if (nonInfoCodes.length === 0) {
        primary_reason = 'PASS';
        // Clean up reason_codes: if only MISSING_BASE and no actual change, show PASS
        if (reason_codes.length === 1 && reason_codes[0] === 'MISSING_BASE') {
            // Keep MISSING_BASE for info, but primary is PASS
        } else if (reason_codes.length === 0) {
            reason_codes.push('PASS');
        }
    } else {
        primary_reason = nonInfoCodes[0];
    }

    return {
        reason_codes,
        primary_reason,
        warnings,
        before_price: bar,
        after_price: candidate,
        delta_pct,
        clamped,
        thresholds,
    };
}

// ════════════════════════════════════════════════════════════════════
// Phase 00: New pure functions (Dynamic Pricing by OCC)
// ARCHITECTURE RULE: All pricing math lives here or in service.ts
// Frontend must NOT compute discounts or prices.
// ════════════════════════════════════════════════════════════════════

/**
 * Lock #2: Normalize vendor/channel codes to canonical form.
 * DB may store 'booking.com', 'Booking', 'ctrip', etc.
 * Engine always works with lowercase canonical names.
 */
export function normalizeVendorCode(code: string): string {
    const VENDOR_MAP: Record<string, string> = {
        'booking.com': 'booking',
        'booking': 'booking',
        'expedia': 'expedia',
        'expedia.com': 'expedia',
        'agoda': 'agoda',
        'agoda.com': 'agoda',
        'trip.com': 'trip',
        'trip': 'trip',
        'ctrip': 'trip',
        'traveloka': 'traveloka',
    };
    const lower = code.toLowerCase().trim();
    return VENDOR_MAP[lower] ?? lower;
}

import * as fs from 'fs';
import * as path from 'path';

function logDebug(msg: string) {
    try {
        // Write to project root for easy access
        const logPath = path.resolve(process.cwd(), 'pricing-debug.log');
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {
        console.error('FAILED TO WRITE LOG:', e);
    }
}

/**
 * Resolve vendor-specific discount stacking rules.
 * Extracted from PromotionsTab.tsx to enforce single source of truth.
 *
 * Rules by vendor:
 * - booking: 3-tier exclusion (Campaign blocks ALL → Business Bookers → Normal stack)
 * - expedia: MEMBER_PLUS_ONE — Member deal stacks with best non-member; else highest wins
 * - trip.com: Additive + same-box (subcategory) dedup
 * - agoda: Progressive + subcategory dedup
 * - (default): No vendor-specific filtering
 */
export interface StackingIgnored {
    id: string;
    name: string;
    reason: string;
}

export interface StackingResult {
    resolved: DiscountItem[];
    ignored: StackingIgnored[];
    removedCount: number;
    rule: string;
}

export function resolveVendorStacking(
    vendor: string,
    discounts: DiscountItem[]
): StackingResult {
    const active = discounts.filter(d => d.percent > 0);
    const vendorNorm = normalizeVendorCode(vendor);

    // Helper: diff two arrays to find ignored items
    const findIgnored = (all: DiscountItem[], kept: DiscountItem[], reason: string): StackingIgnored[] => {
        const keptIds = new Set(kept.map(d => d.id));
        return all.filter(d => !keptIds.has(d.id)).map(d => ({ id: d.id, name: d.name, reason }));
    };

    // Helper: within a group sharing the same subcategory, keep only highest
    const dedupeBySubcategory = (items: DiscountItem[]): { kept: DiscountItem[]; dropped: StackingIgnored[] } => {
        const subcatMap = new Map<string, DiscountItem>();
        const noSubcat: DiscountItem[] = [];
        const dropped: StackingIgnored[] = [];
        for (const d of items) {
            const key = d.subCategory || '';
            if (!key) { noSubcat.push(d); continue; }
            const existing = subcatMap.get(key);
            if (!existing || d.percent > existing.percent) {
                if (existing) dropped.push({ id: existing.id, name: existing.name, reason: `Cùng nhóm "${key}" — "${d.name}" cao hơn (${d.percent}% > ${existing.percent}%)` });
                subcatMap.set(key, d);
            } else {
                dropped.push({ id: d.id, name: d.name, reason: `Cùng nhóm "${key}" — "${existing.name}" cao hơn (${existing.percent}% > ${d.percent}%)` });
            }
        }
        return { kept: [...noSubcat, ...subcatMap.values()], dropped };
    };

    // Helper: pick best from array, return best + ignored
    const pickBest = (items: DiscountItem[], reason: string): { best: DiscountItem | null; ignored: StackingIgnored[] } => {
        if (items.length === 0) return { best: null, ignored: [] };
        const best = items.reduce((b, d) => d.percent > b.percent ? d : b);
        const ignored = items.filter(d => d.id !== best.id).map(d => ({
            id: d.id, name: d.name,
            reason: `${reason} — "${best.name}" cao hơn (${best.percent}% > ${d.percent}%)`
        }));
        return { best, ignored };
    };

    // ── Booking.com: 3-branch scenario-based exclusion engine ──
    // BA confirmed rules from Partner Hub:
    //   1. Deep deals (EXCLUSIVE): "never stackable with other pricing offers such as Genius"
    //   2. Getaway/similar (ONLY_WITH_GENIUS): "can be combined with Genius, but no others"
    //   3. Normal promos: Genius + best Targeted + best Portfolio (scenario-based)
    //
    // Engine builds scenarios for ALL campaign types + no-campaign,
    // then picks the one yielding the highest effective discount (lowest displayPrice).
    if (vendorNorm === 'booking') {
        const campaigns = active.filter(d => d.group === 'CAMPAIGN');
        if (campaigns.length > 0) {
            const geniusDeals = active.filter(d => d.group === 'GENIUS');
            const portfolio = active.filter(d => d.group === 'PORTFOLIO');
            const targeted = active.filter(d => d.group === 'TARGETED');
            const { best: bestGenius } = pickBest(geniusDeals, '');
            const { best: bestPortfolio } = pickBest(portfolio, '');
            const { best: bestTargeted } = pickBest(targeted, '');

            // Helper: compute effective discount for a set of discounts (PROGRESSIVE)
            const scenarioEff = (discounts: DiscountItem[]): number => {
                if (discounts.length === 0) return 0;
                const product = discounts.reduce((acc, d) => acc * (1 - d.percent / 100), 1);
                return (1 - product) * 100;
            };

            // ── Build all scenarios ──
            type Scenario = {
                label: string;
                discounts: DiscountItem[];
                eff: number;
                blockedGroups: string[];   // Groups blocked by this scenario
                campaign?: DiscountItem;
            };

            const scenarios: Scenario[] = [];

            // Scenario 0: No campaign → Genius + Targeted + Portfolio
            const s0Discounts = [bestGenius, bestTargeted, bestPortfolio].filter(Boolean) as DiscountItem[];
            scenarios.push({
                label: 'no-campaign',
                discounts: s0Discounts,
                eff: scenarioEff(s0Discounts),
                blockedGroups: [],
            });

            // Campaign scenarios (based on stackBehavior)
            for (const c of campaigns) {
                const behavior = c.stackBehavior ?? 'EXCLUSIVE'; // Default safe = EXCLUSIVE

                if (behavior === 'EXCLUSIVE') {
                    // Deep Deal: campaign ONLY — blocks ALL including Genius
                    scenarios.push({
                        label: `exclusive:${c.name}`,
                        discounts: [c],
                        eff: c.percent,
                        blockedGroups: ['GENIUS', 'TARGETED', 'PORTFOLIO'],
                        campaign: c,
                    });
                } else if (behavior === 'ONLY_WITH_GENIUS') {
                    // Getaway: campaign + best Genius — blocks TARGETED/PORTFOLIO
                    const discounts = [c, bestGenius].filter(Boolean) as DiscountItem[];
                    scenarios.push({
                        label: `genius:${c.name}`,
                        discounts,
                        eff: scenarioEff(discounts),
                        blockedGroups: ['TARGETED', 'PORTFOLIO'],
                        campaign: c,
                    });
                }
                // STACKABLE campaigns would fall into normal stacking — rare for Booking
            }

            // Pick winning scenario (highest effective discount)
            scenarios.sort((a, b) => b.eff - a.eff);
            const winner = scenarios[0];

            // Build ignored list
            const allIgnored: { id: string; name: string; reason: string }[] = [];
            const resolvedIds = new Set(winner.discounts.map(d => d.id));

            // Ignored campaigns (not in winning scenario)
            campaigns.filter(c => !resolvedIds.has(c.id))
                .forEach(c => allIgnored.push({
                    id: c.id, name: c.name,
                    reason: winner.campaign
                        ? `Scenario "${winner.label}" (${winner.eff.toFixed(1)}%) thắng`
                        : `Scenario không campaign (${winner.eff.toFixed(1)}%) thắng`
                }));

            // Ignored genius (blocked or lower level)
            geniusDeals.filter(g => !resolvedIds.has(g.id))
                .forEach(g => {
                    const reason = winner.blockedGroups.includes('GENIUS')
                        ? `Bị chặn bởi Deep Deal "${winner.campaign!.name}" (EXCLUSIVE — không stack với Genius)`
                        : bestGenius ? `Genius: "${bestGenius.name}" có level cao hơn` : 'Genius bị loại';
                    allIgnored.push({ id: g.id, name: g.name, reason });
                });

            // Blocked targeted & portfolio
            if (winner.blockedGroups.includes('TARGETED')) {
                targeted.forEach(d => allIgnored.push({
                    id: d.id, name: d.name,
                    reason: `Bị chặn bởi Campaign "${winner.campaign!.name}" (TARGETED không stack với Campaign)`
                }));
            }
            if (winner.blockedGroups.includes('PORTFOLIO')) {
                portfolio.forEach(d => allIgnored.push({
                    id: d.id, name: d.name,
                    reason: `Bị chặn bởi Campaign "${winner.campaign!.name}" (PORTFOLIO không stack với Campaign)`
                }));
            }

            return {
                resolved: winner.discounts,
                ignored: allIgnored,
                removedCount: active.length - winner.discounts.length,
                rule: `booking: ${winner.label} (${winner.eff.toFixed(1)}%)`
            };
        }

        // Tier 2: Business Bookers blocks ALL
        const businessBookers = active.filter(d => d.subCategory === 'BUSINESS_BOOKERS');
        if (businessBookers.length > 0) {
            const kept = businessBookers[0];
            const ignored = active.filter(d => d.id !== kept.id)
                .map(d => ({ id: d.id, name: d.name, reason: `Bị chặn bởi Business Bookers "${kept.name}"` }));
            return { resolved: [kept], ignored, removedCount: active.length - 1, rule: 'booking: business_bookers exclusive' };
        }

        // Tier 3: Normal stacking — Portfolio highest + Targeted highest + Genius best
        const portfolio = active.filter(d => d.group === 'PORTFOLIO');
        const targeted = active.filter(d => d.group === 'TARGETED');
        const genius = active.filter(d => d.group === 'GENIUS');
        const other = active.filter(d =>
            d.group !== 'PORTFOLIO' && d.group !== 'TARGETED' && d.group !== 'GENIUS'
        );

        const { best: bp, ignored: pi } = pickBest(portfolio, 'Portfolio: chỉ giữ cao nhất');
        const { best: bt, ignored: ti } = pickBest(targeted, 'Targeted: chỉ giữ cao nhất (Mobile/Country không cộng dồn)');
        const { best: bg, ignored: gi } = pickBest(genius, 'Genius: chỉ giữ level cao nhất');

        const resolved = [bg, bt, bp, ...other].filter(Boolean) as DiscountItem[];
        return {
            resolved,
            ignored: [...pi, ...ti, ...gi],
            removedCount: active.length - resolved.length,
            rule: 'booking: normal stacking'
        };
    }

    // ── Expedia: Member deal stacks with best non-member; else highest wins ──
    // BA rule: Promotions only combine with Member deals (subCategory: 'MEMBER').
    // If Member exists: keep Member + best non-member (2 deals max).
    // If no Member: only highest deal wins (SINGLE_DISCOUNT).
    if (vendorNorm === 'expedia') {
        if (active.length === 0) return { resolved: [], ignored: [], removedCount: 0, rule: 'expedia: none' };

        const memberDeals = active.filter(d => d.subCategory === 'MEMBER');
        const nonMemberDeals = active.filter(d => d.subCategory !== 'MEMBER');

        if (memberDeals.length > 0) {
            // Keep best Member + best non-member
            const { best: bestMember, ignored: memberIgnored } = pickBest(memberDeals, 'Member: chỉ giữ deal cao nhất');
            const { best: bestNonMember, ignored: nonMemberIgnored } = pickBest(nonMemberDeals, 'Non-member: chỉ giữ deal cao nhất (stack với Member)');
            const resolved = [bestMember, bestNonMember].filter(Boolean) as DiscountItem[];
            return {
                resolved,
                ignored: [...memberIgnored, ...nonMemberIgnored],
                removedCount: active.length - resolved.length,
                rule: 'expedia: member_plus_one'
            };
        }

        // No member deals → only highest wins
        const { best, ignored } = pickBest(active, 'Expedia: chỉ cho phép 1 discount (không có Member)');
        return { resolved: best ? [best] : [], ignored, removedCount: active.length - 1, rule: 'expedia: single_discount (highest wins)' };
    }

    // ── Trip.com: Additive + same-box dedup ──
    if (vendorNorm === 'trip') {
        const { kept, dropped } = dedupeBySubcategory(active);
        return { resolved: kept, ignored: dropped, removedCount: active.length - kept.length, rule: 'trip.com: additive + box dedup' };
    }

    // ── Agoda: Progressive + subcategory dedup ──
    if (vendorNorm === 'agoda') {
        const { kept, dropped } = dedupeBySubcategory(active);
        return { resolved: kept, ignored: dropped, removedCount: active.length - kept.length, rule: 'agoda: progressive + subcat dedup' };
    }

    // Default: no vendor-specific filtering
    return { resolved: active, ignored: [], removedCount: 0, rule: 'default (no vendor rules)' };
}

/**
 * Compute display price (guest-facing) from BAR and effective discount.
 *
 * CRITICAL: totalDiscount is the VENDOR-SPECIFIC EFFECTIVE discount %
 * after applying calc_type rules — NOT a raw summation.
 * - PROGRESSIVE: effective% = (1 - Π(1 - dᵢ/100)) × 100
 * - ADDITIVE:    effective% = Σ dᵢ
 * - SINGLE_DISCOUNT: effective% = max(dᵢ)
 *
 * computeDisplay() does NOT know about calc_type — it receives
 * the already-resolved effective number from the caller.
 */
export function computeDisplay(bar: number, totalDiscount: number): number {
    return Math.round(bar * (1 - totalDiscount / 100));
}

/**
 * Calculate effective discount percentage from resolved discounts.
 * Uses calc_type to determine stacking mode.
 */
export function calcEffectiveDiscount(
    discounts: DiscountItem[],
    calcType: CalcType
): number {
    if (discounts.length === 0) return 0;

    if (calcType === 'SINGLE_DISCOUNT') {
        // Highest only
        return Math.max(...discounts.map(d => d.percent));
    }

    if (calcType === 'PROGRESSIVE') {
        // effective% = (1 - Π(1 - dᵢ/100)) × 100
        const multiplier = discounts.reduce((m, d) => m * (1 - d.percent / 100), 1);
        return (1 - multiplier) * 100;
    }

    // ADDITIVE: Σ dᵢ
    return discounts.reduce((sum, d) => sum + d.percent, 0);
}

/**
 * Apply OCC adjustment to NET base price.
 * Supports MULTIPLY (netBase × multiplier) and FIXED (netBase + fixedAmount).
 * Returns integer VND (rounded, as per Rev.4 Fix #4).
 */
export function applyOccAdjustment(
    netBase: number,
    adjustmentType: 'MULTIPLY' | 'FIXED',
    multiplier: number,
    fixedAmount: number
): number {
    if (adjustmentType === 'FIXED') {
        return Math.round(netBase + fixedAmount);
    }
    return Math.round(netBase * multiplier);
}

/**
 * @deprecated Use applyOccAdjustment instead. Kept for backward compatibility.
 */
export function applyOccMultiplier(netBase: number, multiplier: number): number {
    return applyOccAdjustment(netBase, 'MULTIPLY', multiplier, 0);
}

