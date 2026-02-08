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
 * Priority order:
 *   1. Raw recommendation (input)
 *   2. Step-change cap (|Δ%| > max_step_change → capped)
 *   3. Min/Max clamp (BAR < min → min, BAR > max → max)
 *   4. Rounding (CEIL_1000 / ROUND_100 / NONE)
 */
export function applyGuardrails(
    bar: number,
    config: import('./types').GuardrailConfig
): import('./types').GuardrailResult {
    let price = bar;
    let reason_code: import('./types').GuardrailReasonCode = 'PASS';
    let clamped = false;

    // Handle invalid input
    if (price <= 0) {
        return {
            reason_code: 'INVALID_NET',
            before_price: bar,
            after_price: 0,
            delta_pct: -100,
            clamped: true,
        };
    }

    // Step 1: Step-change cap
    if (config.previous_bar != null && config.previous_bar > 0) {
        const deltaPct = ((price - config.previous_bar) / config.previous_bar) * 100;
        const maxStep = config.max_step_change_pct;

        if (Math.abs(deltaPct) > maxStep) {
            const direction = deltaPct > 0 ? 1 : -1;
            price = config.previous_bar * (1 + direction * maxStep / 100);
            reason_code = 'STEP_CAP';
            clamped = true;
        }
    } else if (config.previous_bar == null) {
        // No previous price → can't check step change
        // This is OK for first-time pricing, not an error
    }

    // Step 2: Min/Max clamp
    if (price < config.min_rate) {
        price = config.min_rate;
        reason_code = 'MIN_RATE';
        clamped = true;
    } else if (price > config.max_rate) {
        price = config.max_rate;
        reason_code = 'MAX_RATE';
        clamped = true;
    }

    // Step 3: Rounding
    switch (config.rounding_rule) {
        case 'CEIL_1000':
            price = Math.ceil(price / 1000) * 1000;
            break;
        case 'ROUND_100':
            price = Math.round(price / 100) * 100;
            break;
        case 'NONE':
        default:
            price = Math.round(price);
            break;
    }

    // Final clamp after rounding (rounding could push past limits)
    if (price < config.min_rate) price = config.min_rate;
    if (price > config.max_rate) price = config.max_rate;

    const delta_pct = bar > 0 ? ((price - bar) / bar) * 100 : 0;

    return {
        reason_code,
        before_price: bar,
        after_price: price,
        delta_pct: Math.round(delta_pct * 100) / 100,
        clamped,
    };
}
