/**
 * Rate Shopper — VND Rounding Utility
 *
 * All monetary values in Rate Shopper are VND (Decimal(14,0) — no decimals).
 * This module provides rounding functions for aggregation.
 *
 * @see spec §9.5, Key Decision #11
 */

/**
 * Round a number to the nearest integer (VND — 0 decimals).
 * Uses "round half-up" (standard banker's rounding).
 *
 * @param value - Raw numeric value (may have decimals from division)
 * @returns Integer VND amount
 */
export function roundVND(value: number): number {
    return Math.round(value);
}

/**
 * Calculate median of a sorted array of numbers.
 * For even-length arrays, averages the two middle values and rounds.
 *
 * @param sorted - Pre-sorted array of numbers (ascending)
 * @returns Median value rounded to integer
 */
export function medianVND(sorted: number[]): number | null {
    if (sorted.length === 0) return null;
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) {
        return sorted[mid];
    }
    return roundVND((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Safely extract a numeric price from a SerpApi field.
 * Returns null if the value is undefined, null, or non-numeric.
 *
 * @param value - Raw value from SerpApi (could be string "$1,234", number, or undefined)
 * @returns Integer VND or null
 */
export function extractPrice(value: unknown): number | null {
    if (value === undefined || value === null) return null;
    if (typeof value === 'number') return roundVND(value);
    if (typeof value === 'string') {
        // Remove currency symbols, commas, spaces
        const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : roundVND(num);
    }
    return null;
}
