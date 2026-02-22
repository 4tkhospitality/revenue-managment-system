/**
 * next-intl Request Configuration
 *
 * Cookie-based locale detection (no URL routing).
 * Runs in Edge runtime (middleware), so no DB access here.
 * The rms_locale cookie is the source for middleware;
 * it gets synced from DB on login/hotel-switch.
 *
 * @see BRIEF-i18n.md §3.5
 */
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import {
    DEFAULT_LOCALE,
    LOCALE_COOKIE_NAME,
    normalizeLocale,
    SUPPORTED_LOCALES,
} from './config';

export default getRequestConfig(async () => {
    // Read locale from cookie (set by login/hotel-switch sync)
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

    let locale = DEFAULT_LOCALE;

    if (cookieValue) {
        const normalized = normalizeLocale(cookieValue);
        if (normalized) {
            locale = normalized;
        }
    }

    return {
        locale,
        messages: (await import(`@/messages/${locale}.json`)).default,
        // Fallback to default locale messages for missing keys
        getMessageFallback: ({ key, namespace }: { key: string; namespace?: string }) => {
            const fullKey = namespace ? `${namespace}.${key}` : key;
            console.warn(`[i18n] Missing translation: "${fullKey}" for locale "${locale}"`);
            return fullKey;
        },
        onError: (error: Error) => {
            // Log missing translations for telemetry
            if (error.message.includes('MISSING_MESSAGE')) {
                console.warn(`[i18n] ${error.message}`);
            } else {
                console.error(`[i18n] Error: ${error.message}`);
            }
        },
    };
});
