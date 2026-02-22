/**
 * Reason Codes Registry — Server-side text identifiers
 *
 * IRON RULE: Server NEVER sends display text.
 * Server sends { reason_code, params } → UI translates via t(reason_code, params)
 *
 * @see BRIEF-i18n.md §3.1
 */

// ═══════════════════════════════════════════════════════════════════
// Pricing Engine Reason Codes
// ═══════════════════════════════════════════════════════════════════

export const PRICING_REASONS = {
    // Demand-based
    HIGH_DEMAND: 'reasons.pricing.highDemand',
    LOW_DEMAND: 'reasons.pricing.lowDemand',
    MODERATE_DEMAND: 'reasons.pricing.moderateDemand',

    // Occupancy-based
    HIGH_OCCUPANCY: 'reasons.pricing.highOccupancy',
    LOW_OCCUPANCY: 'reasons.pricing.lowOccupancy',
    NEAR_SELLOUT: 'reasons.pricing.nearSellout',

    // Pace-based
    STRONG_PICKUP: 'reasons.pricing.strongPickup',
    WEAK_PICKUP: 'reasons.pricing.weakPickup',
    NO_PICKUP: 'reasons.pricing.noPickup',

    // Competitive
    ABOVE_COMPSET: 'reasons.pricing.aboveCompset',
    BELOW_COMPSET: 'reasons.pricing.belowCompset',

    // Events / Special
    EVENT_PERIOD: 'reasons.pricing.eventPeriod',
    HOLIDAY_PERIOD: 'reasons.pricing.holidayPeriod',
    WEEKEND_PREMIUM: 'reasons.pricing.weekendPremium',

    // Guardrails
    FLOOR_APPLIED: 'reasons.pricing.floorApplied',
    CEILING_APPLIED: 'reasons.pricing.ceilingApplied',
    MAX_DELTA_APPLIED: 'reasons.pricing.maxDeltaApplied',

    // Fallbacks
    NO_DATA: 'reasons.pricing.noData',
    INSUFFICIENT_HISTORY: 'reasons.pricing.insufficientHistory',
    MANUAL_OVERRIDE: 'reasons.pricing.manualOverride',
} as const;

export type PricingReasonCode = (typeof PRICING_REASONS)[keyof typeof PRICING_REASONS];

// ═══════════════════════════════════════════════════════════════════
// API Error Codes
// ═══════════════════════════════════════════════════════════════════

export const API_ERRORS = {
    // Auth
    UNAUTHORIZED: 'reasons.api.unauthorized',
    FORBIDDEN: 'reasons.api.forbidden',
    SESSION_EXPIRED: 'reasons.api.sessionExpired',

    // Validation
    INVALID_INPUT: 'reasons.api.invalidInput',
    MISSING_FIELD: 'reasons.api.missingField',
    DUPLICATE_ENTRY: 'reasons.api.duplicateEntry',

    // Resource
    NOT_FOUND: 'reasons.api.notFound',
    ALREADY_EXISTS: 'reasons.api.alreadyExists',

    // Rate limiting
    RATE_LIMITED: 'reasons.api.rateLimited',

    // Server
    INTERNAL_ERROR: 'reasons.api.internalError',
    SERVICE_UNAVAILABLE: 'reasons.api.serviceUnavailable',
} as const;

export type ApiErrorCode = (typeof API_ERRORS)[keyof typeof API_ERRORS];

// ═══════════════════════════════════════════════════════════════════
// Pipeline / Data Processing Codes
// ═══════════════════════════════════════════════════════════════════

export const PIPELINE_REASONS = {
    UPLOAD_SUCCESS: 'reasons.pipeline.uploadSuccess',
    UPLOAD_FAILED: 'reasons.pipeline.uploadFailed',
    PARSE_ERROR: 'reasons.pipeline.parseError',
    DUPLICATE_DATA: 'reasons.pipeline.duplicateData',
    PIPELINE_RUNNING: 'reasons.pipeline.running',
    PIPELINE_COMPLETE: 'reasons.pipeline.complete',
    PIPELINE_FAILED: 'reasons.pipeline.failed',
    NO_DATA_FOR_DATE: 'reasons.pipeline.noDataForDate',
} as const;

export type PipelineReasonCode = (typeof PIPELINE_REASONS)[keyof typeof PIPELINE_REASONS];

// ═══════════════════════════════════════════════════════════════════
// Standardized API Response Helper
// ═══════════════════════════════════════════════════════════════════

export interface ApiErrorResponse {
    ok: false;
    code: string;
    message_key: string;
    params?: Record<string, string | number>;
}

export interface ApiSuccessResponse<T = unknown> {
    ok: true;
    data: T;
}

/**
 * Create a standardized error response with reason code.
 *
 * @example
 *   return NextResponse.json(apiError(API_ERRORS.UNAUTHORIZED), { status: 401 })
 *   // → { ok: false, code: "UNAUTHORIZED", message_key: "reasons.api.unauthorized" }
 */
export function apiError(
    messageKey: string,
    params?: Record<string, string | number>
): ApiErrorResponse {
    return {
        ok: false,
        code: messageKey.split('.').pop() || 'UNKNOWN',
        message_key: messageKey,
        ...(params ? { params } : {}),
    };
}
