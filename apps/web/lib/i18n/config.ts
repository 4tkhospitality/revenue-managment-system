/**
 * i18n Configuration — Single Source of Truth
 *
 * Phase 04 ACTIVE: ["vi", "en", "th"]
 * @see BRIEF-i18n.md §3.3
 */
import { z } from 'zod';

// ═══════════════════════════════════════════════════
// Supported Locales
// ═══════════════════════════════════════════════════

export const SUPPORTED_LOCALES = ['vi', 'en', 'th', 'id', 'ms'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'vi';

// ═══════════════════════════════════════════════════
// Validation Schemas (Zod)
// ═══════════════════════════════════════════════════

export const localeSchema = z.enum(SUPPORTED_LOCALES);
export const currencySchema = z
    .string()
    .length(3)
    .transform((s) => s.toUpperCase());
export const timezoneSchema = z.string().min(1);

// ═══════════════════════════════════════════════════
// Normalize browser locale → SupportedLocale
// ═══════════════════════════════════════════════════

/**
 * Normalize a raw locale string (e.g. "en-US", "vi-VN") to the base
 * SupportedLocale, or null if unsupported.
 */
export function normalizeLocale(raw: string): SupportedLocale | null {
    const base = raw.split('-')[0].toLowerCase();
    const parsed = localeSchema.safeParse(base);
    return parsed.success ? parsed.data : null;
}

// ═══════════════════════════════════════════════════
// Cookie Config
// ═══════════════════════════════════════════════════

export const LOCALE_COOKIE_NAME = 'rms_locale';
export const LOCALE_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds
