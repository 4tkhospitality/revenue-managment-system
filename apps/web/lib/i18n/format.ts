/**
 * i18n Format Utilities
 *
 * Locale-aware formatting wrappers that respect the IRON RULE:
 * Currency follows hotel.currency, NOT locale.
 * Timezone follows hotel.timezone, NOT locale.
 *
 * @see BRIEF-i18n.md §3.2
 */

import type { SupportedLocale } from './config';
import { DEFAULT_LOCALE } from './config';

// ═══════════════════════════════════════════════════
// Currency Formatting
// ═══════════════════════════════════════════════════

/**
 * Format a monetary amount using the hotel's currency but the user's locale
 * for number formatting (thousands separator, decimal).
 *
 * @example formatCurrency(1500000, 'VND', 'vi') → "1.500.000 ₫"
 * @example formatCurrency(1500000, 'VND', 'en') → "₫1,500,000"
 * @example formatCurrency(150, 'USD', 'en')     → "$150.00"
 */
export function formatCurrency(
    amount: number,
    currency: string,
    locale: SupportedLocale = DEFAULT_LOCALE
): string {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            // VND doesn't use decimals; USD does
            minimumFractionDigits: currency === 'VND' ? 0 : 2,
            maximumFractionDigits: currency === 'VND' ? 0 : 2,
        }).format(amount);
    } catch {
        // Fallback: plain number + currency code
        return `${amount.toLocaleString(locale)} ${currency}`;
    }
}

// ═══════════════════════════════════════════════════
// Number Formatting
// ═══════════════════════════════════════════════════

/**
 * Format a number according to locale conventions.
 *
 * @example formatNumber(1234567, 'vi') → "1.234.567"
 * @example formatNumber(1234567, 'en') → "1,234,567"
 */
export function formatNumber(
    value: number,
    locale: SupportedLocale = DEFAULT_LOCALE,
    options?: Intl.NumberFormatOptions
): string {
    return new Intl.NumberFormat(locale, options).format(value);
}

// ═══════════════════════════════════════════════════
// Percentage Formatting
// ═══════════════════════════════════════════════════

/**
 * Format a percentage value.
 *
 * @example formatPercent(0.85, 'vi') → "85%"
 * @example formatPercent(0.856, 'en') → "85.6%"
 */
export function formatPercent(
    value: number,
    locale: SupportedLocale = DEFAULT_LOCALE,
    maximumFractionDigits = 1
): string {
    return new Intl.NumberFormat(locale, {
        style: 'percent',
        maximumFractionDigits,
    }).format(value);
}

// ═══════════════════════════════════════════════════
// Date Formatting
// ═══════════════════════════════════════════════════

/**
 * Format a date in the hotel's timezone using the user's locale.
 *
 * IRON RULE: Timezone follows hotel.timezone, NOT locale.
 *
 * @example formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'vi') → "19/02/2026"
 * @example formatDate(new Date(), 'Asia/Bangkok', 'en')     → "2/19/2026"
 */
export function formatDate(
    date: Date | string,
    hotelTimezone: string,
    locale: SupportedLocale = DEFAULT_LOCALE,
    options?: Intl.DateTimeFormatOptions
): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
        timeZone: hotelTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        ...options,
    }).format(d);
}

/**
 * Format a date + time in the hotel's timezone.
 */
export function formatDateTime(
    date: Date | string,
    hotelTimezone: string,
    locale: SupportedLocale = DEFAULT_LOCALE
): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
        timeZone: hotelTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}
