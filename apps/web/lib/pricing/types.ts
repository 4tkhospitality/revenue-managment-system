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
