/**
 * Locale Resolution — 5-level fallback chain
 *
 * Priority (highest → lowest):
 *   1. User.locale       (user override, explicit choice)
 *   2. Hotel.default_locale  (hotel-level override)
 *   3. Org.default_locale    (org/GSA default)
 *   4. Accept-Language       (browser header, normalized)
 *   5. "vi"                  (system default)
 *
 * @see BRIEF-i18n.md §3.5
 */

import {
    DEFAULT_LOCALE,
    normalizeLocale,
    type SupportedLocale,
} from './config';

export interface LocaleContext {
    userLocale?: string | null;
    hotelDefaultLocale?: string | null;
    orgDefaultLocale?: string | null;
    acceptLanguage?: string | null;
}

/**
 * Resolve the effective locale from a 5-level fallback chain.
 * Returns a guaranteed valid SupportedLocale.
 */
export function resolveLocale(ctx: LocaleContext): SupportedLocale {
    // Level 1: User.locale (highest priority)
    if (ctx.userLocale) {
        const normalized = normalizeLocale(ctx.userLocale);
        if (normalized) return normalized;
    }

    // Level 2: Hotel.default_locale
    if (ctx.hotelDefaultLocale) {
        const normalized = normalizeLocale(ctx.hotelDefaultLocale);
        if (normalized) return normalized;
    }

    // Level 3: Org.default_locale
    if (ctx.orgDefaultLocale) {
        const normalized = normalizeLocale(ctx.orgDefaultLocale);
        if (normalized) return normalized;
    }

    // Level 4: Accept-Language header
    if (ctx.acceptLanguage) {
        // Parse "en-US,en;q=0.9,vi;q=0.8" → try each
        const langs = ctx.acceptLanguage
            .split(',')
            .map((s) => s.split(';')[0].trim());
        for (const lang of langs) {
            const normalized = normalizeLocale(lang);
            if (normalized) return normalized;
        }
    }

    // Level 5: System default
    return DEFAULT_LOCALE;
}
