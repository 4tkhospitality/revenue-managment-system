// V01.2: Pricing Types
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

// ─── Guardrail Types (Phase 02) ──────────────────────────────
export type GuardrailReasonCode =
    | 'PASS'
    | 'STEP_CAP'
    | 'MIN_RATE'
    | 'MAX_RATE'
    | 'MISSING_BASE'
    | 'INVALID_NET';

export interface GuardrailResult {
    reason_code: GuardrailReasonCode;
    before_price: number;
    after_price: number;
    delta_pct: number;
    clamped: boolean;
}

export interface GuardrailConfig {
    min_rate: number;             // VND
    max_rate: number;             // VND
    max_step_change_pct: number;  // % (e.g. 20 = ±20%)
    previous_bar?: number;        // Last BAR for step-change comparison
    rounding_rule: 'CEIL_1000' | 'ROUND_100' | 'NONE';
}

