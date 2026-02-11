// V01.4: OTA Promotion Catalogs (Static)
// This is a reference for the UI - actual data comes from DB

import type { PromotionCatalogItem, PromotionGroup, CommissionBooster } from './types';

// =============================================================================
// AGODA COMMISSION BOOSTERS (Marketing Programs)
// These INCREASE effective commission (cost), not discounts
// All 3 can stack (bundle) per Agoda Partner Hub
// =============================================================================
export const AGODA_BOOSTERS: CommissionBooster[] = [
    {
        id: 'agoda-agp-basic',
        name: 'AGP Basic',
        program: 'AGP',
        boostPct: 10,
        tier: 'basic',
        enabled: false,
    },
    {
        id: 'agoda-agp-standard',
        name: 'AGP Standard',
        program: 'AGP',
        boostPct: 12,
        tier: 'standard',
        enabled: false,
    },
    {
        id: 'agoda-agp-premium',
        name: 'AGP Premium',
        program: 'AGP',
        boostPct: 15,
        tier: 'premium',
        enabled: false,
    },
    {
        id: 'agoda-agx',
        name: 'AGX (Growth Express)',
        program: 'AGX',
        boostPct: 5,
        enabled: false,
    },
    {
        id: 'agoda-sl',
        name: 'Sponsored Listing',
        program: 'SL',
        boostPct: 5,
        isVariable: true,
        enabled: false,
    },
];

