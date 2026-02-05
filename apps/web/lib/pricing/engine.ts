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
            bar = Math.round(bar);
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
 * Using binary search for precision
 */
export function calcNetFromBar(
    bar: number,
    commission: number,
    discounts: DiscountItem[],
    calcType: CalcType
): number {
    // Binary search to find NET that produces the target BAR
    let low = 0;
    let high = bar;
    const tolerance = 1; // VND

    for (let i = 0; i < 50; i++) {
        const mid = (low + high) / 2;
        const result = calcBarFromNet(mid, commission, discounts, calcType, 'NONE');

        if (Math.abs(result.barRaw - bar) < tolerance) {
            return Math.round(mid);
        }

        if (result.barRaw < bar) {
            low = mid;
        } else {
            high = mid;
        }
    }

    return Math.round((low + high) / 2);
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
