/**
 * i18n — Barrel Export
 *
 * Usage:
 *   import { SUPPORTED_LOCALES, formatCurrency, resolveLocale } from '@/lib/i18n';
 */

export {
    DEFAULT_LOCALE,
    LOCALE_COOKIE_MAX_AGE,
    LOCALE_COOKIE_NAME,
    localeSchema,
    currencySchema,
    timezoneSchema,
    normalizeLocale,
    SUPPORTED_LOCALES,
    type SupportedLocale,
} from './config';

export {
    formatCurrency,
    formatDate,
    formatDateTime,
    formatNumber,
    formatPercent,
} from './format';

export { resolveLocale, type LocaleContext } from './resolve-locale';

export {
    PRICING_REASONS,
    API_ERRORS,
    PIPELINE_REASONS,
    apiError,
    type PricingReasonCode,
    type ApiErrorCode,
    type PipelineReasonCode,
    type ApiErrorResponse,
    type ApiSuccessResponse,
} from './reason-codes';