// =============================================================================
// AGODA PROMOTIONS
// Stacking: Seasonal + Essential + Targeted (additive within limits)
// =============================================================================
export const AGODA_PROMOTIONS: PromotionCatalogItem[] = [
    // A) SEASONAL (max 1 per OTA)
    {
        id: 'agoda-seasonal-double-day',
        vendor: 'agoda',
        name: 'Double Day Sale',
        groupType: 'SEASONAL',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
    },
    {
        id: 'agoda-seasonal-payday',
        vendor: 'agoda',
        name: 'Payday Sale',
        groupType: 'SEASONAL',
        defaultPct: 12,
        allowStack: true,
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
    },
    {
        id: 'agoda-seasonal-night-owl',
        vendor: 'agoda',
        name: 'Night Owl Sale',
        groupType: 'SEASONAL',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
    },
    {
        id: 'agoda-seasonal-summer',
        vendor: 'agoda',
        name: 'Summer Vibes',
        groupType: 'SEASONAL',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
    },
    {
        id: 'agoda-seasonal-abroad',
        vendor: 'agoda',
        name: 'Deals Abroad',
        groupType: 'SEASONAL',
        defaultPct: 12,
        allowStack: true,
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
    },

    // B) ESSENTIAL (stackable)
    {
        id: 'agoda-essential-early-bird',
        vendor: 'agoda',
        name: 'Early Bird',
        groupType: 'ESSENTIAL',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'agoda-essential-last-minute',
        vendor: 'agoda',
        name: 'Last-Minute',
        groupType: 'ESSENTIAL',
        defaultPct: 8,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'agoda-essential-long-stay',
        vendor: 'agoda',
        name: 'Long Stay',
        groupType: 'ESSENTIAL',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'agoda-essential-occupancy',
        vendor: 'agoda',
        name: 'Occupancy Promotion',
        groupType: 'ESSENTIAL',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'agoda-essential-customized',
        vendor: 'agoda',
        name: 'Customized',
        groupType: 'ESSENTIAL',
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },

    // C) TARGETED (max 1 per subcategory)
    {
        id: 'agoda-targeted-vip-silver',
        vendor: 'agoda',
        name: 'VIP Silver',
        groupType: 'TARGETED',
        subCategory: 'LOYALTY',
        defaultPct: 5,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
    {
        id: 'agoda-targeted-vip-gold',
        vendor: 'agoda',
        name: 'VIP Gold',
        groupType: 'TARGETED',
        subCategory: 'LOYALTY',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
    {
        id: 'agoda-targeted-vip-platinum',
        vendor: 'agoda',
        name: 'VIP Platinum',
        groupType: 'TARGETED',
        subCategory: 'LOYALTY',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
    {
        id: 'agoda-targeted-mobile',
        vendor: 'agoda',
        name: 'Mobile Users',
        groupType: 'TARGETED',
        subCategory: 'PLATFORM',
        defaultPct: 8,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
    {
        id: 'agoda-targeted-geo',
        vendor: 'agoda',
        name: 'Country/Geo Target',
        groupType: 'TARGETED',
        subCategory: 'GEOGRAPHY',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
    {
        id: 'agoda-targeted-package',
        vendor: 'agoda',
        name: 'Package / Bundle',
        groupType: 'TARGETED',
        subCategory: 'PRODUCT',
        defaultPct: 12,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
    {
        id: 'agoda-targeted-beds',
        vendor: 'agoda',
        name: 'Beds Network',
        groupType: 'TARGETED',
        subCategory: 'BEDS_NETWORK',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
];

// =============================================================================
// BOOKING.COM PROMOTIONS
// Stacking: Progressive (discount on discounted price)
// Categories: PORTFOLIO + TARGETED_RATE + GENIUS + CAMPAIGN
// Rules: Max 3 discounts, TARGETED ❌ TARGETED, TARGETED ❌ CAMPAIGN
// =============================================================================

// Booking.com commission booster (Preferred Partner)
export const BOOKING_BOOSTERS: CommissionBooster[] = [
    {
        id: 'booking-preferred',
        name: 'Preferred Partner',
        program: 'PREFERRED',
        boostPct: 0,
        isVariable: true, // User nhập %
        enabled: false,
    },
];

export const BOOKING_COM_PROMOTIONS: PromotionCatalogItem[] = [
    // ─── A0) BUSINESS BOOKERS — Exclusive rate (❌ ALL) ─────────────────────
    {
        id: 'booking-business-bookers',
        vendor: 'booking',
        name: 'Business Bookers',
        groupType: 'TARGETED',
        subCategory: 'BUSINESS_BOOKERS',
        defaultPct: 10,
        allowStack: false, // Exclusive — blocks ALL other discounts
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },

    // ─── A) GENIUS — Loyalty Program (max 1 level) ────────────────────────
    {
        id: 'booking-genius-level1',
        vendor: 'booking',
        name: 'Genius Level 1',
        groupType: 'TARGETED',
        subCategory: 'GENIUS',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true, // Only 1 Genius level
    },
    {
        id: 'booking-genius-level2',
        vendor: 'booking',
        name: 'Genius Level 2',
        groupType: 'TARGETED',
        subCategory: 'GENIUS',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
    {
        id: 'booking-genius-level3',
        vendor: 'booking',
        name: 'Genius Level 3',
        groupType: 'TARGETED',
        subCategory: 'GENIUS',
        defaultPct: 20,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },

    // ─── B) TARGETED RATES — Mobile & Country (don't combine with each other) ──
    {
        id: 'booking-mobile-rate',
        vendor: 'booking',
        name: 'Mobile Rate',
        groupType: 'TARGETED',
        subCategory: 'TARGETED_RATE',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true, // Mobile OR Country, not both
    },
    {
        id: 'booking-country-rate',
        vendor: 'booking',
        name: 'Country Rate',
        groupType: 'TARGETED',
        subCategory: 'TARGETED_RATE',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true, // Mobile OR Country, not both
    },

    // ─── C) PORTFOLIO DEALS — reactive/flexible (all stack with Genius & Targeted) ──
    {
        id: 'booking-basic-deal',
        vendor: 'booking',
        name: 'Basic Deal',
        groupType: 'PORTFOLIO',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'booking-secret-deal',
        vendor: 'booking',
        name: 'Secret Deal',
        groupType: 'PORTFOLIO',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'booking-early-booker',
        vendor: 'booking',
        name: 'Early Booker Deal',
        groupType: 'PORTFOLIO',
        subCategory: 'TIMING',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true, // Early Booker OR Last Minute
    },
    {
        id: 'booking-last-minute',
        vendor: 'booking',
        name: 'Last Minute Deal',
        groupType: 'PORTFOLIO',
        subCategory: 'TIMING',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true, // Early Booker OR Last Minute
    },
    {
        id: 'booking-free-nights',
        vendor: 'booking',
        name: 'Free Nights Deal',
        groupType: 'PORTFOLIO',
        subCategory: 'FREE_NIGHTS',
        defaultPct: 25, // Stay 4 Pay 3 = 1-(3/4) = 25%
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },

    // ─── D) CAMPAIGN / NAMED SEASONAL — don't stack with Targeted Rates ──
    {
        id: 'booking-getaway-deal',
        vendor: 'booking',
        name: 'Getaway Deal',
        groupType: 'CAMPAIGN',
        defaultPct: 15,
        allowStack: false, // Campaign = exclusive promo
        maxOneInGroup: true, // Max 1 Campaign
        maxOnePerSubcategory: false,
    },
    {
        id: 'booking-late-escape',
        vendor: 'booking',
        name: 'Late Escape Deal',
        groupType: 'CAMPAIGN',
        defaultPct: 15,
        allowStack: false, // Campaign = exclusive promo
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
    },
    {
        id: 'booking-black-friday',
        vendor: 'booking',
        name: 'Black Friday Deal',
        groupType: 'CAMPAIGN',
        defaultPct: 20,
        allowStack: false, // Campaign = exclusive promo
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
    },
    {
        id: 'booking-limited-time',
        vendor: 'booking',
        name: 'Limited-time Deal',
        groupType: 'CAMPAIGN',
        defaultPct: 15,
        allowStack: false, // Campaign = exclusive promo
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
    },

    // ─── E) DEAL OF THE DAY — Exclusive promotion (❌ ALL) ──────────────────
    {
        id: 'booking-deal-of-day',
        vendor: 'booking',
        name: 'Deal of the Day',
        groupType: 'CAMPAIGN', // Same exclusive behavior as Campaign
        defaultPct: 25,
        allowStack: false, // Exclusive — blocks ALL other discounts
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
    },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Get all promotions for a vendor
export function getPromotionsByVendor(vendor: 'agoda' | 'booking'): PromotionCatalogItem[] {
    if (vendor === 'agoda') return AGODA_PROMOTIONS;
    if (vendor === 'booking') return BOOKING_COM_PROMOTIONS;
    return [];
}

// Get promotions by group for a vendor
export function getPromotionsByGroup(group: PromotionGroup, vendor?: string): PromotionCatalogItem[] {
    const all = vendor === 'booking'
        ? BOOKING_COM_PROMOTIONS
        : vendor === 'agoda'
            ? AGODA_PROMOTIONS
            : [...AGODA_PROMOTIONS, ...BOOKING_COM_PROMOTIONS];
    return all.filter(p => p.groupType === group);
}

// Get unique subcategories for a vendor
export function getTargetedSubcategories(vendor?: string): string[] {
    const promos = vendor === 'booking'
        ? BOOKING_COM_PROMOTIONS
        : vendor === 'agoda'
            ? AGODA_PROMOTIONS
            : [...AGODA_PROMOTIONS, ...BOOKING_COM_PROMOTIONS];

    const subcats = new Set<string>();
    promos
        .filter(p => p.groupType === 'TARGETED' && p.subCategory)
        .forEach(p => subcats.add(p.subCategory!));
    return Array.from(subcats);
}

// Group color mapping
export const GROUP_COLORS: Record<PromotionGroup, { bg: string; text: string; label: string }> = {
    SEASONAL: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Seasonal' },
    ESSENTIAL: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Essential' },
    TARGETED: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Targeted' },
    PORTFOLIO: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Portfolio' },
    CAMPAIGN: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Campaign' },
};

// Vendor-specific group labels
export const VENDOR_GROUP_LABELS: Record<string, Record<PromotionGroup, string>> = {
    agoda: {
        SEASONAL: 'Seasonal (Theo mùa)',
        ESSENTIAL: 'Essential (Cơ bản)',
        TARGETED: 'Targeted (Mục tiêu)',
        PORTFOLIO: 'Portfolio',
        CAMPAIGN: 'Campaign',
    },
    booking: {
        SEASONAL: 'Tactical (Thời điểm)',
        ESSENTIAL: 'Basic Deals',
        TARGETED: 'Genius & Visibility',
        PORTFOLIO: 'Portfolio Deals',
        CAMPAIGN: 'Campaign Deals',
    },
};

