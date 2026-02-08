// V01.2: Pricing Calculation Engine
// Calculate BAR from NET with commission and discounts

import type { CalcType, CalcResult, DiscountItem, TraceStep, ValidationResult } from './types';
import { validatePromotions } from './validators';

/**
 * Calculate BAR (Best Available Rate) from NET
 * 
 * Progressive Mode: BAR = NET / (1 - commission) / Π(1 - dᵢ)
 * Additive Mode:    BAR = NET / (1 - commission) / (1 - Σdᵢ)
 */
export function calcBarFromNet(
    net: number,
    commission: number,     // % (0-100)
    discounts: DiscountItem[],
    calcType: CalcType,
    roundingRule: 'CEIL_1000' | 'ROUND_100' | 'NONE' = 'CEIL_1000',
    vendor: string = 'agoda'
): CalcResult {
    const trace: TraceStep[] = [];

    // Validate inputs with vendor-specific rules
    const validation = validatePromotions(discounts, commission, vendor);

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

    // Step 1: Calculate gross before discounts
    const commissionDecimal = commission / 100;
    const gross = net / (1 - commissionDecimal);

    trace.push({
        step: 'Commission',
        description: `NET ${formatVND(net)} / (1 - ${commission}%) = ${formatVND(gross)}`,
        priceAfter: gross,
    });

    // Step 2: Apply discounts (reverse calculation)
    let bar: number;
    let totalDiscount = 0;

    if (calcType === 'PROGRESSIVE') {
        // Progressive: BAR = gross / Π(1 - dᵢ)
        let multiplier = 1;
        discounts.forEach((d) => {
            multiplier *= (1 - d.percent / 100);
            totalDiscount = (1 - multiplier) * 100; // Running total
        });
        bar = gross / multiplier;

        // Add trace for each discount
        let running = gross;
        discounts.forEach((d) => {
            running = running / (1 - d.percent / 100);
            trace.push({
                step: d.name,
                description: `÷ (1 - ${d.percent}%) = ${formatVND(running)}`,
                priceAfter: running,
            });
        });
    } else {
        // Additive: BAR = gross / (1 - Σdᵢ)
        totalDiscount = discounts.reduce((sum, d) => sum + d.percent, 0);

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
        totalDiscount,
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
    commission: number,     // % (0-100)
    discounts: DiscountItem[],
    calcType: CalcType,
    vendor: string = 'agoda'
): CalcResult {
    const trace: TraceStep[] = [];

    // Validate inputs
    const validation = validatePromotions(discounts, commission, vendor);

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

        discounts.forEach((d) => {
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
    } else {
        // Additive: afterDiscount = BAR × (1 - Σdᵢ)
        totalDiscount = discounts.reduce((sum, d) => sum + d.percent, 0);

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

    // Step 2: Subtract commission
    const commissionDecimal = commission / 100;
    const net = afterDiscount * (1 - commissionDecimal);

    trace.push({
        step: 'Hoa hồng OTA',
        description: `${formatVND(afterDiscount)} × (1 - ${commission}%) = ${formatVND(net)}`,
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
        totalDiscount,
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

