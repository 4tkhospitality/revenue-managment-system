// V01.4: Pricing Types (Phase 02 Update — D25-D36)
// Types for OTA Pricing calculation engine

export type CalcType = 'PROGRESSIVE' | 'ADDITIVE' | 'SINGLE_DISCOUNT';
export type PromotionGroup = 'SEASONAL' | 'ESSENTIAL' | 'TARGETED' | 'GENIUS' | 'PORTFOLIO' | 'CAMPAIGN';
export type StackBehavior = 'STACKABLE' | 'HIGHEST_WINS' | 'EXCLUSIVE' | 'ONLY_WITH_GENIUS';
export type TripBox = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Marketing program types (commission boosters)
export type BoosterProgram = 'AGP' | 'AGX' | 'SL' | 'PREFERRED' | 'ACCELERATOR';

// Input for calculation
export interface PricingInput {
    net: number;              // NET price (VND)
    commission: number;       // % (0-100)
    discounts: DiscountItem[];
    calcType: CalcType;
    boosters?: CommissionBooster[];  // Marketing programs
}

export interface DiscountItem {
    id: string;
    catalogId?: string;       // Static catalog ID (e.g. 'tripcom-basic-deal') for engine lookups (tripBox, priceImpact)
    name: string;
    percent: number;          // % (0-100)
    group: PromotionGroup;
    subCategory?: string;     // For TARGETED
    stackBehavior?: StackBehavior; // From catalog: EXCLUSIVE, ONLY_WITH_GENIUS, etc.
}

// Commission booster (marketing program that increases effective commission)
export interface CommissionBooster {
    id: string;
    name: string;
    program: BoosterProgram;
    boostPct: number;         // Incremental % (0-100)
    tier?: string;            // AGP: 'basic'|'standard'|'premium'
    isVariable?: boolean;     // SL: true (user inputs %)
    enabled: boolean;
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
    commission: number;       // Base commission %
    effectiveCommission?: number; // Base + boosters %
    totalDiscount: number;    // Total discount %
    boosters?: CommissionBooster[]; // Active boosters
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
    stackBehavior?: StackBehavior;      // Engine layer: stacking rule
    tripBox?: TripBox;                  // Trip.com specific: 1-7 box group number
    displayLabel?: string;              // Optional UI label override (e.g. 'Member' for TripPlus instead of 'Targeted')
    priceImpact?: boolean;              // false = reward/coin-back, not price discount. Default true
    isFreeNights?: boolean;             // True = render Stay X / Pay Y input
    freeNightsStay?: number;            // Default Stay value (X)
    freeNightsPay?: number;             // Default Pay value (Y)
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
    // Free Nights config (on promotion instance, not campaign)
    freeNightsX?: number;               // Stay X nights
    freeNightsY?: number;               // Pay Y nights
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
    display: number;          // Guest-facing price (BAR after discounts, before commission)
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
