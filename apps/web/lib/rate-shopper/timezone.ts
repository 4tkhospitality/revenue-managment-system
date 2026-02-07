/**
 * Rate Shopper — VN Timezone Helpers
 *
 * ALL date fields in Rate Shopper use string "YYYY-MM-DD" format.
 * Never use CURRENT_DATE, new Date(), or Date object for DB insertion/comparison.
 * Always use these helpers to produce string dates anchored to Asia/Ho_Chi_Minh.
 *
 * @see spec §7 (Date Correctness), Key Decision #10
 */

import { format, subDays, addDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const VN_TZ = 'Asia/Ho_Chi_Minh';

/**
 * Returns today's date as "YYYY-MM-DD" in VN timezone.
 * E.g. at UTC 2026-02-07 20:00 → VN is 2026-02-08 03:00 → returns "2026-02-08"
 */
export function getVNDate(): string {
    const vnNow = toZonedTime(new Date(), VN_TZ);
    return format(vnNow, 'yyyy-MM-dd');
}

/**
 * Returns the VN billing month as "YYYY-MM".
 * Used for tenant monthly quota tables.
 */
export function getVNMonth(): string {
    const vnNow = toZonedTime(new Date(), VN_TZ);
    return format(vnNow, 'yyyy-MM');
}

/**
 * Returns a date string N days before today in VN timezone.
 * Used for retention cleanup cutoffs.
 *
 * @example vnTodayMinus(7) → "2026-01-31" when VN today is "2026-02-07"
 */
export function vnTodayMinus(n: number): string {
    const vnNow = toZonedTime(new Date(), VN_TZ);
    return format(subDays(vnNow, n), 'yyyy-MM-dd');
}

/**
 * Returns a date string N days after today in VN timezone.
 * Used for check-in date calculation from offsets.
 *
 * @example vnTodayPlus(7) → "2026-02-14" when VN today is "2026-02-07"
 */
export function vnTodayPlus(n: number): string {
    const vnNow = toZonedTime(new Date(), VN_TZ);
    return format(addDays(vnNow, n), 'yyyy-MM-dd');
}

/**
 * Returns a VN-timezone Date object (for DateTime fields like expires_at).
 * Use this ONLY for DateTime columns — NOT for @db.Date columns.
 */
export function getVNNow(): Date {
    return toZonedTime(new Date(), VN_TZ);
}
