// V01.3: Pricing Types (Phase 02 Update — D25-D36)
// Types for OTA Pricing calculation engine

export type CalcType = 'PROGRESSIVE' | 'ADDITIVE';
export type PromotionGroup = 'SEASONAL' | 'ESSENTIAL' | 'TARGETED';

// Input for calculation
export interface PricingInput {
    net: number;              // NET price (VND)
    commission: number;       // % (0-100)
    discounts: DiscountItem[];
    calcType: CalcType;
}

export interface DiscountItem {
    id: string;
    name: string;
    percent: number;          // % (0-100)
    group: PromotionGroup;
    subCategory?: string;     // For TARGETED
}

// Validation result
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

// Trace step for debugging
export interface TraceStep {
    step: string;
    description: string;
    priceAfter: number;
}

// Full calculation result
export interface CalcResult {
    bar: number;              // BAR price (rounded)
    barRaw: number;           // BAR price (not rounded)
    net: number;              // Input NET
    commission: number;       // Commission %
    totalDiscount: number;    // Total discount %
    validation: ValidationResult;
    trace: TraceStep[];
}

// Promotion catalog item
export interface PromotionCatalogItem {
    id: string;
    vendor: string;
    name: string;
    groupType: PromotionGroup;
    subCategory?: string;
    defaultPct?: number;
    allowStack: boolean;
    maxOneInGroup: boolean;
    maxOnePerSubcategory: boolean;
}

// Campaign instance (applied promotion)
export interface CampaignInstanceData {
    id: string;
    hotelId: string;
    otaChannelId: string;
    promoId: string;
    promoName: string;
    discountPct: number;
    isActive: boolean;
    group: PromotionGroup;
    subCategory?: string;
}

// OTA Channel config
export interface OTAChannelData {
    id: string;
    hotelId: string;
    name: string;
    code: string;
    calcType: CalcType;
    commission: number;
    isActive: boolean;
}

// Room Type data
export interface RoomTypeData {
    id: string;
    hotelId: string;
    name: string;
    description?: string;
    netPrice: number;
}

// Matrix cell (intersection of RoomType and OTAChannel)
export interface MatrixCell {
    roomTypeId: string;
    channelId: string;
    bar: number;
    net: number;
    commission: number;
    totalDiscount: number;
    validation: ValidationResult;
    trace: TraceStep[];
}

// Full matrix response from API
export interface PriceMatrixResponse {
    roomTypes: RoomTypeData[];
    channels: OTAChannelData[];
    matrix: Record<string, MatrixCell>; // key = "roomTypeId:channelId"
    calculatedAt: string;
}

// ─── Guardrail Types (Phase 02 v4 — D25-D36) ──────────────────────────────

/**
 * D28: Reason codes (array support)
 * Used for audit trail and trace
 */
export type GuardrailReasonCode =
    | 'PASS'               // No guardrail triggered
    | 'MANUAL_OVERRIDE'    // D25: Manual price set by GM
    | 'STEP_CAP'           // Step change exceeded
    | 'MIN_RATE'           // Below floor
    | 'MAX_RATE'           // Above ceiling
    | 'MISSING_BASE'       // D35: Info only, no prev price (not error)
    | 'INVALID_NET';       // D36: Hard stop (NET ≤ 0)

/**
 * D34: Warning codes for manual bypass
 * When enforce_guardrails_on_manual = false, we don't block but warn
 */
export type GuardrailWarningCode =
    | 'OUTSIDE_MIN'        // Manual price < min_rate
    | 'OUTSIDE_MAX'        // Manual price > max_rate
    | 'OUTSIDE_STEP';      // Manual price exceeds step change limit

/**
 * D28+D34+D35: Full guardrail result
 */
export interface GuardrailResult {
    reason_codes: GuardrailReasonCode[];    // D28: Array (multi-trigger support)
    primary_reason: GuardrailReasonCode;    // D35: First non-info code, or PASS
    warnings: GuardrailWarningCode[];       // D34: For manual bypass
    before_price: number;
    after_price: number;
    delta_pct: number;
    clamped: boolean;
    thresholds: {
        min?: number;
        max?: number;
        max_step_pct?: number;             // D31: 0.2 = 20%
    };
}

/**
 * D25-D31: Guardrail config
 */
export interface GuardrailConfig {
    min_rate: number;                      // VND (hotel-level, D26)
    max_rate: number;                      // VND
    max_step_change_pct: number;           // D31: 0-1 (0.2 = 20%)
    previous_bar?: number | null;          // D27: From decision_log
    rounding_rule: 'CEIL_1000' | 'ROUND_100' | 'NONE';
    // D25: Manual override policy
    is_manual?: boolean;                   // true if this is a manual override
    enforce_guardrails_on_manual?: boolean; // D25: default false
}

// Legacy single-reason result (deprecated, for backward compat)
export interface GuardrailResultLegacy {
    reason_code: GuardrailReasonCode;
    before_price: number;
    after_price: number;
    delta_pct: number;
    clamped: boolean;
}
